import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SmmPanel, SmmService, PanelPackage, User, SmmProvider, AuditLog } from '../../types';
import {
  ShieldCheck,
  Server,
  Layers,
  Users,
  CreditCard,
  Settings,
  Activity,
  Zap,
  RefreshCw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Edit3,
  Trash2,
  Calendar,
  Globe,
  Sliders,
  DollarSign,
  TrendingUp,
  Database,
  Lock,
  Cpu,
  Radio,
  Download,
  Key,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  FileText,
  Clock,
  Send,
  Building,
  Check,
  X,
  Palette,
  Megaphone,
  Tag,
  Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminLayout } from './layout/AdminLayout';
import { AdminOrdersView } from './views/AdminOrdersView';
import { AdminSiteConfigView } from './views/AdminSiteConfigView';
import { AdminAnnouncementsView } from './views/AdminAnnouncementsView';
import { AdminCouponsView } from './views/AdminCouponsView';
import { AdminAiConfigView } from './views/AdminAiConfigView';
import { AdminPackagesView } from './views/AdminPackagesView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminGatewaysView } from './views/AdminGatewaysView';
import { AdminPanelsView } from './views/AdminPanelsView';
import { AdminLogsView } from './views/AdminLogsView';
import { AdminOverviewView } from './views/AdminOverviewView';
import { AdminTicketsView } from './views/AdminTicketsView';
import { AdminCurrenciesView } from './views/AdminCurrenciesView';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'panels'
  | 'services'
  | 'users'
  | 'packages'
  | 'currencies'
  | 'gateways'
  | 'tickets'
  | 'site-config'
  | 'announcements'
  | 'coupons'
  | 'ai-config'
  | 'logs';

