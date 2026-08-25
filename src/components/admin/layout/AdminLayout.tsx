import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
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
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sliders,
  DollarSign,
  Globe,
  Radio,
  FileText,
  Clock,
  Send,
  Building,
  Package,
  ShoppingBag,
  Bell,
  Sparkles,
  Ticket,
  Bot,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Palette,
  Megaphone,
  Tag,
  Cpu,
  ArrowLeft,
  Flame,
  Check,
  User as UserIcon,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection, onNavigate }) => {
  const {
    user,
    language,
    setLanguage,
    currency,
    setCurrency,
    formatMoney,
    t,
    unreadNotifsCount,
    setCurrentRoute,
    switchRole,
    logout,
    addToast,
    refreshData
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [systemUptime, setSystemUptime] = useState(99.99);
  const [isPurging, setIsPurging] = useState(false);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#admin-lang-select-container')) {
        setLangDropdownOpen(false);
      }
      if (!target.closest('#admin-user-menu-container')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const adminNavItems = [
    {
      group: language === 'vi' ? 'VẬN HÀNH' : 'OPERATIONS',
      items: [
        { id: 'overview', label: language === 'vi' ? 'Tổng quan' : 'Overview', icon: Activity, path: '/admin/overview' },
        { id: 'orders', label: language === 'vi' ? 'Đơn hàng' : 'Orders', icon: ShoppingBag, path: '/admin/orders', badge: 'LIVE' },
        { id: 'panels', label: language === 'vi' ? 'Quản lý Panels' : 'SMM Panels', icon: Server, path: '/admin/panels' },
        { id: 'users', label: language === 'vi' ? 'Người dùng & Ví' : 'Users & Wallets', icon: Users, path: '/admin/users' },
      ]
    },
    {
      group: language === 'vi' ? 'DỊCH VỤ & NCC' : 'SERVICES & PROVIDERS',
      items: [
        { id: 'services', label: language === 'vi' ? 'Dịch vụ & Giá' : 'Services & Pricing', icon: Layers, path: '/admin/services' },
        { id: 'providers', label: language === 'vi' ? 'Nhà cung cấp' : 'API Providers', icon: Radio, path: '/admin/providers', badge: 'HUB' },
        { id: 'packages', label: language === 'vi' ? 'Gói thuê Panel' : 'Rental Plans', icon: Package, path: '/admin/packages' },
      ]
    },
    {
      group: language === 'vi' ? 'CẤU HÌNH HỆ THỐNG' : 'PORTAL SETUP',
      items: [
        { id: 'site-config', label: language === 'vi' ? 'Giao diện & Web' : 'Site & Branding', icon: Palette, path: '/admin/site-config', highlight: true },
        { id: 'gateways', label: language === 'vi' ? 'Cổng thanh toán' : 'Gateways & FX', icon: CreditCard, path: '/admin/gateways' },
        { id: 'announcements', label: language === 'vi' ? 'Thông báo' : 'Announcements', icon: Megaphone, path: '/admin/announcements' },
        { id: 'coupons', label: language === 'vi' ? 'Mã giảm giá' : 'Coupons & Promo', icon: Tag, path: '/admin/coupons' },
        { id: 'ai-config', label: language === 'vi' ? 'Quy tắc tự động' : 'Auto Rules', icon: Zap, path: '/admin/ai-config' },
      ]
    },
    {
      group: language === 'vi' ? 'BẢO MẬT' : 'SECURITY',
      items: [
        { id: 'logs', label: language === 'vi' ? 'Nhật ký Audit' : 'Audit Logs', icon: FileText, path: '/admin/logs' },
      ]
    }
  ];

  const handlePurgeGlobalCache = async () => {
    setIsPurging(true);
    try {
      const res = await fetch('/api/admin/system/purge-cache', { method: 'POST' });
      const data = await res.json();
      addToast('success', data.message || 'Global Edge CDN cache purged');
      refreshData();
    } catch {
      addToast('error', 'Failed to purge cache');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Super Admin Header */}
      <header className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between px-3 sm:px-6 shadow-2xs">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs font-black shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight whitespace-nowrap">NexusSMM</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-white tracking-wider uppercase whitespace-nowrap">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Center: Realtime Cluster Nodes Status Pill */}
        <div className="hidden xl:flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>5 Nodes Online</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="text-slate-600 text-[11px] font-mono">
            SLA: <strong className="text-slate-900">99.99%</strong>
          </div>
          <span className="text-slate-300">|</span>
          <div className="text-slate-600 text-[11px] font-mono">
            Ping: <strong className="text-blue-600">142ms</strong>
          </div>
        </div>

        {/* Right: Quick Tools & Client Switch */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Purge CDN button */}
          <button
            onClick={handlePurgeGlobalCache}
            disabled={isPurging}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer"
            title="Purge CDN Cache"
          >
            <Zap className={`w-3 h-3 text-amber-500 ${isPurging ? 'animate-spin' : ''}`} />
            <span>Purge CDN</span>
          </button>

          {/* Quick Switch to Client Portal button - Hidden on Mobile */}
          <button
            onClick={() => {
              setCurrentRoute('/dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
            title={language === 'vi' ? 'Xem giao diện người dùng' : 'Switch to Customer View'}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Trang người dùng' : 'User Portal'}</span>
          </button>

          {/* Language Selector */}
          <div id="admin-lang-select-container" className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <span className={`fi ${language === 'vi' ? 'fi-vn' : 'fi-us'} fis rounded-xs w-4 h-3 inline-block`} />
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in">
                <button
                  onClick={() => {
                    setLanguage('vi');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold ${
                    language === 'vi' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="fi fi-vn fis rounded-xs w-4 h-3 inline-block" />
                    <span>Tiếng Việt</span>
                  </div>
                  {language === 'vi' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('en');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold ${
                    language === 'en' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="fi fi-us fis rounded-xs w-4 h-3 inline-block" />
                    <span>English</span>
                  </div>
                  {language === 'en' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Admin Avatar Menu */}
          <div id="admin-user-menu-container" className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">
                SA
              </div>
              <span className="text-xs font-bold text-slate-700 hidden md:block">Admin</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name || 'System Administrator'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@nexussmm.io'}</p>
                </div>
                <div className="p-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setCurrentRoute('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-left font-semibold"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>{language === 'vi' ? 'Trang cá nhân' : 'Profile & Account'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('site-config');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-left font-semibold"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>{language === 'vi' ? 'Cấu hình hệ thống' : 'Site Configuration'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      switchRole('customer');
                      setCurrentRoute('/dashboard');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer text-left font-bold"
                  >
                    <ArrowLeft className="w-4 h-4 text-indigo-600" />
                    <span>{language === 'vi' ? 'Chuyển sang User Portal' : 'Switch to Customer View'}</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left font-bold"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>{language === 'vi' ? 'Đăng xuất' : 'Log Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Workspace (Sidebar + Dynamic View Area) */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)]">
        {/* Mobile Drawer Navigation (Full-height with proper header and close button) */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200"
            />

            {/* Slide-out Drawer */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-200 h-full">
              {/* Drawer Top Header with Brand & Close Button */}
              <div className="h-14 px-4 border-b border-slate-200/90 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs font-black shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 text-sm tracking-tight">NexusSMM</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-white tracking-wider uppercase">
                      Admin
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Nav Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
                {adminNavItems.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1.5">
                    <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      {group.group}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onNavigate(item.id);
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer text-left ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>

                            {item.badge && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}

                            {item.highlight && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200'
                                }`}
                              >
                                SETUP
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer Bottom Box */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/70 shrink-0 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    setCurrentRoute('/dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Về Trang Người Dùng' : 'Back to User Portal'}</span>
                </button>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Node Anycast</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Memory Cache:</span>
                    <span className="font-mono text-slate-700 font-bold">1.2 GB / 4 GB</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full w-[30%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar (Persistent) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 h-full overflow-hidden">
          {/* Sidebar Nav Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
            {adminNavItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {group.group}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer text-left ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {item.highlight && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              isActive ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            SETUP
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Bottom Box: Quick System Stats */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 shrink-0">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Node Anycast</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Memory Cache:</span>
                <span className="font-mono text-slate-700 font-bold">1.2 GB / 4 GB</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[30%]" />
              </div>
            </div>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
