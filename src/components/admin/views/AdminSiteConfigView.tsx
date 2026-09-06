import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { SiteFrontendConfig } from '../../../types';
import { RichTextEditor } from '../../ui/RichTextEditor';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { PageHeader } from '../../ui/PageHeader';
import { Modal } from '../../ui/Modal';
import {
  Palette,
  Globe,
  Settings,
  Save,
  RefreshCw,
  Code,
  Phone,
  Mail,
  Send,
  Server,
  Lock,
  ShieldCheck,
  Users,
  X,
  Search,
  ChevronDown,
  CheckSquare,
  Square,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  FileCode,
  Layers,
  CheckCircle2,
  Sliders,
  Calendar,
  Clock
} from 'lucide-react';

const PRESET_BRAND_COLORS = [
  { name: 'Royal Blue', color: '#2563eb', border: '#93c5fd' },
  { name: 'Deep Indigo', color: '#4f46e5', border: '#c7d2fe' },
  { name: 'Emerald Forest', color: '#059669', border: '#a7f3d0' },
  { name: 'Violet Purple', color: '#7c3aed', border: '#ddd6fe' },
  { name: 'Crimson Rose', color: '#e11d48', border: '#fecdd3' },
  { name: 'Amber Sunset', color: '#d97706', border: '#fde68a' },
  { name: 'Ocean Cyan', color: '#0891b2', border: '#a5f3fc' },
  { name: 'Midnight Slate', color: '#334155', border: '#cbd5e1' },
];

