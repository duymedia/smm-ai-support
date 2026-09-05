import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  Laptop,
  Smartphone,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Calendar,
} from 'lucide-react';
import { Select2 } from '../../ui/Select2';

export interface AdminLoginSessionItem {
  id: number;
  userId: number;
  user?: {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    balance?: string | number;
  } | null;
  ipAddress: string;
  location: string;
  userAgent: string;
  device: string;
  deviceType: 'desktop' | 'mobile';
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  revokedAt?: string | null;
}

export const AdminLogsView: React.FC = () => {
  const { language, addToast } = useApp();
  const [sessions, setSessions] = useState<AdminLoginSessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login-sessions?_t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache', 'X-App-Language': language },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSessions(data.data);
      }
    } catch (e) {
      console.error('Failed to load login sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [language]);

  const handleRevokeSession = async (sessionId: number) => {
    if (!confirm(language === 'vi' ? 'Bạn có chắc chắn muốn thu hồi phiên đăng nhập này và đăng xuất tài khoản?' : 'Revoke this login session and force logout?')) {
      return;
    }

    setRevokingId(sessionId);
    try {
      const res = await fetch(`/api/admin/login-sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || (language === 'vi' ? 'Đã thu hồi phiên thành công!' : 'Session revoked!'));
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: 'revoked', revokedAt: new Date().toISOString() } : s))
        );
      } else {
        addToast('error', data.message || 'Failed to revoke session');
      }
    } catch {
      addToast('error', 'Network error');
    } finally {
      setRevokingId(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      String(s.id).includes(q) ||
      s.ipAddress.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.device.toLowerCase().includes(q) ||
      (s.user?.name && s.user.name.toLowerCase().includes(q)) ||
      (s.user?.email && s.user.email.toLowerCase().includes(q)) ||
      (s.user?.username && s.user.username.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchDevice = deviceFilter === 'all' || s.deviceType === deviceFilter;

    return matchSearch && matchStatus && matchDevice;
  });

  const totalActive = sessions.filter((s) => s.status === 'active').length;
  const totalRevoked = sessions.filter((s) => s.status === 'revoked').length;
  const totalExpired = sessions.filter((s) => s.status === 'expired').length;

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_login_sessions_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 w-full min-w-0">
      {/* 1. Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-tight">
              {language === 'vi' ? 'Tổng số phiên đăng nhập' : 'Total Login Sessions'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{sessions.length}</p>
          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            {language === 'vi' ? 'Lưu tại bảng login_sessions' : 'Persisted in login_sessions'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-tight">
              {language === 'vi' ? 'Đang hoạt động (Online)' : 'Active Online Sessions'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{totalActive}</p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {language === 'vi' ? 'Phiên làm việc hợp lệ' : 'Valid active JWT tokens'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-tight">
              {language === 'vi' ? 'Đã thu hồi / Đăng xuất' : 'Revoked Sessions'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">{totalRevoked}</p>
          <span className="text-[10px] text-rose-600 font-medium">
            {language === 'vi' ? 'Đã vô hiệu hóa token' : 'Invalidated tokens'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-tight">
              {language === 'vi' ? 'Phiên đã hết hạn' : 'Expired Sessions'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">{totalExpired}</p>
          <span className="text-[10px] text-slate-400 font-medium">
            {language === 'vi' ? 'Tự động đóng sau 7 ngày' : 'Auto-expired after 7 days'}
          </span>
        </div>
      </div>

      {/* 2. Search, Filters & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm theo user, email, IP, vị trí, thiết bị...' : 'Search by user, email, IP, location, device...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="w-40">
            <Select2
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: language === 'vi' ? 'Tất cả trạng thái' : 'All Status' },
                { value: 'active', label: language === 'vi' ? '🟢 Hoạt động' : '🟢 Active' },
                { value: 'revoked', label: language === 'vi' ? '🔴 Đã thu hồi' : '🔴 Revoked' },
                { value: 'expired', label: language === 'vi' ? '⚠️ Đã hết hạn' : '⚠️ Expired' },
              ]}
            />
          </div>

          <div className="w-36">
            <Select2
              value={deviceFilter}
              onChange={setDeviceFilter}
              options={[
                { value: 'all', label: language === 'vi' ? 'Tất cả thiết bị' : 'All Devices' },
                { value: 'desktop', label: language === 'vi' ? '💻 Máy tính' : '💻 Desktop' },
                { value: 'mobile', label: language === 'vi' ? '📱 Điện thoại' : '📱 Mobile' },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
            title={language === 'vi' ? 'Làm mới dữ liệu' : 'Refresh'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* 3. Login Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden w-full min-w-0 max-w-full">
        <div className="overflow-x-auto w-full overscroll-x-contain touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold text-[11px] whitespace-nowrap">
              <tr>
                <th className="py-3 px-4 w-14 text-center">#ID</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Khách hàng' : 'User'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Địa chỉ IP & vị trí' : 'IP & Location'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Thiết bị & trình duyệt' : 'Device & Browser'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Thời gian đăng nhập' : 'Login Time'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Hoạt động cuối' : 'Last Active'}</th>
                <th className="py-3 px-4 text-center">{language === 'vi' ? 'Trạng thái phiên' : 'Session Status'}</th>
                <th className="py-3 px-4 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <p>{language === 'vi' ? 'Đang tải nhật ký phiên từ bảng login_sessions...' : 'Loading login sessions from database...'}</p>
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">
                      {language === 'vi' ? 'Không tìm thấy phiên đăng nhập nào phù hợp' : 'No login sessions found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => {
                  const loginTime = new Date(sess.createdAt);
                  const lastActive = new Date(sess.lastActiveAt);

                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* #ID */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 text-xs">
                          #{sess.id}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {sess.user?.name ? sess.user.name.slice(0, 2).toUpperCase() : sess.user?.username ? sess.user.username.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{sess.user?.name || sess.user?.username || `User #${sess.userId}`}</span>
                              {sess.user?.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{sess.user?.email || `ID: #${sess.userId}`}</div>
                          </div>
                        </div>
                      </td>

                      {/* IP & Location */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <code className="font-mono font-bold text-slate-800 text-xs bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {sess.ipAddress}
                          </code>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium truncate max-w-[160px]">
                          {sess.location}
                        </div>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {sess.deviceType === 'mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-800 text-xs">{sess.device}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={sess.userAgent}>
                          {sess.userAgent ? sess.userAgent.slice(0, 45) + '...' : 'Browser Client'}
                        </div>
                      </td>

                      {/* Login Time */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-900 font-bold text-xs">
                          {loginTime.toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{loginTime.toLocaleTimeString()}</span>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700 text-xs">
                          {lastActive.toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {lastActive.toLocaleTimeString()}
                        </div>
                      </td>

                      {/* Session Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                            sess.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sess.status === 'revoked'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sess.status === 'active'
                                ? 'bg-emerald-500 animate-pulse'
                                : sess.status === 'revoked'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span>
                            {sess.status === 'active'
                              ? (language === 'vi' ? 'Đang hoạt động' : 'Active')
                              : sess.status === 'revoked'
                              ? (language === 'vi' ? 'Đã thu hồi' : 'Revoked')
                              : (language === 'vi' ? 'Đã hết hạn' : 'Expired')}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {sess.status === 'active' ? (
                          <button
                            onClick={() => handleRevokeSession(sess.id)}
                            disabled={revokingId === sess.id}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ml-auto"
                            title={language === 'vi' ? 'Thu hồi phiên & đăng xuất tài khoản' : 'Revoke session'}
                          >
                            <Lock className="w-3 h-3" />
                            <span>{language === 'vi' ? 'Thu hồi' : 'Revoke'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {language === 'vi' ? 'Đã đóng' : 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Hint */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              {language === 'vi'
                ? `Hiển thị ${filteredSessions.length} trên tổng số ${sessions.length} phiên đăng nhập`
                : `Showing ${filteredSessions.length} of ${sessions.length} login sessions`}
            </span>
            <span className="sm:hidden text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md font-medium">
              {language === 'vi' ? '← Kéo ngang để xem tiếp →' : '← Swipe to see more →'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

