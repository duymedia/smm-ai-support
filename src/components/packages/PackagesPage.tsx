import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Server,
  Globe,
  CreditCard,
  Building2,
  Coins,
} from 'lucide-react';
import { RentalPackage } from '../../types';
import { Modal } from '../ui/Modal';

export const PackagesPage: React.FC = () => {
  const {
    packages,
    formatMoney,
    currency,
    user,
    rentPanel,
    setCurrentRoute,
    addToast,
    t,
  } = useApp();

  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedPkg, setSelectedPkg] = useState<RentalPackage | null>(null);
  const [panelName, setPanelName] = useState('');
  const [domainChoice, setDomainChoice] = useState<'subdomain' | 'custom'>('subdomain');
  const [subdomainInput, setSubdomainInput] = useState('');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'stripe' | 'paypal' | 'vietqr' | 'crypto'>('wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenRental = (pkg: RentalPackage) => {
    setSelectedPkg(pkg);
    setPanelName(`${user?.name ? user.name.split(' ')[0] : 'My'} SMM Hub`);
    setSubdomainInput(`${user?.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'agency'}smm`);
  };

  const handleConfirmRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;

    if (!panelName) {
      addToast('error', 'Please enter a name for your SMM panel');
      return;
    }

    const domain =
      domainChoice === 'subdomain'
        ? `${subdomainInput || 'myagency'}.nexussmm.store`
        : customDomainInput || `${subdomainInput || 'myagency'}.nexussmm.store`;

    const customDomain = domainChoice === 'custom' ? customDomainInput : undefined;

    setIsSubmitting(true);
    try {
      await rentPanel(
        panelName,
        domain,
        selectedPkg.id,
        billingPeriod
      );
      setSelectedPkg(null);
    } catch (e) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPrice = (pkg: RentalPackage) => pkg.pricing[billingPeriod];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto py-4">
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          Cloud Infrastructure Plans
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
          {t('packages.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          {t('packages.subtitle')}
        </p>

        {/* Billing Cycle Switcher */}
        <div className="mt-6 inline-flex items-center rounded-xl bg-white p-1 border border-slate-200 shadow-xs text-xs font-semibold">
          <button
            onClick={() => setBillingPeriod('weekly')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              billingPeriod === 'weekly' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('packages.billingWeekly')}
          </button>
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              billingPeriod === 'monthly' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('packages.billingMonthly')}
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              billingPeriod === 'yearly' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
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
          const price = currentPrice(pkg);
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
                    <span>Custom Domain & Auto SSL</span>
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
                onClick={() => handleOpenRental(pkg)}
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

      {/* RENTAL CHECKOUT MODAL */}
      {selectedPkg && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPkg(null)}
          title={`Rent SMM Panel — ${selectedPkg.name}`}
          subtitle="Provision your high-speed cloud storefront in seconds"
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmRental} className="space-y-4 text-xs">
            {/* Plan summary badge */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 block">{selectedPkg.name} Plan ({billingPeriod})</span>
                <span className="text-[11px] text-blue-700">Includes {selectedPkg.features.panelsCount} panel instance & Auto-Pilot Ops</span>
              </div>
              <span className="text-base font-extrabold text-blue-900">
                {formatMoney(currentPrice(selectedPkg))}
              </span>
            </div>

            {/* Panel Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SMM Panel Store Name</label>
              <input
                type="text"
                value={panelName}
                onChange={(e) => setPanelName(e.target.value)}
                placeholder="e.g. Apex Viral Agency"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>

            {/* Domain Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Domain Setup</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDomainChoice('subdomain')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    domainChoice === 'subdomain'
                      ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="block text-xs">Free Subdomain</span>
                  <span className="text-[10px] text-slate-400">Instant setup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDomainChoice('custom')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    domainChoice === 'custom'
                      ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="block text-xs">Custom Domain</span>
                  <span className="text-[10px] text-slate-400">e.g. yourbrand.com</span>
                </button>
              </div>

              {domainChoice === 'subdomain' ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={subdomainInput}
                    onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="mybrand"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl focus:bg-white focus:outline-hidden"
                  />
                  <span className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-r-xl font-mono text-[11px]">
                    .nexussmm.store
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase())}
                  placeholder="e.g. smm.apexagency.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="block text-xs">Account Balance</span>
                  <span className="text-[10px] text-slate-500">Avail: {formatMoney(user?.balance || 0)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    paymentMethod === 'stripe'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="block text-xs">Credit Card</span>
                  <span className="text-[10px] text-slate-500">Stripe Secure</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    paymentMethod === 'vietqr'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="block text-xs">VietQR Transfer</span>
                  <span className="text-[10px] text-slate-500">Auto Banking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    paymentMethod === 'crypto'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="block text-xs">Crypto (USDT)</span>
                  <span className="text-[10px] text-slate-500">TRC20 / ERC20</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    paymentMethod === 'paypal'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="block text-xs">PayPal</span>
                  <span className="text-[10px] text-slate-500">Global</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedPkg(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Deploying Panel...' : `Confirm & Pay ${formatMoney(currentPrice(selectedPkg))}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
