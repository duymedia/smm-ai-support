export type UserRole = 'customer' | 'admin' | 'support' | 'super_admin';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  balance: number;
  avatar?: string;
  phone?: string;
  telegramContact?: string;
  transferCode?: string;
  timezone?: string;
  language: 'en' | 'vi';
  currency?: 'USD' | 'VND' | string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  apiKey?: string;
  adminUsername?: string;
  adminPassword?: string;
  adminTwoFactorSecret?: string;
  emailVerified?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type PanelStatus = 'active' | 'pending' | 'suspended' | 'maintenance' | 'expired';

export type DispatchMethod = 'ticket' | 'telegram' | 'whatsapp' | 'api';

export interface ProviderTicketItem {
  id: string;
  domain: string; // Domain nhà cung cấp (Perfect Panel)
  username: string; // Tài khoản đăng nhập NCC
  password: string; // Mật khẩu đăng nhập NCC
  category?: string; // Category ID (VD: 18, 1, 10...)
  subcategory?: string; // Subcategory ID (VD: 19, 21, 23...)
  enabled?: boolean;
}

export interface ProviderTelegramItem {
  id: string;
  domain: string; // Domain nhà cung cấp (VD: smmflare.com, fastsmm.vip...)
  target: string; // @username hoặc SĐT người nhận (VD: @smmflare_support)
  enabled?: boolean;
}

export interface ProviderWhatsAppItem {
  id: string;
  domain: string; // Domain nhà cung cấp (VD: smmflare.com, fastsmm.vip...)
  targetType: 'user' | 'group';
  userPhone?: string; // SĐT người nhận (+84...)
  groupLink?: string; // Link nhóm WhatsApp
  groupId?: string; // Group ID / JID
  gatewayUrl?: string;
  apiKey?: string;
  instanceId?: string;
  enabled?: boolean;
}

export interface ProviderDispatchConfig {
  enabled: boolean;
  method: DispatchMethod;
  // 1. Ticket Nhà Cung Cấp (Hỗ trợ cấu hình nhiều Domain NCC khác nhau)
  ticket?: {
    providers?: ProviderTicketItem[];
    defaultCategory?: string;
    defaultSubcategory?: string;
    autoCreateOnOrder?: boolean;
    loginUrl?: string;
    username?: string;
    password?: string;
  };
  // 2. Telegram (Hỗ trợ cấu hình nhiều Domain NCC khác nhau)
  telegram?: {
    mode?: 'telethon' | 'bot';
    apiId?: string | number;
    apiHash?: string;
    sessionName?: string;
    target?: string;
    defaultMessage?: string;
    targetType?: 'user' | 'group';
    authUser?: any;
    botToken?: string;
    userPhone?: string;
    userUsername?: string;
    chatId?: string;
    groupUsername?: string;
    threadId?: string;
    autoCreateOnOrder?: boolean;
    providers?: ProviderTelegramItem[];
  };
  // 3. WhatsApp (Hỗ trợ cấu hình nhiều Domain NCC khác nhau)
  whatsapp?: {
    targetType?: 'user' | 'group';
    gatewayUrl?: string;
    apiKey?: string;
    instanceId?: string;
    userPhone?: string;
    recipientPhone?: string;
    groupLink?: string;
    groupId?: string;
    autoCreateOnOrder?: boolean;
    providers?: ProviderWhatsAppItem[];
  };
  // 4. REST API Key
  api?: {
    apiUrl?: string;
    apiKey?: string;
  };
}

