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
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {language === 'vi' ? 'Tài Khoản & Bảo Mật' : 'Account & Security Settings'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {user?.role === 'admin' ? 'ADMINISTRATOR' : 'VIP AGENCY'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'vi'
                ? 'Quản lý thông tin định danh cá nhân, đổi mật khẩu, xác thực 2 bước (2FA) và khóa API nhà phát triển'
                : 'Manage personal credentials, password change, two-factor authentication (2FA), and Developer API keys'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Card & Personal Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {language === 'vi' ? 'Thông Tin Cá Nhân & Liên Hệ' : 'Personal Information & Contact'}
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {language === 'vi' ? 'Đã xác minh' : 'Verified'}
              </span>
            </div>

            {/* Profile Avatar Top Box */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                {user?.avatar ? (
                  <img src={user.avatar} alt={name} className="w-full h-full rounded-2xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{name}</h3>
                <p className="text-xs text-slate-500 font-mono">{email}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>ID: <strong className="font-mono text-slate-700">{user?.id || 'usr_98124'}</strong></span>
                  <span>•</span>
                  <span>{language === 'vi' ? 'Thành viên từ:' : 'Member since:'} <strong>08/2024</strong></span>
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 font-mono"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 font-mono"
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
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-left transition-colors hover:border-blue-300 focus:outline-hidden focus:border-blue-500"
                      aria-haspopup="listbox"
                      aria-expanded={timezoneOpen}
                    >
                      <span>
                        <span className="block text-xs font-semibold text-slate-800">{selectedTimezone.label}</span>
                        <span className="block text-[10px] text-slate-400">{selectedTimezone.detail}</span>
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${timezoneOpen ? 'rotate-180 text-blue-600' : ''}`} />
                    </button>
                    {timezoneOpen && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        <input
                          autoFocus
                          value={timezoneSearch}
                          onChange={(e) => setTimezoneSearch(e.target.value)}
                          placeholder={language === 'vi' ? 'Tìm múi giờ...' : 'Search timezone...'}
                          className="mb-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                        <div className="max-h-52 overflow-y-auto" role="listbox">
                          {filteredTimezones.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => { setTimezone(option.value); setTimezoneOpen(false); setTimezoneSearch(''); }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${timezone === option.value ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                              role="option"
                              aria-selected={timezone === option.value}
                            >
                              <span><span className="block text-xs font-semibold">{option.label}</span><span className="block text-[10px] text-slate-400">{option.detail}</span></span>
                              {timezone === option.value && <Check className="h-3.5 w-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{savingProfile ? t('common.loading') : (language === 'vi' ? 'Lưu Thông Tin Cá Nhân' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {language === 'vi' ? 'Đổi Mật Khẩu Đăng Nhập' : 'Change Password'}
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Bảo mật SSL 256-bit</span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 pr-10 font-mono"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 pr-10 font-mono"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{savingPassword ? t('common.loading') : (language === 'vi' ? 'Cập Nhật Mật Khẩu' : 'Update Password')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: 2FA, Developer API Key, Active Sessions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Two-Factor Authentication (2FA) Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'vi' ? 'Xác Thực Hai Bước (2FA)' : 'Two-Factor Authentication (2FA)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={open2FA}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  twoFactorEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {twoFactorEnabled ? (language === 'vi' ? 'ĐANG BẬT' : 'ENABLED') : (language === 'vi' ? 'ĐÃ TẮT' : 'DISABLED')}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'vi'
                ? 'Bảo vệ số dư ví và quyền quản lý Panel bằng Google Authenticator hoặc Authy khi đăng nhập.'
                : 'Protect your wallet balance and rented SMM panels with Google Authenticator or Authy.'}
            </p>

            {!twoFactorEnabled && (
              <button
                type="button"
                onClick={open2FA}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'vi' ? 'Bật bảo mật 2FA' : 'Enable 2FA Security'}
              </button>
            )}

            {show2FAModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
                onClick={() => setShow2FAModal(false)}
              >
                <div
                  className="max-h-[calc(100vh-2rem)] w-full max-w-[500px] overflow-y-auto rounded-lg bg-white shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h3 className="text-lg font-bold text-slate-900">
                      {twoFactorEnabled
                        ? (language === 'vi' ? 'Tắt xác thực hai yếu tố' : 'Disable Two-Factor Authentication')
                        : (language === 'vi' ? 'Thiết lập xác thực Google' : 'Google Authentication Setting')}
                    </h3>
                    <button type="button" onClick={() => setShow2FAModal(false)} className="text-slate-400 hover:text-slate-700" aria-label="Close">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {twoFactorEnabled ? (
                    <div className="space-y-5 px-6 py-6">
                      <p className="text-sm leading-6 text-slate-500">{language === 'vi' ? 'Nhập mã hiện tại từ Google Authenticator hoặc Authy để tắt bảo mật 2FA.' : 'Enter the current code from Google Authenticator or Authy to disable 2FA.'}</p>
                      <input value={code2FA} onChange={e => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder={language === 'vi' ? 'Nhập mã xác thực' : 'Enter authentication code'} maxLength={6} className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm tracking-[0.35em] focus:border-blue-500 focus:outline-none" />
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShow2FAModal(false)} className="rounded-md border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">{language === 'vi' ? 'Hủy' : 'Cancel'}</button>
                        <button type="button" onClick={verify2FA} disabled={code2FA.length !== 6} className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{language === 'vi' ? 'Tắt 2FA' : 'Disable'}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 px-6 py-6">
                      <h4 className="text-base font-semibold text-[#9aa7c1]">{language === 'vi' ? 'Cài Google Authenticator trên điện thoại' : 'Get Google Authenticator On Your Phone'}</h4>
                      <div className="flex flex-wrap gap-2">
                        <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noreferrer">
                          <img className="h-[44px] w-[150px] object-contain" src="https://i.imgur.com/yCrwvG2.png" alt="Get it on Google Play" />
                        </a>
                        <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noreferrer">
                          <img className="h-[44px] w-[150px] object-contain" src="https://i.imgur.com/uulfmot.png" alt="Download on the App Store" />
                        </a>
                      </div>
                      <p className="text-sm font-medium leading-6 text-[#9aa7c1]">{language === 'vi' ? 'Quét mã QR. Ứng dụng sẽ tạo mã gồm 6 chữ số để bạn nhập bên dưới.' : 'Scan the QR code. It will generate a 6 digit code for you to enter below.'}</p>
                      {qrCode && <img src={qrCode} alt="Two-factor authentication QR code" className="mx-auto h-44 w-44 object-contain" />}
                      <div className="flex gap-3 rounded-md border border-dashed border-amber-400 bg-amber-50 px-4 py-4 text-sm leading-5 text-slate-600">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-600">!</span>
                        <p>{language === 'vi' ? 'Nếu gặp khó khăn khi quét mã QR, hãy chọn nhập thủ công trong ứng dụng, sau đó nhập email và mã sau:' : 'If you have trouble using the QR code, select manual entry on your app, and enter your email and the code:'} <strong className="font-mono text-slate-800">{secret2FA}</strong></p>
                      </div>
                      <div className="flex overflow-hidden rounded-md border border-slate-200">
                        <input value={code2FA} onChange={e => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder={language === 'vi' ? 'Nhập mã xác thực' : 'Enter authentication code'} maxLength={6} className="min-w-0 flex-1 px-3 py-3 text-sm focus:outline-none" />
                        <button type="button" onClick={verify2FA} disabled={code2FA.length !== 6} className="bg-blue-600 px-6 text-sm font-semibold text-white disabled:opacity-50">{language === 'vi' ? 'Bật' : 'Enable'}</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {twoFactorEnabled && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold">Mã khóa dự phòng (Secret Key):</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(secret2FA);
                      addToast('success', 'Copied 2FA Secret Key');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono font-bold text-center tracking-widest text-slate-900">
                  {secret2FA}
                </div>
              </div>
            )}
          </div>

          {/* User Management API Key Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'vi' ? 'Khóa Quản Trị API (API Token)' : 'Management API Token'}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">REST v2</span>
            </div>

            <p className="text-xs text-slate-500">
              {language === 'vi'
                ? 'Dùng mã Token này để tự động hóa kiểm tra số dư, gia hạn panel hoặc đồng bộ từ ứng dụng bên ngoài.'
                : 'Use this secret API key to programmatically query balance, manage panels, or integrate automation.'}
            </p>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-900 pr-20 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleRegenerateKey}
                disabled={rotatingKey}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rotatingKey ? 'animate-spin' : ''}`} />
                <span>{rotatingKey ? 'Đang tạo khóa...' : (language === 'vi' ? 'Tạo Lại Mã API Key Mới' : 'Regenerate API Key')}</span>
              </button>
            </div>
          </div>

          {/* Active Sessions & Security Log Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'vi' ? 'Phiên Đăng Nhập Hoạt Động' : 'Active Login Sessions'}
                </h3>
              </div>
            </div>

            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto pr-1 text-xs">
              {sessions.map((sess) => {
                const Icon = /iphone|android|mobile/i.test(sess.device) ? Smartphone : Laptop;
                return (
                  <div key={sess.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-xs">{sess.device}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">{sess.ip} • {sess.location}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-slate-400">
                      {sess.current ? (language === 'vi' ? 'Đang hoạt động' : 'Active now') : new Date(sess.lastActiveAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
