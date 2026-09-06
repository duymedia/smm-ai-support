import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { StatCard } from '../../ui/StatCard';
import { PageHeader } from '../../ui/PageHeader';
import { Select2 } from '../../ui/Select2';
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
  ShieldCheck,
  UserCheck
} from 'lucide-react';

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
    <div className="space-y-6 animate-in fade-in duration-200 w-full min-w-0">
      {/* Page Header */}
      <PageHeader
        title={language === 'vi' ? 'Nhật Ký Phiên & Kiểm Soát Truy Cập' : 'Login Sessions & Security Audit Logs'}
        description={
          language === 'vi'
            ? 'Giám sát chi tiết địa chỉ IP, vị trí địa lý, thiết bị và thu hồi quyền truy cập của các tài khoản trong hệ thống.'
            : 'Audit active login sessions, device fingerprints, geographic telemetry, and revoke compromised tokens.'
        }
        badge={
          <Badge variant="brand" pulse>
            {totalActive} {language === 'vi' ? 'Đang Online' : 'Online'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              loading={loading}
              onClick={loadSessions}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              {language === 'vi' ? 'Làm Mới' : 'Refresh'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportJson}
              icon={<Download className="w-4 h-4" />}
            >
              Export JSON
            </Button>
          </div>
        }
      />

      {/* 4 StatCards Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === 'vi' ? 'TỔNG SỐ PHIÊN' : 'TOTAL SESSIONS'}
          value={sessions.length}
          subtitle={language === 'vi' ? 'Bản ghi bảng login_sessions' : 'Persisted in login_sessions'}
          icon={<FileText className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title={language === 'vi' ? 'ĐANG HOẠT ĐỘNG' : 'ACTIVE SESSIONS'}
          value={totalActive}
          subtitle={language === 'vi' ? 'Token JWT đang trực tuyến' : 'Valid active JWT tokens'}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          highlight={totalActive > 0}
        />
        <StatCard
          title={language === 'vi' ? 'ĐÃ THU HỒI' : 'REVOKED TOKENS'}
          value={totalRevoked}
          subtitle={language === 'vi' ? 'Bị chấm dứt quyền truy cập' : 'Forced logout by admin'}
          icon={<Lock className="w-5 h-5 text-rose-600" />}
        />
        <StatCard
          title={language === 'vi' ? 'ĐÃ HẾT HẠN' : 'EXPIRED SESSIONS'}
          value={totalExpired}
          subtitle={language === 'vi' ? 'Tự động đóng sau 7 ngày' : 'Auto-expired sessions'}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <Card
        macChrome
        macTitle="AUDIT_FILTER // QUERY_BUILDER"
        macBadge={<Badge variant="slate" size="sm">Search</Badge>}
        className="p-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  language === 'vi'
                    ? 'Tìm theo user, email, IP, vị trí, thiết bị...'
                    : 'Search by user, email, IP, location, device...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50/80 text-xs focus:bg-white focus-ring transition-colors"
              />
            </div>

            <div className="w-44">
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

            <div className="w-40">
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
        </div>
      </Card>

      {/* Login Sessions Table Card */}
      <Card
        macChrome
        macTitle="AUDIT_TELEMETRY // SESSION_LOGS"
        macBadge={
          <Badge variant="blue" size="sm">
            {filteredSessions.length} {language === 'vi' ? 'Bản Ghi' : 'Records'}
          </Badge>
        }
        className="overflow-hidden"
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-14 text-center">#ID</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Khách Hàng' : 'User'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Địa Chỉ IP & Vị Trí' : 'IP & Location'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Thiết Bị & Client' : 'Device & Browser'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Thời Gian Đăng Nhập' : 'Login Time'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Hoạt Động Cuối' : 'Last Active'}</th>
                <th className="py-3 px-4 text-center">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{language === 'vi' ? 'Thao Tác' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <p>
                      {language === 'vi'
                        ? 'Đang tải nhật ký phiên từ cơ sở dữ liệu...'
                        : 'Loading login sessions from database...'}
                    </p>
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">
                      {language === 'vi'
                        ? 'Không tìm thấy phiên đăng nhập nào phù hợp'
                        : 'No login sessions found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => {
                  const loginTime = new Date(sess.createdAt);
                  const lastActive = new Date(sess.lastActiveAt);

                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* #ID */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono tabular-nums font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full text-xs">
                          #{sess.id}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs uppercase">
                            {sess.user?.name
                              ? sess.user.name.slice(0, 2)
                              : sess.user?.username
                              ? sess.user.username.slice(0, 2)
                              : 'US'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{sess.user?.name || sess.user?.username || `User #${sess.userId}`}</span>
                              {sess.user?.role === 'admin' && (
                                <Badge variant="rose" size="sm">
                                  ADMIN
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                              {sess.user?.email || `ID: #${sess.userId}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* IP & Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <code className="font-mono tabular-nums font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            {sess.ipAddress}
                          </code>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium truncate max-w-[160px]">
                          {sess.location}
                        </div>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {sess.deviceType === 'mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-800 text-xs">{sess.device}</span>
                        </div>
                        <div
                          className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]"
                          title={sess.userAgent}
                        >
                          {sess.userAgent ? sess.userAgent.slice(0, 45) + '...' : 'Browser Client'}
                        </div>
                      </td>

                      {/* Login Time */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono tabular-nums text-slate-900 font-semibold text-xs">
                          {loginTime.toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{loginTime.toLocaleTimeString()}</span>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono tabular-nums text-slate-700 text-xs font-semibold">
                          {lastActive.toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                          {lastActive.toLocaleTimeString()}
                        </div>
                      </td>

                      {/* Session Status */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            sess.status === 'active'
                              ? 'emerald'
                              : sess.status === 'revoked'
                              ? 'rose'
                              : 'amber'
                          }
                          pulse={sess.status === 'active'}
                          size="sm"
                        >
                          {sess.status === 'active'
                            ? language === 'vi'
                              ? 'Hoạt Động'
                              : 'Active'
                            : sess.status === 'revoked'
                            ? language === 'vi'
                              ? 'Đã Thu Hồi'
                              : 'Revoked'
                            : language === 'vi'
                            ? 'Đã Hết Hạn'
                            : 'Expired'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {sess.status === 'active' ? (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            loading={revokingId === sess.id}
                            onClick={() => handleRevokeSession(sess.id)}
                            icon={<Lock className="w-3 h-3" />}
                            className="ml-auto"
                          >
                            {language === 'vi' ? 'Thu hồi' : 'Revoke'}
                          </Button>
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

        {/* Table Bottom Footer */}
        <div className="p-3.5 bg-slate-50/80 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-mono tabular-nums">
          <span>
            {language === 'vi'
              ? `Hiển thị ${filteredSessions.length} / ${sessions.length} phiên đăng nhập`
              : `Showing ${filteredSessions.length} of ${sessions.length} login sessions`}
          </span>
          <span className="text-[11px] text-slate-400">
            TLS 1.3 // End-to-End Encryption
          </span>
        </div>
      </Card>
    </div>
  );
};
