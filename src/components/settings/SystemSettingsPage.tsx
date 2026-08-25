import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Sliders,
  Bell,
  Globe,
  Database,
  RefreshCw,
  Check,
  AlertTriangle,
  Zap,
  DollarSign,
  Shield,
  Layers,
  Server,
  Download,
  Trash2,
} from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    addToast,
    t,
  } = useApp();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'automation' | 'notifications' | 'localization' | 'maintenance'>('automation');

  // Automation & Operations Settings
  const [syncInterval, setSyncInterval] = useState('3'); // minutes
  const [autoRefundOnError, setAutoRefundOnError] = useState(true);
  const [lowBalanceAlertThreshold, setLowBalanceAlertThreshold] = useState('50');
  const [defaultProfitMargin, setDefaultProfitMargin] = useState('25');
  const [autoRetryStalledOrders, setAutoRetryStalledOrders] = useState(true);
  const [filterSensitiveKeywords, setFilterSensitiveKeywords] = useState(true);

  // Notification & Webhook Settings
  const [notifyEmailOrders, setNotifyEmailOrders] = useState(true);
  const [notifyEmailLowBalance, setNotifyEmailLowBalance] = useState(true);
  const [notifyTelegramPanelExpiry, setNotifyTelegramPanelExpiry] = useState(true);
  const [notifyTelegramErrors, setNotifyTelegramErrors] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://agency-hub.com/api/v1/nexussmm/events');
  const [webhookSecret, setWebhookSecret] = useState('whsec_9918274619283746');

  // Currency & Rate settings
  const [exchangeRateVND, setExchangeRateVND] = useState('25400');
  const [autoUpdateRate, setAutoUpdateRate] = useState(true);

  // Maintenance & System states
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isPurgingCache, setIsPurgingCache] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    addToast(
      'success',
      language === 'vi'
        ? 'Đã lưu toàn bộ thiết lập cài đặt hệ thống thành công!'
        : 'System configuration settings saved successfully!'
    );
  };

  const handlePurgeGlobalCache = async () => {
    setIsPurgingCache(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsPurgingCache(false);
    addToast(
      'success',
      language === 'vi'
        ? 'Đã xóa toàn bộ Edge Cache CDN trên tất cả các SMM Panel!'
        : 'Global CDN edge cache purged across all active panels!'
    );
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      automation: {
        syncInterval,
        autoRefundOnError,
        lowBalanceAlertThreshold,
        defaultProfitMargin,
        autoRetryStalledOrders,
      },
      notifications: {
        notifyEmailOrders,
        notifyEmailLowBalance,
        notifyTelegramPanelExpiry,
        webhookUrl,
      },
      localization: {
        language,
        currency,
        exchangeRateVND,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexussmm-settings-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', language === 'vi' ? 'Đã xuất file sao lưu cài đặt .JSON!' : 'Settings backup file exported!');
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {language === 'vi' ? 'Cài Đặt Hệ Thống & Tự Động Hóa' : 'System Settings & Automation'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                CORE CONFIG
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'vi'
                ? 'Thiết lập chu kỳ đồng bộ đơn hàng NCC, tỷ suất lợi nhuận, thông báo Webhook, tỷ giá tiền tệ và bảo trì'
                : 'Configure order sync frequency, default profit margins, webhook alerts, currency exchange rates, and maintenance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{saving ? t('common.loading') : (language === 'vi' ? 'Lưu Cài Đặt Hệ Thống' : 'Save System Settings')}</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        {[
          { id: 'automation', label: language === 'vi' ? 'Tự Động Hóa & Vận Hành' : 'Automation & Operations', icon: Sliders },
          { id: 'notifications', label: language === 'vi' ? 'Thông Báo & Webhook' : 'Alerts & Webhooks', icon: Bell },
          { id: 'localization', label: language === 'vi' ? 'Tiền Tệ & Tỷ Giá' : 'Currency & Localization', icon: Globe },
          { id: 'maintenance', label: language === 'vi' ? 'Bảo Trì & Sao Lưu' : 'Maintenance & Backup', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AUTOMATION & OPERATIONS */}
      {activeTab === 'automation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Cấu Hình Đồng Bộ & Xử Lý Đơn' : 'Order Sync & Queue Engine'}
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Tần suất kiểm tra trạng thái đơn NCC:' : 'Provider Status Polling Interval:'}
                </label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
                >
                  <option value="1">Mỗi 1 phút (Nhanh nhất - Instant Polling)</option>
                  <option value="3">Mỗi 3 phút (Khuyên dùng - Recommended)</option>
                  <option value="5">Mỗi 5 phút (Tiết kiệm tài nguyên API)</option>
                  <option value="15">Mỗi 15 phút</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Ngưỡng cảnh báo số dư NCC sắp hết ($):' : 'Low Provider Balance Alert ($):'}
                </label>
                <input
                  type="number"
                  value={lowBalanceAlertThreshold}
                  onChange={(e) => setLowBalanceAlertThreshold(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden font-mono"
                  placeholder="50"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'vi'
                    ? 'Hệ thống sẽ gửi thông báo khẩn cấp khi số dư tài khoản tại NCC dưới mức này.'
                    : 'Emergency alerts trigger when provider balance dips below this amount.'}
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoRefundOnError}
                    onChange={(e) => setAutoRefundOnError(e.target.checked)}
                    className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-800">
                    {language === 'vi'
                      ? 'Tự động hoàn tiền vào ví khách khi đơn NCC bị Canceled / Partial'
                      : 'Auto refund to client wallet if provider order fails or cancels'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoRetryStalledOrders}
                    onChange={(e) => setAutoRetryStalledOrders(e.target.checked)}
                    className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-800">
                    {language === 'vi'
                      ? 'Tự động chuyển tiếp lại đơn kẹt quá 15 phút (Auto-Failover)'
                      : 'Auto-retry stalled orders via backup provider after 15 minutes'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Quy Tắc Lợi Nhuận & Dịch Vụ Mặc Định' : 'Default Margins & Pricing Rules'}
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Tỷ lệ lợi nhuận mặc định khi nhập dịch vụ mới (%):' : 'Global Default Profit Markup (%):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={defaultProfitMargin}
                    onChange={(e) => setDefaultProfitMargin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden font-mono pr-8"
                    placeholder="25"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'vi'
                    ? 'Giá bán sẽ tự động bằng: [Giá gốc NCC] + [Tỷ lệ % lợi nhuận].'
                    : 'Selling price = [Provider Cost] * (1 + Markup %).'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">Bộ Lọc An Toàn Nội Dung</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterSensitiveKeywords}
                    onChange={(e) => setFilterSensitiveKeywords(e.target.checked)}
                    className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-700">
                    {language === 'vi'
                      ? 'Tự động kiểm duyệt liên kết spam / từ khóa cấm trong đơn hàng'
                      : 'Automatically block blacklisted keywords in order comments'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOTIFICATIONS & WEBHOOKS */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Bell className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Thông Báo Qua Email & Telegram' : 'Email & Telegram Channels'}
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Thông báo Email khi có đơn hàng lớn</p>
                  <p className="text-[11px] text-slate-500">Nhận email khi có đơn trị giá trên $20</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmailOrders}
                  onChange={(e) => setNotifyEmailOrders(e.target.checked)}
                  className="w-4 h-4 rounded-md text-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Cảnh báo Email khi số dư ví thấp</p>
                  <p className="text-[11px] text-slate-500">Nhận email nhắc nạp tiền duy trì thuê panel</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmailLowBalance}
                  onChange={(e) => setNotifyEmailLowBalance(e.target.checked)}
                  className="w-4 h-4 rounded-md text-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Cảnh báo Telegram trước ngày hết hạn Panel</p>
                  <p className="text-[11px] text-slate-500">Gửi bot nhắc nhở trước 3 ngày và 24 giờ</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyTelegramPanelExpiry}
                  onChange={(e) => setNotifyTelegramPanelExpiry(e.target.checked)}
                  className="w-4 h-4 rounded-md text-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">Báo cáo sự cố kết nối API NCC</p>
                  <p className="text-[11px] text-slate-500">Thông báo tức thời khi upstream provider trả mã lỗi HTTP 500/502</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyTelegramErrors}
                  onChange={(e) => setNotifyTelegramErrors(e.target.checked)}
                  className="w-4 h-4 rounded-md text-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Cấu Hình Webhook Toàn Hệ Thống' : 'Global Webhooks Integration'}
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Webhook Endpoint URL:</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                  placeholder="https://yourdomain.com/webhook/nexussmm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Webhook Signing Secret:</label>
                <input
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Các sự kiện được kích hoạt gửi Webhook:</p>
                <p>• <code>order.created</code>, <code>order.completed</code>, <code>order.refunded</code></p>
                <p>• <code>panel.provisioned</code>, <code>panel.renewed</code>, <code>panel.expired</code></p>
                <p>• <code>wallet.deposited</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOCALIZATION & RATES */}
      {activeTab === 'localization' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Globe className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'vi' ? 'Ngôn Ngữ & Thiết Lập Tỷ Giá Tiền Tệ' : 'Localization & Currency Exchange Rates'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Ngôn ngữ mặc định:' : 'Default Interface Language:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('vi')}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                    language === 'vi'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="fi fi-vn fis rounded-xs shadow-2xs w-4 h-3.5 inline-block" />
                  <span>Tiếng Việt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                    language === 'en'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="fi fi-us fis rounded-xs shadow-2xs w-4 h-3.5 inline-block" />
                  <span>English</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tiền tệ thanh toán mặc định:' : 'Default Base Currency:'}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              >
                <option value="USD">$ USD - United States Dollar</option>
                <option value="VND">₫ VND - Đồng Việt Nam</option>
              </select>
            </div>

            <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 text-xs">Tỷ Giá Quy Đổi (USD ➔ VND)</p>
                  <p className="text-[11px] text-slate-500">1 USD = bao nhiêu VND cho các hóa đơn và bảng giá</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-xs font-mono">$1.00 USD =</span>
                  <input
                    type="number"
                    value={exchangeRateVND}
                    onChange={(e) => setExchangeRateVND(e.target.value)}
                    className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs text-right"
                  />
                  <span className="font-bold text-slate-700 text-xs">₫ VND</span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={autoUpdateRate}
                  onChange={(e) => setAutoUpdateRate(e.target.checked)}
                  className="w-4 h-4 rounded-md text-blue-600 cursor-pointer"
                />
                <span>Tự động cập nhật tỷ giá theo thị trường liên ngân hàng hàng ngày</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MAINTENANCE & BACKUP */}
      {activeTab === 'maintenance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edge Cache & Maintenance Mode */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Server className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Vận Hành & Bảo Trì Máy Chủ' : 'Server Operations & CDN Cache'}
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Xóa Bộ Nhớ Đệm Toàn Sàn (Purge Edge Cache)</p>
                    <p className="text-[11px] text-slate-500">Làm mới dữ liệu DNS & CDN cho toàn bộ các Panel đang chạy.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePurgeGlobalCache}
                  disabled={isPurgingCache}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPurgingCache ? 'animate-spin' : ''}`} />
                  <span>{isPurgingCache ? 'Đang xóa cache...' : 'Xóa Toàn Bộ CDN Cache'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-amber-900">Chế Độ Bảo Trì Hệ Thống</p>
                    <p className="text-[11px] text-amber-700">Tạm thời khóa đặt đơn mới trên tất cả các Panel để bảo trì.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => {
                      setMaintenanceMode(e.target.checked);
                      addToast(
                        e.target.checked ? 'warning' : 'info',
                        e.target.checked ? 'Đã BẬT chế độ bảo trì!' : 'Đã TẮT chế độ bảo trì!'
                      );
                    }}
                    className="w-4 h-4 rounded-md text-amber-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Export */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Sao Lưu & Xuất Dữ Liệu' : 'Backup & Export Configuration'}
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                {language === 'vi'
                  ? 'Tải về bản sao lưu toàn bộ cấu hình quy tắc, thông số tự động hóa và cài đặt Webhook dưới dạng tệp tin JSON an toàn.'
                  : 'Export all automation rules, system variables, webhook configs, and pricing settings into an encrypted JSON file.'}
              </p>

              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'vi' ? 'Xuất File Sao Lưu Cài Đặt (.JSON)' : 'Export Settings Backup (.JSON)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
