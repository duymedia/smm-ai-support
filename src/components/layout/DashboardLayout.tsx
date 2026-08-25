import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Server,
  Layers,
  CreditCard,
  History,
  Package,
  Bot,
  User as UserIcon,
  Settings,
  LogOut,
  Bell,
  Search,
  PlusCircle,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Zap,
  Sparkles,
  ExternalLink,
  LifeBuoy,
  Repeat,
  Send,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab }) => {
  const {
    user,
    language,
    setLanguage,
    currency,
    setCurrency,
    formatMoney,
    currentRoute,
    setCurrentRoute,
    notifications,
    unreadNotifsCount,
    markAllNotificationsAsRead,
    switchRole,
    logout,
    t,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#lang-select-container')) {
        setLangDropdownOpen(false);
      }
      if (!target.closest('#currency-select-container')) {
        setCurrencyDropdownOpen(false);
      }
      if (!target.closest('#notif-container')) {
        setNotifDropdownOpen(false);
      }
      if (!target.closest('#user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { id: 'panels', label: t('nav.myPanels'), icon: Server, path: '/panels', badge: '2' },
    { id: 'services', label: t('nav.myServices'), icon: Layers, path: '/services' },
    { id: 'packages', label: t('nav.packages'), icon: Package, path: '/packages', highlight: true },
    { id: 'dispatch', label: t('nav.dispatch'), icon: Send, path: '/dispatch', badge: 'NCC' },
    { id: 'add-funds', label: t('nav.addFunds'), icon: CreditCard, path: '/add-funds' },
    { id: 'transactions', label: t('nav.transactions'), icon: History, path: '/transactions' },
    { id: 'subscriptions', label: t('nav.subscriptions'), icon: Repeat, path: '/subscriptions' },
    { id: 'support', label: t('nav.support'), icon: LifeBuoy, path: '/support' },
    { id: 'profile', label: t('nav.profile'), icon: UserIcon, path: '/profile' },
    { id: 'settings', label: t('nav.settings'), icon: Settings, path: '/settings' },
  ];

  if (user?.role === 'admin' || activeTab === 'admin') {
    navItems.unshift({
      id: 'admin',
      label: t('nav.admin'),
      icon: ShieldCheck,
      path: '/admin',
      badge: 'MASTER',
    });
  } else {
    // Add Admin quick access for ease of setup
    navItems.push({
      id: 'admin',
      label: t('nav.admin'),
      icon: ShieldCheck,
      path: '/admin',
      badge: 'SETUP',
    });
  }

  const handleNav = (path: string) => {
    setCurrentRoute(path);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3 lg:gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleNav('/dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs shadow-blue-500/20">
              <Zap className="w-4.5 h-4.5 fill-current text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-base text-slate-900 tracking-tight">NexusSMM</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  SaaS
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search panels, services, orders, tickets (Press / to search)..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Right Action Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Select Option Dropdown (Displays Balance + Currency Code) */}
          <div id="currency-select-container" className="relative">
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold text-slate-900 transition-all cursor-pointer shadow-2xs"
              title="Chọn đơn vị tiền tệ & Xem số dư"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-900 font-extrabold tracking-tight">
                  {currency === 'USD'
                    ? `$${(user?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `${Math.round((user?.balance || 0) * 25400).toLocaleString('vi-VN')} ₫`}
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200/60 font-mono">
                  {currency}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${currencyDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {currencyDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 border-b border-slate-100 mb-1">
                  {language === 'vi' ? 'Chọn loại tiền tệ' : 'Select Currency'}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrency('USD');
                    setCurrencyDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    currency === 'USD' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                      $
                    </span>
                    <span>${(user?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                    USD
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrency('VND');
                    setCurrencyDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    currency === 'VND' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[11px]">
                      ₫
                    </span>
                    <span>{Math.round((user?.balance || 0) * 25400).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                    VND
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Top Up Fast Button */}
          <button
            onClick={() => handleNav('/add-funds')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            title="Nạp tiền vào tài khoản"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Nạp tiền' : 'Top Up'}</span>
          </button>

          {/* Language Select Option Dropdown (Icon + Name) */}
          <div id="lang-select-container" className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs"
              title="Chọn ngôn ngữ"
            >
              <span className={`fi ${language === 'vi' ? 'fi-vn' : 'fi-us'} fis rounded-xs shadow-2xs w-4 h-3.5 inline-block`} />
              <span className="hidden sm:inline font-semibold">
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
                  onClick={() => {
                    setLanguage('vi');
                    setLangDropdownOpen(false);
                  }}
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
                  onClick={() => {
                    setLanguage('en');
                    setLangDropdownOpen(false);
                  }}
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

          {/* Notification Center */}
          <div id="notif-container" className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl py-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</span>
                    {unreadNotifsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                        {unreadNotifsCount} new
                      </span>
                    )}
                  </div>
                  {unreadNotifsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 px-2 py-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl transition-colors ${
                          n.read ? 'hover:bg-slate-50 opacity-80' : 'bg-blue-50/50 hover:bg-blue-50/80 font-medium'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Menu */}
          <div id="user-menu-container" className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden ring-1 ring-slate-200">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user?.name?.slice(0, 2).toUpperCase() || 'AM'
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">{user?.name}</p>
                <p className="text-[10px] text-blue-600 font-semibold">
                  {user?.role === 'admin' ? 'Super Admin' : 'Agency Owner'}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>

                <div className="px-2 py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      handleNav('/profile');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>{language === 'vi' ? 'Trang cá nhân' : 'Profile & Account'}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleNav('/settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>{language === 'vi' ? 'Cài đặt' : 'Settings'}</span>
                  </button>
                </div>

                <div className="pt-1 mt-1 border-t border-slate-100 px-2">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
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

      {/* Main Layout Body with Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/90 bg-white p-4 justify-between shrink-0 h-full overflow-y-auto">
          <div className="space-y-5">
            {/* Quick Rent Action Banner */}
            <button
              onClick={() => handleNav('/packages')}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-xs shadow-xs hover:shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>{t('dashboard.rentNewPanel')}</span>
            </button>

            {/* Navigation List */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentRoute === item.path || (item.path !== '/dashboard' && currentRoute.startsWith(item.path));
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-blue-50/90 text-blue-700 font-bold border border-blue-200/60 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer: System Status */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  API Bridges
                </span>
                <span className="text-emerald-700 font-bold">99.99% Uptime</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">All 6 provider API bridges operational.</p>
            </div>

            <button
              onClick={() => handleNav('/')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 py-1 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Landing Page</span>
            </button>
          </div>
        </aside>

        {/* Mobile Drawer Navigation */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-slate-200 p-4 space-y-4 z-50 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">NexusSMM</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => handleNav('/packages')}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('dashboard.rentNewPanel')}</span>
              </button>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = currentRoute === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.path)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                        isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded">{item.badge}</span>}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    logout();
                  }}
                  className="w-full py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold text-center"
                >
                  {t('common.logout')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area & Dashboard Footer */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50/70">
          <main className="flex-1 w-full p-4 sm:p-6 lg:p-7 space-y-6 pb-20 lg:pb-8">
            {children}
          </main>

          {/* Clean Dashboard Footer */}
          <footer className="w-full border-t border-slate-200 bg-white py-3.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  All Systems Operational (14ms)
                </span>
                <span className="hidden md:inline text-slate-300">|</span>
                <span className="hidden md:inline text-slate-500 font-mono">v2.4.0 Enterprise</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
                <button onClick={() => handleNav('/support')} className="hover:text-blue-600 transition-colors cursor-pointer">
                  {t('nav.support')}
                </button>
                <button onClick={() => handleNav('/services')} className="hover:text-blue-600 transition-colors cursor-pointer">
                  {t('nav.myServices')}
                </button>
                <button onClick={() => handleNav('/transactions')} className="hover:text-blue-600 transition-colors cursor-pointer">
                  {t('nav.transactions')}
                </button>
                <span className="text-slate-400">© 2026 NexusSMM Cloud</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 pb-safe flex items-center justify-around shadow-lg">
        <button
          onClick={() => handleNav('/dashboard')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-w-[56px] ${
            currentRoute === '/dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          title={t('nav.dashboard')}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="truncate max-w-[64px] text-center leading-none">
            {language === 'vi' ? 'Tổng Quan' : 'Dashboard'}
          </span>
        </button>

        <button
          onClick={() => handleNav('/panels')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-w-[56px] ${
            currentRoute.startsWith('/panels') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          title={t('nav.myPanels')}
        >
          <Server className="w-5 h-5" />
          <span className="truncate max-w-[64px] text-center leading-none">
            {language === 'vi' ? 'Máy Chủ' : 'Panels'}
          </span>
        </button>

        {/* Center Floating Action Button (FAB) without text for clean balanced symmetry */}
        <button
          onClick={() => handleNav('/packages')}
          className="relative flex items-center justify-center -mt-6 group cursor-pointer focus:outline-hidden"
          title={language === 'vi' ? 'Thuê Panel Mới' : 'Rent New Panel'}
          aria-label="Rent New Panel"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ring-4 ring-white ${
            currentRoute === '/packages'
              ? 'bg-blue-700 shadow-blue-700/40 scale-105'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/35'
          }`}>
            <PlusCircle className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={() => handleNav('/support')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-w-[56px] ${
            currentRoute === '/support' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          title={t('nav.support')}
        >
          <LifeBuoy className="w-5 h-5" />
          <span className="truncate max-w-[64px] text-center leading-none">
            {language === 'vi' ? 'Hỗ Trợ' : 'Support'}
          </span>
        </button>

        <button
          onClick={() => handleNav('/profile')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-w-[56px] ${
            currentRoute === '/profile' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          title={t('nav.profile')}
        >
          <UserIcon className="w-5 h-5" />
          <span className="truncate max-w-[64px] text-center leading-none">
            {language === 'vi' ? 'Hồ Sơ' : 'Profile'}
          </span>
        </button>
      </div>
    </div>
  );
};
