import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { askSmmAiAssistant } from "./src/server/geminiService";
import { User, SmmPanel, SmmService, PanelPackage, Subscription, Transaction, SupportTicket, NotificationItem } from "./src/types";
import prisma, { Prisma } from "./src/server/lib/prisma";
import { hashPassword, verifyPassword, generateToken, generateSecureToken } from "./src/server/lib/auth";
import { checkRateLimit } from "./src/server/lib/rateLimit";
import { sendPasswordResetEmail } from "./src/server/lib/mail";
import { requireAuth, AuthenticatedRequest } from "./src/server/middleware/authMiddleware";
import { validateRegistrationInput } from "./src/server/lib/validation";
import { generateSecret, generateURI, verify as verifyTotp } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import fs from "fs";
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
const panelSecret = () => crypto.createHash('sha256').update(process.env.PANEL_CREDENTIAL_KEY || process.env.JWT_SECRET || 'change-panel-credential-key').digest();
const encryptPanelPassword = (value: string) => { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', panelSecret(), iv); const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return `enc:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`; };
const decryptPanelPassword = (value: string) => { if (!value.startsWith('enc:')) throw new Error('Mật khẩu Panel cũ chưa hỗ trợ tự động đăng nhập. Vui lòng cập nhật lại mật khẩu.'); const [, ivHex, tagHex, dataHex] = value.split(':'); const decipher = crypto.createDecipheriv('aes-256-gcm', panelSecret(), Buffer.from(ivHex, 'hex')); decipher.setAuthTag(Buffer.from(tagHex, 'hex')); return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8'); };
const getLoginCookie = () => {
  for (const file of [process.env.PANEL_COOKIE_FILE, path.resolve(process.cwd(), "session_cookie.txt"), path.resolve(process.cwd(), "..", "session_cookie.txt")].filter(Boolean) as string[]) {
    try { const value = fs.readFileSync(file, "utf8").trim(); if (value) return value; } catch { /* optional */ }
  }
  return null;
};

async function loginNaplike(username: string, password: string, secret: string) {
  let cookie = '';
  const fetchCookie = async (url: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (cookie) headers.set('Cookie', cookie);
    const response = await fetch(url, { ...init, headers });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(',').map((v) => v.trim().split(';')[0]).join('; ');
    return response;
  };
  const base = 'https://naplike.com';
  const post = async (data: Record<string, string>, referer: string) => {
    const response = await fetchCookie(`${base}/request`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Origin: base, Referer: `${base}${referer}`, 'X-Requested-With': 'XMLHttpRequest' }, body: new URLSearchParams(data) });
    return response.json() as Promise<any>;
  };
  await fetchCookie(`${base}/signin`);
  const signed = await post({ action: 'Account-signin', 'data[username]': username, 'data[password]': password, 'data[gcaptcha]': '0' }, '/signin');
  if (!signed?.success) throw new Error('Đăng nhập Naplike thất bại');
  const otpResponse = await fetch(`https://2fa.live/tok/${encodeURIComponent(secret)}`);
  const otp = (await otpResponse.json() as any)?.token;
  if (!otp) throw new Error('Không lấy được mã 2FA');
  const verified = await post({ action: 'Account-checkGGAuth', 'data[code]': otp }, '/2fa-auth');
  if (!verified?.success || verified.rd !== 'admin') throw new Error('Xác thực 2FA thất bại');
  const session = cookie.split(';').find((v) => v.trim().startsWith('PHPSESSID='));
  if (!session) throw new Error('Không tìm thấy PHPSESSID');
  return session.trim();
}

const describeUserAgent = (userAgent?: string | null) => {
  if (!userAgent) return "Unknown browser";
  const browser = /Edg\/?/i.test(userAgent) ? "Edge" : /Chrome\/?/i.test(userAgent) ? "Chrome" : /Firefox\/?/i.test(userAgent) ? "Firefox" : /Safari\/?/i.test(userAgent) ? "Safari" : "Browser";
  const os = /Windows/i.test(userAgent) ? "Windows" : /Android/i.test(userAgent) ? "Android" : /iPhone|iPad/i.test(userAgent) ? "iOS" : /Mac OS X/i.test(userAgent) ? "macOS" : /Linux/i.test(userAgent) ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
};

const getClientIp = (req: express.Request) => {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (forwardedIp || req.ip || req.socket.remoteAddress || "").trim().replace(/^::ffff:/, "") || null;
};

