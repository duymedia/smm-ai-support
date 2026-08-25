import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { SiteFrontendConfig } from '../../../types';
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
  Eye
} from 'lucide-react';

export const AdminSiteConfigView: React.FC = () => {
  const { language, addToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteFrontendConfig>({
    siteName: 'NexusSMM Enterprise',
    siteTagline: 'Nền Tảng Cho Thuê & Quản Trị SMM Panel Đa Máy Chủ Chuẩn SaaS Số 1',
    siteLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    faviconUrl: '/favicon.ico',
    primaryBrandColor: '#2563eb',
    supportEmail: 'support@nexussmm.io',
    supportTelegram: '@NexusSMM_SupportBot',
    supportHotline: '+84 (0) 988 889 999',
    allowUserRegistration: true,
    allowFreeTrialPanel: true,
    allowGuestServiceViewing: true,
    enableLiveChatWidget: true,
    headerAnnouncementBar: '🚀 Khuyến mãi Tháng 8: Nạp ví từ $100 qua VietQR tặng ngay +10% số dư tự động!',
    headerAnnouncementActive: true,
    footerCopyright: '© 2026 NexusSMM SaaS Platform. All Rights Reserved.',
    seoMetaTitle: 'NexusSMM - Thuê Panel SMM & Dịch Vụ Mạng Xã Hội Tự Động',
    seoMetaKeywords: 'thue smm panel, smm panel gia re, api smm panel, auto vietqr',
    seoMetaDescription: 'Khởi tạo SMM Panel trong 60 giây. Kết nối 50+ nhà cung cấp API SMM toàn cầu.',
    customCss: '',
    customHeaderScripts: '',
  });

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/site-config');
      const data = await res.json();
      if (data?.data) {
        setConfig(data.data);
      }
    } catch (e) {
      console.error('Failed to load site config:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

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
        addToast('success', data.message || 'Lưu cấu hình giao diện người dùng thành công!');
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
              {language === 'vi' ? 'Cấu Hình Giao Diện & Setup Trang Người Dùng' : 'User Frontend & Branding Master Setup'}
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Màu Sắc Chủ Đạo (Brand Color)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primaryBrandColor}
                    onChange={(e) => setConfig({ ...config, primaryBrandColor: e.target.value })}
                    className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryBrandColor}
                    onChange={(e) => setConfig({ ...config, primaryBrandColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
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
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-600" />
              <span>Cấu Hình SEO Google & Meta Tags</span>
            </h2>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tiêu Đề Trang (SEO Meta Title)</label>
                <input
                  type="text"
                  value={config.seoMetaTitle}
                  onChange={(e) => setConfig({ ...config, seoMetaTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Từ Khóa Tìm Kiếm (SEO Keywords)</label>
                <input
                  type="text"
                  value={config.seoMetaKeywords}
                  onChange={(e) => setConfig({ ...config, seoMetaKeywords: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mô Tả Trang Web (Meta Description)</label>
                <textarea
                  rows={2}
                  value={config.seoMetaDescription}
                  onChange={(e) => setConfig({ ...config, seoMetaDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
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

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Dùng Thử Panel Miễn Phí</p>
                  <p className="text-[11px] text-slate-500">Cho phép tạo panel test 24h</p>
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

          {/* Footer Copyright */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
            <label className="text-xs font-bold text-slate-700">Dòng Bản Quyền Footer</label>
            <input
              type="text"
              value={config.footerCopyright}
              onChange={(e) => setConfig({ ...config, footerCopyright: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
