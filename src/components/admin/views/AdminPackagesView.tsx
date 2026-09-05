import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../../context/AppContext';
import { PanelPackage } from '../../../types';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  Server,
  Star,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Eye,
  Sliders,
  RefreshCw,
  Search,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Radio,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  Headphones,
  Award,
  Crown,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Select2 } from '../../ui/Select2';

export const AdminPackagesView: React.FC = () => {
  const { language, formatMoney, addToast, refreshData, setCurrentRoute } = useApp();
  const [packagesList, setPackagesList] = useState<PanelPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'preview'>('grid');
  const [previewCycle, setPreviewCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PanelPackage | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'basic' | 'pricing' | 'features'>('basic');
  const [formData, setFormData] = useState<Partial<PanelPackage>>({
    name: '',
    tagline: '',
    badge: '',
    isPopular: false,
    pricing: {
      weekly: 19.99,
      monthly: 59.99,
      yearly: 479.99,
    },
    features: {
      panelsCount: 3,
      maxOrdersPerMonth: 10000,
      servicesLimit: 200,
      customDomain: true,
      aiOpsAssistant: true,
      autoRefillSync: true,
      freeSsl: true,
      uptimeSla: '99.9%',
      supportLevel: 'Priority 24/7',
      advancedAnalytics: true,
      apiAccess: true,
      automatedBackup: true,
    },
  });

  // Modal State for Delete Confirmation
  const [packageToDelete, setPackageToDelete] = useState<PanelPackage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPackages = async () => {
    setLoading(true);
    try {
      // Admin reads the complete catalogue from MySQL, including inactive plans.
      const res = await fetch('/api/admin/packages');
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        setPackagesList(data.data);
      }
    } catch (e) {
      console.error('Failed to load packages:', e);
      addToast('error', language === 'vi' ? 'Không thể tải danh sách gói' : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleOpenCreate = () => {
    const nextNum = packagesList.length + 1;
    setEditingPkg(null);
    setFormData({
      name: `Gói Cấu Hình ${nextNum}`,
      tagline: 'Phù hợp cho đại lý quy mô vừa và lớn muốn tối ưu vận hành.',
      badge: '',
      isPopular: false,
      pricing: {
        weekly: 19.99,
        monthly: 59.99,
        yearly: 479.99,
      },
      features: {
        panelsCount: 3,
        maxOrdersPerMonth: 10000,
        servicesLimit: 200,
        customDomain: true,
        aiOpsAssistant: true,
        autoRefillSync: true,
        freeSsl: true,
        uptimeSla: '99.9%',
        supportLevel: 'Priority 24/7',
        advancedAnalytics: true,
        apiAccess: true,
        automatedBackup: true,
      },
    });
    setActiveModalTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: PanelPackage) => {
    setEditingPkg(pkg);
    setFormData(JSON.parse(JSON.stringify(pkg)));
    setActiveModalTab('basic');
    setIsModalOpen(true);
  };

  const handleTogglePopular = async (pkg: PanelPackage) => {
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPopular: !pkg.isPopular }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', language === 'vi' ? `Đã cập nhật trạng thái nổi bật của [${pkg.name}]` : `Updated popular status for [${pkg.name}]`);
        await loadPackages();
        await refreshData();
      }
    } catch {
      addToast('error', 'Failed to update package');
    }
  };

  const handleTogglePackageActive = async (pkg: any) => {
    try {
      const nextActive = pkg.active === false ? true : false;
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          'success',
          language === 'vi'
            ? `Đã chuyển trạng thái gói [${pkg.name}] sang ${nextActive ? 'ACTIVE' : 'OFF'}`
            : `Package [${pkg.name}] status changed to ${nextActive ? 'ACTIVE' : 'OFF'}`
        );
        await loadPackages();
        await refreshData();
      } else {
        addToast('error', data.message || 'Failed to update package');
      }
    } catch {
      addToast('error', 'Failed to update package');
    }
  };

  const handleConfirmDelete = async () => {
    if (!packageToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/packages/${packageToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? `Đã xóa gói [${packageToDelete.name}] thành công` : 'Package deleted successfully'));
        setPackageToDelete(null);
        await loadPackages();
        await refreshData();
      } else {
        addToast('error', data.message || 'Failed to delete');
      }
    } catch {
      addToast('error', 'Failed to delete package');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập tên gói' : 'Please enter package name');
      return;
    }

    try {
      const isEdit = Boolean(editingPkg);
      const url = isEdit ? `/api/admin/packages/${editingPkg!.id}` : '/api/admin/packages';
      const method = isEdit ? 'PUT' : 'POST';

      // Auto-generate slug ID when creating if not provided
      const payload = {
        ...formData,
        id: isEdit
          ? editingPkg!.id
          : formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `plan-${Date.now().toString(36)}`,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (isEdit ? 'Cập nhật thành công!' : 'Tạo gói mới thành công!'));
        setIsModalOpen(false);
        await loadPackages();
        await refreshData();
      } else {
        addToast('error', data.message || 'Operation failed');
      }
    } catch {
      addToast('error', 'Failed to save package');
    }
  };

  const supportLevelOptions = [
    {
      value: 'Standard',
      label: 'Standard (Cơ Bản)',
      icon: Headphones,
    },
    {
      value: 'Priority 24/7',
      label: 'Priority 24/7 (Ưu Tiên)',
      icon: Award,
    },
    {
      value: 'Dedicated VIP',
      label: 'Dedicated VIP (Chuyên Gia Riêng)',
      icon: Crown,
    },
  ];

  const filteredPackages = packagesList.filter((pkg) => {
    const q = searchQuery.toLowerCase();
    return (
      pkg.name.toLowerCase().includes(q) ||
      pkg.tagline?.toLowerCase().includes(q) ||
      pkg.id.toLowerCase().includes(q) ||
      pkg.badge?.toLowerCase().includes(q)
    );
  });

  const popularCount = packagesList.filter((p) => p.isPopular).length;
  const avgMonthly = packagesList.length > 0
    ? (packagesList.reduce((acc, p) => acc + (p.pricing.monthly || 0), 0) / packagesList.length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Quick Stats */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-7 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <span>{language === 'vi' ? 'Quản Trị Bảng Giá & Gói Dịch Vụ' : 'Rental Plans & Pricing Engine'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                {packagesList.length} {language === 'vi' ? 'Gói cấu hình' : 'Active Plans'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {language === 'vi' ? 'Cấu Hình Gói Thuê & Hạn Mức SMM Panel' : 'SMM Panel Pricing & Tier Configuration'}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              {language === 'vi'
                ? 'Tùy chỉnh giá theo tuần/tháng/năm, phân bổ hạn mức máy chủ, giới hạn đơn hàng và tính năng đặc quyền hiển thị trên trang /packages của khách hàng.'
                : 'Manage weekly/monthly/yearly pricing tiers, server capacity limits, order quotas, and feature flags shown on customer /packages page.'}
            </p>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'vi' ? 'Thêm Gói Mới' : 'Add New Plan'}</span>
            </button>

            <button
              onClick={() => setCurrentRoute('/packages')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
              title={language === 'vi' ? 'Xem trang bảng giá thực tế của khách hàng' : 'Preview customer pricing page'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Xem Trang Khách' : 'Client View'}</span>
            </button>

            <button
              onClick={loadPackages}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Mini Stat Badges in Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">{language === 'vi' ? 'Tổng số gói' : 'Total Plans'}</p>
            <p className="text-lg font-black text-white mt-0.5">{packagesList.length}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">{language === 'vi' ? 'Gói Nổi Bật (Featured)' : 'Featured / Popular'}</p>
            <p className="text-lg font-black text-amber-400 mt-0.5">{popularCount}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">{language === 'vi' ? 'Giá TB / Tháng' : 'Avg Monthly Price'}</p>
            <p className="text-lg font-black text-blue-400 mt-0.5">${avgMonthly}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-400 font-medium">{language === 'vi' ? 'Trạng thái đồng bộ' : 'Engine Sync'}</p>
            <p className="text-lg font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Live
            </p>
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar: Search & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'vi' ? 'Tìm theo tên gói, mã hoặc mô tả...' : 'Search plans by name, code or feature...'}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Thẻ cấu hình' : 'Grid Cards'}</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'preview' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Xem trước trực tiếp' : 'Live Preview'}</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Bảng chi tiết' : 'Table'}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Views */}

      {/* VIEW A: Grid Cards (Default Admin Configuration View) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                pkg.isPopular
                  ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Card Header Top */}
              <div className="p-5 pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base">{pkg.name}</h3>
                      {pkg.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {pkg.badge}
                        </span>
                      )}
                      {pkg.isPopular && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">{pkg.tagline}</p>
                  </div>
                </div>

                {/* Pricing Badges */}
                <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-3 gap-1 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">{language === 'vi' ? 'Tuần' : 'Weekly'}</span>
                    <span className="font-bold text-slate-800">{formatMoney(pkg.pricing.weekly)}</span>
                  </div>
                  <div className="border-x border-slate-200/80 px-1">
                    <span className="text-[10px] text-blue-600 block font-bold">{language === 'vi' ? 'Tháng' : 'Monthly'}</span>
                    <span className="font-extrabold text-blue-700">{formatMoney(pkg.pricing.monthly)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block font-medium">{language === 'vi' ? 'Năm' : 'Yearly'}</span>
                    <span className="font-bold text-emerald-700">{formatMoney(pkg.pricing.yearly)}</span>
                  </div>
                </div>
              </div>

              {/* Limits & Feature Highlights */}
              <div className="p-5 py-4 space-y-2.5 text-xs text-slate-600 flex-1">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Số Panel cấp phát:' : 'Panels Allowance:'}</span>
                  <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md">
                    {pkg.features.panelsCount} {typeof pkg.features.panelsCount === 'number' ? 'instances' : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Hạn mức đơn/tháng:' : 'Monthly Order Cap:'}</span>
                  <span className="font-bold text-slate-900">
                    {typeof pkg.features.maxOrdersPerMonth === 'number'
                      ? pkg.features.maxOrdersPerMonth.toLocaleString()
                      : pkg.features.maxOrdersPerMonth}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Giới hạn dịch vụ:' : 'Services Limit:'}</span>
                  <span className="font-bold text-slate-900">{pkg.features.servicesLimit}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Cam kết Uptime SLA:' : 'Uptime SLA:'}</span>
                  <span className="font-bold text-emerald-700">{pkg.features.uptimeSla}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">{language === 'vi' ? 'Cấp độ hỗ trợ:' : 'Support Tier:'}</span>
                  <span className="font-semibold text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded-md">
                    {pkg.features.supportLevel}
                  </span>
                </div>

                {/* Feature Tags Icons */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pkg.features.aiOpsAssistant ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-400'}`}>
                    AI Ops: {pkg.features.aiOpsAssistant ? 'ON' : 'OFF'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pkg.features.autoRefillSync ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                    Auto-Refill: {pkg.features.autoRefillSync ? 'ON' : 'OFF'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pkg.features.freeSsl ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                    SSL: {pkg.features.freeSsl ? 'Free' : 'No'}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTogglePopular(pkg)}
                  className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                    pkg.isPopular
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                  title={language === 'vi' ? 'Bật/Tắt Nổi Bật' : 'Toggle Featured Status'}
                >
                  <Star className={`w-3.5 h-3.5 ${pkg.isPopular ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(pkg)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Chỉnh Sửa' : 'Edit'}</span>
                  </button>

                  <button
                    onClick={() => setPackageToDelete(pkg)}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 hover:border-rose-200 text-xs transition-colors cursor-pointer"
                    title={language === 'vi' ? 'Xóa gói' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW B: Live Customer Preview */}
      {viewMode === 'preview' && (
        <div className="space-y-6 bg-slate-100/70 p-6 rounded-3xl border border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {language === 'vi' ? 'Giao Diện Xem Trước Thực Tế (Khách Hàng)' : 'Customer Storefront Preview'}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">{language === 'vi' ? 'Bảng Giá Gói Thuê SMM Panel' : 'SMM Panel Rental Packages'}</h2>
            <p className="text-xs text-slate-500">
              {language === 'vi' ? 'Đây là giao diện khách hàng nhìn thấy khi truy cập /packages' : 'This is exactly how visitors and customers see the plans'}
            </p>

            {/* Cycle switcher in preview */}
            <div className="inline-flex items-center rounded-xl bg-white p-1 border border-slate-200 shadow-xs text-xs font-semibold mt-3">
              <button
                onClick={() => setPreviewCycle('weekly')}
                className={`px-4 py-1.5 rounded-lg transition-all ${previewCycle === 'weekly' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
              >
                {language === 'vi' ? 'Theo Tuần' : 'Weekly'}
              </button>
              <button
                onClick={() => setPreviewCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg transition-all ${previewCycle === 'monthly' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
              >
                {language === 'vi' ? 'Theo Tháng' : 'Monthly'}
              </button>
              <button
                onClick={() => setPreviewCycle('yearly')}
                className={`px-4 py-1.5 rounded-lg transition-all ${previewCycle === 'yearly' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600'}`}
              >
                {language === 'vi' ? 'Theo Năm (Tiết kiệm)' : 'Yearly (Save 33%)'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
            {packagesList.map((pkg) => {
              const price = pkg.pricing[previewCycle];
              return (
                <div
                  key={pkg.id}
                  className={`relative p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    pkg.isPopular
                      ? 'bg-slate-900 text-white border-blue-600 shadow-xl ring-2 ring-blue-600/30'
                      : 'bg-white text-slate-900 border-slate-200 shadow-xs'
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                      {pkg.badge}
                    </div>
                  )}

                  <div>
                    <h3 className={`text-base font-bold ${pkg.isPopular ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</h3>
                    <p className={`text-xs mt-1 min-h-[36px] ${pkg.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{pkg.tagline}</p>

                    <div className="mt-5 pb-5 border-b border-slate-200/40">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold">{formatMoney(price)}</span>
                        <span className={`text-xs ${pkg.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                          /{previewCycle === 'weekly' ? 'tuần' : previewCycle === 'monthly' ? 'tháng' : 'năm'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span><strong>{pkg.features.panelsCount}</strong> SMM Panel Instances</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Hạn mức <strong>{typeof pkg.features.maxOrdersPerMonth === 'number' ? pkg.features.maxOrdersPerMonth.toLocaleString() : pkg.features.maxOrdersPerMonth}</strong> đơn/tháng</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Custom Domain & Auto SSL</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{pkg.features.uptimeSla} Uptime SLA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Hỗ trợ: {pkg.features.supportLevel}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(pkg)}
                    className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      pkg.isPopular ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {language === 'vi' ? 'Chỉnh Sửa Gói Này' : 'Edit This Package'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW C: Detailed Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">{language === 'vi' ? 'Tên Gói & ID' : 'Plan Name & ID'}</th>
                  <th className="p-4">{language === 'vi' ? 'Giá Tuần' : 'Weekly'}</th>
                  <th className="p-4">{language === 'vi' ? 'Giá Tháng' : 'Monthly'}</th>
                  <th className="p-4">{language === 'vi' ? 'Giá Năm' : 'Yearly'}</th>
                  <th className="p-4">{language === 'vi' ? 'Hạn Mức Đơn' : 'Orders Cap'}</th>
                  <th className="p-4">{language === 'vi' ? 'SLA & Support' : 'SLA & Support'}</th>
                  <th className="p-4 text-center">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                  <th className="p-4 text-right">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{pkg.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{pkg.id}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{formatMoney(pkg.pricing.weekly)}</td>
                    <td className="p-4 font-extrabold text-blue-700">{formatMoney(pkg.pricing.monthly)}</td>
                    <td className="p-4 font-bold text-emerald-700">{formatMoney(pkg.pricing.yearly)}</td>
                    <td className="p-4 font-medium text-slate-800">
                      {typeof pkg.features.maxOrdersPerMonth === 'number'
                        ? pkg.features.maxOrdersPerMonth.toLocaleString()
                        : pkg.features.maxOrdersPerMonth}
                    </td>
                    <td className="p-4">
                      <span className="text-emerald-700 font-bold">{pkg.features.uptimeSla}</span>
                      <span className="text-slate-400 block text-[10px]">{pkg.features.supportLevel}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleTogglePackageActive(pkg)}
                        className="inline-flex items-center gap-1 cursor-pointer focus:outline-hidden"
                        title={language === 'vi' ? 'Bấm để Bật/Tắt gói dịch vụ' : 'Click to toggle package status'}
                      >
                        {pkg.active !== false ? (
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
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(pkg)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                          title={language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPackageToDelete(pkg)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title={language === 'vi' ? 'Xóa gói' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Comprehensive Create & Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={
            editingPkg
              ? (language === 'vi' ? `Chỉnh Sửa Gói: ${editingPkg.name}` : `Edit Package: ${editingPkg.name}`)
              : (language === 'vi' ? 'Thêm Gói Thuê Panel Mới' : 'Create New Rental Plan')
          }
          subtitle={language === 'vi' ? 'Thiết lập đầy đủ bảng giá, hạn mức máy chủ và các đặc quyền gói' : 'Configure pricing intervals, server quotas and feature entitlements'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmitModal} className="space-y-5 text-xs">
            {/* Modal Internal Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveModalTab('basic')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  activeModalTab === 'basic' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                1. {language === 'vi' ? 'Thông Tin Cơ Bản' : 'Basic Info'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('pricing')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  activeModalTab === 'pricing' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                2. {language === 'vi' ? 'Thiết Lập Bảng Giá' : 'Pricing Matrix'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('features')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  activeModalTab === 'features' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                3. {language === 'vi' ? 'Hạn Mức & Tính Năng' : 'Limits & Features'}
              </button>
            </div>

            {/* TAB 1: Basic Info (No Manual ID required - auto generated) */}
            {activeModalTab === 'basic' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Tên hiển thị gói:' : 'Plan Display Name:'}
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Professional Agency, Starter, Enterprise"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Mô tả ngắn (Tagline):' : 'Tagline / Short Summary:'}
                  </label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Lý tưởng cho agency quản lý nhiều khách hàng và cổng NCC."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'vi' ? 'Huy hiệu nổi bật (Badge):' : 'Badge Ribbon Text:'}
                    </label>
                    <input
                      type="text"
                      value={formData.badge || ''}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g. Most Popular, Best Value, Khuyên Dùng"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isPopular)}
                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-slate-800">
                        {language === 'vi' ? 'Đánh dấu gói Nổi Bật / Phổ Biến Nhất' : 'Mark as Most Popular / Featured'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Pricing Matrix */}
            {activeModalTab === 'pricing' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-blue-700" />
                    {language === 'vi' ? 'Cấu hình giá theo 3 chu kỳ linh hoạt' : 'Configure flexible 3-tier billing intervals'}
                  </p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    {language === 'vi' ? 'Giá thanh toán theo USD. Hệ thống sẽ tự động quy đổi VND theo tỉ giá realtime.' : 'Prices in USD base currency. System auto-converts to display currency.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="block font-bold text-slate-700 mb-1">{language === 'vi' ? 'Giá theo Tuần ($):' : 'Weekly Price ($):'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricing?.weekly ?? 19.99}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing!, weekly: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-extrabold text-sm text-slate-900 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200">
                    <label className="block font-bold text-blue-900 mb-1">{language === 'vi' ? 'Giá theo Tháng ($):' : 'Monthly Price ($):'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricing?.monthly ?? 59.99}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing!, monthly: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-blue-300 font-extrabold text-sm text-blue-700 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200">
                    <label className="block font-bold text-emerald-900 mb-1">{language === 'vi' ? 'Giá theo Năm ($):' : 'Yearly Price ($):'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricing?.yearly ?? 479.99}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing!, yearly: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 font-extrabold text-sm text-emerald-700 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Limits & Features (With Select2 for Support Level) */}
            {activeModalTab === 'features' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'vi' ? 'Số Panel cho phép:' : 'Panels Allowance:'}
                    </label>
                    <input
                      type="text"
                      value={formData.features?.panelsCount ?? 3}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase() === 'unlimited' ? 'Unlimited' : (parseInt(e.target.value) || 1);
                        setFormData({ ...formData, features: { ...formData.features!, panelsCount: val } });
                      }}
                      placeholder="e.g. 1, 3, 10 or Unlimited"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'vi' ? 'Hạn mức đơn / tháng:' : 'Monthly Orders Cap:'}
                    </label>
                    <input
                      type="text"
                      value={formData.features?.maxOrdersPerMonth ?? 10000}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase() === 'unlimited' ? 'Unlimited' : (parseInt(e.target.value) || 1000);
                        setFormData({ ...formData, features: { ...formData.features!, maxOrdersPerMonth: val } });
                      }}
                      placeholder="e.g. 10000 or Unlimited"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'vi' ? 'Giới hạn Dịch vụ:' : 'Services Limit:'}
                    </label>
                    <input
                      type="text"
                      value={formData.features?.servicesLimit ?? 200}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase() === 'unlimited' ? 'Unlimited' : (parseInt(e.target.value) || 50);
                        setFormData({ ...formData, features: { ...formData.features!, servicesLimit: val } });
                      }}
                      placeholder="e.g. 200 or Unlimited"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'vi' ? 'Cam kết Uptime SLA:' : 'Uptime SLA Commitment:'}
                    </label>
                    <input
                      type="text"
                      value={formData.features?.uptimeSla || '99.9%'}
                      onChange={(e) => setFormData({ ...formData, features: { ...formData.features!, uptimeSla: e.target.value } })}
                      placeholder="e.g. 99.9%, 99.99%"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  {/* Select2 for Support Level */}
                  <div>
                    <Select2
                      label={language === 'vi' ? 'Cấp độ Hỗ Trợ (Support Tier):' : 'Support Tier:'}
                      value={formData.features?.supportLevel || 'Priority 24/7'}
                      options={supportLevelOptions}
                      onChange={(val) => setFormData({
                        ...formData,
                        features: { ...formData.features!, supportLevel: val as any }
                      })}
                    />
                  </div>
                </div>

              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-mono">
                {formData.name || 'Plan'} &bull; ${formData.pricing?.monthly}/mo
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  {language === 'vi' ? 'Đóng' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPkg ? (language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes') : (language === 'vi' ? 'Tạo Gói Mới' : 'Create Package')}</span>
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. Delete Confirmation Question Modal */}
      {packageToDelete && (
        <Modal
          isOpen={true}
          onClose={() => !isDeleting && setPackageToDelete(null)}
          title={language === 'vi' ? 'Xác Nhận Xóa Gói Đăng Ký' : 'Confirm Plan Deletion'}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'vi' ? 'Bạn có chắc chắn muốn xóa gói này?' : 'Are you sure you want to delete this plan?'}
                </h4>
                <p className="text-slate-600">
                  {language === 'vi'
                    ? `Gói "${packageToDelete.name}" (${packageToDelete.id}) sẽ bị xóa vĩnh viễn khỏi danh sách và không còn hiển thị trên trang bảng giá của khách hàng.`
                    : `Plan "${packageToDelete.name}" will be permanently removed from customer view and cannot be restored.`}
                </p>
              </div>
            </div>

            {/* Package summary preview box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Tên gói:' : 'Plan Name:'}</span>
                <span className="font-bold text-slate-900">{packageToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Giá tháng:' : 'Monthly Price:'}</span>
                <span className="font-extrabold text-blue-700">{formatMoney(packageToDelete.pricing.monthly)}/tháng</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Hạn mức:' : 'Limits:'}</span>
                <span className="font-medium text-slate-700">
                  {packageToDelete.features.panelsCount} panels &bull; {typeof packageToDelete.features.maxOrdersPerMonth === 'number' ? packageToDelete.features.maxOrdersPerMonth.toLocaleString() : packageToDelete.features.maxOrdersPerMonth} đơn/tháng
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPackageToDelete(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isDeleting
                    ? (language === 'vi' ? 'Đang xóa...' : 'Deleting...')
                    : (language === 'vi' ? 'Xác Nhận Xóa Vĩnh Viễn' : 'Delete Plan')}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