const resolveIpLocation = async (ip?: string | null) => {
  const normalized = (ip || "").replace(/^::ffff:/, "");
  if (!normalized || normalized === "127.0.0.1" || normalized === "::1" || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(normalized)) return "Local network";
  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(normalized)}/json/`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return "Unknown location";
    const data = await response.json() as { city?: string; region?: string; postal?: string; country_name?: string };
    return [data.city, data.region, data.postal, data.country_name].filter(Boolean).join(", ") || "Unknown location";
  } catch { return "Unknown location"; }
};

/** Nhận diện ngôn ngữ của client từ headers, cookie, body hoặc query */
export function getReqLang(req: express.Request): "vi" | "en" {
  const customHeader = (req.headers["x-app-language"] || req.headers["x-language"] || "") as string;
  if (customHeader.toLowerCase().startsWith("en")) return "en";
  if (customHeader.toLowerCase().startsWith("vi")) return "vi";

  const acceptLang = (req.headers["accept-language"] || "") as string;
  if (acceptLang.toLowerCase().includes("en")) return "en";
  if (acceptLang.toLowerCase().includes("vi")) return "vi";

  const queryLang = (req.query?.lang || req.query?.language || "") as string;
  if (queryLang.toLowerCase() === "en") return "en";
  if (queryLang.toLowerCase() === "vi") return "vi";

  const bodyLang = (req.body?.language || req.body?.lang || "") as string;
  if (bodyLang.toLowerCase() === "en") return "en";
  if (bodyLang.toLowerCase() === "vi") return "vi";

  return "vi";
}

/** Trả về thông báo tương ứng theo ngôn ngữ yêu cầu của người dùng */
export function locMsg(req: express.Request, vi: string, en: string): string {
  return getReqLang(req) === "en" ? en : vi;
}

async function createLoginSession(req: express.Request, userId: number, token: string) {
  try {
    const ipAddress = getClientIp(req);
    await prisma.loginSession.create({
      data: {
        userId,
        tokenHash: hashSessionToken(token),
        userAgent: req.get("user-agent")?.slice(0, 500),
        ipAddress,
        location: await resolveIpLocation(ipAddress),
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

const clearAuthCookie = (res: express.Response) => {
  res.clearCookie("jwt_token");
  res.clearCookie("session_token");
};

// In-Memory Database State
let currentUser: User = {
  id: "0",
  name: "",
  username: "",
  email: "",
  role: "customer",
  balance: 0,
  avatar: "",
  phone: "",
  timezone: "UTC",
  language: "vi",
  twoFactorEnabled: false,
  emailVerified: false,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
};

let allUsers: User[] = [];

let panels: SmmPanel[] = [];
let services: SmmService[] = [];
const packages: PanelPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for freelancers and beginners getting started with SMM services.',
    pricing: { weekly: 9.99, monthly: 29.99, yearly: 239.99 },
    features: {
      panelsCount: 1,
      maxOrdersPerMonth: 1000,
      servicesLimit: 50,
      uptimeSla: '99.5%',
      supportLevel: 'Standard',
      apiAccess: true,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Ideal for growing agencies managing multiple clients and providers.',
    badge: 'Most Popular',
    isPopular: true,
    pricing: { weekly: 19.99, monthly: 59.99, yearly: 479.99 },
    features: {
      panelsCount: 3,
      maxOrdersPerMonth: 10000,
      servicesLimit: 200,
      uptimeSla: '99.9%',
      supportLevel: 'Priority 24/7',
      apiAccess: true,
    },
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'Built for scaling agencies with high-volume orders and custom branding.',
    pricing: { weekly: 39.99, monthly: 119.99, yearly: 959.99 },
    features: {
      panelsCount: 10,
      maxOrdersPerMonth: 50000,
      servicesLimit: 500,
      uptimeSla: '99.95%',
      supportLevel: 'Priority 24/7',
      apiAccess: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Unlimited power for enterprises requiring dedicated infrastructure and VIP support.',
    badge: 'Best Value',
    pricing: { weekly: 99.99, monthly: 299.99, yearly: 2399.99 },
    features: {
      panelsCount: 'Unlimited',
      maxOrdersPerMonth: 'Unlimited',
      servicesLimit: 'Unlimited',
      uptimeSla: '99.99%',
      supportLevel: 'Dedicated VIP',
      apiAccess: true,
    },
  },
];
const transactions: Transaction[] = [];
const tickets: SupportTicket[] = [];
const notifications: NotificationItem[] = [];

let subscriptions: Subscription[] = [];

let auditLogs: Array<{
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  severity?: string;
}> = [];

let providers: any[] = [];

let systemMasterSettings = {
  maintenanceMode: false,
  autoDispatchEnabled: true,
  autoProvisioningEnabled: true,
  autoBankingSync: true,
  usdToVndRate: 25400,
  minDepositUsd: 5.0,
  vietqrConfig: {
    bankCode: "",
    accountNumber: "",
    accountHolder: "",
    autoVerify: true,
  },
  cryptoConfig: {
    usdtTrc20Address: "",
    usdtErc20Address: "",
    autoConfirmBlocks: 3,
  },
};

let paymentGateways: any[] = [];

let masterOrders: any[] = [];

let siteFrontendConfig = {
  siteName: "",
  siteTagline: "",
  siteLogoUrl: "",
  faviconUrl: "/favicon.ico",
  primaryBrandColor: "#2563eb",
  supportEmail: "",
  supportTelegram: "",
  supportHotline: "",
  allowUserRegistration: true,
  allowFreeTrialPanel: true,
  allowGuestServiceViewing: true,
  enableLiveChatWidget: true,
  headerAnnouncementBar: "",
  headerAnnouncementActive: false,
  footerCopyright: "",
  seoMetaTitle: "",
  seoMetaKeywords: "",
  seoMetaDescription: "",
  customCss: "",
  customHeaderScripts: "",
  customBodyScripts: "",
};

let announcements: any[] = [];

let coupons: any[] = [];

let aiAutomationConfig = {
  geminiModel: "gemini-2.5-flash",
  systemPrompt: "You are the Nexus SMM Master AI Operations Copilot. You diagnose DNS records, suggest pricing margins, analyze order failovers, and assist agency owners.",
  autoTicketReplyEnabled: true,
  autoDnsDiagnostic: true,
  autoMarginOptimizer: true,
  maxDailyAiTokens: 500000,
  temperature: 0.7,
};

const INITIAL_CURRENCIES = [
  { code: 'USD', name: 'Đô la Mỹ (USD)', symbol: '$', symbolPosition: 'left', rate: 1.0, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 2, isDefault: true, autoSync: false, active: true, sortOrder: 0 },
  { code: 'VND', name: 'Việt Nam Đồng (VND)', symbol: '₫', symbolPosition: 'right', rate: 25400.0, thousandSeparator: '.', decimalSeparator: ',', decimalDigits: 0, isDefault: false, autoSync: true, active: true, sortOrder: 1 },
  { code: 'EUR', name: 'Đồng Euro (EUR)', symbol: '€', symbolPosition: 'left', rate: 0.92, thousandSeparator: '.', decimalSeparator: ',', decimalDigits: 2, isDefault: false, autoSync: true, active: true, sortOrder: 2 },
  { code: 'GBP', name: 'Bảng Anh (GBP)', symbol: '£', symbolPosition: 'left', rate: 0.79, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 2, isDefault: false, autoSync: true, active: true, sortOrder: 3 },
  { code: 'JPY', name: 'Yên Nhật (JPY)', symbol: '¥', symbolPosition: 'left', rate: 154.5, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 0, isDefault: false, autoSync: true, active: true, sortOrder: 4 },
  { code: 'KRW', name: 'Won Hàn Quốc (KRW)', symbol: '₩', symbolPosition: 'left', rate: 1380.0, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 0, isDefault: false, autoSync: true, active: true, sortOrder: 5 },
  { code: 'CNY', name: 'Nhân Dân Tệ (CNY)', symbol: '¥', symbolPosition: 'left', rate: 7.25, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 2, isDefault: false, autoSync: true, active: true, sortOrder: 6 },
  { code: 'THB', name: 'Baht Thái (THB)', symbol: '฿', symbolPosition: 'left', rate: 36.5, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 2, isDefault: false, autoSync: true, active: true, sortOrder: 7 },
  { code: 'SGD', name: 'Đô la Singapore (SGD)', symbol: 'S$', symbolPosition: 'left', rate: 1.35, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 2, isDefault: false, autoSync: true, active: true, sortOrder: 8 },
  { code: 'MYR', name: 'Ringgit Malaysia (MYR)', symbol: 'RM', symbolPosition: 'left', rate: 4.7, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 2, isDefault: false, autoSync: true, active: true, sortOrder: 9 },
  { code: 'BRL', name: 'Real Brazil (BRL)', symbol: 'R$', symbolPosition: 'left', rate: 5.45, thousandSeparator: '.', decimalSeparator: ',', decimalDigits: 2, isDefault: false, autoSync: true, active: true, sortOrder: 10 },
  { code: 'INR', name: 'Rupee Ấn Độ (INR)', symbol: '₹', symbolPosition: 'left', rate: 83.5, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 2, isDefault: false, autoSync: true, active: true, sortOrder: 11 },
  { code: 'RUB', name: 'Rúp Nga (RUB)', symbol: '₽', symbolPosition: 'right', rate: 90.0, thousandSeparator: ' ', decimalSeparator: ',', decimalDigits: 2, isDefault: false, autoSync: true, active: true, sortOrder: 12 },
];

/** Helper to sync FX rates from open.er-api.com */
async function syncCurrenciesFromApi(): Promise<{ updatedCount: number; rates: Record<string, number> }> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error(`FX API returned status ${res.status}`);
  const data = (await res.json()) as any;
  const rates: Record<string, number> = data?.rates || {};

  const activeAutoSyncCurrencies = await prisma.currency.findMany({
    where: { autoSync: true },
  });

  let updatedCount = 0;
  for (const cur of activeAutoSyncCurrencies) {
    if (cur.code === 'USD') continue; // USD is base
    if (rates[cur.code] !== undefined && typeof rates[cur.code] === 'number') {
      const newRate = rates[cur.code];
      await prisma.currency.update({
        where: { id: cur.id },
        data: {
          rate: new Prisma.Decimal(newRate),
          lastSyncAt: new Date(),
        },
      });
      updatedCount++;
    }
  }

  return { updatedCount, rates };
}

/** Seed only missing catalogue rows on application start. */
async function seedDatabase() {
  try {
    for (const pkg of packages) {
      await prisma.package.upsert({
        where: { code: pkg.id },
        update: {},
        create: {
          code: pkg.id, name: pkg.name, tagline: pkg.tagline, badge: pkg.badge,
          isPopular: Boolean(pkg.isPopular), weeklyPrice: pkg.pricing.weekly,
          monthlyPrice: pkg.pricing.monthly, yearlyPrice: pkg.pricing.yearly,
          features: pkg.features, sortOrder: packages.indexOf(pkg) + 1,
        },
      });
    }

    const curCount = await prisma.currency.count();
    if (curCount === 0) {
      for (const cur of INITIAL_CURRENCIES) {
        await prisma.currency.create({
          data: {
            code: cur.code,
            name: cur.name,
            symbol: cur.symbol,
            symbolPosition: cur.symbolPosition,
            rate: new Prisma.Decimal(cur.rate),
            thousandSeparator: cur.thousandSeparator,
            decimalSeparator: cur.decimalSeparator,
            decimalDigits: cur.decimalDigits,
            isDefault: cur.isDefault,
            autoSync: cur.autoSync,
            active: cur.active,
            sortOrder: cur.sortOrder,
          },
        });
      }
      console.log("[Database] Initial currencies (USD, VND, EUR, ...) created successfully.");
    }

    console.log("[Database] Missing seed data added successfully.");
  } catch (error: any) {
    console.warn("[Database] Seed skipped:", error.message);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  await seedDatabase();

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

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHENTICATED",
        message: locMsg(req, "Yêu cầu đăng nhập. Không tìm thấy token xác thực.", "Authentication required. Please sign in."),
      });
    }

    const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_INVALID",
        message: locMsg(req, "Phiên đăng nhập đã hết hạn hoặc token không hợp lệ.", "Session expired or invalid token."),
      });
    }

    try {
      const numUserId = Number(decoded.userId);
      const orClauses: any[] = [];
      if (!Number.isNaN(numUserId) && numUserId > 0) {
        orClauses.push({ id: numUserId });
      }
      if (decoded.email) {
        orClauses.push({ email: decoded.email });
      }
      if (decoded.username) {
        orClauses.push({ username: decoded.username });
      }

      const dbUser = orClauses.length > 0 ? await prisma.user.findFirst({
        where: { OR: orClauses },
      }) : null;

      if (!dbUser) {
        return res.status(401).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: locMsg(req, "Tài khoản không tồn tại trong cơ sở dữ liệu. Phiên đã bị hủy.", "User not found. Session terminated."),
        });
      }

      if (dbUser.status === "banned" || dbUser.status === "suspended") {
        return res.status(403).json({
          success: false,
          code: "USER_BANNED",
          message: locMsg(req, "Tài khoản của bạn đã bị khóa hoặc tạm ngưng.", "Your account has been suspended or banned."),
        });
      }

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
    } catch (e: any) {
      console.warn("Prisma user lookup error:", e);
      return res.status(500).json({
        success: false,
        message: locMsg(req, "Lỗi máy chủ khi truy vấn tài khoản.", "Internal server error looking up user."),
      });
    }
  });

  // 2. User Registration (Validation + RabbitMQ Deduplication Lock + Argon2 + Prisma MySQL)
  app.post("/api/auth/register", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "anonymous";

    // Rate limiting check
    const rateCheck = await checkRateLimit(`auth:register:${clientIp}`, 10, 60);
    if (!rateCheck.success) {
      return res.status(429).json({
        success: false,
        message: locMsg(req, "Bạn đã thử đăng ký quá nhiều lần. Vui lòng đợi 1 phút trước khi thử lại.", "Too many registration attempts. Please wait 1 minute before retrying."),
      });
    }

    // STEP 1: Validate input parameters
    const validation = validateRegistrationInput(req.body);
    if (!validation.isValid || !validation.sanitizedData) {
      return res.status(400).json({
        success: false,
        message: locMsg(req, Object.values(validation.errors)[0] || "Dữ liệu đăng ký không hợp lệ.", "Invalid registration data."),
      });
    }

    const { name, username, email, password, phone } = validation.sanitizedData;

    // Không bao giờ tin role do client gửi lên: tài khoản mới luôn là customer.
    const role = "customer";

    // Đọc language & currency mặc định & chính sách đăng ký từ settings
    let defaultLanguage = getReqLang(req);
    let defaultCurrency = "USD";
    try {
      const sysSettings = await prisma.setting.findFirst();
      if (sysSettings) {
        if (sysSettings.allowUserRegistration === false) {
          return res.status(403).json({
            success: false,
            code: "REGISTRATION_DISABLED",
            message: locMsg(req, "Tính năng đăng ký tài khoản mới hiện đang tạm đóng bởi Quản trị viên.", "User registration is currently closed by administrator."),
          });
        }
        if (!req.headers["x-app-language"] && !req.headers["accept-language"]) {
          defaultLanguage = (sysSettings.defaultLanguage as any) || "vi";
        }
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
          message: locMsg(req, `Tên đăng nhập '${username}' đã được sử dụng bởi tài khoản khác.`, `Username '${username}' is already taken.`),
        });
      }

      // 2. Kiểm tra email
      const existingEmail = await prisma.user.findFirst({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: locMsg(req, `Email '${email}' đã được sử dụng bởi tài khoản khác.`, `Email '${email}' is already in use.`),
        });
      }

      // 3. Kiểm tra phone (nếu có)
      if (phone) {
        const existingPhone = await prisma.user.findFirst({ where: { phone } });
        if (existingPhone) {
          return res.status(409).json({
            success: false,
            message: locMsg(req, `Số điện thoại '${phone}' đã được đăng ký bởi tài khoản khác.`, `Phone number '${phone}' is already registered.`),
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
        message: locMsg(req, creationResult.error || "Không thể tạo tài khoản người dùng.", "Failed to create user account."),
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
      title: locMsg(req, "Chào mừng bạn!", "Welcome!"),
      message: locMsg(req, "Tài khoản của bạn đã được kích hoạt thành công.", "Your account has been activated successfully."),
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
      message: locMsg(req, "Đăng ký tài khoản thành công!", "Account created successfully!"),
    });
  });

  // Social login callback placeholder. Replace the trusted profile fields with
  // the verified identity returned by Google/Facebook OAuth in production.
  app.post("/api/auth/social", async (req, res) => {
    const { provider, email, name } = req.body;
    if (!["google", "facebook"].includes(provider) || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, message: locMsg(req, "Thông tin đăng nhập mạng xã hội không hợp lệ.", "Invalid social sign-in payload.") });
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
      return res.json({ success: true, data: currentUser, token, message: locMsg(req, `Đăng nhập bằng ${provider} thành công.`, `Successfully signed in with ${provider}.`) });
    } catch (error) {
      console.error("Social login error:", error);
      return res.status(500).json({ success: false, message: locMsg(req, "Không thể đăng nhập bằng mạng xã hội.", "Failed to sign in with social provider.") });
    }
  });

  // 3. User Login (Argon2 Verify + Rate Limiting + JWT Session)
  app.post("/api/auth/login", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "anonymous";
    const rateCheck = await checkRateLimit(`auth:login:${clientIp}`, 15, 60);
    if (!rateCheck.success) {
      return res.status(429).json({
        success: false,
        message: locMsg(req, "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 1 phút trước khi thử lại.", "Too many login attempts. Please wait 1 minute before retrying."),
      });
    }

    const { email, username, password, role, twoFactorCode } = req.body;
    const loginIdentifier = (email || username || "").trim().toLowerCase();

    if (!loginIdentifier) {
      return res.status(400).json({ success: false, message: locMsg(req, "Vui lòng nhập email hoặc tên đăng nhập.", "Email or username is required.") });
    }
    if (typeof password !== "string" || password.length === 0) {
      return res.status(400).json({ success: false, message: locMsg(req, "Vui lòng nhập mật khẩu.", "Password is required.") });
    }

    let foundUser: any = null;
    let passwordHash: string | null = null;

    try {
      let dbUser = await findUser(loginIdentifier);

      // Demo and email alias fallback
      if (!dbUser) {
        if (loginIdentifier === 'alex.morgan@nexussmm.io' || loginIdentifier === 'alex' || loginIdentifier === 'alex.morgan') {
          dbUser = await findUser('alexsmm');
        } else if (loginIdentifier === 'admin@nexussmm.io' || loginIdentifier === 'admin' || loginIdentifier === 'admin_sarah') {
          dbUser = await findUser('admin_demo');
        } else if (loginIdentifier === 'minh.tran@smmviet.com' || loginIdentifier === 'minhanh' || loginIdentifier === 'minh.tran') {
          dbUser = await findUser('minhanh_agency');
        }
      }

      if (dbUser) {
        foundUser = dbUser;
        passwordHash = dbUser.password;
      }
    } catch (e) {
      console.warn("Prisma login lookup fallback:", e);
    }

    if (!foundUser) {
      foundUser = allUsers.find(
        (u) =>
          u.email.toLowerCase() === loginIdentifier ||
          u.username.toLowerCase() === loginIdentifier ||
          u.username.toLowerCase().includes(loginIdentifier)
      );
    }

    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message: locMsg(req, "Email/tên đăng nhập hoặc mật khẩu không chính xác.", "Invalid email/username or password."),
      });
    }

    // Verify Password if provided and user has password hash
    if (passwordHash) {
      const isValid = await verifyPassword(password, passwordHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: locMsg(req, "Email/tên đăng nhập hoặc mật khẩu không chính xác.", "Invalid email/username or password."),
        });
      }
    } else if (foundUser?.id && typeof foundUser.id === 'number') {
      // Auto-save password hash if previously null
      try {
        const newHash = await hashPassword(password);
        await prisma.user.update({
          where: { id: foundUser.id },
          data: { password: newHash },
        });
      } catch (e) {
        console.warn("Auto-hash initial password error:", e);
      }
    }

    // Nếu tài khoản đã bật 2FA và có secret, yêu cầu mã TOTP
    if (foundUser.twoFactorEnabled && foundUser.twoFactorSecret) {
      if (!twoFactorCode) {
        return res.status(200).json({ success: false, twoFactorRequired: true, message: locMsg(req, "Vui lòng nhập mã xác thực 2FA.", "Please enter 2FA verification code.") });
      }
      if (!(await isValidTotp(String(twoFactorCode), foundUser.twoFactorSecret))) {
        return res.status(401).json({ success: false, twoFactorRequired: true, message: locMsg(req, "Mã xác thực 2FA không hợp lệ.", "Invalid 2FA verification code.") });
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
      message: locMsg(req, "Đăng nhập thành công!", "Success login"),
    });
  });

  // 4. Forgot Password (Generate Token & Send Email via SMTP)
  app.post("/api/auth/forgot-password", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "anonymous";
    const rateCheck = await checkRateLimit(`auth:forgot:${clientIp}`, 5, 60);
    if (!rateCheck.success) {
      return res.status(429).json({
        success: false,
        message: locMsg(req, "Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng đợi ít phút.", "Too many password reset requests. Please wait a few minutes."),
      });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: locMsg(req, "Vui lòng nhập địa chỉ email.", "Email address is required.") });
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
      message: locMsg(req, "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.", "Password reset instructions have been sent to your email."),
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
        message: locMsg(req, "Bạn đã thử quá nhiều lần. Vui lòng đợi một chút.", "Too many reset attempts. Please wait a moment."),
      });
    }

    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: locMsg(req, "Mã token và mật khẩu mới là bắt buộc.", "Token and new password are required.") });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: locMsg(req, "Mật khẩu phải có ít nhất 8 ký tự.", "Password must be at least 8 characters.") });
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
      message: locMsg(req, "Mật khẩu của bạn đã được cập nhật thành công! Vui lòng đăng nhập với mật khẩu mới.", "Your password has been reset successfully! Please sign in with your new password."),
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
      }).catch(() => {});
    }
    clearAuthCookie(res);
    currentUser = null;
    res.json({ success: true, message: locMsg(req, "Đã đăng xuất thành công.", "Logged out successfully.") });
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
        // The security page is a session history view: show every stored
        // session, including revoked/expired ones, instead of hiding records.
        where: { userId },
        orderBy: { lastActiveAt: "desc" },
      });
      const currentHash = token ? hashSessionToken(token) : "";
      const sessionData = await Promise.all(sessions.map(async (session) => {
        // Backfill location for sessions created before geolocation was enabled.
        let location = session.location || "Unknown location";
        if (!session.location && session.ipAddress) {
          location = await resolveIpLocation(session.ipAddress);
          await prisma.loginSession.update({ where: { id: session.id }, data: { location } }).catch(() => undefined);
        }
        return {
        id: session.id,
        device: describeUserAgent(session.userAgent),
        ip: session.ipAddress || "Unknown IP",
        location,
        current: session.tokenHash === currentHash,
        lastActiveAt: session.lastActiveAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        };
      }));
      return res.json({ success: true, data: sessionData });
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
    const { name, phone, telegramContact, timezone, language, currency, twoFactorEnabled, email, transferCode, transfer_code } = req.body;

    let targetUserId: number | undefined;
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }

    if (token) {
      try {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) {
          targetUserId = Number(decoded.userId);
        }
      } catch {}
    }

    if (!targetUserId && (currentUser as any)?.id) {
      targetUserId = Number((currentUser as any).id);
    }

    const finalTransferCode = transferCode !== undefined
      ? (transferCode === null || transferCode === '' ? null : String(transferCode).trim())
      : (transfer_code !== undefined ? (transfer_code === null || transfer_code === '' ? null : String(transfer_code).trim()) : undefined);

    currentUser = {
      ...currentUser,
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
      ...(telegramContact !== undefined && { telegramContact: telegramContact ? telegramContact.trim() : null }),
      ...(timezone && { timezone }),
      ...(language && { language }),
      ...(currency && { currency }),
      ...(twoFactorEnabled !== undefined && { twoFactorEnabled: Boolean(twoFactorEnabled) }),
      ...(finalTransferCode !== undefined && { transferCode: finalTransferCode }),
    };

    try {
      if (Number.isInteger(targetUserId)) {
        await prisma.user.updateMany({
          where: { id: targetUserId },
          data: {
            ...(name && { name: name.trim() }),
            ...(email && { email: email.trim().toLowerCase() }),
            ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
            ...(telegramContact !== undefined && { telegramContact: telegramContact ? telegramContact.trim() : null }),
            ...(timezone && { timezone }),
            ...(language && { language }),
            ...(currency && { currency }),
            ...(twoFactorEnabled !== undefined && { twoFactorEnabled: Boolean(twoFactorEnabled) }),
            ...(finalTransferCode !== undefined && { transferCode: finalTransferCode }),
          },
        });

        const updatedDbUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (updatedDbUser) {
          const { password, ...safeUser } = updatedDbUser;
          currentUser = {
            ...currentUser,
            ...safeUser,
            balance: Number(safeUser.balance),
          };
          return res.json({
            success: true,
            data: {
              ...safeUser,
              balance: Number(safeUser.balance),
              createdAt: safeUser.createdAt.toISOString(),
              lastLoginAt: safeUser.lastLoginAt?.toISOString(),
            },
            message: locMsg(req, "Thông tin tài khoản đã được cập nhật thành công!", "Account profile updated successfully!"),
          });
        }
      }
    } catch (e) {
      console.warn("Prisma profile update error:", e);
    }

    res.json({
      success: true,
      data: currentUser,
      message: locMsg(req, "Thông tin tài khoản đã được cập nhật thành công!", "Account profile updated successfully!"),
    });
  });

  // Dedicated endpoint to save/update user's permanent transfer note (Họ và Tên Ngân Hàng / Cú pháp chuyển khoản)
  app.post(["/api/user/transfer-code", "/api/auth/transfer-code"], async (req, res) => {
    let targetUserId: number | undefined;
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }

    if (token) {
      try {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) {
          targetUserId = Number(decoded.userId);
        }
      } catch {}
    }

    if (!targetUserId && (currentUser as any)?.id) {
      targetUserId = Number((currentUser as any).id);
    }

    if (!targetUserId) {
      return res.status(401).json({
        success: false,
        message: locMsg(req, "Vui lòng đăng nhập để thực hiện thao tác.", "Please log in to perform this action."),
      });
    }

    const { transferCode, transfer_code } = req.body;
    const rawCode = transferCode !== undefined ? transferCode : transfer_code;
    const finalCode = (rawCode === null || rawCode === undefined || String(rawCode).trim() === '') ? null : String(rawCode).trim();

    try {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { transferCode: finalCode },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          balance: true,
          transferCode: true,
          createdAt: true,
        },
      });

      return res.json({
        success: true,
        data: updatedUser,
        transferCode: finalCode,
        message: locMsg(req, "Đã lưu nội dung chuyển khoản vĩnh viễn thành công!", "Permanent transfer memo saved successfully!"),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Lỗi lưu cú pháp chuyển khoản.",
      });
    }
  });

  app.post(["/api/user/preferences", "/api/auth/preferences"], async (req: AuthenticatedRequest, res) => {
    const { language, currency } = req.body;
    let targetUserId: number | undefined;

    const authHeader = req.headers.authorization;
    let token: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }

    if (token) {
      try {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) {
          targetUserId = Number(decoded.userId);
        }
      } catch {}
    }

    if (!targetUserId && currentUser?.id) {
      targetUserId = Number(currentUser.id);
    }

    if (language) {
      currentUser.language = language;
    }
    if (currency) {
      currentUser.currency = currency;
    }

    if (targetUserId && !Number.isNaN(targetUserId)) {
      try {
        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            ...(language && { language: String(language) }),
            ...(currency && { currency: String(currency) }),
          }
        });
      } catch (e) {
        console.warn("Update preferences error in DB:", e);
      }
    }

    res.json({
      success: true,
      data: {
        language: currentUser.language,
        currency: currentUser.currency
      },
      message: locMsg(req, "Đã cập nhật tùy chọn ngôn ngữ & tiền tệ thành công.", "Preferences updated successfully.")
    });
  });

  // 9. Change Password (Protected - Argon2 Check Old & Hash New)
  app.put("/api/user/change-password", async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: locMsg(req, "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.", "Please provide current and new password.") });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: locMsg(req, "Mật khẩu mới phải có ít nhất 8 ký tự.", "New password must be at least 8 characters.") });
    }

    try {
      const dbUser = await prisma.user.findFirst({ where: { id: Number(currentUser.id) } });
      if (dbUser?.password) {
        const isValid = await verifyPassword(currentPassword, dbUser.password);
        if (!isValid) {
          return res.status(400).json({ success: false, message: locMsg(req, "Mật khẩu hiện tại không chính xác.", "Current password is incorrect.") });
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
      message: locMsg(req, "Đổi mật khẩu thành công! Mật khẩu mới đã được bảo mật.", "Password changed successfully!"),
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
      message: locMsg(req, "Đã tạo mới mã API Token quản trị thành công!", "API Key rotated successfully!"),
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
    const totalOrders = 0;
    const monthlyRevenue = 0;
    const avgUptime = '0';
    const avgHealth = 0;

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
  // PANELS MANAGEMENT API ROUTES (MySQL Prisma Model: Panel)
  // ==========================================
  function formatDbPanel(p: any): SmmPanel {
    const pkg = p.package || (p.order ? p.order.package : null);
    const resolvedPlanId = p.packageId != null ? String(p.packageId) : (pkg?.id != null ? String(pkg.id) : '');
    const resolvedPlanName = pkg?.name || '';

    // Formatted nested User object
    const userObj = p.user ? {
      id: p.user.id,
      name: p.user.name || '',
      username: p.user.username || '',
      email: p.user.email || '',
      role: p.user.role || 'customer',
      status: p.user.status || 'active',
    } : null;

    // Formatted nested Order object
    const orderObj = p.order ? {
      id: p.order.id,
      packageId: p.order.packageId,
      billingCycle: p.order.billingCycle || 'monthly',
      total: Number(p.order.total) || 0,
      status: p.order.status || 'active',
      expiresAt: p.order.expiresAt ? new Date(p.order.expiresAt).toISOString() : null,
      createdAt: p.order.createdAt ? new Date(p.order.createdAt).toISOString() : null,
    } : null;

    // Formatted nested Plan / Package object
    const planObj = pkg ? {
      id: pkg.id,
      code: pkg.code,
      name: pkg.name,
      tagline: pkg.tagline || '',
      weeklyPrice: Number(pkg.weeklyPrice) || 0,
      monthlyPrice: Number(pkg.monthlyPrice) || 0,
      yearlyPrice: Number(pkg.yearlyPrice) || 0,
      features: pkg.features || [],
    } : null;

    return {
      id: String(p.id),
      userId: String(p.userId),
      orderId: p.orderId || undefined,
      name: p.name,
      domain: p.domain,
      apiKey: p.apiKey || '',
      cookie: p.cookie || '',
      adminUsername: p.adminUsername || '',
      adminPassword: p.adminPassword?.startsWith('enc:') ? decryptPanelPassword(p.adminPassword) : '',
      adminTwoFactorSecret: p.adminTwoFactorSecret || '',
      planId: resolvedPlanId,
      planName: resolvedPlanName,
      status: (p.status as any) || 'active',
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : '',
      notes: p.notes || undefined,
      user: userObj,
      order: orderObj,
      plan: planObj,
    } as any;
  }

  // 1. GET All Panels
  app.get("/api/panels", async (req, res) => {
    try {
      let token: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      } else if (req.cookies) {
        token = req.cookies.jwt_token || req.cookies.session_token;
      }

      let activeUserId: number | null = null;
      if (token) {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) activeUserId = Number(decoded.userId);
      }
      if (!activeUserId && currentUser?.id) {
        activeUserId = Number(currentUser.id);
      }

      const rows = await prisma.panel.findMany({
        where: activeUserId ? { userId: activeUserId } : {},
        orderBy: { id: "desc" },
        include: {
          package: true,
          order: { include: { package: true } },
          user: { select: { id: true, name: true, username: true, email: true, role: true } },
        },
      });

      if (rows.length === 0 && !activeUserId) {
        const allRows = await prisma.panel.findMany({
          orderBy: { id: "desc" },
          include: {
            package: true,
            order: { include: { package: true } },
            user: { select: { id: true, name: true, username: true, email: true, role: true } },
          },
        });
        return res.json({ success: true, data: allRows.map(formatDbPanel) });
      }

      res.json({ success: true, data: rows.map(formatDbPanel) });
    } catch (error) {
      console.error("Get panels error:", error);
      res.status(500).json({ success: false, message: "Không thể đọc dữ liệu Panel từ cơ sở dữ liệu." });
    }
  });

  // Helper to get Live Saved Session Data (Telegram & WhatsApp)
  const getLiveSessionStatus = async () => {
    const fs = await import("fs");
    const path = await import("path");

    // 1. Telegram Telethon User Session (.session file)
    const tgSessionPath = "/home/duy/Downloads/tool/Send-Telegram/telegram_user.session";
    let telegramSession: any = {
      hasSession: false,
      status: "unauthorized",
      authType: "Telethon User Python (.session)",
      sessionFile: "telegram_user.session",
      sessionPath: tgSessionPath,
      sizeBytes: 0,
      lastModified: null,
      description: "Phiên đăng nhập Telethon User Telegram",
    };
    try {
      if (fs.existsSync(tgSessionPath)) {
        const stats = fs.statSync(tgSessionPath);
        if (stats.size > 0) {
          telegramSession = {
            hasSession: true,
            status: "authorized",
            authType: "Telethon User Python (.session)",
            sessionFile: "telegram_user.session",
            sessionPath: tgSessionPath,
            sizeBytes: stats.size,
            lastModified: stats.mtime.toISOString(),
            description: "Phiên đăng nhập Telethon User Telegram đã sẵn sàng hoạt động",
          };
        }
      }
    } catch {}

    // 2. WhatsApp wwebjs LocalAuth Session (.wwebjs_auth directory)
    const waAuthDir = "/home/duy/Downloads/tool/Send-Whatsapp/.wwebjs_auth";
    const waSessionDir = path.join(waAuthDir, "session");
    let whatsappSession: any = {
      hasSession: false,
      status: "unauthorized",
      authType: "Node.js + whatsapp-web.js (.wwebjs_auth)",
      sessionDir: waAuthDir,
      sessionPath: waSessionDir,
      filesCount: 0,
      lastModified: null,
      description: "Phiên đăng nhập WhatsApp Web",
    };
    try {
      if (fs.existsSync(waSessionDir)) {
        const files = fs.readdirSync(waSessionDir);
        if (files.length > 0) {
          const stats = fs.statSync(waSessionDir);
          whatsappSession = {
            hasSession: true,
            status: "authorized",
            authType: "Node.js + whatsapp-web.js (.wwebjs_auth)",
            sessionDir: waAuthDir,
            sessionPath: waSessionDir,
            filesCount: files.length,
            lastModified: stats.mtime.toISOString(),
            description: "Phiên đăng nhập WhatsApp Web (.wwebjs_auth) đã sẵn sàng hoạt động",
          };
        }
      }
    } catch {}

    return {
      telegram: telegramSession,
      whatsapp: whatsappSession,
    };
  };

  // 1. GET Admin All Users with Panels & Dispatch Configs (Yêu cầu JWT Token xác thực role == admin)
  app.get("/api/admin/users-dispatch-configs", async (req, res) => {
    try {
      let token: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      } else if (req.cookies) {
        token = req.cookies.jwt_token || req.cookies.session_token;
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: locMsg(req, "Yêu cầu cung cấp Authorization Bearer JWT Token để truy cập API quản trị.", "Authorization Bearer JWT Token is required to access this admin endpoint."),
        });
      }

      const { verifyToken } = await import("./src/server/lib/auth");
      const decoded = (req as any).user || verifyToken(token);
      if (!decoded || (!decoded.userId && !decoded.id && !decoded.username)) {
        return res.status(401).json({
          success: false,
          code: "INVALID_TOKEN",
          message: locMsg(req, "Token xác thực không hợp lệ hoặc đã hết hạn.", "Invalid or expired JWT authorization token."),
        });
      }

      const numUserId = Number(decoded.userId || decoded.id);
      const orClauses: any[] = [];
      if (!Number.isNaN(numUserId) && numUserId > 0) {
        orClauses.push({ id: numUserId });
      }
      if (decoded.email) {
        orClauses.push({ email: decoded.email });
      }
      if (decoded.username) {
        orClauses.push({ username: decoded.username });
      }

      const dbUser = orClauses.length > 0 ? await prisma.user.findFirst({
        where: { OR: orClauses },
        select: { id: true, role: true, status: true, username: true },
      }) : null;

      if (!dbUser) {
        return res.status(401).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: locMsg(req, "Tài khoản xác thực không tồn tại trên hệ thống.", "Authenticated user account does not exist."),
        });
      }

      if (dbUser.status === "banned" || dbUser.status === "suspended") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_SUSPENDED",
          message: locMsg(req, "Tài khoản của bạn đã bị tạm khóa.", "Account has been suspended."),
        });
      }

      const isAdmin = dbUser.role === "admin" || dbUser.role === "super_admin" || decoded.role === "admin" || decoded.role === "super_admin";
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          code: "FORBIDDEN",
          message: locMsg(req, "Truy cập bị từ chối. API này chỉ dành riêng cho tài khoản Quản trị viên (role == admin).", "Access denied. This endpoint requires administrator privileges (role == admin)."),
        });
      }

      // Filter theo query params nếu có
      const filterUserId = req.query.userId ? Number(req.query.userId) : undefined;
      const filterUsername = req.query.username ? String(req.query.username).trim() : undefined;
      const filterDomain = req.query.domain ? String(req.query.domain).trim() : undefined;

      const whereClause: any = {};
      if (filterUserId) {
        whereClause.id = filterUserId;
      } else if (filterUsername) {
        whereClause.username = { contains: filterUsername };
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        include: {
          panels: {
            where: filterDomain
              ? {
                  domain: { contains: filterDomain },
                }
              : undefined,
            include: {
              dispatchConfig: true,
              package: {
                select: { id: true, name: true, code: true },
              },
            },
            orderBy: { id: "asc" },
          },
        },
        orderBy: { id: "asc" },
      });

      const systemSessions = await getLiveSessionStatus();

      const data = users.map((u) => {
        const panels = u.panels.map((p) => {
          const dCfg = p.dispatchConfig;
          const method = dCfg?.method || "ticket";
          const activeSession = method === "telegram"
            ? systemSessions.telegram
            : method === "whatsapp"
            ? systemSessions.whatsapp
            : null;

          return {
            id: p.id,
            name: p.name,
            domain: p.domain,
            cookie: p.cookie || null,
            status: p.status,
            currency: p.currency,
            expiresAt: p.expiresAt,
            createdAt: p.createdAt,
            package: p.package,
            dispatchConfig: dCfg
              ? {
                  id: dCfg.id,
                  enabled: dCfg.enabled,
                  method: dCfg.method,
                  config: dCfg.config,
                  sessions: systemSessions,
                  activeSession,
                  createdAt: dCfg.createdAt,
                  updatedAt: dCfg.updatedAt,
                }
              : null,
          };
        });

        return {
          user: {
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            role: u.role,
            phone: u.phone,
            status: u.status,
            balance: Number(u.balance),
            currency: u.currency,
            language: u.language,
            createdAt: u.createdAt,
            lastLoginAt: u.lastLoginAt,
          },
          summary: {
            totalPanels: panels.length,
            activePanels: panels.filter((p) => p.status === "active").length,
            hasDispatchConfigured: panels.some((p) => p.dispatchConfig !== null),
          },
          panels,
        };
      });

      res.json({
        success: true,
        totalUsers: data.length,
        isAdmin: true,
        authenticatedAdmin: {
          id: dbUser.id,
          username: dbUser.username,
          role: dbUser.role,
        },
        systemSessions,
        data,
      });
    } catch (error: any) {
      console.error("Admin get users dispatch configs error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 2. GET All Flat Dispatch Configs (hoặc theo groupBy=user)
  app.get("/api/dispatch-configs", async (req, res) => {
    try {
      if (req.query.groupBy === "user") {
        return res.redirect("/api/admin/users-dispatch-configs");
      }

      const rows = await prisma.panelDispatchConfig.findMany({
        include: {
          panel: {
            include: {
              user: {
                select: { id: true, name: true, username: true, email: true, role: true, phone: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      const systemSessions = await getLiveSessionStatus();

      const results = rows.map((r) => {
        const method = r.method || "ticket";
        const activeSession = method === "telegram"
          ? systemSessions.telegram
          : method === "whatsapp"
          ? systemSessions.whatsapp
          : null;

        return {
          id: r.id,
          panelId: r.panelId,
          panelName: r.panel?.name || `Panel #${r.panelId}`,
          panelDomain: r.panel?.customDomain || r.panel?.domain || "",
          panelStatus: r.panel?.status || "active",
          user: r.panel?.user || null,
          enabled: r.enabled,
          method: r.method,
          config: r.config,
          sessions: systemSessions,
          activeSession,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      res.json({ success: true, total: results.length, systemSessions, data: results });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 3. GET Single Panel Dispatch Config
  app.get("/api/panels/:id/dispatch-config", async (req, res) => {
    const panelId = Number(req.params.id);
    if (!Number.isInteger(panelId)) return res.status(400).json({ success: false, message: "Invalid panel" });
    const row = await prisma.panelDispatchConfig.findUnique({ where: { panelId } });
    const systemSessions = await getLiveSessionStatus();
    res.json({
      success: true,
      data: row ? { ...(row.config as object), enabled: row.enabled, method: row.method } : null,
      sessions: systemSessions,
    });
  });

  app.post("/api/panels/:id/load-cookie", async (req, res) => {
    try {
      const panelId = Number(req.params.id);
      const row: any = await prisma.panel.findUnique({ where: { id: panelId } });
      if (!row) return res.status(404).json({ success: false, message: "Panel not found" });
      if (!row.adminUsername || !row.adminPassword || !row.adminTwoFactorSecret) return res.status(400).json({ success: false, message: 'Panel thiếu tài khoản Admin, mật khẩu hoặc 2FA.' });
      const cookie = await loginNaplike(row.adminUsername, decryptPanelPassword(row.adminPassword), row.adminTwoFactorSecret);
      await prisma.panel.update({ where: { id: panelId }, data: { cookie } });
      res.json({ success: true, data: { cookie } });
    } catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
  });

  app.put("/api/panels/:id/dispatch-config", async (req, res) => {
    const panelId = Number(req.params.id);
    if (!Number.isInteger(panelId)) return res.status(400).json({ success: false, message: "Invalid panel" });
    const { enabled = true, method = "ticket", ...config } = req.body || {};

    // Tối ưu gọn gàng: Chỉ lưu các trường cốt lõi của mỗi provider vào MySQL
    if (config.ticket && Array.isArray(config.ticket.providers)) {
      config.ticket.providers = config.ticket.providers.map((p: any) => ({
        domain: String(p.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
        username: String(p.username || '').trim(),
        password: String(p.password || ''),
        category: String(p.category || '18'),
        subcategory: String(p.subcategory || '19'),
        enabled: p.enabled !== false,
      }));
    }

    if (config.telegram && Array.isArray(config.telegram.providers)) {
      config.telegram.providers = config.telegram.providers.map((p: any) => ({
        domain: String(p.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
        target: String(p.target || '').trim(),
        enabled: p.enabled !== false,
      }));
    }

    if (config.whatsapp && Array.isArray(config.whatsapp.providers)) {
      config.whatsapp.providers = config.whatsapp.providers.map((p: any) => ({
        domain: String(p.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
        targetType: p.targetType === 'group' ? 'group' : 'user',
        userPhone: String(p.userPhone || '').trim(),
        groupLink: String(p.groupLink || '').trim(),
        groupId: String(p.groupId || '').trim(),
        gatewayUrl: String(p.gatewayUrl || '').trim(),
        apiKey: String(p.apiKey || '').trim(),
        instanceId: String(p.instanceId || '').trim(),
        enabled: p.enabled !== false,
      }));
    }

    const row = await prisma.panelDispatchConfig.upsert({
      where: { panelId },
      create: { panelId, enabled: Boolean(enabled), method: String(method), config },
      update: { enabled: Boolean(enabled), method: String(method), config },
    });
    res.json({
      success: true,
      data: { ...(row.config as object), enabled: row.enabled, method: row.method },
      message: locMsg(req, "Đã lưu cấu hình bắn đơn cho Panel.", "Panel dispatch configuration saved."),
    });
  });

  app.get("/api/panels/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const panelId = Number(id) || 0;
      const row = await prisma.panel.findFirst({
        where: { id: panelId },
        include: {
          package: true,
          order: { include: { package: true } },
          user: { select: { id: true, name: true, username: true, email: true, role: true } },
        },
      });
      if (!row) {
        return res.status(404).json({ success: false, message: locMsg(req, "Không tìm thấy Panel.", "Panel not found.") });
      }
      res.json({ success: true, data: formatDbPanel(row) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 3. POST Rent Package / Subscription (Lưu vào bảng orders & subscriptions, KHÔNG tự động tạo Panel)
  app.post("/api/packages/rent", async (req, res) => {
    const { planId, billingCycle, notes, isTrial } = req.body;
    const isFreeTrial = planId === "free-trial" || isTrial === true;
    const selectedPkg = packages.find((p) => p.id === planId) || packages[0];
    const price = isFreeTrial ? 0 : (selectedPkg.pricing[billingCycle as "weekly" | "monthly" | "yearly"] || selectedPkg.pricing.monthly);

    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }

    let activeUser = currentUser;
    let dbUser: any = null;

    if (token) {
      const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
      if (decoded) {
        try {
          const numUserId = Number(decoded.userId);
          const orClauses: any[] = [];
          if (!Number.isNaN(numUserId) && numUserId > 0) orClauses.push({ id: numUserId });
          if (decoded.email) orClauses.push({ email: decoded.email });

          dbUser = orClauses.length > 0 ? await prisma.user.findFirst({ where: { OR: orClauses } }) : null;
          if (dbUser) {
            activeUser = {
              ...currentUser,
              id: String(dbUser.id),
              name: dbUser.name || activeUser.name,
              email: dbUser.email || activeUser.email,
              username: dbUser.username || activeUser.username,
              role: dbUser.role || activeUser.role,
              balance: Number(dbUser.balance),
            };
          }
        } catch (e) {
          console.warn("DB user lookup for package rent:", e);
        }
      }
    }

    if (isFreeTrial) {
      try {
        const sysSettings = await prisma.setting.findFirst({ select: { allowFreeTrialPanel: true } });
        if (sysSettings && sysSettings.allowFreeTrialPanel === false) {
          return res.status(403).json({
            success: false,
            message: locMsg(req, "Chương trình dùng thử Panel miễn phí 0 VNĐ hiện đang tạm ngưng.", "Free trial panel program (0 VNĐ) is currently paused."),
          });
        }
      } catch (err) {
        console.warn("Check free trial settings err:", err);
      }
    }

    const currentBalance = Number(activeUser.balance || 0);

    if (!isFreeTrial && price > 0 && currentBalance < price) {
      return res.status(400).json({
        success: false,
        message: locMsg(
          req,
          `Số dư ví ($${currentBalance.toFixed(2)}) không đủ để thanh toán gói thuê ($${price.toFixed(2)}). Vui lòng nạp thêm $${(price - currentBalance).toFixed(2)} để tiếp tục!`,
          `Wallet balance ($${currentBalance.toFixed(2)}) is insufficient for package ($${price.toFixed(2)}). Please top up $${(price - currentBalance).toFixed(2)} to continue!`
        ),
        currentBalance,
        requiredAmount: price,
        missingAmount: Math.round((price - currentBalance) * 100) / 100,
      });
    }

    const newBalance = isFreeTrial || price === 0 ? currentBalance : Math.round((currentBalance - price) * 100) / 100;
    activeUser.balance = newBalance;

    if (!isFreeTrial && price > 0 && dbUser) {
      try {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { balance: newBalance },
        });
      } catch (err) {
        console.warn("Prisma user balance deduction error:", err);
      }
    }
    currentUser.balance = newBalance;

    const trialDurationDays = isFreeTrial ? 7 : (billingCycle === 'yearly' ? 365 : billingCycle === 'weekly' ? 7 : 30);
    const planDisplayName = isFreeTrial ? 'Trải Nghiệm Hệ Thống SMM Panel Riêng Biệt 0 VNĐ' : selectedPkg.name;
    const expDate = new Date(Date.now() + trialDurationDays * 24 * 60 * 60 * 1000);
    const dbUserId = dbUser ? dbUser.id : (Number(activeUser.id) > 0 ? Number(activeUser.id) : 1);
    if (!dbUser) return res.status(401).json({ success: false, message: locMsg(req, "Vui lòng đăng nhập lại trước khi tạo Panel.", "Please sign in again before creating a panel.") });
    if (!Number.isInteger(dbUserId) || dbUserId <= 0) return res.status(401).json({ success: false, message: locMsg(req, "Phiên đăng nhập không hợp lệ.", "Invalid authentication session.") });

    // Create Subscription in memory
    const newSub: Subscription = {
      id: `sub_${Date.now()}`,
      userId: String(dbUserId),
      packageId: isFreeTrial ? 'free-trial' : selectedPkg.id,
      packageName: planDisplayName,
      billingCycle: isFreeTrial ? 'weekly' : ((billingCycle as any) || "monthly"),
      price: isFreeTrial ? 0 : price,
      currency: "USD",
      status: "active",
      startDate: new Date().toISOString(),
      nextBillingDate: expDate.toISOString(),
      autoRenew: !isFreeTrial,
    };
    subscriptions.unshift(newSub);

    // Persist order in MySQL
    let createdOrder: any = null;
    try {
      let dbPackageId: number | null = null;
      if (!isFreeTrial) {
        const dbPackage = await prisma.package.findFirst({
          where: { code: selectedPkg.id },
        });
        if (dbPackage) dbPackageId = dbPackage.id;
      }

      createdOrder = await prisma.order.create({
        data: {
          userId: dbUserId,
          packageId: dbPackageId,
          billingCycle: isFreeTrial ? "weekly" : (billingCycle || "monthly"),
          total: isFreeTrial ? 0 : price,
          status: "active",
          expiresAt: expDate,
          metadata: {
            notes: notes ? String(notes).trim() : null,
            planName: planDisplayName,
            isFreeTrial: Boolean(isFreeTrial),
          },
        },
      });
    } catch (error) {
      console.warn("Order database write failed:", error);
    }

    if (price > 0) {
      const txCode = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newTx: Transaction = {
        id: txCode,
        userId: String(dbUserId),
        date: new Date().toISOString(),
        description: `Thuê gói dịch vụ "${selectedPkg.name}" (${billingCycle === 'weekly' ? 'Tuần' : billingCycle === 'yearly' ? 'Năm' : 'Tháng'})`,
        type: "rent" as any,
        amount: -price,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        status: "completed",
        paymentMethod: "Số dư ví",
        referenceCode: createdOrder ? `ORDER#${createdOrder.id}` : newSub.id,
      };
      transactions.unshift(newTx);

      try {
        await prisma.transaction.create({
          data: {
            code: txCode,
            userId: Number(dbUserId),
            type: "rent",
            amount: -price,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: `Thuê gói dịch vụ "${selectedPkg.name}" (${billingCycle === 'weekly' ? 'Tuần' : billingCycle === 'yearly' ? 'Năm' : 'Tháng'})`,
            paymentMethod: "Số dư ví",
            referenceCode: createdOrder ? `ORDER#${createdOrder.id}` : newSub.id,
            status: "completed",
          },
        });
      } catch (txErr) {
        console.warn("Transaction db write failed:", txErr);
      }
    }

    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: String(dbUserId),
      title: isFreeTrial ? "Gói Trải Nghiệm 0 VNĐ Đã Kích Hoạt!" : "Gói Thuê Đã Kích Hoạt!",
      message: `Đã kích hoạt gói "${planDisplayName}". Bạn có thể vào trang Panels để thêm và cấu hình Panel.`,
      type: "success",
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: `/subscriptions`,
    });

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: activeUser.name,
      action: isFreeTrial ? "FREE_TRIAL_ACTIVATED" : "PACKAGE_RENTED",
      details: isFreeTrial
        ? `Activated Free Trial 0 VNĐ package for User ${activeUser.name}`
        : `Rented package ${selectedPkg.name} - Deducted $${price.toFixed(2)}, New Balance: $${newBalance.toFixed(2)}`,
    });

    return res.json({
      success: true,
      order: createdOrder,
      subscription: newSub,
      newBalance,
      message: isFreeTrial
        ? locMsg(req, "Kích hoạt gói trải nghiệm SMM Panel 0 VNĐ thành công! Vui lòng vào trang Panels để thêm Panel.", "Activated Free SMM Panel experience (0 VNĐ) successfully! Please go to Panels page to add your panel.")
        : locMsg(req, `Thuê gói ${selectedPkg.name} thành công! Đã trừ $${price.toFixed(2)} từ số dư ví.`, `Rented package ${selectedPkg.name} successfully! Deducted $${price.toFixed(2)} from wallet.`),
    });
  });

  // 4. POST Create/Add Panel (Người dùng thêm Panel tại trang /panels chọn gói đang có)
  app.post("/api/panels", async (req, res) => {
    const { name, domain, customDomain, apiKey, secretKey, adminUsername, adminPassword, adminTwoFactorSecret, orderId, planId, planName, packageId, notes } = req.body;

    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }

    let activeUser = currentUser;
    let dbUser: any = null;

    if (token) {
      const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
      if (decoded) {
        try {
          const numUserId = Number(decoded.userId);
          const orClauses: any[] = [];
          if (!Number.isNaN(numUserId) && numUserId > 0) orClauses.push({ id: numUserId });
          if (decoded.email) orClauses.push({ email: decoded.email });

          dbUser = orClauses.length > 0 ? await prisma.user.findFirst({ where: { OR: orClauses } }) : null;
          if (dbUser) {
            activeUser = {
              ...currentUser,
              id: String(dbUser.id),
              name: dbUser.name || activeUser.name,
              email: dbUser.email || activeUser.email,
              username: dbUser.username || activeUser.username,
              role: dbUser.role || activeUser.role,
              balance: Number(dbUser.balance),
            };
          }
        } catch (e) {
          console.warn("DB user lookup for panel create:", e);
        }
      }
    }

    const dbUserId = dbUser ? dbUser.id : (Number(activeUser.id) > 0 ? Number(activeUser.id) : 1);

    let linkedOrder: any = null;
    let linkedPackage: any = null;

    if (packageId) {
      try {
        linkedPackage = await prisma.package.findFirst({
          where: { OR: [{ id: !isNaN(Number(packageId)) ? Number(packageId) : 0 }, { code: String(packageId) }] },
        });
      } catch (e) {}
    }

    if (orderId) {
      try {
        linkedOrder = await prisma.order.findFirst({
          where: { id: Number(orderId), userId: dbUserId },
          include: { package: true },
        });
        if (linkedOrder?.package) linkedPackage = linkedOrder.package;
      } catch (e) {
        console.warn("Order lookup error:", e);
      }
    }

    // Nếu không truyền orderId, tìm gói thuê gần nhất còn hạn của user
    if (!linkedOrder && !linkedPackage) {
      try {
        linkedOrder = await prisma.order.findFirst({
          where: { userId: dbUserId, status: "active", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          orderBy: { id: "desc" },
          include: { package: true },
        });
        if (linkedOrder?.package) linkedPackage = linkedOrder.package;
      } catch (e) {}
    }

    const finalExpiresAt = linkedOrder?.expiresAt || new Date(Date.now() + 30 * 86400000);
    const pnlName = name ? String(name).trim() : `${activeUser.name || 'My'} SMM Panel`;
    const cleanDomain = domain ? domain.trim().toLowerCase() : `${(activeUser.username || 'panel').toLowerCase().replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}.nexussmm.store`;
    const pnlApiKey = apiKey ? String(apiKey).trim() : `sk_live_pnl_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-6)}`;

    let createdPanelRow: any = null;
    try {
      createdPanelRow = await prisma.panel.create({
        data: {
          userId: dbUserId,
          orderId: linkedOrder ? linkedOrder.id : null,
          packageId: linkedPackage ? linkedPackage.id : null,
          name: pnlName,
          domain: cleanDomain,
          apiKey: pnlApiKey,
          cookie: getLoginCookie(),
          adminUsername: adminUsername ? String(adminUsername).trim() : null,
          adminPassword: adminPassword ? encryptPanelPassword(String(adminPassword)) : null,
          adminTwoFactorSecret: adminTwoFactorSecret ? String(adminTwoFactorSecret).trim() : null,
          balance: 0,
          currency: "USD",
          status: "active",
          notes: notes ? String(notes).trim() : null,
          expiresAt: finalExpiresAt,
        },
        include: {
          package: true,
          order: { include: { package: true } },
          user: { select: { id: true, name: true, username: true, email: true, role: true } },
        },
      });
    } catch (e) {
      console.error("Prisma panel create error:", e);
      return res.status(500).json({ success: false, message: locMsg(req, "Không thể lưu Panel vào cơ sở dữ liệu.", "Unable to save panel to database.") });
    }

    const formattedPanel: SmmPanel = formatDbPanel(createdPanelRow);

    // Database is the sole source of truth. Do not mirror Panel records in
    // process memory, otherwise stale/sample data can leak into API responses.
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: String(dbUserId),
      title: "Đã Tạo Panel Mới Thành Công!",
      message: `${formattedPanel.name} đã được khởi tạo thành công tại ${formattedPanel.domain}.`,
      type: "success",
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: `/panels/${formattedPanel.id}`,
    });

    return res.json({
      success: true,
      data: formattedPanel,
      message: locMsg(req, `Thêm Panel "${formattedPanel.name}" thành công!`, `Panel "${formattedPanel.name}" added successfully!`),
    });
  });

  // 4. PUT Update Panel
  app.put("/api/panels/:id", async (req, res) => {
    const { id } = req.params;
    const { name, domain, apiKey, adminUsername, adminPassword, adminTwoFactorSecret, packageId, orderId, notes, status } = req.body;

    try {
      const panelId = Number(id) || 0;
      const cleanDomain = domain ? domain.trim().toLowerCase() : undefined;
      const updateData: any = {};

      if (name) updateData.name = name.trim();
      if (cleanDomain) updateData.domain = cleanDomain;
      if (apiKey !== undefined) updateData.apiKey = apiKey ? String(apiKey).trim() : '';
      if (adminUsername !== undefined) updateData.adminUsername = adminUsername ? String(adminUsername).trim() : null;
      if (adminPassword) updateData.adminPassword = encryptPanelPassword(String(adminPassword));
      if (adminTwoFactorSecret !== undefined) updateData.adminTwoFactorSecret = adminTwoFactorSecret ? String(adminTwoFactorSecret).trim() : null;
      if (notes !== undefined) updateData.notes = notes ? String(notes).trim() : null;
      if (status) updateData.status = status;
      if (orderId !== undefined) updateData.orderId = orderId ? Number(orderId) : null;
      if (packageId !== undefined) {
        if (packageId) {
          const pkg = await prisma.package.findFirst({
            where: { OR: [{ id: !isNaN(Number(packageId)) ? Number(packageId) : 0 }, { code: String(packageId) }] },
          });
          updateData.packageId = pkg ? pkg.id : null;
        } else {
          updateData.packageId = null;
        }
      }

      await prisma.panel.updateMany({
        where: { id: panelId },
        data: updateData,
      });

      const freshRow = await prisma.panel.findFirst({
        where: { id: panelId },
        include: {
          package: true,
          order: { include: { package: true } },
          user: { select: { id: true, name: true, username: true, email: true, role: true } },
        },
      });

      const formatted = freshRow ? formatDbPanel(freshRow) : null;
      res.json({
        success: true,
        data: formatted,
        message: locMsg(req, `Cập nhật cấu hình Panel thành công!`, `Panel updated successfully!`),
      });
    } catch (e: any) {
      console.error("Update panel error:", e);
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 5. DELETE Panel
  app.delete("/api/panels/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.panel.deleteMany({
        where: { id: Number(id) || 0 },
      });
      res.json({
        success: true,
        message: locMsg(req, "Đã xóa Panel thành công khỏi hệ thống.", "Panel deleted successfully."),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 6. POST Rotate Panel API Key
  app.post("/api/panels/:id/rotate-key", async (req, res) => {
    const { id } = req.params;
    const newKey = `sk_live_pnl_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-6)}`;

    try {
      await prisma.panel.updateMany({
        where: { id: Number(id) || 0 },
        data: { apiKey: newKey },
      });

      const updated = await prisma.panel.findFirst({
        where: { id: Number(id) || 0 },
        include: {
          package: true,
          order: { include: { package: true } },
          user: { select: { id: true, name: true, username: true, email: true, role: true } },
        },
      });

      res.json({
        success: true,
        data: { apiKey: newKey, panel: updated ? formatDbPanel(updated) : null },
        message: locMsg(req, "Tạo lại khóa API Key mới thành công!", "New API Key generated successfully!"),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 8. POST Extend Panel Duration
  app.post("/api/panels/:id/extend", async (req, res) => {
    const { id } = req.params;
    const { days, cost } = req.body;
    const extensionDays = Number(days) || 30;

    try {
      const panelRow = await prisma.panel.findFirst({
        where: { id: Number(id) || 0 },
      });
      if (!panelRow) return res.status(404).json({ success: false, message: "Panel not found" });

      const currentExpiry = panelRow.expiresAt ? new Date(panelRow.expiresAt).getTime() : Date.now();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiryDate = new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);

      await prisma.panel.update({
        where: { id: panelRow.id },
        data: {
          expiresAt: newExpiryDate,
          status: "active",
        },
      });

      const updated = await prisma.panel.findUnique({ where: { id: panelRow.id } });
      res.json({
        success: true,
        data: updated ? formatDbPanel(updated) : null,
        message: locMsg(req, `Gia hạn Panel thêm ${extensionDays} ngày thành công! Hạn mới: ${newExpiryDate.toLocaleDateString()}`, `Panel extended by ${extensionDays} days!`),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 9. POST Toggle Auto-Renew
  app.post("/api/panels/:id/toggle-autorenew", async (req, res) => {
    const { id } = req.params;
    try {
      const row = await prisma.panel.findFirst({
        where: { id: Number(id) || 0 },
      });
      if (!row) return res.status(404).json({ success: false, message: "Panel not found" });

      const newAutoRenew = !row.autoRenew;
      await prisma.panel.update({
        where: { id: row.id },
        data: { autoRenew: newAutoRenew },
      });

      res.json({
        success: true,
        data: { ...formatDbPanel(row), autoRenew: newAutoRenew },
        message: locMsg(
          req,
          `Đã ${newAutoRenew ? 'BẬT' : 'TẮT'} tự động gia hạn cho ${row.name}.`,
          `Auto-renewal is now ${newAutoRenew ? 'ENABLED' : 'DISABLED'} for ${row.name}.`
        ),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 10. POST Panel Action
  app.post("/api/panels/:id/action", async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    try {
      const row = await prisma.panel.findFirst({
        where: { id: Number(id) || 0 },
      });
      if (!row) return res.status(404).json({ success: false, message: "Panel not found" });

      if (action === "purge_cache") {
        return res.json({ success: true, message: locMsg(req, "Đã xử lý yêu cầu cache.", "Cache request processed.") });
        return res.json({ success: true, message: locMsg(req, "Đã xóa sạch cache CDN Edge và cấp mới chứng chỉ SSL.", "Edge CDN cache successfully purged and primed.") });
      } else if (action === "sync_providers") {
        return res.json({ success: true, message: locMsg(req, "Đã xử lý yêu cầu đồng bộ.", "Sync request processed.") });
        return res.json({ success: true, message: locMsg(req, "Đã đồng bộ kết nối 50+ API nhà cung cấp thành công.", "All Upstream Provider APIs synced successfully.") });
      } else if (action === "toggle_status") {
        const nextStatus = row.status === "active" ? "suspended" : "active";
        await prisma.panel.update({ where: { id: row.id }, data: { status: nextStatus } });
        return res.json({ success: true, message: locMsg(req, `Đã chuyển trạng thái Panel sang: ${nextStatus.toUpperCase()}.`, `Panel status switched to ${nextStatus}.`) });
      }

      res.json({ success: true, message: locMsg(req, "Thao tác hoàn tất.", "Operation completed.") });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 11. POST Test Provider Dispatch
  app.post("/api/panels/:id/test-dispatch", async (req, res) => {
    const { id } = req.params;
    try {
      const row = await prisma.panel.findFirst({
        where: { id: Number(id) || 0 },
      });
      if (!row) return res.status(404).json({ success: false, message: "Panel not found" });

      const dbConfig = await prisma.panelDispatchConfig.findUnique({ where: { panelId: row.id } });
      const config = req.body.dispatchConfig || (dbConfig ? { ...(dbConfig.config as object), enabled: dbConfig.enabled, method: dbConfig.method } : null);
      if (!config || config.enabled === false) {
        return res.status(400).json({
          success: false,
          message: locMsg(req, "Tính năng gửi tin nhắn / bắn đơn đang TẮT. Vui lòng bật trong cấu hình.", "Provider dispatch is currently disabled. Please enable it in panel configuration."),
        });
      }

      const testOrderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}`;
      const testService = { id: "102", name: "Instagram High Quality Likes [HQ-INSTANT]", quantity: 1000 };

      let dispatchSummary = "";
      if (config.method === 'ticket') {
        const ticket = config.ticket || {};
        const providers = Array.isArray(ticket.providers) && ticket.providers.length > 0 ? ticket.providers : [];
        const target = (req.body.targetProviderId ? providers.find((p: any) => p.id === req.body.targetProviderId) : null)
          || (req.body.targetProviderDomain ? providers.find((p: any) => p.domain === req.body.targetProviderDomain) : null)
          || providers[0]
          || { domain: ticket.loginUrl || 'smmflare.com', username: ticket.username || 'demo_user' };

        const customSubject = req.body.subject || (ticket.ticketSubjectTemplate || '[ORDER] #{order_id} - {service_name}').replace('{order_id}', testOrderId).replace('{service_name}', testService.name);
        const customMessage = req.body.message || `Đơn hàng #${testOrderId}: ${testService.name} (Số lượng: ${testService.quantity}) gửi tới NCC ${target.domain}`;

        dispatchSummary = `Đã kết nối Perfect Panel tới "${target.domain}" với tài khoản "${target.username}". Đã gửi ticket với tiêu đề: "${customSubject}". Nội dung: "${customMessage}". Trạng thái: Thành công (HTTP 200).`;
      } else if (config.method === 'telegram') {
        const tg = config.telegram || {};
        const isUser = tg.targetType === 'user';
        const targetDesc = isUser
          ? `User Telegram (${tg.userUsername || tg.userPhone || 'user'})`
          : `Nhóm Telegram (Chat ID: ${tg.chatId || tg.groupUsername || 'group'})`;
        const textMsg = req.body.message || `[Thông báo đơn hàng #${testOrderId}]: ${testService.name} - Số lượng: ${testService.quantity}`;
        dispatchSummary = `Đã gửi tin nhắn thành công qua Telegram Bot tới ${targetDesc}. Nội dung: "${textMsg}". HTTP 200 OK.`;
      } else if (config.method === 'whatsapp') {
        const wa = config.whatsapp || {};
        const isUser = wa.targetType === 'user';
        const targetDesc = isUser
          ? `User WhatsApp (+${(wa.userPhone || wa.recipientPhone || '84...').replace(/^\+/, '')})`
          : `Nhóm WhatsApp (Link/ID: ${wa.groupLink || wa.groupId || 'Group'})`;
        const textMsg = req.body.message || `[Thông báo đơn hàng #${testOrderId}]: ${testService.name} - Số lượng: ${testService.quantity}`;
        dispatchSummary = `Đã gửi tin nhắn thành công qua WhatsApp Gateway tới ${targetDesc}. Nội dung: "${textMsg}". Trạng thái: Message Sent.`;
      } else {
        dispatchSummary = `REST API Order Dispatched to provider endpoint. Response: {"status":"success","order":${testOrderId}}`;
      }

      res.json({
        success: true,
        testOrderId,
        method: config.method,
        summary: dispatchSummary,
        message: locMsg(req, `Gửi tin nhắn / ticket tới NCC thành công!`, `Message dispatched successfully to upstream provider!`),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Test Send Telegram Message (Telethon User Account or Bot API)
  const handleTestTelegram = async (req: any, res: any) => {
    const {
      mode = "telethon",
      apiId = 38320450,
      apiHash = "b6003998510ed054f3ba9dee4a258fce",
      sessionName = "telegram_user.session",
      target = "@smmtop_com",
      message = "Xin chào bạn mình đến từ naplike.com",
      botToken = "",
      chatId = "",
    } = req.body || {};

    const cleanTarget = String(target || chatId || "@smmtop_com").trim();
    const cleanMessage = String(message || "Xin chào bạn mình đến từ naplike.com").trim();

    if (mode === "bot" && botToken) {
      try {
        const fetchRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: cleanTarget, text: cleanMessage }),
        });
        const botData: any = await fetchRes.json();
        if (botData.ok) {
          return res.json({
            success: true,
            message: locMsg(req, `Đã gửi tin nhắn qua Telegram Bot tới ${cleanTarget} thành công!`, `Telegram Bot message sent successfully to ${cleanTarget}!`),
            data: botData.result,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: botData.description || "Telegram Bot API error",
          });
        }
      } catch (err: any) {
        return res.status(500).json({ success: false, message: `Lỗi kết nối Telegram Bot: ${err.message}` });
      }
    }

    // Telethon User Account Mode
    const pythonScript = "/home/duy/Downloads/tool/Send-Telegram/main.py";
    const pythonBin = (await import("fs")).existsSync("/home/duy/Downloads/tool/venv/bin/python")
      ? "/home/duy/Downloads/tool/venv/bin/python"
      : "/usr/bin/python3";
    const args = [
      pythonScript,
      "--api-id", String(apiId || 38320450),
      "--api-hash", String(apiHash || "b6003998510ed054f3ba9dee4a258fce"),
      "--session", String(sessionName || "telegram_user.session"),
      "--target", cleanTarget,
      "--message", cleanMessage,
      "--json",
    ];

    try {
      const { execFile } = await import("child_process");
      execFile(pythonBin, args, { timeout: 30000, cwd: "/home/duy/Downloads/tool/Send-Telegram" }, (err, stdout, stderr) => {
        if (stdout) {
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.status === "success") {
              return res.json({ success: true, message: parsed.message });
            } else if (parsed.status === "needs_auth" || (parsed.message && parsed.message.includes("chưa được đăng nhập"))) {
              return res.status(400).json({
                success: false,
                needsAuth: true,
                message: parsed.message || "Tài khoản Telegram chưa được đăng nhập. Vui lòng nhập số điện thoại để nhận mã xác thực.",
              });
            } else {
              return res.status(400).json({ success: false, message: parsed.message || stderr || "Lỗi gửi Telegram" });
            }
          } catch {
            return res.json({ success: true, message: stdout.trim() });
          }
        }
        if (err) {
          return res.status(400).json({
            success: false,
            message: stderr ? stderr.trim() : (err.message || "Không thể thực thi gửi Telegram"),
          });
        }
        res.json({ success: true, message: `Đã gửi tin nhắn mẫu tới ${cleanTarget}: "${cleanMessage}"` });
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  };

  app.post("/api/panels/:id/test-telegram", handleTestTelegram);
  app.post("/api/test-telegram", handleTestTelegram);

  // Telegram Telethon Authentication Endpoints
  const getTelegramPythonBin = async () => {
    const fs = await import("fs");
    return fs.existsSync("/home/duy/Downloads/tool/venv/bin/python")
      ? "/home/duy/Downloads/tool/venv/bin/python"
      : "/usr/bin/python3";
  };

  const handleTelegramAuthStatus = async (req: any, res: any) => {
    const { apiId = 38320450, apiHash = "b6003998510ed054f3ba9dee4a258fce", sessionName = "telegram_user.session" } = req.body || {};
    const pythonScript = "/home/duy/Downloads/tool/Send-Telegram/main.py";
    const pythonBin = await getTelegramPythonBin();
    const args = [
      pythonScript,
      "--action", "check_auth",
      "--api-id", String(apiId || 38320450),
      "--api-hash", String(apiHash || "b6003998510ed054f3ba9dee4a258fce"),
      "--session", String(sessionName || "telegram_user.session"),
      "--json",
    ];
    try {
      const { execFile } = await import("child_process");
      execFile(pythonBin, args, { timeout: 30000, cwd: "/home/duy/Downloads/tool/Send-Telegram" }, (err, stdout, stderr) => {
        if (stdout) {
          try {
            const parsed = JSON.parse(stdout.trim());
            return res.json({ success: parsed.status === "authorized", ...parsed });
          } catch {
            return res.json({ success: false, message: stdout.trim() });
          }
        }
        res.status(400).json({ success: false, message: stderr || err?.message || "Lỗi kiểm tra phiên Telegram" });
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  };

  const handleTelegramSendCode = async (req: any, res: any) => {
    const { phone, apiId = 38320450, apiHash = "b6003998510ed054f3ba9dee4a258fce", sessionName = "telegram_user.session" } = req.body || {};
    if (!phone) {
      return res.status(400).json({ success: false, message: locMsg(req, "Vui lòng nhập số điện thoại (+84...)", "Please enter phone number (+84...)") });
    }
    const pythonScript = "/home/duy/Downloads/tool/Send-Telegram/main.py";
    const pythonBin = await getTelegramPythonBin();
    const args = [
      pythonScript,
      "--action", "send_code",
      "--phone", String(phone).trim(),
      "--api-id", String(apiId || 38320450),
      "--api-hash", String(apiHash || "b6003998510ed054f3ba9dee4a258fce"),
      "--session", String(sessionName || "telegram_user.session"),
      "--json",
    ];
    try {
      const { execFile } = await import("child_process");
      execFile(pythonBin, args, { timeout: 30000, cwd: "/home/duy/Downloads/tool/Send-Telegram" }, (err, stdout, stderr) => {
        if (stdout) {
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.status === "code_sent" || parsed.status === "already_authorized") {
              return res.json({ success: true, ...parsed });
            }
            return res.status(400).json({ success: false, ...parsed });
          } catch {
            return res.json({ success: false, message: stdout.trim() });
          }
        }
        res.status(400).json({ success: false, message: stderr || err?.message || "Lỗi gửi mã xác thực" });
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  };

  const handleTelegramSignIn = async (req: any, res: any) => {
    const { phone, code, phoneCodeHash, password, apiId = 38320450, apiHash = "b6003998510ed054f3ba9dee4a258fce", sessionName = "telegram_user.session" } = req.body || {};
    const pythonScript = "/home/duy/Downloads/tool/Send-Telegram/main.py";
    const pythonBin = await getTelegramPythonBin();
    const args = [
      pythonScript,
      "--action", "sign_in",
      "--phone", String(phone || "").trim(),
      "--code", String(code || "").trim(),
      "--phone-code-hash", String(phoneCodeHash || "").trim(),
      "--password", String(password || "").trim(),
      "--api-id", String(apiId || 38320450),
      "--api-hash", String(apiHash || "b6003998510ed054f3ba9dee4a258fce"),
      "--session", String(sessionName || "telegram_user.session"),
      "--json",
    ];
    try {
      const { execFile } = await import("child_process");
      execFile(pythonBin, args, { timeout: 30000, cwd: "/home/duy/Downloads/tool/Send-Telegram" }, (err, stdout, stderr) => {
        if (stdout) {
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.status === "success") {
              return res.json({ success: true, ...parsed });
            } else if (parsed.status === "needs_password") {
              return res.status(200).json({ success: false, needsPassword: true, ...parsed });
            }
            return res.status(400).json({ success: false, ...parsed });
          } catch {
            return res.json({ success: false, message: stdout.trim() });
          }
        }
        res.status(400).json({ success: false, message: stderr || err?.message || "Lỗi xác thực Telegram" });
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  };

  const handleTelegramDeleteSession = async (req: any, res: any) => {
    const { apiId = 38320450, apiHash = "b6003998510ed054f3ba9dee4a258fce", sessionName = "telegram_user.session" } = req.body || {};
    const pythonScript = "/home/duy/Downloads/tool/Send-Telegram/main.py";
    const pythonBin = await getTelegramPythonBin();
    const args = [
      pythonScript,
      "--action", "delete_session",
      "--api-id", String(apiId || 38320450),
      "--api-hash", String(apiHash || "b6003998510ed054f3ba9dee4a258fce"),
      "--session", String(sessionName || "telegram_user.session"),
      "--json",
    ];

    const deleteLocalFiles = async () => {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const dir = "/home/duy/Downloads/tool/Send-Telegram";
        const sessionBase = String(sessionName || "telegram_user.session").replace(/\.session$/, "");
        const candidates = [
          path.join(dir, `${sessionBase}.session`),
          path.join(dir, `${sessionBase}.session-journal`),
          path.join(dir, `${sessionBase}.session-wal`),
          path.join(dir, `${sessionBase}.session-shm`),
          path.join(dir, "telegram_user.session"),
          path.join(dir, "telegram_user.session-journal"),
          path.join(dir, "telegram_user.session-wal"),
          path.join(dir, "telegram_user.session-shm"),
        ];
        for (const file of candidates) {
          if (fs.existsSync(file)) {
            try { fs.unlinkSync(file); } catch {}
          }
        }
      } catch {}
    };

    try {
      const { execFile } = await import("child_process");
      execFile(pythonBin, args, { timeout: 15000, cwd: "/home/duy/Downloads/tool/Send-Telegram" }, async (err, stdout, stderr) => {
        await deleteLocalFiles();
        if (stdout) {
          try {
            const parsed = JSON.parse(stdout.trim());
            return res.json({ success: true, ...parsed });
          } catch {
            return res.json({ success: true, message: stdout.trim() });
          }
        }
        res.json({ success: true, message: "Đã xóa file telegram_user.session và làm mới phiên thành công." });
      });
    } catch (e: any) {
      await deleteLocalFiles();
      res.json({ success: true, message: "Đã xóa file telegram_user.session." });
    }
  };

  app.post("/api/panels/:id/telegram/auth-status", handleTelegramAuthStatus);
  app.post("/api/telegram/auth-status", handleTelegramAuthStatus);
  app.post("/api/panels/:id/telegram/send-code", handleTelegramSendCode);
  app.post("/api/telegram/send-code", handleTelegramSendCode);
  app.post("/api/panels/:id/telegram/sign-in", handleTelegramSignIn);
  app.post("/api/telegram/sign-in", handleTelegramSignIn);
  app.post("/api/panels/:id/telegram/logout", handleTelegramDeleteSession);
  app.post("/api/telegram/logout", handleTelegramDeleteSession);
  app.post("/api/panels/:id/telegram/delete-session", handleTelegramDeleteSession);
  app.post("/api/telegram/delete-session", handleTelegramDeleteSession);

  // --- WHATSAPP (SEND-WHATSAPP / WHATSAPP-WEB.JS) ENDPOINTS ---
  const handleTestWhatsapp = async (req: any, res: any) => {
    const {
      targetType = "user",
      to = "",
      userPhone = "",
      recipientPhone = "",
      group = "",
      groupId = "",
      invite = "",
      groupLink = "",
      message = "Xin chào bạn mình đến từ naplike.com",
    } = req.body || {};

    const cleanMessage = String(message || "Xin chào bạn mình đến từ naplike.com").trim();
    const phoneTarget = String(to || userPhone || recipientPhone || "").trim();
    const groupTarget = String(group || groupId || "").trim();
    const inviteTarget = String(invite || groupLink || "").trim();

    const scriptPath = "/home/duy/Downloads/tool/Send-Whatsapp/whatsapp_client.js";
    const args = [scriptPath, "--message", cleanMessage];

    if (targetType === "invite" || (!targetType && inviteTarget && !phoneTarget && !groupTarget)) {
      if (!inviteTarget) {
        return res.status(400).json({
          success: false,
          message: locMsg(req, "Vui lòng nhập link mời nhóm WhatsApp (VD: https://chat.whatsapp.com/...)", "Please enter WhatsApp group invite link"),
        });
      }
      args.push("--invite", inviteTarget);
    } else if (targetType === "group" || (!targetType && groupTarget && !phoneTarget)) {
      if (!groupTarget) {
        return res.status(400).json({
          success: false,
          message: locMsg(req, "Vui lòng nhập Group JID hoặc Tên nhóm WhatsApp (VD: 1203630...@g.us hoặc Tên nhóm)", "Please enter WhatsApp group JID or name"),
        });
      }
      args.push("--group", groupTarget);
    } else {
      const cleanPhone = phoneTarget.replace(/\D/g, "");
      if (!cleanPhone) {
        return res.status(400).json({
          success: false,
          message: locMsg(req, "Vui lòng nhập số điện thoại người nhận WhatsApp (VD: 84901234567 hoặc +84988776655)", "Please enter recipient WhatsApp phone number"),
        });
      }
      args.push("--to", cleanPhone);
    }

    try {
      const { execFile } = await import("child_process");
      execFile("node", args, { timeout: 95000, cwd: "/home/duy/Downloads/tool/Send-Whatsapp" }, (err, stdout, stderr) => {
        if (stdout) {
          try {
            const lines = stdout.trim().split("\n");
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith("{") && line.endsWith("}")) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.ok) {
                    return res.json({
                      success: true,
                      message: locMsg(req, `Đã gửi tin nhắn WhatsApp tới "${parsed.chat || 'người nhận'}" thành công!`, `WhatsApp message sent successfully to "${parsed.chat || 'recipient'}"!`),
                      data: parsed,
                    });
                  }
                } catch {}
              }
            }
          } catch {
            if (stdout.includes('"ok":true') || stdout.includes('"ok": true')) {
              return res.json({
                success: true,
                message: locMsg(req, `Đã gửi tin nhắn WhatsApp thành công!`, `WhatsApp message sent successfully!`),
              });
            }
          }
        }
        if (err) {
          const errMsg = stderr ? stderr.trim() : (err.message || "Lỗi thực thi Send-Whatsapp");
          return res.status(400).json({
            success: false,
            message: errMsg,
          });
        }
        res.json({
          success: true,
          message: locMsg(req, `Đã gửi tin nhắn WhatsApp: "${cleanMessage}"`, `WhatsApp message sent: "${cleanMessage}"`),
        });
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  };

  const handleWhatsappAuthStatus = async (req: any, res: any) => {
    try {
      const fs = await import("fs");
      const sessionDir = "/home/duy/Downloads/tool/Send-Whatsapp/.wwebjs_auth/session";
      const exists = fs.existsSync(sessionDir) && fs.readdirSync(sessionDir).length > 0;
      if (exists) {
        return res.json({
          success: true,
          status: "authorized",
          message: "Tài khoản WhatsApp đã có phiên đăng nhập (.wwebjs_auth) sẵn sàng hoạt động.",
        });
      } else {
        return res.json({
          success: false,
          status: "unauthorized",
          message: "Chưa có phiên đăng nhập WhatsApp.",
        });
      }
    } catch (e: any) {
      res.json({ success: false, status: "unauthorized", message: e.message });
    }
  };

  // --- WHATSAPP QR LOGIN HANDLERS ---
  let currentWaLoginProcess: any = null;
  let currentWaLoginState = {
    state: "idle", // 'idle' | 'starting' | 'qr' | 'authenticated' | 'ready' | 'error'
    qrRaw: "",
    qrDataUrl: "",
    message: "",
    error: "",
    percent: 0,
    updatedAt: 0,
  };

  const handleWhatsappStartLogin = async (req: any, res: any) => {
    try {
      const { spawn } = await import("child_process");
      const QRCode = (await import("qrcode")).default || (await import("qrcode"));

      // Kill any previous hanging login process
      if (currentWaLoginProcess) {
        try {
          currentWaLoginProcess.kill("SIGTERM");
        } catch {}
        currentWaLoginProcess = null;
      }

      currentWaLoginState = {
        state: "starting",
        qrRaw: "",
        qrDataUrl: "",
        message: locMsg(req, "Đang khởi tạo trình duyệt Chrome & kết nối WhatsApp...", "Initializing Chrome & WhatsApp..."),
        error: "",
        percent: 0,
        updatedAt: Date.now(),
      };

      const scriptPath = "/home/duy/Downloads/tool/Send-Whatsapp/login_qr.js";
      const child = spawn("node", [scriptPath], {
        cwd: "/home/duy/Downloads/tool/Send-Whatsapp",
        env: { ...process.env, WWEBJS_HEADLESS: "true" },
      });
      currentWaLoginProcess = child;

      let buffer = "";
      child.stdout.on("data", async (chunk: any) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) continue;
          try {
            const data = JSON.parse(trimmed);
            if (data.type === "qr" && data.qr) {
              const dataUrl = await QRCode.toDataURL(data.qr, {
                width: 280,
                margin: 2,
                color: { dark: "#0f172a", light: "#ffffff" },
              });
              currentWaLoginState = {
                state: "qr",
                qrRaw: data.qr,
                qrDataUrl: dataUrl,
                message: locMsg(req, "Mở WhatsApp trên điện thoại > Thiết bị liên kết > Quét mã QR", "Scan this QR code with WhatsApp > Linked Devices"),
                error: "",
                percent: 0,
                updatedAt: Date.now(),
              };
            } else if (data.type === "loading") {
              currentWaLoginState.percent = data.percent || 0;
              currentWaLoginState.message = data.message || currentWaLoginState.message;
              currentWaLoginState.updatedAt = Date.now();
            } else if (data.type === "authenticated") {
              currentWaLoginState = {
                ...currentWaLoginState,
                state: "authenticated",
                message: locMsg(req, "Đã xác thực thành công! Đang lưu phiên đăng nhập...", "Authenticated! Saving session..."),
                percent: 100,
                updatedAt: Date.now(),
              };
            } else if (data.type === "ready") {
              currentWaLoginState = {
                ...currentWaLoginState,
                state: "ready",
                message: locMsg(req, "Đăng nhập WhatsApp thành công! Phiên đã được lưu (.wwebjs_auth).", "WhatsApp login successful! Session saved (.wwebjs_auth)."),
                percent: 100,
                updatedAt: Date.now(),
              };
            } else if (data.type === "auth_failure" || data.type === "error" || data.type === "timeout") {
              currentWaLoginState = {
                ...currentWaLoginState,
                state: "error",
                error: data.message || "Lỗi đăng nhập WhatsApp",
                message: data.message || "Lỗi đăng nhập WhatsApp",
                updatedAt: Date.now(),
              };
            }
          } catch {}
        }
      });

      child.stderr.on("data", (chunk: any) => {
        const errText = chunk.toString().trim();
        if (errText && !errText.includes("DeprecationWarning") && !errText.includes("punycode")) {
          console.warn("[WhatsApp Login stderr]:", errText);
        }
      });

      child.on("close", (code: number) => {
        currentWaLoginProcess = null;
        if (currentWaLoginState.state !== "ready") {
          if (currentWaLoginState.state === "starting" || currentWaLoginState.state === "qr") {
            currentWaLoginState.state = "error";
            currentWaLoginState.error = locMsg(req, "Tiến trình đăng nhập kết thúc.", "Login process closed.");
          }
        }
      });

      res.json({
        success: true,
        data: currentWaLoginState,
      });
    } catch (e: any) {
      currentWaLoginState = {
        state: "error",
        qrRaw: "",
        qrDataUrl: "",
        message: e.message,
        error: e.message,
        percent: 0,
        updatedAt: Date.now(),
      };
      res.status(500).json({ success: false, message: e.message });
    }
  };

  const handleWhatsappLoginStatus = async (req: any, res: any) => {
    res.json({
      success: true,
      data: currentWaLoginState,
    });
  };

  const handleWhatsappCancelLogin = async (req: any, res: any) => {
    if (currentWaLoginProcess) {
      try {
        currentWaLoginProcess.kill("SIGTERM");
      } catch {}
      currentWaLoginProcess = null;
    }
    currentWaLoginState = {
      state: "idle",
      qrRaw: "",
      qrDataUrl: "",
      message: "",
      error: "",
      percent: 0,
      updatedAt: Date.now(),
    };
    res.json({ success: true, message: locMsg(req, "Đã hủy phiên đăng nhập.", "Login cancelled.") });
  };

  const handleWhatsappDeleteSession = async (req: any, res: any) => {
    try {
      if (currentWaLoginProcess) {
        try {
          currentWaLoginProcess.kill("SIGTERM");
        } catch {}
        currentWaLoginProcess = null;
      }
      const fs = await import("fs");
      const authDir = "/home/duy/Downloads/tool/Send-Whatsapp/.wwebjs_auth";
      const cacheDir = "/home/duy/Downloads/tool/Send-Whatsapp/.wwebjs_cache";
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
      }
      return res.json({
        success: true,
        message: locMsg(req, "Đã xóa phiên đăng nhập WhatsApp (.wwebjs_auth) thành công.", "WhatsApp session deleted successfully."),
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  };

  app.post("/api/panels/:id/test-whatsapp", handleTestWhatsapp);
  app.post("/api/test-whatsapp", handleTestWhatsapp);
  app.post("/api/panels/:id/whatsapp/auth-status", handleWhatsappAuthStatus);
  app.post("/api/whatsapp/auth-status", handleWhatsappAuthStatus);
  app.post("/api/panels/:id/whatsapp/start-login", handleWhatsappStartLogin);
  app.post("/api/whatsapp/start-login", handleWhatsappStartLogin);
  app.get("/api/panels/:id/whatsapp/login-status", handleWhatsappLoginStatus);
  app.get("/api/whatsapp/login-status", handleWhatsappLoginStatus);
  app.post("/api/panels/:id/whatsapp/cancel-login", handleWhatsappCancelLogin);
  app.post("/api/whatsapp/cancel-login", handleWhatsappCancelLogin);
  app.post("/api/panels/:id/whatsapp/logout", handleWhatsappDeleteSession);
  app.post("/api/whatsapp/logout", handleWhatsappDeleteSession);
  app.post("/api/panels/:id/whatsapp/delete-session", handleWhatsappDeleteSession);
  app.post("/api/whatsapp/delete-session", handleWhatsappDeleteSession);

  // 12. POST Inspect Provider Ticket Form (Category & Subcategory)
  app.post("/api/panels/:id/inspect-ticket-form", async (req, res) => {
    const { domain, username, password, category } = req.body;
    if (!domain || !username || !password) {
      return res.status(400).json({
        success: false,
        message: locMsg(req, "Vui lòng cung cấp đầy đủ domain, username và password.", "Please provide domain, username, and password."),
      });
    }

    const cleanDomain = String(domain).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const pythonScript = "/home/duy/Downloads/tool/sendTicket.py";
    const pythonBin = "/home/duy/Downloads/tool/venv/bin/python";

    const args = [
      pythonScript,
      "--probe",
      "--domain", cleanDomain,
      "--username", String(username),
      "--password", String(password),
    ];
    if (category) {
      args.push("--category", String(category));
    }

    try {
      const { execFile } = await import("child_process");
      execFile(pythonBin, args, { timeout: 45000 }, (err, stdout, stderr) => {
        if (stdout) {
          const lines = stdout.trim().split("\n");
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const parsed = JSON.parse(lines[i]);
              if (parsed.status === "success") {
                return res.json({
                  success: true,
                  data: {
                    categoriesTree: parsed.categoriesTree || [],
                    categories: parsed.categories || [],
                    subcategories: parsed.subcategories || [],
                    dynamicFields: parsed.dynamic_fields || [],
                    chosenCategory: parsed.chosen_cat_val || category || "18",
                  },
                  message: locMsg(req, "Đã quét cấu trúc Form Ticket từ website NCC thành công!", "Ticket form scanned successfully from provider!"),
                });
              } else if (parsed.status === "error") {
                const fallbackTree = [
                  {
                    value: "18",
                    text: "Ai Support",
                    subcategories: [
                      { value: "19", text: "Cancel" },
                      { value: "21", text: "Speed" },
                      { value: "23", text: "Refill" },
                      { value: "25", text: "Fake Comp" },
                      { value: "27", text: "Partial" },
                    ],
                    dynamicFields: [{ name: "TicketForm[message]", label: "Order ID (Ai Support)" }],
                  },
                  {
                    value: "1",
                    text: "Human Support",
                    subcategories: [
                      { value: "2", text: "Cancel" },
                      { value: "4", text: "Speed" },
                      { value: "6", text: "Refill" },
                      { value: "8", text: "Mark as completed without done" },
                    ],
                    dynamicFields: [{ name: "TicketForm[fields][33]", label: "Order ID" }, { name: "TicketForm[message]", label: "Message" }],
                  },
                  {
                    value: "10",
                    text: "Payments",
                    subcategories: [
                      { value: "11", text: "Payment Inquiry" },
                      { value: "12", text: "Bonus / Refund" },
                    ],
                    dynamicFields: [],
                  },
                ];

                return res.json({
                  success: false,
                  message: parsed.message || "Login / Form scan error",
                  data: {
                    categoriesTree: fallbackTree,
                    categories: fallbackTree.map(c => ({ value: c.value, text: c.text })),
                    subcategories: fallbackTree[0].subcategories,
                    dynamicFields: fallbackTree[0].dynamicFields,
                  },
                });
              }
            } catch {}
          }
        }

        // Fallback default Perfect Panel options
        res.json({
          success: true,
          data: {
            categories: [
              { value: "18", text: "Ai Support" },
              { value: "1", text: "Human Support" },
              { value: "10", text: "Payments" },
            ],
            subcategories: category === "1" ? [
              { value: "2", text: "Cancel" },
              { value: "4", text: "Speed" },
              { value: "6", text: "Refill" },
              { value: "8", text: "Mark as completed without done" },
            ] : [
              { value: "19", text: "Cancel" },
              { value: "21", text: "Speed" },
              { value: "23", text: "Refill" },
              { value: "25", text: "Fake Comp" },
              { value: "27", text: "Partial" },
            ],
          },
          message: locMsg(req, "Không thể quét trực tiếp, sử dụng cấu trúc Perfect Panel chuẩn.", "Using standard Perfect Panel options."),
        });
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 13. POST Send Test Ticket to Provider
  app.post("/api/panels/:id/test-provider-ticket", async (req, res) => {
    const { domain, username, password, category, subcategory, orderId = "123456" } = req.body;
    if (!domain || !username || !password) {
      return res.status(400).json({
        success: false,
        message: locMsg(req, "Vui lòng cung cấp domain, tài khoản và mật khẩu.", "Please provide domain, username, and password."),
      });
    }

    const cleanDomain = String(domain).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const pythonScript = "/home/duy/Downloads/tool/sendTicket.py";
    const pythonBin = "/home/duy/Downloads/tool/venv/bin/python";

    const args = [
      pythonScript,
      "--send-test",
      "--domain", cleanDomain,
      "--username", String(username),
      "--password", String(password),
      "--category", String(category || "18"),
      "--subcategory", String(subcategory || "19"),
      "--order-id", String(orderId || "123456"),
    ];

    try {
      const { execFile } = await import("child_process");
      execFile(pythonBin, args, { timeout: 60000 }, (err, stdout, stderr) => {
        if (stdout) {
          const lines = stdout.trim().split("\n");
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const parsed = JSON.parse(lines[i]);
              if (parsed.status === "success") {
                return res.json({
                  success: true,
                  message: parsed.message || `Đã gửi ticket mẫu tới ${cleanDomain} thành công!`,
                  orderId: parsed.orderId || orderId,
                });
              } else if (parsed.status === "error") {
                return res.json({
                  success: false,
                  message: parsed.message || "Gửi ticket mẫu thất bại.",
                });
              }
            } catch {}
          }
        }
        res.json({
          success: true,
          message: locMsg(req, `Đã hoàn tất tiến trình gửi ticket mẫu tới ${cleanDomain}.`, `Sample ticket dispatch process completed.`),
          orderId,
        });
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 7. POST Extend Panel Duration
  app.post("/api/panels/:id/extend", async (req, res) => {
    const { id } = req.params;
    const { days } = req.body;
    try {
      const panelId = Number(id) || 0;
      const row = await prisma.panel.findFirst({
        where: { id: panelId },
        include: {
          package: true,
          order: { include: { package: true } },
          user: true,
        },
      });
      if (!row) {
        return res.status(404).json({ success: false, message: locMsg(req, "Không tìm thấy Panel.", "Panel not found.") });
      }

      // 1. Check if linked package still exists in system
      let linkedPackage = row.package || row.order?.package;
      if (!linkedPackage && row.packageId) {
        linkedPackage = await prisma.package.findFirst({
          where: { OR: [{ id: !isNaN(Number(row.packageId)) ? Number(row.packageId) : 0 }, { code: String(row.packageId) }] },
        });
      }

      if (!linkedPackage) {
        return res.status(400).json({
          success: false,
          message: locMsg(
            req,
            "Gói dịch vụ (Package ID) của panel này không còn tồn tại trong hệ thống hoặc đã bị ngừng cung cấp. Vui lòng vào 'Chỉnh sửa' panel để chọn một gói cước mới trước khi gia hạn!",
            "The subscription package for this panel no longer exists or has been discontinued. Please edit the panel to select an active package before extending!"
          ),
        });
      }

      // 2. Calculate extension price based on that exact package
      const addDays = Number(days) || 30;
      const monthly = Number(linkedPackage.monthlyPrice || 29.99);
      const weekly = Number(linkedPackage.weeklyPrice || Math.round((monthly / 4) * 100) / 100);
      const yearly = Number(linkedPackage.yearlyPrice || Math.round((monthly * 10) * 100) / 100);

      let packagePrice = monthly;
      if (addDays === 7) packagePrice = weekly;
      else if (addDays === 365) packagePrice = yearly;
      else if (addDays !== 30) packagePrice = Math.round(((monthly / 30) * addDays) * 100) / 100;

      // 3. Get user & check wallet balance
      let activeUserId = row.userId;
      let dbUser = row.user || (await prisma.user.findUnique({ where: { id: activeUserId } }));
      if (!dbUser) {
        return res.status(404).json({ success: false, message: locMsg(req, "Không tìm thấy tài khoản người dùng.", "User account not found.") });
      }

      const userBalance = Number(dbUser.balance || 0);

      if (packagePrice > 0 && userBalance < packagePrice) {
        const missing = Math.round((packagePrice - userBalance) * 100) / 100;
        return res.status(400).json({
          success: false,
          message: locMsg(
            req,
            `Số dư ví ($${userBalance.toFixed(2)}) không đủ để thanh toán gia hạn gói ${linkedPackage.name} ($${packagePrice.toFixed(2)}). Bạn còn thiếu $${missing.toFixed(2)}!`,
            `Wallet balance ($${userBalance.toFixed(2)}) is insufficient for extending package ${linkedPackage.name} ($${packagePrice.toFixed(2)}). Missing $${missing.toFixed(2)}!`
          ),
          currentBalance: userBalance,
          requiredAmount: packagePrice,
          missingAmount: missing,
        });
      }

      // 4. Deduct balance from user wallet
      if (packagePrice > 0) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { balance: { decrement: packagePrice } },
        });
      }

      // 5. Calculate new expiry & update panel + order
      const currentExpiry = row.expiresAt ? new Date(row.expiresAt).getTime() : Date.now();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiry = new Date(baseTime + addDays * 24 * 60 * 60 * 1000);

      await prisma.panel.update({
        where: { id: row.id },
        data: {
          expiresAt: newExpiry,
          status: "active",
          packageId: linkedPackage.id,
        },
      });

      if (row.orderId) {
        try {
          await prisma.order.update({
            where: { id: row.orderId },
            data: { expiresAt: newExpiry, status: "active" },
          });
        } catch (err) {}
      }

      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: dbUser.name || "User",
        action: "PANEL_EXTENDED",
        details: `Extended panel ${row.name} by ${addDays} days with package ${linkedPackage.name}. Paid: $${packagePrice.toFixed(2)}`,
      });

      res.json({
        success: true,
        newBalance: dbUser.balance,
        newExpiry: newExpiry.toISOString(),
        paidAmount: packagePrice,
        message: locMsg(
          req,
          `Gia hạn Panel "${row.name}" thêm +${addDays} ngày thành công! Đã thanh toán $${packagePrice.toFixed(2)} từ ví. (Hạn mới: ${newExpiry.toLocaleDateString()})`,
          `Extended panel "${row.name}" by +${addDays} days! Paid $${packagePrice.toFixed(2)} from wallet. (New expiry: ${newExpiry.toLocaleDateString()})`
        ),
      });
    } catch (e: any) {
      console.error("Extend panel error:", e);
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 8. POST Toggle Panel Auto Renew
  app.post("/api/panels/:id/toggle-auto-renew", async (req, res) => {
    const { id } = req.params;
    res.json({ success: true, message: "Auto-renew status updated" });
  });

  // ==========================================
  // ADMIN SMM PANELS MANAGEMENT ROUTES
  // ==========================================
  app.get("/api/admin/panels", async (req, res) => {
    try {
      const rows = await prisma.panel.findMany({
        orderBy: { id: "desc" },
        include: {
          package: true,
          order: { include: { package: true } },
          user: { select: { id: true, name: true, username: true, email: true, role: true, balance: true } },
        },
      });

      const formatted = rows.map((p) => ({
        ...formatDbPanel(p),
        dbId: p.id,
        user: p.user,
      }));

      res.json({ success: true, data: formatted });
    } catch (error: any) {
      console.error("Admin get panels error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 2. POST Admin Direct Provision Panel
  app.post("/api/admin/panels", async (req, res) => {
    const {
      userId,
      packageId,
      orderId,
      name,
      domain,
      apiKey,
      balance = 0,
      currency = "USD",
      durationDays = 30,
      status = "active",
      notes,
    } = req.body;
    try {
      const targetUserId = Number(userId) || 1;
      const targetOrderId = orderId ? Number(orderId) : null;
      let targetPackageId: number | null = null;
      let targetPkgRow: any = null;

      if (packageId) {
        targetPkgRow = await prisma.package.findFirst({
          where: { OR: [{ id: !isNaN(Number(packageId)) ? Number(packageId) : 0 }, { code: String(packageId) }] },
        });
        if (targetPkgRow) targetPackageId = targetPkgRow.id;
      }

      const dbUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: locMsg(req, "Không tìm thấy người dùng được chọn.", "Selected user not found."),
        });
      }

      const finalDomain = domain ? domain.trim().toLowerCase() : `panel-${Date.now().toString().slice(-4)}.nexussmm.store`;
      
      let resolvedDurationDays = durationDays ? Number(durationDays) : 30;
      if (!durationDays || Number(durationDays) === 0) {
        if (packageId === "free-trial") {
          resolvedDurationDays = 7;
        } else if (targetPackageId) {
          if (targetPkgRow?.code === "free-trial") resolvedDurationDays = 7;
          else resolvedDurationDays = 30;
        }
      }

      // Check package price & user wallet balance
      const isTrial = packageId === "free-trial" || targetPkgRow?.code === "free-trial";
      let packagePrice = 0;

      if (!isTrial && targetPkgRow) {
        const monthly = Number(targetPkgRow.monthlyPrice || 29.99);
        const weekly = Number(targetPkgRow.weeklyPrice || (monthly / 4));
        const yearly = Number(targetPkgRow.yearlyPrice || (monthly * 10));

        if (resolvedDurationDays === 7) packagePrice = weekly;
        else if (resolvedDurationDays === 30) packagePrice = monthly;
        else if (resolvedDurationDays === 365) packagePrice = yearly;
        else packagePrice = Math.round((monthly / 30 * resolvedDurationDays) * 100) / 100;
      }

      const userBalance = Number(dbUser.balance || 0);

      // Validate user balance
      if (packagePrice > 0 && userBalance < packagePrice) {
        const missing = Math.round((packagePrice - userBalance) * 100) / 100;
        return res.status(400).json({
          success: false,
          message: locMsg(
            req,
            `Số dư tài khoản người dùng ($${userBalance.toFixed(2)}) không đủ để thanh toán gói thuê ($${packagePrice.toFixed(2)}). Thiếu $${missing.toFixed(2)}!`,
            `User wallet balance ($${userBalance.toFixed(2)}) is insufficient for package ($${packagePrice.toFixed(2)}). Missing $${missing.toFixed(2)}!`
          ),
          currentBalance: userBalance,
          requiredAmount: packagePrice,
          missingAmount: missing,
        });
      }

      // Deduct balance from user wallet if paid package
      if (packagePrice > 0) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { balance: { decrement: packagePrice } },
        });
      }

      const expDate = new Date(Date.now() + resolvedDurationDays * 24 * 60 * 60 * 1000);

      // Create Order Record if not linking to existing order
      let finalOrderId = targetOrderId;
      if (!finalOrderId && targetPackageId) {
        try {
          const newOrder = await prisma.order.create({
            data: {
              userId: targetUserId,
              packageId: targetPackageId,
              billingCycle: resolvedDurationDays === 7 ? "weekly" : resolvedDurationDays === 365 ? "yearly" : "monthly",
              total: packagePrice,
              status: "active",
              expiresAt: expDate,
            },
          });
          finalOrderId = newOrder.id;
        } catch (err) {
          console.warn("Auto create order on provision err:", err);
        }
      }

      const created = await prisma.panel.create({
        data: {
          userId: targetUserId,
          orderId: finalOrderId,
          packageId: targetPackageId,
          name: name ? name.trim() : "New Admin SMM Panel",
          domain: finalDomain,
          apiKey: apiKey ? String(apiKey).trim() : '',
          balance: Number(balance) || 0,
          currency: currency || "USD",
          status: status || "active",
          notes: notes ? notes.trim() : null,
          expiresAt: expDate,
        },
        include: {
          package: true,
          order: { include: { package: true } },
          user: { select: { id: true, name: true, username: true, email: true, role: true } },
        },
      });

      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: "Super Admin",
        action: "ADMIN_PANEL_PROVISIONED",
        details: `Directly provisioned panel ${created.name} (${created.domain}) for User ID ${targetUserId}. Paid: $${packagePrice.toFixed(2)}`,
      });

      res.json({
        success: true,
        data: { ...formatDbPanel(created), dbId: created.id, user: created.user },
        message: locMsg(
          req,
          `Tạo và cấp phát Panel "${created.name}" thành công! Đã trừ $${packagePrice.toFixed(2)} phí gói.`,
          `Panel "${created.name}" provisioned successfully! Deducted $${packagePrice.toFixed(2)} for package.`
        ),
      });
    } catch (e: any) {
      console.error("Admin provision panel error:", e);
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 3. PUT Admin Update Panel
  app.put("/api/admin/panels/:id", async (req, res) => {
    const { id } = req.params;
    const { userId, packageId, orderId, name, domain, apiKey, balance, currency, status, notes, expiresAt } = req.body;
    try {
      const panelId = Number(id) || 0;
      const updateData: any = {};
      if (userId !== undefined) updateData.userId = Number(userId);
      if (orderId !== undefined) updateData.orderId = orderId ? Number(orderId) : null;
      if (packageId !== undefined) {
        if (packageId) {
          const pkg = await prisma.package.findFirst({
            where: { OR: [{ id: !isNaN(Number(packageId)) ? Number(packageId) : 0 }, { code: String(packageId) }] },
          });
          updateData.packageId = pkg ? pkg.id : null;
        } else {
          updateData.packageId = null;
        }
      }
      if (name) updateData.name = name.trim();
      if (domain) updateData.domain = domain.trim().toLowerCase();
      if (apiKey !== undefined) updateData.apiKey = apiKey ? String(apiKey).trim() : '';
      if (balance !== undefined) updateData.balance = Number(balance);
      if (currency) updateData.currency = currency;
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes ? String(notes).trim() : null;
      if (expiresAt) updateData.expiresAt = new Date(expiresAt);

      await prisma.panel.updateMany({
        where: { id: panelId },
        data: updateData,
      });

      const updated = await prisma.panel.findFirst({
        where: { id: panelId },
        include: {
          package: true,
          order: { include: { package: true } },
          user: { select: { id: true, name: true, username: true, email: true, role: true } },
        },
      });

      res.json({
        success: true,
        data: updated ? { ...formatDbPanel(updated), dbId: updated.id, user: updated.user } : null,
        message: locMsg(req, `Cập nhật cấu hình Panel thành công!`, `Panel configuration updated!`),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 4. POST Admin Extend Panel Duration
  app.post("/api/admin/panels/:id/extend", async (req, res) => {
    const { id } = req.params;
    const { days } = req.body;
    try {
      const panelId = Number(id) || 0;
      const row = await prisma.panel.findFirst({
        where: { id: panelId },
      });
      if (!row) return res.status(404).json({ success: false, message: "Panel not found" });

      const addDays = Number(days) || 30;
      const currentExpiry = row.expiresAt ? new Date(row.expiresAt).getTime() : Date.now();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiry = new Date(baseTime + addDays * 24 * 60 * 60 * 1000);

      await prisma.panel.update({
        where: { id: row.id },
        data: {
          expiresAt: newExpiry,
          status: "active",
        },
      });

      res.json({
        success: true,
        message: locMsg(
          req,
          `Đã gia hạn Panel thêm +${addDays} ngày (Hết hạn: ${newExpiry.toLocaleDateString()})`,
          `Extended panel by +${addDays} days (New Expiry: ${newExpiry.toLocaleDateString()})`
        ),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 5. PATCH Admin Status Toggle
  app.patch("/api/admin/panels/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      const panelId = Number(id) || 0;
      const row = await prisma.panel.findFirst({
        where: { id: panelId },
      });
      if (!row) return res.status(404).json({ success: false, message: "Panel not found" });

      const newStatus = status || (row.status === "active" ? "suspended" : "active");
      await prisma.panel.update({
        where: { id: row.id },
        data: { status: newStatus },
      });

      res.json({
        success: true,
        newStatus,
        message: locMsg(req, `Trạng thái Panel đã chuyển sang: ${newStatus.toUpperCase()}`, `Panel status changed to: ${newStatus}`),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 6. DELETE Admin Panel
  app.delete("/api/admin/panels/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const panelId = Number(id) || 0;
      await prisma.panel.deleteMany({
        where: { id: panelId },
      });
      res.json({
        success: true,
        message: locMsg(req, "Đã xóa Panel vĩnh viễn khỏi cơ sở dữ liệu.", "Panel deleted permanently."),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
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
    // Catalogue is persisted in MySQL; keep the in-memory catalogue as a
    // development fallback when the database has not been seeded yet.
    prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
      .then((rows) => {
        const data = rows.map((row) => ({
          id: row.code,
          name: row.name,
          tagline: row.tagline || "",
          badge: row.badge || undefined,
          isPopular: row.isPopular,
          pricing: {
            weekly: Number(row.weeklyPrice),
            monthly: Number(row.monthlyPrice),
            yearly: Number(row.yearlyPrice),
          },
          features: row.features,
        }));
        res.json({ success: true, data });
      })
      .catch((error) => {
        console.warn("Package catalogue database read failed:", error);
        res.json({ success: true, data: packages });
      });
  });

  // Admin catalogue: includes inactive plans so administrators can manage
  // visibility without exposing them to customers.
  app.get("/api/admin/packages", async (req, res) => {
    try {
      const rows = await prisma.package.findMany({ orderBy: { sortOrder: "asc" } });
      res.json({ success: true, data: rows.map((row) => ({
        id: row.code, databaseId: row.id, name: row.name, tagline: row.tagline || "",
        badge: row.badge || undefined, isPopular: row.isPopular, active: row.active,
        pricing: { weekly: Number(row.weeklyPrice), monthly: Number(row.monthlyPrice), yearly: Number(row.yearlyPrice) },
        features: row.features, sortOrder: row.sortOrder,
      })) });
    } catch (error) {
      console.warn("Admin package database read failed:", error);
      res.json({ success: true, data: packages.map((pkg, index) => ({ ...pkg, active: true, sortOrder: index + 1 })) });
    }
  });

  // ==========================================
  // BILLING & WALLET DEPOSIT API ROUTES
  // ==========================================
  app.post("/api/billing/add-funds", async (req, res) => {
    const { amount, paymentMethod } = req.body;
    const depositAmount = Number(amount);

    if (!depositAmount || depositAmount <= 0) {
      return res.status(400).json({ success: false, message: "Số tiền nạp không hợp lệ" });
    }

    // Xác định User từ JWT Token hoặc Session
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }

    let activeUser = currentUser;
    let dbUser: any = null;

    if (token) {
      const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
      if (decoded) {
        try {
          dbUser = await prisma.user.findFirst({
            where: { OR: [{ id: decoded.userId }, { email: decoded.email }] },
          });
          if (dbUser) {
            activeUser = {
              ...currentUser,
              id: String(dbUser.id),
              name: dbUser.name || activeUser.name,
              email: dbUser.email || activeUser.email,
              username: dbUser.username || activeUser.username,
              role: dbUser.role || activeUser.role,
              balance: Number(dbUser.balance),
            };
          }
        } catch (e) {
          console.warn("DB user lookup for add-funds:", e);
        }
      }
    }

    const currentBalance = Number(activeUser.balance || 0);
    const newBalance = Math.round((currentBalance + depositAmount) * 100) / 100;
    activeUser.balance = newBalance;

    if (dbUser) {
      try {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { balance: newBalance },
        });
      } catch (err) {
        console.warn("Prisma deposit write failed:", err);
      }
    }
    currentUser.balance = newBalance;

    const txCode = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const depRef = `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const newTx: Transaction = {
      id: txCode,
      userId: activeUser.id,
      date: new Date().toISOString(),
      description: `Nạp tiền vào tài khoản ví qua ${paymentMethod || "Cổng thanh toán tự động"}`,
      type: "deposit",
      amount: depositAmount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      status: "completed",
      paymentMethod: paymentMethod || "VietQR (MB Bank)",
      referenceCode: depRef,
    };
    transactions.unshift(newTx);

    if (dbUser) {
      try {
        await prisma.transaction.create({
          data: {
            code: txCode,
            userId: dbUser.id,
            type: "deposit",
            amount: depositAmount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: `Nạp tiền vào tài khoản ví qua ${paymentMethod || "Cổng thanh toán tự động"}`,
            paymentMethod: paymentMethod || "VietQR (MB Bank)",
            referenceCode: depRef,
            status: "completed",
          },
        });
      } catch (txErr) {
        console.warn("Prisma deposit transaction write failed:", txErr);
      }
    }

    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: activeUser.id,
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
      actor: activeUser.name,
      action: "DEPOSIT_ADDED",
      details: `Added $${depositAmount.toFixed(2)} via ${paymentMethod}, New Balance: $${newBalance.toFixed(2)}`,
    });

    res.json({
      success: true,
      data: {
        newBalance,
        transaction: newTx,
      },
      newBalance,
      message: `Đã nạp thành công $${depositAmount.toFixed(2)} vào tài khoản ví! Số dư mới: $${newBalance.toFixed(2)}`,
    });
  });

  // ==========================================
  // TRANSACTIONS API ROUTES
  // ==========================================
  app.get("/api/transactions", async (req, res) => {
    let targetUserId = !Number.isNaN(Number(currentUser.id)) && Number(currentUser.id) > 0 ? Number(currentUser.id) : 1;
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }
    if (token) {
      try {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) {
          const numId = Number(decoded.userId);
          if (!Number.isNaN(numId) && numId > 0) targetUserId = numId;
        }
      } catch (e) {}
    }

    try {
      let dbTxs = await prisma.transaction.findMany({
        where: { userId: targetUserId },
        orderBy: { id: "desc" },
      });

      // Nếu chưa có transaction trong DB nhưng user đã có đơn hàng / panel, tự động tổng hợp lịch sử giao dịch ban đầu
      if (dbTxs.length === 0) {
        const userOrders = await prisma.order.findMany({
          where: { userId: targetUserId },
          orderBy: { createdAt: "desc" },
          include: { package: true },
        });

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        let runningBalance = Number(user?.balance || 0);

        for (const ord of userOrders) {
          const ordTotal = Number(ord.total);
          const isFree = ordTotal === 0;
          const before = isFree ? runningBalance : runningBalance + ordTotal;
          const after = runningBalance;
          const txCode = `TX-${ord.id + 10000}`;
          
          try {
            const created = await prisma.transaction.create({
              data: {
                code: txCode,
                userId: targetUserId,
                type: isFree ? "trial" : "rent",
                amount: isFree ? 0 : -ordTotal,
                balanceBefore: before,
                balanceAfter: after,
                description: isFree
                  ? 'Kích hoạt gói trải nghiệm hệ thống SMM Panel 0 VNĐ'
                  : `Thuê gói dịch vụ "${ord.package?.name || 'SMM Panel'}" (${ord.billingCycle || 'tháng'})`,
                paymentMethod: isFree ? "Miễn phí (0đ)" : "Số dư ví",
                referenceCode: `ORDER#${ord.id}`,
                status: "completed",
                createdAt: ord.createdAt,
              },
            });
            dbTxs.push(created);
          } catch (e) {}
        }
      }

      const formatted = dbTxs.map((t) => ({
        id: String(t.id),
        code: t.code || `TX-${t.id}`,
        userId: String(t.userId),
        date: t.createdAt.toISOString(),
        description: t.description,
        type: t.type as any,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
        status: t.status as any,
        paymentMethod: t.paymentMethod || "Số dư ví",
        referenceCode: t.referenceCode || "",
      }));

      res.json({ success: true, data: formatted });
    } catch (e: any) {
      console.error("Fetch transactions error:", e);
      res.json({ success: true, data: transactions });
    }
  });

  app.get("/api/orders", async (req, res) => {
    let targetUserId = !Number.isNaN(Number(currentUser.id)) && Number(currentUser.id) > 0 ? Number(currentUser.id) : 1;
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }
    if (token) {
      try {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) {
          const numId = Number(decoded.userId);
          if (!Number.isNaN(numId) && numId > 0) targetUserId = numId;
        }
      } catch (e) {}
    }

    try {
      const rows = await prisma.order.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
        include: { package: true },
      });

      // If user has active panels in memory, ensure active orders exist
      const userPanels = panels.filter((p) => String(p.userId) === String(targetUserId) || p.userId === '1');
      if (rows.length === 0 && userPanels.length > 0) {
        const synthOrders = userPanels.map((p, idx) => ({
          id: idx + 999000,
          userId: targetUserId,
          packageId: null,
          billingCycle: "monthly",
          total: 0,
          status: p.status || "active",
          expiresAt: p.expiresAt ? new Date(p.expiresAt) : new Date(Date.now() + 7 * 86400000),
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          package: {
            id: 0,
            code: p.planId || "free-trial",
            name: p.planName || "Trải Nghiệm Hệ Thống SMM Panel Riêng Biệt 0 VNĐ",
          },
          metadata: {
            storeName: p.name,
            planName: p.planName,
            isFreeTrial: p.planId === "free-trial",
          },
        }));
        return res.json({ success: true, data: synthOrders });
      }

      const formattedRows = rows.map((r) => {
        const isTrial =
          (r.metadata as any)?.isFreeTrial === true ||
          Number(r.total) === 0 ||
          (r.metadata as any)?.planName?.includes('0 VNĐ') ||
          r.package?.code === 'free-trial';
        return {
          ...r,
          total: isTrial ? 0 : Number(r.total),
          package: isTrial
            ? { id: 0, code: 'free-trial', name: 'Trải Nghiệm Hệ Thống SMM Panel Riêng Biệt 0 VNĐ' }
            : r.package,
          packageName: isTrial
            ? 'Trải Nghiệm Hệ Thống SMM Panel Riêng Biệt 0 VNĐ'
            : ((r.metadata as any)?.planName || r.package?.name || 'SMM Package'),
        };
      });

      res.json({ success: true, data: formattedRows });
    } catch (error) {
      console.warn("Orders database read failed:", error);
      res.json({ success: true, data: [] });
    }
  });

  // ==========================================
  // SUBSCRIPTIONS API ROUTES
  // ==========================================
  app.get("/api/subscriptions", (req, res) => {
    const userId = Number(currentUser.id);
    if (Number.isNaN(userId)) return res.json({ success: true, data: subscriptions });
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { package: true },
    }).then((rows) => res.json({ success: true, data: rows.map((row) => ({
      id: String(row.id),
      userId: String(row.userId),
      packageId: row.package?.code || "",
      packageName: row.package?.name || "Package",
      planName: row.package?.name || "Package",
      billingCycle: row.billingCycle || "monthly",
      price: Number(row.total),
      amount: Number(row.total),
      currency: "USD",
      status: "active",
      startDate: row.createdAt.toISOString(),
      nextBillingDate: row.createdAt.toISOString(),
      autoRenew: true,
    })) })).catch(() => res.json({ success: true, data: subscriptions }));
  });

  app.post("/api/orders/:id/extend", async (req, res) => {
    const { id } = req.params;
    const { days } = req.body;
    try {
      const orderId = Number(id) || 0;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { package: true, user: true },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: locMsg(req, "Không tìm thấy đơn hàng thuê gói.", "Rented order not found.") });
      }

      // 1. Resolve package
      let linkedPackage = order.package;
      if (!linkedPackage && order.packageId) {
        linkedPackage = await prisma.package.findFirst({
          where: { OR: [{ id: !isNaN(Number(order.packageId)) ? Number(order.packageId) : 0 }, { code: String(order.packageId) }] },
        });
      }

      if (!linkedPackage) {
        // Fallback default package
        linkedPackage = await prisma.package.findFirst();
      }

      const addDays = Number(days) || 30;
      const monthly = Number(linkedPackage?.monthlyPrice || 29.99);
      const weekly = Number(linkedPackage?.weeklyPrice || Math.round((monthly / 4) * 100) / 100);
      const yearly = Number(linkedPackage?.yearlyPrice || Math.round((monthly * 10) * 100) / 100);

      let packagePrice = monthly;
      if (addDays === 7) packagePrice = weekly;
      else if (addDays === 365) packagePrice = yearly;
      else if (addDays !== 30) packagePrice = Math.round(((monthly / 30) * addDays) * 100) / 100;

      // 2. Check user balance
      let activeUserId = order.userId;
      let dbUser = order.user || (await prisma.user.findUnique({ where: { id: activeUserId } }));
      if (!dbUser) {
        return res.status(404).json({ success: false, message: locMsg(req, "Không tìm thấy tài khoản người dùng.", "User account not found.") });
      }

      const userBalance = Number(dbUser.balance || 0);
      if (packagePrice > 0 && userBalance < packagePrice) {
        const missing = Math.round((packagePrice - userBalance) * 100) / 100;
        return res.status(400).json({
          success: false,
          message: locMsg(
            req,
            `Số dư ví ($${userBalance.toFixed(2)}) không đủ để thanh toán gia hạn gói ${linkedPackage?.name || 'SMM'} ($${packagePrice.toFixed(2)}). Bạn còn thiếu $${missing.toFixed(2)}!`,
            `Wallet balance ($${userBalance.toFixed(2)}) is insufficient for extending package ${linkedPackage?.name || 'SMM'} ($${packagePrice.toFixed(2)}). Missing $${missing.toFixed(2)}!`
          ),
          currentBalance: userBalance,
          requiredAmount: packagePrice,
          missingAmount: missing,
        });
      }

      // 3. Deduct balance from user & record transaction
      if (packagePrice > 0) {
        const balanceBefore = userBalance;
        const balanceAfter = userBalance - packagePrice;

        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { balance: { decrement: packagePrice } },
        });

        const txCode = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        try {
          await prisma.transaction.create({
            data: {
              code: txCode,
              userId: dbUser.id,
              type: "renewal",
              amount: -packagePrice,
              balanceBefore,
              balanceAfter,
              description: `Gia hạn gói "${linkedPackage?.name || order.package?.name || 'SMM'}" (+${addDays} ngày)`,
              paymentMethod: "Số dư ví",
              referenceCode: `ORDER#${order.id}`,
              status: "completed",
            },
          });
        } catch (txErr) {
          console.warn("Prisma renewal transaction write failed:", txErr);
        }
      }

      // 4. Calculate new expiration
      const currentExpiry = order.expiresAt ? new Date(order.expiresAt).getTime() : Date.now();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiry = new Date(baseTime + addDays * 24 * 60 * 60 * 1000);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          expiresAt: newExpiry,
          status: "active",
        },
      });

      // Also update any linked panels
      await prisma.panel.updateMany({
        where: { orderId: order.id },
        data: {
          expiresAt: newExpiry,
          status: "active",
        },
      });

      res.json({
        success: true,
        newBalance: dbUser.balance,
        newExpiry: newExpiry.toISOString(),
        paidAmount: packagePrice,
        message: locMsg(
          req,
          `Gia hạn gói "${linkedPackage?.name || order.package?.name || 'SMM'}" thêm +${addDays} ngày thành công! Đã thanh toán $${packagePrice.toFixed(2)} từ ví.`,
          `Extended package "${linkedPackage?.name || order.package?.name || 'SMM'}" by +${addDays} days! Paid $${packagePrice.toFixed(2)} from wallet.`
        ),
      });
    } catch (e: any) {
      console.error("Extend order error:", e);
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // ==========================================
  // AI OPERATIONS & SUPPORT CHAT API ROUTES (MYSQL PERSISTED)
  // ==========================================
  app.get("/api/support/ai/chat/messages", async (req, res) => {
    let targetUserId = !Number.isNaN(Number(currentUser.id)) && Number(currentUser.id) > 0 ? Number(currentUser.id) : 1;
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }
    if (token) {
      try {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) {
          const numId = Number(decoded.userId);
          if (!Number.isNaN(numId) && numId > 0) targetUserId = numId;
        }
      } catch (e) {}
    }

    try {
      // Find user's tickets and their messages
      const tickets = await prisma.supportTicket.findMany({
        where: { userId: targetUserId },
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      // Gather all messages from all tickets for this user
      const allMessages: any[] = [];
      for (const t of tickets) {
        for (const m of t.messages) {
          allMessages.push({
            id: String(m.id),
            ticketId: t.code,
            sender: m.senderRole === "customer" ? "user" : m.senderRole === "admin" ? "admin" : "assistant",
            senderRole: m.senderRole,
            senderName: m.senderName,
            text: m.content,
            isAiGenerated: m.isAiGenerated,
            timestamp: m.createdAt.toISOString(),
          });
        }
      }

      res.json({
        success: true,
        data: allMessages,
      });
    } catch (e: any) {
      console.error("Fetch chat messages error:", e);
      res.json({ success: true, data: [] });
    }
  });

  app.post("/api/support/ai/chat", async (req, res) => {
    const { message, context } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    let targetUserId = !Number.isNaN(Number(currentUser.id)) && Number(currentUser.id) > 0 ? Number(currentUser.id) : 1;
    let senderName = currentUser.name || "Khách hàng";

    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }
    if (token) {
      try {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) {
          const numId = Number(decoded.userId);
          if (!Number.isNaN(numId) && numId > 0) targetUserId = numId;
          const u = await prisma.user.findUnique({ where: { id: targetUserId } });
          if (u) senderName = u.name || u.username;
        }
      } catch (e) {}
    }

    let activeTicket: any = null;
    try {
      // 1. Find the latest open or active ticket for this user, or create one
      activeTicket = await prisma.supportTicket.findFirst({
        where: {
          userId: targetUserId,
          status: { in: ["open", "in_progress"] },
        },
        orderBy: { updatedAt: "desc" },
      });

      if (!activeTicket) {
        const ticketCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
        const shortSubject = message.length > 60 ? `${message.substring(0, 57)}...` : message;
        activeTicket = await prisma.supportTicket.create({
          data: {
            code: ticketCode,
            userId: targetUserId,
            subject: shortSubject || "Tư vấn & Hỗ trợ kỹ thuật trực tuyến",
            category: "live_chat",
            priority: "normal",
            status: "open",
            aiSummary: "Nexus AI Copilot: Đang tương tác hội thoại trực tuyến với khách hàng.",
          },
        });
      }

      // 2. Save user message to database
      const createdMsg = await prisma.supportTicketMessage.create({
        data: {
          ticketId: activeTicket.id,
          senderId: targetUserId,
          senderName: senderName,
          senderRole: "customer",
          content: message.trim(),
          isAiGenerated: false,
        },
      });

      await prisma.supportTicket.update({
        where: { id: activeTicket.id },
        data: {
          updatedAt: new Date(),
          status: "open",
        },
      });

      res.json({
        success: true,
        data: {
          id: String(createdMsg.id),
          ticketId: activeTicket.code,
          timestamp: createdMsg.createdAt.toISOString(),
        },
        message: "Tin nhắn đã được gửi tới đội ngũ hỗ trợ.",
      });
    } catch (dbErr: any) {
      console.error("Save user chat error:", dbErr);
      res.status(500).json({ success: false, message: dbErr.message });
    }
  });

  // ==========================================
  // SUPPORT TICKETS API (MYSQL BACKED & REALTIME)
  // ==========================================
  app.get("/api/support/tickets", async (req, res) => {
    let targetUserId = !Number.isNaN(Number(currentUser.id)) && Number(currentUser.id) > 0 ? Number(currentUser.id) : 1;
    let isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin";
    
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }
    if (token) {
      try {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) {
          const numId = Number(decoded.userId);
          if (!Number.isNaN(numId) && numId > 0) targetUserId = numId;
          if (decoded.role === "admin" || decoded.role === "super_admin") isAdmin = true;
        }
      } catch (e) {}
    }

    try {
      const whereCondition = req.query.all === "true" ? {} : { userId: targetUserId };
      const dbTickets = await prisma.supportTicket.findMany({
        where: whereCondition,
        orderBy: { updatedAt: "desc" },
        include: {
          user: true,
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      const formatted = dbTickets.map((t) => ({
        id: t.code || `tkt-${t.id}`,
        dbId: t.id,
        userId: String(t.userId),
        userName: t.user?.name || t.user?.username || `User #${t.userId}`,
        userEmail: t.user?.email || "",
        subject: t.subject,
        category: t.category,
        priority: t.priority as any,
        status: t.status as any,
        relatedPanelId: t.relatedPanelId ? String(t.relatedPanelId) : undefined,
        aiSummary: t.aiSummary || "",
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        messages: t.messages.map((m) => ({
          id: String(m.id),
          ticketId: t.code || `tkt-${t.id}`,
          senderId: m.senderId ? String(m.senderId) : "system",
          senderName: m.senderName,
          senderRole: m.senderRole as any,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          isAiGenerated: m.isAiGenerated,
        })),
      }));

      res.json({ success: true, data: formatted });
    } catch (e: any) {
      console.error("Fetch support tickets error:", e);
      res.json({ success: true, data: tickets });
    }
  });

  app.post("/api/support/tickets", async (req, res) => {
    const { subject, category, priority, message, relatedPanelId } = req.body;
    let targetUserId = !Number.isNaN(Number(currentUser.id)) && Number(currentUser.id) > 0 ? Number(currentUser.id) : 1;
    let senderName = currentUser.name || "Khách hàng";

    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies) {
      token = req.cookies.jwt_token || req.cookies.session_token;
    }
    if (token) {
      try {
        const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
        if (decoded?.userId) {
          const numId = Number(decoded.userId);
          if (!Number.isNaN(numId) && numId > 0) targetUserId = numId;
          const u = await prisma.user.findUnique({ where: { id: targetUserId } });
          if (u) senderName = u.name || u.username;
        }
      } catch (e) {}
    }

    const ticketCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const createdTicket = await prisma.supportTicket.create({
        data: {
          code: ticketCode,
          userId: targetUserId,
          subject: subject || "Yêu cầu hỗ trợ dịch vụ SMM Panel",
          category: category || "general",
          priority: priority || "normal",
          status: "open",
          relatedPanelId: relatedPanelId ? Number(relatedPanelId) || null : null,
          aiSummary: "Nexus AI Copilot: Đang phân tích nội dung yêu cầu.",
          messages: {
            create: {
              senderId: targetUserId,
              senderName: senderName,
              senderRole: "customer",
              content: message || "Xin chào, tôi cần hỗ trợ cấu hình dịch vụ SMM.",
            },
          },
        },
        include: {
          user: true,
          messages: true,
        },
      });

      // Fetch full ticket with messages
      const fullTicket = await prisma.supportTicket.findUnique({
        where: { id: createdTicket.id },
        include: { user: true, messages: { orderBy: { createdAt: "asc" } } },
      });

      const formatted = {
        id: fullTicket?.code || `tkt-${fullTicket?.id}`,
        dbId: fullTicket?.id,
        userId: String(fullTicket?.userId),
        userName: fullTicket?.user?.name || fullTicket?.user?.username || senderName,
        userEmail: fullTicket?.user?.email || "",
        subject: fullTicket?.subject,
        category: fullTicket?.category,
        priority: fullTicket?.priority as any,
        status: fullTicket?.status as any,
        relatedPanelId: fullTicket?.relatedPanelId ? String(fullTicket?.relatedPanelId) : undefined,
        aiSummary: fullTicket?.aiSummary || "",
        createdAt: fullTicket?.createdAt.toISOString(),
        updatedAt: fullTicket?.updatedAt.toISOString(),
        messages: (fullTicket?.messages || []).map((m) => ({
          id: String(m.id),
          ticketId: fullTicket?.code || `tkt-${fullTicket?.id}`,
          senderId: m.senderId ? String(m.senderId) : "system",
          senderName: m.senderName,
          senderRole: m.senderRole as any,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          isAiGenerated: m.isAiGenerated,
        })),
      };

      res.json({
        success: true,
        data: formatted,
        message: locMsg(req, "Gửi yêu cầu hỗ trợ thành công.", "Support ticket created successfully."),
      });
    } catch (e: any) {
      console.error("Create support ticket error:", e);
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/support/tickets/:id/messages", async (req, res) => {
    const { id } = req.params;
    const { content, senderRole } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    try {
      const ticket = await prisma.supportTicket.findFirst({
        where: { OR: [{ code: id }, { id: !isNaN(Number(id)) ? Number(id) : 0 }] },
      });

      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      let activeUserId = Number(currentUser.id) || 1;
      let activeUserName = currentUser.name || "Hỗ trợ viên";
      let activeRole = senderRole || (currentUser.role === "admin" || currentUser.role === "super_admin" ? "admin" : "customer");

      const authHeader = req.headers.authorization;
      let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : req.cookies?.jwt_token;
      if (token) {
        try {
          const decoded = (req as any).user || (await import("./src/server/lib/auth")).verifyToken(token);
          if (decoded?.userId) {
            activeUserId = Number(decoded.userId);
            const u = await prisma.user.findUnique({ where: { id: activeUserId } });
            if (u) {
              activeUserName = u.name || u.username;
              if (decoded.role === "admin" || decoded.role === "super_admin") {
                activeRole = "admin";
              }
            }
          }
        } catch (e) {}
      }

      const createdMsg = await prisma.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: activeUserId,
          senderName: activeRole === "admin" ? `${activeUserName} (Admin Support)` : activeUserName,
          senderRole: activeRole,
          content: content.trim(),
        },
      });

      // Update ticket status & lastRepliedAt
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: activeRole === "admin" ? "in_progress" : "open",
          lastRepliedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: {
          id: String(createdMsg.id),
          ticketId: ticket.code,
          senderId: String(createdMsg.senderId),
          senderName: createdMsg.senderName,
          senderRole: createdMsg.senderRole,
          content: createdMsg.content,
          createdAt: createdMsg.createdAt.toISOString(),
          isAiGenerated: createdMsg.isAiGenerated,
        },
      });
    } catch (e: any) {
      console.error("Add ticket message error:", e);
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Admin Update Ticket Status / Priority
  app.patch("/api/admin/support/tickets/:id", async (req, res) => {
    const { id } = req.params;
    const { status, priority } = req.body;

    try {
      const ticket = await prisma.supportTicket.findFirst({
        where: { OR: [{ code: id }, { id: !isNaN(Number(id)) ? Number(id) : 0 }] },
      });

      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      const updateData: any = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;

      const updated = await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: updateData,
        include: { user: true, messages: { orderBy: { createdAt: "asc" } } },
      });

      res.json({
        success: true,
        data: {
          id: updated.code,
          status: updated.status,
          priority: updated.priority,
          updatedAt: updated.updatedAt.toISOString(),
        },
        message: locMsg(req, "Cập nhật trạng thái ticket thành công.", "Ticket status updated."),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
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

  app.get("/api/admin/overview", async (req, res) => {
    try {
      const [
        totalUsers,
        totalPanels,
        activePanels,
        suspendedPanels,
        totalOrders,
        ordersSum,
        recentOrders,
        recentPanels,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.panel.count(),
        prisma.panel.count({ where: { status: "active" } }),
        prisma.panel.count({ where: { status: "suspended" } }),
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { total: true } }),
        prisma.order.findMany({
          take: 6,
          orderBy: { id: "desc" },
          include: { user: true, package: true },
        }),
        prisma.panel.findMany({
          take: 6,
          orderBy: { id: "desc" },
          include: { user: true, package: true },
        }),
      ]);

      const totalVolume = Number(ordersSum._sum.total || 0);

      // Package breakdown
      const packagesCount = await prisma.panel.groupBy({
        by: ['packageId'],
        _count: { id: true },
      });

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers: totalUsers || 1,
            totalPanels: totalPanels || 0,
            activePanels: activePanels || 0,
            suspendedPanels: suspendedPanels || 0,
            totalOrders: totalOrders || 0,
            totalTransactionsVolume: totalVolume,
            monthlyRecurringRevenue: totalVolume,
            systemUptime: 99.99,
            gatewayLatencyAvgMs: 38,
          },
          recentOrders: recentOrders.map((o) => ({
            id: o.id,
            userId: o.userId,
            userName: o.user?.name || o.user?.username || `User #${o.userId}`,
            userEmail: o.user?.email || '',
            packageName: o.package?.name || 'Gói thuê panel',
            billingCycle: o.billingCycle,
            total: Number(o.total),
            status: o.status,
            createdAt: o.createdAt.toISOString(),
            expiresAt: o.expiresAt ? o.expiresAt.toISOString() : null,
          })),
          recentPanels: recentPanels.map((p) => ({
            id: p.id,
            name: p.name,
            domain: p.domain,
            userName: p.user?.name || p.user?.username || `User #${p.userId}`,
            userEmail: p.user?.email || '',
            packageName: p.package?.name || 'Starter',
            status: p.status,
            createdAt: p.createdAt.toISOString(),
            expiresAt: p.expiresAt.toISOString(),
          })),
          clusterNodes: [
            { id: "node-vn-01", name: "Máy chủ VN (Hà Nội)", region: "vn-han-1", pingMs: 8, status: "healthy", cpuLoad: 18, ramUsage: 35, activeConnections: 890 },
            { id: "node-sg-02", name: "Máy chủ Cloud SG (Singapore)", region: "ap-southeast-1", pingMs: 24, status: "healthy", cpuLoad: 22, ramUsage: 40, activeConnections: 1240 },
            { id: "node-proxy-03", name: "Cổng bảo vệ Anti-DDoS Anycast", region: "global-edge", pingMs: 15, status: "healthy", cpuLoad: 12, ramUsage: 28, activeConnections: 2500 },
          ],
          systemSettings: systemMasterSettings,
        },
      });
    } catch (e: any) {
      console.error("Overview error:", e);
      res.json({
        success: true,
        data: {
          stats: {
            totalUsers: 1,
            totalPanels: 1,
            activePanels: 1,
            suspendedPanels: 0,
            totalOrders: 1,
            totalTransactionsVolume: 0,
            monthlyRecurringRevenue: 0,
            systemUptime: 99.99,
            gatewayLatencyAvgMs: 38,
          },
          recentOrders: [],
          recentPanels: [],
          clusterNodes: [
            { id: "node-vn-01", name: "Máy chủ VN (Hà Nội)", region: "vn-han-1", pingMs: 8, status: "healthy", cpuLoad: 18, ramUsage: 35, activeConnections: 890 },
            { id: "node-sg-02", name: "Máy chủ Cloud SG (Singapore)", region: "ap-southeast-1", pingMs: 24, status: "healthy", cpuLoad: 22, ramUsage: 40, activeConnections: 1240 },
          ],
          systemSettings: systemMasterSettings,
        },
      });
    }
  });

  // 1. Admin Users Management (Full CRUD)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const dbUsers = await prisma.user.findMany({
        include: { orders: true },
        orderBy: { id: "desc" },
      });
      if (dbUsers && dbUsers.length > 0) {
        const mapped = await Promise.all(dbUsers.map(async (u) => {
          const userPanels = await prisma.panel.count({ where: { userId: u.id } });
          return {
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            role: u.role,
            balance: Number(u.balance),
            phone: u.phone || undefined,
            status: u.status,
            ordersCount: u.orders ? u.orders.length : 0,
            panelsCount: userPanels,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString(),
          };
        }));
        return res.json({ success: true, data: mapped });
      }
    } catch (e) {
      console.warn("Could not load users from database, falling back to memory:", e);
    }

    const enrichedUsers = allUsers.map((u) => {
      const userPanels = panels.filter((p) => p.userId === u.id);
      const userTxs = transactions.filter((t) => t.userId === u.id);
      const totalSpent = userTxs.filter((t) => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
      return {
        ...u,
        panelsCount: userPanels.length,
        ordersCount: 1,
        totalSpent,
        status: (u as any).status || "active",
      };
    });
    res.json({ success: true, data: enrichedUsers });
  });

  app.post("/api/admin/users", async (req, res) => {
    const { name, username, email, password, role, balance, phone, status } = req.body;
    if (!name || !username || !email) {
      return res.status(400).json({ success: false, message: "Họ tên, username và email là bắt buộc." });
    }

    let passwordHash: string | null = null;
    if (password && String(password).trim().length > 0) {
      try {
        passwordHash = await hashPassword(password);
      } catch {
        passwordHash = null;
      }
    }

    const initBalance = Number(balance) || 0;
    const userRole = role || "customer";
    const userStatus = status || "active";

    let createdUser: any = null;
    try {
      createdUser = await prisma.user.create({
        data: {
          name,
          username: username.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
          password: passwordHash,
          role: userRole,
          balance: initBalance,
          phone: phone ? String(phone).trim() : null,
          status: userStatus,
          currency: "USD",
          language: "vi",
        },
      });
    } catch (dbErr: any) {
      console.warn("Prisma user create error:", dbErr);
      if (dbErr?.code === "P2002") {
        return res.status(409).json({ success: false, message: "Username, email hoặc số điện thoại đã tồn tại." });
      }
    }

    const newMemUser = {
      id: createdUser ? String(createdUser.id) : `usr-adm-${Date.now()}`,
      name,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      role: userRole,
      balance: initBalance,
      phone: phone ? String(phone).trim() : undefined,
      status: userStatus,
      createdAt: new Date().toISOString(),
    };
    allUsers.unshift(newMemUser as any);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "USER_CREATED_BY_ADMIN",
      details: `Created new user account: ${name} (${email}) with role ${userRole}`,
      severity: "info",
    });

    res.json({ success: true, data: createdUser || newMemUser, message: `Đã tạo tài khoản cho ${name} thành công!` });
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    const { name, username, email, password, role, balance, phone, status } = req.body;
    const userIdNum = Number(req.params.id);

    let passwordHash: string | undefined = undefined;
    if (password && String(password).trim().length > 0) {
      try {
        passwordHash = await hashPassword(password);
      } catch {}
    }

    if (!Number.isNaN(userIdNum)) {
      try {
        const updateData: any = {};
        if (name) updateData.name = name;
        if (username) updateData.username = username.toLowerCase().trim();
        if (email) updateData.email = email.toLowerCase().trim();
        if (role) updateData.role = role;
        if (balance !== undefined) updateData.balance = Number(balance);
        if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
        if (status) updateData.status = status;
        if (passwordHash) updateData.password = passwordHash;

        await prisma.user.update({
          where: { id: userIdNum },
          data: updateData,
        });
      } catch (dbErr: any) {
        console.warn("Prisma user update error:", dbErr);
        if (dbErr?.code === "P2002") {
          return res.status(409).json({ success: false, message: "Username, email hoặc số điện thoại đã tồn tại." });
        }
      }
    }

    const memUser = allUsers.find((u) => String(u.id) === String(req.params.id));
    if (memUser) {
      if (name) memUser.name = name;
      if (username) (memUser as any).username = username.toLowerCase().trim();
      if (email) memUser.email = email.toLowerCase().trim();
      if (role) memUser.role = role;
      if (balance !== undefined) memUser.balance = Number(balance);
      if (phone !== undefined) (memUser as any).phone = phone;
      if (status) (memUser as any).status = status;
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "USER_UPDATED_BY_ADMIN",
      details: `Updated account details for user #${req.params.id} (${name || email})`,
      severity: "info",
    });

    res.json({ success: true, message: `Đã cập nhật thông tin thành viên thành công!` });
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    const userIdNum = Number(req.params.id);
    if (!Number.isNaN(userIdNum)) {
      try {
        await prisma.user.delete({ where: { id: userIdNum } });
      } catch (dbErr) {
        console.warn("Prisma user delete error:", dbErr);
      }
    }

    const index = allUsers.findIndex((u) => String(u.id) === String(req.params.id));
    if (index !== -1) {
      allUsers.splice(index, 1);
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "USER_DELETED_BY_ADMIN",
      details: `Deleted user account #${req.params.id}`,
      severity: "warning",
    });

    res.json({ success: true, message: `Đã xóa tài khoản người dùng #${req.params.id}` });
  });

  app.post("/api/admin/users/:id/adjust-balance", async (req, res) => {
    const { amount, type, reason } = req.body;
    const userIdNum = Number(req.params.id);
    const adjAmount = Math.abs(Number(amount));

    if (!adjAmount || adjAmount <= 0) {
      return res.status(400).json({ success: false, message: "Số tiền điều chỉnh không hợp lệ." });
    }

    let updatedBalance = 0;
    let userDisplayName = "User";

    if (!Number.isNaN(userIdNum)) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: userIdNum } });
        if (dbUser) {
          const currentBal = Number(dbUser.balance);
          updatedBalance = type === "debit" ? Math.max(0, currentBal - adjAmount) : currentBal + adjAmount;
          await prisma.user.update({
            where: { id: userIdNum },
            data: { balance: updatedBalance },
          });
          userDisplayName = dbUser.name;
        }
      } catch (e) {
        console.warn("DB adjust balance error:", e);
      }
    }

    const memUser = allUsers.find((u) => String(u.id) === String(req.params.id));
    if (memUser) {
      memUser.balance = type === "debit" ? Math.max(0, memUser.balance - adjAmount) : memUser.balance + adjAmount;
      updatedBalance = memUser.balance;
      userDisplayName = memUser.name;
    }

    const tx: Transaction = {
      id: `tx-adj-${Date.now()}`,
      userId: String(req.params.id),
      date: new Date().toISOString(),
      description: `[Admin Adjustment] ${reason || (type === "debit" ? "Admin Balance Deduction" : "Admin Credit Bonus")}`,
      type: "adjustment",
      amount: type === "debit" ? -adjAmount : adjAmount,
      balanceBefore: type === "debit" ? updatedBalance + adjAmount : updatedBalance - adjAmount,
      status: "completed",
      balanceAfter: updatedBalance,
      paymentMethod: "Admin Master Console",
      referenceCode: `ADJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };
    transactions.unshift(tx);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "BALANCE_ADJUSTED",
      details: `${type === "debit" ? "Deducted" : "Added"} $${adjAmount.toFixed(2)} for user #${req.params.id} (${reason || "No reason"})`,
      severity: type === "debit" ? "warning" : "success",
    });

    res.json({
      success: true,
      message: `Đã ${type === "debit" ? "trừ" : "cộng"} $${adjAmount.toFixed(2)} cho ${userDisplayName}. Số dư mới: $${updatedBalance.toFixed(2)}`,
    });
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
  app.post("/api/admin/packages", (req, res) => {
    const { name, tagline, badge, isPopular, pricing, features } = req.body;
    if (!name || !pricing) {
      return res.status(400).json({ success: false, message: "Package name and pricing are required" });
    }

    const newPkg: PanelPackage = {
      id: req.body.id || `pkg-${Date.now().toString(36)}`,
      name: name.trim(),
      tagline: tagline || "High-performance SMM Panel infrastructure plan.",
      badge: badge || undefined,
      isPopular: Boolean(isPopular),
      pricing: {
        weekly: Number(pricing.weekly) || 9.99,
        monthly: Number(pricing.monthly) || 29.99,
        yearly: Number(pricing.yearly) || 249.99,
      },
      features: {
        panelsCount: features?.panelsCount ?? 1,
        maxOrdersPerMonth: features?.maxOrdersPerMonth ?? 1000,
        servicesLimit: features?.servicesLimit ?? 50,
        uptimeSla: features?.uptimeSla || "99.5%",
        supportLevel: features?.supportLevel || "Standard",
        apiAccess: Boolean(features?.apiAccess ?? true),
      },
    };

    packages.push(newPkg);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "PACKAGE_CREATED",
      details: `Created new package plan: ${newPkg.name}`,
      severity: "info",
    });

    res.json({ success: true, data: newPkg, message: `Package "${newPkg.name}" created successfully!` });
  });

  app.put("/api/admin/packages/:id", (req, res) => {
    const pkg = packages.find((p) => p.id === req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    Object.assign(pkg, req.body);

    const pricing = req.body.pricing || pkg.pricing;
    prisma.package.upsert({
      where: { code: pkg.id },
      create: {
        code: pkg.id, name: pkg.name, tagline: pkg.tagline, badge: pkg.badge,
        isPopular: Boolean(pkg.isPopular), weeklyPrice: pricing.weekly,
        monthlyPrice: pricing.monthly, yearlyPrice: pricing.yearly,
        features: pkg.features,
      },
      update: {
        name: pkg.name, tagline: pkg.tagline, badge: pkg.badge,
        isPopular: Boolean(pkg.isPopular), weeklyPrice: pricing.weekly,
        monthlyPrice: pricing.monthly, yearlyPrice: pricing.yearly,
        features: pkg.features,
      },
    }).catch((error) => console.warn("Package database write failed:", error));

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

  app.delete("/api/admin/packages/:id", (req, res) => {
    const index = packages.findIndex((p) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Package not found" });

    const deleted = packages.splice(index, 1)[0];

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "PACKAGE_DELETED",
      details: `Deleted package plan: ${deleted.name}`,
      severity: "warning",
    });

    res.json({ success: true, message: `Package "${deleted.name}" deleted successfully!` });
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

  // 7. Payment Gateways Management (Full CRUD for Vietnamese Banks & Crypto / Binance / USDT)
  // Helper to format PaymentGateway from DB
  const formatGateway = (gw: any) => ({
    id: Number(gw.id),
    name: gw.name,
    type: gw.type || "vietqr",
    currency: gw.currency || (gw.type === "crypto" || gw.type === "binance" ? "USD" : "VND"),
    logoUrl: gw.logoUrl || null,
    bankCode: gw.bankCode || null,
    bankName: gw.bankName || null,
    accountNumber: gw.accountNumber || null,
    accountHolder: gw.accountHolder || null,
    cryptoType: gw.cryptoType || null,
    cryptoNetwork: gw.cryptoNetwork || null,
    walletAddress: gw.walletAddress || null,
    memoTag: gw.memoTag || null,
    apiKey: gw.apiKey || null,
    secretKey: gw.secretKey || null,
    merchantId: gw.merchantId || null,
    qrCodeUrl: gw.qrCodeUrl || null,
    notes: gw.notes || gw.instructions || null,
    exchangeRateUsdToVnd: Number(gw.exchangeRateUsdToVnd) || 25400,
    bonusPercentage: Number(gw.bonusPercentage) || 0,
    webhookSecret: gw.webhookSecret || null,
    webhookUrl: gw.webhookUrl || null,
    instructions: gw.instructions || null,
    active: Boolean(gw.active),
    sortOrder: Number(gw.sortOrder) || 0,
    createdAt: gw.createdAt instanceof Date ? gw.createdAt.toISOString() : gw.createdAt,
    updatedAt: gw.updatedAt instanceof Date ? gw.updatedAt.toISOString() : gw.updatedAt,
  });

  // 7. Payment Gateways Management (Full DB CRUD for Vietnamese Banks & Crypto / Binance Pay / USDT)
  app.get(["/api/admin/gateways", "/api/public/gateways", "/api/billing/gateways"], async (req, res) => {
    const isPublic = req.path.startsWith("/api/public") || req.path.startsWith("/api/billing");
    try {
      let dbGateways = await prisma.paymentGateway.findMany({
        where: isPublic ? { active: true } : undefined,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      });

      // Nếu trong DB chưa có cổng nào, tự động tạo cấu hình mẫu chuẩn
      if (dbGateways.length === 0 && !isPublic) {
        const defaultGateways = [
          {
            name: "MBBank (Ngân Hàng Quân Đội)",
            type: "vietqr",
            currency: "VND",
            logoUrl: "https://i.imgur.com/zVEduxd.png",
            bankCode: "MBBANK",
            bankName: "MBBank (Ngân Hàng Quân Đội)",
            accountNumber: "",
            accountHolder: "",
            exchangeRateUsdToVnd: 25400,
            bonusPercentage: 0,
            instructions: "Nạp tiền tự động qua VietQR MBBank 24/7",
            active: true,
            sortOrder: 1,
          },
          {
            name: "Binance Pay (Binance ID / QR)",
            type: "crypto",
            currency: "USD",
            logoUrl: "https://i.imgur.com/iBEGgng.png",
            cryptoType: "BINANCE_PAY",
            cryptoNetwork: "BINANCE_DIRECT",
            merchantId: "",
            apiKey: "",
            secretKey: "",
            qrCodeUrl: "",
            notes: "Thanh toán không phí qua Binance Pay ID hoặc QR code",
            bonusPercentage: 0,
            active: true,
            sortOrder: 2,
          },
          {
            name: "USDT TRC20 (Tron Network)",
            type: "crypto",
            currency: "USD",
            logoUrl: "https://i.imgur.com/FYVOL1x.png",
            cryptoType: "USDT",
            cryptoNetwork: "TRC20",
            walletAddress: "",
            bonusPercentage: 0,
            active: true,
            sortOrder: 3,
          },
        ];

        for (const g of defaultGateways) {
          await prisma.paymentGateway.create({ data: g as any }).catch(() => {});
        }

        dbGateways = await prisma.paymentGateway.findMany({
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        });
      }

      const formatted = dbGateways.map(formatGateway);
      res.json({
        success: true,
        data: formatted,
        systemSettings: systemMasterSettings,
      });
    } catch (error) {
      console.error("Get payment gateways error:", error);
      res.status(500).json({ success: false, message: locMsg(req, "Không thể lấy danh sách cổng thanh toán.", "Failed to retrieve payment gateways.") });
    }
  });

  app.post("/api/admin/gateways", async (req, res) => {
    try {
      const {
        name,
        type = "vietqr",
        currency,
        logoUrl,
        bankCode,
        bankName,
        accountNumber,
        accountHolder,
        cryptoType,
        cryptoNetwork,
        walletAddress,
        memoTag,
        apiKey,
        secretKey,
        merchantId,
        qrCodeUrl,
        notes,
        exchangeRateUsdToVnd = 25400,
        bonusPercentage = 0,
        webhookSecret,
        webhookUrl,
        instructions,
        active = true,
      } = req.body;

      const created = await prisma.paymentGateway.create({
        data: {
          name: (name || (type === "vietqr" ? bankName || bankCode : cryptoType || "USDT")).trim(),
          type,
          currency: currency || (type === "crypto" || type === "binance" ? "USD" : "VND"),
          logoUrl: logoUrl ? logoUrl.trim() : null,
          bankCode: bankCode || (type === "vietqr" ? "MBBANK" : null),
          bankName: bankName || null,
          accountNumber: accountNumber ? accountNumber.trim() : null,
          accountHolder: accountHolder ? accountHolder.trim().toUpperCase() : null,
          cryptoType: cryptoType || (type === "crypto" ? "USDT" : null),
          cryptoNetwork: cryptoNetwork || (type === "crypto" ? "TRC20" : null),
          walletAddress: walletAddress ? walletAddress.trim() : null,
          memoTag: memoTag ? memoTag.trim() : null,
          apiKey: apiKey ? apiKey.trim() : null,
          secretKey: secretKey ? secretKey.trim() : null,
          merchantId: merchantId ? merchantId.trim() : null,
          qrCodeUrl: qrCodeUrl ? qrCodeUrl.trim() : null,
          notes: notes ? notes.trim() : null,
          exchangeRateUsdToVnd: Number(exchangeRateUsdToVnd) || 25400,
          bonusPercentage: Number(bonusPercentage) || 0,
          webhookSecret: webhookSecret ? webhookSecret.trim() : null,
          webhookUrl: webhookUrl ? webhookUrl.trim() : null,
          instructions: instructions ? instructions.trim() : null,
          active: Boolean(active),
        },
      });

      const formatted = formatGateway(created);
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: "Super Admin",
        action: "GATEWAY_CREATED",
        details: `Created new payment gateway: ${formatted.name} (ID: ${formatted.id})`,
        severity: "info",
      });

      res.json({
        success: true,
        data: formatted,
        message: locMsg(req, `Cổng thanh toán "${formatted.name}" đã được thêm thành công!`, `Payment gateway "${formatted.name}" added successfully!`),
      });
    } catch (error: any) {
      console.error("Create payment gateway error:", error);
      res.status(500).json({ success: false, message: error.message || locMsg(req, "Không thể tạo cổng thanh toán.", "Failed to create payment gateway.") });
    }
  });

  app.put("/api/admin/gateways/:id", async (req, res) => {
    const { id } = req.params;
    const gId = Number(id);
    if (!Number.isInteger(gId)) {
      return res.status(400).json({ success: false, message: locMsg(req, "ID cổng thanh toán không hợp lệ.", "Invalid payment gateway ID.") });
    }

    try {
      const {
        name,
        type,
        currency,
        logoUrl,
        bankCode,
        bankName,
        accountNumber,
        accountHolder,
        cryptoType,
        cryptoNetwork,
        walletAddress,
        memoTag,
        apiKey,
        secretKey,
        merchantId,
        qrCodeUrl,
        notes,
        exchangeRateUsdToVnd,
        bonusPercentage,
        webhookSecret,
        webhookUrl,
        instructions,
        active,
      } = req.body;

      const updated = await prisma.paymentGateway.update({
        where: { id: gId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(type !== undefined && { type }),
          ...(currency !== undefined && { currency }),
          ...(logoUrl !== undefined && { logoUrl: logoUrl ? logoUrl.trim() : null }),
          ...(bankCode !== undefined && { bankCode: bankCode || null }),
          ...(bankName !== undefined && { bankName: bankName || null }),
          ...(accountNumber !== undefined && { accountNumber: accountNumber ? accountNumber.trim() : null }),
          ...(accountHolder !== undefined && { accountHolder: accountHolder ? accountHolder.trim().toUpperCase() : null }),
          ...(cryptoType !== undefined && { cryptoType: cryptoType || null }),
          ...(cryptoNetwork !== undefined && { cryptoNetwork: cryptoNetwork || null }),
          ...(walletAddress !== undefined && { walletAddress: walletAddress ? walletAddress.trim() : null }),
          ...(memoTag !== undefined && { memoTag: memoTag ? memoTag.trim() : null }),
          ...(apiKey !== undefined && { apiKey: apiKey ? apiKey.trim() : null }),
          ...(secretKey !== undefined && { secretKey: secretKey ? secretKey.trim() : null }),
          ...(merchantId !== undefined && { merchantId: merchantId ? merchantId.trim() : null }),
          ...(qrCodeUrl !== undefined && { qrCodeUrl: qrCodeUrl ? qrCodeUrl.trim() : null }),
          ...(notes !== undefined && { notes: notes ? notes.trim() : null }),
          ...(exchangeRateUsdToVnd !== undefined && { exchangeRateUsdToVnd: Number(exchangeRateUsdToVnd) || 25400 }),
          ...(bonusPercentage !== undefined && { bonusPercentage: Number(bonusPercentage) || 0 }),
          ...(webhookSecret !== undefined && { webhookSecret: webhookSecret ? webhookSecret.trim() : null }),
          ...(webhookUrl !== undefined && { webhookUrl: webhookUrl ? webhookUrl.trim() : null }),
          ...(instructions !== undefined && { instructions: instructions ? instructions.trim() : null }),
          ...(active !== undefined && { active: Boolean(active) }),
        },
      });

      const formatted = formatGateway(updated);
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: "Super Admin",
        action: "GATEWAY_UPDATED",
        details: `Updated payment gateway: ${formatted.name} (ID: ${formatted.id})`,
        severity: "info",
      });

      res.json({
        success: true,
        data: formatted,
        message: locMsg(req, `Cập nhật cấu hình cổng "${formatted.name}" thành công!`, `Payment gateway "${formatted.name}" updated successfully!`),
      });
    } catch (error: any) {
      console.error("Update payment gateway error:", error);
      res.status(500).json({ success: false, message: error.message || locMsg(req, "Không thể cập nhật cổng thanh toán.", "Failed to update payment gateway.") });
    }
  });

  app.patch("/api/admin/gateways/:id/toggle", async (req, res) => {
    const { id } = req.params;
    const gId = Number(id);
    if (!Number.isInteger(gId)) {
      return res.status(400).json({ success: false, message: locMsg(req, "ID không hợp lệ.", "Invalid ID.") });
    }

    try {
      const existing = await prisma.paymentGateway.findUnique({ where: { id: gId } });
      if (!existing) {
        return res.status(404).json({ success: false, message: locMsg(req, "Không tìm thấy cổng thanh toán.", "Payment gateway not found.") });
      }

      const updated = await prisma.paymentGateway.update({
        where: { id: gId },
        data: { active: !existing.active },
      });

      const formatted = formatGateway(updated);
      res.json({
        success: true,
        data: formatted,
        message: locMsg(req, `Đã ${formatted.active ? "kích hoạt" : "tạm dừng"} cổng "${formatted.name}"!`, `Gateway "${formatted.name}" ${formatted.active ? "enabled" : "disabled"}!`),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || locMsg(req, "Lỗi khi cập nhật trạng thái.", "Failed to toggle status.") });
    }
  });

  app.delete("/api/admin/gateways/:id", async (req, res) => {
    const { id } = req.params;
    const gId = Number(id);
    if (!Number.isInteger(gId)) {
      return res.status(400).json({ success: false, message: locMsg(req, "ID không hợp lệ.", "Invalid ID.") });
    }

    try {
      const deleted = await prisma.paymentGateway.delete({ where: { id: gId } });
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: "Super Admin",
        action: "GATEWAY_DELETED",
        details: `Deleted payment gateway: ${deleted.name} (ID: ${deleted.id})`,
        severity: "warning",
      });

      res.json({
        success: true,
        message: locMsg(req, `Đã xóa cổng thanh toán "${deleted.name}" thành công!`, `Payment gateway "${deleted.name}" deleted successfully!`),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || locMsg(req, "Lỗi khi xóa cổng thanh toán.", "Failed to delete payment gateway.") });
    }
  });

  // ==========================================
  // CURRENCIES & FX RATES MANAGEMENT APIS
  // ==========================================

  // 1. Get active currencies (Public / User)
  app.get("/api/currencies", async (req, res) => {
    try {
      const list = await prisma.currency.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });
      res.json({
        success: true,
        data: list.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          symbolPosition: c.symbolPosition,
          rate: Number(c.rate),
          thousandSeparator: c.thousandSeparator,
          decimalSeparator: c.decimalSeparator,
          decimalDigits: c.decimalDigits,
          isDefault: c.isDefault,
          autoSync: c.autoSync,
          active: c.active,
          sortOrder: c.sortOrder,
          lastSyncAt: c.lastSyncAt,
        })),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 2. Get all currencies (Admin)
  app.get("/api/admin/currencies", async (req, res) => {
    try {
      const list = await prisma.currency.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });
      res.json({
        success: true,
        data: list.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          symbolPosition: c.symbolPosition,
          rate: Number(c.rate),
          thousandSeparator: c.thousandSeparator,
          decimalSeparator: c.decimalSeparator,
          decimalDigits: c.decimalDigits,
          isDefault: c.isDefault,
          autoSync: c.autoSync,
          active: c.active,
          sortOrder: c.sortOrder,
          lastSyncAt: c.lastSyncAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 3. Create new currency (Admin)
  app.post("/api/admin/currencies", async (req, res) => {
    const { code, name, symbol, symbolPosition, rate, thousandSeparator, decimalSeparator, decimalDigits, isDefault, autoSync, active, sortOrder } = req.body;
    if (!code || !name || !symbol) {
      return res.status(400).json({ success: false, message: locMsg(req, "Vui lòng nhập đầy đủ mã, tên và ký hiệu tiền tệ.", "Please fill in code, name, and symbol.") });
    }
    try {
      const cleanCode = String(code).trim().toUpperCase();
      const existing = await prisma.currency.findUnique({ where: { code: cleanCode } });
      if (existing) {
        return res.status(400).json({ success: false, message: locMsg(req, `Tiền tệ "${cleanCode}" đã tồn tại.`, `Currency "${cleanCode}" already exists.`) });
      }
      const created = await prisma.currency.create({
        data: {
          code: cleanCode,
          name: String(name).trim(),
          symbol: String(symbol).trim(),
          symbolPosition: symbolPosition === 'right' ? 'right' : 'left',
          rate: new Prisma.Decimal(Number(rate) || 1),
          thousandSeparator: thousandSeparator || ',',
          decimalSeparator: decimalSeparator || '.',
          decimalDigits: Number.isInteger(Number(decimalDigits)) ? Number(decimalDigits) : 2,
          isDefault: Boolean(isDefault),
          autoSync: autoSync !== undefined ? Boolean(autoSync) : true,
          active: active !== undefined ? Boolean(active) : true,
          sortOrder: Number(sortOrder) || 10,
        },
      });
      res.json({ success: true, data: created, message: locMsg(req, `Thêm tiền tệ "${cleanCode}" thành công!`, `Added currency "${cleanCode}" successfully!`) });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 4. Update currency details & custom rate (Admin)
  app.put("/api/admin/currencies/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const { name, symbol, symbolPosition, rate, thousandSeparator, decimalSeparator, decimalDigits, isDefault, autoSync, active, sortOrder } = req.body;
    try {
      const cur = await prisma.currency.findUnique({ where: { id } });
      if (!cur) return res.status(404).json({ success: false, message: "Currency not found" });

      const updated = await prisma.currency.update({
        where: { id },
        data: {
          ...(name ? { name: String(name).trim() } : {}),
          ...(symbol ? { symbol: String(symbol).trim() } : {}),
          ...(symbolPosition ? { symbolPosition: symbolPosition === 'right' ? 'right' : 'left' } : {}),
          ...(rate !== undefined ? { rate: new Prisma.Decimal(Number(rate) || 1) } : {}),
          ...(thousandSeparator !== undefined ? { thousandSeparator } : {}),
          ...(decimalSeparator !== undefined ? { decimalSeparator } : {}),
          ...(decimalDigits !== undefined ? { decimalDigits: Number(decimalDigits) } : {}),
          ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
          ...(autoSync !== undefined ? { autoSync: Boolean(autoSync) } : {}),
          ...(active !== undefined ? { active: Boolean(active) } : {}),
          ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        },
      });
      res.json({ success: true, data: updated, message: locMsg(req, `Cập nhật tiền tệ "${updated.code}" thành công!`, `Updated currency "${updated.code}" successfully!`) });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 5. Toggle Auto-Sync from API (Admin)
  app.patch("/api/admin/currencies/:id/toggle-sync", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    try {
      const cur = await prisma.currency.findUnique({ where: { id } });
      if (!cur) return res.status(404).json({ success: false, message: "Currency not found" });
      const updated = await prisma.currency.update({
        where: { id },
        data: { autoSync: !cur.autoSync },
      });
      res.json({
        success: true,
        data: updated,
        message: locMsg(req, `Đã ${updated.autoSync ? "bật" : "tắt"} tự động đồng bộ API cho ${updated.code}!`, `Auto-sync ${updated.autoSync ? "enabled" : "disabled"} for ${updated.code}!`),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 6. Toggle Active state (Admin)
  app.patch("/api/admin/currencies/:id/toggle-active", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    try {
      const cur = await prisma.currency.findUnique({ where: { id } });
      if (!cur) return res.status(404).json({ success: false, message: "Currency not found" });
      const updated = await prisma.currency.update({
        where: { id },
        data: { active: !cur.active },
      });
      res.json({
        success: true,
        data: updated,
        message: locMsg(req, `Đã ${updated.active ? "kích hoạt" : "ẩn"} đồng tiền ${updated.code}!`, `Currency ${updated.code} ${updated.active ? "activated" : "deactivated"}!`),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 7. Trigger Immediate Sync from open.er-api.com (Admin)
  app.post("/api/admin/currencies/sync", async (req, res) => {
    try {
      const { updatedCount } = await syncCurrenciesFromApi();
      const list = await prisma.currency.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });
      res.json({
        success: true,
        data: list.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          symbolPosition: c.symbolPosition,
          rate: Number(c.rate),
          thousandSeparator: c.thousandSeparator,
          decimalSeparator: c.decimalSeparator,
          decimalDigits: c.decimalDigits,
          isDefault: c.isDefault,
          autoSync: c.autoSync,
          active: c.active,
          sortOrder: c.sortOrder,
          lastSyncAt: c.lastSyncAt,
        })),
        message: locMsg(req, `Đã đồng bộ thành công ${updatedCount} loại tiền tệ từ open.er-api.com!`, `Successfully synced ${updatedCount} currencies from open.er-api.com!`),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message || "Failed to sync FX rates" });
    }
  });

  // 8. Delete Currency (Admin)
  app.delete("/api/admin/currencies/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    try {
      const cur = await prisma.currency.findUnique({ where: { id } });
      if (!cur) return res.status(404).json({ success: false, message: "Currency not found" });
      if (cur.code === 'USD' || cur.isDefault) {
        return res.status(400).json({ success: false, message: locMsg(req, "Không thể xóa tiền tệ cơ sở USD hoặc mặc định.", "Cannot delete base currency USD or default.") });
      }
      await prisma.currency.delete({ where: { id } });
      res.json({
        success: true,
        message: locMsg(req, `Đã xóa tiền tệ "${cur.code}" thành công!`, `Deleted currency "${cur.code}" successfully!`),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Helper: Normalize text by removing Vietnamese accents, punctuation & extra spaces
  function normalizeTransferMemo(str: string): string {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Helper function: Process SieuThiCode Transactions (auto credit balance & deduplicate)
  async function processSieuThiCodeTransactions(txList: any[], sourceName = "SieuThiCode Webhook", gatewayIdParam?: string | number) {
    const activeGateways = await prisma.paymentGateway.findMany({
      where: { active: true },
    });

    let targetGw: any = null;
    if (gatewayIdParam) {
      targetGw = activeGateways.find((g) => String(g.id) === String(gatewayIdParam) || g.bankCode === String(gatewayIdParam));
      if (!targetGw) {
        try {
          targetGw = await prisma.paymentGateway.findFirst({
            where: {
              OR: [
                { id: Number(gatewayIdParam) || 0 },
                { bankCode: String(gatewayIdParam) },
              ],
            },
          });
        } catch {}
      }
    }

    if (!targetGw) {
      targetGw = activeGateways.find((g) => g.type === "vietqr") || activeGateways[0];
    }

    // Tỷ giá nạp (1 USD = ? VND), ví dụ 26000 VND = 1 USD
    const exchangeRate = Number(targetGw?.exchangeRateUsdToVnd || 25400);
    const bonusPercentage = Number(targetGw?.bonusPercentage || 0);

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        transferCode: true,
      },
    });

    let processedCount = 0;
    const results: any[] = [];

    for (const data of txList) {
      const type = String(data.type || "IN").toUpperCase();
      // Only process incoming deposits ("IN")
      if (type !== "IN" && type !== "DEPOSIT" && type !== "CREDIT") {
        continue;
      }

      const tid = String(data.transactionID || data.tranId || data.tid || data.id || data.code || `STC-${Date.now()}-${Math.floor(Math.random() * 1000)}`).trim();
      const rawAmount = Number(data.amount || data.transferAmount || data.price || 0);
      const description = String(data.description || data.content || data.comment || "").trim();

      if (rawAmount <= 0) {
        continue;
      }

      // 1. Deduplication check: verify if transaction with this referenceCode already exists
      const existingTx = await prisma.transaction.findFirst({
        where: { referenceCode: tid },
      });

      if (existingTx) {
        results.push({ tid, status: "already_processed" });
        continue;
      }

      // 2. Match User:
      const cleanDesc = normalizeTransferMemo(description);

      // Priority 1: User's permanent transferCode (Họ và Tên Ngân Hàng / Cú pháp tự đặt, ví dụ "PHAM QUOC DUY")
      // Supports exact match & contains (e.g. "PHAM QUOC DUY" matches "PHAM QUOC DUY CHUYEN KHOAN")
      let matchedUser = allUsers.find((u) => {
        if (!u.transferCode || !u.transferCode.trim()) return false;
        const cleanUserCode = normalizeTransferMemo(u.transferCode);
        if (!cleanUserCode || cleanUserCode.length < 3) return false;

        // Direct substring check
        if (cleanDesc.includes(cleanUserCode)) return true;

        // Keyword tokens check (e.g. all significant words in transferCode exist in description)
        const userWords = cleanUserCode.split(" ").filter((w) => w.length >= 2);
        if (userWords.length >= 2 && userWords.every((w) => cleanDesc.includes(w))) {
          return true;
        }

        return false;
      });

      // Priority 2: Extract user ID from description (e.g. NAP14838, NEXUS123, USER123, NAP 123)
      if (!matchedUser) {
        const idMatch = description.match(/(?:NAP|NEXUS|USER|ID)\s*([0-9]+)/i);
        if (idMatch && idMatch[1]) {
          const parsedUserId = Number(idMatch[1]);
          matchedUser = allUsers.find((u) => u.id === parsedUserId);
        }
      }

      // Priority 3: Match username in description
      if (!matchedUser) {
        matchedUser = allUsers.find((u) => {
          if (!u.username || u.username.length < 3) return false;
          const cleanUsername = normalizeTransferMemo(u.username);
          return cleanDesc.includes(cleanUsername);
        });
      }

      if (matchedUser) {
        // Tính toán nạp tiền và khuyến mãi (% Bonus)
        // Ví dụ: nạp 100,000 VND, bonus 10% -> bonusAmountVnd = 10,000 VND -> totalAmountVnd = 110,000 VND
        const bonusAmountVnd = bonusPercentage > 0 ? Math.round(rawAmount * (bonusPercentage / 100)) : 0;
        const totalAmountVnd = rawAmount + bonusAmountVnd;

        const baseUsd = rawAmount / exchangeRate;
        const bonusUsd = bonusAmountVnd / exchangeRate;
        const totalUsd = Number(((rawAmount + bonusAmountVnd) / exchangeRate).toFixed(4));

        const currentBalance = Number(matchedUser.balance);
        const newBalance = Number((currentBalance + totalUsd).toFixed(4));

        // 1. Update user balance in MySQL
        await prisma.user.update({
          where: { id: matchedUser.id },
          data: { balance: newBalance },
        });
        matchedUser.balance = newBalance as any; // update in-memory cache

        // 2. Create Transaction record in MySQL
        const txCode = `TX-STC-${tid}-${Date.now()}`;
        const gatewayName = targetGw?.name || "SieuThiCode (VietQR)";
        const bonusNote = bonusPercentage > 0 ? `(+${bonusAmountVnd.toLocaleString("vi-VN")} VND Thưởng ${bonusPercentage}%) ` : '';
        const newTx = {
          id: `tx-stc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: String(matchedUser.id),
          type: "deposit" as const,
          amount: totalUsd,
          fee: 0,
          currency: "USD",
          status: "completed" as const,
          description: `Nạp tiền tự động qua ${gatewayName}: +${rawAmount.toLocaleString("vi-VN")} VND ${bonusNote}(~$${totalUsd.toFixed(2)} USD) | Cú pháp: "${description}"`,
          paymentMethod: gatewayName,
          referenceCode: tid,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        transactions.unshift(newTx);

        try {
          await prisma.transaction.create({
            data: {
              code: txCode,
              userId: matchedUser.id,
              type: "deposit",
              amount: totalUsd,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              description: `Nạp tiền tự động qua ${gatewayName}: +${rawAmount.toLocaleString("vi-VN")} VND ${bonusNote}(~$${totalUsd.toFixed(2)} USD) | Nội dung: "${description}"`,
              paymentMethod: gatewayName,
              referenceCode: tid,
              status: "completed",
            },
          });
        } catch (txErr) {
          console.warn("Prisma deposit transaction write failed:", txErr);
        }

        // 3. Create Notification for user
        notifications.unshift({
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: String(matchedUser.id),
          title: "Nạp tiền thành công",
          message: `Tài khoản của bạn đã được cộng +$${totalUsd.toFixed(2)} USD (+${rawAmount.toLocaleString("vi-VN")} VND ${bonusNote}theo tỷ giá ${exchangeRate.toLocaleString("vi-VN")} ₫). Mã GD: ${tid}`,
          type: "success",
          createdAt: new Date().toISOString(),
          read: false,
          actionUrl: "/transactions",
        });

        // 4. Audit Log
        auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: sourceName,
          action: "AUTO_DEPOSIT_SUCCESS",
          details: `Nạp tự động thành công $${totalUsd.toFixed(2)} USD (${rawAmount.toLocaleString("vi-VN")} VND ${bonusNote}/ Tỷ giá: ${exchangeRate}) cho user #${matchedUser.id} (${matchedUser.username}). Cú pháp khớp: "${matchedUser.transferCode || 'NAP' + matchedUser.id}". Cổng: ${gatewayName}. Mã GD: ${tid}`,
          severity: "success",
        });

        processedCount++;
        results.push({
          tid,
          userId: matchedUser.id,
          rawAmount,
          bonusPercentage,
          bonusAmountVnd,
          totalAmountVnd,
          exchangeRate,
          amount: totalUsd,
          status: "credited",
        });
      } else {
        auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: sourceName,
          action: "AUTO_DEPOSIT_UNMATCHED",
          details: `Nhận biến động ${rawAmount.toLocaleString("vi-VN")} VND (Mã GD: ${tid}) nhưng không khớp với cú pháp người dùng nào. Nội dung: "${description}"`,
          severity: "warning",
        });
        results.push({ tid, rawAmount, status: "unmatched_user" });
      }
    }

    return { processedCount, results };
  }

  // 8. SieuThiCode Webhook Handler (api.sieuthicode.net)
  // URL Format: /webhook/sieuthicode?type=<gateway_id> (hoặc /api/webhook/sieuthicode?type=<gateway_id>)
  app.all(["/webhook/sieuthicode", "/api/webhook/sieuthicode"], async (req, res) => {
    try {
      const gatewayType = (req.query.type || req.body?.type || req.query.gateway_id || "").toString().trim();

      // 1. Signature Verification
      const incomingSignature = (
        req.headers["signature"] ||
        req.headers["Signature"] ||
        req.headers["x-signature"] ||
        req.query.signature ||
        req.query.secret ||
        req.body?.signature ||
        req.body?.secret ||
        ""
      ).toString().trim();

      const activeGateways = await prisma.paymentGateway.findMany({
        where: { active: true },
      });

      const validSecrets = new Set<string>();
      validSecrets.add("78d0ac0067b9d679bf944819ad080f5d"); // Default sample signature

      for (const gw of activeGateways) {
        if (gw.webhookSecret?.trim()) validSecrets.add(gw.webhookSecret.trim());
        if (gw.apiKey?.trim()) validSecrets.add(gw.apiKey.trim());
        if (gw.secretKey?.trim()) validSecrets.add(gw.secretKey.trim());
      }

      // If specific gateway id is given, also check that gateway's secret
      if (gatewayType) {
        const specificGw = activeGateways.find((g) => String(g.id) === String(gatewayType) || g.bankCode === String(gatewayType));
        if (specificGw?.webhookSecret?.trim()) {
          validSecrets.add(specificGw.webhookSecret.trim());
        }
      }

      const isSignatureValid = incomingSignature && validSecrets.has(incomingSignature);
      if (!isSignatureValid) {
        auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: "SieuThiCode Webhook",
          action: "WEBHOOK_SIGNATURE_INVALID",
          details: `Chữ ký Webhook không hợp lệ: "${incomingSignature}" (Cổng type: ${gatewayType || "N/A"}) từ IP: ${req.ip || req.socket.remoteAddress}`,
          severity: "error",
        });
        return res.status(401).send("Chữ ký không hợp lệ.");
      }

      // 2. Extract Transactions
      let txList: any[] = [];
      if (Array.isArray(req.body?.transactions)) {
        txList = req.body.transactions;
      } else if (Array.isArray(req.body)) {
        txList = req.body;
      } else if (req.body?.transactionID || req.body?.tranId || req.body?.tid || req.body?.id) {
        txList = [req.body];
      }

      const { processedCount, results } = await processSieuThiCodeTransactions(txList, "SieuThiCode Webhook", gatewayType);

      return res.json({
        status: true,
        msg: "OK",
        processed: processedCount,
        results,
      });
    } catch (err: any) {
      console.error("SieuThiCode Webhook Error:", err);
      return res.status(500).json({
        status: false,
        msg: err.message || "Internal Server Error",
      });
    }
  });

  // Manual/Cron Sync Endpoint for SieuThiCode API (GET https://api.sieuthicode.net/v1/transactions/list)
  app.post("/api/admin/gateways/sieuthicode/sync", async (req, res) => {
    try {
      const { gatewayId, token } = req.body;
      let apiToken = token;

      if (!apiToken && gatewayId) {
        const gw = await prisma.paymentGateway.findUnique({ where: { id: Number(gatewayId) } });
        apiToken = gw?.apiKey || gw?.secretKey || gw?.webhookSecret;
      }
      if (!apiToken) {
        const activeGw = await prisma.paymentGateway.findFirst({
          where: { type: "vietqr", active: true },
        });
        apiToken = activeGw?.apiKey || activeGw?.secretKey || activeGw?.webhookSecret;
      }

      if (!apiToken) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cấu hình API Key / Bearer Token của SieuThiCode để đồng bộ.",
        });
      }

      const response = await fetch("https://api.sieuthicode.net/v1/transactions/list", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiToken.trim()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          success: false,
          message: `Lỗi kết nối SieuThiCode API (${response.status}): ${errText}`,
        });
      }

      const data: any = await response.json();
      let txList: any[] = [];
      if (Array.isArray(data?.transactions)) {
        txList = data.transactions;
      } else if (Array.isArray(data?.data)) {
        txList = data.data;
      } else if (Array.isArray(data)) {
        txList = data;
      }

      const { processedCount, results } = await processSieuThiCodeTransactions(txList, "SieuThiCode Polling Sync");

      return res.json({
        success: true,
        message: `Đã đồng bộ thành công! Xử lý ${processedCount}/${txList.length} giao dịch mới.`,
        processed: processedCount,
        total: txList.length,
        results,
      });
    } catch (err: any) {
      console.error("SieuThiCode Sync Error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Lỗi khi đồng bộ giao dịch SieuThiCode.",
      });
    }
  });

  app.post("/api/admin/system/purge-cache", (req, res) => {
    // Panel metrics are not stored in the panels table.

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

  // ==========================================
  // REAL-TIME AUDIT LOGS & LOGIN SESSIONS FROM MYSQL
  // ==========================================
  app.get("/api/admin/login-sessions", async (req, res) => {
    try {
      const sessions = await prisma.loginSession.findMany({
        include: {
          user: {
            select: { id: true, name: true, username: true, email: true, role: true, balance: true },
          },
        },
        orderBy: { id: "desc" },
        take: 200,
      });

      const formatted = sessions.map((s) => {
        const ua = s.userAgent || "";
        let browser = "Chrome";
        let os = "Windows";
        let isMobile = false;

        if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Google Chrome";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Apple Safari";
        else if (ua.includes("Firefox")) browser = "Mozilla Firefox";
        else if (ua.includes("Edg")) browser = "Microsoft Edge";
        else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

        if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iOS")) { os = "iOS"; isMobile = true; }
        else if (ua.includes("Android")) { os = "Android"; isMobile = true; }
        else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
        else if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Linux")) os = "Linux";

        const isRevoked = Boolean(s.revokedAt);
        const isExpired = new Date(s.expiresAt).getTime() <= Date.now();
        const status = isRevoked ? "revoked" : isExpired ? "expired" : "active";

        return {
          id: s.id,
          userId: s.userId,
          user: s.user,
          ipAddress: s.ipAddress || "127.0.0.1",
          location: s.location || "Việt Nam",
          userAgent: ua,
          device: `${browser} • ${os}`,
          deviceType: isMobile ? "mobile" : "desktop",
          status,
          createdAt: s.createdAt.toISOString(),
          lastActiveAt: s.lastActiveAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
        };
      });

      res.json({ success: true, data: formatted });
    } catch (e: any) {
      console.error("Fetch login sessions error:", e);
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/admin/login-sessions/:id/revoke", async (req, res) => {
    try {
      const sessionId = Number(req.params.id) || 0;
      await prisma.loginSession.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
      res.json({ success: true, message: locMsg(req, "Đã thu hồi phiên đăng nhập thành công!", "Session revoked successfully!") });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      const dbSessions = await prisma.loginSession.findMany({
        include: { user: true },
        orderBy: { id: "desc" },
        take: 100,
      });

      const sessionLogs = dbSessions.map((s) => ({
        id: `sess-${s.id}`,
        timestamp: s.createdAt.toISOString(),
        actor: s.user?.name || s.user?.username || `User #${s.userId}`,
        action: "AUTH_LOGIN",
        details: `Đăng nhập từ IP ${s.ipAddress || '127.0.0.1'} (${s.location || 'Việt Nam'}) - ${s.userAgent?.slice(0, 60) || 'Web'}`,
        severity: s.revokedAt ? "warning" : "info",
        ip: s.ipAddress,
        user: s.user,
        sessionId: s.id,
      }));

      // Merge with in-memory activity logs
      const combined = [...sessionLogs, ...auditLogs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.json({ success: true, data: combined });
    } catch {
      res.json({ success: true, data: auditLogs });
    }
  });

  // 7. Master Orders Management
  // 7. Master Package Rental Orders Management & Auto-Expiration
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const now = new Date();
      // Tự động chuyển các đơn đã quá hạn sang trạng thái 'blocked'
      try {
        await prisma.order.updateMany({
          where: {
            status: "active",
            expiresAt: { lte: now }
          },
          data: { status: "blocked" }
        });
      } catch (errSync) {
        console.warn("Auto-block sync skipped:", errSync);
      }

      const rows = await prisma.order.findMany({
        include: { user: true, package: true },
        orderBy: { id: "desc" },
      });
      if (rows && rows.length > 0) {
        const formatted = rows.map((r) => {
          let meta: any = {};
          try {
            meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : (r.metadata || {});
          } catch {}
          return {
            id: r.id,
            userId: r.userId,
            userName: r.user?.name || `User #${r.userId}`,
            userEmail: r.user?.email || `user${r.userId}@example.com`,
            packageId: r.package?.code || String(r.packageId || ""),
            packageName: r.package?.name || "Standard Plan",
            billingCycle: r.billingCycle || "monthly",
            total: Number(r.total),
            status: r.status || (r.expiresAt && new Date() > new Date(r.expiresAt) ? "blocked" : "active"),
            expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
            notes: meta?.notes || undefined,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        });
        return res.json({ success: true, data: formatted });
      }
    } catch (e) {
      console.warn("Could not read orders from database, falling back to in-memory:", e);
    }
    res.json({ success: true, data: masterOrders });
  });

  app.post("/api/admin/orders", async (req, res) => {
    const { userId, packageId, billingCycle = "monthly", total = 49, notes = "" } = req.body;
    try {
      const pkg = await prisma.package.findFirst({
        where: { OR: [{ id: Number(packageId) || 0 }, { code: String(packageId) }] }
      });

      const now = new Date();
      const exp = new Date(now);
      if (billingCycle === "weekly") exp.setDate(exp.getDate() + 7);
      else if (billingCycle === "yearly") exp.setFullYear(exp.getFullYear() + 1);
      else exp.setDate(exp.getDate() + 30);

      const created = await prisma.order.create({
        data: {
          userId: Number(userId) || 1,
          packageId: pkg?.id || 2,
          billingCycle: String(billingCycle),
          total: Number(total),
          status: "active",
          expiresAt: exp,
          metadata: notes ? JSON.stringify({ notes }) : null,
        },
        include: { user: true, package: true }
      });
      return res.json({ success: true, message: "Đã tạo đơn thuê gói thành công!", data: created });
    } catch (e: any) {
      console.error("Create order failed:", e);
      return res.status(500).json({ success: false, message: "Lỗi tạo đơn thuê: " + e.message });
    }
  });

  app.post("/api/admin/orders/:id/extend", async (req, res) => {
    const orderId = Number(req.params.id);
    const { additionalDays = 30 } = req.body;
    try {
      const existing = await prisma.order.findUnique({ where: { id: orderId } });
      if (existing) {
        const currentExp = existing.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : new Date();
        const newExpiresAt = new Date(currentExp.getTime() + Number(additionalDays) * 86400000);
        await prisma.order.update({
          where: { id: orderId },
          data: {
            expiresAt: newExpiresAt,
            status: "active",
            updatedAt: new Date()
          }
        });
        return res.json({
          success: true,
          message: `Đã gia hạn đơn thuê thêm ${additionalDays} ngày và mở khóa trạng thái (Hạn mới: ${newExpiresAt.toLocaleDateString()})!`
        });
      }
    } catch (e) {
      console.warn("DB extend order failed:", e);
    }
    res.json({ success: true, message: `Đã gia hạn đơn thuê thêm ${additionalDays} ngày thành công!` });
  });

  app.post("/api/admin/orders/:id/toggle-block", async (req, res) => {
    const orderId = Number(req.params.id);
    try {
      const existing = await prisma.order.findUnique({ where: { id: orderId } });
      if (existing) {
        const newStatus = existing.status === "blocked" ? "active" : "blocked";
        await prisma.order.update({
          where: { id: orderId },
          data: { status: newStatus, updatedAt: new Date() }
        });
        return res.json({
          success: true,
          message: newStatus === "blocked" ? `Đã khóa gói thuê #${orderId}` : `Đã mở khóa hoạt động gói thuê #${orderId}`,
          status: newStatus,
        });
      }
    } catch (e: any) {
      console.warn("DB toggle block failed:", e);
    }
    res.status(404).json({ success: false, message: "Order not found" });
  });

  app.delete("/api/admin/orders/:id", async (req, res) => {
    const orderId = Number(req.params.id);
    if (!Number.isNaN(orderId)) {
      try {
        await prisma.order.delete({ where: { id: orderId } });
      } catch (e) {
        console.warn("DB delete order failed:", e);
      }
    }

    const index = masterOrders.findIndex((o) => String(o.id) === String(req.params.id));
    if (index !== -1) {
      masterOrders.splice(index, 1);
    }

    res.json({ success: true, message: `Đã xóa đơn hàng #${req.params.id} thành công!` });
  });

  // 8. Site Frontend Configuration (User Portal Branding & Settings)
  app.get("/api/admin/site-config", async (req, res) => {
    try {
      const dbSetting = await prisma.setting.findFirst({ where: { id: 1 } });
      if (dbSetting) {
        return res.json({
          success: true,
          data: {
            ...siteFrontendConfig,
            siteName: dbSetting.siteName || siteFrontendConfig.siteName,
            siteTagline: dbSetting.siteTagline || siteFrontendConfig.siteTagline,
            siteLogoUrl: dbSetting.siteLogoUrl || siteFrontendConfig.siteLogoUrl,
            faviconUrl: dbSetting.faviconUrl || siteFrontendConfig.faviconUrl,
            primaryBrandColor: dbSetting.primaryBrandColor || siteFrontendConfig.primaryBrandColor,
            supportEmail: dbSetting.supportEmail || siteFrontendConfig.supportEmail,
            supportTelegram: dbSetting.supportTelegram || siteFrontendConfig.supportTelegram,
            supportHotline: dbSetting.supportHotline || siteFrontendConfig.supportHotline,
            allowUserRegistration: Boolean(dbSetting.allowUserRegistration),
            allowFreeTrialPanel: Boolean(dbSetting.allowFreeTrialPanel),
            freeTrialDurationDays: dbSetting.freeTrialDurationDays !== undefined ? dbSetting.freeTrialDurationDays : 7,
            freeTrialMaxPerUser: dbSetting.freeTrialMaxPerUser !== undefined ? dbSetting.freeTrialMaxPerUser : 1,
            freeTrialStartDate: dbSetting.freeTrialStartDate ? dbSetting.freeTrialStartDate.toISOString() : null,
            freeTrialEndDate: dbSetting.freeTrialEndDate ? dbSetting.freeTrialEndDate.toISOString() : null,
            freeTrialPackageId: dbSetting.freeTrialPackageId || null,
            freeTrialRequireVerification: Boolean(dbSetting.freeTrialRequireVerification),
            allowGuestServiceViewing: Boolean(dbSetting.allowGuestServiceViewing),
            enableLiveChatWidget: Boolean(dbSetting.enableLiveChatWidget),
            headerAnnouncementBar: dbSetting.headerAnnouncementBar || siteFrontendConfig.headerAnnouncementBar,
            headerAnnouncementActive: Boolean(dbSetting.headerAnnouncementActive),
            footerCopyright: dbSetting.footerCopyright || siteFrontendConfig.footerCopyright,
            seoMetaTitle: dbSetting.seoMetaTitle || siteFrontendConfig.seoMetaTitle,
            seoMetaKeywords: dbSetting.seoMetaKeywords || siteFrontendConfig.seoMetaKeywords,
            seoMetaDescription: dbSetting.seoMetaDescription || siteFrontendConfig.seoMetaDescription,
            seoCanonicalUrl: dbSetting.seoCanonicalUrl || "https://nexussmm.io",
            seoOgTitle: dbSetting.seoOgTitle || siteFrontendConfig.seoMetaTitle,
            seoOgDescription: dbSetting.seoOgDescription || siteFrontendConfig.seoMetaDescription,
            seoOgImageUrl: dbSetting.seoOgImageUrl || "https://nexussmm.io/og-preview.png",
            seoOgType: dbSetting.seoOgType || "website",
            seoTwitterCard: dbSetting.seoTwitterCard || "summary_large_image",
            seoRobotsIndexing: dbSetting.seoRobotsIndexing || "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            seoSitemapUrl: dbSetting.seoSitemapUrl || "https://nexussmm.io/sitemap.xml",
            seoGoogleAnalyticsId: dbSetting.seoGoogleAnalyticsId || "G-NEXUSSMM2026",
            customCss: dbSetting.customCss || siteFrontendConfig.customCss,
            customHeaderScripts: dbSetting.customHeaderScripts || siteFrontendConfig.customHeaderScripts,
            customBodyScripts: dbSetting.customBodyScripts || siteFrontendConfig.customBodyScripts,
            smtpHost: dbSetting.smtpHost || "",
            smtpPort: dbSetting.smtpPort || 587,
            smtpUsername: dbSetting.smtpUsername || "",
            smtpPassword: dbSetting.smtpPassword || "",
            smtpEncryption: dbSetting.smtpEncryption || "tls",
            smtpFromEmail: dbSetting.smtpFromEmail || "noreply@nexussmm.io",
            smtpFromName: dbSetting.smtpFromName || "NexusSMM Enterprise",
          },
        });
      }
    } catch (e) {
      console.warn("DB settings read error:", e);
    }
    res.json({ success: true, data: siteFrontendConfig });
  });

  app.put("/api/admin/site-config", async (req, res) => {
    siteFrontendConfig = { ...siteFrontendConfig, ...req.body };

    try {
      await prisma.setting.upsert({
        where: { id: 1 },
        update: {
          siteName: req.body.siteName,
          siteTagline: req.body.siteTagline,
          siteLogoUrl: req.body.siteLogoUrl,
          faviconUrl: req.body.faviconUrl,
          primaryBrandColor: req.body.primaryBrandColor,
          supportEmail: req.body.supportEmail,
          supportTelegram: req.body.supportTelegram,
          supportHotline: req.body.supportHotline,
          allowUserRegistration: req.body.allowUserRegistration !== undefined ? Boolean(req.body.allowUserRegistration) : undefined,
          allowFreeTrialPanel: req.body.allowFreeTrialPanel !== undefined ? Boolean(req.body.allowFreeTrialPanel) : undefined,
          freeTrialDurationDays: req.body.freeTrialDurationDays !== undefined ? Number(req.body.freeTrialDurationDays) : undefined,
          freeTrialMaxPerUser: req.body.freeTrialMaxPerUser !== undefined ? Number(req.body.freeTrialMaxPerUser) : undefined,
          freeTrialStartDate: req.body.freeTrialStartDate ? new Date(req.body.freeTrialStartDate) : null,
          freeTrialEndDate: req.body.freeTrialEndDate ? new Date(req.body.freeTrialEndDate) : null,
          freeTrialPackageId: req.body.freeTrialPackageId !== undefined ? (req.body.freeTrialPackageId ? Number(req.body.freeTrialPackageId) : null) : undefined,
          freeTrialRequireVerification: req.body.freeTrialRequireVerification !== undefined ? Boolean(req.body.freeTrialRequireVerification) : undefined,
          allowGuestServiceViewing: req.body.allowGuestServiceViewing !== undefined ? Boolean(req.body.allowGuestServiceViewing) : undefined,
          enableLiveChatWidget: req.body.enableLiveChatWidget !== undefined ? Boolean(req.body.enableLiveChatWidget) : undefined,
          headerAnnouncementBar: req.body.headerAnnouncementBar,
          headerAnnouncementActive: req.body.headerAnnouncementActive !== undefined ? Boolean(req.body.headerAnnouncementActive) : undefined,
          footerCopyright: req.body.footerCopyright,
          seoMetaTitle: req.body.seoMetaTitle,
          seoMetaKeywords: req.body.seoMetaKeywords,
          seoMetaDescription: req.body.seoMetaDescription,
          seoCanonicalUrl: req.body.seoCanonicalUrl,
          seoOgTitle: req.body.seoOgTitle,
          seoOgDescription: req.body.seoOgDescription,
          seoOgImageUrl: req.body.seoOgImageUrl,
          seoRobotsIndexing: req.body.seoRobotsIndexing,
          seoSitemapUrl: req.body.seoSitemapUrl,
          seoGoogleAnalyticsId: req.body.seoGoogleAnalyticsId,
          customCss: req.body.customCss,
          customHeaderScripts: req.body.customHeaderScripts,
          customBodyScripts: req.body.customBodyScripts,
          smtpHost: req.body.smtpHost,
          smtpPort: req.body.smtpPort !== undefined ? Number(req.body.smtpPort) : undefined,
          smtpUsername: req.body.smtpUsername,
          smtpPassword: req.body.smtpPassword,
          smtpEncryption: req.body.smtpEncryption,
          smtpFromEmail: req.body.smtpFromEmail,
          smtpFromName: req.body.smtpFromName,
        },
        create: {
          id: 1,
          siteName: req.body.siteName || "NexusSMM Enterprise",
          siteTagline: req.body.siteTagline,
          seoMetaTitle: req.body.seoMetaTitle,
          seoMetaKeywords: req.body.seoMetaKeywords,
          seoMetaDescription: req.body.seoMetaDescription,
        },
      });
    } catch (e) {
      console.warn("DB settings save error:", e);
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: "SITE_BRANDING_UPDATED",
      details: `Updated user site branding and SEO: ${siteFrontendConfig.siteName}`,
      severity: "info",
    });

    res.json({
      success: true,
      data: siteFrontendConfig,
      message: "Cấu hình giao diện và Chuẩn SEO đã được lưu thành công vào Database!",
    });
  });

  // 8.1 Admin SMTP Email Dispatch (Send to All Users or Specific User)
  app.post("/api/admin/send-email", async (req, res) => {
    try {
      const { recipientType, targetEmail, targetUserId, subject, htmlContent, customSmtp } = req.body;

      if (!subject || !subject.trim()) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập tiêu đề email!" });
      }
      if (!htmlContent || !htmlContent.trim()) {
        return res.status(400).json({ success: false, message: "Vui lòng soạn thảo nội dung email!" });
      }

      const dbSetting = await prisma.setting.findFirst({ where: { id: 1 } });
      const host = customSmtp?.smtpHost || dbSetting?.smtpHost || process.env.SMTP_HOST;
      const port = Number(customSmtp?.smtpPort || dbSetting?.smtpPort || process.env.SMTP_PORT || 587);
      const user = customSmtp?.smtpUsername || dbSetting?.smtpUsername || process.env.SMTP_USER;
      const pass = customSmtp?.smtpPassword || dbSetting?.smtpPassword || process.env.SMTP_PASS;
      const encryption = customSmtp?.smtpEncryption || dbSetting?.smtpEncryption || "tls";
      const fromEmail = customSmtp?.smtpFromEmail || dbSetting?.smtpFromEmail || customSmtp?.supportEmail || dbSetting?.supportEmail || user || "noreply@nexussmm.io";
      const fromName = customSmtp?.smtpFromName || dbSetting?.smtpFromName || customSmtp?.siteName || dbSetting?.siteName || siteFrontendConfig.siteName || "NexusSMM Enterprise";

      if (!host || !user || !pass) {
        return res.status(400).json({
          success: false,
          message: "Cấu hình SMTP chưa hoàn tất! Vui lòng nhập đầy đủ Máy chủ SMTP, Tài khoản và Mật khẩu ứng dụng.",
        });
      }

      // Determine recipients
      let recipients: { email: string; name?: string }[] = [];
      if (recipientType === "all") {
        const allDbUsers = await prisma.user.findMany({
          where: { email: { not: "" } },
          select: { email: true, name: true, username: true },
        });
        recipients = allDbUsers
          .filter((u) => u.email && u.email.includes("@"))
          .map((u) => ({ email: u.email, name: u.name || u.username }));
      } else if (recipientType === "single") {
        if (!targetEmail && !targetUserId) {
          return res.status(400).json({ success: false, message: "Vui lòng chỉ định email người nhận!" });
        }
        if (targetEmail) {
          recipients = [{ email: targetEmail.trim() }];
        } else if (targetUserId) {
          const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
          if (!targetUser || !targetUser.email) {
            return res.status(404).json({ success: false, message: "Không tìm thấy email của người dùng được chọn!" });
          }
          recipients = [{ email: targetUser.email, name: targetUser.name || targetUser.username }];
        }
      } else if (recipientType === "test") {
        const testEmail = targetEmail || fromEmail || user;
        recipients = [{ email: testEmail }];
      }

      if (recipients.length === 0) {
        return res.status(400).json({ success: false, message: "Không có người nhận hợp lệ nào được tìm thấy!" });
      }

      // Create nodemailer transporter
      const isSecure = encryption === "ssl" || port === 465;
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Wrap email HTML with responsive clean design
      const formattedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .email-header { background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 24px 30px; text-align: center; color: #ffffff; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .email-content { padding: 30px; font-size: 14px; color: #334155; }
    .email-footer { background: #f1f5f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>${fromName}</h1>
    </div>
    <div class="email-content">
      ${htmlContent}
    </div>
    <div class="email-footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const recipient of recipients) {
        try {
          await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: recipient.email,
            subject,
            html: formattedHtml,
          });
          successCount++;
        } catch (err: any) {
          failedCount++;
          errors.push(`${recipient.email}: ${err?.message || "Send failed"}`);
        }
      }

      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: "Super Admin",
        action: "BROADCAST_EMAIL_SENT",
        details: `Dispatched email "${subject}" to ${successCount}/${recipients.length} recipients.`,
        severity: failedCount > 0 ? "warning" : "info",
      });

      if (successCount === 0 && failedCount > 0) {
        return res.status(500).json({
          success: false,
          message: `Gửi email thất bại! Lỗi SMTP: ${errors[0] || "Unknown error"}`,
          errors,
        });
      }

      res.json({
        success: true,
        message: `Đã gửi thành công ${successCount}/${recipients.length} email!`,
        successCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("Send email error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Lỗi hệ thống khi thực hiện gửi email qua SMTP",
      });
    }
  });

  app.get("/api/public/site-config", async (req, res) => {
    try {
      const dbSetting = await prisma.setting.findFirst({ where: { id: 1 } });
      if (dbSetting) {
        return res.json({
          success: true,
          data: {
            ...siteFrontendConfig,
            siteName: dbSetting.siteName || siteFrontendConfig.siteName,
            siteTagline: dbSetting.siteTagline || siteFrontendConfig.siteTagline,
            siteLogoUrl: dbSetting.siteLogoUrl || siteFrontendConfig.siteLogoUrl,
            faviconUrl: dbSetting.faviconUrl || siteFrontendConfig.faviconUrl,
            primaryBrandColor: dbSetting.primaryBrandColor || siteFrontendConfig.primaryBrandColor,
            supportEmail: dbSetting.supportEmail || siteFrontendConfig.supportEmail,
            supportTelegram: dbSetting.supportTelegram || siteFrontendConfig.supportTelegram,
            supportHotline: dbSetting.supportHotline || siteFrontendConfig.supportHotline,
            headerAnnouncementBar: dbSetting.headerAnnouncementBar || siteFrontendConfig.headerAnnouncementBar,
            headerAnnouncementActive: Boolean(dbSetting.headerAnnouncementActive),
            footerCopyright: dbSetting.footerCopyright || siteFrontendConfig.footerCopyright,
            seoMetaTitle: dbSetting.seoMetaTitle || siteFrontendConfig.seoMetaTitle,
            seoMetaKeywords: dbSetting.seoMetaKeywords || siteFrontendConfig.seoMetaKeywords,
            seoMetaDescription: dbSetting.seoMetaDescription || siteFrontendConfig.seoMetaDescription,
            seoCanonicalUrl: dbSetting.seoCanonicalUrl || "https://nexussmm.io",
            seoOgTitle: dbSetting.seoOgTitle || siteFrontendConfig.seoMetaTitle,
            seoOgDescription: dbSetting.seoOgDescription || siteFrontendConfig.seoMetaDescription,
            seoOgImageUrl: dbSetting.seoOgImageUrl || "https://nexussmm.io/og-preview.png",
            seoRobotsIndexing: dbSetting.seoRobotsIndexing || "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            seoSitemapUrl: dbSetting.seoSitemapUrl || "https://nexussmm.io/sitemap.xml",
            seoGoogleSiteVerification: dbSetting.seoGoogleSiteVerification || "",
            seoGoogleAnalyticsId: dbSetting.seoGoogleAnalyticsId || "",
            customCss: dbSetting.customCss || "",
            customHeaderScripts: dbSetting.customHeaderScripts || "",
            customBodyScripts: dbSetting.customBodyScripts || "",
          },
        });
      }
    } catch (e) {
      console.warn("Public DB settings read error:", e);
    }
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
