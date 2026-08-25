import amqplib, { Channel } from "amqplib";
import prisma from "./prisma";
import { generateSecureToken } from "./auth";

export const REGISTRATION_QUEUE = "user_registration_queue";
export const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

let connection: any = null;
let channel: Channel | null = null;
let isConnecting = false;

// ==========================================
// 1. DEDUPLICATION TIME-WINDOW LOCK
// ==========================================
interface LockEntry {
  expiresAt: number;
  lockedAt: number;
}
const activeRegistrationLocks = new Map<string, LockEntry>();

export function acquireRegistrationLock(
  email: string,
  username: string,
  windowSeconds = 60
): { acquired: boolean; retryAfterSeconds?: number; reason?: string } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  for (const [key, entry] of activeRegistrationLocks.entries()) {
    if (now >= entry.expiresAt) activeRegistrationLocks.delete(key);
  }

  const emailKey = `lock:email:${email.toLowerCase()}`;
  const usernameKey = `lock:username:${username.toLowerCase()}`;

  const emailLock = activeRegistrationLocks.get(emailKey);
  if (emailLock && now < emailLock.expiresAt) {
    const remaining = Math.ceil((emailLock.expiresAt - now) / 1000);
    return {
      acquired: false,
      retryAfterSeconds: remaining,
      reason: `Địa chỉ email '${email}' đang được xử lý đăng ký. Vui lòng chờ ${remaining} giây trước khi thử lại.`,
    };
  }

  const usernameLock = activeRegistrationLocks.get(usernameKey);
  if (usernameLock && now < usernameLock.expiresAt) {
    const remaining = Math.ceil((usernameLock.expiresAt - now) / 1000);
    return {
      acquired: false,
      retryAfterSeconds: remaining,
      reason: `Tên đăng nhập '${username}' đang được xử lý đăng ký. Vui lòng chờ ${remaining} giây trước khi thử lại.`,
    };
  }

  const lockData: LockEntry = { lockedAt: now, expiresAt: now + windowMs };
  activeRegistrationLocks.set(emailKey, lockData);
  activeRegistrationLocks.set(usernameKey, lockData);
  return { acquired: true };
}

export function releaseRegistrationLock(email: string, username: string) {
  activeRegistrationLocks.delete(`lock:email:${email.toLowerCase()}`);
  activeRegistrationLocks.delete(`lock:username:${username.toLowerCase()}`);
}

// ==========================================
// 2. RABBITMQ CONNECTION & QUEUE MANAGEMENT
// ==========================================

export interface RegistrationJobData {
  jobId: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: string;
  language: string;
  currency: string;
  timezone: string;
  clientIp?: string;
  createdAt: number;
}

export async function initRabbitMQ(): Promise<Channel | null> {
  if (channel) return channel;
  if (isConnecting) return null;

  isConnecting = true;
  try {
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(REGISTRATION_QUEUE, { durable: true, maxPriority: 10 });
    console.log(`[RabbitMQ] Connected to ${RABBITMQ_URL} (Queue: ${REGISTRATION_QUEUE})`);
    connection.on("error", (err) => { console.warn("[RabbitMQ] Error:", err.message); channel = null; connection = null; });
    connection.on("close", () => { console.warn("[RabbitMQ] Closed. Reconnecting on demand..."); channel = null; connection = null; });
    isConnecting = false;
    return channel;
  } catch (err: any) {
    isConnecting = false;
    console.warn(`[RabbitMQ] Broker offline (${err.message}). Using synchronized worker fallback.`);
    return null;
  }
}

// ==========================================
// 3. CORE USER CREATION WORKER
// ==========================================

// Allowed roles that can be set during registration
const ALLOWED_REGISTER_ROLES = ["customer", "admin", "support", "super_admin"];

