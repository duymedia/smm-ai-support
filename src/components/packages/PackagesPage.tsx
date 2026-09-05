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
  Wallet,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
} from 'lucide-react';
import { RentalPackage } from '../../types';
import { Modal } from '../ui/Modal';

export const PackagesPage: React.FC = () => {
  const {
    packages,
    formatMoney,
    currency,
    language,
    user,
    rentPanel,
    setCurrentRoute,
    addToast,
    siteConfig,
    t,
  } = useApp();

  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedPkg, setSelectedPkg] = useState<RentalPackage | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  const isFreeTrialEnabled = siteConfig?.allowFreeTrialPanel !== false;

  // Helper: Dịch tên gói linh hoạt theo ngôn ngữ
  const getPackageName = (pkg: RentalPackage) => {
    if (language !== 'vi') return pkg.name;
    const nameLower = (pkg.name || '').toLowerCase();
    if (nameLower.includes('starter') || pkg.id === 'starter') return 'Khởi Nghiệp (Starter)';
    if (nameLower.includes('professional') || pkg.id === 'professional') return 'Chuyên Nghiệp (Pro)';
    if (nameLower.includes('agency') || pkg.id === 'agency') return 'Đại Lý (Agency)';
    if (nameLower.includes('enterprise') || pkg.id === 'enterprise') return 'Doanh Nghiệp (Enterprise)';
    return pkg.name;
  };

  // Helper: Dịch tagline linh hoạt theo ngôn ngữ
  const getPackageTagline = (pkg: RentalPackage) => {
    if (language !== 'vi') return pkg.tagline;
    const tagLower = (pkg.tagline || '').toLowerCase();
    if (tagLower.includes('freelancers and beginners') || pkg.id === 'starter') {
      return 'Hoàn hảo cho cá nhân và người mới bắt đầu kinh doanh dịch vụ SMM.';
    }
    if (tagLower.includes('growing agencies') || pkg.id === 'professional') {
      return 'Lý tưởng cho agency đang phát triển, quản lý nhiều khách hàng & nhà cung cấp.';
    }
    if (tagLower.includes('scaling agencies') || pkg.id === 'agency') {
      return 'Tối ưu cho hệ thống quy mô lớn, lượng đơn cao và thương hiệu riêng.';
    }
    if (tagLower.includes('unlimited power') || pkg.id === 'enterprise') {
      return 'Sức mạnh không giới hạn với hạ tầng máy chủ riêng và hỗ trợ kỹ thuật VIP 24/7.';
    }
    return pkg.tagline;
  };

  // Helper: Dịch badge
  const getPackageBadge = (badge?: string) => {
    if (!badge) return '';
    if (language !== 'vi') return badge;
    const bLower = badge.toLowerCase();
    if (bLower.includes('most popular') || bLower.includes('popular')) return 'Phổ Biến Nhất';
    if (bLower.includes('best value')) return 'Tối Ưu Nhất';
    if (bLower.includes('pro')) return 'Chuyên Nghiệp';
    return badge;
  };

  // Helper: Dịch cấp độ hỗ trợ
  const getSupportLevelText = (level?: string) => {
    if (!level) return language === 'vi' ? 'Tiêu chuẩn' : 'Standard';
    if (language !== 'vi') return level;
    const lLower = level.toLowerCase();
    if (lLower.includes('standard')) return 'Tiêu chuẩn 24/7';
    if (lLower.includes('priority 24/7') || lLower.includes('priority')) return 'Ưu tiên 24/7';
    if (lLower.includes('dedicated vip') || lLower.includes('vip')) return 'Chuyên viên VIP riêng';
    if (lLower.includes('community')) return 'Cộng đồng';
    if (lLower.includes('ticket')) return 'Ticket ưu tiên';
    return level;
  };

  const handleOpenRental = (pkg: RentalPackage) => {
    setSelectedPkg(pkg);
    setNotes('');
  };

  const handleStartFreeTrial = async () => {
    setIsSubmitting(true);
    try {
      const success = await rentPanel('free-trial', 'weekly', 'Trải Nghiệm Hệ Thống SMM Panel Riêng Biệt 0 VNĐ');
      if (success) {
        setTrialModalOpen(false);
        setCurrentRoute('/subscriptions');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;

    setIsSubmitting(true);
    try {
      const success = await rentPanel(
        selectedPkg.id,
        billingPeriod,
        notes
      );
      if (success) {
        setSelectedPkg(null);
        setCurrentRoute('/subscriptions');
      }
    } catch (e) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPrice = (pkg: RentalPackage) => pkg.pricing[billingPeriod];

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="w-full py-4 text-center">
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          {language === 'vi' ? 'Gói Cơ Sở Hạ Tầng Máy Chủ SMM' : 'Cloud Infrastructure Plans'}
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
          {t('packages.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl mx-auto">
          {t('packages.subtitle')}
        </p>

        {/* 7-DAY FREE TRIAL HERO BANNER (KHI BẬT) */}
        {isFreeTrialEnabled && (
          <div className="mt-6 max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>{language === 'vi' ? 'Ưu Đãi Đặc Biệt: Dùng Thử Miễn Phí 7 Ngày' : 'Special Offer: 7-Day Free Trial'}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {language === 'vi' ? 'Trải Nghiệm Hệ Thống SMM Panel Riêng Biệt 0 VNĐ' : 'Experience Full SMM Panel Infrastructure for $0.00'}
              </h2>
              <p className="text-xs text-blue-100 leading-relaxed max-w-xl">
                {language === 'vi'
                  ? 'Kích hoạt ngay Panel với đầy đủ tính năng, kết nối 50+ API nhà cung cấp, AI Auto-refill và chẩn đoán SSL trong 7 ngày hoàn toàn miễn phí.'
                  : 'Start your 7-day trial with full feature access, 50+ provider API bridges, AI auto-refills, and SSL diagnostics.'}
              </p>
            </div>

            <button
              onClick={() => setTrialModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-xs shadow-md transition-all shrink-0 cursor-pointer"
            >
              {language === 'vi' ? 'Dùng Thử 7 Ngày (0đ)' : 'Start 7-Day Free Trial'}
            </button>
          </div>
        )}

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
              {language === 'vi' ? 'Tiết kiệm 20%' : t('common.savePercent')}
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid - Full Width Responsive */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {packages.map((pkg) => {
          const price = currentPrice(pkg);
          const periodLabel =
            billingPeriod === 'weekly'
              ? t('common.perWeek')
              : billingPeriod === 'monthly'
              ? t('common.perMonth')
              : t('common.perYear');

          const pkgBadge = getPackageBadge(pkg.badge);
          const pkgName = getPackageName(pkg);
          const pkgTagline = getPackageTagline(pkg);

          return (
            <div
              key={pkg.id}
              className={`relative p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                pkg.isPopular
                  ? 'bg-slate-900 text-white border-blue-600 shadow-xl ring-2 ring-blue-600/30'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {pkgBadge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                  {pkgBadge}
                </div>
              )}

              <div>
                <h3 className={`text-base font-bold ${pkg.isPopular ? 'text-white' : 'text-slate-900'}`}>{pkgName}</h3>
                <p className={`text-xs mt-1 min-h-[36px] ${pkg.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                  {pkgTagline}
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
                    <span>
                      <strong>{pkg.features.panelsCount === 'Unlimited' ? (language === 'vi' ? 'Không giới hạn' : 'Unlimited') : pkg.features.panelsCount}</strong> {language === 'vi' ? 'Hệ thống SMM Panel riêng biệt' : 'SMM Panel Instances'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      {language === 'vi' ? 'Xử lý đến' : 'Up to'}{' '}
                      <strong>
                        {pkg.features.maxOrdersPerMonth === 'Unlimited'
                          ? (language === 'vi' ? 'không giới hạn' : 'Unlimited')
                          : (typeof pkg.features.maxOrdersPerMonth === 'number'
                              ? pkg.features.maxOrdersPerMonth.toLocaleString()
                              : pkg.features.maxOrdersPerMonth)}
                      </strong>{' '}
                      {language === 'vi' ? 'đơn hàng/tháng' : 'Orders/mo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{pkg.features.uptimeSla} {language === 'vi' ? 'Cam kết Uptime SLA' : 'Uptime SLA'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      {language === 'vi' ? 'Hỗ trợ' : 'Support'}: {getSupportLevelText(pkg.features.supportLevel)}
                    </span>
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
      {selectedPkg && (() => {
        const pkgPrice = currentPrice(selectedPkg);
        const userBalance = Number(user?.balance || 0);
        const isBalanceSufficient = userBalance >= pkgPrice;
        const missingAmount = Math.max(0, Math.round((pkgPrice - userBalance) * 100) / 100);
        const remainingBalance = Math.max(0, Math.round((userBalance - pkgPrice) * 100) / 100);
        const selectedPkgName = getPackageName(selectedPkg);

        return (
          <Modal
            isOpen={true}
            onClose={() => setSelectedPkg(null)}
            title={language === 'vi' ? `Thuê Gói SMM Panel — ${selectedPkgName}` : `Rent SMM Panel — ${selectedPkg.name}`}
            subtitle={language === 'vi' ? 'Khởi tạo và bàn giao hạ tầng máy chủ đám mây tốc độ cao chỉ trong vài giây' : 'Provision your high-speed cloud storefront in seconds'}
            maxWidth="lg"
          >
            <form onSubmit={handleConfirmRental} className="space-y-4 text-xs">
              {/* Plan summary badge */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-900 block">
                    {language === 'vi'
                      ? `Gói ${selectedPkgName} (${billingPeriod === 'weekly' ? 'Theo Tuần' : billingPeriod === 'monthly' ? 'Theo Tháng' : 'Theo Năm'})`
                      : `${selectedPkg.name} Plan (${billingPeriod})`}
                  </span>
                  <span className="text-[11px] text-blue-700">
                    {language === 'vi'
                      ? `Bao gồm ${selectedPkg.features.panelsCount === 'Unlimited' ? 'không giới hạn' : selectedPkg.features.panelsCount} Panel riêng biệt & Tự động hoá vận hành`
                      : `Includes ${selectedPkg.features.panelsCount} panel instance & Auto-Pilot Ops`}
                  </span>
                </div>
                <span className="text-base font-extrabold text-blue-900">
                  {formatMoney(pkgPrice)}
                </span>
              </div>

              {/* Ghi chú / Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'vi' ? 'Ghi chú / Yêu cầu thêm (Tùy chọn)' : 'Notes / Additional Requests (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    language === 'vi'
                      ? 'Nhập ghi chú hoặc yêu cầu cấu hình cho gói thuê panel...'
                      : 'Enter any notes or special configuration requests...'
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none text-xs"
                />
              </div>

              {/* Balance Deduction Calculation Box */}
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    {language === 'vi' ? 'Số dư ví hiện tại:' : 'Current Wallet Balance:'}
                  </span>
                  <strong className="text-slate-900 font-mono text-xs">{formatMoney(userBalance)}</strong>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">
                    {language === 'vi' ? 'Chi phí gói thuê (trừ ví):' : 'Package Rental Cost:'}
                  </span>
                  <strong className="text-rose-600 font-mono text-xs">-{formatMoney(pkgPrice)}</strong>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700">
                    {language === 'vi' ? 'Số dư sau thanh toán:' : 'Balance After Payment:'}
                  </span>
                  <strong className={`font-mono text-xs font-black ${isBalanceSufficient ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isBalanceSufficient ? formatMoney(remainingBalance) : `-$${missingAmount.toFixed(2)}`}
                  </strong>
                </div>
              </div>

              {/* Insufficient Balance Warning Banner with Direct Top Up Button */}
              {!isBalanceSufficient && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xs font-bold text-amber-900">
                        {language === 'vi' ? 'Số dư ví không đủ' : 'Insufficient Wallet Balance'}
                      </strong>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        {language === 'vi'
                          ? `Bạn còn thiếu ${formatMoney(missingAmount)} để thanh toán gói thuê này.`
                          : `You need ${formatMoney(missingAmount)} more to rent this package.`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPkg(null);
                      setCurrentRoute('/add-funds');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Nạp Tiền Ngay' : 'Add Funds'}</span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPkg(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !isBalanceSufficient}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {isSubmitting
                      ? (language === 'vi' ? 'Đang khởi tạo...' : 'Deploying Panel...')
                      : (language === 'vi' ? `Xác nhận & Thanh toán ${formatMoney(pkgPrice)}` : `Confirm & Pay ${formatMoney(pkgPrice)}`)}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* Free Trial Confirmation Modal */}
      {trialModalOpen && (
        <Modal
          isOpen={trialModalOpen}
          onClose={() => setTrialModalOpen(false)}
          title={language === 'vi' ? '🎁 Kích Hoạt Dùng Thử 7 Ngày Miễn Phí' : '🎁 Activate 7-Day Free Trial'}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{language === 'vi' ? 'Gói dùng thử SMM Panel Pro (7 Ngày)' : 'SMM Panel Pro 7-Day Trial'}</span>
              </div>
              <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
                <li>{language === 'vi' ? 'Toàn bộ tính năng quản trị Panel độc lập' : 'Full access to independent Panel admin portal'}</li>
                <li>{language === 'vi' ? 'Kết nối đồng bộ 50+ API nhà cung cấp' : 'Sync with 50+ SMM provider APIs'}</li>
                <li>{language === 'vi' ? 'Chẩn đoán DNS & SSL tự động 24/7' : 'Automatic 24/7 DNS & SSL diagnostics'}</li>
                <li>{language === 'vi' ? 'Chi phí kích hoạt: $0.00 (Không yêu cầu thẻ/ví)' : 'Activation cost: $0.00 (No credit card needed)'}</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTrialModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStartFreeTrial}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>
                  {isSubmitting
                    ? (language === 'vi' ? 'Đang kích hoạt...' : 'Activating...')
                    : (language === 'vi' ? 'Kích Hoạt Dùng Thử Ngay (0 VNĐ)' : 'Activate Free Trial Now ($0.00)')}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
