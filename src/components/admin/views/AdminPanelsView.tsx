import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Server,
  Search,
  RefreshCw,
  Trash2,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Plus,
  Key,
  Shield,
  Activity,
  Edit2,
  Calendar,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Copy,
  Lock,
  Unlock,
  Layers,
  ArrowRight,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Select2 } from '../../ui/Select2';

export interface AdminPanelUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  balance?: number;
}

export interface AdminPanelItem {
  id: string;
  dbId?: number;
  userId: string;
  orderId?: number | string;
  packageId?: number | string;
  name: string;
  domain: string;
  apiKey?: string;
  planId: string;
  planName: string;
  status: 'active' | 'pending' | 'suspended' | 'maintenance' | 'expired';
  sslActive?: boolean;
  providerApiSynced?: boolean;
  healthScore?: number;
  activeServicesCount?: number;
  totalOrders?: number;
  monthlyRevenue?: number;
  balance?: number;
  currency: string;
  notes?: string;
  expiresAt: string;
  createdAt: string;
  user?: AdminPanelUser | null;
}

export const AdminPanelsView: React.FC = () => {
  const { language, formatMoney, addToast } = useApp();
  const [panels, setPanels] = useState<AdminPanelItem[]>([]);
  const [users, setUsers] = useState<AdminPanelUser[]>([]);
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Modals
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    userId: '1',
    name: '',
    domain: '',
    apiKey: `sk_live_pnl_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-6)}`,
    packageId: 'free-trial',
    balance: 0,
    currency: 'USD',
    durationDays: 7,
    status: 'active',
    notes: '',
  });
  const [isSubmittingProvision, setIsSubmittingProvision] = useState(false);

  // Edit Modal
  const [panelToEdit, setPanelToEdit] = useState<AdminPanelItem | null>(null);
  const [editForm, setEditForm] = useState({
    userId: '1',
    name: '',
    domain: '',
    apiKey: '',
    packageId: 'free-trial',
    balance: 0,
    currency: 'USD',
    status: 'active',
    expiresAt: '',
    notes: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Extend Modal
  const [panelToExtend, setPanelToExtend] = useState<AdminPanelItem | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [isExtending, setIsExtending] = useState(false);

  // Keys Modal
  const [panelKeysToView, setPanelKeysToView] = useState<AdminPanelItem | null>(null);

  // Delete Modal
  const [panelToDelete, setPanelToDelete] = useState<AdminPanelItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [panelsRes, usersRes, packagesRes] = await Promise.all([
        fetch('/api/admin/panels?_t=' + Date.now(), {
          headers: { 'Cache-Control': 'no-cache', 'X-App-Language': language },
        }),
        fetch('/api/admin/users?_t=' + Date.now(), {
          headers: { 'Cache-Control': 'no-cache', 'X-App-Language': language },
        }),
        fetch('/api/packages?_t=' + Date.now(), {
          headers: { 'Cache-Control': 'no-cache', 'X-App-Language': language },
        }),
      ]);

      const panelsData = await panelsRes.json();
      if (panelsData.success && Array.isArray(panelsData.data)) {
        setPanels(panelsData.data);
      }

      const usersData = await usersRes.json();
      if (usersData.success && Array.isArray(usersData.data)) {
        setUsers(usersData.data);
        if (usersData.data.length > 0 && provisionForm.userId === '1') {
          setProvisionForm((prev) => ({ ...prev, userId: String(usersData.data[0].id) }));
        }
      }

      const packagesData = await packagesRes.json();
      if (packagesData.success && Array.isArray(packagesData.data)) {
        setPackagesList(packagesData.data);
      }
    } catch (e) {
      console.error('Load admin panels error:', e);
      addToast('error', language === 'vi' ? 'Không thể tải danh sách Panels' : 'Failed to load panels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [language]);

  const handleToggleStatus = async (panel: AdminPanelItem) => {
    const nextStatus = panel.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/panels/${panel.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? `Đã chuyển trạng thái sang ${nextStatus.toUpperCase()}` : `Status changed to ${nextStatus}`));
        setPanels((prev) =>
          prev.map((p) => (p.id === panel.id ? { ...p, status: nextStatus } : p))
        );
      }
    } catch {
      addToast('error', 'Failed to toggle status');
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProvision(true);
    try {
      const res = await fetch('/api/admin/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify(provisionForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Tạo Panel thành công!' : 'Panel provisioned successfully!'));
        setIsProvisionModalOpen(false);
        setProvisionForm({
          userId: users.length > 0 ? String(users[0].id) : '1',
          name: '',
          domain: '',
          apiKey: `sk_live_pnl_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-6)}`,
          packageId: 'free-trial',
          balance: 0,
          currency: 'USD',
          durationDays: 30,
          status: 'active',
          notes: '',
        });
        loadData();
      } else {
        addToast('error', data.message || 'Provisioning failed');
      }
    } catch {
      addToast('error', 'Failed to provision panel');
    } finally {
      setIsSubmittingProvision(false);
    }
  };

  const handleOpenEdit = (p: AdminPanelItem) => {
    setPanelToEdit(p);
    setEditForm({
      userId: String(p.userId || '1'),
      name: p.name,
      domain: p.domain,
      apiKey: p.apiKey || '',
      packageId: p.planId || 'free-trial',
      balance: Number(p.balance) || 0,
      currency: p.currency || 'USD',
      status: p.status,
      expiresAt: p.expiresAt ? p.expiresAt.split('T')[0] : '',
      notes: p.notes || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelToEdit) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/panels/${panelToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Đã lưu thay đổi Panel!' : 'Panel updated successfully!'));
        setPanelToEdit(null);
        loadData();
      } else {
        addToast('error', data.message || 'Update failed');
      }
    } catch {
      addToast('error', 'Failed to update panel');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelToExtend) return;
    setIsExtending(true);
    try {
      const res = await fetch(`/api/admin/panels/${panelToExtend.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ days: extendDays }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? `Đã gia hạn thêm ${extendDays} ngày!` : `Extended by ${extendDays} days!`));
        setPanelToExtend(null);
        loadData();
      }
    } catch {
      addToast('error', 'Failed to extend panel');
    } finally {
      setIsExtending(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!panelToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/panels/${panelToDelete.id}`, {
        method: 'DELETE',
        headers: { 'X-App-Language': language },
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Đã xóa Panel vĩnh viễn' : 'Panel deleted'));
        setPanelToDelete(null);
        setPanels((prev) => prev.filter((p) => p.id !== panelToDelete.id));
      }
    } catch {
      addToast('error', 'Failed to delete panel');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPanels = panels.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.domain.toLowerCase().includes(q) ||
      (p.user?.name && p.user.name.toLowerCase().includes(q)) ||
      (p.user?.email && p.user.email.toLowerCase().includes(q)) ||
      (p.user?.username && p.user.username.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchPlan =
      planFilter === 'all' ||
      (planFilter === 'free-trial' && (p.planId === 'free-trial' || p.planName?.includes('0 VNĐ') || p.planName?.toLowerCase().includes('trial'))) ||
      p.planId === planFilter;

    return matchSearch && matchStatus && matchPlan;
  });

  const totalActive = panels.filter((p) => p.status === 'active').length;
  const totalSuspended = panels.filter((p) => p.status === 'suspended').length;
  const totalFreeTrial = panels.filter((p) => p.planId === 'free-trial' || p.planName?.includes('0 VNĐ')).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'vi' ? 'Tổng số panel' : 'Total SMM panels'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{panels.length}</p>
          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            {language === 'vi' ? 'Đã lưu MySQL database' : 'Synced with MySQL DB'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'vi' ? 'Đang hoạt động' : 'Active online'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{totalActive}</p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {panels.length > 0 ? Math.round((totalActive / panels.length) * 100) : 100}% {language === 'vi' ? 'tỷ lệ hoạt động' : 'operational SLA'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'vi' ? 'Gói 0đ trải nghiệm' : 'Free 0 VNĐ trials'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700">{totalFreeTrial}</p>
          <span className="text-[10px] text-purple-600 font-medium flex items-center gap-1">
            {language === 'vi' ? '7 ngày trải nghiệm' : '7-Day full access'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'vi' ? 'Tạm khóa' : 'Suspended panels'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600">{totalSuspended}</p>
          <span className="text-[10px] text-rose-600 font-medium">
            {totalSuspended > 0 ? (language === 'vi' ? 'Cần kiểm tra gia hạn' : 'Pending renewal') : (language === 'vi' ? 'Hệ thống an toàn' : 'All clear')}
          </span>
        </div>
      </div>

      {/* 2. Search, Filters & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm theo tên panel, domain, khách hàng...' : 'Search panel, domain, user...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select2
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: language === 'vi' ? 'Tất cả trạng thái' : 'All Status' },
                { value: 'active', label: language === 'vi' ? '🟢 Hoạt động' : '🟢 Active' },
                { value: 'suspended', label: language === 'vi' ? '🔴 Tạm ngưng' : '🔴 Suspended' },
                { value: 'expired', label: language === 'vi' ? '⚠️ Hết hạn' : '⚠️ Expired' },
              ]}
              className="text-xs"
            />
          </div>

          {/* Plan Filter */}
          <div className="w-44">
            <Select2
              value={planFilter}
              onChange={setPlanFilter}
              options={[
                { value: 'all', label: language === 'vi' ? 'Tất cả gói cước' : 'All Plans' },
                { value: 'free-trial', label: language === 'vi' ? '🎁 Gói trải nghiệm 0đ' : '🎁 Free Trial 0 VNĐ' },
                { value: 'starter', label: 'Starter Plan' },
                { value: 'professional', label: 'Professional Plan' },
                { value: 'enterprise', label: 'Enterprise Plan' },
              ]}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
            title={language === 'vi' ? 'Làm mới dữ liệu' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsProvisionModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'vi' ? 'Tạo panel cấp tốc' : 'Direct provision'}</span>
          </button>
        </div>
      </div>

      {/* 3. Panels Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold text-[11px] whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center">#ID</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Khách hàng' : 'Customer'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Tên panel' : 'Panel name'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Tên miền' : 'Domain'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Gói cước' : 'Rental plan'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Số dư ví panel' : 'Panel balance'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Hạn sử dụng' : 'Expires at'}</th>
                <th className="py-3.5 px-4 text-center">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="py-3.5 px-4 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {loading && panels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <p>{language === 'vi' ? 'Đang tải danh sách Panels từ MySQL...' : 'Loading panels from database...'}</p>
                  </td>
                </tr>
              ) : filteredPanels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Server className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">
                      {language === 'vi' ? 'Không tìm thấy Panel nào phù hợp' : 'No panels found matching filter'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPanels.map((p) => {
                  const isTrial = p.planId === 'free-trial' || p.planName?.includes('0 VNĐ');
                  const exp = new Date(p.expiresAt);
                  const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = daysLeft <= 3 && daysLeft >= 0;
                  const isExpired = daysLeft < 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* #ID Column */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 text-xs inline-block">
                          #{p.dbId || p.id}
                        </span>
                      </td>

                      {/* Khách hàng (Customer Column - Compatible with AdminOrdersView) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {p.user?.name ? p.user.name.slice(0, 2).toUpperCase() : p.user?.username ? p.user.username.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{p.user?.name || p.user?.username || `User #${p.userId}`}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{p.user?.email || `ID: #${p.userId}`}</div>
                          </div>
                        </div>
                      </td>

                      {/* Tên panel */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isTrial && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200">
                              0 VNĐ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tên miền (Domain) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-blue-600 font-bold text-xs bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            {p.domain}
                          </code>
                          <a
                            href={`https://${p.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title={language === 'vi' ? 'Mở trang web' : 'Open website'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Gói cước */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-block ${
                            isTrial
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {p.planName}
                        </span>
                      </td>

                      {/* Số dư ví panel */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-emerald-600 font-mono text-xs">
                          {formatMoney(Number(p.balance) || 0)}
                        </span>
                      </td>

                      {/* Hạn sử dụng */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-xs font-bold">{exp.toLocaleDateString()}</span>
                        </div>
                        <div
                          className={`text-[10px] font-bold mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                            isExpired
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isExpiringSoon
                              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {isExpired
                              ? (language === 'vi' ? 'Đã hết hạn' : 'Expired')
                              : daysLeft === 0
                              ? (language === 'vi' ? 'Hôm nay' : 'Today')
                              : (language === 'vi' ? `Còn ${daysLeft} ngày` : `${daysLeft}d left`)}
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className="inline-flex items-center gap-1 cursor-pointer focus:outline-hidden"
                          title={language === 'vi' ? 'Bấm để bật/tắt trạng thái' : 'Click to toggle status'}
                        >
                          {p.status === 'active' ? (
                            <div className="flex items-center gap-1 text-emerald-600 font-bold">
                              <ToggleRight className="w-6 h-6 text-emerald-600" />
                              <span className="text-[10px]">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400 font-bold">
                              <ToggleLeft className="w-6 h-6 text-slate-300" />
                              <span className="text-[10px]">Off</span>
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* API Key Viewer */}
                          <button
                            onClick={() => setPanelKeysToView(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Xem API Key' : 'View API Key'}
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Extend Duration */}
                          <button
                            onClick={() => {
                              setPanelToExtend(p);
                              setExtendDays(30);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Gia hạn thời gian' : 'Extend Duration'}
                          >
                            <Clock className="w-4 h-4" />
                          </button>

                          {/* Edit Modal */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Chỉnh sửa cấu hình' : 'Edit Configuration'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Open Panel Link */}
                          <a
                            href={`https://${p.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Mở trang web Panel' : 'Open Panel Website'}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Delete Modal */}
                          <button
                            onClick={() => setPanelToDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Xóa Panel' : 'Delete Panel'}
                          >
                            <Trash2 className="w-4 h-4" />
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
      {/* MODAL 1: TẠO PANEL CẤP TỐC (DIRECT PROVISION MODAL) */}
      {/* ========================================================================= */}
      {isProvisionModalOpen && (
        <Modal
          isOpen={isProvisionModalOpen}
          onClose={() => setIsProvisionModalOpen(false)}
          title={language === 'vi' ? 'Tạo và cấp phát SMM panel cho người dùng' : 'Provision SMM panel for user'}
        >
          <form onSubmit={handleProvisionSubmit} className="space-y-3.5 text-xs">
            {/* 1. Chọn Người Dùng */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Chọn thành viên *' : 'Select user *'}
              </label>
              <Select2
                value={provisionForm.userId}
                onChange={(val) => setProvisionForm({ ...provisionForm, userId: val })}
                options={(users || []).map((u) => ({
                  value: String(u.id),
                  label: `${u.name || 'User'} (@${u.username || 'user'}) - Ví: ${formatMoney(u.balance || 0)} [${(u.role || 'user').toUpperCase()}]`,
                }))}
              />
            </div>

            {/* 2. Chọn Gói Dịch Vụ & Tính Giá Tiền Thích Ứng (Tuần, Tháng, Năm, 7 Ngày Free) */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Chọn gói dịch vụ *' : 'Select package *'}
              </label>
              <Select2
                value={provisionForm.packageId}
                onChange={(val) => {
                  let days = 30;
                  if (val === 'free-trial') {
                    days = 7;
                  } else {
                    const found = (packagesList || []).find((p) => String(p.id) === String(val) || p.code === String(val));
                    days = found?.durationDays || (found?.code === 'free-trial' ? 7 : 30);
                  }
                  setProvisionForm((prev) => ({ ...prev, packageId: val, durationDays: days }));
                }}
                options={[
                  { value: 'free-trial', label: '🎁 Trải nghiệm hệ thống SMM panel riêng biệt 0 VNĐ (7 ngày)' },
                  ...(packagesList || []).map((pkg) => {
                    const monthlyStr = Number(pkg.monthlyPrice || pkg.pricing?.monthly || 0) === 0 ? '0 VNĐ' : `$${Number(pkg.monthlyPrice || pkg.pricing?.monthly || 0)}/tháng`;
                    const weeklyStr = pkg.weeklyPrice || pkg.pricing?.weekly ? `$${Number(pkg.weeklyPrice || pkg.pricing?.weekly)}/tuần` : '';
                    return {
                      value: String(pkg.id || pkg.code),
                      label: `${pkg.name} — ${monthlyStr} ${weeklyStr ? `(${weeklyStr})` : ''}`,
                    };
                  }),
                ]}
              />

              {/* Chu Kỳ & Tính Giá Tiền Tương Thích */}
              {(() => {
                const isTrial = provisionForm.packageId === 'free-trial';
                const pkg = (packagesList || []).find((p) => String(p.id) === String(provisionForm.packageId) || p.code === String(provisionForm.packageId));
                
                const monthlyPrice = Number(pkg?.monthlyPrice || pkg?.pricing?.monthly || 29.99);
                const weeklyPrice = Number(pkg?.weeklyPrice || pkg?.pricing?.weekly || (monthlyPrice > 0 ? Math.round((monthlyPrice / 4) * 100) / 100 : 9.99));
                const yearlyPrice = Number(pkg?.yearlyPrice || pkg?.pricing?.yearly || (monthlyPrice * 10));

                let calcPrice = 0;
                let activeCycleName = 'Tùy chỉnh';
                if (isTrial) {
                  calcPrice = 0;
                  activeCycleName = 'Dùng thử (7 ngày)';
                } else if (provisionForm.durationDays === 7) {
                  calcPrice = weeklyPrice;
                  activeCycleName = 'Theo tuần (7 ngày)';
                } else if (provisionForm.durationDays === 30) {
                  calcPrice = monthlyPrice;
                  activeCycleName = 'Theo tháng (30 ngày)';
                } else if (provisionForm.durationDays === 365) {
                  calcPrice = yearlyPrice;
                  activeCycleName = 'Theo năm (365 ngày)';
                } else {
                  calcPrice = Math.round((monthlyPrice / 30 * provisionForm.durationDays) * 100) / 100;
                  activeCycleName = `${provisionForm.durationDays} ngày`;
                }

                const expDateStr = new Date(Date.now() + (Number(provisionForm.durationDays) || 30) * 24 * 60 * 60 * 1000).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');

                return (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    {/* Header thông tin giá cước tương thích */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{language === 'vi' ? 'Chu kỳ & giá cước:' : 'Billing cycle & rate:'}</span>
                        <span className="text-[11px] font-semibold text-slate-500 font-mono">({activeCycleName})</span>
                      </div>
                      <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg text-xs">
                        {isTrial ? '0 VNĐ (Miễn phí)' : `${formatMoney(calcPrice)}`}
                      </span>
                    </div>

                    {/* Bộ Chọn Chu Kỳ Theo Tuần, Tháng, Năm hoặc Gói Free */}
                    {isTrial ? (
                      <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-semibold flex items-center justify-between">
                        <span>🎁 Gói dùng thử trải nghiệm hệ thống (Cố định 7 ngày)</span>
                        <span className="font-bold text-purple-900">7 ngày (0đ)</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setProvisionForm({ ...provisionForm, durationDays: 7 })}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                            provisionForm.durationDays === 7
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-[10px] font-bold opacity-80">{language === 'vi' ? 'Theo tuần' : 'Weekly'}</span>
                          <span className="block text-xs font-black mt-0.5">{formatMoney(weeklyPrice)}</span>
                          <span className="block text-[9px] opacity-75">7 ngày</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProvisionForm({ ...provisionForm, durationDays: 30 })}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer relative ${
                            provisionForm.durationDays === 30
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-[10px] font-bold opacity-80">{language === 'vi' ? 'Theo tháng' : 'Monthly'}</span>
                          <span className="block text-xs font-black mt-0.5">{formatMoney(monthlyPrice)}</span>
                          <span className="block text-[9px] opacity-75">30 ngày</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProvisionForm({ ...provisionForm, durationDays: 365 })}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                            provisionForm.durationDays === 365
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-[10px] font-bold opacity-80">{language === 'vi' ? 'Theo năm' : 'Yearly'}</span>
                          <span className="block text-xs font-black mt-0.5">{formatMoney(yearlyPrice)}</span>
                          <span className="block text-[9px] text-emerald-500 font-bold">{language === 'vi' ? 'Tiết kiệm' : 'Best'}</span>
                        </button>
                      </div>
                    )}

                    {/* Tùy chỉnh số ngày & Ngày hết hạn */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500">{language === 'vi' ? 'Số ngày cấp:' : 'Days:'}</span>
                        <input
                          type="number"
                          min="1"
                          required
                          disabled={isTrial}
                          value={provisionForm.durationDays}
                          onChange={(e) => setProvisionForm({ ...provisionForm, durationDays: Number(e.target.value) || 1 })}
                          className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-center focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <span className="text-[10px] text-slate-400">{language === 'vi' ? 'ngày' : 'days'}</span>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-700 font-mono">
                        {language === 'vi' ? 'Hạn hết hạn: ' : 'Exp: '}{expDateStr}
                      </span>
                    </div>

                    {/* Cảnh báo số dư ví không đủ */}
                    {(() => {
                      const selectedUser = (users || []).find((u) => String(u.id) === String(provisionForm.userId));
                      const uBalance = Number(selectedUser?.balance || 0);
                      const isShort = !isTrial && calcPrice > 0 && uBalance < calcPrice;
                      const missing = Math.round((calcPrice - uBalance) * 100) / 100;

                      if (!isShort) return null;

                      return (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              {language === 'vi'
                                ? `Ví user ($${uBalance.toFixed(2)}) không đủ thanh toán gói ($${calcPrice.toFixed(2)})`
                                : `User wallet ($${uBalance.toFixed(2)}) is insufficient for ($${calcPrice.toFixed(2)})`}
                            </span>
                          </div>
                          <span className="font-bold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200 text-[11px] shrink-0">
                            {language === 'vi' ? `Thiếu $${missing.toFixed(2)}` : `-$${missing.toFixed(2)}`}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>

            {/* 3. Tên Hiển Thị Panel */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tên hiển thị panel *' : 'Panel display name *'}
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: ApexSMM Pro Hub"
                value={provisionForm.name}
                onChange={(e) => setProvisionForm({ ...provisionForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>

            {/* 4. Tên Miền */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tên miền (domain) *' : 'Domain *'}
              </label>
              <input
                type="text"
                required
                placeholder="my-panel.nexussmm.store"
                value={provisionForm.domain}
                onChange={(e) => setProvisionForm({ ...provisionForm, domain: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono text-xs bg-white"
              />
            </div>

            {/* 5. API Key & Số Dư Ban Đầu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">API Key</label>
                  <button
                    type="button"
                    onClick={() =>
                      setProvisionForm({
                        ...provisionForm,
                        apiKey: `sk_live_pnl_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-6)}`,
                      })
                    }
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    {language === 'vi' ? 'Tạo mới' : 'Generate'}
                  </button>
                </div>
                <input
                  type="text"
                  value={provisionForm.apiKey}
                  onChange={(e) => setProvisionForm({ ...provisionForm, apiKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Số dư ví panel ($ USD)' : 'Panel balance ($ USD)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={provisionForm.balance}
                  onChange={(e) => setProvisionForm({ ...provisionForm, balance: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white font-mono"
                />
              </div>
            </div>

            {/* 6. Trạng Thái */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Trạng thái' : 'Status'}
              </label>
              <Select2
                value={provisionForm.status}
                onChange={(val) => setProvisionForm({ ...provisionForm, status: val })}
                options={[
                  { value: 'active', label: '🟢 Hoạt động' },
                  { value: 'suspended', label: '🔴 Tạm ngưng' },
                ]}
              />
            </div>

            {/* 7. Ghi Chú */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Ghi chú quản trị' : 'Admin notes'}
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú quản lý panel..."
                value={provisionForm.notes}
                onChange={(e) => setProvisionForm({ ...provisionForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmittingProvision}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isSubmittingProvision && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'vi' ? 'Khởi tạo & cấp phát ngay' : 'Provision panel'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHỈNH SỬA CẤU HÌNH PANEL */}
      {/* ========================================================================= */}
      {panelToEdit && (
        <Modal
          isOpen={Boolean(panelToEdit)}
          onClose={() => setPanelToEdit(null)}
          title={language === 'vi' ? `Chỉnh sửa panel: ${panelToEdit.name}` : `Edit panel: ${panelToEdit.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
            {/* 1. Chọn Người Dùng */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Chủ sở hữu *' : 'Assigned user *'}
              </label>
              <Select2
                value={editForm.userId}
                onChange={(val) => setEditForm({ ...editForm, userId: val })}
                options={(users || []).map((u) => ({
                  value: String(u.id),
                  label: `${u.name || 'User'} (@${u.username || 'user'}) - ${u.email || ''} [${(u.role || 'user').toUpperCase()}]`,
                }))}
              />
            </div>

            {/* 2. Chọn Gói Cước */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Gói dịch vụ của panel *' : 'Assigned package *'}
              </label>
              <Select2
                value={editForm.packageId}
                onChange={(val) => setEditForm({ ...editForm, packageId: val })}
                options={[
                  { value: 'free-trial', label: '🎁 Trải nghiệm hệ thống SMM panel riêng biệt 0 VNĐ (7 ngày)' },
                  ...(packagesList || []).map((pkg) => {
                    const priceStr = Number(pkg.monthlyPrice || pkg.pricing?.monthly || 0) === 0 ? '0 VNĐ' : `$${Number(pkg.monthlyPrice || pkg.pricing?.monthly || 0)}/tháng`;
                    const days = pkg.durationDays || (pkg.code === 'free-trial' ? 7 : 30);
                    return {
                      value: String(pkg.id || pkg.code),
                      label: `${pkg.name} - ${priceStr} (${days} ngày)`,
                    };
                  }),
                ]}
              />
            </div>

            {/* 3. Tên Panel */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tên hiển thị panel *' : 'Panel name *'}
              </label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>

            {/* 4. Domain */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tên miền (domain)' : 'Domain'}
              </label>
              <input
                type="text"
                value={editForm.domain}
                onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono bg-white"
              />
            </div>

            {/* 5. API Key & Số Dư */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">API Key</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        apiKey: `sk_live_pnl_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-6)}`,
                      })
                    }
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    {language === 'vi' ? 'Tạo mới' : 'Generate'}
                  </button>
                </div>
                <input
                  type="text"
                  value={editForm.apiKey}
                  onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Số dư ví panel ($ USD)' : 'Panel balance ($ USD)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.balance}
                  onChange={(e) => setEditForm({ ...editForm, balance: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white font-mono"
                />
              </div>
            </div>

            {/* 6. Trạng Thái & Ngày Hết Hạn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </label>
                <Select2
                  value={editForm.status}
                  onChange={(val) => setEditForm({ ...editForm, status: val })}
                  options={[
                    { value: 'active', label: '🟢 Hoạt động' },
                    { value: 'suspended', label: '🔴 Tạm ngưng' },
                    { value: 'expired', label: '⚠️ Hết hạn' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Ngày hết hạn' : 'Expires at'}
                </label>
                <input
                  type="date"
                  value={editForm.expiresAt}
                  onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white text-xs"
                />
              </div>
            </div>

            {/* 7. Ghi Chú */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Ghi chú quản trị' : 'Admin notes'}
              </label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPanelToEdit(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isSavingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'vi' ? 'Lưu thay đổi' : 'Save changes'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GIA HẠN THỜI GIAN PANEL */}
      {/* ========================================================================= */}
      {panelToExtend && (
        <Modal
          isOpen={Boolean(panelToExtend)}
          onClose={() => setPanelToExtend(null)}
          title={language === 'vi' ? `Gia hạn panel: ${panelToExtend.name}` : `Extend panel: ${panelToExtend.name}`}
        >
          <form onSubmit={handleConfirmExtend} className="space-y-4 text-xs">
            <p className="text-slate-600">
              {language === 'vi'
                ? `Hạn hiện tại: ${new Date(panelToExtend.expiresAt).toLocaleDateString()}. Chọn số ngày gia hạn thêm cho panel này:`
                : `Current expiry: ${new Date(panelToExtend.expiresAt).toLocaleDateString()}. Select extension duration:`}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { days: 7, label: language === 'vi' ? '+7 ngày' : '+7 Days' },
                { days: 30, label: language === 'vi' ? '+30 ngày' : '+30 Days' },
                { days: 90, label: language === 'vi' ? '+90 ngày' : '+90 Days' },
                { days: 180, label: language === 'vi' ? '+6 tháng' : '+6 Months' },
                { days: 365, label: language === 'vi' ? '+1 năm' : '+1 Year' },
                { days: 730, label: language === 'vi' ? '+2 năm' : '+2 Years' },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setExtendDays(opt.days)}
                  className={`p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    extendDays === opt.days
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPanelToExtend(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isExtending}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isExtending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'vi' ? `Xác nhận gia hạn (+${extendDays} ngày)` : `Confirm (+${extendDays} days)`}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: XEM & SAO CHÉP API KEY */}
      {/* ========================================================================= */}
      {panelKeysToView && (
        <Modal
          isOpen={Boolean(panelKeysToView)}
          onClose={() => setPanelKeysToView(null)}
          title={language === 'vi' ? `Khóa bảo mật panel: ${panelKeysToView.name}` : `API Key: ${panelKeysToView.name}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Live API Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={panelKeysToView.apiKey || 'sk_live_pnl_demo'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(panelKeysToView.apiKey || '');
                    addToast('success', language === 'vi' ? 'Đã sao chép API Key' : 'API Key copied');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shrink-0 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {language === 'vi'
                  ? 'Bảo mật khóa này cẩn thận. Bất kỳ ai có API Key này đều có thể tạo đơn và tương tác với Panel.'
                  : 'Keep this key secure. Anyone with this API Key can interact and place orders on this panel.'}
              </span>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPanelKeysToView(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: XÁC NHẬN XÓA PANEL VĨNH VIỄN */}
      {/* ========================================================================= */}
      {panelToDelete && (
        <Modal
          isOpen={Boolean(panelToDelete)}
          onClose={() => setPanelToDelete(null)}
          title={language === 'vi' ? 'Xác nhận xóa panel' : 'Confirm delete panel'}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900">
                  {language === 'vi' ? 'Hành động này không thể hoàn tác!' : 'This action is irreversible!'}
                </p>
                <p className="mt-1">
                  {language === 'vi'
                    ? `Bạn có chắc chắn muốn xóa vĩnh viễn Panel "${panelToDelete.name}" (${panelToDelete.domain}) khỏi cơ sở dữ liệu MySQL?`
                    : `Are you sure you want to permanently delete "${panelToDelete.name}" (${panelToDelete.domain}) from MySQL database?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPanelToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete permanently'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

