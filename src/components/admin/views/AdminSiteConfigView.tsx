import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { SiteFrontendConfig } from '../../../types';
import { RichTextEditor } from '../../ui/RichTextEditor';
import {
  Palette,
  Globe,
  Settings,
  Save,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Code,
  Phone,
  Mail,
  Send,
  Eye,
  Server,
  Lock,
  ShieldCheck,
  Users,
  Sparkles,
  X,
  Check,
  ArrowRight,
  Search,
  ChevronDown,
  CheckSquare,
  Square,
  UserCheck
} from 'lucide-react';

const PRESET_BRAND_COLORS = [
  { name: 'Royal Blue (Mặc định)', color: '#2563eb', border: '#93c5fd' },
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
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold">
              <Palette className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {language === 'vi' ? 'Cấu hình giao diện ' : 'User Frontend & Branding Master Setup'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {language === 'vi'
              ? 'Tùy biến thương hiệu, logo, thanh thông báo đầu trang, kênh hỗ trợ, bật/tắt đăng ký và SEO cho toàn bộ trang của khách hàng.'
              : 'Customize branding, logo, announcement marquee, support channels, registration policies, and SEO tags for the user portal.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
          <span>{saving ? 'Đang Lưu...' : 'Lưu Thay Đổi Setup'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Brand & Features Setup */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brand Identity */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Thương Hiệu & Logo Khách Hàng</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tên Nền Tảng (Site Name)</label>
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Khẩu Hiệu (Tagline)</label>
                <input
                  type="text"
                  value={config.siteTagline}
                  onChange={(e) => setConfig({ ...config, siteTagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">URL Logo Hình Ảnh</label>
                <input
                  type="text"
                  value={config.siteLogoUrl}
                  onChange={(e) => setConfig({ ...config, siteLogoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-3 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Màu Sắc Chủ Đạo Toàn Hệ Thống (Brand Color)</span>
                </label>

                {/* Input chọn màu tùy chỉnh */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={config.primaryBrandColor || '#2563eb'}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer p-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={config.primaryBrandColor || '#2563eb'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-36 px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-hidden focus:border-blue-500 transition-colors uppercase"
                    placeholder="#2563EB"
                  />
                  <span className="text-xs text-slate-500">
                    Mã màu HEX hiện tại
                  </span>
                </div>

                {/* 8 Bảng màu Preset đẹp chuẩn SaaS */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Bảng màu phổ biến (Nhấp để áp dụng ngay):
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
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700 hover:border-slate-300'
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
                <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Xem trước thành phần giao diện thực tế (Live Preview):
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      style={{ backgroundColor: config.primaryBrandColor || '#2563eb' }}
                      className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs cursor-default"
                    >
                      + Thuê Panel Mới
                    </button>
                    <button
                      type="button"
                      style={{ backgroundColor: config.primaryBrandColor || '#2563eb' }}
                      className="px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs cursor-default"
                    >
                      Nạp tiền
                    </button>
                    <span
                      style={{
                        backgroundColor: `rgba(${parseInt((config.primaryBrandColor || '#2563eb').slice(1,3), 16) || 37}, ${parseInt((config.primaryBrandColor || '#2563eb').slice(3,5), 16) || 99}, ${parseInt((config.primaryBrandColor || '#2563eb').slice(5,7), 16) || 235}, 0.1)`,
                        color: config.primaryBrandColor || '#2563eb',
                        borderColor: `rgba(${parseInt((config.primaryBrandColor || '#2563eb').slice(1,3), 16) || 37}, ${parseInt((config.primaryBrandColor || '#2563eb').slice(3,5), 16) || 99}, ${parseInt((config.primaryBrandColor || '#2563eb').slice(5,7), 16) || 235}, 0.3)`
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border cursor-default"
                    >
                      Tab Đang Chọn (Active)
                    </span>
                    <span
                      style={{
                        background: `linear-gradient(135deg, ${config.primaryBrandColor || '#2563eb'}, #1e293b)`
                      }}
                      className="px-3 py-1 rounded-lg text-white text-xs font-bold cursor-default"
                    >
                      Gradient Logo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Announcement Marquee Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Thanh Thông Báo Chạy Chữ Đầu Trang (Header Marquee)</span>
              </h2>
              <button
                type="button"
                onClick={() => setConfig({ ...config, headerAnnouncementActive: !config.headerAnnouncementActive })}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"
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
              <label className="text-xs font-bold text-slate-700">Nội Dung Thông Báo Nổi Bật</label>
              <input
                type="text"
                value={config.headerAnnouncementBar}
                onChange={(e) => setConfig({ ...config, headerAnnouncementBar: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                placeholder="VD: Khuyến mãi nạp ví tặng 10% qua VietQR..."
              />
            </div>
          </div>

          {/* SEO Meta Configuration */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-600" />
                <span>Cấu Hình SEO Google & Meta Tags</span>
              </h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Tiêu Đề Trang (SEO Meta Title)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{(config.seoMetaTitle || '').length} / 65 ký tự</span>
                </label>
                <input
                  type="text"
                  value={config.seoMetaTitle || ''}
                  onChange={(e) => setConfig({ ...config, seoMetaTitle: e.target.value })}
                  placeholder="VD: NexusSMM - Thuê Panel SMM & Cung Cấp Dịch Vụ Mạng Xã Hội Tự Động"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Từ Khóa Tìm Kiếm (SEO Meta Keywords)</label>
                <input
                  type="text"
                  value={config.seoMetaKeywords || ''}
                  onChange={(e) => setConfig({ ...config, seoMetaKeywords: e.target.value })}
                  placeholder="smm panel, thue smm panel, mua follow, tang like, smm api"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Mô Tả Trang Web (Meta Description)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{(config.seoMetaDescription || '').length} / 160 ký tự</span>
                </label>
                <textarea
                  rows={2}
                  value={config.seoMetaDescription || ''}
                  onChange={(e) => setConfig({ ...config, seoMetaDescription: e.target.value })}
                  placeholder="Khởi tạo và vận hành hệ thống SMM Panel riêng biệt của bạn chỉ trong 60 giây..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Đường Dẫn Chuẩn (Canonical URL)</label>
                  <input
                    type="text"
                    value={config.seoCanonicalUrl || ''}
                    onChange={(e) => setConfig({ ...config, seoCanonicalUrl: e.target.value })}
                    placeholder="https://nexussmm.io"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Ảnh Chia Sẻ MXH (OG:Image URL)</label>
                  <input
                    type="text"
                    value={config.seoOgImageUrl || ''}
                    onChange={(e) => setConfig({ ...config, seoOgImageUrl: e.target.value })}
                    placeholder="https://nexussmm.io/og-preview.png"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mã Xác Minh Google Search Console</label>
                  <input
                    type="text"
                    value={config.seoGoogleSiteVerification || ''}
                    onChange={(e) => setConfig({ ...config, seoGoogleSiteVerification: e.target.value })}
                    placeholder="google-site-verification token..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mã Google Analytics (GA4 ID)</label>
                  <input
                    type="text"
                    value={config.seoGoogleAnalyticsId || ''}
                    onChange={(e) => setConfig({ ...config, seoGoogleAnalyticsId: e.target.value })}
                    placeholder="VD: G-XXXXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: User Policies & Contact Channels */}
        <div className="space-y-6">
          {/* User Registration & Access Policies */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Chính Sách Khách Hàng</span>
            </h2>

            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Cho phép Đăng Ký mới</p>
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
                    <p className="font-bold text-slate-900">Gói dùng thử miễn phí (Free Trial)</p>
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
                  <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Thời hạn số ngày */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Thời hạn dùng thử (Số ngày)</label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={config.freeTrialDurationDays || 7}
                          onChange={(e) => setConfig({ ...config, freeTrialDurationDays: parseInt(e.target.value) || 7 })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                        />
                      </div>

                      {/* Số gói tối đa mỗi user */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Giới hạn tối đa / User (Gói)</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={config.freeTrialMaxPerUser || 1}
                          onChange={(e) => setConfig({ ...config, freeTrialMaxPerUser: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Khung thời gian chiến dịch */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Áp dụng từ ngày</label>
                        <input
                          type="date"
                          value={config.freeTrialStartDate ? config.freeTrialStartDate.slice(0, 10) : ''}
                          onChange={(e) => setConfig({ ...config, freeTrialStartDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Áp dụng tới ngày</label>
                        <input
                          type="date"
                          value={config.freeTrialEndDate ? config.freeTrialEndDate.slice(0, 10) : ''}
                          onChange={(e) => setConfig({ ...config, freeTrialEndDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Yêu cầu xác thực */}
                    <div className="pt-2 border-t border-blue-100/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">Yêu cầu xác thực tài khoản</span>
                        <span className="text-[10px] text-slate-500">Chỉ cấp gói free cho user đã xác minh email</span>
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
                  <p className="font-bold text-slate-900">Bật Widget Live Chat</p>
                  <p className="text-[11px] text-slate-500">Hiển thị bong bóng chat hỗ trợ góc phải</p>
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
          </div>

          {/* Support Channels */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Kênh Chăm Sóc Khách Hàng</span>
            </h2>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Hỗ Trợ</span>
                </label>
                <input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>Telegram CSKH / Bot</span>
                </label>
                <input
                  type="text"
                  value={config.supportTelegram}
                  onChange={(e) => setConfig({ ...config, supportTelegram: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hotline / Zalo</span>
                </label>
                <input
                  type="text"
                  value={config.supportHotline}
                  onChange={(e) => setConfig({ ...config, supportHotline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Transactional SMTP Email Setup */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>Cấu Hình SMTP Gửi Mail</span>
              </h2>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Máy Chủ SMTP</label>
                  <input
                    type="text"
                    value={config.smtpHost || ''}
                    onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Cổng (Port)</label>
                  <input
                    type="number"
                    value={config.smtpPort || 587}
                    onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Giao Thức Mã Hóa</label>
                <select
                  value={config.smtpEncryption || 'tls'}
                  onChange={(e) => setConfig({ ...config, smtpEncryption: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                >
                  <option value="tls">TLS (Mặc định - Cổng 587)</option>
                  <option value="ssl">SSL (Cổng 465)</option>
                  <option value="none">Không mã hóa (None - Cổng 25)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tài Khoản Gửi (SMTP User)</span>
                </label>
                <input
                  type="text"
                  value={config.smtpUsername || ''}
                  onChange={(e) => setConfig({ ...config, smtpUsername: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mật Khẩu / App Password</span>
                </label>
                <input
                  type="password"
                  value={config.smtpPassword || ''}
                  onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              {/* SMTP Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={testingSmtp}
                  onClick={handleTestSmtp}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {testingSmtp ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{testingSmtp ? 'Đang thử...' : 'Thử Kết Nối'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Soạn &amp; Gửi Mail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 CUSTOM CODE BLOCKS: CSS, HEADER SCRIPTS, BODY SCRIPTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Custom CSS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-blue-600" />
              <span>Mã CSS Tùy Chỉnh (Custom CSS)</span>
            </label>

            {(config.customCss || '').trim() !== '' && (
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, customCss: '' }))}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
              <span className="text-slate-300 font-semibold">&lt;style&gt; CSS</span>
              <span>{(config.customCss || '').split('\n').length} dòng</span>
            </div>
            <textarea
              rows={7}
              value={config.customCss || ''}
              onChange={(e) => setConfig({ ...config, customCss: e.target.value })}
              placeholder="/* Nhập CSS tùy biến giao diện... */"
              className="w-full p-3 bg-slate-950 text-blue-400 font-mono text-xs focus:outline-hidden resize-y leading-relaxed"
              style={{ minHeight: '160px' }}
            />
          </div>
        </div>

        {/* 2. Custom Header Scripts (<head>) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-purple-600" />
              <span>Mã Nhúng Header (&lt;head&gt;)</span>
            </label>

            {(config.customHeaderScripts || '').trim() !== '' && (
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, customHeaderScripts: '' }))}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
              <span className="text-slate-300 font-semibold">&lt;head&gt; Scripts &amp; Meta</span>
              <span>{(config.customHeaderScripts || '').split('\n').length} dòng</span>
            </div>
            <textarea
              rows={7}
              value={config.customHeaderScripts || ''}
              onChange={(e) => setConfig({ ...config, customHeaderScripts: e.target.value })}
              placeholder="<!-- Google Tag Manager, Pixel, Meta... -->"
              className="w-full p-3 bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-hidden resize-y leading-relaxed"
              style={{ minHeight: '160px' }}
            />
          </div>
        </div>

        {/* 3. Custom Body Scripts (End of <body>) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-amber-600" />
              <span>Mã Nhúng Body (&lt;body&gt;)</span>
            </label>

            {(config.customBodyScripts || '').trim() !== '' && (
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, customBodyScripts: '' }))}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
              <span className="text-slate-300 font-semibold">End of &lt;body&gt; Scripts</span>
              <span>{(config.customBodyScripts || '').split('\n').length} dòng</span>
            </div>
            <textarea
              rows={7}
              value={config.customBodyScripts || ''}
              onChange={(e) => setConfig({ ...config, customBodyScripts: e.target.value })}
              placeholder="<!-- Script chạy cuối trang body... -->"
              className="w-full p-3 bg-slate-950 text-amber-400 font-mono text-xs focus:outline-hidden resize-y leading-relaxed"
              style={{ minHeight: '160px' }}
            />
          </div>
        </div>
      </div>

      {/* FULL-WIDTH SECTION: Footer Copyright with WYSIWYG Rich Editor */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 block">
            Dòng Bản Quyền Chân Trang (Footer Copyright)
          </label>

          <button
            type="button"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                footerCopyright: '© 2026 NexusSMM SaaS Platform. All Rights Reserved.',
              }))
            }
            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Khôi phục
          </button>
        </div>

        {/* WYSIWYG Rich Editor */}
        <RichTextEditor
          value={config.footerCopyright || ''}
          onChange={(val) => setConfig({ ...config, footerCopyright: val })}
          placeholder="Nhập nội dung bản quyền..."
          minHeight="140px"
        />
      </div>

      {/* MODAL SOẠN & GỬI EMAIL QUA SMTP (BROADCAST / DIRECT) */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Soạn &amp; Gửi Email Qua SMTP</h3>
                  <p className="text-[11px] text-slate-500">Gửi thông báo, ưu đãi hoặc hỗ trợ tới người dùng</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* SELECT2: CHỌN TỪ DANH SÁCH KHÁCH HÀNG (TỪNG MAIL HOẶC TẤT CẢ) */}
              <div className="space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Chọn từ Danh Sách Khách Hàng</span>
                  </label>

                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                    {isSelectAll
                      ? `Tất cả (${usersList.length} khách hàng)`
                      : `Đã chọn: ${selectedRecipients.length} / ${usersList.length}`}
                  </span>
                </div>

                {/* Select2 Container Box */}
                <div
                  onClick={() => setIsSelect2Open(!isSelect2Open)}
                  className="min-h-11 w-full px-3 py-2 rounded-2xl bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 max-h-24 overflow-y-auto py-0.5">
                    {isSelectAll ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-2xs animate-in fade-in">
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
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium animate-in fade-in"
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
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={select2Search}
                          onChange={(e) => setSelect2Search(e.target.value)}
                          placeholder="Tìm nhanh theo tên, username hoặc email..."
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isSelectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
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
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">📢 TẤT CẢ KHÁCH HÀNG</p>
                              <p className="text-[10px] text-slate-500">
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
                <label className="text-xs font-bold text-slate-700">Tiêu Đề Email</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Ví dụ: [NexusSMM] Thông báo nâng cấp hệ thống máy chủ & Khuyến mãi nạp tiền"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Email Body Rich Text Editor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nội Dung Email (Bộ Soạn Thảo WYSIWYG)</label>
                <RichTextEditor
                  value={emailBody}
                  onChange={setEmailBody}
                  placeholder="Soạn thảo nội dung email gửi đến khách hàng..."
                  minHeight="220px"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
              <span className="text-[11px] text-slate-500">
                Gửi qua máy chủ: <b className="text-slate-700">{config.smtpHost || 'Chưa thiết lập'}</b>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="button"
                  disabled={sendingEmail}
                  onClick={handleSendDispatchEmail}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{sendingEmail ? 'Đang gửi...' : 'Gửi Email Ngay'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
