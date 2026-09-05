import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { PaymentGatewayItem, GatewayType, BankCode, CryptoType, CryptoNetwork } from '../../../types';
import {
  Building,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Globe,
  Radio,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
  Copy,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  Coins,
  CreditCard,
  Layers,
  ArrowUpRight,
  KeyRound,
  FileText,
  Percent,
} from 'lucide-react';
import { Select2, Select2Option } from '../../ui/Select2';
import { RichTextEditor } from '../../ui/RichTextEditor';

const SUPPORTED_BANKS: { code: BankCode; bin: string; name: string; shortName: string; color: string; logoUrl: string }[] = [
  { code: 'MBBANK', bin: '970422', name: 'MBBank (Ngân Hàng Quân Đội)', shortName: 'MB', color: 'from-blue-700 to-indigo-800', logoUrl: 'https://i.imgur.com/zVEduxd.png' },
  { code: 'VIETINBANK', bin: '970415', name: 'VietinBank (Công Thương Việt Nam)', shortName: 'CTG', color: 'from-blue-600 to-cyan-700', logoUrl: 'https://i.imgur.com/hjshLYq.png' },
  { code: 'VIETCOMBANK', bin: '970436', name: 'Vietcombank (Ngoại Thương Việt Nam)', shortName: 'VCB', color: 'from-emerald-600 to-teal-800', logoUrl: 'https://i.imgur.com/Fz183j7.png' },
  { code: 'ACB', bin: '970416', name: 'ACB (Ngân Hàng Á Châu)', shortName: 'ACB', color: 'from-blue-500 to-sky-700', logoUrl: 'https://i.imgur.com/P7EFing.png' },
  { code: 'BIDV', bin: '970418', name: 'BIDV (Đầu Tư & Phát Triển Việt Nam)', shortName: 'BIDV', color: 'from-teal-600 to-cyan-800', logoUrl: 'https://i.imgur.com/znVQVCm.png' },
  { code: 'OCB', bin: '970448', name: 'OCB (Ngân Hàng Phương Đông)', shortName: 'OCB', color: 'from-green-600 to-emerald-800', logoUrl: 'https://i.imgur.com/aKoj61c.png' },
  { code: 'AGRIBANK', bin: '970405', name: 'Agribank (Nông Nghiệp & PTNT)', shortName: 'VBA', color: 'from-red-600 to-amber-700', logoUrl: 'https://i.imgur.com/2UcfB5o.png' },
  { code: 'TPBANK', bin: '970423', name: 'TPBank / ToBank (Tiên Phong)', shortName: 'TPB', color: 'from-purple-600 to-pink-700', logoUrl: 'https://i.imgur.com/yF9W9yT.png' },
];

const SUPPORTED_CRYPTOS: { type: CryptoType; network: CryptoNetwork; name: string; badge: string; color: string; logoUrl: string }[] = [
  { type: 'BINANCE_PAY', network: 'BINANCE_DIRECT', name: 'Binance Pay (Binance ID / QR)', badge: 'Binance', color: 'from-amber-500 to-yellow-600', logoUrl: 'https://i.imgur.com/iBEGgng.png' },
  { type: 'USDT', network: 'TRC20', name: 'USDT TRC20 (Tron Network)', badge: 'TRC20', color: 'from-emerald-500 to-teal-700', logoUrl: 'https://i.imgur.com/FYVOL1x.png' },
  { type: 'USDT', network: 'BEP20', name: 'USDT BEP20 (BNB Smart Chain)', badge: 'BEP20', color: 'from-amber-600 to-yellow-700', logoUrl: 'https://i.imgur.com/iBEGgng.png' },
  { type: 'USDT', network: 'ERC20', name: 'USDT ERC20 (Ethereum Network)', badge: 'ERC20', color: 'from-blue-600 to-indigo-800', logoUrl: 'https://i.imgur.com/jXO8HNr.png' },
  { type: 'USDT', network: 'POLYGON', name: 'USDT Polygon (MATIC Network)', badge: 'Polygon', color: 'from-purple-600 to-violet-800', logoUrl: 'https://i.imgur.com/Lzpgfsz.jpeg' },
];

