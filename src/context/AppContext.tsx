import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SmmPanel, SmmService, PanelPackage, Subscription, Transaction, SupportTicket, NotificationItem, BillingCycle, ProviderDispatchConfig, SiteFrontendConfig, CurrencyItem } from '../types';
import { translations } from '../locales/translations';
import confetti from 'canvas-confetti';

export const applyBrandTheme = (primaryColor?: string) => {
  if (typeof document === 'undefined') return;
  const hex = primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : '#2563eb';
  const root = document.documentElement;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Tính toán màu gradient thứ hai mượt mà hơn
  const secR = Math.max(0, Math.round(r * 0.82));
  const secG = Math.max(0, Math.round(g * 0.82));
  const secB = Math.min(255, Math.round(b * 0.95 + 15));
  const secondaryHex = '#' + [secR, secG, secB].map((x) => x.toString(16).padStart(2, '0')).join('');

  root.style.setProperty('--brand-primary', hex);
  root.style.setProperty('--brand-secondary', secondaryHex);
  root.style.setProperty('--brand-light', `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.style.setProperty('--brand-border', `rgba(${r}, ${g}, ${b}, 0.22)`);
  root.style.setProperty('--brand-shadow', `rgba(${r}, ${g}, ${b}, 0.28)`);
};

export const applySeoAndHeaderConfig = (config?: Partial<SiteFrontendConfig> | null) => {
  if (typeof document === 'undefined' || !config) return;

  // 1. Document Title
  if (config.seoMetaTitle) {
    document.title = config.seoMetaTitle;
  } else if (config.siteName) {
    document.title = `${config.siteName} - SMM SaaS Platform`;
  }

  // 2. Helper to set or create meta tags
  const setMeta = (attrName: 'name' | 'property', attrValue: string, content?: string) => {
    if (!content) return;
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Standard Meta Tags
  if (config.seoMetaDescription) setMeta('name', 'description', config.seoMetaDescription);
  if (config.seoMetaKeywords) setMeta('name', 'keywords', config.seoMetaKeywords);
  if (config.seoRobotsIndexing) setMeta('name', 'robots', config.seoRobotsIndexing);
  if (config.seoGoogleSiteVerification) setMeta('name', 'google-site-verification', config.seoGoogleSiteVerification);
  if (config.seoBingSiteVerification) setMeta('name', 'msvalidate.01', config.seoBingSiteVerification);

  // OpenGraph Meta Tags
  const ogTitle = config.seoOgTitle || config.seoMetaTitle || config.siteName;
  const ogDesc = config.seoOgDescription || config.seoMetaDescription;
  const ogImg = config.seoOgImageUrl || config.siteLogoUrl;
  if (ogTitle) setMeta('property', 'og:title', ogTitle);
  if (ogDesc) setMeta('property', 'og:description', ogDesc);
  if (ogImg) setMeta('property', 'og:image', ogImg);
  if (config.seoOgType) setMeta('property', 'og:type', config.seoOgType || 'website');
  if (config.seoCanonicalUrl) setMeta('property', 'og:url', config.seoCanonicalUrl);

  // Twitter Cards
  if (config.seoTwitterCard) setMeta('name', 'twitter:card', config.seoTwitterCard);
  if (ogTitle) setMeta('name', 'twitter:title', ogTitle);
  if (ogDesc) setMeta('name', 'twitter:description', ogDesc);
  if (ogImg) setMeta('name', 'twitter:image', ogImg);

  // Favicon Link
  if (config.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = config.faviconUrl;
  }

  // Canonical Link
  if (config.seoCanonicalUrl) {
    let canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement('link');
      canon.rel = 'canonical';
      document.head.appendChild(canon);
    }
    canon.href = config.seoCanonicalUrl;
  }

  // Custom CSS Injection
  const existingStyle = document.getElementById('nexus-custom-css');
  if (config.customCss && config.customCss.trim()) {
    let styleEl = (existingStyle as HTMLStyleElement) || document.createElement('style');
    styleEl.id = 'nexus-custom-css';
    styleEl.textContent = config.customCss;
    if (!existingStyle) {
      document.head.appendChild(styleEl);
    }
  } else if (existingStyle) {
    existingStyle.remove();
  }

  // Helper injecting nodes (supports <link>, <script>, <style>, <meta>, widgets, CDN libraries)
  const injectCustomNodes = (html: string | undefined, targetContainer: HTMLElement, flagAttr: string) => {
    document.querySelectorAll(`[${flagAttr}="true"]`).forEach((el) => el.remove());
    if (!html || !html.trim()) return;

    try {
      const temp = document.createElement('div');
      temp.innerHTML = html;

      Array.from(temp.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          if (tagName === 'script') {
            const newScript = document.createElement('script');
            Array.from(el.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
            newScript.setAttribute(flagAttr, 'true');
            if (el.textContent) newScript.textContent = el.textContent;
            targetContainer.appendChild(newScript);
          } else {
            const clone = el.cloneNode(true) as HTMLElement;
            clone.setAttribute(flagAttr, 'true');

            // Also re-activate any nested scripts inside HTML containers
            const nestedScripts = Array.from(clone.querySelectorAll('script'));
            nestedScripts.forEach((oldScript) => {
              const liveScript = document.createElement('script');
              Array.from(oldScript.attributes).forEach((attr) => liveScript.setAttribute(attr.name, attr.value));
              liveScript.setAttribute(flagAttr, 'true');
              if (oldScript.textContent) liveScript.textContent = oldScript.textContent;
              oldScript.parentNode?.replaceChild(liveScript, oldScript);
            });

            targetContainer.appendChild(clone);
          }
        }
      });
    } catch (err) {
      console.warn(`Custom ${flagAttr} injection error:`, err);
    }
  };

  // Inject Header Nodes (<head>)
  injectCustomNodes(config.customHeaderScripts, document.head, 'data-nexus-custom-head');

  // Inject Body Nodes (End of <body>)
  injectCustomNodes(config.customBodyScripts, document.body, 'data-nexus-custom-body');
};

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'admin';
  senderRole?: 'customer' | 'admin' | 'ai';
  senderName?: string;
  text: string;
  timestamp: string;
  isAiGenerated?: boolean;
}

interface AppContextType {
  user: User | null;
  authLoading: boolean;
  language: 'en' | 'vi';
  currency: string;
  currencies: CurrencyItem[];
  setCurrencies: React.Dispatch<React.SetStateAction<CurrencyItem[]>>;
  siteConfig: SiteFrontendConfig | null;
  setSiteConfig: (config: SiteFrontendConfig | null) => void;
  applyBrandTheme: (primaryColor?: string) => void;
  applySeoAndHeaderConfig: (config?: Partial<SiteFrontendConfig> | null) => void;
  t: (key: string) => string;
  setLanguage: (lang: 'en' | 'vi') => void;
  setCurrency: (cur: string) => void;
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  panels: SmmPanel[];
  services: SmmService[];
  packages: PanelPackage[];
  subscriptions: Subscription[];
  transactions: Transaction[];
  tickets: SupportTicket[];
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  toasts: Toast[];
  aiChatMessages: ChatMessage[];
  sendAiChatMessage: (message: string) => Promise<void>;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  removeToast: (id: string) => void;
  login: (email?: string, role?: string, password?: string, twoFactorCode?: string) => Promise<boolean | '2fa'>;
  socialLogin: (provider: 'google' | 'facebook') => Promise<boolean>;
  register: (name: string, username: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: 'customer' | 'admin') => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  addFunds: (amount: number, paymentMethod: string) => Promise<boolean>;
  rentPackage: (planId: string, billingCycle: BillingCycle, notes?: string) => Promise<boolean>;
  rentPanel: (planId: string, billingCycle: BillingCycle, notes?: string) => Promise<boolean>;
  createPanel: (panelData: { name: string; domain?: string; customDomain?: string; apiKey?: string; secretKey?: string; orderId?: number | string; planId?: string; planName?: string; notes?: string }) => Promise<boolean>;
  renewSubscription: (subId: string) => Promise<boolean>;
  panelAction: (panelId: string, action: string) => Promise<boolean>;
  diagnosePanel: (panelId: string) => Promise<{ diagnosis: string; healthScore: number }>;
  updatePanelDomain: (panelId: string, customDomain: string) => Promise<boolean>;
  updatePanel: (panelId: string, data: Partial<SmmPanel>) => Promise<boolean>;
  deletePanel: (panelId: string) => Promise<boolean>;
  testPanelDispatch: (panelId: string, config?: ProviderDispatchConfig) => Promise<{ success: boolean; message: string; summary?: string }>;
  rotatePanelApiKey: (panelId: string) => Promise<string | null>;
  extendPanel: (panelId: string, days: number, cost: number) => Promise<boolean>;
  togglePanelAutoRenew: (panelId: string) => Promise<boolean>;
  simulateTraffic: (panelId: string) => Promise<boolean>;
  getPanelRemainingTime: (expiresAt: string, createdAt?: string) => {
    days: number;
    hours: number;
    minutes: number;
    text: string;
    isExpired: boolean;
    isUrgent: boolean;
    progressPercent: number;
  };
  toggleServiceStatus: (serviceId: string) => Promise<void>;
  addCustomService: (serviceData: Partial<SmmService>) => Promise<boolean>;
  createTicket: (subject: string, category: string, priority: string, message: string, relatedPanelId?: string) => Promise<boolean>;
  createSupportTicket: (subject: string, category: string, priority: string, message: string, relatedPanelId?: string) => Promise<boolean>;
  sendTicketMessage: (ticketId: string, content: string) => Promise<boolean>;
  markAllNotificationsAsRead: () => Promise<void>;
  formatMoney: (amount?: number | null, customCurrency?: string) => string;
  refreshData: () => Promise<void>;
  selectedPanelForDetail: SmmPanel | null;
  setSelectedPanelForDetail: (panel: SmmPanel | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pre-hydrate user đồng bộ từ localStorage auth_session để tránh nhảy/nháy trang
  const [user, setUserState] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('auth_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.user) return parsed.user;
          if (parsed?.token) {
            const parts = parsed.token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              return {
                id: String(payload.userId || '1'),
                name: payload.name || payload.username || 'User',
                username: payload.username || 'user',
                email: payload.email || '',
                role: payload.role || 'customer',
                balance: 0,
                language: (localStorage.getItem('app_language') as any) || 'vi',
                currency: (localStorage.getItem('app_currency') as any) || 'USD',
                createdAt: new Date().toISOString(),
              } as User;
            }
          }
        }
      } catch {}
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('auth_session');
        return Boolean(raw && JSON.parse(raw)?.token);
      } catch {
        return false;
      }
    }
    return false;
  });

  const setUser = (next: User | null) => {
    setUserState(next);
    if (typeof window === 'undefined') return;
    if (!next) {
      localStorage.removeItem('auth_session');
    } else {
      try {
        const raw = localStorage.getItem('auth_session');
        const prev = raw ? JSON.parse(raw) : {};
        localStorage.setItem('auth_session', JSON.stringify({ ...prev, user: next, email: next.email }));
      } catch {}
      if (next.language && (next.language === 'en' || next.language === 'vi')) {
        setLanguageState(next.language as 'en' | 'vi');
        localStorage.setItem('app_language', next.language);
      }
      if (next.currency) {
        setCurrencyState(next.currency);
        localStorage.setItem('app_currency', next.currency);
      }
    }
  };

  const DEFAULT_CURRENCIES: CurrencyItem[] = [
    { id: 1, code: 'USD', name: 'Đô la Mỹ (USD)', symbol: '$', symbolPosition: 'left', rate: 1.0, thousandSeparator: ',', decimalSeparator: '.', decimalDigits: 2, isDefault: true, autoSync: false, active: true, sortOrder: 0 },
    { id: 2, code: 'VND', name: 'Việt Nam Đồng (VND)', symbol: '₫', symbolPosition: 'right', rate: 25400.0, thousandSeparator: '.', decimalSeparator: ',', decimalDigits: 0, isDefault: false, autoSync: true, active: true, sortOrder: 1 },
  ];

  const [currencies, setCurrencies] = useState<CurrencyItem[]>(DEFAULT_CURRENCIES);

  const [language, setLanguageState] = useState<'en' | 'vi'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('app_language') as 'en' | 'vi') || 'vi';
    }
    return 'vi';
  });

  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_currency') || 'USD';
    }
    return 'USD';
  });
  const [currentRoute, setCurrentRouteState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname || '/';
      const raw = localStorage.getItem('auth_session');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.token) {
            const isPublicOrAuth =
              pathname === '/' ||
              pathname === '/features' ||
              pathname === '/pricing' ||
              pathname === '/faq' ||
              pathname === '/login' ||
              pathname === '/register' ||
              pathname === '/forgot-password' ||
              pathname.startsWith('/reset-password');
            if (isPublicOrAuth) {
              window.history.replaceState({}, '', '/dashboard');
              return '/dashboard';
            }
          }
        } catch {}
      }
      return pathname;
    }
    return '/';
  });

  const setCurrentRoute = (route: string) => {
    setCurrentRouteState(route);
    if (typeof window !== 'undefined' && window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        setCurrentRouteState(window.location.pathname || '/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [siteConfig, setSiteConfig] = useState<SiteFrontendConfig | null>(null);
  const [panels, setPanels] = useState<SmmPanel[]>([]);
  const [services, setServices] = useState<SmmService[]>([]);
  const [packages, setPackages] = useState<PanelPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedPanelForDetail, setSelectedPanelForDetail] = useState<SmmPanel | null>(null);
  const [aiChatMessages, setAiChatMessages] = useState<ChatMessage[]>([]);

  const fetchChatMessages = async () => {
    try {
      const res = await fetch('/api/support/ai/chat/messages?_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAiChatMessages(data.data);
      }
    } catch (e) {
      console.warn('Fetch chat messages error:', e);
    }
  };

  useEffect(() => {
    fetchChatMessages();
  }, [user]);

  const sendAiChatMessage = async (message: string) => {
    const userMsg: ChatMessage = {
      id: `usr-msg-${Date.now()}`,
      sender: 'user',
      senderRole: 'customer',
      senderName: user?.name || 'Bạn',
      text: message,
      timestamp: new Date().toISOString(),
    };

    setAiChatMessages((prev) => [...prev, userMsg]);

    try {
      await fetch('/api/support/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      await fetchChatMessages();
      await refreshData();
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  // Helper for deep translation keys
  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if missing in Vietnamese
        let fallback: any = translations.en;
        for (const fKey of keys) {
          if (fallback && typeof fallback === 'object' && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        return fallback || path;
      }
    }
    return typeof current === 'string' ? current : path;
  };

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const setLanguage = (lang: 'en' | 'vi') => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', lang);
      try {
        const raw = localStorage.getItem('auth_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          localStorage.setItem(
            'auth_session',
            JSON.stringify({
              ...parsed,
              user: parsed.user ? { ...parsed.user, language: lang } : parsed.user,
            })
          );
        }
      } catch {}
    }
    setUserState((prev) => (prev ? { ...prev, language: lang } : null));
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ language: lang }),
      }).catch(() => {});
    } catch {}
  };

  const loadCurrencies = async () => {
    try {
      const res = await fetch('/api/currencies');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        setCurrencies(data.data);
      }
    } catch (err) {
      console.warn('Public currencies load:', err);
    }
  };

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_currency', curr);
      try {
        const raw = localStorage.getItem('auth_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          localStorage.setItem(
            'auth_session',
            JSON.stringify({
              ...parsed,
              user: parsed.user ? { ...parsed.user, currency: curr } : parsed.user,
            })
          );
        }
      } catch {}
    }
    setUserState((prev) => (prev ? { ...prev, currency: curr } : null));
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currency: curr }),
      }).catch(() => {});
    } catch {}
  };

  const formatMoney = (amount?: number | null, customCurrency?: string): string => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    const activeCode = customCurrency || currency;
    const curObj = currencies.find((c) => c.code === activeCode && c.active);

    if (curObj) {
      const converted = validAmount * Number(curObj.rate || 1);
      const formattedNum = converted.toLocaleString(
        curObj.code === 'VND' ? 'vi-VN' : 'en-US',
        {
          minimumFractionDigits: curObj.decimalDigits ?? 2,
          maximumFractionDigits: curObj.decimalDigits ?? 2,
        }
      );
      if (curObj.symbolPosition === 'right') {
        return `${formattedNum} ${curObj.symbol}`;
      }
      return `${curObj.symbol}${formattedNum}`;
    }

    if (activeCode === 'VND') {
      const vndAmount = Math.round(validAmount * 25400);
      return `${vndAmount.toLocaleString('vi-VN')} ₫`;
    }
    return `$${validAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch initial data from Express backend
  const refreshData = async () => {
    try {
      loadCurrencies();
      const initialRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
      // 1. Luôn tải danh mục Packages & Cấu hình Giao diện Công khai
      if (initialRoute === '/' || initialRoute === '/pricing' || initialRoute === '/features' || initialRoute === '/faq') fetch('/api/public/site-config')
        .then((r) => r.json())
        .then((cfgRes) => {
          if (cfgRes?.success && cfgRes?.data) {
            setSiteConfig(cfgRes.data);
            applyBrandTheme(cfgRes.data.primaryBrandColor);
            applySeoAndHeaderConfig(cfgRes.data);
          }
        })
        .catch((err) => console.warn('Public site-config load:', err));

      if (initialRoute === '/' || initialRoute === '/pricing' || initialRoute === '/packages' || initialRoute === '/plans') fetch('/api/packages')
        .then((r) => r.json())
        .then((pkgData) => {
          if (pkgData?.data && Array.isArray(pkgData.data) && pkgData.data.length > 0) {
            setPackages(pkgData.data);
          }
        })
        .catch((err) => console.warn('Public packages load:', err));

      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      if (!token) {
        setUser(null);
        setPanels([]); setServices([]); setSubscriptions([]);
        setTransactions([]); setTickets([]); setNotifications([]);
        return;
      }
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // Only hydrate resources required by the current page. This prevents a
      // navigation to /panels from firing every dashboard/admin request.
      const route = typeof window !== 'undefined' ? window.location.pathname : '/';
      // Drop stale entities before loading the next screen; otherwise a
      // previous page can keep rendering data that is not requested here.
      setPanels([]); setServices([]); setSubscriptions([]); setTransactions([]); setTickets([]); setNotifications([]);
      const requests: Record<string, Promise<any>> = {
        user: fetch('/api/auth/me', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()),
      };
      if (route === '/panels' || route.startsWith('/panels') || route === '/dashboard' || route === '/dispatch') requests.panels = fetch('/api/panels', { headers: authHeaders, credentials: 'include' }).then((r) => r.json());
      if (route === '/dashboard' || route === '/') requests.stats = fetch('/api/dashboard/stats', { headers: authHeaders, credentials: 'include' }).then((r) => r.json());
      if (route === '/panels' || route.startsWith('/panels')) requests.orders = fetch('/api/orders', { headers: authHeaders, credentials: 'include' }).then((r) => r.json());
      if (route === '/services') requests.services = fetch('/api/services', { headers: authHeaders, credentials: 'include' }).then((r) => r.json());
      if (route === '/packages' || route === '/plans') requests.packages = fetch('/api/packages', { headers: authHeaders, credentials: 'include' }).then((r) => r.json());
      if (route.startsWith('/billing') || route === '/add-funds' || route === '/transactions') {
        requests.packages = fetch('/api/packages', { headers: authHeaders, credentials: 'include' }).then((r) => r.json());
        requests.transactions = fetch('/api/transactions', { headers: authHeaders, credentials: 'include' }).then((r) => r.json());
      }
      const [uRes, pnlRes, srvRes, pkgRes, subRes, txRes, tktRes, notifRes] = await Promise.all([
        requests.user, requests.panels || Promise.resolve({}), requests.services || Promise.resolve({}), requests.packages || Promise.resolve({}), requests.subscriptions || Promise.resolve({}), requests.transactions || Promise.resolve({}), requests.tickets || Promise.resolve({}), requests.notifications || Promise.resolve({}),
      ]);

      if (uRes?.success && uRes?.data) {
        setUser(uRes.data);
      } else {
        // Token không hợp lệ hoặc User không tồn tại trong MySQL Database -> Tự động đăng xuất & xóa sạch session
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_session');
        }
        setPanels([]);
        setServices([]);
        setSubscriptions([]);
        setTransactions([]);
        setTickets([]);
        setNotifications([]);

        if (uRes?.code === 'USER_NOT_FOUND' || uRes?.code === 'USER_BANNED') {
          addToast(
            'error',
            language === 'vi'
              ? (uRes?.message || 'Tài khoản không tồn tại trong cơ sở dữ liệu. Đã tự động đăng xuất!')
              : (uRes?.message || 'User not found in database. Logged out automatically!')
          );
        }

        const isPublic =
          typeof window !== 'undefined' &&
          (window.location.pathname === '/' ||
            window.location.pathname === '/features' ||
            window.location.pathname === '/pricing' ||
            window.location.pathname === '/faq');

        setCurrentRoute(isPublic ? window.location.pathname : '/login');
        return;
      }
      if (pnlRes?.data) setPanels(pnlRes.data);
      if (srvRes?.data) {
        const normServices = srvRes.data.map((s: SmmService) => ({
          ...s,
          providerName: s.providerName || s.provider,
        }));
        setServices(normServices);
      }
      if (pkgRes?.data) setPackages(pkgRes.data);
      if (subRes?.data) {
        const normSubs = subRes.data.map((sub: Subscription) => ({
          ...sub,
          planName: sub.planName || sub.packageName,
          amount: sub.amount || sub.price,
          panelId: sub.panelId || sub.associatedPanelId,
        }));
        setSubscriptions(normSubs);
      }
      if (txRes?.data) setTransactions(txRes.data);
      if (tktRes?.data) setTickets(tktRes.data);
      if (notifRes?.data) setNotifications(notifRes.data);
    } catch (err) {
      console.warn('API sync warn:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Re-fetch only when the active route changes. Previously this ran only once
  // and left data from the previous screen hydrated after navigation/reload.
  useEffect(() => {
    refreshData();
  }, [currentRoute]);

  const login = async (email?: string, role?: string, password?: string, twoFactorCode?: string): Promise<boolean | '2fa'> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language, 'Accept-Language': language },
        credentials: 'include',
        body: JSON.stringify({ email: email || 'alex.morgan@nexussmm.io', role, password, twoFactorCode, language }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const token = data.token || data.jwt_token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('auth_session', JSON.stringify({ token, email: data.data.email }));
        }
        setUser(data.data);
        addToast('success', data.message || (language === 'vi' ? 'Đăng nhập thành công!' : 'Success login'));
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        setCurrentRoute('/dashboard');
        await refreshData();
        return true;
      }
      if (data.twoFactorRequired) return '2fa';
      addToast('error', data.message || (language === 'vi' ? 'Đăng nhập thất bại.' : 'Login failed.'));
      return false;
    } catch (e: any) {
      addToast('error', (language === 'vi' ? 'Đăng nhập thất bại: ' : 'Login failed: ') + e.message);
      return false;
    }
  };

  const socialLogin = async (provider: 'google' | 'facebook'): Promise<boolean> => {
    try {
      const providerName = provider === 'facebook' ? 'Facebook' : 'Google';
      const email = provider === 'facebook' ? 'alex.fb@social.io' : 'alex.google@gmail.com';
      const name = provider === 'facebook' ? 'Alex Morgan (Facebook)' : 'Alex Morgan (Google)';

      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language, 'Accept-Language': language },
        credentials: 'include',
        body: JSON.stringify({ provider, email, name, language }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const token = data.token || data.jwt_token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('auth_session', JSON.stringify({ token, email: data.data.email }));
        }
        setUser(data.data);
        addToast('success', data.message || (language === 'vi' ? `Đăng nhập thành công với ${providerName}!` : `Successfully logged in with ${providerName}!`));
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setCurrentRoute('/dashboard');
        await refreshData();
        return true;
      }
      return false;
    } catch (e: any) {
      addToast('error', (language === 'vi' ? `Đăng nhập ${provider === 'facebook' ? 'Facebook' : 'Google'} thất bại: ` : `${provider === 'facebook' ? 'Facebook' : 'Google'} sign-in failed: `) + e.message);
      return false;
    }
  };

  const register = async (name: string, username: string, email: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language, 'Accept-Language': language },
        credentials: 'include',
        body: JSON.stringify({ name, username, email, password: password || 'SecurePass@2026', language }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const token = data.token || data.jwt_token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('auth_session', JSON.stringify({ token, email: data.data.email }));
        }
        setUser(data.data);
        addToast('success', data.message || (language === 'vi' ? 'Đăng ký tài khoản thành công!' : 'Account registered successfully!'));
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setCurrentRoute('/dashboard');
        await refreshData();
        return true;
      }
      addToast('error', data.message || (language === 'vi' ? 'Đăng ký thất bại.' : 'Registration failed.'));
      return false;
    } catch (e: any) {
      addToast('error', (language === 'vi' ? 'Đăng ký thất bại: ' : 'Registration failed: ') + e.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-App-Language': language }, credentials: 'include' });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_session');
    }
    setUser(null);
    setCurrentRoute('/');
    addToast('info', language === 'vi' ? 'Bạn đã đăng xuất thành công.' : 'You have been logged out.');
  };

  const switchRole = async (role: 'customer' | 'admin') => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        addToast('info', language === 'vi' ? `Đã chuyển sang vai trò: ${role.toUpperCase()}` : `Switched role to: ${role.toUpperCase()}`);
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Language': language,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setUser(resData.data);
        addToast('success', resData.message || (language === 'vi' ? 'Cập nhật thông tin cá nhân thành công.' : 'Personal information updated successfully.'));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const addFunds = async (amount: number, paymentMethod: string): Promise<boolean> => {
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'X-App-Language': language,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch('/api/billing/add-funds', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({ amount, paymentMethod }),
      });
      const data = await res.json();
      if (data.success) {
        const newBal = data.newBalance !== undefined ? data.newBalance : data.data?.newBalance;
        if (newBal !== undefined && user) {
          setUser({ ...user, balance: newBal });
        }
        addToast('success', data.message || (language === 'vi' ? 'Nạp tiền vào ví thành công!' : 'Deposit completed successfully!'));
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || (language === 'vi' ? 'Nạp tiền thất bại.' : 'Deposit failed.'));
        return false;
      }
    } catch (e: any) {
      addToast('error', (language === 'vi' ? 'Lỗi khi nạp tiền: ' : 'Error adding funds: ') + e.message);
      return false;
    }
  };

  const rentPackage = async (planId: string, billingCycle: BillingCycle, notes?: string): Promise<boolean> => {
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'X-App-Language': language,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch('/api/packages/rent', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({ planId, billingCycle, notes }),
      });
      const data = await res.json();
      if (data.success) {
        const newBal = data.newBalance !== undefined ? data.newBalance : data.data?.newBalance;
        if (newBal !== undefined && user) {
          setUser({ ...user, balance: newBal });
        }
        addToast('success', data.message || (language === 'vi' ? 'Thuê gói dịch vụ thành công!' : 'Package rented successfully!'));
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || (language === 'vi' ? 'Không thể thuê gói dịch vụ: Số dư không đủ.' : 'Unable to rent package: Insufficient balance.'));
        return false;
      }
    } catch (e: any) {
      addToast('error', (language === 'vi' ? 'Lỗi khi thuê gói: ' : 'Error renting package: ') + e.message);
      return false;
    }
  };

  const createPanel = async (panelData: { name: string; domain?: string; customDomain?: string; apiKey?: string; secretKey?: string; adminUsername?: string; adminPassword?: string; adminTwoFactorSecret?: string; orderId?: number | string; planId?: string; planName?: string; notes?: string }): Promise<boolean> => {
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'X-App-Language': language,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify(panelData),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Thêm Panel thành công!' : 'Panel added successfully!'));
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || (language === 'vi' ? 'Không thể tạo Panel.' : 'Unable to create panel.'));
        return false;
      }
    } catch (e: any) {
      addToast('error', (language === 'vi' ? 'Lỗi khi tạo panel: ' : 'Error creating panel: ') + e.message);
      return false;
    }
  };

  const rentPanel = async (planId: string, billingCycle: BillingCycle, notes?: string): Promise<boolean> => {
    return rentPackage(planId, billingCycle, notes);
  };

  const renewSubscription = async (subId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/renew`, {
        method: 'POST',
        headers: { 'X-App-Language': language },
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Gia hạn gói dịch vụ thành công.' : 'Subscription renewed successfully.'));
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || (language === 'vi' ? 'Gia hạn thất bại.' : 'Renewal failed.'));
        return false;
      }
    } catch (e) {
      return false;
    }
  };

  const panelAction = async (panelId: string, action: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        await refreshData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const diagnosePanel = async (panelId: string): Promise<{ diagnosis: string; healthScore: number }> => {
    const res = await fetch(`/api/panels/${panelId}/diagnose`, { method: 'POST', headers: { 'X-App-Language': language } });
    const data = await res.json();
    return data.data;
  };

  const updatePanelDomain = async (panelId: string, customDomain: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/domain`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ customDomain }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Cập nhật tên miền thành công!' : 'Domain updated successfully!'));
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || (language === 'vi' ? 'Cập nhật tên miền thất bại.' : 'Failed to update domain.'));
        return false;
      }
    } catch (e) {
      addToast('error', language === 'vi' ? 'Lỗi kết nối khi cập nhật tên miền.' : 'Network error updating domain.');
      return false;
    }
  };

  const updatePanel = async (panelId: string, data: Partial<SmmPanel>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('success', resData.message || (language === 'vi' ? 'Cập nhật panel thành công.' : 'Panel updated successfully.'));
        await refreshData();
        return true;
      } else {
        addToast('error', resData.message || (language === 'vi' ? 'Cập nhật panel thất bại.' : 'Failed to update panel.'));
        return false;
      }
    } catch (e) {
      addToast('error', language === 'vi' ? 'Lỗi mạng khi cập nhật panel.' : 'Network error updating panel.');
      return false;
    }
  };

  const deletePanel = async (panelId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}`, {
        method: 'DELETE',
        headers: { 'X-App-Language': language },
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('success', resData.message || (language === 'vi' ? 'Đã xóa panel thành công.' : 'Panel deleted successfully.'));
        await refreshData();
        return true;
      } else {
        addToast('error', resData.message || (language === 'vi' ? 'Xóa panel thất bại.' : 'Failed to delete panel.'));
        return false;
      }
    } catch (e) {
      addToast('error', language === 'vi' ? 'Lỗi mạng khi xóa panel.' : 'Network error deleting panel.');
      return false;
    }
  };

  const testPanelDispatch = async (panelId: string, config?: ProviderDispatchConfig): Promise<{ success: boolean; message: string; summary?: string }> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/test-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ dispatchConfig: config }),
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('success', resData.message || (language === 'vi' ? 'Kiểm tra phân phối đơn hàng thành công!' : 'Test dispatch executed successfully!'));
        await refreshData();
        return { success: true, message: resData.message, summary: resData.summary };
      } else {
        addToast('error', resData.message || (language === 'vi' ? 'Kiểm tra phân phối thất bại.' : 'Test dispatch failed.'));
        return { success: false, message: resData.message || 'Test dispatch failed' };
      }
    } catch (e: any) {
      const errMsg = e.message || (language === 'vi' ? 'Lỗi kết nối khi gửi thử nghiệm.' : 'Network error sending test dispatch.');
      addToast('error', errMsg);
      return { success: false, message: errMsg };
    }
  };

  const rotatePanelApiKey = async (panelId: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/rotate-key`, {
        method: 'POST',
        headers: { 'X-App-Language': language },
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Đã tạo mới API Key thành công.' : 'API Key rotated successfully.'));
        await refreshData();
        return data.data.apiKey;
      } else {
        addToast('error', data.message || (language === 'vi' ? 'Tạo mới API Key thất bại.' : 'Failed to rotate key.'));
        return null;
      }
    } catch (e) {
      addToast('error', language === 'vi' ? 'Lỗi khi tạo API Key mới.' : 'Error generating new key.');
      return null;
    }
  };

  const extendPanel = async (panelId: string, days: number, cost: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ days, cost }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Gia hạn panel thành công!' : 'Panel extended successfully!'));
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || (language === 'vi' ? 'Gia hạn thất bại.' : 'Extension failed.'));
        return false;
      }
    } catch (e) {
      addToast('error', language === 'vi' ? 'Lỗi khi gia hạn panel.' : 'Error extending panel.');
      return false;
    }
  };

  const togglePanelAutoRenew = async (panelId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/toggle-autorenew`, {
        method: 'POST',
        headers: { 'X-App-Language': language },
      });
      const data = await res.json();
      if (data.success) {
        addToast('info', data.message);
        await refreshData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const simulateTraffic = async (panelId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ action: 'simulate_traffic' }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        await refreshData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const getPanelRemainingTime = (expiresAt: string, createdAt?: string) => {
    const now = Date.now();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        text: language === 'vi' ? 'Đã hết hạn' : 'Expired',
        isExpired: true,
        isUrgent: true,
        progressPercent: 0,
      };
    }

    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = '';
    if (language === 'vi') {
      if (totalDays > 0) {
        text = `${totalDays} ngày ${hours} giờ`;
      } else if (hours > 0) {
        text = `${hours} giờ ${minutes} phút`;
      } else {
        text = `${minutes} phút`;
      }
    } else {
      if (totalDays > 0) {
        text = `${totalDays}d ${hours}h`;
      } else if (hours > 0) {
        text = `${hours}h ${minutes}m`;
      } else {
        text = `${minutes}m`;
      }
    }

    const isUrgent = totalDays < 3;

    // Estimate progress if createdAt exists
    let progressPercent = 50;
    if (createdAt) {
      const created = new Date(createdAt).getTime();
      const totalSpan = expiry - created;
      if (totalSpan > 0) {
        progressPercent = Math.max(0, Math.min(100, Math.round((diff / totalSpan) * 100)));
      }
    } else {
      progressPercent = Math.min(100, Math.max(5, Math.round((totalDays / 30) * 100)));
    }

    return {
      days: totalDays,
      hours,
      minutes,
      text,
      isExpired: false,
      isUrgent,
      progressPercent,
    };
  };

  const toggleServiceStatus = async (serviceId: string) => {
    const target = services.find((s) => s.id === serviceId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/services/${serviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
      body: JSON.stringify({ status: newStatus }),
    });
    setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, status: newStatus } : s)));
    addToast('info', language === 'vi' ? `Trạng thái dịch vụ đã chuyển sang: ${newStatus === 'active' ? 'Hoạt động' : 'Tạm dừng'}` : `Service status updated to ${newStatus}`);
  };

  const addCustomService = async (serviceData: Partial<SmmService>): Promise<boolean> => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify(serviceData),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Đã thêm dịch vụ mới vào danh mục!' : 'New service added to catalog!'));
        await refreshData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const createTicket = async (subject: string, category: string, priority: string, message: string, relatedPanelId?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ subject, category, priority, message, relatedPanelId }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Đã gửi yêu cầu hỗ trợ thành công.' : 'Support ticket submitted successfully.'));
        await refreshData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const sendTicketMessage = async (ticketId: string, content: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const markAllNotificationsAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT', headers: { 'X-App-Language': language } });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('info', language === 'vi' ? 'Đã đánh dấu tất cả thông báo là đã đọc.' : 'All notifications marked as read.');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        language,
        currency,
        currencies,
        setCurrencies,
        siteConfig,
        setSiteConfig,
        applyBrandTheme,
        applySeoAndHeaderConfig,
        t,
        setLanguage,
        setCurrency,
        currentRoute,
        setCurrentRoute,
        panels,
        services,
        packages,
        subscriptions,
        transactions,
        tickets,
        notifications,
        unreadNotifsCount,
        toasts,
        aiChatMessages,
        sendAiChatMessage,
        addToast,
        removeToast,
        login,
        socialLogin,
        register,
        logout,
        switchRole,
        updateProfile,
        addFunds,
        rentPackage,
        rentPanel,
        createPanel,
        renewSubscription,
        panelAction,
        diagnosePanel,
        updatePanelDomain,
        updatePanel,
        deletePanel,
        testPanelDispatch,
        rotatePanelApiKey,
        extendPanel,
        togglePanelAutoRenew,
        simulateTraffic,
        getPanelRemainingTime,
        toggleServiceStatus,
        addCustomService,
        createTicket,
        createSupportTicket: createTicket,
        sendTicketMessage,
        markAllNotificationsAsRead,
        formatMoney,
        refreshData,
        selectedPanelForDetail,
        setSelectedPanelForDetail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
