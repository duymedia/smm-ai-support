import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Trash2,
  Package,
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  Hash,
  CheckCircle2,
  XCircle,
  Plus,
  Zap,
  User,
  ExternalLink,
  ShieldCheck,
  Flame,
  ArrowRight,
  Lock,
  Unlock
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Select2 } from '../../ui/Select2';

export interface RentalOrder {
  id: number | string;
  userId: number | string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  billingCycle: string;
  total: number;
  status: 'active' | 'blocked' | 'expired' | string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const AdminOrdersView: React.FC = () => {
  const { language, formatMoney, addToast } = useApp();
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State for Delete Confirmation
  const [orderToDelete, setOrderToDelete] = useState<RentalOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State for Quick Extension
  const [orderToExtend, setOrderToExtend] = useState<RentalOrder | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [isExtending, setIsExtending] = useState(false);

  // Modal State for Creating a Manual Rental Order
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    userId: '1',
    packageId: 'professional',
    billingCycle: 'monthly',
    total: 49,
    notes: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
      addToast('error', language === 'vi' ? 'Không thể tải danh sách đơn hàng' : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || `Đã xóa đơn #${orderToDelete.id}`);
        setOrderToDelete(null);
        loadOrders();
      } else {
        addToast('error', data.message || 'Lỗi xóa đơn hàng');
      }
    } catch {
      addToast('error', 'Không thể xóa đơn hàng');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToExtend) return;
    setIsExtending(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderToExtend.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalDays: extendDays }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || `Đã gia hạn đơn #${orderToExtend.id} thêm ${extendDays} ngày!`);
        setOrderToExtend(null);
        loadOrders();
      } else {
        addToast('error', data.message || 'Lỗi gia hạn đơn');
      }
    } catch {
      addToast('error', 'Không thể kết nối máy chủ');
    } finally {
      setIsExtending(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || 'Đã tạo đơn thuê gói thành công!');
        setIsCreateModalOpen(false);
        setNewOrderForm({ userId: '1', packageId: 'professional', billingCycle: 'monthly', total: 49, notes: '' });
        loadOrders();
      } else {
        addToast('error', data.message || 'Lỗi tạo đơn thuê');
      }
    } catch {
      addToast('error', 'Lỗi kết nối máy chủ');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleBlock = async (ord: RentalOrder) => {
    try {
      const res = await fetch(`/api/admin/orders/${ord.id}/toggle-block`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        loadOrders();
      } else {
        addToast('error', data.message || 'Lỗi cập nhật trạng thái');
      }
    } catch {
      addToast('error', 'Lỗi kết nối máy chủ');
    }
  };

  const getRentalPeriod = (createdAt: string, cycle?: string, dbExpiresAt?: string, dbStatus?: string) => {
    const start = new Date(createdAt);
    const c = (cycle || 'monthly').toLowerCase();
    let end: Date;

    if (dbExpiresAt) {
      end = new Date(dbExpiresAt);
    } else {
      end = new Date(start);
      if (c === 'weekly') {
        end.setDate(end.getDate() + 7);
      } else if (c === 'yearly') {
        end.setFullYear(end.getFullYear() + 1);
      } else {
        end.setDate(end.getDate() + 30);
      }
    }

    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remHours = diffHours % 24;

    let status: 'active' | 'expiring_soon' | 'blocked' = 'active';
    let label = '';

    if (dbStatus === 'blocked' || diffMs <= 0) {
      status = 'blocked';
      const pastDays = Math.abs(diffDays);
      label = pastDays === 0
        ? (language === 'vi' ? 'Khóa / Hết hạn hôm nay' : 'Blocked / Expired today')
        : (language === 'vi' ? `Khóa do hết hạn (${pastDays}d trước)` : `Blocked (${pastDays}d ago)`);
    } else if (diffDays <= 3) {
      status = 'expiring_soon';
      label = diffDays === 0
        ? (language === 'vi' ? `Còn ${diffHours}h (Hôm nay)` : `${diffHours}h left`)
        : (language === 'vi' ? `Còn ${diffDays} ngày ${remHours}h` : `${diffDays}d ${remHours}h left`);
    } else {
      status = 'active';
      label = language === 'vi' ? `Còn ${diffDays} ngày` : `${diffDays} days left`;
    }

    return {
      startDate: start,
      endDate: end,
      status,
      label,
      diffDays,
      isBlocked: dbStatus === 'blocked' || diffMs <= 0,
    };
  };

  const formatDateTimeFull = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return {
      dateStr: `${d}/${m}/${y}`,
      timeStr: `${hh}:${mm}:${ss}`,
      fullStr: `${d}/${m}/${y} ${hh}:${mm}:${ss}`,
    };
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      String(o.id).toLowerCase().includes(q) ||
      o.userName?.toLowerCase().includes(q) ||
      o.userEmail?.toLowerCase().includes(q) ||
      o.packageName?.toLowerCase().includes(q) ||
      o.notes?.toLowerCase().includes(q);

    const matchPackage = packageFilter === 'all' || o.packageId === packageFilter;
    const matchCycle = cycleFilter === 'all' || o.billingCycle === cycleFilter;

    const rental = getRentalPeriod(o.createdAt, o.billingCycle, o.expiresAt, o.status);
    const matchStatus = statusFilter === 'all' || rental.status === statusFilter || (statusFilter === 'blocked' && rental.isBlocked);

    return matchSearch && matchPackage && matchCycle && matchStatus;
  });

  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  const activeCount = orders.filter((o) => getRentalPeriod(o.createdAt, o.billingCycle, o.expiresAt, o.status).status === 'active').length;
  const expiringCount = orders.filter((o) => getRentalPeriod(o.createdAt, o.billingCycle, o.expiresAt, o.status).status === 'expiring_soon').length;
  const blockedCount = orders.filter((o) => getRentalPeriod(o.createdAt, o.billingCycle, o.expiresAt, o.status).isBlocked).length;

  const getCycleLabel = (cycle?: string) => {
    if (cycle === 'weekly') return language === 'vi' ? 'Theo Tuần' : 'Weekly';
    if (cycle === 'yearly') return language === 'vi' ? 'Theo Năm' : 'Yearly';
    return language === 'vi' ? 'Theo Tháng' : 'Monthly';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Top Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{language === 'vi' ? 'Quản lý gói khách hàng đã thuê & hạn dùng' : 'Customer rented packages & expiration'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                {orders.length} {language === 'vi' ? 'gói đã thuê' : 'rented'}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              {language === 'vi'
                ? 'Theo dõi khách hàng đã thuê gói nào, thời điểm kích hoạt, ngày hết hạn và khóa tự động khi hết hạn.'
                : 'Manage customer rented plans, activation dates, exact expiration countdowns, and auto-blocking.'}
            </p>
          </div>
        </div>

        {/* Actions & Refresh */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">{language === 'vi' ? 'Tổng doanh số:' : 'Revenue:'}</span>
            <span className="font-bold text-emerald-600 font-mono">{formatMoney(totalRevenue)}</span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'vi' ? 'Tạo đơn thuê mới' : 'Assign package'}</span>
          </button>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title={language === 'vi' ? 'Làm mới danh sách' : 'Refresh list'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Status Counter KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400">
              {language === 'vi' ? 'Tổng gói đã thuê' : 'Total rented'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">{orders.length}</div>
            <div className="text-[10px] text-slate-500">{language === 'vi' ? 'Toàn hệ thống' : 'All time'}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400">
              {language === 'vi' ? 'Đang hoạt động' : 'Active plans'}
            </div>
            <div className="text-xl font-black text-emerald-600 mt-0.5 font-mono">{activeCount}</div>
            <div className="text-[10px] text-emerald-700 font-medium">{language === 'vi' ? 'Còn hạn sử dụng' : 'Healthy'}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400">
              {language === 'vi' ? 'Sắp hết hạn (≤ 3 ngày)' : 'Expiring soon'}
            </div>
            <div className="text-xl font-black text-amber-600 mt-0.5 font-mono">{expiringCount}</div>
            <div className="text-[10px] text-amber-700 font-medium">{language === 'vi' ? 'Cần gia hạn sớm' : 'Near expiration'}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400">
              {language === 'vi' ? 'Đã khóa / Hết hạn' : 'Blocked / Expired'}
            </div>
            <div className="text-xl font-black text-rose-600 mt-0.5 font-mono">{blockedCount}</div>
            <div className="text-[10px] text-rose-700 font-medium">{language === 'vi' ? 'Đã bị khóa gói' : 'Locked'}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Search & Multi-Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-white border border-slate-200/90 p-3 rounded-2xl shadow-2xs text-xs">
        <div className="sm:col-span-4 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm theo #ID, khách hàng, email, ghi chú...' : 'Search by #ID, user, email, notes...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="sm:col-span-3">
          <Select2
            value={packageFilter}
            onChange={(val) => setPackageFilter(val)}
            options={[
              { value: 'all', label: language === 'vi' ? 'Tất cả các gói' : 'All Plans' },
              { value: 'starter', label: 'Starter' },
              { value: 'professional', label: 'Professional' },
              { value: 'agency', label: 'Agency' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
          />
        </div>

        <div className="sm:col-span-2">
          <Select2
            value={cycleFilter}
            onChange={(val) => setCycleFilter(val)}
            options={[
              { value: 'all', label: language === 'vi' ? 'Tất cả chu kỳ' : 'All Cycles' },
              { value: 'weekly', label: language === 'vi' ? 'Theo tuần' : 'Weekly' },
              { value: 'monthly', label: language === 'vi' ? 'Theo tháng' : 'Monthly' },
              { value: 'yearly', label: language === 'vi' ? 'Theo năm' : 'Yearly' },
            ]}
          />
        </div>

        <div className="sm:col-span-3">
          <Select2
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses' },
              { value: 'active', label: language === 'vi' ? 'Đang hoạt động' : 'Active' },
              { value: 'expiring_soon', label: language === 'vi' ? 'Sắp hết hạn' : 'Expiring Soon' },
              { value: 'blocked', label: language === 'vi' ? 'Đã khóa do hết hạn' : 'Blocked / Expired' },
            ]}
          />
        </div>
      </div>

      {/* 4. Structured Rented Packages & Expiration Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4 w-16">{language === 'vi' ? '#ID' : '#ID'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Khách hàng' : 'Customer'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Gói thuê' : 'Package Plan'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Chu kỳ' : 'Cycle'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Bắt đầu thuê' : 'Start Date'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Hạn hết hạn' : 'Expiration Date'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Thời hạn còn lại' : 'Remaining Time'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Tổng tiền' : 'Total'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Ghi chú' : 'Notes'}</th>
                <th className="py-3 px-4 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500 font-medium">
                    {language === 'vi' ? 'Không có đơn thuê nào phù hợp.' : 'No matching rental orders found.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const rental = getRentalPeriod(ord.createdAt, ord.billingCycle, ord.expiresAt, ord.status);

                  return (
                    <tr key={ord.id} className={`hover:bg-slate-50/80 transition-colors ${rental.isBlocked ? 'bg-rose-50/30' : ''}`}>
                      {/* #ID Column */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 text-xs">
                          #{ord.id}
                        </span>
                      </td>

                      {/* Customer Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {ord.userName ? ord.userName.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{ord.userName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{ord.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Package Plan Column */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                          ord.packageId === 'enterprise'
                            ? 'bg-slate-900 text-amber-400 border border-amber-500/30'
                            : ord.packageId === 'agency'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : ord.packageId === 'professional'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          <Package className="w-3 h-3" />
                          <span>{ord.packageName}</span>
                        </span>
                      </td>

                      {/* Billing Cycle Column */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 text-xs">
                          {getCycleLabel(ord.billingCycle)}
                        </span>
                      </td>

                      {/* Start Date Column */}
                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-bold text-xs font-mono">
                          {formatDateTimeFull(rental.startDate).dateStr}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDateTimeFull(rental.startDate).timeStr}</span>
                        </div>
                      </td>

                      {/* Expiration Date Column */}
                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-bold text-xs font-mono">
                          {formatDateTimeFull(rental.endDate).dateStr}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDateTimeFull(rental.endDate).timeStr}</span>
                        </div>
                      </td>

                      {/* Remaining Time Column */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border ${
                          rental.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rental.status === 'expiring_soon'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            rental.status === 'active' ? 'bg-emerald-500' : rental.status === 'expiring_soon' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                          }`} />
                          <span>{rental.label}</span>
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-3 px-4">
                        {rental.isBlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Blocked</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      {/* Total Amount Column */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-emerald-600 font-mono text-xs">
                          {formatMoney(ord.total)}
                        </div>
                      </td>

                      {/* Notes / Metadata Column */}
                      <td className="py-3 px-4">
                        {ord.notes ? (
                          <div className="text-[11px] text-slate-700 max-w-xs truncate font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                            {ord.notes}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Extend Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToExtend(ord);
                              setExtendDays(30);
                            }}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Gia hạn thời gian thuê' : 'Extend Rental Duration'}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Lock / Unlock Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(ord)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              rental.isBlocked
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                            title={rental.isBlocked ? (language === 'vi' ? 'Mở khóa gói' : 'Unlock') : (language === 'vi' ? 'Khóa gói này' : 'Lock')}
                          >
                            {rental.isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete Order Button */}
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(ord)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Xóa đơn hàng này' : 'Delete order'}
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

      {/* 5. Modal Quick Extend Rental Duration */}
      {orderToExtend && (
        <Modal
          isOpen={true}
          onClose={() => !isExtending && setOrderToExtend(null)}
          title={language === 'vi' ? `Gia Hạn Đơn Thuê #${orderToExtend.id}` : `Extend Rental Order #${orderToExtend.id}`}
          subtitle={`${orderToExtend.userName} — Gói ${orderToExtend.packageName}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmExtend} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'vi' ? 'Khách hàng:' : 'Customer:'}</span>
                <span className="font-bold text-slate-900">{orderToExtend.userName} ({orderToExtend.userEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'vi' ? 'Gói hiện tại:' : 'Package Plan:'}</span>
                <span className="font-bold text-blue-700">{orderToExtend.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'vi' ? 'Hạn dùng hiện tại:' : 'Current Expiration:'}</span>
                <span className="font-bold font-mono text-slate-800">
                  {getRentalPeriod(orderToExtend.createdAt, orderToExtend.billingCycle).endDate.toLocaleDateString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {language === 'vi' ? 'Chọn thời gian gia hạn thêm:' : 'Select Extension Duration:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 7, label: language === 'vi' ? '+7 Ngày (1 Tuần)' : '+7 Days' },
                  { days: 30, label: language === 'vi' ? '+30 Ngày (1 Tháng)' : '+30 Days' },
                  { days: 365, label: language === 'vi' ? '+365 Ngày (1 Năm)' : '+1 Year' },
                ].map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setExtendDays(opt.days)}
                    className={`p-2.5 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      extendDays === opt.days
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isExtending}
                onClick={() => setOrderToExtend(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
              >
                {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isExtending}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>
                  {isExtending
                    ? (language === 'vi' ? 'Đang gia hạn...' : 'Extending...')
                    : (language === 'vi' ? 'Xác Nhận Gia Hạn' : 'Apply Extension')}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. Modal Create Manual Rental Order */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isCreating && setIsCreateModalOpen(false)}
          title={language === 'vi' ? 'Tạo Đơn Thuê Gói Cho Khách Hàng' : 'Assign Package Rental Order'}
          subtitle={language === 'vi' ? 'Gán gói dịch vụ và thiết lập thời hạn cho người dùng' : 'Create a new package subscription order for a customer'}
          maxWidth="md"
        >
          <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Mã Khách Hàng (User ID)' : 'Customer User ID'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={newOrderForm.userId}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, userId: e.target.value })}
                placeholder="Ví dụ: 1 hoặc 2"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <Select2
                label={language === 'vi' ? 'Loại Gói Dịch Vụ' : 'Package Plan'}
                value={newOrderForm.packageId}
                onChange={(val) => setNewOrderForm({ ...newOrderForm, packageId: val })}
                options={[
                  { value: 'starter', label: 'Starter Plan' },
                  { value: 'professional', label: 'Professional Plan' },
                  { value: 'agency', label: 'Agency Plan' },
                  { value: 'enterprise', label: 'Enterprise Plan' },
                ]}
              />
            </div>

            <div>
              <Select2
                label={language === 'vi' ? 'Chu Kỳ Thuê' : 'Billing Cycle'}
                value={newOrderForm.billingCycle}
                onChange={(val) => setNewOrderForm({ ...newOrderForm, billingCycle: val })}
                options={[
                  { value: 'weekly', label: language === 'vi' ? 'Theo Tuần (7 ngày)' : 'Weekly (7 days)' },
                  { value: 'monthly', label: language === 'vi' ? 'Theo Tháng (30 ngày)' : 'Monthly (30 days)' },
                  { value: 'yearly', label: language === 'vi' ? 'Theo Năm (365 ngày)' : 'Yearly (365 days)' },
                ]}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tổng Số Tiền (USD)' : 'Total Amount (USD)'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newOrderForm.total}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, total: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Ghi Chú Đơn Hàng' : 'Order Notes'}
              </label>
              <input
                type="text"
                value={newOrderForm.notes}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                placeholder="Ví dụ: Kích hoạt gói khuyến mãi"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isCreating}
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isCreating}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isCreating
                    ? (language === 'vi' ? 'Đang tạo...' : 'Creating...')
                    : (language === 'vi' ? 'Tạo Đơn Thuê' : 'Create Order')}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Modal Delete Confirmation */}
      {orderToDelete && (
        <Modal
          isOpen={true}
          onClose={() => !isDeleting && setOrderToDelete(null)}
          title={language === 'vi' ? 'Xác Nhận Xóa Đơn Thuê' : 'Confirm Order Deletion'}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'vi' ? `Bạn có chắc muốn xóa đơn thuê #${orderToDelete.id}?` : `Delete rental order #${orderToDelete.id}?`}
                </h4>
                <p className="text-slate-600">
                  {language === 'vi'
                    ? `Hành động này sẽ xóa vĩnh viễn đơn thuê gói "${orderToDelete.packageName}" của khách hàng "${orderToDelete.userName}" khỏi hệ thống.`
                    : `This will permanently delete the rental order for "${orderToDelete.userName}" from the database.`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Khách hàng:' : 'Customer:'}</span>
                <span className="font-bold text-slate-900">{orderToDelete.userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Gói thuê:' : 'Package:'}</span>
                <span className="font-bold text-blue-700">{orderToDelete.packageName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Tổng tiền:' : 'Total Amount:'}</span>
                <span className="font-extrabold text-emerald-600 font-mono">{formatMoney(orderToDelete.total)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isDeleting
                    ? (language === 'vi' ? 'Đang xóa...' : 'Deleting...')
                    : (language === 'vi' ? 'Xác Nhận Xóa' : 'Delete Order')}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
