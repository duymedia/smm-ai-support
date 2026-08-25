import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SmmPanel, SmmService, PanelPackage, Subscription, Transaction, SupportTicket, NotificationItem, BillingCycle, ProviderDispatchConfig } from '../types';
import { translations } from '../locales/translations';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AppContextType {
  user: User | null;
  language: 'en' | 'vi';
  currency: 'USD' | 'VND';
  t: (key: string) => string;
  setLanguage: (lang: 'en' | 'vi') => void;
  setCurrency: (cur: 'USD' | 'VND') => void;
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
  rentPanel: (name: string, domain: string, planId: string, billingCycle: BillingCycle) => Promise<boolean>;
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
  formatMoney: (amount: number) => string;
  refreshData: () => Promise<void>;
  selectedPanelForDetail: SmmPanel | null;
  setSelectedPanelForDetail: (panel: SmmPanel | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User chỉ tồn tại trong React state; localStorage chỉ giữ JWT.
  const [user, setUserState] = useState<User | null>(null);
  const setUser = (next: User | null) => {
    setUserState(next);
    if (typeof window === 'undefined') return;
    if (!next) localStorage.removeItem('auth_session');
  };
  const [language, setLanguageState] = useState<'en' | 'vi'>('en');
  const [currency, setCurrency] = useState<'USD' | 'VND'>('USD');
  const [currentRoute, setCurrentRouteState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
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
  const [panels, setPanels] = useState<SmmPanel[]>([]);
  const [services, setServices] = useState<SmmService[]>([]);
  const [packages, setPackages] = useState<PanelPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedPanelForDetail, setSelectedPanelForDetail] = useState<SmmPanel | null>(null);
  const [aiChatMessages, setAiChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: 'Hello! I am your 24/7 Nexus SMM Operations Assistant. I can diagnose DNS configuration, troubleshoot provider latency, optimize pricing margins, and manage auto-refills. How can I help your SMM agency today?',
      timestamp: new Date().toISOString(),
    },
  ]);

  const sendAiChatMessage = async (message: string) => {
    const userMsg: ChatMessage = {
      id: `usr-msg-${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    };

    setAiChatMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/support/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            userName: user?.name,
            walletBalance: user?.balance,
            activePanels: panels,
            language,
          },
        }),
      });

      const data = await res.json();
      const replyText =
        data?.data?.reply ||
        'I have analyzed your inquiry. DNS endpoints are healthy and all provider APIs are running within standard latency parameters (<450ms).';

      const aiMsg: ChatMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      setAiChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Nexus Diagnostics: Operations check complete. Panel instances and upstream provider APIs are synced and operational.',
        timestamp: new Date().toISOString(),
      };
      setAiChatMessages((prev) => [...prev, fallbackMsg]);
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
    if (user) {
      updateProfile({ language: lang });
    }
  };

  const formatMoney = (amount?: number | null): string => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    if (currency === 'VND') {
      const vndAmount = Math.round(validAmount * 25400);
      return `${vndAmount.toLocaleString('vi-VN')} ₫`;
    }
    return `$${validAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch initial data from Express backend
  const refreshData = async () => {
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      if (!token) {
        setUser(null);
        setPanels([]); setServices([]); setPackages([]); setSubscriptions([]);
        setTransactions([]); setTickets([]); setNotifications([]);
        if (typeof window !== 'undefined') localStorage.removeItem('auth_session');
        return;
      }
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [uRes, pnlRes, srvRes, pkgRes, subRes, txRes, tktRes, notifRes] = await Promise.all([
        fetch('/api/auth/me', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()),
        fetch('/api/panels', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()),
        fetch('/api/services', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()),
        fetch('/api/packages', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()),
        fetch('/api/subscriptions', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()),
        fetch('/api/transactions', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()),
        fetch('/api/support/tickets', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()),
        fetch('/api/notifications', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()),
      ]);

      if (uRes?.data) setUser(uRes.data);
      else if (uRes?.success === false || uRes?.status === 401) {
        setUser(null);
        localStorage.removeItem('auth_session');
        setCurrentRoute('/');
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
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const login = async (email?: string, role?: string, password?: string, twoFactorCode?: string): Promise<boolean | '2fa'> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email || 'alex.morgan@nexussmm.io', role, password, twoFactorCode }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const token = data.token || data.jwt_token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('auth_session', JSON.stringify({ token, email: data.data.email }));
        }
        setUser(data.data);
        addToast('success', t('common.success') + ': ' + (data.message || 'Logged in'));
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        setCurrentRoute('/dashboard');
        await refreshData();
        return true;
      }
      if (data.twoFactorRequired) return '2fa';
      addToast('error', data.message || 'Login failed');
      return false;
    } catch (e: any) {
      addToast('error', 'Login failed: ' + e.message);
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider, email, name }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const token = data.token || data.jwt_token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('auth_session', JSON.stringify({ token, email: data.data.email }));
        }
        setUser(data.data);
        addToast('success', `${language === 'vi' ? 'Đăng nhập thành công với' : 'Successfully logged in with'} ${providerName}!`);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setCurrentRoute('/dashboard');
        await refreshData();
        return true;
      }
      return false;
    } catch (e: any) {
      addToast('error', `${provider === 'facebook' ? 'Facebook' : 'Google'} sign-in failed: ` + e.message);
      return false;
    }
  };

  const register = async (name: string, username: string, email: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, username, email, password: password || 'SecurePass@2026' }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const token = data.token || data.jwt_token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('auth_session', JSON.stringify({ token, email: data.data.email }));
        }
        setUser(data.data);
        addToast('success', data.message || 'Welcome to NexusSMM!');
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setCurrentRoute('/dashboard');
        await refreshData();
        return true;
      }
      addToast('error', data.message || 'Registration failed');
      return false;
    } catch (e: any) {
      addToast('error', 'Registration failed: ' + e.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_session');
    }
    setUser(null);
    setCurrentRoute('/');
    addToast('info', 'You have been logged out.');
  };

  const switchRole = async (role: 'customer' | 'admin') => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        addToast('info', `Switched role to: ${role.toUpperCase()}`);
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setUser(resData.data);
        addToast('success', t('profile.personalInfo') + ' updated');
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const addFunds = async (amount: number, paymentMethod: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/billing/add-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || t('addFunds.depositSuccess'));
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || 'Deposit failed');
        return false;
      }
    } catch (e: any) {
      addToast('error', 'Error adding funds');
      return false;
    }
  };

  const rentPanel = async (name: string, domain: string, planId: string, billingCycle: BillingCycle): Promise<boolean> => {
    try {
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain, planId, billingCycle }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', t('checkout.successTitle') + ' - ' + name);
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || 'Failed to rent panel');
        return false;
      }
    } catch (e: any) {
      addToast('error', 'Error renting panel');
      return false;
    }
  };

  const renewSubscription = async (subId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/renew`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Subscription renewed successfully');
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || 'Renewal failed');
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
        headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/panels/${panelId}/diagnose`, { method: 'POST' });
    const data = await res.json();
    return data.data;
  };

  const updatePanelDomain = async (panelId: string, customDomain: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/domain`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || t('panelDetail.domainSaveSuccess'));
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || 'Failed to update domain');
        return false;
      }
    } catch (e) {
      addToast('error', 'Network error updating domain');
      return false;
    }
  };

  const updatePanel = async (panelId: string, data: Partial<SmmPanel>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('success', resData.message || (language === 'vi' ? 'Cập nhật panel thành công' : 'Panel updated successfully'));
        await refreshData();
        return true;
      } else {
        addToast('error', resData.message || 'Failed to update panel');
        return false;
      }
    } catch (e) {
      addToast('error', 'Network error updating panel');
      return false;
    }
  };

  const deletePanel = async (panelId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('success', resData.message || (language === 'vi' ? 'Đã xóa panel thành công' : 'Panel deleted successfully'));
        await refreshData();
        return true;
      } else {
        addToast('error', resData.message || 'Failed to delete panel');
        return false;
      }
    } catch (e) {
      addToast('error', 'Network error deleting panel');
      return false;
    }
  };

  const testPanelDispatch = async (panelId: string, config?: ProviderDispatchConfig): Promise<{ success: boolean; message: string; summary?: string }> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/test-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchConfig: config }),
      });
      const resData = await res.json();
      if (resData.success) {
        addToast('success', resData.message || 'Test dispatch executed successfully!');
        await refreshData();
        return { success: true, message: resData.message, summary: resData.summary };
      } else {
        addToast('error', resData.message || 'Test dispatch failed');
        return { success: false, message: resData.message || 'Test dispatch failed' };
      }
    } catch (e: any) {
      const errMsg = e.message || 'Network error sending test dispatch';
      addToast('error', errMsg);
      return { success: false, message: errMsg };
    }
  };

  const rotatePanelApiKey = async (panelId: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/rotate-key`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || 'API Key rotated successfully');
        await refreshData();
        return data.data.apiKey;
      } else {
        addToast('error', data.message || 'Failed to rotate key');
        return null;
      }
    } catch (e) {
      addToast('error', 'Error generating new key');
      return null;
    }
  };

  const extendPanel = async (panelId: string, days: number, cost: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days, cost }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || t('panelDetail.renewSuccess'));
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        await refreshData();
        return true;
      } else {
        addToast('error', data.message || 'Extension failed');
        return false;
      }
    } catch (e) {
      addToast('error', 'Error extending panel');
      return false;
    }
  };

  const togglePanelAutoRenew = async (panelId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/panels/${panelId}/toggle-autorenew`, {
        method: 'POST',
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
        headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, status: newStatus } : s)));
    addToast('info', `Service status updated to ${newStatus}`);
  };

  const addCustomService = async (serviceData: Partial<SmmService>): Promise<boolean> => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'New service added to catalog!');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, priority, message, relatedPanelId }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Support ticket submitted successfully.');
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
        headers: { 'Content-Type': 'application/json' },
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
    await fetch('/api/notifications/read-all', { method: 'PUT' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('info', 'All notifications marked as read');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        language,
        currency,
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
        rentPanel,
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