export const AdminControlPage: React.FC = () => {
  const {
    user,
    language,
    currency,
    formatMoney,
    t,
    panels,
    services,
    packages,
    addToast,
    refreshData,
    currentRoute,
    setCurrentRoute,
  } = useApp();

  const getInitialTab = (): AdminTab => {
    if (currentRoute === '/admin/orders') return 'orders';
    if (currentRoute === '/admin/panels') return 'panels';
    if (currentRoute === '/admin/services') return 'services';
    if (currentRoute === '/admin/users') return 'users';
    if (currentRoute === '/admin/packages') return 'packages';
    if (currentRoute === '/admin/currencies') return 'currencies';
    if (currentRoute === '/admin/gateways') return 'gateways';
    if (currentRoute === '/admin/site-config') return 'site-config';
    if (currentRoute === '/admin/announcements') return 'announcements';
    if (currentRoute === '/admin/coupons') return 'coupons';
    if (currentRoute === '/admin/ai-config') return 'ai-config';
    if (currentRoute === '/admin/tickets') return 'tickets';
    if (currentRoute === '/admin/logs') return 'logs';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab);

  useEffect(() => {
    const tabFromRoute = getInitialTab();
    if (tabFromRoute !== activeTab) {
      setActiveTab(tabFromRoute);
    }
  }, [currentRoute]);

  const [loading, setLoading] = useState(false);

  // Admin Data State
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminProviders, setAdminProviders] = useState<SmmProvider[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>({
    maintenanceMode: false,
    autoDispatchEnabled: true,
    autoProvisioningEnabled: true,
    autoBankingSync: true,
    usdToVndRate: 25400,
    minDepositUsd: 5.0,
    vietqrConfig: {
      bankCode: 'MBBANK',
      accountNumber: '0988889999',
      accountHolder: 'NEXUS SMM HOLDINGS',
      autoVerify: true,
    },
    cryptoConfig: {
      usdtTrc20Address: 'TY7WvTExsD9Z9eXGqCj4vXvYqNx1K9aM8b',
      usdtErc20Address: '0x71C2B19F8a5065487BAbA4930d4bE346E2073B4D',
      autoConfirmBlocks: 3,
    },
  });

  // Modal / Form States
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [newPanelForm, setNewPanelForm] = useState({
    name: '',
    domain: '',
    planId: 'professional',
    targetUserId: user?.id || 'usr-demo-01',
    days: 30,
  });

  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceForm, setBalanceForm] = useState({
    targetUser: null as User | null,
    type: 'credit' as 'credit' | 'debit',
    amount: 50,
    reason: '',
  });

  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkPriceForm, setBulkPriceForm] = useState({
    category: 'all',
    mode: 'percent' as 'percent' | 'fixed',
    value: 15,
  });

  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [providerForm, setProviderForm] = useState({
    name: '',
    apiUrl: 'https://',
    apiKey: '',
    autoRefill: true,
    priority: 1,
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const savePackage = async (pkg: PanelPackage, changes: Partial<PanelPackage>) => {
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pkg, ...changes }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      addToast('success', language === 'vi' ? 'Đã lưu cấu hình gói.' : 'Package configuration saved.');
      await refreshData();
    } catch (error: any) {
      addToast('error', error.message || 'Unable to save package');
    }
  };

  // Load Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ovRes, uRes, prvRes, logRes, setRes] = await Promise.all([
        fetch('/api/admin/overview').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/providers').then((r) => r.json()),
        fetch('/api/admin/audit-logs').then((r) => r.json()),
        fetch('/api/admin/system/settings').then((r) => r.json()),
      ]);

      if (ovRes?.data) setAdminOverview(ovRes.data);
      if (uRes?.data) setAdminUsers(uRes.data);
      if (prvRes?.data) setAdminProviders(prvRes.data);
      if (logRes?.data) setAuditLogs(logRes.data);
      if (setRes?.data) setSystemSettings(setRes.data);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handlers
  const handleToggleSystemSetting = async (key: string) => {
    const updated = {
      ...systemSettings,
      [key]: !systemSettings[key],
    };
    setSystemSettings(updated);
    try {
      await fetch('/api/admin/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      addToast('success', language === 'vi' ? `Đã cập nhật: ${key}` : `Updated setting: ${key}`);
      loadAdminData();
    } catch {
      addToast('error', 'Failed to update system setting');
    }
  };

  const handlePurgeGlobalCache = async () => {
    try {
      const res = await fetch('/api/admin/system/purge-cache', { method: 'POST' });
      const data = await res.json();
      addToast('success', data.message || 'Global Edge Cache Purged');
      loadAdminData();
      refreshData();
    } catch {
      addToast('error', 'Failed to purge cache');
    }
  };

  const handleSyncAllProviders = async () => {
    try {
      const res = await fetch('/api/admin/system/sync-all-providers', { method: 'POST' });
      const data = await res.json();
      addToast('success', data.message || 'All Providers Synced');
      loadAdminData();
      refreshData();
    } catch {
      addToast('error', 'Failed to sync providers');
    }
  };

  const handleExtendPanel = async (panelId: string, days: number) => {
    try {
      const res = await fetch(`/api/admin/panels/${panelId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        loadAdminData();
        refreshData();
      }
    } catch {
      addToast('error', 'Failed to extend panel');
    }
  };

  const handleTogglePanelStatus = async (panel: SmmPanel) => {
    const newStatus = panel.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/panels/${panel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('info', `Panel ${panel.name} is now ${newStatus.toUpperCase()}`);
        loadAdminData();
        refreshData();
      }
    } catch {
      addToast('error', 'Failed to update panel status');
    }
  };

  const handleDeletePanel = async (panelId: string, panelName: string) => {
    if (!window.confirm(`Are you sure you want to delete panel "${panelName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/panels/${panelId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        loadAdminData();
        refreshData();
      }
    } catch {
      addToast('error', 'Failed to delete panel');
    }
  };

  const handleDirectCreatePanel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPanelForm.name) {
      addToast('error', 'Please enter a panel name');
      return;
    }
    try {
      // Keep admin provisioning on the same canonical endpoint as the admin panels view.
      const res = await fetch('/api/admin/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPanelForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setIsProvisionModalOpen(false);
        setNewPanelForm({
          name: '',
          domain: '',
          planId: 'professional',
          targetUserId: user?.id || 'usr-demo-01',
          days: 30,
        });
        loadAdminData();
        refreshData();
      }
    } catch {
      addToast('error', 'Failed to provision panel');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceForm.targetUser) return;
    try {
      const res = await fetch(`/api/admin/users/${balanceForm.targetUser.id}/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: balanceForm.amount,
          type: balanceForm.type,
          reason: balanceForm.reason || 'Admin manual balance adjustment',
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setIsBalanceModalOpen(false);
        setBalanceForm({ targetUser: null, type: 'credit', amount: 50, reason: '' });
        loadAdminData();
        refreshData();
      }
    } catch {
      addToast('error', 'Failed to adjust balance');
    }
  };

  const handleBulkPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/services/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkPriceForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setIsBulkPriceModalOpen(false);
        loadAdminData();
        refreshData();
      }
    } catch {
      addToast('error', 'Failed to apply bulk pricing');
    }
  };

  const handlePingProvider = async (providerId: string) => {
    try {
      const res = await fetch(`/api/admin/providers/${providerId}/ping`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        loadAdminData();
      }
    } catch {
      addToast('error', 'Ping test failed');
    }
  };

  const handleAddProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerForm.name || !providerForm.apiUrl) {
      addToast('error', 'Provider name and API URL required');
      return;
    }
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setIsProviderModalOpen(false);
        setProviderForm({ name: '', apiUrl: 'https://', apiKey: '', autoRefill: true, priority: 1 });
        loadAdminData();
      }
    } catch {
      addToast('error', 'Failed to add provider');
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      const res = await fetch('/api/admin/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', language === 'vi' ? 'Đã lưu cấu hình hệ thống thành công!' : 'System settings saved successfully!');
        loadAdminData();
      }
    } catch {
      addToast('error', 'Failed to save system settings');
    }
  };

  return (
    <AdminLayout
      activeSection={activeTab}
      onNavigate={(tab) => {
        setActiveTab(tab as AdminTab);
        setCurrentRoute(`/admin/${tab}`);
      }}
    >
      <div className="space-y-6 pb-12">
        {/* Render New Subviews */}
        {activeTab === 'orders' && <AdminOrdersView />}
        {activeTab === 'site-config' && <AdminSiteConfigView />}
        {activeTab === 'announcements' && <AdminAnnouncementsView />}
        {activeTab === 'coupons' && <AdminCouponsView />}
        {activeTab === 'ai-config' && <AdminAiConfigView />}
        {activeTab === 'packages' && <AdminPackagesView />}
        {activeTab === 'tickets' && <AdminTicketsView />}

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW TOÀN SÀN & THỐNG KÊ TOÀN BỘ USERS */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && <AdminOverviewView />}

      {/* ========================================================================= */}
      {/* TAB 2: PANELS MANAGEMENT */}
      {/* ========================================================================= */}
      {/* TAB 2: PANELS MANAGEMENT (MySQL Backed Admin View) */}
      {/* ========================================================================= */}
      {activeTab === 'panels' && <AdminPanelsView />}

      {/* ========================================================================= */}
      {/* TAB 5: USERS & WALLETS */}
      {/* ========================================================================= */}
      {activeTab === 'users' && <AdminUsersView />}

      {/* ========================================================================= */}
      {/* TAB 7: PAYMENT GATEWAYS & VIETNAMESE BANKS / CRYPTO USDT CONFIG */}
      {/* ========================================================================= */}
      {activeTab === 'gateways' && <AdminGatewaysView />}

      {/* ========================================================================= */}
      {/* TAB: CURRENCIES & FX RATES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'currencies' && <AdminCurrenciesView />}

      {/* ========================================================================= */}
      {/* TAB 8: AUDIT LOGS & LOGIN SESSIONS FROM MYSQL (login_sessions) */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && <AdminLogsView />}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL BALANCE ADJUSTMENT */}
      {/* ========================================================================= */}
      {isBalanceModalOpen && balanceForm.targetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Điều Chỉnh Số Dư Ví</h3>
                <p className="text-xs text-slate-500">Khách hàng: {balanceForm.targetUser.name}</p>
              </div>
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại Thao Tác:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceForm({ ...balanceForm, type: 'credit' })}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      balanceForm.type === 'credit'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    + Cộng Tiền (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceForm({ ...balanceForm, type: 'debit' })}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      balanceForm.type === 'debit'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    - Trừ Tiền (Debit)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Tiền ($ USD):</label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm({ ...balanceForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-base focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý Do Ghi Nhận:</label>
                <input
                  type="text"
                  placeholder="VD: Thưởng nạp đầu 20%, Hoàn tiền bù sự cố kỹ thuật"
                  value={balanceForm.reason}
                  onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Xác Nhận Thay Đổi Số Dư
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK MARGIN PRICING */}
      {/* ========================================================================= */}
      {isBulkPriceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Tăng / Giảm Giá Hàng Loạt</h3>
              <button
                onClick={() => setIsBulkPriceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkPriceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Áp Dụng Cho Danh Mục:</label>
                <select
                  value={bulkPriceForm.category}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="all">Tất cả dịch vụ toàn sàn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Facebook">Facebook</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Telegram">Telegram</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hình Thức Điều Chỉnh:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkPriceForm({ ...bulkPriceForm, mode: 'percent' })}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      bulkPriceForm.mode === 'percent'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Theo Tỷ Lệ % (+15%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkPriceForm({ ...bulkPriceForm, mode: 'fixed' })}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      bulkPriceForm.mode === 'fixed'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Theo Giá Cố Định ($)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bulkPriceForm.mode === 'percent' ? 'Tỷ Lệ Tăng/Giảm (%)' : 'Số Tiền Tăng/Giảm ($/1k)'}:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bulkPriceForm.value}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-base focus:bg-white"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Áp Dụng Cho Toàn Bộ Dịch Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PROVIDER */}
      {/* ========================================================================= */}
      {isProviderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Thêm Nhà Cung Cấp SMM API Mới</h3>
              <button
                onClick={() => setIsProviderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProviderSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Nhà Cung Cấp:</label>
                <input
                  type="text"
                  placeholder="VD: SMMHeaven, Peakerr Global"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">API Endpoint URL:</label>
                <input
                  type="text"
                  placeholder="https://provider.com/api/v2"
                  value={providerForm.apiUrl}
                  onChange={(e) => setProviderForm({ ...providerForm, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">API Key / Secret Token:</label>
                <input
                  type="password"
                  placeholder="sec_live_..."
                  value={providerForm.apiKey}
                  onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Kết Nối & Kiểm Tra API Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};
