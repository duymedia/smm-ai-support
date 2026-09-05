import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentGatewayItem } from '../../types';
import { Select2, Select2Option } from '../ui/Select2';
import {
  CreditCard,
  Building2,
  Coins,
  DollarSign,
  QrCode,
  Copy,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Zap,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Check,
  Flame,
} from 'lucide-react';

export const AddFundsPage: React.FC = () => {
  const { user, updateProfile, addFunds, formatMoney, currency: userCurrency, addToast, t, language } = useApp();

  const [gateways, setGateways] = useState<PaymentGatewayItem[]>([]);
  const [loadingGateways, setLoadingGateways] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'VND' | 'USD'>('VND');
  const [selectedGatewayId, setSelectedGatewayId] = useState<number | string>('');
  const [amount, setAmount] = useState<number>(100000); // Default 100,000 VND
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Permanent Transfer Code (Họ và Tên Ngân Hàng / Cú pháp nạp vĩnh viễn)
  const [customTransferCode, setCustomTransferCode] = useState<string>('');
  const [savingTransferCode, setSavingTransferCode] = useState(false);

  useEffect(() => {
    if (user?.transferCode) {
      setCustomTransferCode(user.transferCode);
    }
  }, [user?.transferCode]);

  const handleSaveTransferCode = async () => {
    setSavingTransferCode(true);
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      const res = await fetch('/api/user/transfer-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Language': language,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ transferCode: customTransferCode.trim() }),
      });
      const data = await res.json();
      if (data?.success) {
        if (updateProfile) {
          await updateProfile({ transferCode: customTransferCode.trim() || undefined });
        }
        addToast('success', language === 'vi' ? 'Đã lưu cú pháp chuyển khoản vĩnh viễn thành công!' : 'Permanent transfer code saved successfully!');
      } else {
        addToast('error', data?.message || (language === 'vi' ? 'Không thể lưu cú pháp.' : 'Failed to save transfer code.'));
      }
    } catch (e: any) {
      addToast('error', e.message || 'Error');
    } finally {
      setSavingTransferCode(false);
    }
  };

  // Load Gateways from API
  const loadGateways = async () => {
    setLoadingGateways(true);
    try {
      const res = await fetch('/api/billing/gateways', {
        headers: { 'X-App-Language': language },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setGateways(data.data);
      }
    } catch (e) {
      console.warn('Failed to load gateways:', e);
    } finally {
      setLoadingGateways(false);
    }
  };

  useEffect(() => {
    loadGateways();
  }, []);

  // Filter gateways by selected currency
  const availableGateways = gateways.filter((gw) => {
    const gwCur = gw.currency || (gw.type === 'crypto' ? 'USD' : 'VND');
    return gwCur === selectedCurrency;
  });

  // Auto-select first available gateway when currency changes
  useEffect(() => {
    if (availableGateways.length > 0) {
      const currentExists = availableGateways.some((g) => String(g.id) === String(selectedGatewayId));
      if (!currentExists) {
        setSelectedGatewayId(availableGateways[0].id);
      }
    } else {
      setSelectedGatewayId('');
    }
  }, [selectedCurrency, availableGateways]);

  // Adjust default amount when currency switches
  const handleCurrencyChange = (cur: 'VND' | 'USD') => {
    setSelectedCurrency(cur);
    if (cur === 'VND' && amount < 10000) {
      setAmount(100000);
    } else if (cur === 'USD' && amount >= 1000) {
      setAmount(20);
    }
  };

  const selectedGateway = gateways.find((g) => String(g.id) === String(selectedGatewayId)) || availableGateways[0];

  const presetsVnd = [50000, 100000, 200000, 500000, 1000000, 2000000];
  const presetsUsd = [10, 25, 50, 100, 250, 500];
  const presets = selectedCurrency === 'VND' ? presetsVnd : presetsUsd;

  // Conversion calculations
  const exchangeRate = selectedGateway?.exchangeRateUsdToVnd || 25400;
  const bonusPercentage = selectedGateway?.bonusPercentage || 0;

  // If currency is VND: amount in VND. Converted USD = amount / rate
  // If currency is USD: amount in USD. Converted VND = amount * rate
  const amountVnd = selectedCurrency === 'VND' ? amount : Math.round(amount * exchangeRate);
  const amountUsd = selectedCurrency === 'USD' ? amount : Number((amount / exchangeRate).toFixed(2));

  const bonusAmountVnd = bonusPercentage > 0 ? Math.round(amountVnd * (bonusPercentage / 100)) : 0;
  const bonusAmountUsd = bonusPercentage > 0 ? Number((amountUsd * (bonusPercentage / 100)).toFixed(2)) : 0;

  const totalReceivedVnd = amountVnd + bonusAmountVnd;
  const totalReceivedUsd = Number((amountUsd + bonusAmountUsd).toFixed(2));

  // Transfer Memo / Code:
  // If user configured transferCode (e.g. "PHAM QUOC DUY"), auto-append "CHUYEN KHOAN" -> "PHAM QUOC DUY CHUYEN KHOAN"
  const rawTransferCode = (customTransferCode?.trim() || user?.transferCode?.trim() || '');
  const formatMemoCode = (code: string) => {
    if (!code) return `NAP${user?.id || '982'} CHUYEN KHOAN`;
    const upper = code.trim().toUpperCase();
    if (upper.includes('CHUYEN KHOAN') || upper.includes('CHUYENKHOAN') || upper.includes('CK')) {
      return upper;
    }
    return `${upper} CHUYEN KHOAN`;
  };
  const memoCode = formatMemoCode(rawTransferCode);

  // VietQR Dynamic URL Generator
  const getVietQrUrl = () => {
    if (!selectedGateway) return '';
    if (selectedGateway.qrCodeUrl && selectedGateway.type === 'crypto') {
      return selectedGateway.qrCodeUrl;
    }
    const bankCode = selectedGateway.bankCode || 'MBBANK';
    const accNo = selectedGateway.accountNumber || '';
    const accName = encodeURIComponent(selectedGateway.accountHolder || '');
    const addInfo = encodeURIComponent(memoCode);
    return `https://img.vietqr.io/image/${bankCode}-${accNo}-compact2.png?amount=${amountVnd}&addInfo=${addInfo}&accountName=${accName}`;
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('success', language === 'vi' ? `Đã sao chép: ${text}` : `Copied: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert Gateways to Select2 Options
  const select2GatewayOptions: Select2Option[] = availableGateways.map((g) => {
    const isBank = g.type === 'vietqr';
    const isBinance = g.cryptoType === 'BINANCE_PAY' || g.name.toLowerCase().includes('binance');
    return {
      value: String(g.id),
      label: g.name,
      sublabel: isBank
        ? `STK: ${g.accountNumber || '—'} (${g.accountHolder || ''})`
        : isBinance
        ? `Binance ID: ${g.merchantId || g.accountNumber || '—'}`
        : `Mạng ${g.cryptoNetwork || 'TRC20'}`,
      badge: g.bonusPercentage ? `+${g.bonusPercentage}% Bonus` : g.currency || (isBank ? 'VND' : 'USD'),
      image: g.logoUrl || undefined,
    };
  });

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Laser Scanner Keyframes Style */}
      <style>{`
        @keyframes scanBeam {
          0% {
            top: 4%;
            opacity: 0.8;
          }
          50% {
            top: 92%;
            opacity: 1;
          }
          100% {
            top: 4%;
            opacity: 0.8;
          }
        }
        .animate-scan-beam {
          animation: scanBeam 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-tight flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Nạp tiền tự động 24/7</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>VietQR Live Scanner + Binance Pay</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'vi' ? 'Nạp tiền vào tài khoản' : 'Add funds to balance'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              {language === 'vi'
                ? 'Hệ thống quét mã QR tự động cộng tiền sau 5-30 giây. Hỗ trợ toàn bộ ngân hàng Việt Nam và Binance Pay / Crypto không mất phí.'
                : 'Automated top-up with real-time QR scanning. Balance credited within seconds via Vietnamese Banks and Binance Pay.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Steps & Right QR Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: 7 Columns - Input & Gateway Selector */}
        <div className="lg:col-span-7 space-y-5">
          {/* STEP 1: Select Currency */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">1</span>
                <span>{language === 'vi' ? 'Chọn Loại Tiền Tệ Nạp (Currency)' : '1. Select Deposit Currency'}</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                {selectedCurrency === 'VND' ? 'Việt Nam Đồng (₫)' : 'United States Dollar ($)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCurrencyChange('VND')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedCurrency === 'VND'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-emerald-950'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    selectedCurrency === 'VND' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                  }`}>
                    ₫
                  </div>
                  <div>
                    <p className="font-bold text-xs">VND (Việt Nam Đồng)</p>
                    <p className="text-[11px] text-slate-500">VietQR, MB, VCB, ACB, BIDV</p>
                  </div>
                </div>
                {selectedCurrency === 'VND' && <Check className="w-5 h-5 text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => handleCurrencyChange('USD')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedCurrency === 'USD'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-950'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    selectedCurrency === 'USD' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                  }`}>
                    $
                  </div>
                  <div>
                    <p className="font-bold text-xs">USD (Crypto / Binance)</p>
                    <p className="text-[11px] text-slate-500">Binance Pay, USDT TRC20</p>
                  </div>
                </div>
                {selectedCurrency === 'USD' && <Check className="w-5 h-5 text-blue-600" />}
              </button>
            </div>
          </div>

          {/* PERMANENT TRANSFER MEMO SETTING CARD (Họ và Tên Ngân Hàng / Cú Pháp Chuyển Khoản Vĩnh Viễn) */}
          {selectedCurrency === 'VND' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/60 border border-indigo-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                    {language === 'vi' ? 'Cú Pháp Chuyển Khoản Vĩnh Viễn (Họ & Tên Bank)' : 'Permanent Transfer Note / Bank Name'}
                  </h3>
                </div>
                {user?.transferCode ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'vi' ? 'Đã kích hoạt' : 'Active'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold">
                    {language === 'vi' ? 'Chưa thiết lập' : 'Not set'}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {language === 'vi'
                  ? 'Bạn có thể nhập Họ và Tên chủ tài khoản Ngân hàng (hoặc cú pháp riêng) của bạn. Hệ thống SieuThiCode sẽ tự động nhận diện và cộng tiền mỗi khi nhận được chuyển khoản từ bạn.'
                  : 'Set your bank account holder name or custom transfer memo. SieuThiCode auto-credits your balance when detected in transactions.'}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customTransferCode}
                  onChange={(e) => setCustomTransferCode(e.target.value)}
                  placeholder={language === 'vi' ? 'VD: NGUYEN VAN A hoặc NAP12345' : 'e.g. NGUYEN VAN A or NAP12345'}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-mono font-bold text-indigo-950 uppercase focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveTransferCode}
                  disabled={savingTransferCode}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${savingTransferCode ? 'animate-spin' : ''}`} />
                  <span>{savingTransferCode ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu Cú Pháp' : 'Save Memo')}</span>
                </button>
              </div>

              <div className="text-[10px] text-indigo-700/80 flex items-center gap-1.5 bg-indigo-100/50 p-2 rounded-lg border border-indigo-200/50">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>
                  {language === 'vi'
                    ? `Nội dung chuyển khoản hiện tại trên VietQR: "${memoCode}"`
                    : `Current VietQR Memo: "${memoCode}"`}
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Choose Payment Gateway via Select2 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">2</span>
                <span>{language === 'vi' ? 'Chọn Phương Thức / Ngân Hàng Thanh Toán' : '2. Select Payment Method'}</span>
              </label>
              <button
                onClick={loadGateways}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${loadingGateways ? 'animate-spin' : ''}`} />
                <span>{language === 'vi' ? 'Làm mới cổng' : 'Refresh'}</span>
              </button>
            </div>

            {availableGateways.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {language === 'vi'
                    ? 'Chưa có cổng thanh toán nào cho loại tiền tệ này. Vui lòng thử chọn loại tiền tệ khác hoặc liên hệ hỗ trợ.'
                    : 'No payment gateway available for this currency yet. Please select another currency or contact support.'}
                </span>
              </div>
            ) : (
              <Select2
                label={language === 'vi' ? 'Danh Sách Ngân Hàng & Ví Khả Dụng:' : 'Available Gateways List:'}
                placeholder={language === 'vi' ? 'Tìm kiếm và chọn ngân hàng hoặc ví...' : 'Search & select bank or crypto...'}
                options={select2GatewayOptions}
                value={String(selectedGatewayId)}
                onChange={(val) => setSelectedGatewayId(val)}
              />
            )}

            {/* Gateway Highlights Banner */}
            {selectedGateway && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    {selectedGateway.logoUrl ? (
                      <img src={selectedGateway.logoUrl} alt={selectedGateway.name} className="w-full h-full object-contain" />
                    ) : selectedGateway.type === 'vietqr' ? (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Coins className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedGateway.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {selectedGateway.notes || selectedGateway.instructions || (language === 'vi' ? 'Tự động kiểm tra & cộng tiền 24/7' : 'Auto 24/7 processing')}
                    </p>
                  </div>
                </div>

                {bonusPercentage > 0 && (
                  <div className="px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px] flex items-center gap-1 shrink-0">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>+{bonusPercentage}% Khuyến Mãi</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: Enter Deposit Amount */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">3</span>
              <span>{language === 'vi' ? 'Nhập Số Tiền Cần Nạp' : '3. Enter Deposit Amount'}</span>
            </label>

            {/* Quick Amount Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    amount === p
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {selectedCurrency === 'VND' ? `${(p / 1000).toLocaleString('vi-VN')}K` : `$${p}`}
                </button>
              ))}
            </div>

            {/* Amount Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-slate-400">
                {selectedCurrency === 'VND' ? '₫' : '$'}
              </span>
              <input
                type="number"
                min={selectedCurrency === 'VND' ? 10000 : 1}
                step={selectedCurrency === 'VND' ? 10000 : 1}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                placeholder={selectedCurrency === 'VND' ? 'Nhập số tiền VND (VD: 100000)' : 'Enter amount in USD (e.g. 50)'}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Conversion & Bonus Preview */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600">
                <span>{language === 'vi' ? 'Số tiền quy đổi sang USD:' : 'Equivalent in USD:'}</span>
                <span className="font-mono font-bold text-slate-900">${amountUsd.toFixed(2)} USD</span>
              </div>

              {bonusPercentage > 0 && (
                <div className="flex items-center justify-between text-amber-800 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Thưởng nạp thêm (+{bonusPercentage}%):</span>
                  </span>
                  <span className="font-mono font-bold">
                    +{selectedCurrency === 'VND' ? `${bonusAmountVnd.toLocaleString('vi-VN')} ₫` : `$${bonusAmountUsd} USD`}
                  </span>
                </div>
              )}

              <div className="pt-1.5 border-t border-blue-200 flex items-center justify-between text-blue-900 font-bold">
                <span>{language === 'vi' ? 'Tổng số dư sẽ nhận:' : 'Total Balance Credited:'}</span>
                <span className="font-mono text-sm text-blue-700">
                  {formatMoney(totalReceivedUsd)} ({totalReceivedVnd.toLocaleString('vi-VN')} ₫)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: 5 Columns - Live Laser Scan QR Screen & Payment Info */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  {language === 'vi' ? 'Quét Mã QR Thanh Toán' : 'QR Payment Screen'}
                </span>
              </div>
              <span className="text-xs font-mono font-extrabold text-emerald-600">
                {selectedCurrency === 'VND' ? `${amountVnd.toLocaleString('vi-VN')} ₫` : `$${amountUsd} USD`}
              </span>
            </div>

            {/* LASER SCANNER QR CONTAINER */}
            <div className="flex flex-col items-center">
              <div className="relative p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl overflow-hidden group max-w-[280px] w-full">
                {/* Scanner Viewfinder Reticle Corners */}
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-blue-400 rounded-tl-md z-20 pointer-events-none" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-blue-400 rounded-tr-md z-20 pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-blue-400 rounded-bl-md z-20 pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-blue-400 rounded-br-md z-20 pointer-events-none" />

                {/* Animated Laser Scanning Beam */}
                <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8,0_0_20px_#0284c7] animate-scan-beam z-20 pointer-events-none" />

                {/* QR Image Box */}
                <div className="relative bg-white p-2.5 rounded-xl border border-slate-300 shadow-inner flex items-center justify-center min-h-[220px]">
                  {selectedGateway ? (
                    <img
                      src={getVietQrUrl()}
                      alt="VietQR Payment Code"
                      className="w-full h-auto object-contain rounded-lg transition-transform duration-200"
                    />
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <QrCode className="w-16 h-16 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">Chưa chọn cổng thanh toán</p>
                    </div>
                  )}
                </div>

                {/* Scanning Live Indicator */}
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>{language === 'vi' ? 'Hệ thống tự động quét giao dịch 24/7' : 'Auto Scanning 24/7'}</span>
                </div>
              </div>
            </div>

            {/* Payment Details Card with 1-Click Copy */}
            {selectedGateway && (
              <div className="space-y-2 text-xs pt-2">
                {/* Bank / Gateway Name */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Ngân hàng / Cổng:' : 'Bank / Method:'}</span>
                  <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">
                    {selectedGateway.name}
                  </span>
                </div>

                {/* Account Number / Binance ID */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-semibold">
                    {selectedGateway.cryptoType === 'BINANCE_PAY' ? 'Binance ID:' : selectedGateway.type === 'crypto' ? 'Địa chỉ ví:' : 'Số tài khoản:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-blue-700 text-xs">
                      {selectedGateway.merchantId || selectedGateway.accountNumber || selectedGateway.walletAddress || '—'}
                    </span>
                    <button
                      onClick={() => handleCopy('acc', selectedGateway.merchantId || selectedGateway.accountNumber || selectedGateway.walletAddress || '')}
                      className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Sao chép"
                    >
                      {copiedKey === 'acc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Account Holder Name */}
                {selectedGateway.accountHolder && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Chủ tài khoản:' : 'Account Holder:'}</span>
                    <span className="font-bold text-slate-900 uppercase">{selectedGateway.accountHolder}</span>
                  </div>
                )}

                {/* Exact Amount */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-emerald-900 font-semibold">{language === 'vi' ? 'Số tiền chuyển:' : 'Exact Amount:'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      {selectedCurrency === 'VND' ? `${amountVnd.toLocaleString('vi-VN')} ₫` : `$${amountUsd} USD`}
                    </span>
                    <button
                      onClick={() => handleCopy('amount', selectedCurrency === 'VND' ? String(amountVnd) : String(amountUsd))}
                      className="p-1 rounded-md bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                      title="Sao chép số tiền"
                    >
                      {copiedKey === 'amount' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Transfer Content / Memo Code */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div>
                    <span className="text-amber-900 font-bold block">{language === 'vi' ? 'Nội dung CK:' : 'Transfer Memo:'}</span>
                    <span className="text-[10px] text-amber-700 font-semibold">{language === 'vi' ? '(Bắt buộc ghi đúng)' : '(Required)'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-amber-900 text-xs px-2 py-0.5 rounded bg-white border border-amber-300">
                      {memoCode}
                    </span>
                    <button
                      onClick={() => handleCopy('memo', memoCode)}
                      className="p-1 rounded-md bg-white border border-amber-300 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                      title="Sao chép nội dung"
                    >
                      {copiedKey === 'memo' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Gateway Custom Deposit Instructions & Notes (Rich HTML) */}
            {selectedGateway?.notes && (
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>{language === 'vi' ? 'Hướng Dẫn & Lưu Ý Nạp Tiền:' : 'Deposit Notes & Guide:'}</span>
                </div>
                <div
                  className="prose prose-xs max-w-none text-[11px] text-slate-600 space-y-1"
                  dangerouslySetInnerHTML={{ __html: selectedGateway.notes }}
                />
              </div>
            )}

            {/* Note & Security Guarantee */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'vi' ? 'Cam kết tự động & an toàn 100%' : '100% Automated & Secure'}</span>
              </div>
              <p>
                {language === 'vi'
                  ? 'Vui lòng điền chính xác nội dung chuyển khoản để hệ thống tự động cộng tiền ngay lập tức.'
                  : 'Please input the exact transfer memo so the automated webhook can credit your balance immediately.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