export const AdminSiteConfigView: React.FC = () => {
  const { language, addToast, setSiteConfig, applyBrandTheme, applySeoAndHeaderConfig } = useApp();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteFrontendConfig>({
    siteName: 'NexusSMM Enterprise',
    siteTagline: 'Nền Tảng Cho Thuê & Vận Hành SMM Panel Tự Động Hóa AI',
    siteLogoUrl: '',
    faviconUrl: '',
    primaryBrandColor: '#2563eb',
    supportEmail: 'support@nexussmm.io',
    supportTelegram: '@nexussmm_support',
    supportHotline: '0988889999',
    allowUserRegistration: true,
    allowFreeTrialPanel: true,
    freeTrialDurationDays: 7,
    freeTrialMaxPerUser: 1,
    freeTrialStartDate: '',
    freeTrialEndDate: '',
    freeTrialRequireVerification: false,
    allowGuestServiceViewing: true,
    enableLiveChatWidget: true,
    headerAnnouncementBar: '🔥 Chào mừng quý khách đến với nền tảng NexusSMM. Tự động hóa vận hành Panel 24/7 với AI điều phối.',
    headerAnnouncementActive: true,
    footerCopyright: '© 2026 NexusSMM SaaS Platform. All Rights Reserved.',
    seoMetaTitle: 'NexusSMM - Thuê Panel SMM & Dịch Vụ Mạng Xã Hội Tự Động',
    seoMetaKeywords: 'smm panel, thue smm panel, mua follow, tang like, smm api, ai smm support',
    seoMetaDescription: 'Khởi tạo và vận hành hệ thống SMM Panel riêng biệt của bạn chỉ trong 60 giây với hạ tầng đám mây tối ưu và AI điều phối đơn hàng 24/7.',
    seoCanonicalUrl: 'https://nexussmm.io',
    seoOgImageUrl: 'https://nexussmm.io/og-preview.png',
    seoGoogleSiteVerification: '',
    seoGoogleAnalyticsId: '',
    customCss: '',
    customHeaderScripts: '',
    customBodyScripts: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    smtpFromEmail: 'noreply@nexussmm.io',
    smtpFromName: 'NexusSMM Enterprise',
  });

  // SMTP Dispatcher & Select2 Recipient state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['ALL']);
  const [isSelect2Open, setIsSelect2Open] = useState(false);
  const [select2Search, setSelect2Search] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [usersList, setUsersList] = useState<{ id: string; name: string; email: string; username: string }[]>([]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/site-config');
        const data = await res.json();
        if (data.success && data.data) {
          setConfig(data.data);
          applyBrandTheme(data.data.primaryBrandColor);
          applySeoAndHeaderConfig(data.data);
        }
      } catch {
        addToast('error', 'Không thể tải cấu hình hệ thống');
      }
    };
    loadConfig();

    // Fetch users for Select2 email dispatcher
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setUsersList(d.data);
        }
      })
      .catch(() => {});
  }, []);

  const isSelectAll = selectedRecipients.includes('ALL') || (usersList.length > 0 && selectedRecipients.length === usersList.length);

  const toggleSelectAll = () => {
    if (isSelectAll) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(['ALL']);
    }
  };

  const toggleUserRecipient = (userId: string) => {
    if (selectedRecipients.includes('ALL')) {
      const newSelected = usersList.map((u) => u.id).filter((id) => id !== userId);
      setSelectedRecipients(newSelected);
      return;
    }

    if (selectedRecipients.includes(userId)) {
      const newSelected = selectedRecipients.filter((id) => id !== userId);
      setSelectedRecipients(newSelected);
    } else {
      const newSelected = [...selectedRecipients, userId];
      if (newSelected.length === usersList.length && usersList.length > 0) {
        setSelectedRecipients(['ALL']);
      } else {
        setSelectedRecipients(newSelected);
      }
    }
  };

  const handleTestSmtp = async () => {
    if (!config.smtpHost || !config.smtpUsername || !config.smtpPassword) {
      addToast('error', 'Vui lòng nhập đầy đủ Máy chủ SMTP, Tài khoản và Mật khẩu trước khi thử nghiệm!');
      return;
    }
    setTestingSmtp(true);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType: 'test',
          subject: '🧪 [Test SMTP] Kiểm Tra Kết Nối Gửi Email Thành Công',
          htmlContent: '<h3>Xin chào Quản trị viên!</h3><p>Cấu hình máy chủ SMTP của bạn trên hệ thống <b>NexusSMM</b> đã kết nối và hoạt động chính xác 100%.</p><p>Hệ thống hiện đã sẵn sàng để gửi email xác thực, reset mật khẩu và chiến dịch email marketing.</p>',
          customSmtp: config,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Kết nối SMTP thành công! Đã gửi email thử nghiệm.');
      } else {
        addToast('error', data.message || 'Lỗi kết nối SMTP');
      }
    } catch {
      addToast('error', 'Không thể kết nối đến máy chủ SMTP');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSendDispatchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim()) {
      addToast('error', 'Vui lòng nhập tiêu đề email!');
      return;
    }
    if (!emailBody.trim() || emailBody === '<p></p>') {
      addToast('error', 'Vui lòng soạn thảo nội dung email!');
      return;
    }
    if (selectedRecipients.length === 0) {
      addToast('error', 'Vui lòng chọn ít nhất một khách hàng nhận email từ danh sách Select2!');
      return;
    }

    setSendingEmail(true);
    try {
      const isAll = selectedRecipients.includes('ALL');
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType: isAll ? 'all' : 'selected',
          targetUserIds: isAll ? undefined : selectedRecipients,
          subject: emailSubject,
          htmlContent: emailBody,
          customSmtp: config,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || 'Đã gửi email thành công!');
        setIsEmailModalOpen(false);
        setEmailSubject('');
        setEmailBody('');
      } else {
        addToast('error', data.message || 'Gửi email thất bại');
      }
    } catch {
      addToast('error', 'Lỗi hệ thống khi gửi email qua SMTP');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleColorChange = (newColor: string) => {
    setConfig((prev) => ({ ...prev, primaryBrandColor: newColor }));
    applyBrandTheme(newColor);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setSiteConfig(config);
        applyBrandTheme(config.primaryBrandColor);
        applySeoAndHeaderConfig(config);
        addToast('success', data.message || 'Lưu cấu hình giao diện và Chuẩn SEO thành công!');
      }
    } catch {
      addToast('error', 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={language === 'vi' ? 'Cấu Hình Giao Diện & Thương Hiệu' : 'User Frontend & Branding Master Setup'}
        description={
          language === 'vi'
            ? 'Tùy biến thương hiệu, logo, thanh thông báo đầu trang, chính sách khách hàng, SMTP và SEO cho toàn bộ trang của người dùng.'
            : 'Customize branding, logo, announcement marquee, support channels, registration policies, and SEO tags for the user portal.'
        }
        badge={
          <Badge variant="brand" pulse>
            SaaS Core v2.4
          </Badge>
        }
        actions={
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            {saving ? (language === 'vi' ? 'Đang Lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu Thay Đổi Setup' : 'Save Configuration')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Brand & SEO Setup */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brand Identity */}
          <Card
            macChrome
            macTitle="BRAND_IDENTITY // THEME & LOGO"
            macBadge={<Badge variant="blue" size="sm">Theme Engine</Badge>}
            className="p-6 space-y-5"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Globe className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                Thương Hiệu &amp; Logo Khách Hàng
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tên Nền Tảng (Site Name)</label>
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Khẩu Hiệu (Tagline)</label>
                <input
                  type="text"
                  value={config.siteTagline}
                  onChange={(e) => setConfig({ ...config, siteTagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">URL Logo Hình Ảnh</label>
                <input
                  type="text"
                  value={config.siteLogoUrl}
                  onChange={(e) => setConfig({ ...config, siteLogoUrl: e.target.value })}
                  placeholder="https://example.com/logo.svg"
                  className="w-full px-3.5 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Favicon URL</label>
                <input
                  type="text"
                  value={config.faviconUrl || ''}
                  onChange={(e) => setConfig({ ...config, faviconUrl: e.target.value })}
                  placeholder="https://example.com/favicon.ico"
                  className="w-full px-3.5 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>

              {/* Color Scheme Picker */}
              <div className="space-y-3 sm:col-span-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Màu Sắc Chủ Đạo Toàn Hệ Thống (Brand Color)</span>
                </label>

                {/* Input chọn màu tùy chỉnh */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={config.primaryBrandColor || '#2563eb'}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-10 h-10 rounded-full bg-transparent border-0 cursor-pointer p-0 shadow-sm"
                    />
                  </div>
                  <input
                    type="text"
                    value={config.primaryBrandColor || '#2563eb'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-36 px-4 py-2 rounded-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 font-mono tabular-nums font-bold focus-ring transition-colors uppercase"
                    placeholder="#2563EB"
                  />
                  <span className="text-xs text-slate-500">Mã màu HEX thương hiệu chính</span>
                </div>

                {/* 8 Preset Colors */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-medium text-slate-500 block">
                    Bảng màu chuẩn thiết kế Open-Design (Nhấp để áp dụng ngay):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_BRAND_COLORS.map((preset) => {
                      const isSelected =
                        (config.primaryBrandColor || '').toLowerCase() === preset.color.toLowerCase();
                      return (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() => handleColorChange(preset.color)}
                          className={`flex items-center gap-2 p-2 rounded-full border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50/80 hover:bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full shadow-2xs shrink-0 border border-white"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span className="text-[11px] font-semibold truncate">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 backdrop-blur-sm space-y-3 mt-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                    Xem trước thành phần giao diện (Open-Design Tokens Live):
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      style={{ backgroundColor: config.primaryBrandColor || '#2563eb' }}
                      className="px-4 py-2 rounded-full text-white text-xs font-semibold shadow-sm cursor-default"
                    >
                      + Thuê Panel Mới
                    </button>
                    <button
                      type="button"
                      style={{ backgroundColor: config.primaryBrandColor || '#2563eb' }}
                      className="px-4 py-2 rounded-full text-white text-xs font-semibold shadow-sm cursor-default"
                    >
                      Nạp Tiền
                    </button>
                    <span
                      style={{
                        backgroundColor: `rgba(${parseInt((config.primaryBrandColor || '#2563eb').slice(1,3), 16) || 37}, ${parseInt((config.primaryBrandColor || '#2563eb').slice(3,5), 16) || 99}, ${parseInt((config.primaryBrandColor || '#2563eb').slice(5,7), 16) || 235}, 0.1)`,
                        color: config.primaryBrandColor || '#2563eb',
                        borderColor: `rgba(${parseInt((config.primaryBrandColor || '#2563eb').slice(1,3), 16) || 37}, ${parseInt((config.primaryBrandColor || '#2563eb').slice(3,5), 16) || 99}, ${parseInt((config.primaryBrandColor || '#2563eb').slice(5,7), 16) || 235}, 0.3)`
                      }}
                      className="px-3 py-1 rounded-full text-xs font-semibold border cursor-default"
                    >
                      Tab Đang Chọn (Active)
                    </span>
                    <span
                      style={{
                        background: `linear-gradient(135deg, ${config.primaryBrandColor || '#2563eb'}, #0f172a)`
                      }}
                      className="px-3.5 py-1 rounded-full text-white text-xs font-semibold cursor-default shadow-xs"
                    >
                      Brand Pill Badge
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Announcement Marquee Bar */}
          <Card
            macChrome
            macTitle="HEADLINE_MARQUEE // LIVE ANNOUNCEMENT"
            macBadge={
              <Badge
                variant={config.headerAnnouncementActive ? 'emerald' : 'slate'}
                pulse={config.headerAnnouncementActive}
                size="sm"
              >
                {config.headerAnnouncementActive ? 'Marquee Active' : 'Marquee Muted'}
              </Badge>
            }
            className="p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                  Thanh Thông Báo Chạy Chữ Đầu Trang
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, headerAnnouncementActive: !config.headerAnnouncementActive })}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <span>{config.headerAnnouncementActive ? 'Đang Bật' : 'Đang Tắt'}</span>
                {config.headerAnnouncementActive ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Nội Dung Thông Báo Nổi Bật</label>
              <input
                type="text"
                value={config.headerAnnouncementBar}
                onChange={(e) => setConfig({ ...config, headerAnnouncementBar: e.target.value })}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                placeholder="VD: 🔥 Khuyến mãi nạp ví tặng 10% qua VietQR tự động..."
              />
            </div>
          </Card>

          {/* SEO Meta Configuration */}
          <Card
            macChrome
            macTitle="SEO_ENGINE // META TAGS & ANALYTICS"
            macBadge={<Badge variant="purple" size="sm">Search Rank</Badge>}
            className="p-6 space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Code className="w-4 h-4 text-purple-600" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                Cấu Hình SEO Google &amp; Meta Tags
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Tiêu Đề Trang (SEO Meta Title)</label>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                    {(config.seoMetaTitle || '').length} / 65 ký tự
                  </span>
                </div>
                <input
                  type="text"
                  value={config.seoMetaTitle || ''}
                  onChange={(e) => setConfig({ ...config, seoMetaTitle: e.target.value })}
                  placeholder="VD: NexusSMM - Thuê Panel SMM & Cung Cấp Dịch Vụ Mạng Xã Hội Tự Động"
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Từ Khóa Tìm Kiếm (SEO Meta Keywords)</label>
                <input
                  type="text"
                  value={config.seoMetaKeywords || ''}
                  onChange={(e) => setConfig({ ...config, seoMetaKeywords: e.target.value })}
                  placeholder="smm panel, thue smm panel, mua follow, tang like, smm api"
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Mô Tả Trang Web (Meta Description)</label>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                    {(config.seoMetaDescription || '').length} / 160 ký tự
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={config.seoMetaDescription || ''}
                  onChange={(e) => setConfig({ ...config, seoMetaDescription: e.target.value })}
                  placeholder="Khởi tạo và vận hành hệ thống SMM Panel riêng biệt của bạn chỉ trong 60 giây..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Đường Dẫn Chuẩn (Canonical URL)</label>
                  <input
                    type="text"
                    value={config.seoCanonicalUrl || ''}
                    onChange={(e) => setConfig({ ...config, seoCanonicalUrl: e.target.value })}
                    placeholder="https://nexussmm.io"
                    className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Ảnh Chia Sẻ MXH (OG:Image URL)</label>
                  <input
                    type="text"
                    value={config.seoOgImageUrl || ''}
                    onChange={(e) => setConfig({ ...config, seoOgImageUrl: e.target.value })}
                    placeholder="https://nexussmm.io/og-preview.png"
                    className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mã Xác Minh Search Console</label>
                  <input
                    type="text"
                    value={config.seoGoogleSiteVerification || ''}
                    onChange={(e) => setConfig({ ...config, seoGoogleSiteVerification: e.target.value })}
                    placeholder="google-site-verification token..."
                    className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Google Analytics (GA4 ID)</label>
                  <input
                    type="text"
                    value={config.seoGoogleAnalyticsId || ''}
                    onChange={(e) => setConfig({ ...config, seoGoogleAnalyticsId: e.target.value })}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Policies, Support & SMTP */}
        <div className="space-y-6">
          {/* User Registration & Access Policies */}
          <Card
            macChrome
            macTitle="ACCESS_POLICIES // REGISTRATION & TRIAL"
            macBadge={<Badge variant="amber" size="sm">IAM Policies</Badge>}
            className="p-6 space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Settings className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                Chính Sách Khách Hàng
              </h2>
            </div>

            <div className="space-y-4 divide-y divide-slate-100 text-xs">
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Cho phép Đăng Ký mới</p>
                  <p className="text-[11px] text-slate-500">Mở cổng tạo tài khoản tự do cho khách</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, allowUserRegistration: !config.allowUserRegistration })}
                  className="cursor-pointer"
                >
                  {config.allowUserRegistration ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Gói dùng thử miễn phí (Free Trial)</p>
                    <p className="text-[11px] text-slate-500">Cho phép người dùng trải nghiệm panel miễn phí</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, allowFreeTrialPanel: !config.allowFreeTrialPanel })}
                    className="cursor-pointer"
                  >
                    {config.allowFreeTrialPanel ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </div>

                {config.allowFreeTrialPanel && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Duration days */}
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 block">Thời hạn (Ngày)</label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={config.freeTrialDurationDays || 7}
                          onChange={(e) => setConfig({ ...config, freeTrialDurationDays: parseInt(e.target.value) || 7 })}
                          className="w-full px-3 py-1.5 rounded-full border border-slate-200 bg-white font-mono tabular-nums text-xs"
                        />
                      </div>

                      {/* Max per user */}
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 block">Tối đa / Khách (Gói)</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={config.freeTrialMaxPerUser || 1}
                          onChange={(e) => setConfig({ ...config, freeTrialMaxPerUser: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-1.5 rounded-full border border-slate-200 bg-white font-mono tabular-nums text-xs"
                        />
                      </div>
                    </div>

                    {/* Date range */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 block">Áp dụng từ</label>
                        <input
                          type="date"
                          value={config.freeTrialStartDate ? config.freeTrialStartDate.slice(0, 10) : ''}
                          onChange={(e) => setConfig({ ...config, freeTrialStartDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className="w-full px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 block">Áp dụng tới</label>
                        <input
                          type="date"
                          value={config.freeTrialEndDate ? config.freeTrialEndDate.slice(0, 10) : ''}
                          onChange={(e) => setConfig({ ...config, freeTrialEndDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className="w-full px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Require email verification */}
                    <div className="pt-2 border-t border-blue-100/70 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 text-xs block">Yêu cầu xác thực</span>
                        <span className="text-[10px] text-slate-500">Chỉ cấp trial cho email đã xác minh</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, freeTrialRequireVerification: !config.freeTrialRequireVerification })}
                        className="cursor-pointer"
                      >
                        {config.freeTrialRequireVerification ? (
                          <ToggleRight className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Bật Widget Live Chat</p>
                  <p className="text-[11px] text-slate-500">Hiển thị widget chat hỗ trợ góc phải</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, enableLiveChatWidget: !config.enableLiveChatWidget })}
                  className="cursor-pointer"
                >
                  {config.enableLiveChatWidget ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Support Channels */}
          <Card
            macChrome
            macTitle="DESK_CHANNELS // CUSTOMER SUPPORT"
            macBadge={<Badge variant="emerald" size="sm">24/7 Desk</Badge>}
            className="p-6 space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Phone className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                Kênh Chăm Sóc Khách Hàng
              </h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Hỗ Trợ</span>
                </label>
                <input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>Telegram CSKH / Bot</span>
                </label>
                <input
                  type="text"
                  value={config.supportTelegram}
                  onChange={(e) => setConfig({ ...config, supportTelegram: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hotline / Zalo</span>
                </label>
                <input
                  type="text"
                  value={config.supportHotline}
                  onChange={(e) => setConfig({ ...config, supportHotline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>
            </div>
          </Card>

          {/* Transactional SMTP Email Setup */}
          <Card
            macChrome
            macTitle="SMTP_ENGINE // TRANSACTIONAL DISPATCHER"
            macBadge={
              <Badge
                variant={config.smtpHost ? 'emerald' : 'amber'}
                pulse={!!config.smtpHost}
                size="sm"
              >
                {config.smtpHost ? 'SMTP Ready' : 'Unconfigured'}
              </Badge>
            }
            className="p-6 space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Server className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                Cấu Hình SMTP Gửi Mail
              </h2>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Máy Chủ SMTP</label>
                  <input
                    type="text"
                    value={config.smtpHost || ''}
                    onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3.5 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 font-mono focus-ring transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Cổng (Port)</label>
                  <input
                    type="number"
                    value={config.smtpPort || 587}
                    onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    className="w-full px-3.5 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 font-mono tabular-nums focus-ring transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Giao Thức Mã Hóa</label>
                <select
                  value={config.smtpEncryption || 'tls'}
                  onChange={(e) => setConfig({ ...config, smtpEncryption: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                >
                  <option value="tls">TLS (Mặc định - Cổng 587)</option>
                  <option value="ssl">SSL (Cổng 465)</option>
                  <option value="none">Không mã hóa (None - Cổng 25)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tài Khoản Gửi (SMTP User)</span>
                </label>
                <input
                  type="text"
                  value={config.smtpUsername || ''}
                  onChange={(e) => setConfig({ ...config, smtpUsername: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full px-3.5 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mật Khẩu / App Password</span>
                </label>
                <input
                  type="password"
                  value={config.smtpPassword || ''}
                  onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
                />
              </div>

              {/* SMTP Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={testingSmtp}
                  onClick={handleTestSmtp}
                  className="flex-1"
                  icon={!testingSmtp ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : undefined}
                >
                  {testingSmtp ? 'Đang thử...' : 'Thử Kết Nối'}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="flex-1"
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Soạn &amp; Gửi Mail
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 3 CUSTOM CODE BLOCKS: CSS, HEADER SCRIPTS, BODY SCRIPTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Custom CSS */}
        <Card
          macChrome
          macTitle="CUSTOM_CSS // OVERRIDE"
          macBadge={<Badge variant="blue" size="sm"><Code className="w-3 h-3 inline mr-1" />CSS</Badge>}
          className="p-5 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <label className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <span>Mã CSS Tùy Chỉnh</span>
            </label>

            {(config.customCss || '').trim() !== '' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfig((prev) => ({ ...prev, customCss: '' }))}
                className="text-[10px] h-6 px-2.5"
              >
                Xóa
              </Button>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono tabular-nums text-slate-400">
              <span className="text-slate-300 font-semibold">&lt;style&gt; CSS</span>
              <span>{(config.customCss || '').split('\n').length} dòng</span>
            </div>
            <textarea
              rows={7}
              value={config.customCss || ''}
              onChange={(e) => setConfig({ ...config, customCss: e.target.value })}
              placeholder="/* Nhập CSS tùy biến giao diện... */"
              className="w-full p-3.5 bg-slate-950 text-blue-400 font-mono text-xs focus:outline-hidden resize-y leading-relaxed"
              style={{ minHeight: '160px' }}
            />
          </div>
        </Card>

        {/* 2. Custom Header Scripts (<head>) */}
        <Card
          macChrome
          macTitle="HEADER_SCRIPTS // HEAD INJECTION"
          macBadge={<Badge variant="purple" size="sm"><Code className="w-3 h-3 inline mr-1" />&lt;head&gt;</Badge>}
          className="p-5 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <label className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <span>Mã Nhúng &lt;head&gt;</span>
            </label>

            {(config.customHeaderScripts || '').trim() !== '' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfig((prev) => ({ ...prev, customHeaderScripts: '' }))}
                className="text-[10px] h-6 px-2.5"
              >
                Xóa
              </Button>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono tabular-nums text-slate-400">
              <span className="text-slate-300 font-semibold">&lt;head&gt; Scripts &amp; Meta</span>
              <span>{(config.customHeaderScripts || '').split('\n').length} dòng</span>
            </div>
            <textarea
              rows={7}
              value={config.customHeaderScripts || ''}
              onChange={(e) => setConfig({ ...config, customHeaderScripts: e.target.value })}
              placeholder="<!-- Google Tag Manager, Pixel, Meta... -->"
              className="w-full p-3.5 bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-hidden resize-y leading-relaxed"
              style={{ minHeight: '160px' }}
            />
          </div>
        </Card>

        {/* 3. Custom Body Scripts (End of <body>) */}
        <Card
          macChrome
          macTitle="BODY_SCRIPTS // FOOTER INJECTION"
          macBadge={<Badge variant="amber" size="sm"><Code className="w-3 h-3 inline mr-1" />&lt;body&gt;</Badge>}
          className="p-5 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <label className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <span>Mã Nhúng &lt;body&gt;</span>
            </label>

            {(config.customBodyScripts || '').trim() !== '' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfig((prev) => ({ ...prev, customBodyScripts: '' }))}
                className="text-[10px] h-6 px-2.5"
              >
                Xóa
              </Button>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono tabular-nums text-slate-400">
              <span className="text-slate-300 font-semibold">End of &lt;body&gt; Scripts</span>
              <span>{(config.customBodyScripts || '').split('\n').length} dòng</span>
            </div>
            <textarea
              rows={7}
              value={config.customBodyScripts || ''}
              onChange={(e) => setConfig({ ...config, customBodyScripts: e.target.value })}
              placeholder="<!-- Script chạy cuối trang body... -->"
              className="w-full p-3.5 bg-slate-950 text-amber-400 font-mono text-xs focus:outline-hidden resize-y leading-relaxed"
              style={{ minHeight: '160px' }}
            />
          </div>
        </Card>
      </div>

      {/* FULL-WIDTH SECTION: Footer Copyright with WYSIWYG Rich Editor */}
      <Card
        macChrome
        macTitle="LEGAL_FOOTER // COPYRIGHT WYSIWYG"
        macBadge={<Badge variant="slate" size="sm">Legal Notes</Badge>}
        className="p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold block">
            Dòng Bản Quyền Chân Trang (Footer Copyright)
          </label>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                footerCopyright: '© 2026 NexusSMM SaaS Platform. All Rights Reserved.',
              }))
            }
            className="text-xs"
          >
            Khôi phục mặc định
          </Button>
        </div>

        {/* WYSIWYG Rich Editor */}
        <RichTextEditor
          value={config.footerCopyright || ''}
          onChange={(val) => setConfig({ ...config, footerCopyright: val })}
          placeholder="Nhập nội dung bản quyền chân trang..."
          minHeight="140px"
        />
      </Card>

      {/* MODAL SOẠN & GỬI EMAIL QUA SMTP */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Soạn & Gửi Email Qua SMTP"
        subtitle="Gửi thông báo, ưu đãi hoặc hỗ trợ trực tiếp tới người dùng"
        size="2xl"
      >
        <div className="space-y-4">
          {/* SELECT2: CHỌN TỪ DANH SÁCH KHÁCH HÀNG */}
          <div className="space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chọn từ Danh Sách Khách Hàng</span>
              </label>

              <Badge variant="brand" size="sm">
                {isSelectAll
                  ? `Tất cả (${usersList.length} khách hàng)`
                  : `Đã chọn: ${selectedRecipients.length} / ${usersList.length}`}
              </Badge>
            </div>

            {/* Select2 Container Box */}
            <div
              onClick={() => setIsSelect2Open(!isSelect2Open)}
              className="min-h-11 w-full px-3.5 py-2 rounded-2xl bg-slate-50/80 hover:bg-white focus-within:bg-white border border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 transition-all cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="flex flex-wrap items-center gap-1.5 flex-1 max-h-24 overflow-y-auto py-0.5">
                {isSelectAll ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-2xs animate-in fade-in">
                    <Users className="w-3.5 h-3.5" />
                    <span>📢 Tất Cả Khách Hàng ({usersList.length} tài khoản)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecipients([]);
                      }}
                      className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center ml-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : selectedRecipients.length > 0 ? (
                  selectedRecipients.map((uid) => {
                    const u = usersList.find((usr) => usr.id === uid);
                    if (!u) return null;
                    return (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium animate-in fade-in"
                      >
                        <span>{u.name || u.username} ({u.email})</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserRecipient(u.id);
                          }}
                          className="w-3.5 h-3.5 rounded-full hover:bg-indigo-200 flex items-center justify-center ml-0.5 cursor-pointer text-indigo-600"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400">
                    Nhấn để tìm kiếm và chọn khách hàng (hoặc chọn tất cả)...
                  </span>
                )}
              </div>

              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isSelect2Open ? 'rotate-180 text-indigo-600' : ''
                }`}
              />
            </div>

            {/* Select2 Dropdown Popover */}
            {isSelect2Open && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Search Bar inside Select2 */}
                <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={select2Search}
                      onChange={(e) => setSelect2Search(e.target.value)}
                      placeholder="Tìm nhanh theo tên, username hoặc email..."
                      autoFocus
                      className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-900 focus-ring"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="text-xs h-7 px-3"
                    >
                      {isSelectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </Button>
                  </div>
                </div>

                {/* Options List */}
                <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-50">
                  {/* Option: Select All Users */}
                  {select2Search.trim() === '' && (
                    <div
                      onClick={toggleSelectAll}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelectAll ? 'bg-indigo-50/80 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">📢 TẤT CẢ KHÁCH HÀNG</p>
                          <p className="text-[10px] text-slate-500 font-mono tabular-nums">
                            Gửi đồng loạt tới toàn bộ {usersList.length} tài khoản người dùng
                          </p>
                        </div>
                      </div>

                      {isSelectAll ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </div>
                  )}

                  {/* Filtered User List */}
                  {usersList
                    .filter((u) => {
                      if (!select2Search.trim()) return true;
                      const q = select2Search.toLowerCase();
                      return (
                        (u.name || '').toLowerCase().includes(q) ||
                        (u.username || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q)
                      );
                    })
                    .map((u) => {
                      const isSelected = isSelectAll || selectedRecipients.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleUserRecipient(u.id)}
                          className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50/60 text-indigo-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center uppercase">
                              {(u.name || u.username || 'U').charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{u.name || u.username}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                            </div>
                          </div>

                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </div>
                      );
                    })}

                  {usersList.filter((u) => {
                    if (!select2Search.trim()) return true;
                    const q = select2Search.toLowerCase();
                    return (
                      (u.name || '').toLowerCase().includes(q) ||
                      (u.username || '').toLowerCase().includes(q) ||
                      (u.email || '').toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Không tìm thấy khách hàng nào khớp với từ khóa "{select2Search}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Email Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Tiêu Đề Email</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Ví dụ: [NexusSMM] Thông báo nâng cấp hệ thống máy chủ & Khuyến mãi nạp tiền"
              className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
            />
          </div>

          {/* Email Body Rich Text Editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Nội Dung Email (Bộ Soạn Thảo WYSIWYG)</label>
            <RichTextEditor
              value={emailBody}
              onChange={setEmailBody}
              placeholder="Soạn thảo nội dung email gửi đến khách hàng..."
              minHeight="220px"
            />
          </div>

          {/* Footer inside Modal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              Máy chủ: <b className="text-slate-800">{config.smtpHost || 'Chưa thiết lập'}</b>
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsEmailModalOpen(false)}
              >
                Hủy Bỏ
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={sendingEmail}
                loading={sendingEmail}
                onClick={handleSendDispatchEmail}
                icon={<Send className="w-4 h-4" />}
              >
                {sendingEmail ? 'Đang gửi...' : 'Gửi Email Ngay'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </form>
  );
};
