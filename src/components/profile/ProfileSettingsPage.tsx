import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Key,
  ShieldCheck,
  Bell,
  Globe,
  Copy,
  RefreshCw,
  CheckCircle2,
  Lock,
  Mail,
} from 'lucide-react';

export const ProfileSettingsPage: React.FC = () => {
  const { user, language, setLanguage, currency, setCurrency, addToast, t, updateProfile } = useApp();

  const [name, setName] = useState(user?.name || 'Alex Morgan');
  const [email, setEmail] = useState(user?.email || 'alex.morgan@nexussmm.io');
  const [apiKey, setApiKey] = useState(user?.apiKey || 'nexus_sk_94827104928174928104');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [notifyLowBalance, setNotifyLowBalance] = useState(true);
  const [notifyOrderStalled, setNotifyOrderStalled] = useState(true);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    addToast('success', 'API Key copied to clipboard.');
  };

  const handleRegenerateKey = async () => {
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
        addToast('success', data.message || 'New API Key generated.');
      }
    } catch {
      addToast('error', 'Failed to rotate API Key');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile({ name, email, language });
    if (success) {
      addToast('success', 'Profile changes saved successfully.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">{t('profile.title')}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{t('profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center overflow-hidden ring-4 ring-blue-50 shadow-md">
            {user?.avatar ? (
              <img src={user.avatar} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500">{email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              {user?.role === 'admin' ? 'Super Administrator' : 'Agency Owner'}
            </span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                >
                  <option value="en">English (EN)</option>
                  <option value="vi">Tiếng Việt (VI)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                >
                  <option value="USD">USD ($)</option>
                  <option value="VND">VND (₫)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
            >
              {t('profile.saveChanges')}
            </button>
          </form>
        </div>
      </div>

      {/* API Key Management */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-blue-600" />
            <span>Developer SMM v2 API Key</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Use this key to programmatically automate orders and check balance via REST API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={apiKey}
            className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 select-all"
          />
          <button
            onClick={handleCopyApiKey}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
          <button
            onClick={handleRegenerateKey}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </button>
        </div>
      </div>

      {/* Security & 2FA */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security & Two-Factor Authentication</span>
        </h3>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="font-bold text-slate-900 block">Two-Factor Authentication (2FA)</span>
            <span className="text-[11px] text-slate-500">Require an authenticator code when logging in</span>
          </div>
          <button
            onClick={() => {
              setTwoFactorEnabled(!twoFactorEnabled);
              addToast('success', `2FA ${!twoFactorEnabled ? 'enabled' : 'disabled'}.`);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
              twoFactorEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>
    </div>
  );
};
