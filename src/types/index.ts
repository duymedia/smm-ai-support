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
  timezone?: string;
  language: 'en' | 'vi';
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  apiKey?: string;
  emailVerified?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type PanelStatus = 'active' | 'pending' | 'suspended' | 'maintenance' | 'expired';

export type DispatchMethod = 'ticket' | 'telegram' | 'whatsapp' | 'api';

export interface ProviderDispatchConfig {
  enabled: boolean;
  method: DispatchMethod;
  // 1. Ticket Nhà Cung Cấp
  ticket?: {
    providerName?: string;
    loginUrl?: string; // URL đăng nhập NCC
    username?: string; // Tài khoản đăng nhập NCC
    password?: string; // Mật khẩu đăng nhập NCC
    ticketSubjectTemplate?: string;
    ticketMessageTemplate?: string;
    autoCreateOnOrder?: boolean;
  };
  // 2. Telegram Bot / Channel
  telegram?: {
    botToken?: string;
    chatId?: string;
    threadId?: string;
    messageTemplate?: string;
    parseMode?: 'HTML' | 'Markdown';
  };
  // 3. WhatsApp Gateway
  whatsapp?: {
    gatewayUrl?: string;
    apiKey?: string;
    instanceId?: string;
    recipientPhone?: string;
    messageTemplate?: string;
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
  name: string;
  domain: string;
  customDomain?: string;
  apiKey?: string;
  secretKey?: string;
  planId: string;
  planName: string;
  status: PanelStatus;
  createdAt: string;
  expiresAt: string;
  autoRenew?: boolean;
  uptime: number; // e.g. 99.98
  activeServicesCount: number;
  totalOrders: number;
  totalMessages?: number; // Tổng tin nhắn đã xử lý
  todayMessages?: number; // Tin nhắn đã xử lý hôm nay
  messageRatePerMin?: number; // Tốc độ xử lý (tin nhắn/phút)
  monthlyRevenue: number;
  currency: string;
  nameservers: {
    ns1: string;
    ns2: string;
    status: 'configured' | 'pending';
  };
  sslActive: boolean;
  providerApiSynced: boolean;
  healthScore: number; // 0 - 100
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
  pricing: {
    weekly: number;
    monthly: number;
    yearly: number; // with discount
  };
  features: {
    panelsCount: number | 'Unlimited';
    maxOrdersPerMonth: number | 'Unlimited';
    servicesLimit: number | 'Unlimited';
    customDomain: boolean;
    aiOpsAssistant: boolean;
    autoRefillSync: boolean;
    freeSsl: boolean;
    uptimeSla: string;
    supportLevel: 'Standard' | 'Priority 24/7' | 'Dedicated VIP';
    advancedAnalytics: boolean;
    apiAccess: boolean;
    automatedBackup: boolean;
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
  id: string;
  userId: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number; // positive for deposit, negative for purchase/sub
  status: TransactionStatus;
  balanceAfter: number;
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
  allowGuestServiceViewing: boolean;
  enableLiveChatWidget: boolean;
  headerAnnouncementBar: string;
  headerAnnouncementActive: boolean;
  footerCopyright: string;
  seoMetaTitle: string;
  seoMetaKeywords: string;
  seoMetaDescription: string;
  customCss?: string;
  customHeaderScripts?: string;
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
