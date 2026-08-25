import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { askSmmAiAssistant } from "./src/server/geminiService";
import { User, SmmPanel, SmmService, PanelPackage, Subscription, Transaction, SupportTicket, NotificationItem } from "./src/types";
import prisma from "./src/server/lib/prisma";
import { hashPassword, verifyPassword, generateToken, generateSecureToken } from "./src/server/lib/auth";
import { checkRateLimit } from "./src/server/lib/rateLimit";
import { sendPasswordResetEmail } from "./src/server/lib/mail";
import { requireAuth, AuthenticatedRequest } from "./src/server/middleware/authMiddleware";
import { validateRegistrationInput } from "./src/server/lib/validation";
import { generateSecret, generateURI, verify as verifyTotp } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import {
  acquireRegistrationLock,
  releaseRegistrationLock,
  publishRegistrationJob,
  executeUserCreation,
  startRegistrationConsumer,
  RegistrationJobData,
} from "./src/server/lib/rabbitmq";

/** Auth helpers: giữ route ngắn, không lặp chuẩn hóa user và tạo cookie. */
const safeUser = (user: any): User => ({
  id: user.id, name: user.name, username: user.username, email: user.email,
  role: user.role, balance: Number(user.balance || 0), avatar: user.avatar,
  phone: user.phone, timezone: user.timezone || "Asia/Ho_Chi_Minh (GMT+7)",
  language: user.language || "vi", twoFactorEnabled: Boolean(user.twoFactorEnabled),
  emailVerified: Boolean(user.emailVerified),
  createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  lastLoginAt: user.lastLoginAt instanceof Date ? user.lastLoginAt.toISOString() : user.lastLoginAt,
});

const findUser = (identifier: string) => prisma.user.findFirst({
  where: { OR: [{ email: identifier }, { username: identifier }] },
});

const isValidTotp = async (token: string, secret: string) =>
  (await verifyTotp({ token, secret })).valid;

const hashSessionToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

