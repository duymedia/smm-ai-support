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
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';

export const ProfileSettingsPage: React.FC = () => {
  const { user, language, setLanguage, currency, setCurrency, addToast, t, updateProfile } = useApp();

  const [name, setName] = useState(user?.name || 'Alex Morgan');
  const [email, setEmail] = useState(user?.email || 'alex.morgan@nexussmm.io');
  const [apiKey, setApiKey] = useState(user?.apiKey || 'nexus_sk_94827104928174928104');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      const success = await updateProfile({ name, email, language });
      if (success) {
        addToast('success', 'Profile changes saved successfully.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <PageHeader
        title={t('profile.title')}
        description={t('profile.subtitle')}
        badge={
          <Badge variant="brand" size="sm">
            {user?.role === 'admin' ? 'Super Administrator' : 'Agency Owner'}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card macChrome macTitle="Identity & Avatar" className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center overflow-hidden ring-4 ring-slate-100 shadow-md mb-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500 font-mono tabular-nums">{email}</p>
            <div className="mt-2">
              <Badge variant="brand" size="sm">
                {user?.role === 'admin' ? 'Super Administrator' : 'Agency Owner'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <Card macChrome macTitle="Personal Information">
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono tabular-nums transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-xs"
                  >
                    <option value="en">English (EN)</option>
                    <option value="vi">Tiếng Việt (VI)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-xs font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="VND">VND (₫)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  icon={saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                >
                  {t('profile.saveChanges')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* API Key Management */}
      <Card
        macChrome
        macTitle="Developer SMM v2 API Key"
        macBadge={<Badge variant="info" size="sm">REST v2</Badge>}
      >
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Use this key to programmatically automate orders and check balance via REST API.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={apiKey}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 select-all tabular-nums"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyApiKey}
            icon={<Copy className="w-3.5 h-3.5" />}
          >
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateKey}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Rotate
          </Button>
        </div>
      </Card>

      {/* Security & 2FA */}
      <Card
        macChrome
        macTitle="Security & Two-Factor Authentication"
        macBadge={
          <Badge variant={twoFactorEnabled ? 'emerald' : 'slate'} pulse={twoFactorEnabled} size="sm">
            {twoFactorEnabled ? 'PROTECTED' : 'UNPROTECTED'}
          </Badge>
        }
      >
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="font-bold text-slate-900 block text-xs">Two-Factor Authentication (2FA)</span>
            <span className="text-[11px] text-slate-500">Require an authenticator code when logging in</span>
          </div>
          <Button
            variant={twoFactorEnabled ? 'success' : 'secondary'}
            size="sm"
            onClick={() => {
              setTwoFactorEnabled(!twoFactorEnabled);
              addToast('success', `2FA ${!twoFactorEnabled ? 'enabled' : 'disabled'}.`);
            }}
          >
            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