export async function executeUserCreation(job: RegistrationJobData): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const generatedApiKey = generateSecureToken(32); // Fully random 64-char hex API key

    // Validate & sanitize role (default to "customer" if invalid)
    const safeRole = ALLOWED_REGISTER_ROLES.includes(job.role) ? job.role : "customer";

    // 1. Check uniqueness: email, username, phone
    const orConditions: any[] = [
      { email: job.email },
      { username: job.username },
    ];
    if (job.phone) orConditions.push({ phone: job.phone });

    const existing = await prisma.user.findFirst({ where: { OR: orConditions } });

    if (existing) {
      if (existing.email.toLowerCase() === job.email.toLowerCase()) {
        return { success: false, error: `Email '${job.email}' đã được sử dụng bởi tài khoản khác.`, field: "email" } as any;
      }
      if (existing.username.toLowerCase() === job.username.toLowerCase()) {
        return { success: false, error: `Tên đăng nhập '${job.username}' đã được sử dụng bởi tài khoản khác.`, field: "username" } as any;
      }
      if (job.phone && existing.phone === job.phone) {
        return { success: false, error: `Số điện thoại '${job.phone}' đã được đăng ký bởi tài khoản khác.`, field: "phone" } as any;
      }
    }

    // 2. Create User Record
    const createdUser = await prisma.user.create({
      data: {
        name: job.name,
        username: job.username,
        email: job.email,
        password: job.passwordHash,
        role: safeRole,
        balance: 0,
        phone: job.phone || null,
        language: job.language || "en",
        currency: job.currency || "USD",
        timezone: job.timezone || "Asia/Ho_Chi_Minh (GMT+7)",
        apiKey: generatedApiKey,
        twoFactorEnabled: false,
        emailVerified: true,
        status: "active",
      },
    });

    return {
      success: true,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
        balance: Number(createdUser.balance),
        avatar: createdUser.avatar,
        phone: createdUser.phone,
        timezone: createdUser.timezone,
        language: createdUser.language,
        currency: createdUser.currency,
        apiKey: createdUser.apiKey,
        emailVerified: Boolean(createdUser.emailVerified),
        createdAt: createdUser.createdAt.toISOString(),
      },
    };
  } catch (err: any) {
    console.error("[Worker] User insertion error:", err);
    return { success: false, error: err.message || "Database insert error" };
  }
}

// ==========================================
// 4. PUBLISH JOB TO RABBITMQ QUEUE
// ==========================================

export async function publishRegistrationJob(job: RegistrationJobData): Promise<boolean> {
  try {
    const ch = await initRabbitMQ();
    if (!ch) return false;

    const messageBuffer = Buffer.from(JSON.stringify(job));
    return ch.sendToQueue(REGISTRATION_QUEUE, messageBuffer, {
      persistent: true,
      messageId: job.jobId,
      timestamp: job.createdAt,
      headers: { "x-dedup-email": job.email, "x-dedup-username": job.username },
    });
  } catch (err) {
    console.warn("[RabbitMQ] Publish failed, falling back to direct execution:", err);
    return false;
  }
}

// ==========================================
// 5. BACKGROUND CONSUMER
// ==========================================

export async function startRegistrationConsumer() {
  try {
    const ch = await initRabbitMQ();
    if (!ch) return;

    await ch.prefetch(5);
    console.log(`[RabbitMQ Worker] Consumer started on queue '${REGISTRATION_QUEUE}'...`);

    ch.consume(REGISTRATION_QUEUE, async (msg) => {
      if (!msg) return;
      try {
        const jobData: RegistrationJobData = JSON.parse(msg.content.toString());
        console.log(`[RabbitMQ Worker] Processing registration for '${jobData.email}' (Job: ${jobData.jobId})...`);
        const result = await executeUserCreation(jobData);
        if (result.success) {
          console.log(`[RabbitMQ Worker] User registered: ${jobData.email}`);
        } else {
          console.warn(`[RabbitMQ Worker] Job ${jobData.jobId} skipped: ${result.error}`);
        }
        ch.ack(msg);
      } catch (consumeErr) {
        console.error("[RabbitMQ Worker] Message processing error:", consumeErr);
        ch.nack(msg, false, false);
      }
    });
  } catch (e: any) {
    console.warn("[RabbitMQ Worker] Consumer initialization deferred:", e.message);
  }
}
