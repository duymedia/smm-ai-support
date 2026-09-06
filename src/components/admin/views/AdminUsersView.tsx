import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Wallet,
  ShieldCheck,
  Crown,
  Headphones,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
  Package,
  PlusCircle,
  MinusCircle,
  Lock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Select2 } from '../../ui/Select2';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { StatCard } from '../../ui/StatCard';
import { PageHeader } from '../../ui/PageHeader';

export interface AdminUserData {
  id: number | string;
  name: string;
  username: string;
  email: string;
  role: 'customer' | 'admin' | 'support' | 'super_admin';
  balance: number;
  phone?: string;
  status: 'active' | 'suspended' | 'banned';
  ordersCount?: number;
  panelsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export const AdminUsersView: React.FC = () => {
  const { language, formatMoney, addToast } = useApp();
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State for Add / Edit User
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserData | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'customer' as AdminUserData['role'],
    balance: 0,
    phone: '',
    status: 'active' as AdminUserData['status'],
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Modal State for Adjust Balance
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceUser, setBalanceUser] = useState<AdminUserData | null>(null);
  const [balanceData, setBalanceData] = useState({
    type: 'credit' as 'credit' | 'debit',
    amount: 50,
    reason: '',
  });
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  // Modal State for Delete Confirmation
  const [userToDelete, setUserToDelete] = useState<AdminUserData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
      addToast('error', language === 'vi' ? 'Không thể tải danh sách người dùng' : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'customer',
      balance: 0,
      phone: '',
      status: 'active',
    });
    setIsUserModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AdminUserData) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      username: user.username || '',
      email: user.email,
      password: '',
      role: user.role,
      balance: Number(user.balance) || 0,
      phone: user.phone || '',
      status: user.status || 'active',
    });
    setIsUserModalOpen(true);
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.email.trim()) {
      addToast('error', language === 'vi' ? 'Vui lòng điền đủ họ tên, username và email.' : 'Please fill all required fields.');
      return;
    }

    setIsSavingUser(true);
    try {
      const isEdit = !!editingUser;
      const url = isEdit ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (isEdit ? 'Đã cập nhật thành viên' : 'Đã tạo thành viên mới'));
        setIsUserModalOpen(false);
        loadUsers();
      } else {
        addToast('error', data.message || 'Lỗi lưu thông tin người dùng');
      }
    } catch {
      addToast('error', 'Lỗi kết nối máy chủ');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Open Balance Modal
  const handleOpenBalanceModal = (user: AdminUserData) => {
    setBalanceUser(user);
    setBalanceData({
      type: 'credit',
      amount: 50,
      reason: language === 'vi' ? 'Nạp ví khuyến mãi / hỗ trợ' : 'Bonus / Promotional credit',
    });
    setIsBalanceModalOpen(true);
  };

  // Save Balance Adjustment
  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceUser) return;
    if (!balanceData.amount || balanceData.amount <= 0) {
      addToast('error', language === 'vi' ? 'Số tiền phải lớn hơn 0' : 'Amount must be greater than 0');
      return;
    }

    setIsSavingBalance(true);
    try {
      const res = await fetch(`/api/admin/users/${balanceUser.id}/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(balanceData),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || 'Đã điều chỉnh số dư ví');
        setIsBalanceModalOpen(false);
        loadUsers();
      } else {
        addToast('error', data.message || 'Lỗi cập nhật số dư');
      }
    } catch {
      addToast('error', 'Lỗi kết nối');
    } finally {
      setIsSavingBalance(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || `Đã xóa tài khoản #${userToDelete.id}`);
        setUserToDelete(null);
        loadUsers();
      } else {
        addToast('error', data.message || 'Lỗi xóa tài khoản');
      }
    } catch {
      addToast('error', 'Không thể xóa tài khoản');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleUserStatus = async (targetUser: AdminUserData) => {
    const nextStatus = targetUser.status === 'active' || !targetUser.status ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          'success',
          language === 'vi'
            ? `Đã chuyển trạng thái sang ${nextStatus.toUpperCase()}`
            : `User status updated to ${nextStatus.toUpperCase()}`
        );
        setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u)));
      } else {
        addToast('error', data.message || 'Lỗi cập nhật trạng thái');
      }
    } catch {
      addToast('error', 'Lỗi kết nối máy chủ');
    }
  };

  // Filtered List
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      String(u.id).toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q));

    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalBalance = users.reduce((acc, u) => acc + (Number(u.balance) || 0), 0);
  const activeCount = users.filter((u) => u.status === 'active' || !u.status).length;
  const staffCount = users.filter((u) => u.role === 'admin' || u.role === 'super_admin' || u.role === 'support').length;

  const renderRoleBadge = (role: AdminUserData['role']) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge variant="amber">
            <Crown className="w-3 h-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="purple">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'support':
        return (
          <Badge variant="blue">
            <Headphones className="w-3 h-3 mr-1" />
            Support
          </Badge>
        );
      default:
        return (
          <Badge variant="slate">
            <User className="w-3 h-3 mr-1" />
            Customer
          </Badge>
        );
    }
  };

  const renderStatusBadge = (status?: AdminUserData['status']) => {
    switch (status) {
      case 'suspended':
        return (
          <Badge variant="warning">
            Suspended
          </Badge>
        );
      case 'banned':
        return (
          <Badge variant="danger">
            Banned
          </Badge>
        );
      default:
        return (
          <Badge variant="emerald" pulse>
            Active
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Open-Design Standards */}
      <PageHeader
        title={language === 'vi' ? 'Quản Lý Thành Viên & Phân Quyền' : 'Users & Access Control'}
        description={
          language === 'vi'
            ? 'Quản trị danh sách khách hàng, cấu hình vai trò RBAC, điều chỉnh hạn mức ví và giám sát hoạt động.'
            : 'Manage customer accounts, configure fine-grained RBAC roles, adjust balances, and oversee identity security.'
        }
        badge={
          <Badge variant="blue" pulse>
            {users.length} {language === 'vi' ? 'Thành viên' : 'Identities'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={loading}
              title={language === 'vi' ? 'Làm mới danh sách' : 'Refresh list'}
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
              <span>{language === 'vi' ? 'Thêm thành viên' : 'Add User'}</span>
            </Button>
          </div>
        }
      />

      {/* 2. KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === 'vi' ? 'Tổng thành viên' : 'Total Users'}
          value={users.length}
          subtitle={language === 'vi' ? 'Đã lưu trên hệ thống' : 'Registered identities'}
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />

        <StatCard
          title={language === 'vi' ? 'Tổng quỹ số dư ví' : 'Total Capital Balance'}
          value={formatMoney(totalBalance)}
          subtitle={language === 'vi' ? 'Quỹ ký gửi toàn hệ thống' : 'Custodial ledger sum'}
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
          highlight={true}
        />

        <StatCard
          title={language === 'vi' ? 'Đang hoạt động' : 'Active Accounts'}
          value={activeCount}
          subtitle={`${users.length > 0 ? Math.round((activeCount / users.length) * 100) : 100}% ${language === 'vi' ? 'tài khoản hợp lệ' : 'retention rate'}`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          trend={{
            value: `${users.length > 0 ? Math.round((activeCount / users.length) * 100) : 100}%`,
            positive: true,
            label: language === 'vi' ? 'Hợp lệ' : 'Active',
          }}
        />

        <StatCard
          title={language === 'vi' ? 'Quản trị viên & CSKH' : 'Staff & Admins'}
          value={staffCount}
          subtitle={language === 'vi' ? 'Được cấp quyền quản trị' : 'Elevated privileges'}
          icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.10)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm theo #ID, họ tên, username, email, điện thoại...' : 'Search by #ID, name, username, email, phone...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50/70 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="w-40">
            <Select2
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              options={[
                { value: 'all', label: language === 'vi' ? 'Tất cả vai trò' : 'All Roles' },
                { value: 'customer', label: 'Customer' },
                { value: 'support', label: 'Support' },
                { value: 'admin', label: 'Admin' },
                { value: 'super_admin', label: 'Super Admin' },
              ]}
              className="text-xs"
            />
          </div>

          <div className="w-40">
            <Select2
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'banned', label: 'Banned' },
              ]}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
            title={language === 'vi' ? 'Làm mới' : 'Refresh'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>{language === 'vi' ? 'Thêm người dùng' : 'New User'}</span>
          </Button>
        </div>
      </div>

      {/* 4. Structured Users Table inside Mac Window Chrome Card */}
      <Card
        macChrome={true}
        macTitle="DIRECTORY // IAM_REGISTRY"
        macBadge={
          <Badge variant="emerald" pulse>
            {activeCount} ACTIVE
          </Badge>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">{language === 'vi' ? '#ID' : '#ID'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Thành Viên' : 'User Profile'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Email & Liên Hệ' : 'Contact Info'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Vai trò' : 'Role'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Số dư ví' : 'Wallet Balance'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Đơn hàng' : 'Orders'}</th>
                <th className="py-3.5 px-4 text-center">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="py-3.5 px-4">{language === 'vi' ? 'Ngày tham gia' : 'Joined Date'}</th>
                <th className="py-3.5 px-4 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">
                      {language === 'vi' ? 'Không có thành viên nào phù hợp.' : 'No matching users found.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* #ID Column */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-200/60 text-xs inline-block tabular-nums">
                        #{u.id}
                      </span>
                    </td>

                    {/* Profile Column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">@{u.username || 'user'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info Column */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Role Column */}
                    <td className="py-3.5 px-4">
                      {renderRoleBadge(u.role)}
                    </td>

                    {/* Wallet Balance Column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-600 font-mono tabular-nums text-xs">
                          {formatMoney(u.balance)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenBalanceModal(u)}
                          className="p-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          title={language === 'vi' ? 'Cộng/Trừ tiền ví' : 'Adjust wallet balance'}
                        >
                          <Wallet className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Orders Count Column */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1 border border-slate-200 font-mono tabular-nums">
                        <Package className="w-3 h-3 text-slate-400" />
                        <span>{u.ordersCount || 0}</span>
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className="inline-flex items-center gap-1 cursor-pointer focus:outline-hidden"
                        title={language === 'vi' ? 'Bấm để Bật/Tắt tài khoản' : 'Click to toggle user status'}
                      >
                        {renderStatusBadge(u.status)}
                      </button>
                    </td>

                    {/* Joined Date Column */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-medium text-xs font-mono tabular-nums flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit User Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-full hover:bg-blue-50/80 text-blue-600 transition-colors cursor-pointer"
                          title={language === 'vi' ? 'Chỉnh sửa thông tin' : 'Edit User'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Adjust Balance Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenBalanceModal(u)}
                          className="p-1.5 rounded-full hover:bg-emerald-50/80 text-emerald-600 transition-colors cursor-pointer"
                          title={language === 'vi' ? 'Điều chỉnh số dư' : 'Adjust Balance'}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete User Button */}
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 rounded-full hover:bg-rose-50/80 text-rose-600 transition-colors cursor-pointer"
                          title={language === 'vi' ? 'Xóa tài khoản' : 'Delete User'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT USER */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isSavingUser && setIsUserModalOpen(false)}
          title={editingUser ? (language === 'vi' ? `Chỉnh Sửa: ${editingUser.name}` : `Edit User: ${editingUser.name}`) : (language === 'vi' ? 'Thêm Thành Viên Mới' : 'Create New User')}
        >
          <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Họ và Tên' : 'Full Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Tên Đăng Nhập (Username)' : 'Username'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="Ví dụ: alexsmm"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Địa Chỉ Email' : 'Email Address'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Số Điện Thoại' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="+84 988 888 888"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingUser
                    ? (language === 'vi' ? 'Mật Khẩu Mới (Bỏ trống nếu không đổi)' : 'New Password (leave empty to keep)')
                    : (language === 'vi' ? 'Mật Khẩu Đăng Nhập' : 'Password')}
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder={editingUser ? '••••••••' : 'Nhập mật khẩu...'}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Số Dư Ban Đầu (USD)' : 'Initial Balance (USD)'}
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    value={userForm.balance}
                    onChange={(e) => setUserForm({ ...userForm, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Vai Trò / Quyền Hạn' : 'User Role'}
                </label>
                <Select2
                  value={userForm.role}
                  onChange={(val) => setUserForm({ ...userForm, role: val as AdminUserData['role'] })}
                  options={[
                    { value: 'customer', label: 'Customer' },
                    { value: 'support', label: 'Support' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'super_admin', label: 'Super Admin' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Trạng Thái Hoạt Động' : 'Account Status'}
                </label>
                <Select2
                  value={userForm.status}
                  onChange={(val) => setUserForm({ ...userForm, status: val as AdminUserData['status'] })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'suspended', label: 'Suspended' },
                    { value: 'banned', label: 'Banned' },
                  ]}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={isSavingUser}
                onClick={() => setIsUserModalOpen(false)}
              >
                {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingUser}
                loading={isSavingUser}
              >
                {editingUser
                  ? (language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes')
                  : (language === 'vi' ? 'Tạo Thành Viên' : 'Create User')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADJUST BALANCE */}
      {/* ========================================================================= */}
      {isBalanceModalOpen && balanceUser && (
        <Modal
          isOpen={true}
          onClose={() => !isSavingBalance && setIsBalanceModalOpen(false)}
          title={language === 'vi' ? 'Điều Chỉnh Số Dư Ví' : 'Adjust Wallet Balance'}
        >
          <form onSubmit={handleSaveBalance} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBalanceData({ ...balanceData, type: 'credit' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold transition-all cursor-pointer ${
                  balanceData.type === 'credit'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>{language === 'vi' ? 'Cộng Tiền (+)' : 'Credit (+)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setBalanceData({ ...balanceData, type: 'debit' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold transition-all cursor-pointer ${
                  balanceData.type === 'debit'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MinusCircle className="w-4 h-4 text-rose-600" />
                <span>{language === 'vi' ? 'Trừ Tiền (-)' : 'Debit (-)'}</span>
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Số Tiền Điều Chỉnh (USD)' : 'Amount (USD)'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={balanceData.amount}
                  onChange={(e) => setBalanceData({ ...balanceData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Lý Do Điều Chỉnh (Ghi vào nhật ký)' : 'Reason / Note'}
              </label>
              <input
                type="text"
                value={balanceData.reason}
                onChange={(e) => setBalanceData({ ...balanceData, reason: e.target.value })}
                placeholder="Ví dụ: Hoàn tiền đơn lỗi / Thưởng nạp ví..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>{language === 'vi' ? 'Số dư hiện tại:' : 'Current Balance:'}</span>
                <span className="font-bold font-mono tabular-nums">{formatMoney(balanceUser.balance)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5">
                <span>{language === 'vi' ? 'Số dư sau điều chỉnh:' : 'New Balance:'}</span>
                <span className="font-extrabold font-mono tabular-nums text-emerald-600">
                  {formatMoney(
                    balanceData.type === 'credit'
                      ? Number(balanceUser.balance) + (Number(balanceData.amount) || 0)
                      : Math.max(0, Number(balanceUser.balance) - (Number(balanceData.amount) || 0))
                  )}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={isSavingBalance}
                onClick={() => setIsBalanceModalOpen(false)}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="success"
                disabled={isSavingBalance}
                loading={isSavingBalance}
              >
                {language === 'vi' ? 'Xác Nhận Điều Chỉnh' : 'Apply Adjustment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE USER */}
      {/* ========================================================================= */}
      {userToDelete && (
        <Modal
          isOpen={true}
          onClose={() => !isDeleting && setUserToDelete(null)}
          title={language === 'vi' ? 'Xác Nhận Xóa Tài Khoản' : 'Confirm User Deletion'}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'vi' ? `Bạn có chắc chắn muốn xóa thành viên #${userToDelete.id}?` : `Delete user account #${userToDelete.id}?`}
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  {language === 'vi'
                    ? `Tài khoản "${userToDelete.name}" (${userToDelete.email}) và toàn bộ dữ liệu liên quan sẽ bị xóa khỏi cơ sở dữ liệu.`
                    : `Account "${userToDelete.name}" (${userToDelete.email}) will be permanently deleted.`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Thành viên:' : 'Name:'}</span>
                <span className="font-bold text-slate-900">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Email:' : 'Email:'}</span>
                <span className="font-bold text-slate-900">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Vai trò:' : 'Role:'}</span>
                <span>{renderRoleBadge(userToDelete.role)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{language === 'vi' ? 'Số dư hiện tại:' : 'Balance:'}</span>
                <span className="font-extrabold text-emerald-600 font-mono tabular-nums">{formatMoney(userToDelete.balance)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
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
                {language === 'vi' ? 'Xóa Vĩnh Viễn' : 'Delete User'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
