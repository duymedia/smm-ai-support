import React, { useState, useEffect } from 'react';
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
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { StatCard } from '../../ui/StatCard';
import { PageHeader } from '../../ui/PageHeader';

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
    <div className="space-y-6">
      {/* 1. Page Header with Open-Design Standards */}
      <PageHeader
        title={language === 'vi' ? 'Quản Trị Gói Dịch Vụ & Bảng Giá' : 'Pricing & Packages Engine'}
        description={
          language === 'vi'
            ? 'Cấu hình các gói dịch vụ cho thuê SMM Panel, hạn mức máy chủ, giới hạn đơn và tính năng đặc quyền.'
            : 'Configure pricing matrices, instance quotas, order throughput thresholds, and SLA guarantees.'
        }
        badge={
          <Badge variant="blue" pulse>
            {packagesList.length} {language === 'vi' ? 'Gói cấu hình' : 'Plans'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentRoute('/packages')}
              title={language === 'vi' ? 'Xem trang bảng giá khách hàng' : 'Preview client pricing'}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              <span>{language === 'vi' ? 'Trang Khách' : 'Client View'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPackages}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>{language === 'vi' ? 'Làm mới' : 'Sync'}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>{language === 'vi' ? 'Thêm gói mới' : 'Add Plan'}</span>
            </Button>
          </div>
        }
      />

      {/* 2. KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === 'vi' ? 'Tổng số gói' : 'Total Plans'}
          value={packagesList.length}
          subtitle={language === 'vi' ? 'Đã lưu cấu hình' : 'Configured tiers'}
          icon={<Package className="w-5 h-5 text-blue-600" />}
        />

        <StatCard
          title={language === 'vi' ? 'Gói nổi bật (Featured)' : 'Featured Plans'}
          value={popularCount}
          subtitle={language === 'vi' ? 'Hiển thị nhãn khuyên dùng' : 'Highlighted for conversion'}
          icon={<Star className="w-5 h-5 text-amber-500" />}
          highlight={true}
        />

        <StatCard
          title={language === 'vi' ? 'Giá TB / Tháng' : 'Avg Monthly Price'}
          value={`$${avgMonthly}`}
          subtitle={language === 'vi' ? 'Giá trị trung bình gói' : 'Blended catalog average'}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />

        <StatCard
          title={language === 'vi' ? 'Đồng bộ hệ thống' : 'Engine Sync'}
          value="100%"
          subtitle={language === 'vi' ? 'Cơ sở dữ liệu realtime' : 'Realtime MySQL replica'}
          icon={<Zap className="w-5 h-5 text-purple-600" />}
          trend={{
            value: 'LIVE',
            positive: true,
            label: 'Ready',
          }}
        />
      </div>

      {/* 3. Controls Toolbar: Search & View Mode Switcher */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.10)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'vi' ? 'Tìm theo tên gói, mã hoặc mô tả...' : 'Search plans by name, code or feature...'}
            className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50/70 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* View Mode Switcher with pill buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/80 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Thẻ cấu hình' : 'Grid Cards'}</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'preview' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Xem trước trực tiếp' : 'Live Preview'}</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Bảng chi tiết' : 'Table'}</span>
          </button>
        </div>
      </div>

      {/* 4. Main Views */}

      {/* VIEW A: Grid Cards */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
          {filteredPackages.map((pkg) => (
            <Card
              key={pkg.id}
              macChrome={true}
              macTitle={pkg.name.toUpperCase()}
              macBadge={
                pkg.isPopular ? (
                  <Badge variant="amber" size="sm">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-1" />
                    Featured
                  </Badge>
                ) : pkg.badge ? (
                  <Badge variant="blue" size="sm">
                    {pkg.badge}
                  </Badge>
                ) : undefined
              }
              className={`flex flex-col justify-between ${pkg.isPopular ? 'ring-2 ring-blue-500/20' : ''}`}
            >
              {/* Card Header Content */}
              <div className="p-5 pb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">{pkg.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">{pkg.tagline}</p>

                {/* Pricing Badges */}
                <div className="mt-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 grid grid-cols-3 gap-1 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">{language === 'vi' ? 'Tuần' : 'Weekly'}</span>
                    <span className="font-bold text-slate-800 font-mono tabular-nums">{formatMoney(pkg.pricing.weekly)}</span>
                  </div>
                  <div className="border-x border-slate-200/80 px-1">
                    <span className="text-[10px] text-blue-600 block font-bold">{language === 'vi' ? 'Tháng' : 'Monthly'}</span>
                    <span className="font-extrabold text-blue-700 font-mono tabular-nums">{formatMoney(pkg.pricing.monthly)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block font-medium">{language === 'vi' ? 'Năm' : 'Yearly'}</span>
                    <span className="font-bold text-emerald-700 font-mono tabular-nums">{formatMoney(pkg.pricing.yearly)}</span>
                  </div>
                </div>
              </div>

              {/* Limits & Feature Highlights */}
              <div className="p-5 py-4 space-y-2.5 text-xs text-slate-600 flex-1">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Số Panel cấp phát:' : 'Panels Allowance:'}</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums px-2 py-0.5 bg-slate-100 rounded-md">
                    {pkg.features.panelsCount} {typeof pkg.features.panelsCount === 'number' ? 'instances' : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Hạn mức đơn/tháng:' : 'Monthly Order Cap:'}</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {typeof pkg.features.maxOrdersPerMonth === 'number'
                      ? pkg.features.maxOrdersPerMonth.toLocaleString()
                      : pkg.features.maxOrdersPerMonth}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Giới hạn dịch vụ:' : 'Services Limit:'}</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">{pkg.features.servicesLimit}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{language === 'vi' ? 'Cam kết Uptime SLA:' : 'Uptime SLA:'}</span>
                  <span className="font-bold text-emerald-700 font-mono tabular-nums">{pkg.features.uptimeSla}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">{language === 'vi' ? 'Cấp độ hỗ trợ:' : 'Support Tier:'}</span>
                  <Badge variant="blue" size="sm">
                    {pkg.features.supportLevel}
                  </Badge>
                </div>

                {/* Feature Tags Icons */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <Badge variant={pkg.features.aiOpsAssistant ? 'purple' : 'slate'} size="sm">
                    AI Ops: {pkg.features.aiOpsAssistant ? 'ON' : 'OFF'}
                  </Badge>
                  <Badge variant={pkg.features.autoRefillSync ? 'blue' : 'slate'} size="sm">
                    Auto-Refill: {pkg.features.autoRefillSync ? 'ON' : 'OFF'}
                  </Badge>
                  <Badge variant={pkg.features.freeSsl ? 'emerald' : 'slate'} size="sm">
                    SSL: {pkg.features.freeSsl ? 'Free' : 'No'}
                  </Badge>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTogglePopular(pkg)}
                  className={`p-2 rounded-full border text-xs transition-colors cursor-pointer ${
                    pkg.isPopular
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                  title={language === 'vi' ? 'Bật/Tắt Nổi Bật' : 'Toggle Featured Status'}
                >
                  <Star className={`w-3.5 h-3.5 ${pkg.isPopular ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenEdit(pkg)}
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPackageToDelete(pkg)}
                    title={language === 'vi' ? 'Xóa gói' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* VIEW B: Live Customer Preview */}
      {viewMode === 'preview' && (
        <div className="space-y-6 bg-slate-50/80 p-6 rounded-3xl border border-slate-200">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="blue" size="md">
              {language === 'vi' ? 'Giao Diện Xem Trước Thực Tế (Khách Hàng)' : 'Customer Storefront Preview'}
            </Badge>
            <h2 className="text-2xl font-extrabold text-slate-900">{language === 'vi' ? 'Bảng Giá Gói Thuê SMM Panel' : 'SMM Panel Rental Packages'}</h2>
            <p className="text-xs text-slate-500">
              {language === 'vi' ? 'Đây là giao diện khách hàng nhìn thấy khi truy cập /packages' : 'This is exactly how visitors and customers see the plans'}
            </p>

            <div className="inline-flex items-center rounded-full bg-white p-1 border border-slate-200 shadow-xs text-xs font-semibold mt-3">
              <button
                onClick={() => setPreviewCycle('weekly')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${previewCycle === 'weekly' ? 'bg-slate-950 text-white font-bold' : 'text-slate-600'}`}
              >
                {language === 'vi' ? 'Theo Tuần' : 'Weekly'}
              </button>
              <button
                onClick={() => setPreviewCycle('monthly')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${previewCycle === 'monthly' ? 'bg-slate-950 text-white font-bold' : 'text-slate-600'}`}
              >
                {language === 'vi' ? 'Theo Tháng' : 'Monthly'}
              </button>
              <button
                onClick={() => setPreviewCycle('yearly')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${previewCycle === 'yearly' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600'}`}
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
                      ? 'bg-slate-950 text-white border-blue-600 shadow-xl ring-2 ring-blue-600/30'
                      : 'bg-white text-slate-900 border-slate-200 shadow-xs'
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="blue" size="sm">
                        {pkg.badge}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <h3 className={`text-base font-bold ${pkg.isPopular ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</h3>
                    <p className={`text-xs mt-1 min-h-[36px] ${pkg.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{pkg.tagline}</p>

                    <div className="mt-5 pb-5 border-b border-slate-200/40">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold font-mono tabular-nums">{formatMoney(price)}</span>
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
                        <span>Hạn mức <strong className="font-mono tabular-nums">{typeof pkg.features.maxOrdersPerMonth === 'number' ? pkg.features.maxOrdersPerMonth.toLocaleString() : pkg.features.maxOrdersPerMonth}</strong> đơn/tháng</span>
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

                  <Button
                    variant={pkg.isPopular ? 'primary' : 'outline'}
                    className="mt-6 w-full"
                    onClick={() => handleOpenEdit(pkg)}
                  >
                    {language === 'vi' ? 'Chỉnh Sửa Gói Này' : 'Edit This Package'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW C: Detailed Table View */}
      {viewMode === 'table' && (
        <Card
          macChrome={true}
          macTitle="CATALOGUE // TIERS_MATRIX"
          macBadge={
            <Badge variant="blue" pulse>
              {filteredPackages.length} TIERS
            </Badge>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] whitespace-nowrap">
                <tr>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Tên Gói & ID' : 'Plan Name & ID'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Giá Tuần' : 'Weekly'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Giá Tháng' : 'Monthly'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Giá Năm' : 'Yearly'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Hạn Mức Đơn' : 'Orders Cap'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'SLA & Support' : 'SLA & Support'}</th>
                  <th className="py-3.5 px-4 text-center">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{pkg.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{pkg.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700 font-mono tabular-nums">{formatMoney(pkg.pricing.weekly)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-blue-700 font-mono tabular-nums">{formatMoney(pkg.pricing.monthly)}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono tabular-nums">{formatMoney(pkg.pricing.yearly)}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 font-mono tabular-nums">
                      {typeof pkg.features.maxOrdersPerMonth === 'number'
                        ? pkg.features.maxOrdersPerMonth.toLocaleString()
                        : pkg.features.maxOrdersPerMonth}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-bold font-mono tabular-nums">{pkg.features.uptimeSla}</span>
                      <span className="text-slate-400 block text-[10px]">{pkg.features.supportLevel}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleTogglePackageActive(pkg)}
                        className="inline-flex items-center gap-1 cursor-pointer focus:outline-hidden"
                        title={language === 'vi' ? 'Bấm để Bật/Tắt gói dịch vụ' : 'Click to toggle package status'}
                      >
                        <Badge
                          variant={pkg.active !== false ? 'emerald' : 'slate'}
                          pulse={pkg.active !== false}
                        >
                          {pkg.active !== false ? 'ACTIVE' : 'OFF'}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(pkg)}
                          className="p-1.5 rounded-full hover:bg-blue-50/80 text-blue-600 transition-colors cursor-pointer"
                          title={language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPackageToDelete(pkg)}
                          className="p-1.5 rounded-full hover:bg-rose-50/80 text-rose-600 transition-colors cursor-pointer"
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
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE & EDIT PACKAGE */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={
            editingPkg
              ? (language === 'vi' ? `Chỉnh Sửa Gói: ${editingPkg.name}` : `Edit Package: ${editingPkg.name}`)
              : (language === 'vi' ? 'Thêm Gói Thuê Panel Mới' : 'Create New Rental Plan')
          }
        >
          <form onSubmit={handleSubmitModal} className="space-y-4 text-xs">
            {/* Modal Internal Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setActiveModalTab('basic')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  activeModalTab === 'basic' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                1. {language === 'vi' ? 'Thông Tin Cơ Bản' : 'Basic Info'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('pricing')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  activeModalTab === 'pricing' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                2. {language === 'vi' ? 'Thiết Lập Bảng Giá' : 'Pricing Matrix'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('features')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  activeModalTab === 'features' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                3. {language === 'vi' ? 'Hạn Mức & Tính Năng' : 'Limits & Features'}
              </button>
            </div>

            {/* TAB 1: Basic Info */}
            {activeModalTab === 'basic' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Tên hiển thị gói:' : 'Plan Display Name:'}
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Professional Agency, Starter, Enterprise"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'vi' ? 'Huy hiệu nổi bật (Badge):' : 'Badge Ribbon Text:'}
                    </label>
                    <input
                      type="text"
                      value={formData.badge || ''}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g. Most Popular, Best Value, Khuyên Dùng"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
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
                        {language === 'vi' ? 'Đánh dấu gói Nổi Bật (Featured)' : 'Mark as Featured'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Pricing Matrix */}
            {activeModalTab === 'pricing' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-blue-700" />
                    {language === 'vi' ? 'Cấu hình giá theo 3 chu kỳ linh hoạt' : 'Configure flexible 3-tier billing intervals'}
                  </p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    {language === 'vi' ? 'Giá thanh toán theo USD. Hệ thống sẽ tự động quy đổi VND theo tỉ giá realtime.' : 'Prices in USD base currency. System auto-converts to display currency.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-extrabold text-sm text-slate-900 focus:outline-hidden font-mono tabular-nums"
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
                      className="w-full px-3 py-2 rounded-xl bg-white border border-blue-300 font-extrabold text-sm text-blue-700 focus:outline-hidden font-mono tabular-nums"
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
                      className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 font-extrabold text-sm text-emerald-700 focus:outline-hidden font-mono tabular-nums"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Limits & Features */}
            {activeModalTab === 'features' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                {formData.name || 'Plan'} &bull; ${formData.pricing?.monthly}/mo
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  {language === 'vi' ? 'Đóng' : 'Cancel'}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>{editingPkg ? (language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes') : (language === 'vi' ? 'Tạo Gói Mới' : 'Create Package')}</span>
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {packageToDelete && (
        <Modal
          isOpen={true}
          onClose={() => !isDeleting && setPackageToDelete(null)}
          title={language === 'vi' ? 'Xác Nhận Xóa Gói Đăng Ký' : 'Confirm Plan Deletion'}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'vi' ? 'Bạn có chắc chắn muốn xóa gói này?' : 'Are you sure you want to delete this plan?'}
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  {language === 'vi'
                    ? `Gói "${packageToDelete.name}" (${packageToDelete.id}) sẽ bị xóa vĩnh viễn khỏi danh sách và không còn hiển thị trên trang bảng giá của khách hàng.`
                    : `Plan "${packageToDelete.name}" will be permanently removed from customer view and cannot be restored.`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Tên gói:' : 'Plan Name:'}</span>
                <span className="font-bold text-slate-900">{packageToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Giá tháng:' : 'Monthly Price:'}</span>
                <span className="font-extrabold text-blue-700 font-mono tabular-nums">{formatMoney(packageToDelete.pricing.monthly)}/tháng</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Hạn mức:' : 'Limits:'}</span>
                <span className="font-medium text-slate-700 font-mono tabular-nums">
                  {packageToDelete.features.panelsCount} panels &bull; {typeof packageToDelete.features.maxOrdersPerMonth === 'number' ? packageToDelete.features.maxOrdersPerMonth.toLocaleString() : packageToDelete.features.maxOrdersPerMonth} đơn/tháng
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setPackageToDelete(null)}
              >
                {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
              </Button>

              <Button
                type="button"
                variant="danger"
                disabled={isDeleting}
                loading={isDeleting}
                onClick={handleConfirmDelete}
              >
                {language === 'vi' ? 'Xác Nhận Xóa Vĩnh Viễn' : 'Delete Plan'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
