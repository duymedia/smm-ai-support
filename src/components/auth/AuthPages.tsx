import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { Zap, Lock, Mail, User as UserIcon, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';
import { AnimatedBackground } from '../ui/AnimatedBackground';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4 shrink-0' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4 shrink-0 fill-[#1877F2]' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface AuthPageProps {
  mode: 'login' | 'register' | 'forgot' | 'reset' | 'verify';
}

export const AuthPages: React.FC<AuthPageProps> = ({ mode }) => {
  const { login, register, socialLogin, setCurrentRoute, language, t, addToast, siteConfig } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isRegistrationClosed = siteConfig?.allowUserRegistration === false;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập email hoặc tên đăng nhập.' : 'Please enter your email address or username.');
      return;
    }
    if (!password) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập mật khẩu.' : 'Please enter your password.');
      return;
    }
    setLoading(true);
    const firstAttempt = await login(email, undefined, password);
    if (firstAttempt === '2fa') setShowTwoFactorModal(true);
    setLoading(false);
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6) return;
    setLoading(true);
    const result = await login(email, undefined, password, twoFactorCode);
    setLoading(false);
    if (result === true) setShowTwoFactorModal(false);
    else if (result !== '2fa') setTwoFactorCode('');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistrationClosed) {
      addToast('error', language === 'vi' ? 'Đăng ký thành viên mới hiện đang tạm đóng.' : 'User registration is currently disabled.');
      return;
    }
    if (!name || !email || !password) {
      addToast('error', language === 'vi' ? 'Vui lòng điền đầy đủ các thông tin bắt buộc.' : 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      addToast('error', language === 'vi' ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      addToast('error', language === 'vi' ? 'Vui lòng đồng ý với Điều khoản dịch vụ & Chính sách bảo mật.' : 'Please accept the Terms of Service & Privacy Policy.');
      return;
    }
    setLoading(true);
    await register(name, username, email, password);
    setLoading(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập địa chỉ email.' : 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResetSent(true);
      addToast('success', data.message || (language === 'vi' ? 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.' : 'Reset instructions sent to your email.'));
    } catch {
      addToast('error', language === 'vi' ? 'Lỗi kết nối khi gửi yêu cầu khôi phục mật khẩu.' : 'Network error sending password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-dot-matrix flex flex-col justify-between relative overflow-hidden">
      <AnimatedBackground variant="auth" intensity="normal" position="fixed" />
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-md glass-card-elevated border border-slate-200/90 shadow-2xl p-6 sm:p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Mac window header chrome */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100/90">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 border border-rose-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 border border-amber-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 border border-emerald-500/30" />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>TLS 1.3 ENCRYPTED</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div
              style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/25 mb-3"
            >
              <Zap className="w-6 h-6 fill-current" />
            </div>

            {mode === 'login' && (
              <>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{language === 'vi' ? 'Đăng nhập Bảng điều khiển' : 'Sign In to Dashboard'}</h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{language === 'vi' ? 'Quản lý dịch vụ, đơn hàng và hoạt động của bạn.' : 'Manage your services, orders, and operations.'}</p>
              </>
            )}

            {mode === 'register' && (
              <>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {language === 'vi' ? 'Đăng ký tài khoản mới' : 'Create an Account'}
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === 'vi'
                    ? 'Bắt đầu quản lý và vận hành hệ thống SMM Panel của bạn.'
                    : 'Get started and manage your SMM Panel operations.'}
                </p>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {language === 'vi' ? 'Đặt lại mật khẩu' : 'Reset Your Password'}
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === 'vi'
                    ? 'Nhập địa chỉ email đã đăng ký để nhận hướng dẫn khôi phục.'
                    : 'Enter your registered email to receive reset instructions.'}
                </p>
              </>
            )}

            {mode === 'reset' && (
              <>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {language === 'vi' ? 'Tạo Mật Khẩu Mới' : 'Set New Password'}
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === 'vi' ? 'Nhập mật khẩu an toàn mới cho tài khoản của bạn.' : 'Enter a new secure password for your account.'}
                </p>
              </>
            )}
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Email hoặc tên đăng nhập' : 'Email or username'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={language === 'vi' ? 'Nhập email hoặc tên đăng nhập' : 'Enter email or username'}
                      className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {language === 'vi' ? 'Mật khẩu' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setCurrentRoute('/forgot-password')}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    >
                      {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 press-tactile"
                >
                  <span>{loading ? (language === 'vi' ? 'Đang xác thực...' : 'Authenticating...') : (language === 'vi' ? 'Đăng nhập vào Bảng điều khiển' : 'Sign In to Dashboard')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[11px] font-medium text-slate-400">
                      {language === 'vi' ? 'Hoặc đăng nhập bằng' : 'Or continue with'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => socialLogin('google')}
                    className="group flex items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white h-10 px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all cursor-pointer press-tactile"
                  >
                    <GoogleIcon />
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => socialLogin('facebook')}
                    className="group flex items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white h-10 px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all cursor-pointer press-tactile"
                  >
                    <FacebookIcon />
                    <span>Facebook</span>
                  </button>
                </div>

                <div className="text-center pt-2 text-xs text-slate-600">
                  {isRegistrationClosed ? (
                    <span className="text-slate-400 italic">
                      {language === 'vi' ? 'Đăng ký thành viên mới hiện đang tạm đóng.' : 'User registration is currently closed.'}
                    </span>
                  ) : (
                    <>
                      {language === 'vi' ? 'Chưa có tài khoản?' : "Don't have an account yet?"}{' '}
                      <button
                        type="button"
                        onClick={() => setCurrentRoute('/register')}
                        className="font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {language === 'vi' ? 'Tạo tài khoản ngay' : 'Create Account'}
                      </button>
                    </>
                  )}
                </div>
              </form>

              {showTwoFactorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" onClick={() => setShowTwoFactorModal(false)}>
                  <form onSubmit={handleTwoFactorSubmit} onClick={event => event.stopPropagation()} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">{language === 'vi' ? 'Xác thực 2FA' : 'Two-Factor Authentication'}</h2>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">{language === 'vi' ? 'Mở ứng dụng Google Authenticator và nhập mã 6 số.' : 'Enter the 6-digit code from your authenticator app.'}</p>
                    </div>
                    <input autoFocus type="text" inputMode="numeric" maxLength={6} value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000 000" className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-center font-mono text-xl tracking-[0.35em] tabular-nums focus:border-blue-600 focus:bg-white focus:outline-none" />
                    <div className="flex gap-2.5">
                      <button type="button" onClick={() => setShowTwoFactorModal(false)} className="flex-1 h-10 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer press-tactile">{language === 'vi' ? 'Hủy' : 'Cancel'}</button>
                      <button type="submit" disabled={loading || twoFactorCode.length !== 6} className="flex-1 h-10 rounded-full bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer press-tactile">{loading ? '...' : (language === 'vi' ? 'Xác thực' : 'Verify')}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <div>
              {isRegistrationClosed ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900">
                      {language === 'vi' ? 'Đăng Ký Đang Tạm Đóng' : 'Registration Currently Closed'}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      {language === 'vi'
                        ? 'Hệ thống hiện đang tạm ngưng mở đăng ký tài khoản tự do theo chính sách quản trị. Vui lòng đăng nhập nếu bạn đã có tài khoản.'
                        : 'New user registrations are currently disabled by the system administrator. Please sign in if you already have an account.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('/login')}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer press-tactile"
                  >
                    {language === 'vi' ? 'Quay Lại Đăng Nhập' : 'Back to Sign In'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Họ và tên' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Tên đăng nhập' : 'Username'}
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. alex_agency"
                      className="w-full px-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@yourdomain.com"
                        className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Mật khẩu' : 'Password'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ít nhất 8 ký tự"
                        className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="agreeTerms" className="text-xs text-slate-600 cursor-pointer select-none">
                      {language === 'vi' ? 'Tôi đồng ý với Điều khoản dịch vụ & Chính sách bảo mật' : 'I agree to the Terms of Service & Privacy Policy'}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 press-tactile"
                  >
                    <span>{loading ? (language === 'vi' ? 'Đang tạo tài khoản...' : 'Creating account...') : (language === 'vi' ? 'Đăng ký tài khoản' : 'Create Account')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-[11px] font-medium text-slate-400">
                        {language === 'vi' ? 'Hoặc đăng ký nhanh bằng' : 'Or sign up with'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => socialLogin('google')}
                      className="group flex items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white h-10 px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all cursor-pointer press-tactile"
                    >
                      <GoogleIcon />
                      <span>Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => socialLogin('facebook')}
                      className="group flex items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white h-10 px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all cursor-pointer press-tactile"
                    >
                      <FacebookIcon />
                      <span>Facebook</span>
                    </button>
                  </div>

                  <div className="text-center pt-2 text-xs text-slate-600">
                    {language === 'vi' ? 'Đã có tài khoản?' : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentRoute('/login')}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {language === 'vi' ? 'Đăng nhập ngay' : 'Sign In'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {resetSent ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center space-y-2.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-emerald-900">Check Your Inbox</h3>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    We've dispatched a secure password reset link to <strong className="font-mono">{email}</strong>.
                  </p>
                  <button
                    onClick={() => setCurrentRoute('/login')}
                    className="mt-3 h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full cursor-pointer press-tactile"
                  >
                    Back to Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Registered Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex.morgan@nexussmm.io"
                        className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer press-tactile disabled:opacity-60"
                  >
                    {loading ? 'Sending Link...' : 'Send Password Reset Link'}
                  </button>

                  <div className="text-center text-xs text-slate-600">
                    <button
                      type="button"
                      onClick={() => setCurrentRoute('/login')}
                      className="font-bold text-slate-700 hover:underline cursor-pointer"
                    >
                      ← Back to Log In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <div className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!password || password.length < 8) {
                    addToast('error', language === 'vi' ? 'Mật khẩu mới phải có ít nhất 8 ký tự.' : 'New password must be at least 8 characters.');
                    return;
                  }
                  if (password !== confirmPassword) {
                    addToast('error', language === 'vi' ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
                    return;
                  }

                  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                  const token = urlParams?.get('token') || '';

                  if (!token) {
                    addToast('error', language === 'vi' ? 'Mã xác thực token không hợp lệ hoặc đã hết hạn.' : 'Verification token is invalid or expired.');
                    return;
                  }

                  setLoading(true);
                  try {
                    const res = await fetch('/api/auth/reset-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
                      body: JSON.stringify({ token, password }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      addToast('success', data.message || (language === 'vi' ? 'Mật khẩu đã được đổi thành công!' : 'Password reset successfully!'));
                      setCurrentRoute('/login');
                    } else {
                      addToast('error', data.message || (language === 'vi' ? 'Đặt lại mật khẩu thất bại.' : 'Password reset failed.'));
                    }
                  } catch (err: any) {
                    addToast('error', (language === 'vi' ? 'Lỗi kết nối máy chủ: ' : 'Server connection error: ') + err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Mật khẩu mới:' : 'New Password:'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 8 ký tự"
                      className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Xác nhận mật khẩu mới:' : 'Confirm New Password:'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 press-tactile"
                >
                  {loading
                    ? (language === 'vi' ? 'Đang cập nhật mật khẩu...' : 'Updating...')
                    : (language === 'vi' ? 'Cập Nhật Mật Khẩu Mới' : 'Set New Password')}
                </button>

                <div className="text-center text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('/login')}
                    className="font-bold text-slate-700 hover:underline cursor-pointer"
                  >
                    ← {language === 'vi' ? 'Quay lại Đăng nhập' : 'Back to Log In'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="text-center py-4 px-4 text-xs text-slate-400 border-t border-slate-200/80 space-y-1 relative z-10">
        <div>{language === 'vi' ? 'Kết nối bảo mật • Mã hóa SSL 256-bit' : 'Secure connection • 256-bit SSL encryption'}</div>
        {siteConfig?.footerCopyright && (
          <div
            className="text-[11px] text-slate-500"
            dangerouslySetInnerHTML={{ __html: siteConfig.footerCopyright }}
          />
        )}
      </div>
    </div>
  );
};
