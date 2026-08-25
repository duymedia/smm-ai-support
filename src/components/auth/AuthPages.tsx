import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../layout/Navbar';
import { Zap, Lock, Mail, User as UserIcon, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, KeyRound, Facebook } from 'lucide-react';

interface AuthPageProps {
  mode: 'login' | 'register' | 'forgot' | 'reset' | 'verify';
}

export const AuthPages: React.FC<AuthPageProps> = ({ mode }) => {
  const { login, register, socialLogin, setCurrentRoute, language, t, addToast } = useApp();

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast('error', 'Please enter your email address');
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
    if (!name || !email || !password) {
      addToast('error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      addToast('error', 'Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      addToast('error', 'Please accept the Terms of Service');
      return;
    }
    setLoading(true);
    await register(name, username, email, password);
    setLoading(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast('error', 'Please enter your email');
      return;
    }
    setLoading(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setResetSent(true);
    addToast('success', 'Reset instructions sent to your email.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20 mb-3">
              <Zap className="w-6 h-6 fill-current" />
            </div>

            {mode === 'login' && (
              <>
                <h1 className="text-xl font-bold text-slate-900">{language === 'vi' ? 'Đăng nhập' : 'Sign in'}</h1>
                <p className="text-xs text-slate-500 mt-1">{language === 'vi' ? 'Quản lý dịch vụ, đơn hàng và hoạt động của bạn.' : 'Manage your services, orders, and operations.'}</p>
              </>
            )}

            {mode === 'register' && (
              <>
                <h1 className="text-xl font-bold text-slate-900">Create SMM Panel Account</h1>
                <p className="text-xs text-slate-500 mt-1">Get started with a free $15.00 wallet welcome bonus.</p>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <h1 className="text-xl font-bold text-slate-900">Reset Your Password</h1>
                <p className="text-xs text-slate-500 mt-1">Enter your registered email to receive reset instructions.</p>
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
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={language === 'vi' ? 'Nhập email hoặc tên đăng nhập' : 'Enter email or username'}
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-800"
                    >
                      {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span>{loading ? (language === 'vi' ? 'Đang xác thực...' : 'Authenticating...') : (language === 'vi' ? 'Đăng nhập vào Bảng điều khiển' : 'Sign In to Dashboard')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{language === 'vi' ? 'Hoặc tiếp tục với' : 'Or continue with'}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => socialLogin('google')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    <span aria-hidden="true" className="text-[17px] font-bold leading-none" style={{ fontFamily: 'Arial, sans-serif', background: 'conic-gradient(from -45deg, #4285f4 0deg 90deg, #34a853 90deg 180deg, #fbbc05 180deg 270deg, #ea4335 270deg 360deg)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>G</span>
                    {language === 'vi' ? 'Đăng nhập bằng Google' : 'Sign in with Google'}
                  </button>
                  <button type="button" onClick={() => socialLogin('facebook')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    <Facebook className="h-4 w-4 fill-blue-600 text-blue-600" /> Facebook
                  </button>
                </div>

                <div className="text-center pt-2 text-xs text-slate-600">
                  {language === 'vi' ? 'Chưa có tài khoản?' : "Don't have an account yet?"}{' '}
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('/register')}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    {language === 'vi' ? 'Tạo tài khoản ngay' : 'Create Account'}
                  </button>
                </div>
              </form>

              {showTwoFactorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setShowTwoFactorModal(false)}>
                  <form onSubmit={handleTwoFactorSubmit} onClick={event => event.stopPropagation()} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
                    <div className="text-center">
                      <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-blue-600" />
                      <h2 className="text-lg font-bold text-slate-900">{language === 'vi' ? 'Xác thực 2FA' : 'Two-Factor Authentication'}</h2>
                      <p className="mt-2 text-sm leading-5 text-slate-500">{language === 'vi' ? 'Mở Google Authenticator hoặc Authy và nhập mã 6 số để hoàn tất đăng nhập.' : 'Open Google Authenticator or Authy and enter the 6-digit code to finish signing in.'}</p>
                    </div>
                    <input autoFocus type="text" inputMode="numeric" maxLength={6} value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={language === 'vi' ? 'Nhập mã 6 số' : 'Enter 6-digit code'} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center font-mono text-lg tracking-[0.35em] focus:border-blue-600 focus:bg-white focus:outline-none" />
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowTwoFactorModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">{language === 'vi' ? 'Hủy' : 'Cancel'}</button>
                      <button type="submit" disabled={loading || twoFactorCode.length !== 6} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? '...' : (language === 'vi' ? 'Xác thực' : 'Verify')}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <div>
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Họ và tên' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@yourdomain.com"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Mật khẩu' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-slate-600">
                    {language === 'vi' ? 'Tôi đồng ý với Điều khoản dịch vụ & Chính sách bảo mật' : 'I agree to the Terms of Service & Privacy Policy'}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span>{loading ? (language === 'vi' ? 'Đang tạo tài khoản...' : 'Creating Account...') : (language === 'vi' ? 'Đăng ký & Nhận $15 Khuyến mãi' : 'Register & Claim $15 Credit')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2 text-xs text-slate-600">
                  {language === 'vi' ? 'Đã có tài khoản?' : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('/login')}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    {language === 'vi' ? 'Đăng nhập ngay' : 'Sign In'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {resetSent ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-emerald-900">Check Your Inbox</h3>
                  <p className="text-xs text-emerald-700">
                    We've dispatched a secure password reset link to <strong>{email}</strong>.
                  </p>
                  <button
                    onClick={() => setCurrentRoute('/login')}
                    className="mt-3 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                  >
                    Back to Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Registered Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex.morgan@nexussmm.io"
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {loading ? 'Sending Link...' : 'Send Password Reset Link'}
                  </button>

                  <div className="text-center text-xs text-slate-600">
                    <button
                      type="button"
                      onClick={() => setCurrentRoute('/login')}
                      className="font-bold text-slate-700 hover:underline"
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
                    addToast('error', 'Mật khẩu mới phải có ít nhất 8 ký tự.');
                    return;
                  }
                  if (password !== confirmPassword) {
                    addToast('error', 'Mật khẩu xác nhận không khớp.');
                    return;
                  }

                  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                  const token = urlParams?.get('token') || '';

                  if (!token) {
                    addToast('error', 'Mã xác thực token không hợp lệ hoặc đã hết hạn.');
                    return;
                  }

                  setLoading(true);
                  try {
                    const res = await fetch('/api/auth/reset-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token, password }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      addToast('success', data.message || 'Mật khẩu đã được đổi thành công!');
                      setCurrentRoute('/login');
                    } else {
                      addToast('error', data.message || 'Đặt lại mật khẩu thất bại.');
                    }
                  } catch (err: any) {
                    addToast('error', 'Lỗi kết nối máy chủ: ' + err.message);
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
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 8 ký tự"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Xác nhận mật khẩu mới:' : 'Confirm New Password:'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? (language === 'vi' ? 'Đang cập nhật mật khẩu...' : 'Updating...')
                    : (language === 'vi' ? 'Cập Nhật Mật Khẩu Mới' : 'Set New Password')}
                </button>

                <div className="text-center text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('/login')}
                    className="font-bold text-slate-700 hover:underline"
                  >
                    ← {language === 'vi' ? 'Quay lại Đăng nhập' : 'Back to Log In'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="text-center py-4 text-xs text-slate-400 border-t border-slate-200">
        {language === 'vi' ? 'Kết nối bảo mật • Mã hóa SSL 256-bit' : 'Secure connection • 256-bit SSL encryption'}
      </div>
    </div>
  );
};
