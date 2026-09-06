import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Key,
  ShieldCheck,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RefreshCw,
  Clock,
  Laptop,
  Globe,
  LogOut,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';

export const AccountSecurityPage: React.FC = () => {
  const { user, updateProfile, addToast, language, t } = useApp();

  // Personal Info Form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [telegramContact, setTelegramContact] = useState(user?.telegramContact || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Ho_Chi_Minh (GMT+7)');
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // 2FA Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [secret2FA, setSecret2FA] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [code2FA, setCode2FA] = useState('');
  const [qrCode, setQrCode] = useState('');
  const authHeaders = () => {
    const token = JSON.parse(localStorage.getItem('auth_session') || '{}').token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const open2FA = async () => {
    if (twoFactorEnabled) { setShow2FAModal(true); return; }
    const res = await fetch('/api/user/2fa/setup', { method: 'POST', headers: authHeaders(), credentials: 'include' });
    const data = await res.json().catch(() => ({ success: false, message: `API error (${res.status})` }));
    if (data.success) {
      setSecret2FA(data.data.secret);
      setQrCode(data.data.qrCode);
      setCode2FA('');
      setShow2FAModal(true);
    } else addToast('error', data.message || 'Không thể tạo cấu hình 2FA.');
  };
  const verify2FA = async () => {
    const endpoint = twoFactorEnabled ? '/api/user/2fa/disable' : '/api/user/2fa/enable';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ code: code2FA }), credentials: 'include' });
      const data = await res.json().catch(() => ({ success: false, message: `API error (${res.status})` }));
      if (!res.ok || !data.success) return addToast('error', data.message || 'Không thể cập nhật 2FA.');
      setTwoFactorEnabled(!twoFactorEnabled); setShow2FAModal(false); setCode2FA('');
      addToast('success', twoFactorEnabled ? 'Đã tắt 2FA.' : 'Đã bật 2FA.');
    } catch (error: any) {
      addToast('error', error?.message || 'Không thể kết nối máy chủ.');
    }
  };

  // API Key Management
  const [apiKey, setApiKey] = useState(user?.apiKey || '');
  const [rotatingKey, setRotatingKey] = useState(false);

  // Active Sessions Mock Data
  const [sessions, setSessions] = useState<any[]>([]);
  const sessionToken = () => typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
  const loadSessions = async () => {
    const token = sessionToken();
    if (!token) return;
    try {
      const res = await fetch('/api/user/sessions', { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      const data = await res.json().catch(() => ({ success: false }));
      if (res.ok && data.success) setSessions(data.data || []);
    } catch { /* Keep the page usable when session metadata is unavailable. */ }
  };
  React.useEffect(() => { loadSessions(); }, []);

  // The JWT is only stored in localStorage. The current user is loaded by
  // AppContext from /api/auth/me and is the single source of truth here.
  React.useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setTelegramContact(user?.telegramContact || '');
    setTimezone(user?.timezone || 'Asia/Ho_Chi_Minh (GMT+7)');
    setApiKey(user?.apiKey || '');
    setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
  }, [user]);

  const timezoneOptions = [
    { value: 'Asia/Ho_Chi_Minh (GMT+7)', label: 'Asia/Ho_Chi_Minh', detail: 'GMT+7 · Bangkok, Hanoi, Jakarta' },
    { value: 'Asia/Singapore (GMT+8)', label: 'Asia/Singapore', detail: 'GMT+8 · Singapore, Kuala Lumpur, Beijing' },
    { value: 'America/New_York (GMT-5)', label: 'America/New_York', detail: 'GMT-5 · Eastern Time' },
    { value: 'Europe/London (GMT+0)', label: 'Europe/London', detail: 'GMT+0 · UTC/GMT' },
  ];
  const selectedTimezone = timezoneOptions.find((option) => option.value === timezone) || timezoneOptions[0];
  const filteredTimezones = timezoneOptions.filter((option) =>
    `${option.label} ${option.detail}`.toLowerCase().includes(timezoneSearch.toLowerCase()),
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const success = await updateProfile({ name, email, phone, telegramContact, timezone });
    setSavingProfile(false);
    if (success) {
      addToast(
        'success',
        language === 'vi'
          ? 'Đã cập nhật thông tin tài khoản thành công!'
          : 'Profile information updated successfully!'
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập mật khẩu hiện tại.' : 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      addToast('error', language === 'vi' ? 'Mật khẩu mới phải có ít nhất 8 ký tự.' : 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', language === 'vi' ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      const res = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        addToast('success', data.message || (language === 'vi' ? 'Đổi mật khẩu thành công!' : 'Password updated successfully!'));
      } else {
        addToast('error', data.message || 'Change password failed.');
      }
    } catch (err: any) {
      addToast('error', 'Network error: ' + err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    addToast('success', language === 'vi' ? 'Đã sao chép API Key vào bộ nhớ tạm!' : 'API Key copied to clipboard!');
  };

  const handleRegenerateKey = async () => {
    setRotatingKey(true);
    try {
      const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_session') || '{}').token : null;
      const res = await fetch('/api/user/rotate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.data?.apiKey) {
        setApiKey(data.data.apiKey);
        addToast('success', data.message || 'New API Key generated successfully!');
      }
    } catch {
      addToast('error', 'Failed to rotate API Key');
    } finally {
      setRotatingKey(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    const token = sessionToken();
    if (!token) return;
    const res = await fetch('/api/user/sessions/other', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
    const data = await res.json().catch(() => ({ success: false }));
    if (res.ok && data.success) {
      await loadSessions();
      addToast('success', language === 'vi' ? 'Đã đăng xuất khỏi tất cả các thiết bị khác thành công!' : 'Logged out of all other active sessions!');
    } else addToast('error', data.message || 'Không thể đăng xuất thiết bị khác.');
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Banner Header */}
      <PageHeader
        title={language === 'vi' ? 'Tài Khoản & Bảo Mật' : 'Account & Security Settings'}
        description={
          language === 'vi'
            ? 'Quản lý thông tin định danh cá nhân, đổi mật khẩu, xác thực 2 bước (2FA) và khóa API nhà phát triển'
            : 'Manage personal credentials, password change, two-factor authentication (2FA), and Developer API keys'
        }
        badge={
          <Badge variant="brand" size="sm">
            {user?.role === 'admin' || user?.role === 'super_admin' ? 'ADMINISTRATOR' : 'VIP AGENCY'}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Card & Personal Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personal Information Card */}
          <Card
            macChrome
            macTitle={language === 'vi' ? 'Thông Tin Cá Nhân & Liên Hệ' : 'Personal Information & Contact'}
            macBadge={
              <Badge variant="emerald" pulse size="sm">
                {language === 'vi' ? 'Đã xác minh' : 'Verified'}
              </Badge>
            }
          >
            {/* Profile Avatar Top Box */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={name} className="w-full h-full rounded-2xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{name}</h3>
                <p className="text-xs text-slate-500 font-mono tabular-nums">{email}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>ID: <strong className="font-mono tabular-nums text-slate-700">{user?.id || 'usr_98124'}</strong></span>
                  <span>•</span>
                  <span>{language === 'vi' ? 'Thành viên từ:' : 'Member since:'} <strong className="font-mono tabular-nums">08/2024</strong></span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Họ và tên:' : 'Full Name:'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50/60 focus:bg-white transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Địa chỉ Email:' : 'Email Address:'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50/60 focus:bg-white font-mono tabular-nums transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Số điện thoại / Zalo:' : 'Phone Number:'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50/60 focus:bg-white font-mono tabular-nums transition-all text-xs"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Telegram Handle:' : 'Telegram Username:'}
                  </label>
                  <input
                    type="text"
                    value={telegramContact}
                    onChange={(e) => setTelegramContact(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50/60 focus:bg-white font-mono transition-all text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Múi giờ làm việc:' : 'Primary Timezone:'}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTimezoneOpen((open) => !open)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white px-3.5 py-2.5 text-left transition-all focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                      aria-haspopup="listbox"
                      aria-expanded={timezoneOpen}
                    >
                      <span>
                        <span className="block text-xs font-semibold text-slate-800">{selectedTimezone.label}</span>
                        <span className="block text-[10px] text-slate-400 font-mono tabular-nums">{selectedTimezone.detail}</span>
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${timezoneOpen ? 'rotate-180 text-blue-600' : ''}`} />
                    </button>
                    {timezoneOpen && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95">
                        <input
                          autoFocus
                          value={timezoneSearch}
                          onChange={(e) => setTimezoneSearch(e.target.value)}
                          placeholder={language === 'vi' ? 'Tìm múi giờ...' : 'Search timezone...'}
                          className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-slate-900 focus:outline-none"
                        />
                        <div className="max-h-52 overflow-y-auto space-y-1" role="listbox">
                          {filteredTimezones.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => { setTimezone(option.value); setTimezoneOpen(false); setTimezoneSearch(''); }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${timezone === option.value ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                              role="option"
                              aria-selected={timezone === option.value}
                            >
                              <span><span className="block text-xs font-semibold">{option.label}</span><span className="block text-[10px] text-slate-400 font-mono tabular-nums">{option.detail}</span></span>
                              {timezone === option.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={savingProfile}
                  icon={savingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                >
                  <span>{savingProfile ? t('common.loading') : (language === 'vi' ? 'Lưu Thông Tin Cá Nhân' : 'Save Changes')}</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password Card */}
          <Card
            macChrome
            macTitle={language === 'vi' ? 'Đổi Mật Khẩu Đăng Nhập' : 'Change Password'}
            macBadge={<Badge variant="neutral" size="sm">TLS 1.3 · 256-BIT</Badge>}
          >
            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Mật khẩu hiện tại:' : 'Current Password:'}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50/60 focus:bg-white pr-10 font-mono transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Mật khẩu mới:' : 'New Password:'}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 8 ký tự"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50/60 focus:bg-white pr-10 font-mono transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Xác nhận mật khẩu mới:' : 'Confirm New Password:'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50/60 focus:bg-white font-mono transition-all text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={savingPassword}
                  icon={savingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                >
                  <span>{savingPassword ? t('common.loading') : (language === 'vi' ? 'Cập Nhật Mật Khẩu' : 'Update Password')}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: 2FA, Developer API Key, Active Sessions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Two-Factor Authentication (2FA) Card */}
          <Card
            macChrome
            macTitle={language === 'vi' ? 'Xác Thực Hai Bước (2FA)' : 'Two-Factor Authentication (2FA)'}
            macBadge={
              <Badge variant={twoFactorEnabled ? 'emerald' : 'slate'} pulse={twoFactorEnabled} size="sm">
                {twoFactorEnabled ? (language === 'vi' ? 'ĐANG BẬT' : 'ENABLED') : (language === 'vi' ? 'ĐÃ TẮT' : 'DISABLED')}
              </Badge>
            }
          >
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {language === 'vi'
                ? 'Bảo vệ số dư ví và quyền quản lý Panel bằng Google Authenticator hoặc Authy khi đăng nhập.'
                : 'Protect your wallet balance and rented SMM panels with Google Authenticator or Authy.'}
            </p>

            <Button
              type="button"
              onClick={open2FA}
              variant={twoFactorEnabled ? 'danger' : 'primary'}
              className="w-full"
            >
              {twoFactorEnabled
                ? (language === 'vi' ? 'Tắt Xác Thực 2FA' : 'Disable 2FA')
                : (language === 'vi' ? 'Bật Bảo Mật 2FA' : 'Enable 2FA Security')}
            </Button>

            {twoFactorEnabled && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs mt-4">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold">{language === 'vi' ? 'Mã khóa dự phòng (Secret Key):' : 'Backup Secret Key:'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(secret2FA);
                      addToast('success', 'Copied 2FA Secret Key');
                    }}
                    icon={<Copy className="w-3 h-3" />}
                    className="h-7 text-xs"
                  >
                    Copy
                  </Button>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono font-bold text-center tracking-widest text-slate-900 select-all tabular-nums">
                  {secret2FA}
                </div>
              </div>
            )}
          </Card>

          {/* User Management API Key Card */}
          <Card
            macChrome
            macTitle={language === 'vi' ? 'Khóa Quản Trị API' : 'Management API Token'}
            macBadge={<Badge variant="info" size="sm">REST v2</Badge>}
          >
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {language === 'vi'
                ? 'Dùng mã Token này để tự động hóa kiểm tra số dư, gia hạn panel hoặc đồng bộ từ ứng dụng bên ngoài.'
                : 'Use this secret API key to programmatically query balance, manage panels, or integrate automation.'}
            </p>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-900 pr-20 select-all tabular-nums"
                />
                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleRegenerateKey}
                disabled={rotatingKey}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${rotatingKey ? 'animate-spin' : ''}`} />}
              >
                <span>{rotatingKey ? 'Đang tạo khóa...' : (language === 'vi' ? 'Tạo Lại Mã API Key Mới' : 'Regenerate API Key')}</span>
              </Button>
            </div>
          </Card>

          {/* Active Sessions & Security Log Card */}
          <Card
            macChrome
            macTitle={language === 'vi' ? 'Phiên Đăng Nhập Hoạt Động' : 'Active Login Sessions'}
            macBadge={
              <Badge variant="neutral" size="sm">
                <span className="tabular-nums font-mono">{sessions.length}</span> {language === 'vi' ? 'phiên' : 'active'}
              </Badge>
            }
          >
            {sessions.length > 1 && (
              <div className="mb-3 flex justify-end">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleRevokeOtherSessions}
                  icon={<LogOut className="w-3 h-3" />}
                  className="h-8 text-[11px]"
                >
                  {language === 'vi' ? 'Đăng xuất phiên khác' : 'Revoke other sessions'}
                </Button>
              </div>
            )}

            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto pr-1 text-xs">
              {sessions.map((sess) => {
                const Icon = /iphone|android|mobile/i.test(sess.device) ? Smartphone : Laptop;
                return (
                  <div key={sess.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-xs">{sess.device}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums">{sess.ip} • {sess.location}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-slate-400 font-mono tabular-nums">
                      {sess.current ? (
                        <Badge variant="emerald" pulse size="sm">
                          {language === 'vi' ? 'Hiện tại' : 'Active now'}
                        </Badge>
                      ) : (
                        new Date(sess.lastActiveAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* 2FA SETUP / DISABLE MODAL */}
      {show2FAModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShow2FAModal(false)}
        >
          <div
            className="max-h-[calc(100vh-2rem)] w-full max-w-[480px] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {twoFactorEnabled
                    ? (language === 'vi' ? 'Tắt xác thực hai yếu tố' : 'Disable Two-Factor Authentication')
                    : (language === 'vi' ? 'Thiết lập xác thực Google' : 'Google Authentication Setting')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShow2FAModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {twoFactorEnabled ? (
              <div className="space-y-5 px-6 py-6 text-xs">
                <p className="leading-relaxed text-slate-600">
                  {language === 'vi'
                    ? 'Nhập mã hiện tại từ Google Authenticator hoặc Authy để tắt bảo mật 2FA.'
                    : 'Enter the current code from Google Authenticator or Authy to disable 2FA.'}
                </p>
                <input
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder={language === 'vi' ? 'Nhập 6 chữ số' : 'Enter 6 digits'}
                  maxLength={6}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-center text-lg font-mono tracking-[0.4em] font-bold tabular-nums focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setShow2FAModal(false)}>
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button variant="danger" onClick={verify2FA} disabled={code2FA.length !== 6}>
                    {language === 'vi' ? 'Tắt 2FA' : 'Disable'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 px-6 py-6 text-xs">
                <p className="leading-relaxed text-slate-600">
                  {language === 'vi'
                    ? 'Quét mã QR bằng ứng dụng Google Authenticator hoặc Authy, sau đó nhập mã 6 chữ số bên dưới.'
                    : 'Scan the QR code with Google Authenticator or Authy, then enter the 6-digit code below.'}
                </p>
                {qrCode && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-center">
                    <img src={qrCode} alt="Two-factor authentication QR code" className="h-44 w-44 object-contain rounded-xl" />
                  </div>
                )}
                <div className="flex gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 p-3.5 text-slate-600">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-700 text-xs">
                    !
                  </div>
                  <p className="leading-relaxed">
                    {language === 'vi' ? 'Nhập thủ công mã khóa nếu không quét được QR:' : 'Manual secret key if unable to scan:'}{' '}
                    <strong className="font-mono tabular-nums text-slate-900 block mt-1 select-all">{secret2FA}</strong>
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-center text-lg font-mono tracking-[0.3em] font-bold tabular-nums focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <Button variant="primary" onClick={verify2FA} disabled={code2FA.length !== 6}>
                    {language === 'vi' ? 'Bật 2FA' : 'Enable'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
