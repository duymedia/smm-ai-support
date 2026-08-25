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

type AdminTab =
  | 'overview'
  | 'orders'
  | 'panels'
  | 'providers'
  | 'services'
  | 'users'
  | 'packages'
  | 'gateways'
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
    if (currentRoute === '/admin/providers') return 'providers';
    if (currentRoute === '/admin/users') return 'users';
    if (currentRoute === '/admin/packages') return 'packages';
    if (currentRoute === '/admin/gateways') return 'gateways';
    if (currentRoute === '/admin/site-config') return 'site-config';
    if (currentRoute === '/admin/announcements') return 'announcements';
    if (currentRoute === '/admin/coupons') return 'coupons';
    if (currentRoute === '/admin/ai-config') return 'ai-config';
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
      const res = await fetch('/api/admin/panels/create', {
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

        {/* Top Banner: Master Control Header (Only shown on Overview) */}
        {activeTab === 'overview' && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Super Admin Command Hub</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Cluster Uptime 99.99%</span>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {language === 'vi' ? 'Trung Tâm Quản Trị & Vận Hành Toàn Sàn' : 'Master Operations & System Administration'}
                </h1>
                <p className="text-sm text-slate-300 max-w-2xl">
                  {language === 'vi'
                    ? 'Quản lý toàn bộ hạ tầng SMM Panel, cấp phát máy chủ, giám sát cổng Dispatch NCC, cấu hình bảng giá hàng loạt và kiểm soát cổng thanh toán.'
                    : 'Directly manage multi-tenant panel instances, upstream provider gateways, bulk margin multipliers, user wallets, and global platform security.'}
                </p>
              </div>

              {/* Quick Action Hub */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handlePurgeGlobalCache}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'vi' ? 'Xóa Cache CDN' : 'Purge Edge CDN'}</span>
                </button>
                <button
                  onClick={handleSyncAllProviders}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-300" />
                  <span>{language === 'vi' ? 'Đồng Bộ NCC' : 'Sync All Providers'}</span>
                </button>
                <button
                  onClick={() => setIsProvisionModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Tạo Panel Cấp Tốc' : 'Direct Provision Panel'}</span>
                </button>
              </div>
            </div>

            {/* Global Master Emergency Switches Bar */}
            <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                onClick={() => handleToggleSystemSetting('maintenanceMode')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  systemSettings.maintenanceMode
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <p className="text-[11px] font-semibold opacity-75">
                    {language === 'vi' ? 'Chế độ Bảo Trì' : 'Maintenance Mode'}
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {systemSettings.maintenanceMode ? '🔴 ENABLED' : '🟢 Normal Active'}
                  </p>
                </div>
                {systemSettings.maintenanceMode ? (
                  <ToggleRight className="w-6 h-6 text-rose-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div
                onClick={() => handleToggleSystemSetting('autoDispatchEnabled')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  systemSettings.autoDispatchEnabled
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <p className="text-[11px] font-semibold opacity-75">
                    {language === 'vi' ? 'Auto-Dispatch NCC' : 'Provider Auto-Dispatch'}
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {systemSettings.autoDispatchEnabled ? '🟢 RUNNING' : '⏸️ PAUSED'}
                  </p>
                </div>
                {systemSettings.autoDispatchEnabled ? (
                  <ToggleRight className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div
                onClick={() => handleToggleSystemSetting('autoProvisioningEnabled')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  systemSettings.autoProvisioningEnabled
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <p className="text-[11px] font-semibold opacity-75">
                    {language === 'vi' ? 'Tự Động Tạo Panel' : 'Auto Provisioning'}
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {systemSettings.autoProvisioningEnabled ? '⚡ 60s INSTANT' : '🔒 Manual Only'}
                  </p>
                </div>
                {systemSettings.autoProvisioningEnabled ? (
                  <ToggleRight className="w-6 h-6 text-blue-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div
                onClick={() => handleToggleSystemSetting('autoBankingSync')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  systemSettings.autoBankingSync
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div>
                  <p className="text-[11px] font-semibold opacity-75">
                    {language === 'vi' ? 'Tự Động Check Bank' : 'Auto Banking QR'}
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {systemSettings.autoBankingSync ? '🏦 Realtime Webhook' : 'Manual Approval'}
                  </p>
                </div>
                {systemSettings.autoBankingSync ? (
                  <ToggleRight className="w-6 h-6 text-indigo-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </div>
            </div>
          </div>
        )}

      {/* Navigation Tabs for Admin Sections */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'overview', label: language === 'vi' ? 'Tổng quan' : 'Overview', icon: Activity },
          { id: 'panels', label: language === 'vi' ? 'Panels' : 'Panels', icon: Server, count: panels.length },
          { id: 'providers', label: language === 'vi' ? 'Nhà cung cấp' : 'Providers', icon: Radio, count: adminProviders.length },
          { id: 'services', label: language === 'vi' ? 'Dịch vụ' : 'Services', icon: Layers, count: services.length },
          { id: 'users', label: language === 'vi' ? 'Người dùng' : 'Users', icon: Users, count: adminUsers.length },
          { id: 'packages', label: language === 'vi' ? 'Gói thuê' : 'Plans', icon: Sliders },
          { id: 'gateways', label: language === 'vi' ? 'Cổng thanh toán' : 'Gateways', icon: CreditCard },
          { id: 'logs', label: language === 'vi' ? 'Nhật ký audit' : 'Audit Logs', icon: FileText, count: auditLogs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & CLUSTER NODES */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'vi' ? 'Doanh Thu Toàn Nền Tảng' : 'Total Platform Volume'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {formatMoney(adminOverview?.stats?.totalTransactionsVolume || 320490.0)}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+24.8% {language === 'vi' ? 'so với tháng trước' : 'vs last month'}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'vi' ? 'Tổng Số SMM Panels' : 'Active SMM Panels'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Server className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {(adminOverview?.stats?.activePanels || 842).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-2">
                {language === 'vi' ? '100% đang hoạt động ổn định' : '100% operational & SSL secured'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'vi' ? 'Khách Hàng & Agency' : 'Registered Agencies'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {(adminOverview?.stats?.totalUsers || 1423).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-2">
                {language === 'vi' ? '+48 tài khoản đăng ký mới tuần này' : '+48 new registrations this week'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {language === 'vi' ? 'Độ Trễ Gateway Dispatch' : 'Dispatch Latency'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {adminOverview?.stats?.gatewayLatencyAvgMs || 142}ms
              </p>
              <p className="text-xs text-emerald-600 font-bold mt-2">
                {language === 'vi' ? '⚡ Tốc độ tối ưu (<250ms SLA)' : '⚡ Optimal Speed (<250ms SLA)'}
              </p>
            </div>
          </div>

          {/* Infrastructure Cluster & Anycast Edge Nodes Monitor */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'vi' ? 'Trạng Thái Cụm Máy Chủ Edge & Gateway' : 'Global Edge Infrastructure & Gateway Nodes'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'vi'
                    ? 'Giám sát tải CPU, RAM và độ trễ ping thực tế tới các cụm máy chủ toàn cầu'
                    : 'Real-time telemetry from isolated Anycast Edge CDN nodes and provider API proxies'}
                </p>
              </div>
              <button
                onClick={loadAdminData}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{language === 'vi' ? 'Cập nhật ping' : 'Refresh Telemetry'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(adminOverview?.clusterNodes || []).map((node: any) => (
                <div key={node.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      {node.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {node.pingMs}ms
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Region:</span>
                      <span className="font-semibold text-slate-700">{node.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CPU Load:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${node.cpuLoad}%` }} />
                        </div>
                        <span className="font-semibold">{node.cpuLoad}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">RAM:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${node.ramUsage}%` }} />
                        </div>
                        <span className="font-semibold">{node.ramUsage}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400">Active Connections:</span>
                      <span className="font-bold text-slate-800">{node.activeConnections.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PANELS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'panels' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm theo tên panel, domain...' : 'Search panel name, domain...'}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProvisionModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Thêm Panel Mới' : 'Add Direct Panel'}</span>
              </button>
            </div>
          </div>

          {/* Panels Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Panel & Domain</th>
                    <th className="py-3 px-4">Gói Cước</th>
                    <th className="py-3 px-4">Ngày Hết Hạn</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Health / SSL</th>
                    <th className="py-3 px-4 text-right">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {panels
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        p.domain.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3 text-blue-500" />
                            <span>{p.domain}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                            {p.planName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-700">
                            {new Date(p.expiresAt).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}{' '}
                            ngày còn lại
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'suspended'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-emerald-600">{p.healthScore}%</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              SSL Active
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleExtendPanel(p.id, 30)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Tặng thêm +30 ngày"
                            >
                              +30 Ngày
                            </button>
                            <button
                              onClick={() => handleTogglePanelStatus(p)}
                              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                                p.status === 'active'
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {p.status === 'active' ? 'Khóa' : 'Mở'}
                            </button>
                            <button
                              onClick={() => handleDeletePanel(p.id, p.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROVIDERS & FAILOVER HUB */}
      {/* ========================================================================= */}
      {activeTab === 'providers' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Danh Sách Nhà Cung Cấp Nguồn (SMM Providers)' : 'Upstream SMM API Providers'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'vi'
                  ? 'Quản lý kết nối API, số dư tài khoản gốc và tốc độ phản hồi (latency)'
                  : 'Manage upstream API gateways, API keys, live provider balances and latency routing'}
              </p>
            </div>
            <button
              onClick={() => setIsProviderModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Kết Nối NCC Mới' : 'Connect New Provider'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminProviders.map((prv) => (
              <div key={prv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      #{prv.priority}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{prv.name}</h3>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{prv.apiUrl}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {prv.latencyMs}ms
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Số Dư Gốc</span>
                    <p className="font-bold text-slate-900">{formatMoney(prv.balance)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Dịch Vụ</span>
                    <p className="font-bold text-slate-900">{prv.servicesCount} services</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Auto-Refill</span>
                    <p className="font-bold text-emerald-600">{prv.autoRefill ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    Last ping: {new Date(prv.lastPingAt).toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePingProvider(prv.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Activity className="w-3 h-3 text-blue-600" />
                      <span>Ping Live</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SERVICES & BULK PRICING */}
      {/* ========================================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên dịch vụ..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Facebook">Facebook</option>
                <option value="YouTube">YouTube</option>
                <option value="Telegram">Telegram</option>
                <option value="Twitter/X">Twitter / X</option>
              </select>
            </div>

            <button
              onClick={() => setIsBulkPriceModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'vi' ? 'Tăng/Giảm Giá Hàng Loạt' : 'Bulk Margin Multiplier'}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Tên Dịch Vụ</th>
                    <th className="py-3 px-4">Danh Mục</th>
                    <th className="py-3 px-4">Giá Gốc NCC</th>
                    <th className="py-3 px-4">Giá Bán Niêm Yết</th>
                    <th className="py-3 px-4">Lợi Nhuận (Margin)</th>
                    <th className="py-3 px-4">Min / Max</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services
                    .filter(
                      (s) =>
                        (categoryFilter === 'all' || s.category === categoryFilter) &&
                        s.name.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .slice(0, 25)
                    .map((s) => {
                      const marginPercent = Math.round(
                        ((s.salePricePer1k - s.originalPricePer1k) / s.originalPricePer1k) * 100
                      );
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 max-w-sm truncate">{s.name}</div>
                            <div className="text-[10px] text-slate-400">{s.speed}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{s.category}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">${s.originalPricePer1k.toFixed(3)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">
                            ${s.salePricePer1k.toFixed(3)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              +{marginPercent}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {s.minQuantity.toLocaleString()} - {s.maxQuantity.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {s.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: USERS & WALLETS */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm user theo tên, email..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Thành Viên</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Quyền Hạn</th>
                    <th className="py-3 px-4">Số Dư Ví</th>
                    <th className="py-3 px-4">Số Panels Đang Thuê</th>
                    <th className="py-3 px-4 text-right">Điều Chỉnh Số Dư</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminUsers
                    .filter(
                      (u) =>
                        u.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400">ID: {u.id}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {formatMoney(u.balance)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {(u as any).panelsCount || 1} panel(s)
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setBalanceForm({
                                targetUser: u,
                                type: 'credit',
                                amount: 50,
                                reason: 'Bonus nạp ví / khuyến mãi',
                              });
                              setIsBalanceModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Cộng / Trừ Ví
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PACKAGES CONFIG */}
      {/* ========================================================================= */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-200">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                  <p className="text-xs text-slate-500">{pkg.tagline}</p>
                </div>
                {pkg.badge && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                    {pkg.badge}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá theo tuần:</span>
                  <span className="font-bold text-slate-900">${pkg.pricing.weekly}/tuần</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá theo tháng:</span>
                  <span className="font-bold text-blue-700">${pkg.pricing.monthly}/tháng</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá theo năm:</span>
                  <span className="font-bold text-emerald-700">${pkg.pricing.yearly}/năm</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Giới hạn đơn: <strong>{pkg.features.maxOrdersPerMonth.toLocaleString()}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Giới hạn dịch vụ: <strong>{pkg.features.servicesLimit}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tự động hóa: <strong>{pkg.features.aiOpsAssistant ? 'Có' : 'Không'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hỗ trợ: <strong>{pkg.features.supportLevel}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PAYMENT GATEWAYS & SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'gateways' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* VietQR Bank Gateway */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">VietQR & Ngân Hàng Việt Nam (Tự Động)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã Ngân Hàng:</label>
                <input
                  type="text"
                  value={systemSettings.vietqrConfig?.bankCode || 'MBBANK'}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      vietqrConfig: { ...systemSettings.vietqrConfig, bankCode: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Tài Khoản:</label>
                <input
                  type="text"
                  value={systemSettings.vietqrConfig?.accountNumber || '0988889999'}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      vietqrConfig: { ...systemSettings.vietqrConfig, accountNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản:</label>
                <input
                  type="text"
                  value={systemSettings.vietqrConfig?.accountHolder || 'NEXUS SMM HOLDINGS'}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      vietqrConfig: { ...systemSettings.vietqrConfig, accountHolder: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Crypto USDT Gateway */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Crypto USDT Gateway (TRC20 / ERC20)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ví USDT TRC20 Address:</label>
                <input
                  type="text"
                  value={systemSettings.cryptoConfig?.usdtTrc20Address || ''}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      cryptoConfig: { ...systemSettings.cryptoConfig, usdtTrc20Address: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tỷ Giá Quy Đổi USD -&gt; VND:</label>
                <input
                  type="number"
                  value={systemSettings.usdToVndRate || 25400}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      usdToVndRate: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSystemSettings}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Lưu Thiết Lập Cổng Thanh Toán
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'vi' ? 'Nhật Ký Hoạt Động Hệ Thống Realtime' : 'Real-time System Audit Logs'}
            </h3>
            <button
              onClick={() => {
                const jsonStr = JSON.stringify(auditLogs, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nexus_audit_logs_${Date.now()}.json`;
                a.click();
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50/80 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                      {log.actor}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">{log.details}</p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DIRECT PROVISION PANEL */}
      {/* ========================================================================= */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Cấp Phát Panel Trực Tiếp (Admin)</h3>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectCreatePanel} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Panel Thương Hiệu:</label>
                <input
                  type="text"
                  placeholder="VD: SMM King Agency, FlashLikes VIP"
                  value={newPanelForm.name}
                  onChange={(e) => setNewPanelForm({ ...newPanelForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Miền (Subdomain hoặc Custom):</label>
                <input
                  type="text"
                  placeholder="VD: kingagency.com hoặc kingagency"
                  value={newPanelForm.domain}
                  onChange={(e) => setNewPanelForm({ ...newPanelForm, domain: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gói Cước:</label>
                  <select
                    value={newPanelForm.planId}
                    onChange={(e) => setNewPanelForm({ ...newPanelForm, planId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="starter">Starter Panel</option>
                    <option value="professional">Professional Agency</option>
                    <option value="business">High-Volume Business</option>
                    <option value="enterprise">Enterprise Elite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thời Gian Cấp (Ngày):</label>
                  <input
                    type="number"
                    value={newPanelForm.days}
                    onChange={(e) => setNewPanelForm({ ...newPanelForm, days: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Xác Nhận Khởi Tạo Panel Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