export const AdminGatewaysView: React.FC = () => {
  const { language, addToast, formatMoney } = useApp();

  const [gateways, setGateways] = useState<PaymentGatewayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'vietqr' | 'crypto'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'VND' | 'USD'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayItem | null>(null);
  const [deletingGateway, setDeletingGateway] = useState<PaymentGatewayItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<PaymentGatewayItem>>({
    type: 'vietqr',
    currency: 'VND',
    name: '',
    logoUrl: '',
    bankCode: 'MBBANK',
    bankName: 'MBBank (Ngân Hàng Quân Đội)',
    accountNumber: '',
    accountHolder: '',
    cryptoType: 'USDT',
    cryptoNetwork: 'TRC20',
    walletAddress: '',
    memoTag: '',
    apiKey: '',
    secretKey: '',
    merchantId: '',
    qrCodeUrl: '',
    notes: '',
    exchangeRateUsdToVnd: 25400,
    bonusPercentage: 0,
    webhookSecret: '',
    webhookUrl: '',
    instructions: '',
    active: true,
  });

  const loadGateways = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gateways?_t=${Date.now()}`, {
        headers: {
          'X-App-Language': language,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setGateways(data.data);
      }
    } catch (e) {
      console.warn('Load gateways error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGateways();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingGateway(null);
    setFormData({
      type: 'vietqr',
      currency: 'VND',
      name: 'MBBank (Ngân Hàng Quân Đội)',
      logoUrl: 'https://i.imgur.com/zVEduxd.png',
      bankCode: 'MBBANK',
      bankName: 'MBBank (Ngân Hàng Quân Đội)',
      accountNumber: '',
      accountHolder: '',
      cryptoType: 'USDT',
      cryptoNetwork: 'TRC20',
      walletAddress: '',
      memoTag: '',
      apiKey: '',
      secretKey: '',
      merchantId: '',
      qrCodeUrl: '',
      notes: '',
      exchangeRateUsdToVnd: 25400,
      bonusPercentage: 0,
      webhookSecret: '',
      webhookUrl: '',
      instructions: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (gw: PaymentGatewayItem) => {
    setEditingGateway(gw);
    setFormData({
      ...gw,
      type: gw.type || 'vietqr',
      currency: gw.currency || (gw.type === 'crypto' ? 'USD' : 'VND'),
      logoUrl: gw.logoUrl || '',
      apiKey: gw.apiKey || '',
      secretKey: gw.secretKey || '',
      merchantId: gw.merchantId || '',
      accountNumber: gw.accountNumber || '',
      accountHolder: gw.accountHolder || '',
      walletAddress: gw.walletAddress || '',
      memoTag: gw.memoTag || '',
      qrCodeUrl: gw.qrCodeUrl || '',
      notes: gw.notes || gw.instructions || '',
      webhookSecret: gw.webhookSecret || '',
      webhookUrl: gw.webhookUrl || `/webhook/sieuthicode?type=${gw.id}`,
    });
    setIsModalOpen(true);
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type === 'vietqr') {
      if (!formData.accountNumber?.trim()) {
        addToast('error', language === 'vi' ? 'Vui lòng nhập số tài khoản ngân hàng.' : 'Please enter bank account number.');
        return;
      }
      if (!formData.accountHolder?.trim()) {
        addToast('error', language === 'vi' ? 'Vui lòng nhập tên chủ tài khoản.' : 'Please enter account holder name.');
        return;
      }
    } else if (formData.cryptoType === 'BINANCE_PAY') {
      if (!formData.merchantId?.trim() && !formData.accountNumber?.trim()) {
        addToast('error', language === 'vi' ? 'Vui lòng nhập Binance ID / Merchant ID.' : 'Please enter Binance ID or Merchant ID.');
        return;
      }
    } else {
      if (!formData.walletAddress?.trim() && !formData.accountNumber?.trim()) {
        addToast('error', language === 'vi' ? 'Vui lòng nhập địa chỉ ví Crypto.' : 'Please enter Crypto wallet address.');
        return;
      }
    }

    try {
      const isEdit = Boolean(editingGateway?.id);
      const url = isEdit ? `/api/admin/gateways/${editingGateway!.id}` : '/api/admin/gateways';
      const method = isEdit ? 'PUT' : 'POST';

      const isBank = formData.type === 'vietqr';
      const isBinance = formData.cryptoType === 'BINANCE_PAY';

      const payload = {
        id: editingGateway?.id,
        type: formData.type || 'vietqr',
        currency: isBank ? 'VND' : 'USD',
        name: isBank
          ? (formData.bankName || formData.bankCode || 'MBBank')
          : (isBinance ? 'Binance Pay (Binance ID / QR)' : (formData.name || 'USDT')),
        logoUrl: formData.logoUrl?.trim() || (isBank ? SUPPORTED_BANKS.find((b) => b.code === formData.bankCode)?.logoUrl : (isBinance ? 'https://i.imgur.com/iBEGgng.png' : 'https://i.imgur.com/FYVOL1x.png')),
        bankCode: isBank ? (formData.bankCode || 'MBBANK') : null,
        bankName: isBank ? (formData.bankName || 'MBBank (Ngân Hàng Quân Đội)') : null,
        accountNumber: isBank ? (formData.accountNumber?.trim() || null) : null,
        accountHolder: isBank ? (formData.accountHolder?.trim().toUpperCase() || null) : null,
        cryptoType: !isBank ? (formData.cryptoType || 'USDT') : null,
        cryptoNetwork: !isBank ? (formData.cryptoNetwork || (isBinance ? 'BINANCE_DIRECT' : 'TRC20')) : null,
        merchantId: isBinance ? (formData.merchantId?.trim() || formData.accountNumber?.trim() || null) : null,
        walletAddress: !isBank && !isBinance ? (formData.walletAddress?.trim() || formData.accountNumber?.trim() || null) : null,
        memoTag: !isBank ? (formData.memoTag?.trim() || null) : null,
        apiKey: isBinance ? (formData.apiKey?.trim() || null) : null,
        secretKey: isBinance ? (formData.secretKey?.trim() || null) : null,
        qrCodeUrl: formData.qrCodeUrl?.trim() || null,
        notes: (formData.notes || formData.instructions)?.trim() || null,
        instructions: (formData.notes || formData.instructions)?.trim() || null,
        exchangeRateUsdToVnd: Number(formData.exchangeRateUsdToVnd) || 25400,
        bonusPercentage: Number(formData.bonusPercentage) || 0,
        webhookSecret: isBank ? (formData.webhookSecret?.trim() || null) : null,
        webhookUrl: isBank ? (formData.webhookUrl?.trim() || `/webhook/sieuthicode?type=${editingGateway?.id || 'new'}`) : null,
        active: Boolean(formData.active),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (resData.success) {
        addToast('success', resData.message || (language === 'vi' ? 'Cấu hình cổng thanh toán đã được lưu thành công!' : 'Payment gateway configuration saved!'));
        setIsModalOpen(false);
        if (resData.data) {
          setGateways((prev) => {
            if (isEdit) {
              return prev.map((item) => (item.id === editingGateway!.id ? resData.data : item));
            }
            return [...prev, resData.data];
          });
        }
        await loadGateways();
      } else {
        addToast('error', resData.message || (language === 'vi' ? 'Không thể lưu cổng thanh toán.' : 'Failed to save gateway.'));
      }
    } catch (e: any) {
      addToast('error', (language === 'vi' ? 'Lỗi khi lưu cấu hình: ' : 'Error saving configuration: ') + e.message);
    }
  };

  const handleToggleStatus = async (gw: PaymentGatewayItem) => {
    try {
      const res = await fetch(`/api/admin/gateways/${gw.id}/toggle`, {
        method: 'PATCH',
        headers: { 'X-App-Language': language },
      });
      const data = await res.json();
      if (data.success) {
        setGateways((prev) =>
          prev.map((item) => (item.id === gw.id ? { ...item, active: !item.active } : item))
        );
        addToast('success', data.message || `Đã đổi trạng thái cổng ${gw.name}`);
      }
    } catch (e: any) {
      addToast('error', 'Lỗi khi cập nhật trạng thái: ' + e.message);
    }
  };

  const handleDeleteGateway = async () => {
    if (!deletingGateway) return;
    try {
      const res = await fetch(`/api/admin/gateways/${deletingGateway.id}`, {
        method: 'DELETE',
        headers: { 'X-App-Language': language },
      });
      const data = await res.json();
      if (data.success) {
        setGateways((prev) => prev.filter((item) => item.id !== deletingGateway.id));
        addToast('success', data.message || (language === 'vi' ? 'Đã xóa cổng thanh toán thành công.' : 'Payment gateway deleted successfully.'));
        setIsDeleteModalOpen(false);
        setDeletingGateway(null);
      } else {
        addToast('error', data.message || 'Không thể xóa cổng thanh toán.');
      }
    } catch (e: any) {
      addToast('error', 'Lỗi khi xóa cổng: ' + e.message);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', language === 'vi' ? 'Đã sao chép vào bộ nhớ tạm!' : 'Copied to clipboard!');
  };

  // Filtered List
  const filteredGateways = gateways.filter((gw) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      gw.name.toLowerCase().includes(q) ||
      (gw.bankName && gw.bankName.toLowerCase().includes(q)) ||
      (gw.bankCode && gw.bankCode.toLowerCase().includes(q)) ||
      (gw.accountNumber && gw.accountNumber.toLowerCase().includes(q)) ||
      (gw.accountHolder && gw.accountHolder.toLowerCase().includes(q)) ||
      (gw.walletAddress && gw.walletAddress.toLowerCase().includes(q)) ||
      (gw.merchantId && gw.merchantId.toLowerCase().includes(q)) ||
      (gw.apiKey && gw.apiKey.toLowerCase().includes(q)) ||
      (gw.cryptoNetwork && gw.cryptoNetwork.toLowerCase().includes(q));

    const matchType = typeFilter === 'all' || gw.type === typeFilter;
    const matchCurrency = currencyFilter === 'all' || (gw.currency || (gw.type === 'crypto' ? 'USD' : 'VND')) === currencyFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && gw.active) ||
      (statusFilter === 'inactive' && !gw.active);

    return matchQuery && matchType && matchCurrency && matchStatus;
  });

  const vietqrCount = gateways.filter((g) => g.type === 'vietqr').length;
  const cryptoCount = gateways.filter((g) => g.type === 'crypto').length;
  const vndCount = gateways.filter((g) => (g.currency || (g.type === 'vietqr' ? 'VND' : 'USD')) === 'VND').length;
  const usdCount = gateways.filter((g) => (g.currency || (g.type === 'crypto' ? 'USD' : 'VND')) === 'USD').length;
  const activeCount = gateways.filter((g) => g.active).length;

  // Select2 Options Definitions
  const bankSelect2Options: Select2Option[] = SUPPORTED_BANKS.map((b) => ({
    value: b.code,
    label: `${b.name} (${b.shortName})`,
    sublabel: `Mã BIN: ${b.bin}`,
    badge: b.shortName,
    image: b.logoUrl,
  }));

  const cryptoSelect2Options: Select2Option[] = SUPPORTED_CRYPTOS.map((c) => ({
    value: `${c.type}_${c.network}`,
    label: c.name,
    sublabel: `Mạng ${c.network}`,
    badge: c.badge,
    image: c.logoUrl,
  }));

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Quick Stats */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>Payment Gateways Hub (MySQL Synced)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Binance Pay + VietQR Laser Scan Support</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'vi' ? 'Cấu Hình Cổng Thanh Toán & Ngân Hàng' : 'Payment Gateways & Banking Configuration'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              {language === 'vi'
                ? 'Quản lý danh sách cổng thanh toán lưu trực tiếp Database: Ngân hàng Việt Nam (VND VietQR), Binance Pay (ID, API Key, Secret Key, QR link, Bonus %) và Crypto USDT (USD).'
                : 'Configure Vietnamese banking (VND), Binance Pay (API Key, Secret Key, QR Code, Bonus %) and Crypto gateways synced to MySQL.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadGateways}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'vi' ? '+ Thêm Cổng Thanh Toán' : '+ Add New Gateway'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 block">Tổng Cổng Cấu Hình</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{gateways.length}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-semibold text-blue-300 block">Cổng Tiền Tệ VND</span>
            <span className="text-xl font-extrabold text-blue-400 mt-0.5 block">{vndCount}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-semibold text-amber-300 block">Cổng Tiền Tệ USD / Crypto</span>
            <span className="text-xl font-extrabold text-amber-400 mt-0.5 block">{usdCount}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-semibold text-emerald-300 block">Đang Hoạt Động (Active)</span>
            <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm theo tên, STK, Binance ID, API Key, ví crypto...' : 'Search name, account, Binance ID, wallet...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Currency Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setCurrencyFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                currencyFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'vi' ? 'Tất cả tiền tệ' : 'All Currencies'}
            </button>
            <button
              onClick={() => setCurrencyFilter('VND')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                currencyFilter === 'VND' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              VND (₫)
            </button>
            <button
              onClick={() => setCurrencyFilter('USD')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                currencyFilter === 'USD' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD ($)
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'vi' ? 'Mọi loại' : 'All Types'}
            </button>
            <button
              onClick={() => setTypeFilter('vietqr')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'vietqr' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bank VN
            </button>
            <button
              onClick={() => setTypeFilter('crypto')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'crypto' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Binance / Crypto
            </button>
          </div>
        </div>
      </div>

      {/* 3. Table of Payment Gateways */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Logo & Tên Cổng</th>
                <th className="py-3.5 px-4 text-center">Tiền Tệ</th>
                <th className="py-3.5 px-4">Thông Tin Tài Khoản / Binance ID</th>
                <th className="py-3.5 px-4">Khóa API & QR Link</th>
                <th className="py-3.5 px-4 text-center">Tỷ Giá & Bonus</th>
                <th className="py-3.5 px-4">Ghi Chú</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGateways.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-80" />
                    <p className="font-semibold text-xs">Không tìm thấy cổng thanh toán nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                filteredGateways.map((gw, idx) => {
                  const isBank = gw.type === 'vietqr';
                  const isBinance = gw.cryptoType === 'BINANCE_PAY' || gw.name.toLowerCase().includes('binance');
                  const bankMeta = isBank ? SUPPORTED_BANKS.find((b) => b.code === gw.bankCode) : null;
                  const cryptoMeta = !isBank ? SUPPORTED_CRYPTOS.find((c) => c.type === gw.cryptoType && c.network === gw.cryptoNetwork) : null;
                  const logoSrc = gw.logoUrl || bankMeta?.logoUrl || cryptoMeta?.logoUrl || '';
                  const gwCurrency = gw.currency || (isBank ? 'VND' : 'USD');

                  return (
                    <tr key={gw.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* STT */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Logo & Tên Cổng */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1 bg-white border border-slate-200 shadow-2xs shrink-0 overflow-hidden">
                            {logoSrc ? (
                              <img
                                src={logoSrc}
                                alt={gw.name}
                                className="w-full h-full object-contain rounded-lg"
                                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                              />
                            ) : isBank ? (
                              <span className="font-mono text-[11px] font-black text-blue-600">{bankMeta?.shortName || 'BANK'}</span>
                            ) : isBinance ? (
                              <Coins className="w-5 h-5 text-amber-500" />
                            ) : (
                              <Coins className="w-5 h-5 text-emerald-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{gw.name}</span>
                              {gw.bonusPercentage && gw.bonusPercentage > 0 ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  +{gw.bonusPercentage}% Bonus
                                </span>
                              ) : null}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isBank
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                    : isBinance
                                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                }`}
                              >
                                {isBank ? 'VietQR Banking' : isBinance ? 'Binance Pay Direct' : `Crypto (${gw.cryptoType || 'USDT'})`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tiền Tệ (Currency Column) */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-[11px] font-mono shadow-2xs border ${
                            gwCurrency === 'VND'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-blue-50 text-blue-700 border-blue-300'
                          }`}
                        >
                          {gwCurrency}
                        </span>
                      </td>

                      {/* Chi Tiết Tài Khoản / Binance ID */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-slate-900 text-xs">
                              {gw.merchantId || gw.accountNumber || gw.walletAddress || 'Chưa thiết lập'}
                            </span>
                            {(gw.merchantId || gw.accountNumber || gw.walletAddress) && (
                              <button
                                onClick={() => handleCopy(gw.merchantId || gw.accountNumber || gw.walletAddress || '')}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                title="Sao chép"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {gw.accountHolder ? (
                            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-tight">
                              {gw.accountHolder}
                            </p>
                          ) : null}
                          {isBinance && (
                            <p className="text-[10px] text-amber-700 font-semibold">Binance Pay ID</p>
                          )}
                        </div>
                      </td>

                      {/* Khóa API & QR Link */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[200px]">
                          {gw.apiKey ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-semibold">API:</span>
                              <span className="font-mono text-[10px] text-slate-700 truncate bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                                {gw.apiKey.substring(0, 10)}...
                              </span>
                            </div>
                          ) : null}

                          {gw.qrCodeUrl ? (
                            <a
                              href={gw.qrCodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              <QrCode className="w-3 h-3 text-blue-500" />
                              <span>Xem ảnh QR</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : isBank ? (
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> VietQR Auto Gen
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Không có link QR</span>
                          )}
                        </div>
                      </td>

                      {/* Tỷ Giá & Khuyến Mãi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-block text-center">
                          <span className="font-mono font-bold text-slate-900 text-xs block">
                            {gwCurrency === 'VND'
                              ? `1 USD = ${(gw.exchangeRateUsdToVnd || 25400).toLocaleString('vi-VN')} ₫`
                              : '1 USD = $1.00'}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600">
                            {gw.bonusPercentage && gw.bonusPercentage > 0
                              ? `Khuyến mãi +${gw.bonusPercentage}%`
                              : 'Không khuyến mãi'}
                          </span>
                        </div>
                      </td>

                      {/* Ghi chú */}
                      <td className="py-3.5 px-4">
                        <p className="text-[11px] text-slate-600 truncate max-w-[150px]" title={gw.notes || gw.instructions || ''}>
                          {gw.notes || gw.instructions || '—'}
                        </p>
                      </td>

                      {/* Trạng Thái (Active Toggle Switch) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(gw)}
                          className="inline-flex items-center gap-1 cursor-pointer focus:outline-hidden"
                          title="Bấm để Bật/Tắt cổng thanh toán"
                        >
                          {gw.active ? (
                            <div className="flex items-center gap-1 text-emerald-600 font-bold">
                              <ToggleRight className="w-6 h-6 text-emerald-600" />
                              <span className="text-[10px] uppercase">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400 font-bold">
                              <ToggleLeft className="w-6 h-6 text-slate-300" />
                              <span className="text-[10px] uppercase">Off</span>
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Thao Tác (Sửa / Xóa) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(gw)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Chỉnh sửa cấu hình"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingGateway(gw);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Xóa cổng thanh toán"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT PAYMENT GATEWAY */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingGateway ? 'Chỉnh Sửa Cổng Thanh Toán' : 'Thêm Cổng Thanh Toán Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cấu hình tài khoản ngân hàng hoặc Binance Pay / Crypto lưu trực tiếp Database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveGateway} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Loại Cổng Thanh Toán:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        type: 'vietqr',
                        currency: 'VND',
                        bankCode: formData.bankCode || 'MBBANK',
                        bankName: formData.bankName || 'MBBank (Ngân Hàng Quân Đội)',
                        logoUrl: formData.logoUrl || 'https://i.imgur.com/zVEduxd.png',
                      });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      formData.type === 'vietqr'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Ngân Hàng Việt Nam</p>
                      <p className="text-[11px] text-slate-500">MB, VCB, CTG, ACB, BIDV (VND)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        type: 'crypto',
                        currency: 'USD',
                        cryptoType: formData.cryptoType || 'BINANCE_PAY',
                        cryptoNetwork: formData.cryptoNetwork || 'BINANCE_DIRECT',
                        logoUrl: formData.logoUrl || 'https://i.imgur.com/iBEGgng.png',
                      });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      formData.type === 'crypto'
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Binance Pay & Crypto</p>
                      <p className="text-[11px] text-slate-500">Binance Pay, USDT TRC20 (USD)</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* VIETQR BANKING FIELDS */}
              {formData.type === 'vietqr' ? (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {/* Select Bank using Select2 */}
                  <Select2
                    label="Chọn Ngân Hàng Việt Nam:"
                    placeholder="Tìm kiếm và chọn ngân hàng Việt Nam..."
                    options={bankSelect2Options}
                    value={formData.bankCode || 'MBBANK'}
                    onChange={(selectedCode) => {
                      const meta = SUPPORTED_BANKS.find((b) => b.code === selectedCode);
                      setFormData({
                        ...formData,
                        bankCode: selectedCode,
                        bankName: meta ? meta.name : selectedCode,
                        name: meta ? meta.name : selectedCode,
                        logoUrl: meta ? meta.logoUrl : formData.logoUrl,
                      });
                    }}
                  />

                  {/* Link Ảnh QR Code Tùy Chỉnh (Tùy chọn) - Đặt ngay bên dưới Chọn Ngân Hàng */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>Link Ảnh QR Code Tùy Chỉnh (Tùy Chọn):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Để trống để hệ thống tự động sinh VietQR chuẩn ngân hàng"
                      value={formData.qrCodeUrl || ''}
                      onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                    />
                    {formData.qrCodeUrl && (
                      <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <img src={formData.qrCodeUrl} alt="Custom QR Preview" className="w-10 h-10 object-contain rounded-lg border border-slate-100 bg-white p-0.5" />
                        <span className="text-[11px] text-slate-600 font-semibold">Bản xem trước QR ngân hàng tùy chỉnh</span>
                      </div>
                    )}
                  </div>

                  {/* STK & Chủ TK */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số Tài Khoản (STK) <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 0988889999"
                        value={formData.accountNumber || ''}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên Chủ Tài Khoản <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        placeholder="VD: NGUYEN VAN A"
                        value={formData.accountHolder || ''}
                        onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 uppercase focus:outline-hidden focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Tỷ giá & Khuyến mãi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tỷ Giá Nạp (1 USD = ? VND):
                      </label>
                      <input
                        type="number"
                        placeholder="25400"
                        value={formData.exchangeRateUsdToVnd || 25400}
                        onChange={(e) => setFormData({ ...formData, exchangeRateUsdToVnd: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-amber-500" />
                        <span>Khuyến Mãi Nạp Thêm (% Bonus):</span>
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        min={0}
                        max={100}
                        value={formData.bonusPercentage || 0}
                        onChange={(e) => setFormData({ ...formData, bonusPercentage: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* CRYPTO / USDT / BINANCE FIELDS */
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {/* Select Crypto Type using Select2 */}
                  <Select2
                    label="Chọn Mạng Lưới & Loại Tiền Điện Tử:"
                    placeholder="Tìm kiếm và chọn mạng lưới USDT / Binance Pay..."
                    options={cryptoSelect2Options}
                    value={`${formData.cryptoType}_${formData.cryptoNetwork}`}
                    onChange={(val) => {
                      const match = SUPPORTED_CRYPTOS.find((c) => `${c.type}_${c.network}` === val);
                      if (match) {
                        setFormData({
                          ...formData,
                          cryptoType: match.type,
                          cryptoNetwork: match.network,
                          name: formData.name || match.name,
                          logoUrl: formData.logoUrl || match.logoUrl,
                        });
                      }
                    }}
                  />

                  {/* BINANCE PAY SPECIFIC CONFIGURATION */}
                  {formData.cryptoType === 'BINANCE_PAY' ? (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-600" />
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                          Cấu Hình Binance Pay (Binance ID, API Key, Secret Key, QR)
                        </h4>
                      </div>

                      {/* Binance ID (Merchant ID) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Binance ID / Merchant ID <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="text"
                          placeholder="VD: 889922334 hoặc Merchant ID Binance Pay"
                          value={formData.merchantId || formData.accountNumber || ''}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              merchantId: e.target.value,
                              accountNumber: e.target.value,
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
                          required
                        />
                      </div>

                      {/* API Key & Secret Key */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                            <span>Binance API Key:</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Nhập Binance API Key"
                            value={formData.apiKey || ''}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                            <span>Binance Secret Key:</span>
                          </label>
                          <input
                            type="password"
                            placeholder="Nhập Binance Secret Key"
                            value={formData.secretKey || ''}
                            onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Link để hiển thị QR Code Binance Pay */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <QrCode className="w-3.5 h-3.5 text-amber-600" />
                          <span>Link Để Hiển Thị QR Code (QR Image Link):</span>
                        </label>
                        <input
                          type="text"
                          placeholder="VD: https://i.imgur.com/... hoặc link ảnh QR code Binance Pay của bạn"
                          value={formData.qrCodeUrl || ''}
                          onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-amber-500"
                        />
                        {formData.qrCodeUrl && (
                          <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200">
                            <img src={formData.qrCodeUrl} alt="Binance QR Preview" className="w-12 h-12 object-contain rounded-lg border border-slate-100" />
                            <span className="text-[11px] text-slate-600 font-semibold">Bản xem trước QR Binance Pay</span>
                          </div>
                        )}
                      </div>

                      {/* Khuyến Mãi Nạp Thêm (% Bonus) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5 text-amber-500" />
                          <span>Khuyến Mãi Nạp Thêm (% Bonus):</span>
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          min={0}
                          max={100}
                          value={formData.bonusPercentage || 0}
                          onChange={(e) => setFormData({ ...formData, bonusPercentage: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                    </div>
                  ) : (
                    /* USDT DIRECT CRYPTO */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Địa Chỉ Ví Crypto (USDT / Crypto Address) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="text"
                          placeholder="VD: TLJp5Vw8mKqC8v9zX1nYpP2kR4L6qW8e7T"
                          value={formData.walletAddress || formData.accountNumber || ''}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              walletAddress: e.target.value,
                              accountNumber: e.target.value,
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Memo / Tag (Nếu có):
                          </label>
                          <input
                            type="text"
                            placeholder="VD: 102938"
                            value={formData.memoTag || ''}
                            onChange={(e) => setFormData({ ...formData, memoTag: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-amber-500" />
                            <span>Khuyến Mãi Nạp Thêm (% Bonus):</span>
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            min={0}
                            max={100}
                            value={formData.bonusPercentage || 0}
                            onChange={(e) => setFormData({ ...formData, bonusPercentage: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* QR Code link for USDT */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Link Ảnh QR Code Ví (Tùy Chọn):
                        </label>
                        <input
                          type="text"
                          placeholder="VD: https://i.imgur.com/..."
                          value={formData.qrCodeUrl || ''}
                          onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIETQR BANKING: WEBHOOK SIEUTHICODE CONFIGURATION */}
              {formData.type === 'vietqr' ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-slate-900">Cấu Hình Webhook SieuThiCode (Tự Động Cộng Tiền)</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                      SieuThiCode Webhook
                    </span>
                  </div>

                  {/* Webhook Endpoint URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL Nhận Webhook (Cấu hình trên SieuThiCode):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={
                          typeof window !== 'undefined'
                            ? `${window.location.origin}/webhook/sieuthicode?type=${editingGateway?.id || 'ID_CONG'}`
                            : `/webhook/sieuthicode?type=${editingGateway?.id || 'ID_CONG'}`
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-mono text-blue-700 font-bold cursor-text select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url =
                            typeof window !== 'undefined'
                              ? `${window.location.origin}/webhook/sieuthicode?type=${editingGateway?.id || 'ID_CONG'}`
                              : `/webhook/sieuthicode?type=${editingGateway?.id || 'ID_CONG'}`;
                          navigator.clipboard.writeText(url);
                          addToast('success', 'Đã sao chép URL Webhook!');
                        }}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        title="Sao chép"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Dán link này vào mục Webhook trên SieuThiCode. Tham số <code className="font-mono text-blue-600 font-bold">?type={editingGateway?.id || 'id'}</code> giúp hệ thống nhận diện chính xác phương thức thanh toán.
                    </p>
                  </div>

                  {/* Secret Webhook (Signature) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chữ Ký Webhook (Signature / Secret):
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 78d0ac0067b9d679bf944819ad080f5d hoặc Token bảo mật"
                      value={formData.webhookSecret || ''}
                      onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Mã chữ ký bảo mật được cấu hình tại SieuThiCode (truyền trong HTTP Header <code className="font-mono font-semibold">signature</code>).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Phương thức Binance Pay & Crypto thanh toán bằng tiền tệ <strong>USD ($)</strong> qua <strong>Binance ID / API Key / Ví Crypto</strong> trực tiếp (Không sử dụng Webhook).
                  </span>
                </div>
              )}

              {/* Ghi chú & Hướng dẫn nạp bằng RichTextEditor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ghi Chú & Hướng Dẫn Nạp (Rich Text Editor):</span>
                </label>
                <RichTextEditor
                  value={formData.notes || formData.instructions || ''}
                  onChange={(val) => setFormData({ ...formData, notes: val, instructions: val })}
                  placeholder="Nhập ghi chú hoặc hướng dẫn nạp chi tiết hiển thị cho khách hàng (hỗ trợ in đậm, màu sắc, liên kết, danh sách...)"
                  minHeight="140px"
                />
              </div>

              {/* Trạng Thái Kích Hoạt */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">Trạng Thái Hoạt Động</p>
                  <p className="text-[11px] text-slate-500">Hiển thị cổng thanh toán này trên trang nạp tiền của khách hàng</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className="cursor-pointer focus:outline-hidden"
                >
                  {formData.active ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {editingGateway ? 'Cập Nhật Cổng' : 'Lưu & Kích Hoạt Cổng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && deletingGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Xác Nhận Xóa Cổng Thanh Toán?</h3>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn xóa vĩnh viễn cấu hình cổng <span className="font-bold text-slate-800">"{deletingGateway.name}"</span> không? Thao tác này không thể hoàn tác.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingGateway(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteGateway}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

