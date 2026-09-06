import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { CurrencyItem } from '../../../types';
import {
  DollarSign,
  RefreshCw,
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
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpRight,
  Check,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { StatCard } from '../../ui/StatCard';
import { PageHeader } from '../../ui/PageHeader';

const PRESET_CURRENCIES = [
  { code: 'USD', name: 'Đô la Mỹ (USD)', symbol: '$', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 1.0 },
  { code: 'VND', name: 'Việt Nam Đồng (VND)', symbol: '₫', symbolPosition: 'right' as const, decimalDigits: 0, defaultRate: 25400.0 },
  { code: 'EUR', name: 'Đồng Euro (EUR)', symbol: '€', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 0.92 },
  { code: 'GBP', name: 'Bảng Anh (GBP)', symbol: '£', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 0.79 },
  { code: 'JPY', name: 'Yên Nhật (JPY)', symbol: '¥', symbolPosition: 'left' as const, decimalDigits: 0, defaultRate: 154.5 },
  { code: 'KRW', name: 'Won Hàn Quốc (KRW)', symbol: '₩', symbolPosition: 'left' as const, decimalDigits: 0, defaultRate: 1380.0 },
  { code: 'CNY', name: 'Nhân Dân Tệ (CNY)', symbol: '¥', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 7.25 },
  { code: 'THB', name: 'Baht Thái (THB)', symbol: '฿', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 36.5 },
  { code: 'SGD', name: 'Đô la Singapore (SGD)', symbol: 'S$', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 1.35 },
  { code: 'MYR', name: 'Ringgit Malaysia (MYR)', symbol: 'RM', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 4.7 },
  { code: 'BRL', name: 'Real Brazil (BRL)', symbol: 'R$', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 5.45 },
  { code: 'INR', name: 'Rupee Ấn Độ (INR)', symbol: '₹', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 83.5 },
  { code: 'RUB', name: 'Rúp Nga (RUB)', symbol: '₽', symbolPosition: 'right' as const, decimalDigits: 2, defaultRate: 90.0 },
  { code: 'CAD', name: 'Đô la Canada (CAD)', symbol: 'CA$', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 1.37 },
  { code: 'AUD', name: 'Đô la Úc (AUD)', symbol: 'AU$', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 1.52 },
  { code: 'PHP', name: 'Peso Philippines (PHP)', symbol: '₱', symbolPosition: 'left' as const, decimalDigits: 2, defaultRate: 58.0 },
  { code: 'IDR', name: 'Rupiah Indonesia (IDR)', symbol: 'Rp', symbolPosition: 'left' as const, decimalDigits: 0, defaultRate: 16200.0 },
  { code: 'TWD', name: 'Tân Đài Tệ (TWD)', symbol: 'NT$', symbolPosition: 'left' as const, decimalDigits: 1, defaultRate: 32.5 },
];

export const AdminCurrenciesView: React.FC = () => {
  const { language, addToast } = useApp();

  const [currencies, setCurrencies] = useState<CurrencyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingApi, setSyncingApi] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyItem | null>(null);
  const [deletingCurrency, setDeletingCurrency] = useState<CurrencyItem | null>(null);

  // Quick edit rate in table
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineRateValue, setInlineRateValue] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Partial<CurrencyItem>>({
    code: 'VND',
    name: 'Việt Nam Đồng (VND)',
    symbol: '₫',
    symbolPosition: 'right',
    rate: 25400,
    thousandSeparator: ',',
    decimalSeparator: '.',
    decimalDigits: 0,
    isDefault: false,
    autoSync: true,
    active: true,
    sortOrder: 1,
  });

  const loadCurrencies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/currencies?_t=${Date.now()}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setCurrencies(data.data);
      }
    } catch (e) {
      console.warn('Load currencies error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const handleSyncFromApi = async () => {
    setSyncingApi(true);
    try {
      const res = await fetch('/api/admin/currencies/sync', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        addToast('success', data.message || 'Đã đồng bộ tỷ giá mới nhất từ open.er-api.com!');
        if (Array.isArray(data.data)) {
          setCurrencies(data.data);
        } else {
          loadCurrencies();
        }
      } else {
        addToast('error', data?.message || 'Lỗi đồng bộ tỷ giá từ API');
      }
    } catch (e: any) {
      addToast('error', e.message || 'Lỗi kết nối API open.er-api.com');
    } finally {
      setSyncingApi(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCurrency(null);
    setFormData({
      code: '',
      name: '',
      symbol: '$',
      symbolPosition: 'left',
      rate: 1.0,
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalDigits: 2,
      isDefault: false,
      autoSync: true,
      active: true,
      sortOrder: currencies.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleSelectPreset = (preset: typeof PRESET_CURRENCIES[0]) => {
    setFormData({
      ...formData,
      code: preset.code,
      name: preset.name,
      symbol: preset.symbol,
      symbolPosition: preset.symbolPosition,
      decimalDigits: preset.decimalDigits,
      rate: preset.defaultRate,
    });
  };

  const handleOpenEditModal = (cur: CurrencyItem) => {
    setEditingCurrency(cur);
    setFormData({
      ...cur,
    });
    setIsModalOpen(true);
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code?.trim()) {
      addToast('error', 'Vui lòng nhập Mã tiền tệ (VD: USD, VND, EUR).');
      return;
    }
    if (!formData.name?.trim()) {
      addToast('error', 'Vui lòng nhập Tên loại tiền tệ.');
      return;
    }
    if (!formData.symbol?.trim()) {
      addToast('error', 'Vui lòng nhập Ký hiệu tiền tệ.');
      return;
    }
    if (!formData.rate || Number(formData.rate) <= 0) {
      addToast('error', 'Tỷ giá quy đổi phải lớn hơn 0.');
      return;
    }

    try {
      const url = editingCurrency ? `/api/admin/currencies/${editingCurrency.id}` : '/api/admin/currencies';
      const method = editingCurrency ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();
      if (resData?.success) {
        addToast('success', resData.message || 'Lưu cấu hình tiền tệ thành công!');
        setIsModalOpen(false);
        loadCurrencies();
      } else {
        addToast('error', resData.message || 'Không thể lưu loại tiền tệ.');
      }
    } catch (e: any) {
      addToast('error', e.message || 'Lỗi máy chủ khi lưu.');
    }
  };

  const handleToggleSync = async (cur: CurrencyItem) => {
    try {
      const res = await fetch(`/api/admin/currencies/${cur.id}/toggle-sync`, { method: 'PATCH' });
      const data = await res.json();
      if (data?.success) {
        setCurrencies((prev) =>
          prev.map((c) => (c.id === cur.id ? { ...c, autoSync: !c.autoSync } : c))
        );
        addToast('success', data.message);
      } else {
        addToast('error', data?.message || 'Lỗi cập nhật');
      }
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleToggleActive = async (cur: CurrencyItem) => {
    try {
      const res = await fetch(`/api/admin/currencies/${cur.id}/toggle-active`, { method: 'PATCH' });
      const data = await res.json();
      if (data?.success) {
        setCurrencies((prev) =>
          prev.map((c) => (c.id === cur.id ? { ...c, active: !c.active } : c))
        );
        addToast('success', data.message);
      } else {
        addToast('error', data?.message || 'Lỗi cập nhật');
      }
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleSaveInlineRate = async (cur: CurrencyItem) => {
    const numRate = Number(inlineRateValue);
    if (isNaN(numRate) || numRate <= 0) {
      addToast('error', 'Tỷ giá không hợp lệ.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/currencies/${cur.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: numRate }),
      });
      const data = await res.json();
      if (data?.success) {
        setCurrencies((prev) =>
          prev.map((c) => (c.id === cur.id ? { ...c, rate: numRate } : c))
        );
        setInlineEditingId(null);
        addToast('success', `Đã cập nhật tỷ giá ${cur.code} thành 1 USD = ${numRate.toLocaleString('vi-VN')} ${cur.symbol}`);
      }
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const handleDeleteCurrency = async () => {
    if (!deletingCurrency) return;
    try {
      const res = await fetch(`/api/admin/currencies/${deletingCurrency.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) {
        addToast('success', data.message);
        setIsDeleteModalOpen(false);
        setDeletingCurrency(null);
        loadCurrencies();
      } else {
        addToast('error', data?.message || 'Không thể xóa tiền tệ.');
      }
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  const filteredCurrencies = currencies.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesActive =
      activeFilter === 'all' ? true : activeFilter === 'active' ? c.active : !c.active;

    return matchesSearch && matchesActive;
  });

  const autoSyncCount = currencies.filter((c) => c.autoSync).length;
  const activeCount = currencies.filter((c) => c.active).length;

  return (
    <div className="space-y-6 w-full">
      {/* 1. Page Header with Open-Design Standards */}
      <PageHeader
        title={language === 'vi' ? 'Cấu Hình Tiền Tệ & Tỷ Giá Quy Đổi' : 'Multi-Currency & FX Engine'}
        description={
          language === 'vi'
            ? 'Quản lý tỷ giá FX thời gian thực, đồng bộ tự động open.er-api.com, cấu hình tiền tệ cơ sở USD và phân bổ định dạng số.'
            : 'Configure fiat currencies, live FX auto-synchronization via open.er-api.com, base currency, and format display rules.'
        }
        badge={
          <Badge variant="emerald" pulse>
            FX ENGINE ONLINE
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncFromApi}
              disabled={syncingApi}
              title="Sync rates from open.er-api.com"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncingApi ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{syncingApi ? (language === 'vi' ? 'Đang đồng bộ...' : 'Syncing...') : (language === 'vi' ? 'Đồng bộ API' : 'Sync FX API')}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>{language === 'vi' ? 'Thêm tiền tệ' : 'Add Currency'}</span>
            </Button>
          </div>
        }
      />

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === 'vi' ? 'Tổng số tiền tệ' : 'Total Currencies'}
          value={currencies.length}
          subtitle={`${activeCount} ${language === 'vi' ? 'đang hiển thị' : 'enabled'}`}
          icon={<Globe className="w-5 h-5 text-blue-600" />}
        />

        <StatCard
          title={language === 'vi' ? 'Tiền tệ cơ sở (Base)' : 'Base Currency'}
          value="USD ($)"
          subtitle="1.000000 USD cố định"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          highlight={true}
        />

        <StatCard
          title={language === 'vi' ? 'Tự động Sync API' : 'Auto Sync API'}
          value={`${autoSyncCount}/${currencies.length}`}
          subtitle="open.er-api.com live"
          icon={<RefreshCw className="w-5 h-5 text-purple-600" />}
        />

        <StatCard
          title={language === 'vi' ? 'Tỷ giá USD / VND' : 'USD / VND Rate'}
          value={`${currencies.find((c) => c.code === 'VND')?.rate.toLocaleString('vi-VN') || '25.400'} ₫`}
          subtitle={currencies.find((c) => c.code === 'VND')?.autoSync ? 'Auto Sync ON' : 'Thủ công'}
          icon={<TrendingUp className="w-5 h-5 text-rose-600" />}
          trend={{
            value: 'LIVE',
            positive: true,
            label: 'FX',
          }}
        />
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.10)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm theo mã (USD, VND...), tên, ký hiệu...' : 'Search currency code, name, symbol...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-full bg-slate-50/70 border border-slate-200 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({currencies.length})
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-3.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                activeFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoạt động ({activeCount})
            </button>
            <button
              onClick={() => setActiveFilter('inactive')}
              className={`px-3.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                activeFilter === 'inactive' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã tắt ({currencies.length - activeCount})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Currencies List Table inside Mac Window Chrome Card */}
      <Card
        macChrome={true}
        macTitle="FX_ENGINE // EXCHANGE_RATES"
        macBadge={
          <Badge variant="blue" pulse>
            {activeCount} ENABLED
          </Badge>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Loại Tiền Tệ</th>
                <th className="py-3.5 px-4">Ký Hiệu & Vị Trí</th>
                <th className="py-3.5 px-4">Tỷ Giá Quy Đổi (1 USD = ?)</th>
                <th className="py-3.5 px-4 text-center">Tự Động Sync API</th>
                <th className="py-3.5 px-4 text-center">Hoạt Động</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 whitespace-nowrap">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-blue-600" />
                    <span>Đang tải danh sách tiền tệ...</span>
                  </td>
                </tr>
              ) : filteredCurrencies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <Globe className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span>Không tìm thấy loại tiền tệ nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredCurrencies.map((cur, idx) => {
                  const isBaseUsd = cur.code === 'USD';
                  const isVnd = cur.code === 'VND';
                  const isInlineEditing = inlineEditingId === cur.id;

                  return (
                    <tr
                      key={cur.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isBaseUsd ? 'bg-emerald-50/20' : isVnd ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* Sort Index */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400 tabular-nums">
                        {cur.sortOrder !== undefined ? cur.sortOrder : idx + 1}
                      </td>

                      {/* Currency Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shadow-2xs ${
                              isBaseUsd
                                ? 'bg-emerald-600 text-white'
                                : isVnd
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {cur.symbol}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm font-mono">{cur.code}</span>
                              {cur.isDefault && (
                                <Badge variant="amber" size="sm">
                                  Mặc định
                                </Badge>
                              )}
                              {isBaseUsd && (
                                <Badge variant="emerald" size="sm">
                                  Base
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{cur.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Symbol & Position */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-800 text-xs px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {cur.symbol}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {cur.symbolPosition === 'left' ? 'Đứng trước ($ 100)' : 'Đứng sau (100 ₫)'} &bull; {cur.decimalDigits} số thập phân
                          </p>
                        </div>
                      </td>

                      {/* Exchange Rate */}
                      <td className="py-3.5 px-4">
                        {isInlineEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="any"
                              value={inlineRateValue}
                              onChange={(e) => setInlineRateValue(e.target.value)}
                              className="w-28 px-2 py-1 bg-white border border-blue-500 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden tabular-nums"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveInlineRate(cur)}
                              className="p-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              title="Lưu"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setInlineEditingId(null)}
                              className="p-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                              title="Hủy"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono tabular-nums font-black text-slate-900 text-sm">
                              {cur.rate.toLocaleString('vi-VN', { maximumFractionDigits: 6 })} {cur.symbol}
                            </span>
                            {!isBaseUsd && (
                              <button
                                onClick={() => {
                                  setInlineEditingId(cur.id);
                                  setInlineRateValue(String(cur.rate));
                                }}
                                className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Sửa nhanh tỷ giá"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 font-mono tabular-nums">1 USD = {cur.rate} {cur.code}</p>
                      </td>

                      {/* Auto Sync Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        {isBaseUsd ? (
                          <span className="text-[10px] font-bold text-slate-400 font-mono">Cố định 1.0</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleSync(cur)}
                            className="cursor-pointer inline-flex items-center gap-1.5 focus:outline-hidden"
                            title={cur.autoSync ? 'Đang tự động cập nhật từ API' : 'Tắt tự động (Giữ nguyên tỷ giá thủ công)'}
                          >
                            <Badge
                              variant={cur.autoSync ? 'blue' : 'slate'}
                              pulse={cur.autoSync}
                              size="sm"
                            >
                              {cur.autoSync ? 'API Sync' : 'Thủ công'}
                            </Badge>
                          </button>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cur)}
                          className="cursor-pointer focus:outline-hidden inline-flex"
                        >
                          <Badge
                            variant={cur.active ? 'emerald' : 'slate'}
                            pulse={cur.active}
                          >
                            {cur.active ? 'ACTIVE' : 'OFF'}
                          </Badge>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(cur)}
                            className="p-1.5 rounded-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Chỉnh sửa chi tiết"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!isBaseUsd && (
                            <button
                              onClick={() => {
                                setDeletingCurrency(cur);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa tiền tệ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* CREATE / EDIT CURRENCY MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={editingCurrency ? `Chỉnh Sửa Tiền Tệ: ${editingCurrency.code}` : 'Thêm Loại Tiền Tệ Mới'}
        >
          <form onSubmit={handleSaveCurrency} className="space-y-4 text-xs">
            {/* Presets Quick Picker (only on create) */}
            {!editingCurrency && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Chọn nhanh từ danh sách phổ biến:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-2xl bg-slate-50 border border-slate-200">
                  {PRESET_CURRENCIES.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        formData.code === p.code
                          ? 'bg-slate-950 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{p.symbol}</span>
                      <span>{p.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã Tiền Tệ (ISO Code): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: USD, VND, EUR"
                  value={formData.code || ''}
                  disabled={Boolean(editingCurrency)}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 uppercase disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Hiển Thị: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Việt Nam Đồng (VND)"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ký Hiệu Tiền Tệ: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: $, ₫, €, £"
                  value={formData.symbol || ''}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vị Trí Ký Hiệu:
                </label>
                <select
                  value={formData.symbolPosition || 'left'}
                  onChange={(e) => setFormData({ ...formData, symbolPosition: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="left">Đứng trước số tiền (VD: $ 100.00)</option>
                  <option value="right">Đứng sau số tiền (VD: 100.000 ₫)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tỷ Giá Quy Đổi (1 USD = ? {formData.code || 'VND'}): <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.000001"
                required
                placeholder="VD: 25400"
                value={formData.rate !== undefined ? formData.rate : 1}
                onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 tabular-nums"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Nếu nạp 1 USD thì số tiền tương đương sẽ là {formData.rate || 0} {formData.code}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số Chữ Số Thập Phân:
                </label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={formData.decimalDigits !== undefined ? formData.decimalDigits : 2}
                  onChange={(e) => setFormData({ ...formData, decimalDigits: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 tabular-nums"
                />
                <p className="text-[10px] text-slate-400 mt-1">VND thường để 0, USD/EUR để 2</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thứ Tự Ưu Tiên (Sort Order):
                </label>
                <input
                  type="number"
                  value={formData.sortOrder !== undefined ? formData.sortOrder : 99}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 tabular-nums"
                />
                <p className="text-[10px] text-slate-400 mt-1">USD = 0, VND = 1 để luôn nằm đầu tiên</p>
              </div>
            </div>

            {/* Toggles */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Tự Động Đồng Bộ Tỷ Giá (API open.er-api.com)</p>
                  <p className="text-[11px] text-slate-500">
                    Bật để tự động cập nhật tỷ giá khi hệ thống chạy sync. Tắt nếu bạn muốn giữ tỷ giá cố định tự nhập.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, autoSync: !formData.autoSync })}
                  className="cursor-pointer focus:outline-hidden"
                >
                  {formData.autoSync ? (
                    <ToggleRight className="w-8 h-8 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">Trạng Thái Hoạt Động</p>
                  <p className="text-[11px] text-slate-500">Hiển thị loại tiền tệ này cho khách hàng chọn trên website</p>
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
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {editingCurrency ? 'Lưu Thay Đổi' : 'Tạo Tiền Tệ'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && deletingCurrency && (
        <Modal
          isOpen={true}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Xác nhận xóa loại tiền tệ?"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900">Thao tác này không thể hoàn tác!</p>
                <p className="mt-1">
                  Bạn có chắc chắn muốn xóa tiền tệ <strong>{deletingCurrency.name} ({deletingCurrency.code})</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteCurrency}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminCurrenciesView;