export interface SmmPanel {
  id: string;
  userId: string;
  orderId?: number | string;
  packageId?: number | string;
  name: string;
  domain: string;
  customDomain?: string;
  apiKey?: string;
  cookie?: string;
  adminUsername?: string;
  secretKey?: string;
  planId: string;
  planName: string;
  status: PanelStatus;
  createdAt: string;
  expiresAt: string;
  autoRenew?: boolean;
  uptime: number; // e.g. 99.98
  activeServicesCount?: number;
  totalOrders?: number;
  totalMessages?: number; // Tổng tin nhắn đã xử lý
  todayMessages?: number; // Tin nhắn đã xử lý hôm nay
  messageRatePerMin?: number; // Tốc độ xử lý (tin nhắn/phút)
  monthlyRevenue?: number;
  balance?: number;
  currency: string;
  nameservers?: {
    ns1: string;
    ns2: string;
    status: 'configured' | 'pending';
  };
  sslActive?: boolean;
  providerApiSynced?: boolean;
  healthScore?: number; // 0 - 100
  notes?: string;
  dispatchConfig?: ProviderDispatchConfig;
}

export type ServiceCategory = 'Instagram' | 'TikTok' | 'YouTube' | 'Telegram' | 'Twitter/X' | 'Facebook' | 'Spotify';

export interface SmmService {
  id: string;
  panelId?: string;
  name: string;
  category: ServiceCategory;
  provider: string;
  providerName?: string;
  providerServiceId: string;
  originalPricePer1k: number; // cost
  salePricePer1k: number; // selling price
  ratePer1000?: number;
  minQuantity: number;
  maxQuantity: number;
  minOrder?: number;
  maxOrder?: number;
  status: 'active' | 'inactive' | 'disabled';
  ordersCount: number;
  speed: string; // e.g. "Instant (10k/day)"
  avgSpeed?: string;
  refillAvailable: boolean;
  description: string;
}

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface PanelPackage {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  isPopular?: boolean;
  active?: boolean;
  pricing: {
    weekly: number;
    monthly: number;
    yearly: number; // with discount
  };
  features: {
    panelsCount: number | 'Unlimited';
    maxOrdersPerMonth: number | 'Unlimited';
    servicesLimit: number | 'Unlimited';
    uptimeSla: string;
    supportLevel: 'Standard' | 'Priority 24/7' | 'Dedicated VIP';
    apiAccess: boolean;
    customDomain?: boolean;
    aiOpsAssistant?: boolean;
    autoRefillSync?: boolean;
    freeSsl?: boolean;
    advancedAnalytics?: boolean;
    automatedBackup?: boolean;
    [key: string]: any;
  };
}

export type RentalPackage = PanelPackage;

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'renewing';

export interface Subscription {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  planName?: string;
  billingCycle: BillingCycle;
  price: number;
  amount?: number;
  currency: string;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  autoRenew: boolean;
  associatedPanelId?: string;
  panelId?: string;
}

export type TransactionType = 'deposit' | 'subscription' | 'refund' | 'adjustment' | 'renewal' | 'purchase';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export interface Transaction {
  id: string | number;
  code?: string;
  userId: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number; // positive for deposit, negative for purchase/sub/renewal
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  paymentMethod?: string;
  referenceCode?: string;
}

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole | 'ai';
  content: string;
  createdAt: string;
  isAiGenerated?: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: 'panel_issue' | 'api_sync' | 'billing' | 'domain_ssl' | 'feature_request' | 'general';
  relatedPanelId?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  aiSummary?: string;
  messages: TicketMessage[];
  replies?: any[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedActions?: {
    label: string;
    actionType: 'check_dns' | 'sync_provider' | 'enable_service' | 'create_ticket' | 'view_billing';
    payload?: any;
  }[];
  diagnostics?: {
    panelHealth: number;
    detectedIssues: string[];
    fixRecommendation: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  activePanels: number;
  monthlyRecurringRevenue: number;
  totalTransactionsVolume: number;
  openTickets: number;
  systemUptime: number;
  avgAiResolutionTime: string;
}

export interface SmmProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  balance: number;
  currency: string;
  status: 'active' | 'maintenance' | 'error';
  latencyMs: number;
  servicesCount: number;
  lastPingAt: string;
  autoRefill: boolean;
  priority: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  ip?: string;
  severity?: 'info' | 'warning' | 'success' | 'danger';
}

