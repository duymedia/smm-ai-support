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
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

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
    <div className="w-full space-y-8">
      {/* Header Banner */}
      <div className="w-full py-6 text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="brand" pulse size="sm">
          {language === 'vi' ? 'Gói Cơ Sở Hạ Tầng Máy Chủ SMM' : 'Cloud Infrastructure Plans'}
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          {t('packages.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
          {t('packages.subtitle')}
        </p>

        {/* 7-DAY FREE TRIAL HERO BANNER (KHI BẬT) */}
        {isFreeTrialEnabled && (
          <div className="mt-6 max-w-4xl mx-auto p-5 sm:p-6 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 text-left border border-slate-800">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'vi' ? 'Ưu Đãi Đặc Biệt: Dùng Thử Miễn Phí 7 Ngày' : 'Special Offer: 7-Day Free Trial'}</span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                {language === 'vi' ? 'Trải Nghiệm Hệ Thống SMM Panel Riêng Biệt 0 VNĐ' : 'Experience Full SMM Panel Infrastructure for $0.00'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                {language === 'vi'
                  ? 'Kích hoạt ngay Panel với đầy đủ tính năng, kết nối 50+ API nhà cung cấp, AI Auto-refill và chẩn đoán SSL trong 7 ngày hoàn toàn miễn phí.'
                  : 'Start your 7-day trial with full feature access, 50+ provider API bridges, AI auto-refills, and SSL diagnostics.'}
              </p>
            </div>

            <Button
              onClick={() => setTrialModalOpen(true)}
              variant="brand"
              size="md"
              className="shrink-0"
            >
              <Zap className="w-4 h-4 mr-1.5 fill-current" />
              {language === 'vi' ? 'Dùng Thử 7 Ngày (0đ)' : 'Start 7-Day Free Trial'}
            </Button>
          </div>
        )}

        {/* Billing Cycle Switcher */}
        <div className="pt-3">
          <div className="inline-flex items-center rounded-full bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs text-xs font-semibold">
            <button
              onClick={() => setBillingPeriod('weekly')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                billingPeriod === 'weekly' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('packages.billingWeekly')}
            </button>
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                billingPeriod === 'monthly' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('packages.billingMonthly')}
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                billingPeriod === 'yearly' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{t('packages.billingYearly')}</span>
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${billingPeriod === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'}`}>
                {language === 'vi' ? 'Tiết kiệm 20%' : t('common.savePercent')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
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
              className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 backdrop-blur-sm ${
                pkg.isPopular
                  ? 'bg-slate-900 text-white border-blue-500/50 shadow-[0_20px_50px_-20px_rgba(37,99,235,0.25)] ring-1 ring-blue-500/30'
                  : 'bg-white/95 text-slate-900 border-slate-200/80 hover:border-slate-300 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.10)]'
              }`}
            >
              {pkgBadge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="brand" size="sm" pulse>
                    {pkgBadge}
                  </Badge>
                </div>
              )}

              <div>
                <h3 className={`text-base font-semibold tracking-tight ${pkg.isPopular ? 'text-white' : 'text-slate-900'}`}>{pkgName}</h3>
                <p className={`text-xs mt-1.5 min-h-[36px] leading-relaxed ${pkg.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                  {pkgTagline}
                </p>

                <div className={`mt-5 pb-5 border-b ${pkg.isPopular ? 'border-slate-800' : 'border-slate-200/80'}`}>
                  <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                    <span className="text-3xl font-bold tracking-tight">{formatMoney(price)}</span>
                    <span className={`text-xs ${pkg.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{periodLabel}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong className={pkg.isPopular ? 'text-white' : 'text-slate-900'}>{pkg.features.panelsCount === 'Unlimited' ? (language === 'vi' ? 'Không giới hạn' : 'Unlimited') : pkg.features.panelsCount}</strong> {language === 'vi' ? 'Hệ thống SMM Panel riêng' : 'SMM Panels'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      {language === 'vi' ? 'Xử lý' : 'Up to'}{' '}
                      <strong className={`font-mono tabular-nums ${pkg.isPopular ? 'text-white' : 'text-slate-900'}`}>
                        {pkg.features.maxOrdersPerMonth === 'Unlimited'
                          ? (language === 'vi' ? 'không giới hạn' : 'Unlimited')
                          : (typeof pkg.features.maxOrdersPerMonth === 'number'
                              ? pkg.features.maxOrdersPerMonth.toLocaleString()
                              : pkg.features.maxOrdersPerMonth)}
                      </strong>{' '}
                      {language === 'vi' ? 'đơn/tháng' : 'Orders/mo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong className={`font-mono tabular-nums ${pkg.isPopular ? 'text-white' : 'text-slate-900'}`}>{pkg.features.uptimeSla}</strong> {language === 'vi' ? 'Cam kết SLA' : 'SLA Uptime'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      {language === 'vi' ? 'Hỗ trợ' : 'Support'}: <span className={pkg.isPopular ? 'text-slate-200' : 'text-slate-700'}>{getSupportLevelText(pkg.features.supportLevel)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={() => handleOpenRental(pkg)}
                  variant={pkg.isPopular ? 'brand' : 'secondary'}
                  className="w-full"
                >
                  <span>{t('packages.rentNow')}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
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
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-blue-950 block text-sm">
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
                <span className="text-base font-bold text-blue-950 font-mono tabular-nums">
                  {formatMoney(pkgPrice)}
                </span>
              </div>

              {/* Ghi chú / Notes */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none text-xs transition-colors"
                />
              </div>

              {/* Balance Deduction Calculation Box */}
              <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2 font-medium">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    {language === 'vi' ? 'Số dư ví hiện tại:' : 'Current Wallet Balance:'}
                  </span>
                  <strong className="text-slate-900 font-mono tabular-nums text-xs">{formatMoney(userBalance)}</strong>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">
                    {language === 'vi' ? 'Chi phí gói thuê (trừ ví):' : 'Package Rental Cost:'}
                  </span>
                  <strong className="text-rose-600 font-mono tabular-nums text-xs">-{formatMoney(pkgPrice)}</strong>
                </div>

                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {language === 'vi' ? 'Số dư sau thanh toán:' : 'Balance After Payment:'}
                  </span>
                  <strong className={`font-mono tabular-nums text-xs font-bold ${isBalanceSufficient ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isBalanceSufficient ? formatMoney(remainingBalance) : `-$${missingAmount.toFixed(2)}`}
                  </strong>
                </div>
              </div>

              {/* Insufficient Balance Warning Banner with Direct Top Up Button */}
              {!isBalanceSufficient && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xs font-bold text-amber-950">
                        {language === 'vi' ? 'Số dư ví không đủ' : 'Insufficient Wallet Balance'}
                      </strong>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        {language === 'vi'
                          ? `Bạn còn thiếu ${formatMoney(missingAmount)} để thanh toán gói thuê này.`
                          : `You need ${formatMoney(missingAmount)} more to rent this package.`}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedPkg(null);
                      setCurrentRoute('/add-funds');
                    }}
                    variant="primary"
                    size="sm"
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                    <span>{language === 'vi' ? 'Nạp Tiền Ngay' : 'Add Funds'}</span>
                  </Button>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setSelectedPkg(null)}
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>

                <Button
                  type="submit"
                  variant="brand"
                  size="md"
                  disabled={isSubmitting || !isBalanceSufficient}
                  loading={isSubmitting}
                >
                  <span>
                    {isSubmitting
                      ? (language === 'vi' ? 'Đang khởi tạo...' : 'Deploying Panel...')
                      : (language === 'vi' ? `Xác nhận & Thanh toán ${formatMoney(pkgPrice)}` : `Confirm & Pay ${formatMoney(pkgPrice)}`)}
                  </span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
                </Button>
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
          subtitle={language === 'vi' ? 'Trải nghiệm không giới hạn hạ tầng đám mây cho đại lý' : 'Full access to cloud infrastructure for your agency'}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-900 space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-sm text-blue-950">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{language === 'vi' ? 'Gói dùng thử SMM Panel Pro (7 Ngày)' : 'SMM Panel Pro 7-Day Trial'}</span>
              </div>
              <ul className="text-xs text-blue-800 space-y-2 list-disc list-inside">
                <li>{language === 'vi' ? 'Toàn bộ tính năng quản trị Panel độc lập' : 'Full access to independent Panel admin portal'}</li>
                <li>{language === 'vi' ? 'Kết nối đồng bộ 50+ API nhà cung cấp' : 'Sync with 50+ SMM provider APIs'}</li>
                <li>{language === 'vi' ? 'Chẩn đoán DNS & SSL tự động 24/7' : 'Automatic 24/7 DNS & SSL diagnostics'}</li>
                <li>{language === 'vi' ? 'Chi phí kích hoạt: $0.00 (Không yêu cầu thẻ/ví)' : 'Activation cost: $0.00 (No credit card needed)'}</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setTrialModalOpen(false)}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>

              <Button
                type="button"
                variant="brand"
                size="md"
                disabled={isSubmitting}
                loading={isSubmitting}
                onClick={handleStartFreeTrial}
              >
                <Zap className="w-4 h-4 mr-1.5 fill-current" />
                <span>
                  {isSubmitting
                    ? (language === 'vi' ? 'Đang kích hoạt...' : 'Activating...')
                    : (language === 'vi' ? 'Kích Hoạt Dùng Thử Ngay (0 VNĐ)' : 'Activate Free Trial Now ($0.00)')}
                </span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
