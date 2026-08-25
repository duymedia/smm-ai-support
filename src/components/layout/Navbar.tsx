import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Bot, Zap, ArrowRight, Menu, X, Sparkles, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, setLanguage, currency, setCurrency, currentRoute, setCurrentRoute, user, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (currRef.current && !currRef.current.contains(e.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.features'), path: '/features' },
    { label: t('nav.pricing'), path: '/pricing' },
    { label: t('nav.aiSupport'), path: '/ai-support' },
    { label: t('nav.faq'), path: '/faq' },
  ];

  const handleNav = (path: string) => {
    setCurrentRoute(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-current text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-base text-slate-900 tracking-tight">NexusSMM</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5 leading-none">SMM SaaS Platform</p>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = currentRoute === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'text-blue-700 bg-blue-50/90 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities: Currency, Language Switcher, Auth CTA */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Currency Dropdown Selector */}
            <div ref={currRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setCurrencyDropdownOpen(!currencyDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs"
                title="Chọn tiền tệ / Select currency"
              >
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black font-mono">
                  {currency === 'USD' ? '$' : '₫'}
                </span>
                <span className="font-mono text-xs font-bold">{currency}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${currencyDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    {language === 'vi' ? 'Tiền tệ hiển thị' : 'Display Currency'}
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
                      <span>USD ($ Dollar)</span>
                    </div>
                    {currency === 'USD' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
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
                      <span>VND (₫ Đồng)</span>
                    </div>
                    {currency === 'VND' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Language Dropdown Selector (Matching DashboardLayout) */}
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setCurrencyDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs"
                title="Chọn ngôn ngữ / Select language"
              >
                <span className={`fi ${language === 'vi' ? 'fi-vn' : 'fi-us'} fis rounded-xs shadow-2xs w-4 h-3.5 inline-block`} />
                <span className="font-semibold text-xs text-slate-800">
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

            {/* User button or Log In / Register */}
            {user ? (
              <button
                onClick={() => handleNav('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <span>{t('nav.dashboard')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => handleNav('/register')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs hover:shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <span>{t('nav.register')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              className="p-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 bg-slate-50"
            >
              <span className={`fi ${language === 'vi' ? 'fi-vn' : 'fi-us'} fis rounded-xs w-4 h-3 inline-block`} />
              <span>{language.toUpperCase()}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentRoute === link.path ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => handleNav('/dashboard')}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs text-center shadow-xs"
              >
                {t('nav.dashboard')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNav('/login')}
                  className="w-full py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-xs"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => handleNav('/register')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  {t('nav.register')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