export interface MasterOrder {
  id: string;
  panelId: string;
  panelName: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  category: string;
  targetLink: string;
  quantity: number;
  cost: number;
  charge: number;
  providerId: string;
  providerName: string;
  providerOrderId: string;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'canceled';
  startCount: number;
  remains: number;
  createdAt: string;
  updatedAt: string;
}

export interface SiteFrontendConfig {
  siteName: string;
  siteTagline: string;
  siteLogoUrl: string;
  faviconUrl: string;
  primaryBrandColor: string;
  supportEmail: string;
  supportTelegram: string;
  supportHotline: string;
  allowUserRegistration: boolean;
  allowFreeTrialPanel: boolean;
  freeTrialDurationDays?: number;
  freeTrialMaxPerUser?: number;
  freeTrialStartDate?: string | null;
  freeTrialEndDate?: string | null;
  freeTrialPackageId?: number | null;
  freeTrialRequireVerification?: boolean;
  allowGuestServiceViewing: boolean;
  enableLiveChatWidget: boolean;
  headerAnnouncementBar: string;
  headerAnnouncementActive: boolean;
  footerCopyright: string;
  seoMetaTitle: string;
  seoMetaKeywords: string;
  seoMetaDescription: string;
  seoCanonicalUrl?: string;
  seoOgTitle?: string;
  seoOgDescription?: string;
  seoOgImageUrl?: string;
  seoOgType?: string;
  seoTwitterCard?: string;
  seoRobotsIndexing?: string;
  seoGoogleSiteVerification?: string;
  seoBingSiteVerification?: string;
  seoGoogleAnalyticsId?: string;
  customCss?: string;
  customHeaderScripts?: string;
  customBodyScripts?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpEncryption?: 'tls' | 'ssl' | 'none' | string;
  smtpFromEmail?: string;
  smtpFromName?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  target: 'all' | 'customers' | 'agencies';
  isPopup: boolean;
  active: boolean;
  createdAt: string;
}

export interface CouponItem {
  id: string;
  code: string;
  discountPercent: number;
  maxDiscountUsd: number;
  minOrderUsd: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
}

export interface AiAutomationConfig {
  geminiModel: string;
  systemPrompt: string;
  autoTicketReplyEnabled: boolean;
  autoDnsDiagnostic: boolean;
  autoMarginOptimizer: boolean;
  maxDailyAiTokens: number;
  temperature: number;
}

export type GatewayType = 'vietqr' | 'crypto';
export type BankCode = 'MBBANK' | 'VIETINBANK' | 'VIETCOMBANK' | 'ACB' | 'AGRIBANK' | 'TPBANK' | 'OCB' | 'BIDV' | 'OTHER';
export type CryptoType = 'BINANCE_PAY' | 'USDT';
export type CryptoNetwork = 'TRC20' | 'BEP20' | 'ERC20' | 'POLYGON' | 'BINANCE_DIRECT';

export interface PaymentGatewayItem {
  id: number | string;
  name: string;
  type: GatewayType;
  currency?: 'VND' | 'USD' | string;
  logoUrl?: string;
  bankCode?: BankCode | string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  cryptoType?: CryptoType;
  cryptoNetwork?: CryptoNetwork;
  walletAddress?: string;
  memoTag?: string;
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  qrCodeUrl?: string;
  notes?: string;
  exchangeRateUsdToVnd?: number;
  bonusPercentage?: number;
  webhookSecret?: string;
  webhookUrl?: string;
  instructions?: string; // Ghi chú
  active: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrencyItem {
  id: number;
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'left' | 'right';
  rate: number;
  thousandSeparator: string;
  decimalSeparator: string;
  decimalDigits: number;
  isDefault: boolean;
  autoSync: boolean;
  active: boolean;
  sortOrder: number;
  lastSyncAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

