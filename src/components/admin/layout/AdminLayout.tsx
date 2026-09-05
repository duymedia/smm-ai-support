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
  MessageSquare,
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
    currencies,
    formatMoney,
    t,
    unreadNotifsCount,
    setCurrentRoute,
    switchRole,
    logout,
    addToast,
    refreshData,
    siteConfig,
    applySeoAndHeaderConfig
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [systemUptime, setSystemUptime] = useState(99.99);
  const [isPurging, setIsPurging] = useState(false);

  // Sync SEO and Title for Admin
  useEffect(() => {
    if (siteConfig) {
      applySeoAndHeaderConfig(siteConfig);
    }
    const brandName = siteConfig?.siteName || 'NexusSMM Enterprise';
    document.title = `Admin Quản Trị Hệ Thống - ${brandName}`;
  }, [siteConfig]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!target.closest('#admin-currency-select-container')) {
        setCurrencyDropdownOpen(false);
      }
      if (!target.closest('#admin-lang-select-container')) {
        setLangDropdownOpen(false);
      }
      if (!target.closest('#admin-user-menu-container')) {
        setUserDropdownOpen(false);
      }
    };
    const target = (e: MouseEvent) => e.target as HTMLElement;
    const clickHandler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('#admin-currency-select-container')) setCurrencyDropdownOpen(false);
      if (!el.closest('#admin-lang-select-container')) setLangDropdownOpen(false);
      if (!el.closest('#admin-user-menu-container')) setUserDropdownOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, []);

  const adminNavItems = [
    {
      group: language === 'vi' ? 'VẬN HÀNH' : 'OPERATIONS',
      items: [
        { id: 'overview', label: language === 'vi' ? 'Tổng quan' : 'Overview', icon: Activity, path: '/admin/overview' },
        { id: 'orders', label: language === 'vi' ? 'Đơn hàng' : 'Orders', icon: ShoppingBag, path: '/admin/orders', badge: 'LIVE' },
        { id: 'panels', label: language === 'vi' ? 'Quản lý Panels' : 'SMM Panels', icon: Server, path: '/admin/panels' },
        { id: 'users', label: language === 'vi' ? 'Quản lý người dùng' : 'Users', icon: Users, path: '/admin/users' },
      ]
    },
    {
      group: language === 'vi' ? 'GÓI THUÊ' : 'PACKAGES',
      items: [
        { id: 'packages', label: language === 'vi' ? 'Gói thuê Panel' : 'Rental Plans', icon: Package, path: '/admin/packages' },
      ]
    },
    {
      group: language === 'vi' ? 'CHĂM SÓC KHÁCH HÀNG' : 'CUSTOMER SUPPORT',
      items: [
        { id: 'tickets', label: language === 'vi' ? 'Hỗ trợ & tickets' : 'Support Tickets', icon: MessageSquare, path: '/admin/tickets', badge: 'TICKETS' },
      ]
    },
    {
      group: language === 'vi' ? 'CẤU HÌNH HỆ THỐNG' : 'PORTAL SETUP',
      items: [
        { id: 'site-config', label: language === 'vi' ? 'Giao diện & Web' : 'Site & Branding', icon: Palette, path: '/admin/site-config', highlight: true },
        { id: 'currencies', label: language === 'vi' ? 'Tiền tệ & Tỷ giá' : 'Currencies & FX', icon: DollarSign, path: '/admin/currencies', highlight: true },
        { id: 'gateways', label: language === 'vi' ? 'Cổng thanh toán' : 'Gateways & FX', icon: CreditCard, path: '/admin/gateways' },
        { id: 'announcements', label: language === 'vi' ? 'Thông báo' : 'Announcements', icon: Megaphone, path: '/admin/announcements' },
        { id: 'coupons', label: language === 'vi' ? 'Mã giảm giá' : 'Coupons & Promo', icon: Tag, path: '/admin/coupons' },
        { id: 'ai-config', label: language === 'vi' ? 'Quy tắc tự động' : 'Auto Rules', icon: Zap, path: '/admin/ai-config' },
      ]
    },
    {
      group: language === 'vi' ? 'BẢO MẬT' : 'SECURITY',
      items: [
        { id: 'logs', label: language === 'vi' ? 'Nhật ký hoạt động' : 'Audit Logs', icon: FileText, path: '/admin/logs' },
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

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('overview')}
            title={siteConfig?.siteTagline || siteConfig?.siteName || 'NexusSMM Admin'}
          >
            {siteConfig?.siteLogoUrl ? (
              <img
                src={siteConfig.siteLogoUrl}
                alt="logo"
                className="h-8 max-w-[140px] object-contain rounded-lg shadow-2xs"
              />
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs font-black shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight whitespace-nowrap hidden sm:inline">
                  {siteConfig?.siteName || 'NexusSMM'}
                </span>
              </>
            )}
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

          {/* Currency Select Option Dropdown (Displays Balance + Currency Code) */}
          <div id="admin-currency-select-container" className="relative">
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold text-slate-900 transition-all cursor-pointer shadow-2xs"
              title="Chọn đơn vị tiền tệ & Xem số dư"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-900 font-extrabold tracking-tight">
                  {formatMoney(user?.balance || 0)}
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200/60 font-mono">
                  {currency}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${currencyDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {currencyDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 max-h-72 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 border-b border-slate-100 mb-1 sticky top-0 bg-white">
                  {language === 'vi' ? 'Chọn loại tiền tệ' : 'Select Currency'}
                </div>

                {(currencies && currencies.length > 0 ? currencies.filter(c => c.active) : [
                  { id: 1, code: 'USD', name: 'USD ($)', symbol: '$' },
                  { id: 2, code: 'VND', name: 'VND (₫)', symbol: '₫' },
                ]).map((cur) => (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={() => {
                      setCurrency(cur.code);
                      setCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      currency === cur.code ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                        {cur.symbol}
                      </span>
                      <span>{formatMoney(user?.balance || 0, cur.code)}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {cur.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div id="admin-lang-select-container" className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs"
              title="Chọn ngôn ngữ / Select language"
            >
              <span className={`fi ${language === 'vi' ? 'fi-vn' : 'fi-us'} fis rounded-xs shadow-2xs w-4 h-3.5 inline-block`} />
              <span className="font-semibold text-xs text-slate-800 hidden sm:inline">
                {language === 'vi' ? 'Tiếng Việt' : 'English'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                </div>
                <button
                  type="button"
                  onClick={() => { setLanguage('vi'); setLangDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    language === 'vi' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="fi fi-vn fis rounded-xs shadow-2xs w-4 h-3.5 inline-block" />
                    <span>Tiếng Việt</span>
                  </div>
                  {language === 'vi' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setLanguage('en'); setLangDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    language === 'en' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="fi fi-us fis rounded-xs shadow-2xs w-4 h-3.5 inline-block" />
                    <span>English</span>
                  </div>
                  {language === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Admin Avatar Menu */}
          <div id="admin-user-menu-container" className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden ring-1 ring-slate-200">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user?.name?.slice(0, 2).toUpperCase() || 'AD'
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-blue-600 font-semibold">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name || 'System Administrator'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@nexussmm.io'}</p>
                </div>
                <div className="px-2 py-1 space-y-0.5">
                  <button
                    onClick={() => { setUserDropdownOpen(false); setCurrentRoute('/profile'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>{language === 'vi' ? 'Trang cá nhân' : 'Profile & Account'}</span>
                  </button>
                  <button
                    onClick={() => { setUserDropdownOpen(false); onNavigate('site-config'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>{language === 'vi' ? 'Cấu hình hệ thống' : 'Site Configuration'}</span>
                  </button>
                </div>
                <div className="pt-1 mt-1 border-t border-slate-100 px-2">
                  <button
                    onClick={() => { setUserDropdownOpen(false); logout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
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
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => { onNavigate('overview'); setSidebarOpen(false); }}
                >
                  {siteConfig?.siteLogoUrl ? (
                    <img
                      src={siteConfig.siteLogoUrl}
                      alt="logo"
                      className="h-8 max-w-[120px] object-contain rounded-lg shadow-2xs"
                    />
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs font-black shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                        {siteConfig?.siteName || 'NexusSMM'}
                      </span>
                    </>
                  )}
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
        <main className="flex-1 overflow-y-auto bg-slate-50 min-w-0">
          <div className="p-4 sm:p-5 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
