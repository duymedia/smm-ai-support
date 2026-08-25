import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import {
  Zap,
  Bot,
  Server,
  ShieldCheck,
  Globe2,
  TrendingUp,
  CreditCard,
  Cpu,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Layers,
  Activity,
  Terminal,
  Clock,
  Coins,
  Headphones,
  Flame,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentRoute, packages, formatMoney, t } = useApp();
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [aiPromptInput, setAiPromptInput] = useState('How do I handle slow order fulfillment from Provider #14?');
  const [aiSimulatedLoading, setAiSimulatedLoading] = useState(false);
  const [aiDemoReply, setAiDemoReply] = useState<string | null>(null);

  const handleRunAiDemo = async () => {
    setAiSimulatedLoading(true);
    try {
      const res = await fetch('/api/support/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: aiPromptInput }),
      });
      const data = await res.json();
      setAiDemoReply(data?.data?.reply || 'Diagnostic completed: Failover rerouted 45 orders to backup Provider #08 with 0% price increase.');
    } catch (e) {
      setAiDemoReply('Diagnostic completed: Failover rerouted 45 orders to backup Provider #08 with 0% price increase.');
    } finally {
      setAiSimulatedLoading(false);
    }
  };

  const faqItems = [
    {
      q: 'How fast is a new SMM panel provisioned after rental?',
      a: 'Your SMM panel instance is deployed automatically in under 60 seconds on high-speed NVMe cloud servers with free SSL certificates and pre-configured database endpoints.',
    },
    {
      q: 'Can I connect multiple upstream SMM API providers?',
      a: 'Yes! NexusSMM supports connecting unlimited upstream SMM API v2 providers. You can easily map services, set automatic profit margins, and enable automated failovers.',
    },
    {
      q: 'How does the Nexus Operations Assistant help my panel?',
      a: 'Nexus continuously monitors provider API response latencies, detects order queues that are stalled or partial, automates customer support tickets, and suggests profit-maximizing margin pricing.',
    },
    {
      q: 'Can I use my own custom domain (e.g., mypanel.com)?',
      a: 'Absolutely. Every plan supports white-label custom domains. Simply point your domain A-Record or Nameservers, and our system auto-provisions TLS 1.3 SSL and Edge CDN caching.',
    },
    {
      q: 'What payment methods can I use to rent a panel or add wallet funds?',
      a: 'We support international Credit/Debit cards via Stripe, PayPal Express, Crypto (USDT TRC20/ERC20, Bitcoin), and instant Vietnamese Bank Transfer via VietQR.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/60 border-b border-slate-200/80">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('landing.badge')}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
            {t('landing.heroTitlePrefix')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {t('landing.heroTitleHighlight')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => setCurrentRoute('/packages')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>{t('landing.ctaPrimary')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('pricing-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              {t('landing.ctaSecondary')}
            </button>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('landing.stats.activePanels')}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{t('landing.stats.panelsLabel')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">{t('landing.stats.ordersProcessed')}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{t('landing.stats.ordersLabel')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{t('landing.stats.uptime')}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{t('landing.stats.uptimeLabel')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{t('landing.stats.aiResolution')}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{t('landing.stats.aiResolutionLabel')}</div>
            </div>
          </div>

          {/* Interactive Live Control Center Mockup Preview */}
          <div className="mt-12 relative max-w-5xl mx-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden text-left">
            {/* Top Mock Window Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">nexus-panel-ops.internal — Live Telemetry</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Auto-Pilot: Active</span>
              </div>
            </div>

            {/* Mock Dashboard Preview Content */}
            <div className="p-5 sm:p-7 bg-slate-50/70 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">Active Fleet Revenue</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">$28,490.50 /mo</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">+18.4% vs last week</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">Orders Processing Rate</span>
                  <div className="text-xl font-bold text-blue-600 mt-1">1,420 orders / min</div>
                  <span className="text-[11px] text-slate-500">6 Connected API Providers</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">Fleet Health Score</span>
                  <div className="text-xl font-bold text-emerald-600 mt-1">99.8 / 100</div>
                  <span className="text-[11px] text-emerald-700 font-medium">0 stuck orders</span>
                </div>
              </div>

              {/* Interactive SMM Copilot Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-indigo-950 text-white border border-indigo-900 shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span>Interactive SMM Operations Diagnostic</span>
                  </div>
                  <span className="text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded font-mono">
                    v2.4 Core Engine
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-indigo-900/60 border border-indigo-800 rounded-lg text-white placeholder-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
                    placeholder="Ask assistant to troubleshoot orders, DNS, or margin prices..."
                  />
                  <button
                    onClick={handleRunAiDemo}
                    disabled={aiSimulatedLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {aiSimulatedLoading ? 'Analyzing...' : 'Run Diagnostic'}
                  </button>
                </div>

                {aiDemoReply && (
                  <div className="mt-3 p-3 rounded-lg bg-indigo-900/80 border border-indigo-700/60 text-xs text-indigo-100 whitespace-pre-wrap leading-relaxed animate-in fade-in">
                    {aiDemoReply}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('landing.featuresTitle')}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('landing.features.aiOpsTitle')}</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t('landing.features.aiOpsDesc')}</p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('landing.features.instantDeployTitle')}</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t('landing.features.instantDeployDesc')}</p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('landing.features.customDomainTitle')}</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t('landing.features.customDomainDesc')}</p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('landing.features.providerSyncTitle')}</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t('landing.features.providerSyncDesc')}</p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('landing.features.billingTitle')}</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t('landing.features.billingDesc')}</p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('landing.features.multiLangTitle')}</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t('landing.features.multiLangDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Zero Code Workflow</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Launch Your High-Profit SMM Store in 3 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 relative">
              <div className="text-3xl font-black text-blue-600 mb-3">01</div>
              <h3 className="text-base font-bold text-slate-900">Select Rental Plan & Domain</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Choose weekly, monthly, or annual billing. Attach your domain name or get an instant free .nexussmm.store subdomain.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 relative">
              <div className="text-3xl font-black text-indigo-600 mb-3">02</div>
              <h3 className="text-base font-bold text-slate-900">Import SMM Services & Margins</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect your upstream API key (e.g. Instagram, TikTok, YouTube). Set markup rules (e.g. 50% profit margin) in 1-click.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 relative">
              <div className="text-3xl font-black text-emerald-600 mb-3">03</div>
              <h3 className="text-base font-bold text-slate-900">Autonomous Automation Takes Over</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nexus automatically routes orders, auto-fails over down providers, triggers auto-refills, and runs 24/7 client ticket triage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing-section" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-semibold text-blue-600">Predictable Billing</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              {t('packages.title')}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              {t('packages.subtitle')}
            </p>

            {/* Period Switcher */}
            <div className="mt-6 inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setBillingPeriod('weekly')}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  billingPeriod === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('packages.billingWeekly')}
              </button>
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  billingPeriod === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('packages.billingMonthly')}
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingPeriod === 'yearly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{t('packages.billingYearly')}</span>
                <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full font-bold">
                  {t('common.savePercent')}
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const price = pkg.pricing[billingPeriod];
              const periodLabel =
                billingPeriod === 'weekly'
                  ? t('common.perWeek')
                  : billingPeriod === 'monthly'
                  ? t('common.perMonth')
                  : t('common.perYear');

              return (
                <div
                  key={pkg.id}
                  className={`relative p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    pkg.isPopular
                      ? 'bg-slate-900 text-white border-blue-600 shadow-xl ring-2 ring-blue-600/30'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                      {pkg.badge}
                    </div>
                  )}

                  <div>
                    <h3 className={`text-base font-bold ${pkg.isPopular ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</h3>
                    <p className={`text-xs mt-1 min-h-[36px] ${pkg.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                      {pkg.tagline}
                    </p>

                    <div className="mt-5 pb-5 border-b border-slate-200/40">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold">{formatMoney(price)}</span>
                        <span className={`text-xs ${pkg.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{periodLabel}</span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span><strong>{pkg.features.panelsCount}</strong> SMM Panel Instances</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Up to <strong>{typeof pkg.features.maxOrdersPerMonth === 'number' ? pkg.features.maxOrdersPerMonth.toLocaleString() : pkg.features.maxOrdersPerMonth}</strong> Orders/mo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Custom Domain & Free SSL</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Autonomous Ops & Dispatch</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{pkg.features.uptimeSla} Uptime SLA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Support: {pkg.features.supportLevel}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentRoute('/packages')}
                    className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      pkg.isPopular
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {t('packages.rentNow')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('landing.faqTitle')}
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {t('landing.ctaBannerTitle')}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            {t('landing.ctaBannerSubtitle')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setCurrentRoute('/register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-lg hover:bg-blue-50 transition-all cursor-pointer"
            >
              Start Free Trial Now
            </button>
            <button
              onClick={() => setCurrentRoute('/packages')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white font-semibold text-sm border border-blue-400/40 transition-all cursor-pointer"
            >
              Explore Plans
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Zap className="w-5 h-5 text-blue-500 fill-current" />
              <span>NexusSMM Platform</span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              Enterprise-grade SaaS infrastructure for renting, managing, and scaling automated SMM panels worldwide.
            </p>
            <div className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} NexusSMM Technologies Inc. All rights reserved.
            </div>
          </div>

          <div>
            <p className="font-bold text-white text-xs mb-3">Product</p>
            <ul className="space-y-2">
              <li><button onClick={() => setCurrentRoute('/packages')} className="hover:text-white">Rental Packages</button></li>
              <li><button onClick={() => setCurrentRoute('/features')} className="hover:text-white">Features</button></li>
              <li><button onClick={() => setCurrentRoute('/support')} className="hover:text-white">Operations & Support</button></li>
              <li><button onClick={() => setCurrentRoute('/pricing')} className="hover:text-white">Pricing</button></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-white text-xs mb-3">Resources</p>
            <ul className="space-y-2">
              <li><button onClick={() => setCurrentRoute('/faq')} className="hover:text-white">Knowledge Base</button></li>
              <li><span className="text-slate-500">API Documentation</span></li>
              <li><span className="text-slate-500">Uptime Status</span></li>
              <li><span className="text-slate-500">DNS Setup</span></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-white text-xs mb-3">Account</p>
            <ul className="space-y-2">
              <li><button onClick={() => setCurrentRoute('/login')} className="hover:text-white">Customer Log In</button></li>
              <li><button onClick={() => setCurrentRoute('/register')} className="hover:text-white">Get Started</button></li>
              <li><button onClick={() => setCurrentRoute('/dashboard')} className="hover:text-white">Dashboard</button></li>
              <li><button onClick={() => setCurrentRoute('/support')} className="hover:text-white">Support Center</button></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