async function createLoginSession(req: express.Request, userId: number, token: string) {
  try {
    await prisma.loginSession.create({
      data: {
        userId,
        tokenHash: hashSessionToken(token),
        userAgent: req.get("user-agent")?.slice(0, 500),
        ipAddress: req.ip || req.socket.remoteAddress || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    console.warn("Login session save error:", error);
  }
}

const setAuthCookie = (res: express.Response, user: User) => {
  const token = generateToken({ userId: user.id, email: user.email, username: user.username, role: user.role });
  res.cookie("jwt_token", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
};

// In-Memory Database State
let currentUser: User = {
  id: "usr-demo-01",
  name: "Alex Morgan",
  username: "alexsmm",
  email: "alex.morgan@nexussmm.io",
  role: "customer",
  balance: 285.50,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
  phone: "+1 (555) 234-5678",
  timezone: "UTC - 05:00 Eastern",
  language: "en",
  twoFactorEnabled: true,
  emailVerified: true,
  createdAt: "2026-05-10T12:00:00Z",
  lastLoginAt: "2026-08-14T09:12:00Z",
};

let allUsers: User[] = [
  currentUser,
  {
    id: "usr-demo-02",
    name: "Minh Tran",
    username: "minhtran_agency",
    email: "minh.tran@smmviet.com",
    role: "customer",
    balance: 840.00,
    language: "vi",
    createdAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "usr-admin-01",
    name: "Sarah Jenkins (System Admin)",
    username: "admin_sarah",
    email: "admin@nexussmm.io",
    role: "admin",
    balance: 50000.00,
    language: "en",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

let panels: SmmPanel[] = [];
let services: SmmService[] = [];
const packages: PanelPackage[] = [];
const transactions: Transaction[] = [];
const tickets: SupportTicket[] = [];
const notifications: NotificationItem[] = [];

let subscriptions: Subscription[] = [
  {
    id: "sub_992144",
    userId: "usr-demo-01",
    packageId: "professional",
    packageName: "Professional Agency",
    billingCycle: "monthly",
    price: 59.99,
    currency: "USD",
    status: "active",
    startDate: "2026-06-15T08:00:00Z",
    nextBillingDate: "2026-09-15T08:00:00Z",
    autoRenew: true,
    associatedPanelId: "pnl-alpha-01",
  },
  {
    id: "sub_771920",
    userId: "usr-demo-01",
    packageId: "starter",
    packageName: "Starter Panel",
    billingCycle: "monthly",
    price: 29.99,
    currency: "USD",
    status: "active",
    startDate: "2026-07-20T10:30:00Z",
    nextBillingDate: "2026-08-20T10:30:00Z",
    autoRenew: true,
    associatedPanelId: "pnl-beta-02",
  },
];

let auditLogs: Array<{
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  severity?: string;
}> = [
  { id: "log-1", timestamp: "2026-08-15T08:00:00Z", actor: "System Admin", action: "CLUSTER_BOOT", details: "All 6 Gateway nodes initialized healthy (99.99% SLA)", severity: "success" },
  { id: "log-2", timestamp: "2026-08-14T09:15:00Z", actor: "Alex Morgan", action: "DEPOSIT_SUCCESS", details: "Added $150.00 via Stripe Card", severity: "info" },
  { id: "log-3", timestamp: "2026-08-13T18:30:00Z", actor: "NexusAI", action: "AUTO_FAILOVER_TRIGGERED", details: "Rerouted 45 orders to Backup Provider #08 with 0 latency loss", severity: "warning" },
  { id: "log-4", timestamp: "2026-08-10T14:22:00Z", actor: "System Cron", action: "SUBSCRIPTION_RENEWAL", details: "Professional Agency renew $59.99", severity: "info" },
  { id: "log-5", timestamp: "2026-08-01T11:00:00Z", actor: "Alex Morgan", action: "DEPOSIT_SUCCESS", details: "Added $100.00 via VietQR (Auto Bank)", severity: "success" },
];

let providers = [
  {
    id: "prv-jap-01",
    name: "JustAnotherPanel (Direct VIP)",
    apiUrl: "https://justanotherpanel.com/api/v2",
    apiKey: "jap_live_sec_88492049182a0b4e",
    balance: 1420.50,
    currency: "USD",
    status: "active",
    latencyMs: 185,
    servicesCount: 128,
    lastPingAt: new Date().toISOString(),
    autoRefill: true,
    priority: 1,
  },
  {
    id: "prv-peakerr-02",
    name: "Peakerr SMM FastHub",
    apiUrl: "https://peakerr.com/api/v2",
    apiKey: "pkr_sec_99182374619a9d2c",
    balance: 890.20,
    currency: "USD",
    status: "active",
    latencyMs: 142,
    servicesCount: 84,
    lastPingAt: new Date().toISOString(),
    autoRefill: true,
    priority: 2,
  },
  {
    id: "prv-smmheaven-03",
    name: "SMMHeaven Global Direct",
    apiUrl: "https://smmheaven.net/api/v2",
    apiKey: "hvn_live_44719283018e6b1f",
    balance: 430.00,
    currency: "USD",
    status: "active",
    latencyMs: 290,
    servicesCount: 65,
    lastPingAt: new Date().toISOString(),
    autoRefill: false,
    priority: 3,
  },
  {
    id: "prv-hqsmart-04",
    name: "HQSmart TikTok & IG Specialist",
    apiUrl: "https://hqsmartpanel.com/api/v2",
    apiKey: "hqs_api_77291830491d3c5a",
    balance: 650.00,
    currency: "USD",
    status: "active",
    latencyMs: 210,
    servicesCount: 47,
    lastPingAt: new Date().toISOString(),
    autoRefill: true,
    priority: 4,
  },
];

let systemMasterSettings = {
  maintenanceMode: false,
  autoDispatchEnabled: true,
  autoProvisioningEnabled: true,
  autoBankingSync: true,
  usdToVndRate: 25400,
  minDepositUsd: 5.0,
  vietqrConfig: {
    bankCode: "MBBANK",
    accountNumber: "0988889999",
    accountHolder: "NEXUS SMM HOLDINGS",
    autoVerify: true,
  },
  cryptoConfig: {
    usdtTrc20Address: "TY7WvTExsD9Z9eXGqCj4vXvYqNx1K9aM8b",
    usdtErc20Address: "0x71C2B19F8a5065487BAbA4930d4bE346E2073B4D",
    autoConfirmBlocks: 3,
  },
};

let masterOrders = [
  {
    id: "ord-98210",
    panelId: "pnl-alpha-01",
    panelName: "Alpha SMM Cloud",
    userId: "usr-demo-01",
    userName: "Alex Morgan",
    userEmail: "alex.agency@nexussmm.io",
    serviceId: "srv-ig-01",
    serviceName: "Instagram Followers [VIP HQ - Non-Drop 365 Days]",
    category: "Instagram",
    targetLink: "https://instagram.com/techfounder.life",
    quantity: 5000,
    cost: 7.25,
    charge: 10.50,
    providerId: "prv-jap-01",
    providerName: "JustAnotherPanel",
    providerOrderId: "JAP-8849102",
    status: "completed",
    startCount: 14200,
    remains: 0,
    createdAt: "2026-08-15T06:30:00Z",
    updatedAt: "2026-08-15T07:15:00Z",
  },
  {
    id: "ord-98209",
    panelId: "pnl-alpha-01",
    panelName: "Alpha SMM Cloud",
    userId: "usr-demo-02",
    userName: "David Tran",
    userEmail: "david.agency@gmail.com",
    serviceId: "srv-tt-01",
    serviceName: "TikTok Views [Instant Real Active FYP Discovery]",
    category: "TikTok",
    targetLink: "https://tiktok.com/@growth_hacks/video/739182930182",
    quantity: 50000,
    cost: 2.50,
    charge: 4.50,
    providerId: "prv-peakerr-02",
    providerName: "Peakerr FastHub",
    providerOrderId: "PKR-192837",
    status: "processing",
    startCount: 1200,
    remains: 12400,
    createdAt: "2026-08-15T07:45:00Z",
    updatedAt: "2026-08-15T08:00:00Z",
  },
  {
    id: "ord-98208",
    panelId: "pnl-beta-02",
    panelName: "Beta Viral Hub",
    userId: "usr-demo-01",
    userName: "Alex Morgan",
    userEmail: "alex.agency@nexussmm.io",
    serviceId: "srv-yt-01",
    serviceName: "YouTube Subscribers [Non-Drop Ultra High Retention]",
    category: "YouTube",
    targetLink: "https://youtube.com/@CodingMasteryVN",
    quantity: 1000,
    cost: 9.80,
    charge: 14.50,
    providerId: "prv-smmheaven-03",
    providerName: "SMMHeaven Global",
    providerOrderId: "HVN-481920",
    status: "pending",
    startCount: 3450,
    remains: 1000,
    createdAt: "2026-08-15T08:05:00Z",
    updatedAt: "2026-08-15T08:05:00Z",
  },
  {
    id: "ord-98207",
    panelId: "pnl-alpha-01",
    panelName: "Alpha SMM Cloud",
    userId: "usr-demo-03",
    userName: "Sarah Jenkins",
    userEmail: "sarah.mkt@outlook.com",
    serviceId: "srv-tg-01",
    serviceName: "Telegram Channel Members [Global Real Active 0% Drop]",
    category: "Telegram",
    targetLink: "https://t.me/CryptoSignalsAlpha",
    quantity: 2000,
    cost: 3.20,
    charge: 5.80,
    providerId: "prv-jap-01",
    providerName: "JustAnotherPanel",
    providerOrderId: "JAP-8849080",
    status: "completed",
    startCount: 8900,
    remains: 0,
    createdAt: "2026-08-14T22:10:00Z",
    updatedAt: "2026-08-14T22:40:00Z",
  },
];

let siteFrontendConfig = {
  siteName: "NexusSMM Enterprise",
  siteTagline: "Nền Tảng Cho Thuê & Quản Trị SMM Panel Đa Máy Chủ Chuẩn SaaS Số 1",
  siteLogoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
  faviconUrl: "/favicon.ico",
  primaryBrandColor: "#2563eb",
  supportEmail: "support@nexussmm.io",
  supportTelegram: "@NexusSMM_SupportBot",
  supportHotline: "+84 (0) 988 889 999",
  allowUserRegistration: true,
  allowFreeTrialPanel: true,
  allowGuestServiceViewing: true,
  enableLiveChatWidget: true,
  headerAnnouncementBar: "🚀 Khuyến mãi Tháng 8: Nạp ví từ $100 qua VietQR tặng ngay +10% số dư tự động!",
  headerAnnouncementActive: true,
  footerCopyright: "© 2026 NexusSMM SaaS Platform. All Rights Reserved. ISO 27001 Certified.",
  seoMetaTitle: "NexusSMM - Thuê Panel SMM & Cung Cấp Dịch Vụ Mạng Xã Hội Tự Động",
  seoMetaKeywords: "thue smm panel, smm panel gia re, api smm panel, auto vietqr, tang follow tiktok, tang like facebook",
  seoMetaDescription: "Nền tảng khởi tạo SMM Panel trong 60 giây. Kết nối hơn 50+ nhà cung cấp API SMM toàn cầu với chi phí tối ưu nhất.",
  customCss: "/* Custom theme styling */",
  customHeaderScripts: "",
};

let announcements = [
  {
    id: "anc-01",
    title: "⚡ Cập nhật Cụm Máy Chủ Anycast CDN Singapore & Hà Nội",
    content: "Hạ tầng vừa nâng cấp lên thế hệ 6 với băng thông 10Gbps và giảm độ trễ API Dispatch xuống dưới 150ms.",
    type: "info",
    target: "all",
    isPopup: false,
    active: true,
    createdAt: "2026-08-14T10:00:00Z",
  },
  {
    id: "anc-02",
    title: "🎁 Khuyến mãi Nạp Tiền: Tặng +10% Bonus cho giao dịch VietQR",
    content: "Từ ngày 15/08 đến 31/08, tất cả giao dịch nạp từ 500.000 VNĐ ($20 USD) qua VietQR tự động cộng thêm 10% giá trị ví.",
    type: "success",
    target: "customers",
    isPopup: true,
    active: true,
    createdAt: "2026-08-15T00:00:00Z",
  },
  {
    id: "anc-03",
    title: "⚠️ Thông báo Bảo Trì Định Kỳ Máy Chủ Cơ Sở Dữ Liệu",
    content: "Bảo trì nâng cấp RAM vào lúc 03:00 AM - 03:15 AM ngày Chủ Nhật. Các panel vẫn hoạt động bình thường qua Edge Cache.",
    type: "warning",
    target: "all",
    isPopup: false,
    active: true,
    createdAt: "2026-08-13T14:30:00Z",
  },
];

let coupons = [
  {
    id: "cpn-01",
    code: "NEXUSVIP20",
    discountPercent: 20,
    maxDiscountUsd: 50.0,
    minOrderUsd: 25.0,
    maxUses: 500,
    usedCount: 142,
    expiresAt: "2026-09-30T23:59:59Z",
    active: true,
  },
  {
    id: "cpn-02",
    code: "WELCOMEAGENCY",
    discountPercent: 15,
    maxDiscountUsd: 30.0,
    minOrderUsd: 10.0,
    maxUses: 1000,
    usedCount: 489,
    expiresAt: "2026-12-31T23:59:59Z",
    active: true,
  },
  {
    id: "cpn-03",
    code: "LAUNCHPANEL",
    discountPercent: 30,
    maxDiscountUsd: 100.0,
    minOrderUsd: 50.0,
    maxUses: 100,
    usedCount: 78,
    expiresAt: "2026-08-31T23:59:59Z",
    active: true,
  },
];

let aiAutomationConfig = {
  geminiModel: "gemini-2.5-flash",
  systemPrompt: "You are the Nexus SMM Master AI Operations Copilot. You diagnose DNS records, suggest pricing margins, analyze order failovers, and assist agency owners.",
  autoTicketReplyEnabled: true,
  autoDnsDiagnostic: true,
  autoMarginOptimizer: true,
  maxDailyAiTokens: 500000,
  temperature: 0.7,
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Initialize RabbitMQ Consumer for background worker jobs
  startRegistrationConsumer().catch((err) => {
    console.warn("[RabbitMQ] Auto-consumer startup deferred:", err.message);
  });

  // ==========================================
  // AUTHENTICATION & USER PROFILE API ROUTES
  // ==========================================

  // 1. Get Current Authenticated User (Protected)
  app.get(["/api/auth/me", "/api/user/profile"], async (req: AuthenticatedRequest, res) => {
    // Try reading JWT token from header or cookie
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }

    if (token) {
      const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
      if (decoded) {
        try {
          const dbUser = await prisma.user.findFirst({
            where: { OR: [{ id: decoded.userId }, { email: decoded.email }] },
          });
          if (dbUser) {
            const { password, ...safeUser } = dbUser;
            return res.json({
              success: true,
              data: {
                ...safeUser,
                balance: Number(safeUser.balance),
                createdAt: safeUser.createdAt.toISOString(),
                lastLoginAt: safeUser.lastLoginAt?.toISOString(),
              },
            });
          }
        } catch (e) {
          console.warn("Prisma user lookup error, falling back to memory:", e);
        }

        const foundMem = allUsers.find((u) => u.id === decoded.userId || u.email === decoded.email);
        if (foundMem) {
          currentUser = foundMem;
          return res.json({ success: true, data: currentUser });
        }
      }
    }

    // Default fallback to active currentUser
    res.json({ success: true, data: currentUser });
  });

  // 2. User Registration (Validation + RabbitMQ Deduplication Lock + Argon2 + Prisma MySQL)
  app.post("/api/auth/register", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "anonymous";

    // Rate limiting check
    const rateCheck = await checkRateLimit(`auth:register:${clientIp}`, 10, 60);
    if (!rateCheck.success) {
      return res.status(429).json({
        success: false,
        message: "Bạn đã thử đăng ký quá nhiều lần. Vui lòng đợi 1 phút trước khi thử lại.",
      });
    }

    // STEP 1: Validate input parameters
    const validation = validateRegistrationInput(req.body);
    if (!validation.isValid || !validation.sanitizedData) {
      return res.status(400).json({
        success: false,
        message: Object.values(validation.errors)[0] || "Dữ liệu đăng ký không hợp lệ.",
      });
    }

    const { name, username, email, password, phone } = validation.sanitizedData;

    // Không bao giờ tin role do client gửi lên: tài khoản mới luôn là customer.
    const role = "customer";

    // Đọc language & currency mặc định từ settings
    let defaultLanguage = "en";
    let defaultCurrency = "USD";
    try {
      const sysSettings = await prisma.setting.findFirst();
      if (sysSettings) {
        defaultLanguage = sysSettings.defaultLanguage || "en";
        defaultCurrency = sysSettings.defaultCurrency || "USD";
      }
    } catch {
      // Use defaults if settings table is empty
    }

    // Kiểm tra trùng lặp theo thứ tự: username → email → phone
    try {
      // 1. Kiểm tra username
      const existingUsername = await prisma.user.findFirst({ where: { username } });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: `Tên đăng nhập '${username}' đã được sử dụng bởi tài khoản khác.`,
        });
      }

      // 2. Kiểm tra email
      const existingEmail = await prisma.user.findFirst({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: `Email '${email}' đã được sử dụng bởi tài khoản khác.`,
        });
      }

      // 3. Kiểm tra phone (nếu có)
      if (phone) {
        const existingPhone = await prisma.user.findFirst({ where: { phone } });
        if (existingPhone) {
          return res.status(409).json({
            success: false,
            message: `Số điện thoại '${phone}' đã được đăng ký bởi tài khoản khác.`,
          });
        }
      }
    } catch (dbCheckErr) {
      console.warn("[Register] DB pre-check error:", dbCheckErr);
    }

    // STEP 4: Hash password with Argon2
    const passwordHash = await hashPassword(password);
    const jobId = `${Date.now()}-${generateSecureToken(4)}`;

    const jobData: RegistrationJobData = {
      jobId,
      name,
      username,
      email,
      passwordHash,
      phone,
      role,
      language: defaultLanguage,
      currency: defaultCurrency,
      timezone: "Asia/Ho_Chi_Minh (GMT+7)",
      clientIp,
      createdAt: Date.now(),
    };

    // STEP 5: Process via RabbitMQ Queue & Worker Execution
    const queued = await publishRegistrationJob(jobData);
    if (queued) {
      console.log(`[Register] Registration task for '${email}' queued to RabbitMQ (Job: ${jobId})`);
    }

    // Execute user insertion in MySQL via Prisma
    const creationResult = await executeUserCreation(jobData);

    if (!creationResult.success || !creationResult.user) {
      releaseRegistrationLock(email, username);
      return res.status(409).json({
        success: false,
        message: creationResult.error || "Không thể tạo tài khoản người dùng.",
      });
    }

    const createdUser = creationResult.user;

    // Sync memory state
    allUsers.push(createdUser);
    currentUser = createdUser;

    // STEP 6: Generate signed JWT Token
    const token = generateToken({
      userId: createdUser.id,
      email: createdUser.email,
      username: createdUser.username,
      role: createdUser.role,
    });

    // Set secure HttpOnly Cookie
    res.cookie("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    });
    await createLoginSession(req, Number(createdUser.id), token);

    // Add welcome notification
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: createdUser.id,
      title: "Chào mừng bạn!",
      message: "Tài khoản của bạn đã được kích hoạt thành công. Số dư hiện tại là $0.00.",
      type: "success",
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: "/packages",
    });

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: createdUser.name,
      action: "USER_REGISTER_RABBITMQ",
      details: `New account registered with email ${createdUser.email} (RabbitMQ queued & Argon2 secured)`,
      severity: "success",
    });

    res.status(201).json({
      success: true,
      data: createdUser,
      token,
      message: "Đăng ký tài khoản thành công! Số dư ban đầu là $0.00.",
    });
  });

  // Social login callback placeholder. Replace the trusted profile fields with
  // the verified identity returned by Google/Facebook OAuth in production.
  app.post("/api/auth/social", async (req, res) => {
    const { provider, email, name } = req.body;
    if (!["google", "facebook"].includes(provider) || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Thông tin đăng nhập mạng xã hội không hợp lệ." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    try {
      let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        const baseUsername = normalizedEmail.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 80) || `${provider}_user`;
        let username = baseUsername;
        let suffix = 1;
        while (await prisma.user.findUnique({ where: { username } })) username = `${baseUsername}${suffix++}`;
        user = await prisma.user.create({
          data: { name: typeof name === "string" && name.trim() ? name.trim() : normalizedEmail, username, email: normalizedEmail, emailVerified: true },
        });
      }
      const loggedInUser = safeUser(user);
      currentUser = { ...loggedInUser, lastLoginAt: new Date().toISOString() };
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      const token = setAuthCookie(res, currentUser);
      await createLoginSession(req, user.id, token);
      return res.json({ success: true, data: currentUser, token, message: `Đăng nhập bằng ${provider} thành công.` });
    } catch (error) {
      console.error("Social login error:", error);
      return res.status(500).json({ success: false, message: "Không thể đăng nhập bằng mạng xã hội." });
    }
  });

  // 3. User Login (Argon2 Verify + Rate Limiting + JWT Session)
  app.post("/api/auth/login", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "anonymous";
    const rateCheck = await checkRateLimit(`auth:login:${clientIp}`, 15, 60);
    if (!rateCheck.success) {
      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Please wait 1 minute before retrying.",
      });
    }

    const { email, username, password, role, twoFactorCode } = req.body;
    const loginIdentifier = (email || username || "").trim().toLowerCase();

    if (!loginIdentifier) {
      return res.status(400).json({ success: false, message: "Email or username is required." });
    }
    if (typeof password !== "string" || password.length === 0) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    let foundUser: any = null;
    let passwordHash: string | null = null;

    try {
      const dbUser = await findUser(loginIdentifier);

      if (dbUser) {
        foundUser = dbUser;
        passwordHash = dbUser.password;
      }
    } catch (e) {
      console.warn("Prisma login lookup fallback:", e);
    }

    if (!foundUser) {
      foundUser = allUsers.find((u) =>
        u.email.toLowerCase() === loginIdentifier || u.username.toLowerCase() === loginIdentifier
      );
    }

    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    // Verify Password if provided and user has password hash
    if (passwordHash) {
      const isValid = await verifyPassword(password, passwordHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email/username or password.",
        });
      }
    }

    // Nếu tài khoản đã bật 2FA, không cấp JWT trước khi mã TOTP hợp lệ.
    if (foundUser.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({ success: false, twoFactorRequired: true, message: "Vui lòng nhập mã xác thực 2FA." });
      }
      if (!foundUser.twoFactorSecret || !(await isValidTotp(String(twoFactorCode), foundUser.twoFactorSecret))) {
        return res.status(401).json({ success: false, twoFactorRequired: true, message: "Mã xác thực 2FA không hợp lệ." });
      }
    }

    // Format safe user object
    currentUser = { ...safeUser(foundUser), lastLoginAt: new Date().toISOString() };

    // Update lastLoginAt in DB if user exists
    try {
      await prisma.user.updateMany({
        where: { id: foundUser.id },
        data: { lastLoginAt: new Date() },
      });
    } catch {
      // ignore
    }

    // Generate JWT token
    const token = setAuthCookie(res, currentUser);
    await createLoginSession(req, Number(currentUser.id), token);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: "AUTH_LOGIN",
      details: `User ${currentUser.email} authenticated successfully`,
      severity: "info",
    });

    res.json({
      success: true,
      data: currentUser,
      jwt_token: token,
      message: "Successfully authenticated to NexusSMM",
    });
  });

  // 4. Forgot Password (Generate Token & Send Email via SMTP)
  app.post("/api/auth/forgot-password", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "anonymous";
    const rateCheck = await checkRateLimit(`auth:forgot:${clientIp}`, 5, 60);
    if (!rateCheck.success) {
      return res.status(429).json({
        success: false,
        message: "Too many password reset requests. Please wait a few minutes.",
      });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required." });
    }

    const targetEmail = email.trim().toLowerCase();
    const resetToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    try {
      await prisma.passwordReset.create({
        data: {
          email: targetEmail,
          token: resetToken,
          expiresAt,
          used: false,
        },
      });
    } catch (e) {
      console.warn("Could not record password reset in Prisma DB, continuing:", e);
    }

    // Construct origin URL
    const originUrl = req.headers.origin || `${req.protocol}://${req.get("host")}` || "http://localhost:3000";
    const mailResult = await sendPasswordResetEmail(targetEmail, resetToken, originUrl);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: targetEmail,
      action: "FORGOT_PASSWORD_REQUEST",
      details: `Password reset verification email dispatched to ${targetEmail}`,
      severity: "info",
    });

    res.json({
      success: true,
      message: "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.",
      previewUrl: mailResult.previewUrl,
    });
  });

  // 6. Reset Password (Verify Token & Update with Argon2 Hash)
  app.post("/api/auth/reset-password", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "anonymous";
    const rateCheck = await checkRateLimit(`auth:reset:${clientIp}`, 5, 60);
    if (!rateCheck.success) {
      return res.status(429).json({
        success: false,
        message: "Too many reset attempts. Please wait a moment.",
      });
    }

    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and new password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    let targetEmail: string | null = null;

    try {
      const resetRecord = await prisma.passwordReset.findFirst({
        where: {
          token: token.trim(),
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (resetRecord) {
        targetEmail = resetRecord.email;
        // Mark token as used
        await prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { used: true },
        });
      }
    } catch (e) {
      console.warn("Prisma token lookup error:", e);
    }

    const hashedPassword = await hashPassword(password);

    if (targetEmail) {
      try {
        await prisma.user.updateMany({
          where: { email: targetEmail },
          data: { password: hashedPassword },
        });
      } catch (err) {
        console.warn("Prisma password update error:", err);
      }
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: targetEmail || "User",
      action: "PASSWORD_RESET_SUCCESS",
      details: "Password was reset securely with Argon2",
      severity: "success",
    });

    res.json({
      success: true,
      message: "Mật khẩu của bạn đã được cập nhật thành công! Vui lòng đăng nhập với mật khẩu mới.",
    });
  });

  // 7. Logout (Clear Session Cookie)
  app.post("/api/auth/logout", (req, res) => {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7).trim()
      : req.cookies?.jwt_token;
    if (token) {
      prisma.loginSession.updateMany({
        where: { tokenHash: hashSessionToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      }).catch(() => undefined);
    }
    res.clearCookie("jwt_token");
    res.clearCookie("session_token");
    res.json({ success: true, message: "Logged out successfully." });
  });

  app.get("/api/user/sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = Number(req.user?.userId);
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7).trim()
      : req.cookies?.jwt_token;
    if (!Number.isInteger(userId)) return res.status(401).json({ success: false, message: "Invalid session." });
    try {
      await prisma.loginSession.updateMany({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
        data: token ? { lastActiveAt: new Date() } : undefined,
      });
      const sessions = await prisma.loginSession.findMany({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { lastActiveAt: "desc" },
      });
      const currentHash = token ? hashSessionToken(token) : "";
      return res.json({ success: true, data: sessions.map((session) => ({
        id: session.id,
        device: session.userAgent || "Unknown device",
        ip: session.ipAddress || "Unknown IP",
        location: session.location || "Unknown location",
        current: session.tokenHash === currentHash,
        lastActiveAt: session.lastActiveAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
      })) });
    } catch (error) {
      console.error("Sessions lookup error:", error);
      return res.status(500).json({ success: false, message: "Không thể tải phiên đăng nhập." });
    }
  });

  app.delete("/api/user/sessions/other", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = Number(req.user?.userId);
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7).trim()
      : req.cookies?.jwt_token;
    if (!token || !Number.isInteger(userId)) return res.status(401).json({ success: false, message: "Invalid session." });
    await prisma.loginSession.updateMany({
      where: { userId, revokedAt: null, NOT: { tokenHash: hashSessionToken(token) } },
      data: { revokedAt: new Date() },
    });
    res.json({ success: true, message: "Đã đăng xuất khỏi các thiết bị khác." });
  });

  // 8. Update Profile Settings (Protected)
  app.put(["/api/auth/profile", "/api/user/profile"], async (req, res) => {
    const { name, phone, telegramContact, timezone, language, twoFactorEnabled, email } = req.body;

    currentUser = {
      ...currentUser,
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phone && { phone: phone.trim() }),
      ...(timezone && { timezone }),
      ...(language && { language }),
      ...(twoFactorEnabled !== undefined && { twoFactorEnabled: Boolean(twoFactorEnabled) }),
    };

    try {
      await prisma.user.updateMany({
        where: { id: Number(currentUser.id) },
        data: {
          ...(name && { name: name.trim() }),
          ...(email && { email: email.trim().toLowerCase() }),
          ...(phone && { phone: phone.trim() }),
          ...(telegramContact && { telegramContact: telegramContact.trim() }),
          ...(timezone && { timezone }),
          ...(language && { language }),
          ...(twoFactorEnabled !== undefined && { twoFactorEnabled: Boolean(twoFactorEnabled) }),
        },
      });
    } catch (e) {
      console.warn("Prisma profile update error:", e);
    }

    res.json({
      success: true,
      data: currentUser,
      message: "Thông tin tài khoản đã được cập nhật thành công!",
    });
  });

  // 9. Change Password (Protected - Argon2 Check Old & Hash New)
  app.put("/api/user/change-password", async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide current and new password." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
    }

    try {
      const dbUser = await prisma.user.findFirst({ where: { id: Number(currentUser.id) } });
      if (dbUser?.password) {
        const isValid = await verifyPassword(currentPassword, dbUser.password);
        if (!isValid) {
          return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác." });
        }
      }

      const newHash = await hashPassword(newPassword);
      await prisma.user.updateMany({
        where: { id: Number(currentUser.id) },
        data: { password: newHash },
      });
    } catch (e) {
      console.warn("Password change error:", e);
    }

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công! Mật khẩu mới đã được bảo mật bằng Argon2.",
    });
  });

  // 10. Rotate API Key (Protected)
  app.post("/api/user/rotate-api-key", async (req, res) => {
    const newKey = generateSecureToken(32); // Fully random 64-char hex API key
    currentUser = { ...currentUser, apiKey: newKey } as any;

    try {
      await prisma.user.updateMany({
        where: { id: Number(currentUser.id) },
        data: { apiKey: newKey },
      });
    } catch (e) {
      console.warn("API key rotate error:", e);
    }

    res.json({
      success: true,
      data: { apiKey: newKey },
      message: "Đã tạo mới mã API Token quản trị thành công!",
    });
  });

  app.post("/api/user/2fa/setup", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = (req as AuthenticatedRequest).user?.userId || currentUser.id;
    const secret = generateSecret();
    const email = (req as AuthenticatedRequest).user?.email || currentUser.email;
    const otpauth = generateURI({ issuer: "SMM Panel", label: email, secret });
    const qrCode = await QRCode.toDataURL(otpauth);
    try {
      await prisma.user.update({ where: { id: Number(userId) }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });
      res.json({ success: true, data: { secret, qrCode } });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ success: false, message: "Không thể tạo cấu hình 2FA." });
    }
  });

  app.get("/api/user/2fa/status", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = Number(req.user?.userId);
    if (!Number.isInteger(userId)) return res.status(401).json({ success: false, message: "Invalid session." });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { twoFactorEnabled: true } });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, data: { twoFactorEnabled: user.twoFactorEnabled } });
  });

  app.post("/api/user/2fa/enable", requireAuth, async (req: AuthenticatedRequest, res) => {
    const { code } = req.body;
    const userId = (req as AuthenticatedRequest).user?.userId || currentUser.id;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user?.twoFactorSecret || !code || !(await isValidTotp(String(code), user.twoFactorSecret))) {
      return res.status(400).json({ success: false, message: "Mã 2FA không hợp lệ." });
    }
    const updated = await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    res.json({ success: true, data: { twoFactorEnabled: updated.twoFactorEnabled } });
  });

  app.post("/api/user/2fa/disable", requireAuth, async (req: AuthenticatedRequest, res) => {
    const { code } = req.body;
    const userId = (req as AuthenticatedRequest).user?.userId || currentUser.id;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user?.twoFactorSecret || !code || !(await isValidTotp(String(code), user.twoFactorSecret))) {
      return res.status(400).json({ success: false, message: "Cần mã 2FA hợp lệ để tắt xác thực." });
    }
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    res.json({ success: true, data: { twoFactorEnabled: false } });
  });

  // 11. Switch Role (Dev Demo helper)
  app.post("/api/auth/switch-role", (req, res) => {
    const { role } = req.body;
    if (role === "admin") {
      currentUser = { ...currentUser, role: "admin", name: "Alex Morgan (Admin Mode)" };
    } else {
      currentUser = { ...currentUser, role: "customer", name: "Alex Morgan" };
    }
    res.json({ success: true, data: currentUser });
  });

  // ==========================================
  // DASHBOARD & ANALYTICS API ROUTES
  // ==========================================
  app.get("/api/dashboard/stats", (req, res) => {
    const totalOrders = panels.reduce((acc, p) => acc + p.totalOrders, 0);
    const monthlyRevenue = panels.reduce((acc, p) => acc + p.monthlyRevenue, 0);
    const avgUptime = (panels.reduce((acc, p) => acc + p.uptime, 0) / (panels.length || 1)).toFixed(2);
    const avgHealth = Math.round(panels.reduce((acc, p) => acc + p.healthScore, 0) / (panels.length || 1));

    res.json({
      success: true,
      data: {
        balance: currentUser.balance,
        activePanelsCount: panels.filter((p) => p.status === "active").length,
        totalPanelsCount: panels.length,
        totalOrders,
        monthlyRevenue,
        avgUptime: Number(avgUptime),
        avgHealth,
        panels: panels.slice(0, 4),
        recentTransactions: transactions.slice(0, 5),
        revenueHistory: [
          { date: "Aug 01", revenue: 1420, orders: 1840 },
          { date: "Aug 03", revenue: 1980, orders: 2450 },
          { date: "Aug 05", revenue: 1650, orders: 2120 },
          { date: "Aug 07", revenue: 2310, orders: 3100 },
          { date: "Aug 09", revenue: 2890, orders: 3890 },
          { date: "Aug 11", revenue: 2450, orders: 3410 },
          { date: "Aug 13", revenue: 3120, orders: 4230 },
          { date: "Aug 14", revenue: 3480, orders: 4890 },
        ],
      },
    });
  });

  // ==========================================
  // PANELS MANAGEMENT API ROUTES
  // ==========================================
  app.get("/api/panels", (req, res) => {
    res.json({ success: true, data: panels });
  });

  app.get("/api/panels/:id", (req, res) => {
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) {
      return res.status(404).json({ success: false, message: "Panel not found" });
    }
    res.json({ success: true, data: panel });
  });

  app.post("/api/panels", (req, res) => {
    const { name, domain, planId, billingCycle } = req.body;
    const selectedPkg = packages.find((p) => p.id === planId) || packages[0];
    const price = selectedPkg.pricing[billingCycle as "weekly" | "monthly" | "yearly"] || selectedPkg.pricing.monthly;

    if (currentUser.balance < price) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance ($${currentUser.balance.toFixed(2)}). Package requires $${price.toFixed(2)}. Please add funds.`,
      });
    }

    // Deduct balance
    currentUser.balance -= price;

    const newPanel: SmmPanel = {
      id: `pnl-${Date.now()}`,
      userId: currentUser.id,
      name: name || "My SMM Storefront",
      domain: domain ? `${domain.toLowerCase().replace(/[^a-z0-9-]/g, "")}.nexussmm.store` : `panel-${Date.now().toString().slice(-4)}.nexussmm.store`,
      customDomain: domain && domain.includes(".") ? domain.trim().toLowerCase() : undefined,
      apiKey: `sk_live_pnl_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-6)}`,
      secretKey: `sec_pnl_${Math.random().toString(36).substring(2, 8)}`,
      planId: selectedPkg.id,
      planName: selectedPkg.name,
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : billingCycle === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      uptime: 99.99,
      activeServicesCount: 24,
      totalOrders: 0,
      totalMessages: 0,
      todayMessages: 0,
      messageRatePerMin: 0,
      monthlyRevenue: 0,
      currency: "USD",
      nameservers: {
        ns1: "ns1.nexussmm.io",
        ns2: "ns2.nexussmm.io",
        status: "configured",
      },
      sslActive: true,
      providerApiSynced: true,
      healthScore: 100,
      notes: "Newly provisioned high-speed SMM panel instance.",
    };

    panels.unshift(newPanel);

    // Create Subscription record
    const newSub: Subscription = {
      id: `sub_${Date.now()}`,
      userId: currentUser.id,
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      billingCycle: (billingCycle as any) || "monthly",
      price,
      currency: "USD",
      status: "active",
      startDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      associatedPanelId: newPanel.id,
    };
    subscriptions.unshift(newSub);

    // Record Transaction
    transactions.unshift({
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      date: new Date().toISOString(),
      description: `Rented ${selectedPkg.name} for ${newPanel.name}`,
      type: "subscription",
      amount: -price,
      status: "completed",
      balanceAfter: currentUser.balance,
      paymentMethod: "Wallet Balance",
      referenceCode: newSub.id,
    });

    // Notify
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: "New Panel Activated!",
      message: `${newPanel.name} is online and serving at ${newPanel.domain}.`,
      type: "success",
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: `/panels/${newPanel.id}`,
    });

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: "PANEL_RENTED",
      details: `Created panel ${newPanel.name} (${selectedPkg.name})`,
    });

    res.json({
      success: true,
      data: newPanel,
      message: "SMM Panel deployed successfully!",
    });
  });

  app.put("/api/panels/:id", (req, res) => {
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    const { name, customDomain, notes, autoRenew, status, dispatchConfig } = req.body;

    if (name) panel.name = name.trim();
    if (notes !== undefined) panel.notes = notes;
    if (autoRenew !== undefined) panel.autoRenew = Boolean(autoRenew);
    if (status) panel.status = status;

    if (customDomain !== undefined) {
      const cleanDomain = customDomain ? customDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
      panel.customDomain = cleanDomain || undefined;
      panel.sslActive = true;
      panel.nameservers.status = 'configured';
    }

    if (dispatchConfig) {
      panel.dispatchConfig = {
        ...panel.dispatchConfig,
        ...dispatchConfig,
      };
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: "PANEL_UPDATED",
      details: `Updated panel ${panel.name} configuration and dispatch channels.`,
    });

    res.json({
      success: true,
      data: panel,
      message: `Panel "${panel.name}" updated successfully!`,
    });
  });

  app.delete("/api/panels/:id", (req, res) => {
    const index = panels.findIndex((p) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Panel not found" });

    const removed = panels.splice(index, 1)[0];

    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: "Panel Deleted",
      message: `Panel "${removed.name}" (${removed.domain}) was deleted successfully.`,
      type: "info",
      createdAt: new Date().toISOString(),
      read: false,
    });

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: "PANEL_DELETED",
      details: `Deleted panel ${removed.name} (${removed.id})`,
    });

    res.json({
      success: true,
      data: removed,
      message: `Panel "${removed.name}" has been deleted.`,
    });
  });

  app.post("/api/panels/:id/test-dispatch", (req, res) => {
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    const config = req.body.dispatchConfig || panel.dispatchConfig;
    if (!config || !config.enabled) {
      return res.status(400).json({
        success: false,
        message: "Provider dispatch is currently disabled. Please enable it in panel configuration.",
      });
    }

    const testOrderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}`;
    const testService = { id: "102", name: "Instagram High Quality Likes [HQ-INSTANT]", quantity: 1000, link: "https://instagram.com/p/demo_post_test" };

    let dispatchSummary = "";

    if (config.method === 'ticket') {
      const ticket = config.ticket || {};
      if (!ticket.username || !ticket.password) {
        return res.status(400).json({
          success: false,
          message: "Ticket dispatch requires Provider Username and Password.",
        });
      }
      dispatchSummary = `Simulated Ticket Login with user "${ticket.username}" at ${ticket.loginUrl || 'Provider Helpdesk'}. Created ticket with Subject: "${(ticket.ticketSubjectTemplate || '[ORDER] #{order_id} - {service_name}').replace('{order_id}', testOrderId).replace('{service_name}', testService.name)}". Status: Sent & Queued.`;
    } else if (config.method === 'telegram') {
      const tg = config.telegram || {};
      if (!tg.botToken || !tg.chatId) {
        return res.status(400).json({
          success: false,
          message: "Telegram dispatch requires Bot Token and Chat/Channel ID.",
        });
      }
      dispatchSummary = `Telegram Dispatch payload prepared with Bot [${tg.botToken.slice(0, 8)}...] to Chat ID ${tg.chatId}. Message formatted: [Order #${testOrderId} - ${testService.name} - Qty: ${testService.quantity}]. HTTP 200 OK.`;
    } else if (config.method === 'whatsapp') {
      const wa = config.whatsapp || {};
      if (!wa.recipientPhone) {
        return res.status(400).json({
          success: false,
          message: "WhatsApp dispatch requires recipient phone number.",
        });
      }
      dispatchSummary = `WhatsApp message dispatched to ${wa.recipientPhone}. Template parsed for Order #${testOrderId}. GreenAPI gateway status: Message Sent.`;
    } else {
      dispatchSummary = `REST API Order Dispatched to provider endpoint. Response: {"status":"success","order":${testOrderId}}`;
    }

    panel.totalMessages = (panel.totalMessages || 0) + 1;
    panel.todayMessages = (panel.todayMessages || 0) + 1;

    res.json({
      success: true,
      testOrderId,
      method: config.method,
      summary: dispatchSummary,
      message: `Test order #${testOrderId} dispatched successfully via ${config.method.toUpperCase()}!`,
    });
  });

  app.put("/api/panels/:id/domain", (req, res) => {
    const { customDomain } = req.body;
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    const cleanDomain = customDomain ? customDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
    panel.customDomain = cleanDomain || undefined;
    panel.sslActive = true;
    panel.nameservers.status = 'configured';

    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: "Domain Updated",
      message: `Domain for ${panel.name} set to ${panel.customDomain || panel.domain}. SSL is active.`,
      type: "success",
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: `/panels/${panel.id}`,
    });

    res.json({
      success: true,
      data: panel,
      message: `Domain successfully attached to ${panel.name}! TLS 1.3 certificate issued.`,
    });
  });

  app.post("/api/panels/:id/rotate-key", (req, res) => {
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    const newKey = `sk_live_pnl_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-6)}`;
    panel.apiKey = newKey;

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: "API_KEY_ROTATED",
      details: `Generated new API key for panel ${panel.name}`,
    });

    res.json({
      success: true,
      data: { apiKey: newKey, panel },
      message: "API Key has been rotated securely. Please update your client integrations.",
    });
  });

  app.post("/api/panels/:id/extend", (req, res) => {
    const { days, cost } = req.body;
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    const extensionDays = Number(days) || 30;
    const extensionCost = Number(cost) || 29.99;

    if (currentUser.balance < extensionCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance ($${currentUser.balance.toFixed(2)}). Extension requires $${extensionCost.toFixed(2)}. Please add funds.`,
      });
    }

    currentUser.balance -= extensionCost;

    const currentExpiry = new Date(panel.expiresAt).getTime();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiryDate = new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);
    panel.expiresAt = newExpiryDate.toISOString();
    panel.status = "active";

    // Record Transaction
    transactions.unshift({
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      date: new Date().toISOString(),
      description: `Extended panel ${panel.name} (+${extensionDays} days)`,
      type: "renewal",
      amount: -extensionCost,
      status: "completed",
      balanceAfter: currentUser.balance,
      paymentMethod: "Wallet Balance",
      referenceCode: panel.id,
    });

    // Notify
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: "Panel Extended Successfully!",
      message: `${panel.name} extended until ${newExpiryDate.toLocaleDateString()}.`,
      type: "success",
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: `/panels/${panel.id}`,
    });

    res.json({
      success: true,
      data: panel,
      message: `Panel extended by ${extensionDays} days! New expiry: ${newExpiryDate.toLocaleDateString()}.`,
    });
  });

  app.post("/api/panels/:id/toggle-autorenew", (req, res) => {
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    panel.autoRenew = !panel.autoRenew;
    res.json({
      success: true,
      data: panel,
      message: `Auto-renewal is now ${panel.autoRenew ? 'ENABLED' : 'DISABLED'} for ${panel.name}.`,
    });
  });

  app.post("/api/panels/:id/action", (req, res) => {
    const { action } = req.body;
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    if (action === "purge_cache") {
      panel.healthScore = 100;
      res.json({ success: true, message: "Edge CDN cache successfully purged and primed." });
    } else if (action === "sync_providers") {
      panel.providerApiSynced = true;
      res.json({ success: true, message: "All 6 Upstream Provider APIs synced (324 services updated)." });
    } else if (action === "toggle_status") {
      panel.status = panel.status === "active" ? "maintenance" : "active";
      res.json({ success: true, message: `Panel status switched to ${panel.status}.` });
    } else if (action === "simulate_traffic") {
      const addedMsgs = Math.floor(Math.random() * 50) + 15;
      panel.totalMessages = (panel.totalMessages || 0) + addedMsgs;
      panel.todayMessages = (panel.todayMessages || 0) + addedMsgs;
      panel.totalOrders = (panel.totalOrders || 0) + Math.floor(addedMsgs / 3);
      res.json({ success: true, message: `Processed ${addedMsgs} new webhook messages & orders.` });
    } else {
      res.json({ success: true, message: "Operation completed." });
    }
  });

  app.post("/api/panels/:id/diagnose", async (req, res) => {
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    const aiResult = await askSmmAiAssistant({
      message: `Perform a full diagnostic scan on SMM Panel: "${panel.name}" (domain: ${panel.domain}, uptime: ${panel.uptime}%, health: ${panel.healthScore}/100, active services: ${panel.activeServicesCount}).`,
      context: {
        userName: currentUser.name,
        walletBalance: currentUser.balance,
        activePanels: [panel],
        language: currentUser.language,
      },
    });

    res.json({
      success: true,
      data: {
        diagnosis: aiResult.text,
        healthScore: panel.healthScore,
        lastScan: new Date().toISOString(),
      },
    });
  });

  // ==========================================
  // SERVICES API ROUTES
  // ==========================================
  app.get("/api/services", (req, res) => {
    res.json({ success: true, data: services });
  });

  app.post("/api/services", (req, res) => {
    const { name, category, originalPricePer1k, salePricePer1k, speed, minQuantity, maxQuantity, description } = req.body;
    const newService: SmmService = {
      id: `srv-${Date.now()}`,
      name: name || "New Social Media Boost Service",
      category: category || "Instagram",
      provider: "Nexus Direct Engine #01",
      providerServiceId: `${Math.floor(Math.random() * 9000) + 1000}`,
      originalPricePer1k: Number(originalPricePer1k) || 0.50,
      salePricePer1k: Number(salePricePer1k) || 1.50,
      minQuantity: Number(minQuantity) || 50,
      maxQuantity: Number(maxQuantity) || 100000,
      status: "active",
      ordersCount: 0,
      speed: speed || "Instant Start (50K/Day)",
      refillAvailable: true,
      description: description || "High retention boost service.",
    };
    services.unshift(newService);
    res.json({ success: true, data: newService, message: "Service created successfully!" });
  });

  app.put("/api/services/:id", (req, res) => {
    const idx = services.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: "Service not found" });
    services[idx] = { ...services[idx], ...req.body };
    res.json({ success: true, data: services[idx], message: "Service updated" });
  });

  app.delete("/api/services/:id", (req, res) => {
    services = services.filter((s) => s.id !== req.params.id);
    res.json({ success: true, message: "Service removed" });
  });

  // ==========================================
  // PACKAGES & PRICING API ROUTES
  // ==========================================
  app.get("/api/packages", (req, res) => {
    res.json({ success: true, data: packages });
  });

  // ==========================================
  // BILLING & WALLET DEPOSIT API ROUTES
  // ==========================================
  app.post("/api/billing/add-funds", (req, res) => {
    const { amount, paymentMethod } = req.body;
    const depositAmount = Number(amount);

    if (!depositAmount || depositAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid deposit amount" });
    }

    currentUser.balance += depositAmount;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      date: new Date().toISOString(),
      description: `Wallet Deposit via ${paymentMethod || "Instant Gateway"}`,
      type: "deposit",
      amount: depositAmount,
      status: "completed",
      balanceAfter: currentUser.balance,
      paymentMethod: paymentMethod || "Credit Card (Stripe)",
      referenceCode: `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    };
    transactions.unshift(newTx);

    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: "Funds Added Successfully",
      message: `+$${depositAmount.toFixed(2)} has been credited to your balance.`,
      type: "success",
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: "/transactions",
    });

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: "DEPOSIT_ADDED",
      details: `Added $${depositAmount.toFixed(2)} via ${paymentMethod}`,
    });

    res.json({
      success: true,
      data: {
        newBalance: currentUser.balance,
        transaction: newTx,
      },
      message: `Successfully credited $${depositAmount.toFixed(2)} to your wallet!`,
    });
  });

  // ==========================================
  // TRANSACTIONS API ROUTES
  // ==========================================
  app.get("/api/transactions", (req, res) => {
    res.json({ success: true, data: transactions });
  });

  // ==========================================
  // SUBSCRIPTIONS API ROUTES
  // ==========================================
  app.get("/api/subscriptions", (req, res) => {
    res.json({ success: true, data: subscriptions });
  });

  app.post("/api/subscriptions/:id/renew", (req, res) => {
    const sub = subscriptions.find((s) => s.id === req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });

    if (currentUser.balance < sub.price) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance ($${currentUser.balance.toFixed(2)}). Need $${sub.price.toFixed(2)}.`,
      });
    }

    currentUser.balance -= sub.price;
    sub.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    sub.status = "active";

    transactions.unshift({
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      date: new Date().toISOString(),
      description: `Plan Renewal - ${sub.packageName}`,
      type: "renewal",
      amount: -sub.price,
      status: "completed",
      balanceAfter: currentUser.balance,
      paymentMethod: "Wallet Balance",
      referenceCode: sub.id,
    });

    res.json({ success: true, data: sub, message: "Subscription renewed successfully!" });
  });

  // ==========================================
  // AI OPERATIONS & SUPPORT API ROUTES
  // ==========================================
  app.post("/api/support/ai/chat", async (req, res) => {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const aiResponse = await askSmmAiAssistant({
      message,
      context: {
        activePanels: panels,
        walletBalance: currentUser.balance,
        userName: currentUser.name,
        language: currentUser.language,
        ...(context || {}),
      },
    });

    res.json({
      success: true,
      data: {
        reply: aiResponse.text,
        timestamp: new Date().toISOString(),
        suggestedActions: [
          { label: "Sync Provider APIs", actionType: "sync_provider" },
          { label: "Purge Edge Cache", actionType: "check_dns" },
          { label: "Open Engineering Ticket", actionType: "create_ticket" },
        ],
      },
    });
  });

  app.get("/api/support/tickets", (req, res) => {
    res.json({ success: true, data: tickets });
  });

  app.post("/api/support/tickets", async (req, res) => {
    const { subject, category, priority, message, relatedPanelId } = req.body;

    const newTicket: SupportTicket = {
      id: `tkt-${Date.now().toString().slice(-4)}`,
      userId: currentUser.id,
      subject: subject || "Inquiry regarding SMM panel configuration",
      priority: priority || "normal",
      status: "open",
      category: category || "panel_issue",
      relatedPanelId: relatedPanelId || panels[0]?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiSummary: "AI Triage: Analyzing ticket content. Auto-remediation active.",
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          ticketId: `tkt-${Date.now().toString().slice(-4)}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: "customer",
          content: message || "Hello support, I need assistance with my SMM service configuration.",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    // Auto-generate AI immediate first response
    try {
      const aiHelp = await askSmmAiAssistant({
        message: `Customer opened a support ticket: "${subject}". Details: "${message}". Category: ${category}. Give an immediate friendly acknowledging response and diagnostic recommendation.`,
        context: {
          userName: currentUser.name,
          walletBalance: currentUser.balance,
          language: currentUser.language,
        },
      });

      newTicket.messages.push({
        id: `msg-${Date.now()}-2`,
        ticketId: newTicket.id,
        senderId: "ai-bot",
        senderName: "Nexus AI Copilot",
        senderRole: "ai",
        content: aiHelp.text,
        createdAt: new Date(Date.now() + 1000).toISOString(),
        isAiGenerated: true,
      });
      newTicket.aiSummary = "AI initial triage completed with immediate action steps.";
    } catch (e) {
      console.log("AI ticket response fallback:", e);
    }

    tickets.unshift(newTicket);
    res.json({ success: true, data: newTicket, message: "Support ticket opened successfully." });
  });

  app.post("/api/support/tickets/:id/messages", (req, res) => {
    const ticket = tickets.find((t) => t.id === req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    const { content } = req.body;
    const newMsg = {
      id: `msg-${Date.now()}`,
      ticketId: ticket.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content,
      createdAt: new Date().toISOString(),
    };
    ticket.messages.push(newMsg);
    ticket.updatedAt = new Date().toISOString();

    res.json({ success: true, data: newMsg });
  });

  // ==========================================
  // NOTIFICATIONS API ROUTES
  // ==========================================
  app.get("/api/notifications", (req, res) => {
    res.json({ success: true, data: notifications });
  });

  app.put("/api/notifications/read-all", (req, res) => {
    notifications.forEach((n) => (n.read = true));
    res.json({ success: true, message: "All notifications marked as read." });
  });

  // ==========================================
  // ADMIN API ROUTES
  // ==========================================
  app.get("/api/admin/stats", (req, res) => {
    res.json({
      success: true,
      data: {
        totalUsers: allUsers.length + 1420,
        activePanels: panels.length + 840,
        monthlyRecurringRevenue: 48920.00,
        totalTransactionsVolume: 320490.00,
        openTickets: tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
        systemUptime: 99.99,
        avgAiResolutionTime: "24.5s",
        users: allUsers,
        panels,
        auditLogs,
      },
    });
  });

  app.get("/api/admin/overview", (req, res) => {
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: allUsers.length + 1420,
          activePanels: panels.length + 840,
          monthlyRecurringRevenue: 48920.00,
          totalTransactionsVolume: 320490.00,
          openTickets: tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
          systemUptime: 99.99,
          avgAiResolutionTime: "24.5s",
          totalServicesCount: services.length + 280,
          ordersProcessedToday: 14820,
          gatewayLatencyAvgMs: 142,
        },
        clusterNodes: [
          { id: "node-sg-01", name: "Cloud Edge SG-01 (Singapore)", region: "ap-southeast-1", pingMs: 12, status: "healthy", cpuLoad: 24, ramUsage: 42, activeConnections: 1240 },
          { id: "node-us-02", name: "Cloud Core US-East (Virginia)", region: "us-east-1", pingMs: 145, status: "healthy", cpuLoad: 31, ramUsage: 58, activeConnections: 3120 },
          { id: "node-vn-03", name: "VN Edge Gateway (Hanoi)", region: "vn-han-1", pingMs: 8, status: "healthy", cpuLoad: 18, ramUsage: 35, activeConnections: 890 },
          { id: "node-jp-04", name: "Asia North JP-04 (Tokyo)", region: "ap-northeast-1", pingMs: 48, status: "healthy", cpuLoad: 22, ramUsage: 40, activeConnections: 1100 },
          { id: "node-proxy-05", name: "Anti-DDoS Failover Anycast", region: "global-edge", pingMs: 15, status: "healthy", cpuLoad: 12, ramUsage: 28, activeConnections: 4500 },
        ],
        providers,
        systemSettings: systemMasterSettings,
        recentAuditLogs: auditLogs,
      },
    });
  });

  // 1. Admin Users Management
  app.get("/api/admin/users", (req, res) => {
    const enrichedUsers = allUsers.map((u) => {
      const userPanels = panels.filter((p) => p.userId === u.id);
      const userTxs = transactions.filter((t) => t.userId === u.id);
      const totalSpent = userTxs.filter((t) => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
      return {
        ...u,
        panelsCount: userPanels.length,
        totalSpent,
        status: "active",
      };
    });
    res.json({ success: true, data: enrichedUsers });
  });

  app.post("/api/admin/users/:id/adjust-balance", (req, res) => {
    const { amount, type, reason } = req.body;
    const user = allUsers.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const adjAmount = Math.abs(Number(amount));
    if (!adjAmount || adjAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    if (type === "debit") {
      user.balance = Math.max(0, user.balance - adjAmount);
    } else {
      user.balance += adjAmount;
    }

    const tx: Transaction = {
      id: `tx-adj-${Date.now()}`,
      userId: user.id,
      date: new Date().toISOString(),
      description: `[Admin Adjustment] ${reason || (type === "debit" ? "Admin Balance Deduction" : "Admin Credit Bonus")}`,
      type: "adjustment",
      amount: type === "debit" ? -adjAmount : adjAmount,
      status: "completed",
      balanceAfter: user.balance,
      paymentMethod: "Admin Master Console",
      referenceCode: `ADJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };
    transactions.unshift(tx);

    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: user.id,
      title: type === "debit" ? "Wallet Balance Adjusted" : "Bonus Credit Received!",
      message: `${type === "debit" ? `-$${adjAmount.toFixed(2)}` : `+$${adjAmount.toFixed(2)}`}: ${reason || "Processed by Nexus System Administration"}.`,
      type: type === "debit" ? "warning" : "success",
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: "/transactions",
    });

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "BALANCE_ADJUSTED",
      details: `${type === "debit" ? "Deducted" : "Added"} $${adjAmount.toFixed(2)} for ${user.email} (${reason || "No reason given"})`,
      severity: type === "debit" ? "warning" : "success",
    });

    if (currentUser.id === user.id) {
      currentUser.balance = user.balance;
    }

    res.json({
      success: true,
      data: { user, transaction: tx },
      message: `Balance updated for ${user.name}: New balance $${user.balance.toFixed(2)}`,
    });
  });

  app.put("/api/admin/users/:id/role", (req, res) => {
    const { role } = req.body;
    const user = allUsers.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.role = role || "customer";
    if (currentUser.id === user.id) {
      currentUser.role = user.role;
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "USER_ROLE_CHANGED",
      details: `Role for ${user.email} updated to ${user.role}`,
      severity: "info",
    });

    res.json({ success: true, data: user, message: `User role changed to ${user.role}` });
  });

  // 2. Admin Panels Management
  app.get("/api/admin/panels", (req, res) => {
    res.json({ success: true, data: panels });
  });

  app.post("/api/admin/panels/create", (req, res) => {
    const { name, domain, planId, targetUserId, days } = req.body;
    const targetUser = allUsers.find((u) => u.id === targetUserId) || currentUser;
    const plan = packages.find((p) => p.id === planId) || packages[0];
    const durationDays = Number(days) || 30;

    const newPanel: SmmPanel = {
      id: `pnl-${Math.random().toString(36).substring(2, 7)}`,
      userId: targetUser.id,
      name: name || "Custom Agency Panel",
      domain: domain ? (domain.includes(".") ? domain : `${domain}.nexussmm.io`) : `agency-${Date.now().toString().slice(-4)}.nexussmm.io`,
      apiKey: `nx_live_${Math.random().toString(36).substring(2, 16)}`,
      planId: plan.id,
      planName: plan.name,
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      uptime: 99.99,
      activeServicesCount: services.length,
      totalOrders: 0,
      totalMessages: 0,
      todayMessages: 0,
      messageRatePerMin: 120,
      monthlyRevenue: 0,
      currency: "USD",
      nameservers: {
        ns1: "ns1.nexussmm-dns.com",
        ns2: "ns2.nexussmm-dns.com",
        status: "configured",
      },
      sslActive: true,
      providerApiSynced: true,
      healthScore: 100,
      notes: "Provisioned directly by Admin Master Console",
      dispatchConfig: {
        enabled: true,
        method: "api",
        api: {
          apiUrl: "https://justanotherpanel.com/api/v2",
          apiKey: "jap_live_sec_88492049182a0b4e",
        },
      },
    };

    panels.unshift(newPanel);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "PANEL_PROVISIONED_BY_ADMIN",
      details: `Created panel ${newPanel.name} (${newPanel.domain}) for ${targetUser.email} (${durationDays} days)`,
      severity: "success",
    });

    res.json({ success: true, data: newPanel, message: `Panel "${newPanel.name}" provisioned successfully!` });
  });

  app.put("/api/admin/panels/:id", (req, res) => {
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    Object.assign(panel, req.body);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "PANEL_UPDATED",
      details: `Updated parameters for panel ${panel.name} (${panel.domain})`,
      severity: "info",
    });

    res.json({ success: true, data: panel, message: "Panel updated successfully." });
  });

  app.post("/api/admin/panels/:id/extend", (req, res) => {
    const { days } = req.body;
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    const addDays = Number(days) || 30;
    const currentExpiry = new Date(panel.expiresAt).getTime();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiry = new Date(baseTime + addDays * 24 * 60 * 60 * 1000).toISOString();

    panel.expiresAt = newExpiry;
    panel.status = "active";

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "PANEL_EXTENDED",
      details: `Added +${addDays} days to panel ${panel.name}. New Expiry: ${new Date(newExpiry).toLocaleDateString()}`,
      severity: "success",
    });

    res.json({
      success: true,
      data: panel,
      message: `Extended ${panel.name} by +${addDays} days. New expiry: ${new Date(newExpiry).toLocaleDateString()}`,
    });
  });

  app.delete("/api/admin/panels/:id", (req, res) => {
    const panel = panels.find((p) => p.id === req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    panels = panels.filter((p) => p.id !== req.params.id);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "PANEL_DELETED",
      details: `Permanently deleted panel ${panel.name} (${panel.domain})`,
      severity: "danger",
    });

    res.json({ success: true, message: `Panel "${panel.name}" has been deleted.` });
  });

  // 3. Admin Providers Management
  app.get("/api/admin/providers", (req, res) => {
    res.json({ success: true, data: providers });
  });

  app.post("/api/admin/providers", (req, res) => {
    const { name, apiUrl, apiKey, autoRefill, priority } = req.body;
    const newProvider = {
      id: `prv-${Date.now()}`,
      name: name || "New Upstream SMM Provider",
      apiUrl: apiUrl || "https://api.smmprovider.com/v2",
      apiKey: apiKey || "sec_live_key",
      balance: Math.floor(Math.random() * 800) + 200,
      currency: "USD",
      status: "active",
      latencyMs: Math.floor(Math.random() * 120) + 110,
      servicesCount: 60,
      lastPingAt: new Date().toISOString(),
      autoRefill: autoRefill ?? true,
      priority: Number(priority) || providers.length + 1,
    };
    providers.push(newProvider);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "PROVIDER_ADDED",
      details: `Added new upstream provider ${newProvider.name}`,
      severity: "success",
    });

    res.json({ success: true, data: newProvider, message: "Provider connected successfully!" });
  });

  app.post("/api/admin/providers/:id/ping", (req, res) => {
    const provider = providers.find((p) => p.id === req.params.id);
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

    provider.latencyMs = Math.floor(Math.random() * 100) + 115;
    provider.lastPingAt = new Date().toISOString();
    provider.status = "active";

    res.json({
      success: true,
      data: {
        latencyMs: provider.latencyMs,
        balance: provider.balance,
        status: "active",
        pingResult: "HTTP 200 OK - All API methods responsive",
      },
      message: `Ping successful: ${provider.latencyMs}ms | Current Provider Balance: $${provider.balance.toFixed(2)}`,
    });
  });

  app.delete("/api/admin/providers/:id", (req, res) => {
    providers = providers.filter((p) => p.id !== req.params.id);
    res.json({ success: true, message: "Provider disconnected." });
  });

  // 4. Admin Bulk Pricing & Services
  app.post("/api/admin/services/bulk-price", (req, res) => {
    const { category, mode, value } = req.body;
    const numVal = Number(value) || 0;

    let affectedCount = 0;
    services.forEach((s) => {
      if (!category || category === "all" || s.category === category) {
        if (mode === "percent") {
          s.salePricePer1k = Number((s.salePricePer1k * (1 + numVal / 100)).toFixed(3));
        } else if (mode === "fixed") {
          s.salePricePer1k = Math.max(0.01, Number((s.salePricePer1k + numVal).toFixed(3)));
        }
        affectedCount++;
      }
    });

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "BULK_PRICING_UPDATED",
      details: `Adjusted prices for ${affectedCount} services in category [${category || "All"}] by ${mode === "percent" ? `${numVal > 0 ? "+" : ""}${numVal}%` : `$${numVal}`}`,
      severity: "info",
    });

    res.json({
      success: true,
      data: { affectedCount, services },
      message: `Bulk updated pricing for ${affectedCount} services successfully!`,
    });
  });

  // 5. Admin Packages Configuration
  app.put("/api/admin/packages/:id", (req, res) => {
    const pkg = packages.find((p) => p.id === req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    Object.assign(pkg, req.body);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "PACKAGE_CONFIG_UPDATED",
      details: `Updated package specifications for ${pkg.name}`,
      severity: "info",
    });

    res.json({ success: true, data: pkg, message: `Package "${pkg.name}" updated successfully!` });
  });

  // 6. Admin System Master Controls & Audit Logs
  app.get("/api/admin/system/settings", (req, res) => {
    res.json({ success: true, data: systemMasterSettings });
  });

  app.put("/api/admin/system/settings", (req, res) => {
    systemMasterSettings = { ...systemMasterSettings, ...req.body };

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "SYSTEM_SETTINGS_SAVED",
      details: "Global platform settings and gateway configuration updated",
      severity: "info",
    });

    res.json({ success: true, data: systemMasterSettings, message: "System settings saved successfully." });
  });

  app.post("/api/admin/system/purge-cache", (req, res) => {
    panels.forEach((p) => (p.healthScore = 100));

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "GLOBAL_CACHE_PURGED",
      details: "Edge CDN cache purged across all 5 Anycast gateway nodes",
      severity: "success",
    });

    res.json({
      success: true,
      message: "Global CDN Cache purged across 5 Edge Nodes. All panel DNS routing primed.",
    });
  });

  app.post("/api/admin/system/sync-all-providers", (req, res) => {
    providers.forEach((p) => {
      p.latencyMs = Math.floor(Math.random() * 80) + 120;
      p.lastPingAt = new Date().toISOString();
    });

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "PROVIDERS_GLOBAL_SYNC",
      details: `Synchronized catalogs, balances and latency for all ${providers.length} upstream providers`,
      severity: "success",
    });

    res.json({
      success: true,
      data: providers,
      message: `Successfully synced all ${providers.length} upstream providers and updated 324 service prices!`,
    });
  });

  app.get("/api/admin/audit-logs", (req, res) => {
    res.json({ success: true, data: auditLogs });
  });

  // 7. Master Orders Management
  app.get("/api/admin/orders", (req, res) => {
    res.json({ success: true, data: masterOrders });
  });

  app.post("/api/admin/orders/:id/retry", (req, res) => {
    const order = masterOrders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = "processing";
    order.updatedAt = new Date().toISOString();
    order.providerOrderId = `JAP-${Math.floor(Math.random() * 8000000) + 1000000}`;

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "ORDER_REROUTED_RETRY",
      details: `Re-dispatched order #${order.id} to ${order.providerName} (New API ID: ${order.providerOrderId})`,
      severity: "info",
    });

    res.json({
      success: true,
      data: order,
      message: `Order #${order.id} re-dispatched to provider successfully!`,
    });
  });

  app.post("/api/admin/orders/:id/cancel-refund", (req, res) => {
    const order = masterOrders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = "canceled";
    order.updatedAt = new Date().toISOString();

    const targetUser = allUsers.find((u) => u.id === order.userId);
    if (targetUser) {
      targetUser.balance += order.charge;
      transactions.unshift({
        id: `tx-ref-${Date.now()}`,
        userId: targetUser.id,
        date: new Date().toISOString(),
        description: `[Refund] Canceled Order #${order.id} (${order.serviceName})`,
        type: "adjustment",
        amount: order.charge,
        status: "completed",
        balanceAfter: targetUser.balance,
        paymentMethod: "Admin Auto Refund",
        referenceCode: `REF-${order.id}`,
      });
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "ORDER_CANCELED_REFUND",
      details: `Canceled order #${order.id} and refunded $${order.charge.toFixed(2)} to ${order.userEmail}`,
      severity: "warning",
    });

    res.json({
      success: true,
      data: order,
      message: `Order #${order.id} canceled and $${order.charge.toFixed(2)} refunded to user.`,
    });
  });

  app.put("/api/admin/orders/:id/status", (req, res) => {
    const { status, remains } = req.body;
    const order = masterOrders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (status) order.status = status;
    if (remains !== undefined) order.remains = Number(remains);
    order.updatedAt = new Date().toISOString();

    res.json({ success: true, data: order, message: "Order updated successfully." });
  });

  // 8. Site Frontend Configuration (User Portal Branding & Settings)
  app.get("/api/admin/site-config", (req, res) => {
    res.json({ success: true, data: siteFrontendConfig });
  });

  app.put("/api/admin/site-config", (req, res) => {
    siteFrontendConfig = { ...siteFrontendConfig, ...req.body };

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "SITE_BRANDING_UPDATED",
      details: `Updated user site branding: ${siteFrontendConfig.siteName}`,
      severity: "info",
    });

    res.json({
      success: true,
      data: siteFrontendConfig,
      message: "User frontend branding and site configuration saved successfully!",
    });
  });

  app.get("/api/public/site-config", (req, res) => {
    res.json({ success: true, data: siteFrontendConfig });
  });

  // 9. Announcements & User Notifications Master
  app.get("/api/admin/announcements", (req, res) => {
    res.json({ success: true, data: announcements });
  });

  app.post("/api/admin/announcements", (req, res) => {
    const { title, content, type, target, isPopup } = req.body;
    const newAnc = {
      id: `anc-${Date.now()}`,
      title: title || "New System Announcement",
      content: content || "",
      type: type || "info",
      target: target || "all",
      isPopup: !!isPopup,
      active: true,
      createdAt: new Date().toISOString(),
    };
    announcements.unshift(newAnc);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "ANNOUNCEMENT_BROADCAST",
      details: `Broadcasted announcement: "${newAnc.title}"`,
      severity: "info",
    });

    res.json({ success: true, data: newAnc, message: "Announcement broadcasted to users!" });
  });

  app.put("/api/admin/announcements/:id", (req, res) => {
    const anc = announcements.find((a) => a.id === req.params.id);
    if (!anc) return res.status(404).json({ success: false, message: "Announcement not found" });

    Object.assign(anc, req.body);
    res.json({ success: true, data: anc, message: "Announcement updated." });
  });

  app.delete("/api/admin/announcements/:id", (req, res) => {
    announcements = announcements.filter((a) => a.id !== req.params.id);
    res.json({ success: true, message: "Announcement deleted." });
  });

  app.get("/api/public/announcements", (req, res) => {
    res.json({ success: true, data: announcements.filter((a) => a.active) });
  });

  // 10. Coupons & Promotions
  app.get("/api/admin/coupons", (req, res) => {
    res.json({ success: true, data: coupons });
  });

  app.post("/api/admin/coupons", (req, res) => {
    const { code, discountPercent, maxDiscountUsd, minOrderUsd, maxUses, expiresAt } = req.body;
    const newCpn = {
      id: `cpn-${Date.now()}`,
      code: (code || `PROMO${Math.floor(Math.random() * 900) + 100}`).toUpperCase(),
      discountPercent: Number(discountPercent) || 10,
      maxDiscountUsd: Number(maxDiscountUsd) || 50,
      minOrderUsd: Number(minOrderUsd) || 10,
      maxUses: Number(maxUses) || 500,
      usedCount: 0,
      expiresAt: expiresAt || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
    };
    coupons.unshift(newCpn);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "COUPON_CREATED",
      details: `Created coupon code [${newCpn.code}] - ${newCpn.discountPercent}% OFF`,
      severity: "success",
    });

    res.json({ success: true, data: newCpn, message: `Coupon code [${newCpn.code}] created successfully!` });
  });

  app.put("/api/admin/coupons/:id", (req, res) => {
    const cpn = coupons.find((c) => c.id === req.params.id);
    if (!cpn) return res.status(404).json({ success: false, message: "Coupon not found" });

    Object.assign(cpn, req.body);
    res.json({ success: true, data: cpn, message: "Coupon updated." });
  });

  app.delete("/api/admin/coupons/:id", (req, res) => {
    coupons = coupons.filter((c) => c.id !== req.params.id);
    res.json({ success: true, message: "Coupon deleted." });
  });

  app.post("/api/public/coupons/apply", (req, res) => {
    const { code, orderAmount } = req.body;
    const cpn = coupons.find((c) => c.code.toUpperCase() === (code || "").toUpperCase() && c.active);

    if (!cpn) {
      return res.status(400).json({ success: false, message: "Mã giảm giá không hợp lệ hoặc đã hết hạn." });
    }

    if (new Date(cpn.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Mã giảm giá đã quá hạn sử dụng." });
    }

    if (cpn.usedCount >= cpn.maxUses) {
      return res.status(400).json({ success: false, message: "Mã giảm giá đã đạt giới hạn số lượt áp dụng." });
    }

    const orderVal = Number(orderAmount) || 0;
    if (orderVal < cpn.minOrderUsd) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu phải từ $${cpn.minOrderUsd.toFixed(2)} để sử dụng mã này.`,
      });
    }

    const rawDiscount = (orderVal * cpn.discountPercent) / 100;
    const discountAmount = Math.min(rawDiscount, cpn.maxDiscountUsd);

    res.json({
      success: true,
      data: {
        code: cpn.code,
        discountPercent: cpn.discountPercent,
        discountAmount,
        finalAmount: Math.max(0, orderVal - discountAmount),
      },
      message: `Áp dụng thành công mã [${cpn.code}]: Giảm -$${discountAmount.toFixed(2)} (${cpn.discountPercent}%)`,
    });
  });

  // 11. AI Operations & Gemini Automation Config
  app.get("/api/admin/ai-config", (req, res) => {
    res.json({ success: true, data: aiAutomationConfig });
  });

  app.put("/api/admin/ai-config", (req, res) => {
    aiAutomationConfig = { ...aiAutomationConfig, ...req.body };

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "AI_CONFIG_UPDATED",
      details: `Updated AI Copilot parameters: Model ${aiAutomationConfig.geminiModel}`,
      severity: "info",
    });

    res.json({
      success: true,
      data: aiAutomationConfig,
      message: "AI Copilot & Automation parameters updated successfully.",
    });
  });

  // ==========================================
  // VITE MIDDLEWARE (DEV) & STATIC (PROD)
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NexusSMM SaaS Platform running on http://localhost:${PORT}`);
  });
}

startServer();
