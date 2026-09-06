import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Bot, Zap, ArrowRight, Menu, X, Sparkles, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, setLanguage, currency, setCurrency, currencies, currentRoute, setCurrentRoute, user, siteConfig, t } = useApp();
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
    { label: t('nav.home'), path: '/#', sectionId: 'hero' },
    { label: t('nav.features'), path: '/#features', sectionId: 'features' },
    { label: t('nav.pricing'), path: '/#pricing', sectionId: 'pricing' },
    { label: t('nav.aiSupport'), path: '/#operations', sectionId: 'operations' },
    { label: t('nav.faq'), path: '/#faq', sectionId: 'faq' },
  ];

  const handleNav = (path: string, sectionId?: string) => {
    setMobileMenuOpen(false);

    if (path.startsWith('/#') || path === '/') {
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', path);
      }

      const isLanding =
        currentRoute === '/' ||
        currentRoute.startsWith('/#') ||
        currentRoute === '/features' ||
        currentRoute === '/pricing' ||
        currentRoute === '/faq' ||
        currentRoute === '/ai-support';

      setCurrentRoute(path);

      const targetEl = sectionId
        ? document.getElementById(sectionId) || document.getElementById(`${sectionId}-section`)
        : null;

      if (isLanding && targetEl && sectionId !== 'hero') {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      } else if (isLanding && (path === '/' || path === '/#' || sectionId === 'hero')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setTimeout(() => {
          const delayedEl = sectionId
            ? document.getElementById(sectionId) || document.getElementById(`${sectionId}-section`)
            : null;
          if (delayedEl && sectionId !== 'hero') {
            delayedEl.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 120);
      }
    } else {
      setCurrentRoute(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentCurrencyObj = currencies?.find((c) => c.code === currency && c.active);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => handleNav('/#', 'hero')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
          >
            {siteConfig?.siteLogoUrl ? (
              <img
                src={siteConfig.siteLogoUrl}
                alt={siteConfig.siteName || 'Logo'}
                className="h-8 max-w-[140px] object-contain rounded-lg shadow-2xs"
              />
            ) : (
              <>
                <div
                  style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
                >
                  <Zap className="w-5 h-5 fill-current text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-bold text-base text-slate-900 tracking-tight">
                      {siteConfig?.siteName || 'NexusSMM'}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'var(--brand-light)',
                        color: 'var(--brand-primary)',
                        borderColor: 'var(--brand-border)',
                      }}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                    >
                      SaaS
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">
                    {siteConfig?.siteTagline || 'Smart SMM Panel Ecosystem'}
                  </p>
                </div>
              </>
            )}
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-full border border-slate-200/80">
            {navLinks.map((link) => {
              const isActive = currentRoute === link.path || (currentRoute === '/' && link.path === '/#');
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path, link.sectionId)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'text-blue-700 bg-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities: Currency, Language Switcher, Auth CTA */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* System Online Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-mono font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tracking-tight text-[10px] uppercase">Online</span>
            </div>

            {/* Currency Dropdown Selector */}
            <div ref={currRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setCurrencyDropdownOpen(!currencyDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs press-tactile"
                title="Chọn tiền tệ / Select currency"
              >
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black font-mono">
                  {currentCurrencyObj?.symbol || (currency === 'USD' ? '$' : '₫')}
                </span>
                <span className="font-mono text-xs font-bold">{currency}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${currencyDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 sticky top-0 bg-white/95">
                    {language === 'vi' ? 'Tiền tệ hiển thị' : 'Display Currency'}
                  </div>
                  {(currencies && currencies.length > 0 ? currencies.filter(c => c.active) : [
                    { id: 1, code: 'USD', name: 'Đô la Mỹ', symbol: '$' },
                    { id: 2, code: 'VND', name: 'Việt Nam Đồng', symbol: '₫' },
                  ]).map((cur) => (
                    <button
                      key={cur.code}
                      type="button"
                      onClick={() => {
                        setCurrency(cur.code);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        currency === cur.code ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                          {cur.symbol}
                        </span>
                        <span className="font-mono">{cur.code} ({cur.symbol})</span>
                      </div>
                      {currency === cur.code && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Dropdown Selector */}
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setCurrencyDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs press-tactile"
                title="Chọn ngôn ngữ / Select language"
              >
                <span className={`fi ${language === 'vi' ? 'fi-vn' : 'fi-us'} fis rounded-full shadow-2xs w-3.5 h-3.5 inline-block`} />
                <span className="font-semibold text-xs text-slate-800">
                  {language === 'vi' ? 'VI' : 'EN'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('vi');
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      language === 'vi' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="fi fi-vn fis rounded-full shadow-2xs w-3.5 h-3.5 inline-block" />
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
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      language === 'en' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="fi fi-us fis rounded-full shadow-2xs w-3.5 h-3.5 inline-block" />
                      <span>English</span>
                    </div>
                    {language === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* User button or Log In / Register Pill Buttons */}
            {user ? (
              <button
                onClick={() => handleNav('/dashboard')}
                className="flex items-center gap-2 h-10 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer press-tactile"
              >
                <span>{t('nav.dashboard')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="h-10 px-4 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer press-tactile"
                >
                  {t('nav.login')}
                </button>
                {siteConfig?.allowUserRegistration !== false && (
                  <button
                    onClick={() => handleNav('/register')}
                    className="flex items-center gap-1.5 h-10 px-5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-xs hover:shadow-md shadow-blue-600/20 transition-all cursor-pointer press-tactile"
                  >
                    <span>{t('nav.register')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu trigger button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              className="px-2.5 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 bg-white shadow-2xs"
            >
              <span className={`fi ${language === 'vi' ? 'fi-vn' : 'fi-us'} fis rounded-full w-3.5 h-3.5 inline-block`} />
              <span>{language.toUpperCase()}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path, link.sectionId)}
                className={`text-left px-4 py-2.5 rounded-full text-xs font-semibold ${
                  currentRoute === link.path || (currentRoute === '/' && link.path === '/#')
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
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
                className="w-full h-11 bg-slate-900 text-white rounded-full font-bold text-xs text-center shadow-xs cursor-pointer press-tactile"
              >
                {t('nav.dashboard')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNav('/login')}
                  className="w-full h-11 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full font-semibold text-xs cursor-pointer press-tactile"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => handleNav('/register')}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs shadow-xs cursor-pointer press-tactile"
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
