import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Repeat,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
  Package,
  RefreshCw,
  Search,
  XCircle,
  ExternalLink,
  Zap,
  Server,
  Globe,
  PlusCircle,
  Sliders,
  List,
  LayoutGrid,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Select2 } from '../ui/Select2';
import { Modal } from '../ui/Modal';

export interface UserSubscriptionItem {
  id: number | string;
  orderId: number | string;
  packageId?: number | string;
  packageName: string;
  packageCode: string;
  billingCycle: string;
  total: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expiring_soon' | 'expired';
  daysLeft: number;
  hoursLeft: number;
  label: string;
  autoRenew: boolean;
  notes?: string;
  // Linked Panel Info
  linkedPanel?: {
    id: string;
    name: string;
    domain: string;
    status: string;
  } | null;
}

export const SubscriptionsPage: React.FC = () => {
  const { user, packages, formatMoney, setCurrentRoute, addToast, language, refreshData } = useApp();
  const [items, setItems] = useState<UserSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Extend Modal state
  const [extendingItem, setExtendingItem] = useState<UserSubscriptionItem | null>(null);
  const [selectedExtendDays, setSelectedExtendDays] = useState<number>(30);
  const [extendingLoading, setExtendingLoading] = useState<boolean>(false);

  const calculateExpiry = (
    createdAt: string,
    cycle: string,
    id: number | string,
    total: number,
    pkgName: string,
    pkgCode: string,
    pkgId?: number | string,
    notes?: string,
    linkedPanel?: any
  ): UserSubscriptionItem => {
    const start = new Date(createdAt);
    const c = (cycle || 'monthly').toLowerCase();
    const end = new Date(start);

    if (c === 'weekly' || c.includes('tuần') || c.includes('week') || c.includes('7')) {
      end.setDate(end.getDate() + 7);
    } else if (c === 'yearly' || c.includes('năm') || c.includes('year') || c.includes('365')) {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setDate(end.getDate() + 30);
    }

    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remHours = diffHours % 24;

    let status: 'active' | 'expiring_soon' | 'expired' = 'active';
    let label = '';

    if (diffMs <= 0) {
      status = 'expired';
      const pastDays = Math.abs(diffDays);
      label =
        pastDays === 0
          ? language === 'vi'
            ? 'Hết hạn hôm nay'
            : 'Expired today'
          : language === 'vi'
          ? `Hết hạn ${pastDays} ngày trước`
          : `Expired ${pastDays}d ago`;
    } else if (diffDays <= 3) {
      status = 'expiring_soon';
      label =
        diffDays === 0
          ? language === 'vi'
            ? `Còn ${diffHours}h (Hôm nay)`
            : `${diffHours}h left`
          : language === 'vi'
          ? `Còn ${diffDays} ngày ${remHours}h`
          : `${diffDays}d ${remHours}h left`;
    } else {
      status = 'active';
      label = language === 'vi' ? `Còn ${diffDays} ngày` : `${diffDays} days left`;
    }

    const isFree =
      pkgCode === 'free-trial' ||
      Number(total) === 0 ||
      (pkgName && (pkgName.includes('0 VNĐ') || pkgName.includes('0d') || pkgName.toLowerCase().includes('trial')));

    const finalTotal = isFree ? 0 : !Number.isNaN(Number(total)) ? Number(total) : 29.99;
    const finalPkgName = isFree
      ? language === 'vi'
        ? 'Trải nghiệm SMM Panel 0 VNĐ'
        : 'SMM Panel Free Trial (0 VNĐ)'
      : pkgName || 'SMM Package';

    return {
      id,
      orderId: id,
      packageId: pkgId,
      packageName: finalPkgName,
      packageCode: isFree ? 'free-trial' : pkgCode || 'professional',
      billingCycle: isFree ? 'weekly' : cycle || 'monthly',
      total: finalTotal,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      status,
      daysLeft: diffDays,
      hoursLeft: remHours,
      label,
      autoRenew: !isFree,
      notes,
      linkedPanel,
    };
  };

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      const headers: HeadersInit = {
        'X-App-Language': language,
        'Cache-Control': 'no-cache',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 1. Fetch Orders
      const [ordersRes, panelsRes] = await Promise.all([
        fetch(`/api/orders?_t=${Date.now()}`, { headers }),
        fetch(`/api/panels?_t=${Date.now()}`, { headers }),
      ]);

      const ordersData = await ordersRes.json();
      const panelsData = await panelsRes.json();
      const panelsList: any[] = panelsData?.data || [];

      if (ordersData?.data && Array.isArray(ordersData.data)) {
        const mapped = ordersData.data.map((ord: any) => {
          const isTrial =
            ord.metadata?.isFreeTrial === true ||
            ord.package?.code === 'free-trial' ||
            Number(ord.total) === 0 ||
            (ord.metadata?.planName && ord.metadata.planName.includes('0 VNĐ'));

          const name = isTrial
            ? language === 'vi'
              ? 'Trải nghiệm SMM Panel 0 VNĐ'
              : 'SMM Panel Free Trial (0 VNĐ)'
            : ord.metadata?.planName || ord.package?.name || ord.packageName || 'SMM Package';

          const code = isTrial ? 'free-trial' : ord.package?.code || ord.packageId || 'package';
          const cost = isTrial ? 0 : Number(ord.total);

          // Find linked panel
          const foundPanel = panelsList.find(
            (p) => String(p.orderId) === String(ord.id) || String(p.packageId) === String(ord.packageId)
          );

          return calculateExpiry(
            ord.createdAt || ord.created_at || new Date().toISOString(),
            ord.billingCycle || ord.billing_cycle || (isTrial ? 'weekly' : 'monthly'),
            ord.id,
            cost,
            name,
            code,
            ord.packageId || ord.package?.id,
            ord.metadata?.notes || ord.notes,
            foundPanel ? { id: foundPanel.id, name: foundPanel.name, domain: foundPanel.domain, status: foundPanel.status } : null
          );
        });
        setItems(mapped);
      }
    } catch (e) {
      console.error('Failed to load subscriptions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [language]);

  const handleToggleAutoRenew = (subId: number | string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === subId ? { ...it, autoRenew: !it.autoRenew } : it))
    );
    addToast('success', language === 'vi' ? 'Đã cập nhật trạng thái tự động gia hạn' : 'Auto-renew preference updated');
  };

  const handleConfirmExtend = async () => {
    if (!extendingItem) return;
    setExtendingLoading(true);

    try {
      // If linked to a panel, extend via panel API; otherwise extend order
      const panelId = extendingItem.linkedPanel?.id;
      const endpoint = panelId ? `/api/panels/${panelId}/extend` : `/api/orders/${extendingItem.orderId}/extend`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ days: selectedExtendDays }),
      });
      const resData = await res.json();

      if (resData.success) {
        addToast('success', resData.message || (language === 'vi' ? 'Gia hạn gói thành công!' : 'Package extended successfully!'));
        setExtendingItem(null);
        await loadSubscriptions();
        await refreshData();
      } else {
        addToast('error', resData.message || (language === 'vi' ? 'Gia hạn thất bại.' : 'Failed to extend package.'));
      }
    } catch (err: any) {
      addToast('error', language === 'vi' ? 'Lỗi kết nối khi gia hạn gói.' : 'Network error extending package.');
    } finally {
      setExtendingLoading(false);
    }
  };

  const filteredItems = items.filter((it) => {
    const q = search.toLowerCase();
    const matchSearch =
      String(it.id).includes(q) ||
      it.packageName.toLowerCase().includes(q) ||
      (it.linkedPanel?.name && it.linkedPanel.name.toLowerCase().includes(q)) ||
      (it.linkedPanel?.domain && it.linkedPanel.domain.toLowerCase().includes(q)) ||
      (it.notes && it.notes.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || it.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = items.filter((i) => i.status === 'active').length;
  const expiringCount = items.filter((i) => i.status === 'expiring_soon').length;
  const expiredCount = items.filter((i) => i.status === 'expired').length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 w-full min-w-0">
      {/* 1. Header & Summary Metrics */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{language === 'vi' ? 'Quản lý gói đang thuê' : 'Rented Packages'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                {items.length} {language === 'vi' ? 'gói' : 'plans'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'vi'
                ? 'Kiểm tra ngày bắt đầu thuê, thời gian hết hạn chính xác và gia hạn các gói dịch vụ của bạn.'
                : 'Monitor active package subscriptions, start dates, exact expiration countdowns, and renewal options.'}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setCurrentRoute('/packages')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'vi' ? 'Thuê thêm gói mới' : 'Rent New Package'}</span>
          </button>

          <button
            onClick={loadSubscriptions}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title={language === 'vi' ? 'Làm mới' : 'Refresh'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Status Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 tracking-tight">
              {language === 'vi' ? 'Đang hoạt động' : 'Active Subscriptions'}
            </div>
            <div className="text-xl font-black text-emerald-600 mt-0.5 font-mono">{activeCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{language === 'vi' ? 'Được bảo đảm 24/7' : 'Full access enabled'}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 tracking-tight">
              {language === 'vi' ? 'Sắp hết hạn (≤ 3 ngày)' : 'Expiring Soon'}
            </div>
            <div className="text-xl font-black text-amber-600 mt-0.5 font-mono">{expiringCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{language === 'vi' ? 'Cần gia hạn sớm' : 'Action needed'}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 tracking-tight">
              {language === 'vi' ? 'Đã hết hạn' : 'Expired'}
            </div>
            <div className="text-xl font-black text-rose-600 mt-0.5 font-mono">{expiredCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{language === 'vi' ? 'Bấm để kích hoạt lại' : 'Click to reactivate'}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar (Search & Filter & View Mode) */}
      <div className="bg-white border border-slate-200/90 p-3 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="w-full sm:w-auto flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm theo tên gói, mã đơn, domain...' : 'Search by package, order ID, domain...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="w-44 shrink-0">
            <Select2
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: language === 'vi' ? 'Tất cả trạng thái' : 'All Status' },
                { value: 'active', label: language === 'vi' ? 'Đang hoạt động' : 'Active' },
                { value: 'expiring_soon', label: language === 'vi' ? 'Sắp hết hạn' : 'Expiring Soon' },
                { value: 'expired', label: language === 'vi' ? 'Đã hết hạn' : 'Expired' },
              ]}
            />
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Bảng' : 'Table'}</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Thẻ' : 'Cards'}</span>
          </button>
        </div>
      </div>

      {/* 4. Subscriptions List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={language === 'vi' ? 'Không có gói thuê nào' : 'No active subscriptions'}
          description={language === 'vi' ? 'Bạn chưa thuê gói nào hoặc không có gói nào phù hợp bộ lọc.' : 'You do not have any matching package rentals.'}
          action={
            <button
              onClick={() => setCurrentRoute('/packages')}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700 cursor-pointer"
            >
              {language === 'vi' ? 'Xem bảng giá & thuê gói' : 'Browse Packages'}
            </button>
          }
        />
      ) : viewMode === 'table' ? (
        /* PREMIUM COMPACT TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden w-full min-w-0 max-w-full">
          <div className="overflow-x-auto w-full overscroll-x-contain touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold text-[11px] whitespace-nowrap">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">{language === 'vi' ? '#Mã đơn' : '#Order ID'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Gói dịch vụ đã thuê' : 'Rented Package'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Panel & domain kết nối' : 'Linked Panel / Domain'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Giá & chu kỳ' : 'Price & Cycle'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Thời gian thuê' : 'Rental Period'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Thời hạn còn lại' : 'Remaining Time'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
                {filteredItems.map((sub) => {
                  const isTrial = sub.packageCode === 'free-trial' || sub.total === 0;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/90 transition-colors">
                      {/* #ID */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 text-xs">
                          #{sub.id}
                        </span>
                      </td>

                      {/* Package Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border inline-flex items-center gap-1 ${
                              isTrial
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {isTrial ? <Sparkles className="w-3 h-3 text-purple-600" /> : <Package className="w-3 h-3" />}
                            <span>{sub.packageName}</span>
                          </span>
                        </div>
                      </td>

                      {/* Linked Panel / Domain */}
                      <td className="py-3 px-4">
                        {sub.linkedPanel ? (
                          <div className="flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-bold text-slate-800 text-xs">{sub.linkedPanel.name}</span>
                            <code className="font-mono text-blue-600 text-[11px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              {sub.linkedPanel.domain}
                            </code>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {language === 'vi' ? 'Chưa kết nối panel' : 'Unlinked'}
                          </span>
                        )}
                      </td>

                      {/* Price & Billing Cycle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-extrabold text-slate-900 text-xs">
                            {isTrial ? '0 VNĐ' : `$${Number(sub.total).toFixed(2)} USD`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            / {isTrial ? (language === 'vi' ? '7 ngày' : '7d') : sub.billingCycle}
                          </span>
                        </div>
                      </td>

                      {/* Rental Period (Start -> End) */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-600 font-mono">
                          <span>{new Date(sub.startDate).toLocaleDateString()}</span>
                          <span className="text-slate-400 mx-1">➔</span>
                          <span className="font-bold text-slate-900">{new Date(sub.endDate).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Expiration Countdown */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md text-[10px] inline-flex items-center gap-1 border ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sub.status === 'expiring_soon'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{sub.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setExtendingItem(sub)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title={language === 'vi' ? 'Gia hạn thời gian sử dụng' : 'Extend'}
                          >
                            <Zap className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{language === 'vi' ? 'Gia hạn' : 'Extend'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Toolbar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                {language === 'vi'
                  ? `Hiển thị ${filteredItems.length} trên tổng số ${items.length} gói đã thuê`
                  : `Showing ${filteredItems.length} of ${items.length} rented packages`}
              </span>
              <span className="sm:hidden text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md font-medium">
                {language === 'vi' ? '← Kéo ngang để xem tiếp →' : '← Swipe to see more →'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* COMPACT CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((sub) => {
            const isTrial = sub.packageCode === 'free-trial' || sub.total === 0;

            return (
              <div
                key={sub.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3.5 hover:border-blue-200 transition-all"
              >
                <div>
                  {/* Top Badge & Package Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border ${
                            isTrial
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {isTrial ? <Sparkles className="w-3.5 h-3.5 text-purple-600" /> : <Package className="w-3.5 h-3.5" />}
                          <span>{sub.packageName}</span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">#{sub.id}</span>
                      </div>

                      {sub.linkedPanel ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 pt-0.5">
                          <Server className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-bold">{sub.linkedPanel.name}:</span>
                          <code className="font-mono text-blue-600 text-[11px]">{sub.linkedPanel.domain}</code>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic pt-0.5">
                          {language === 'vi' ? 'Chưa gán cho panel nào' : 'No panel assigned'}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        {isTrial ? '0 VNĐ' : `$${Number(sub.total).toFixed(2)} USD`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">
                        / {isTrial ? (language === 'vi' ? '7 ngày' : '7 days') : sub.billingCycle}
                      </div>
                    </div>
                  </div>

                  {/* Expiration Details Box */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{language === 'vi' ? 'Bắt đầu thuê:' : 'Start Date:'}</span>
                      </span>
                      <span className="font-bold text-slate-800 font-mono text-xs">
                        {new Date(sub.startDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{language === 'vi' ? 'Hết hạn:' : 'Expiration:'}</span>
                      </span>
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        {new Date(sub.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-600 font-semibold text-[11px]">
                        {language === 'vi' ? 'Thời hạn còn lại:' : 'Remaining:'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border ${
                          sub.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sub.status === 'expiring_soon'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sub.status === 'active'
                              ? 'bg-emerald-500'
                              : sub.status === 'expiring_soon'
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span>{sub.label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => setExtendingItem(sub)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 text-xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'vi' ? 'Gia hạn ngay' : 'Extend Plan'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EXTEND MODAL - MATCHING /packages DATA */}
      {extendingItem && (() => {
        const matchingPkg =
          packages.find(
            (p) => String(p.id) === String(extendingItem.packageId) || p.id === extendingItem.packageCode
          ) ||
          packages.find((p) => p.name === extendingItem.packageName) ||
          packages[0];

        const weeklyPrice = Number(matchingPkg?.pricing?.weekly ?? Math.round(((matchingPkg?.pricing?.monthly ?? 29.99) / 4) * 100) / 100);
        const monthlyPrice = Number(matchingPkg?.pricing?.monthly ?? 29.99);
        const yearlyPrice = Number(matchingPkg?.pricing?.yearly ?? Math.round(((matchingPkg?.pricing?.monthly ?? 29.99) * 10) * 100) / 100);

        const cycleOptions = [
          {
            days: 7,
            title: language === 'vi' ? 'Gói theo tuần' : 'Weekly Plan',
            durationText: language === 'vi' ? '+7 ngày' : '+7 days',
            cost: weeklyPrice,
          },
          {
            days: 30,
            title: language === 'vi' ? 'Gói theo tháng' : 'Monthly Plan',
            durationText: language === 'vi' ? '+30 ngày' : '+30 days',
            cost: monthlyPrice,
            popular: true,
          },
          {
            days: 365,
            title: language === 'vi' ? 'Gói theo năm' : 'Yearly Plan',
            durationText: language === 'vi' ? '+365 ngày (1 năm)' : '+365 days (1 year)',
            cost: yearlyPrice,
            badge: language === 'vi' ? 'TIẾT KIỆM 20%' : 'BEST VALUE',
          },
        ];

        const activeCost =
          selectedExtendDays === 7 ? weeklyPrice : selectedExtendDays === 365 ? yearlyPrice : monthlyPrice;

        const currentExpiryTime = extendingItem.endDate ? new Date(extendingItem.endDate).getTime() : Date.now();
        const baseTime = currentExpiryTime > Date.now() ? currentExpiryTime : Date.now();
        const newExpiryDate = new Date(baseTime + selectedExtendDays * 24 * 60 * 60 * 1000);

        const userBalance = Number(user?.balance || 0);
        const hasEnoughBalance = userBalance >= activeCost;

        return (
          <Modal
            isOpen={true}
            onClose={() => setExtendingItem(null)}
            title={language === 'vi' ? `Gia hạn gói cước: ${extendingItem.packageName}` : `Extend subscription: ${extendingItem.packageName}`}
            size="md"
          >
            <div className="space-y-4 text-xs">
              {/* Package Summary Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">{language === 'vi' ? 'Gói dịch vụ:' : 'Package:'}</span>
                  <span className="font-bold text-blue-600 text-xs truncate block">{matchingPkg?.name || extendingItem.packageName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">{language === 'vi' ? 'Hạn hiện tại:' : 'Current expiry:'}</span>
                  <span className="font-bold text-slate-900 font-mono text-xs">{new Date(extendingItem.endDate).toLocaleDateString()}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 font-semibold block">{language === 'vi' ? 'Số dư ví:' : 'Your balance:'}</span>
                  <span className="font-extrabold text-emerald-600 font-mono text-xs">{formatMoney(userBalance)}</span>
                </div>
              </div>

              {/* Package features brief */}
              {matchingPkg?.features && matchingPkg.features.length > 0 && (
                <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                  {matchingPkg.features.slice(0, 3).map((feat, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Cycle selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {language === 'vi' ? 'Chọn gói thời gian gia hạn tương thích (Tuần / Tháng / Năm):' : 'Select renewal cycle (Weekly / Monthly / Yearly):'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {cycleOptions.map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setSelectedExtendDays(opt.days)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        selectedExtendDays === opt.days
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      {opt.popular && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-blue-600 text-white">
                          PHỔ BIẾN
                        </span>
                      )}
                      {opt.badge && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-emerald-600 text-white">
                          {opt.badge}
                        </span>
                      )}
                      <div>
                        <span className="block font-bold text-slate-900 text-xs">{opt.title}</span>
                        <span className="block text-[11px] text-slate-500 font-medium mt-0.5">{opt.durationText}</span>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <span className="text-xs font-extrabold text-blue-600 font-mono">${opt.cost.toFixed(2)} USD</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry preview & Balance check */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-slate-600 text-[11px] block">{language === 'vi' ? 'Thời hạn sau khi gia hạn:' : 'New expiry date:'}</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">{newExpiryDate.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-600 text-[11px] block">{language === 'vi' ? 'Tổng thanh toán:' : 'Total due:'}</span>
                  <span className="font-extrabold text-blue-700 font-mono text-xs">${activeCost.toFixed(2)} USD</span>
                </div>
              </div>

              {!hasEnoughBalance && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                  <span>
                    {language === 'vi'
                      ? `Số dư không đủ (Thiếu $${(activeCost - userBalance).toFixed(2)})`
                      : `Insufficient balance (Need +$${(activeCost - userBalance).toFixed(2)})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setExtendingItem(null);
                      setCurrentRoute('/wallet');
                    }}
                    className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                  >
                    {language === 'vi' ? 'Nạp tiền ngay' : 'Deposit'}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExtend}
                  disabled={extendingLoading || !hasEnoughBalance}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {extendingLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'vi' ? 'Xác nhận & Thanh toán' : 'Confirm & Pay'}</span>
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
