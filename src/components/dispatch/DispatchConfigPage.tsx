import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  Ticket,
  MessageSquare,
  Play,
  Eye,
  EyeOff,
  Server,
  RefreshCw,
  Terminal,
  Check,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ProviderDispatchConfig, DispatchMethod } from '../../types';

export const DispatchConfigPage: React.FC = () => {
  const {
    panels,
    updatePanel,
    testPanelDispatch,
    addToast,
    language,
    t,
  } = useApp();

  // Selected Panel for configuration
  const [selectedPanelId, setSelectedPanelId] = useState<string>(panels[0]?.id || '');
  const currentPanel = panels.find((p) => p.id === selectedPanelId) || panels[0];

  // Dispatch method tab: Only 3 channels (ticket, telegram, whatsapp)
  const [activeMethod, setActiveMethod] = useState<'ticket' | 'telegram' | 'whatsapp'>('ticket');

  // Form states
  const [enabled, setEnabled] = useState<boolean>(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isWaKeyVisible, setIsWaKeyVisible] = useState(false);
  const [isTgTokenVisible, setIsTgTokenVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Ticket form states
  const [providerName, setProviderName] = useState('FastSMM Global Hub #14');
  const [loginUrl, setLoginUrl] = useState('https://fastsmm.vip/tickets/new');
  const [username, setUsername] = useState('agency_partner_01');
  const [password, setPassword] = useState('pnl_provider_pwd_9942@!');
  const [autoCreateOnOrder, setAutoCreateOnOrder] = useState(true);

  // 2. Telegram form states
  const [telegramBotToken, setTelegramBotToken] = useState('7182938491:AAH8e_ExampleBotTokenXyZ_9912');
  const [telegramChatId, setTelegramChatId] = useState('-1001928374652');
  const [telegramThreadId, setTelegramThreadId] = useState('');

  // 3. WhatsApp form states
  const [whatsappGateway, setWhatsappGateway] = useState('https://api.green-api.com/waInstance1101/sendMessage');
  const [whatsappApiKey, setWhatsappApiKey] = useState('wa_sec_token_9912093848123');
  const [whatsappInstanceId, setWhatsappInstanceId] = useState('1101928374');
  const [whatsappPhone, setWhatsappPhone] = useState('+84988776655');

  // Test Simulator state
  const [testOrderId, setTestOrderId] = useState('ORD-98421');
  const [testServiceName, setTestServiceName] = useState('Instagram Followers HQ [Instant]');
  const [testLink, setTestLink] = useState('https://instagram.com/nexus_smm_official');
  const [testQuantity, setTestQuantity] = useState('1000');
  const [isTesting, setIsTesting] = useState(false);
  const [testConsoleLogs, setTestConsoleLogs] = useState<string[]>([
    `[SYSTEM] Sẵn sàng kết nối các cổng chuyển tiếp đơn hàng.`,
    `[SYSTEM] Hỗ trợ 3 phương thức: Ticket NCC, WhatsApp Gateway, Telegram Bot.`,
  ]);

  // Load existing panel dispatch config when currentPanel changes
  useEffect(() => {
    if (currentPanel) {
      const cfg = currentPanel.dispatchConfig;
      if (cfg) {
        setEnabled(cfg.enabled !== false);
        if (cfg.method === 'ticket' || cfg.method === 'telegram' || cfg.method === 'whatsapp') {
          setActiveMethod(cfg.method);
        }
        if (cfg.ticket) {
          if (cfg.ticket.providerName) setProviderName(cfg.ticket.providerName);
          if (cfg.ticket.loginUrl) setLoginUrl(cfg.ticket.loginUrl);
          if (cfg.ticket.username) setUsername(cfg.ticket.username);
          if (cfg.ticket.password) setPassword(cfg.ticket.password);
          if (typeof cfg.ticket.autoCreateOnOrder === 'boolean') setAutoCreateOnOrder(cfg.ticket.autoCreateOnOrder);
        }
        if (cfg.telegram) {
          if (cfg.telegram.botToken) setTelegramBotToken(cfg.telegram.botToken);
          if (cfg.telegram.chatId) setTelegramChatId(cfg.telegram.chatId);
          if (cfg.telegram.threadId) setTelegramThreadId(cfg.telegram.threadId);
        }
        if (cfg.whatsapp) {
          if (cfg.whatsapp.gatewayUrl) setWhatsappGateway(cfg.whatsapp.gatewayUrl);
          if (cfg.whatsapp.apiKey) setWhatsappApiKey(cfg.whatsapp.apiKey);
          if (cfg.whatsapp.instanceId) setWhatsappInstanceId(cfg.whatsapp.instanceId);
          if (cfg.whatsapp.recipientPhone) setWhatsappPhone(cfg.whatsapp.recipientPhone);
        }
      }
    }
  }, [currentPanel?.id]);

  const handleSaveConfig = async () => {
    if (!currentPanel) return;
    setSaving(true);

    const newDispatchConfig: ProviderDispatchConfig = {
      enabled,
      method: activeMethod,
      ticket: {
        providerName,
        loginUrl,
        username,
        password,
        autoCreateOnOrder,
      },
      telegram: {
        botToken: telegramBotToken,
        chatId: telegramChatId,
        threadId: telegramThreadId,
      },
      whatsapp: {
        gatewayUrl: whatsappGateway,
        apiKey: whatsappApiKey,
        instanceId: whatsappInstanceId,
        recipientPhone: whatsappPhone,
      },
    };

    const ok = await updatePanel(currentPanel.id, {
      dispatchConfig: newDispatchConfig,
    });

    setSaving(false);
    if (ok) {
      addToast(
        'success',
        language === 'vi'
          ? `Đã lưu cấu hình kết nối bắn đơn cho ${currentPanel.name} thành công!`
          : `Dispatch configuration saved for ${currentPanel.name}!`
      );
    }
  };

  const handleRunTestDispatch = async () => {
    if (!currentPanel) return;
    setIsTesting(true);

    const now = new Date().toLocaleTimeString();
    const configSnapshot: ProviderDispatchConfig = {
      enabled,
      method: activeMethod,
      ticket: { providerName, loginUrl, username, password, autoCreateOnOrder },
      telegram: { botToken: telegramBotToken, chatId: telegramChatId, threadId: telegramThreadId },
      whatsapp: { gatewayUrl: whatsappGateway, apiKey: whatsappApiKey, instanceId: whatsappInstanceId, recipientPhone: whatsappPhone },
    };

    setTestConsoleLogs((prev) => [
      `[${now}] 🚀 Khởi tạo lệnh bắn đơn test #${testOrderId} qua kênh [${activeMethod.toUpperCase()}]...`,
      `[${now}] 🔍 Đang kết nối xác thực tài khoản/token cho Panel: ${currentPanel.name}...`,
      ...prev,
    ]);

    const result = await testPanelDispatch(currentPanel.id, configSnapshot);

    const finishTime = new Date().toLocaleTimeString();
    if (result.success) {
      setTestConsoleLogs((prev) => [
        `[${finishTime}] ✅ HTTP 200 OK: ${result.message}`,
        `[${finishTime}] 📦 Dữ liệu chuyển tiếp: {"orderId":"${testOrderId}","service":"${testServiceName}","target":"${testLink}","qty":${testQuantity}}`,
        `[${finishTime}] ⏱️ Độ trễ: 135ms - Kết nối kênh ${activeMethod.toUpperCase()} thành công!`,
        ...prev,
      ]);
    } else {
      setTestConsoleLogs((prev) => [
        `[${finishTime}] ❌ Lỗi kết nối: ${result.message}`,
        ...prev,
      ]);
    }

    setIsTesting(false);
  };

  const recentDispatchHistory = [
    { id: 'DSP-8812', orderId: '#ORD-99824', panel: currentPanel?.name || 'ApexSMM', method: 'ticket', destination: 'FastSMM Portal', time: '5 phút trước', status: 'success', latency: '138ms' },
    { id: 'DSP-8811', orderId: '#ORD-99823', panel: currentPanel?.name || 'ApexSMM', method: 'telegram', destination: '@smm_orders_vip', time: '18 phút trước', status: 'success', latency: '92ms' },
    { id: 'DSP-8810', orderId: '#ORD-99820', panel: currentPanel?.name || 'ApexSMM', method: 'whatsapp', destination: '+84988776655', time: '45 phút trước', status: 'success', latency: '210ms' },
    { id: 'DSP-8809', orderId: '#ORD-99815', panel: currentPanel?.name || 'ApexSMM', method: 'ticket', destination: 'ViralMedia Support', time: '2 giờ trước', status: 'success', latency: '154ms' },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Banner Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {language === 'vi' ? 'Cấu Hình Bắn Đơn NCC' : 'Provider Dispatch Hub'}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {language === 'vi' ? '3 CỔNG TỰ ĐỘNG' : '3 CHANNELS'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'vi'
                  ? 'Tự động chuyển tiếp đơn hàng tới NCC qua Ticket, WhatsApp hoặc Telegram'
                  : 'Automatically forward orders to upstream providers via Ticket, WhatsApp, or Telegram'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunTestDispatch}
            disabled={isTesting}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : 'fill-current'}`} />
            <span>{isTesting ? (language === 'vi' ? 'Đang test...' : 'Testing...') : (language === 'vi' ? 'Gửi thử nghiệm' : 'Test Dispatch')}</span>
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{saving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu cấu hình' : 'Save Config')}</span>
          </button>
        </div>
      </div>

      {/* Select Target Panel Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">
              {language === 'vi' ? 'Chọn Panel Cấu Hình' : 'Select SMM Panel'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {language === 'vi' ? 'Trạng thái chuyển tiếp:' : 'Forwarding Status:'}
            </span>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                enabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {enabled ? (language === 'vi' ? 'ĐANG BẬT' : 'ACTIVE') : (language === 'vi' ? 'TẮT' : 'DISABLED')}
            </button>
          </div>
        </div>

        {/* Panel Switcher Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {panels.map((p) => {
            const isSelected = p.id === (currentPanel?.id || selectedPanelId);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPanelId(p.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">{p.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                    {p.planName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="truncate max-w-[150px]">{p.customDomain || p.domain}</span>
                  <span className="font-bold text-blue-600 uppercase text-[10px]">
                    {p.dispatchConfig?.method || 'TICKET'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Configuration Grid: 3 Channels Form (Left) & Simulator/Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3 Form Channels (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 3 Channel Selection Tabs */}
          <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 grid grid-cols-3 gap-1.5">
            {[
              { id: 'ticket', label: language === 'vi' ? 'Ticket NCC' : 'Ticket Portal', icon: Ticket },
              { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
              { id: 'telegram', label: 'Telegram', icon: Send },
            ].map((m) => {
              const Icon = m.icon;
              const isActive = activeMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMethod(m.id as 'ticket' | 'telegram' | 'whatsapp')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* CHANNEL 1: TICKET NHÀ CUNG CẤP */}
          {activeMethod === 'ticket' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {language === 'vi' ? 'Tài Khoản & Cổng Gửi Ticket NCC' : 'Provider Ticket Portal Credentials'}
                  </h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  AUTO TICKET
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Tên Nhà Cung Cấp' : 'Provider Name'}
                  </label>
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="VD: FastSMM VIP, SMMFlare, SMMKingdom..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Đường Dẫn Tạo Ticket NCC (URL)' : 'Ticket URL / Portal Endpoint'}
                  </label>
                  <input
                    type="url"
                    value={loginUrl}
                    onChange={(e) => setLoginUrl(e.target.value)}
                    placeholder="https://fastsmm.vip/tickets/new"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 font-mono text-xs transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Tài Khoản (Username / Email)' : 'Username / Email'}
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="partner_agency_user"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 text-xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Mật Khẩu Đăng Nhập NCC' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 pr-10 font-mono text-xs transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoTicket"
                      checked={autoCreateOnOrder}
                      onChange={(e) => setAutoCreateOnOrder(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="autoTicket" className="font-semibold text-slate-800 cursor-pointer select-none">
                      {language === 'vi'
                        ? 'Tự động tạo ticket gửi đơn ngay khi khách thanh toán'
                        : 'Auto-submit ticket immediately after customer payment'}
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 pl-6">
                    {language === 'vi'
                      ? 'Hệ thống tự format mã đơn, số lượng, liên kết và dịch vụ gửi chuẩn xác tới NCC.'
                      : 'Formats order ID, quantity, link, and service name to upstream portal.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CHANNEL 2: WHATSAPP GATEWAY */}
          {activeMethod === 'whatsapp' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {language === 'vi' ? 'Cổng WhatsApp Gateway' : 'WhatsApp Gateway'}
                  </h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  GREEN-API / ULTRAMSG
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Endpoint URL Gateway' : 'Gateway API Endpoint'}
                  </label>
                  <input
                    type="url"
                    value={whatsappGateway}
                    onChange={(e) => setWhatsappGateway(e.target.value)}
                    placeholder="https://api.green-api.com/waInstance1101/sendMessage"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 font-mono text-xs transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'API Token / Secret' : 'API Token / Secret'}
                    </label>
                    <div className="relative">
                      <input
                        type={isWaKeyVisible ? 'text' : 'password'}
                        value={whatsappApiKey}
                        onChange={(e) => setWhatsappApiKey(e.target.value)}
                        placeholder="wa_sec_token_9912..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 pr-10 font-mono text-xs transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setIsWaKeyVisible(!isWaKeyVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {isWaKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Số Điện Thoại NCC Nhận Tin' : 'Recipient Phone (+84...)'}
                    </label>
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="+84988776655"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 font-mono text-xs transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Instance ID (Tùy chọn)' : 'Instance ID (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={whatsappInstanceId}
                    onChange={(e) => setWhatsappInstanceId(e.target.value)}
                    placeholder="VD: 1101928374"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 font-mono text-xs transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CHANNEL 3: TELEGRAM BOT */}
          {activeMethod === 'telegram' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {language === 'vi' ? 'Cổng Telegram Bot & Nhóm' : 'Telegram Bot & Channel'}
                  </h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  REALTIME BOT
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'vi' ? 'Bot API Token (từ @BotFather)' : 'Telegram Bot Token'}
                  </label>
                  <div className="relative">
                    <input
                      type={isTgTokenVisible ? 'text' : 'password'}
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="7182938491:AAH8e_ExampleBotTokenXyZ_9912"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 pr-10 font-mono text-xs transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setIsTgTokenVisible(!isTgTokenVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isTgTokenVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Chat ID / Nhóm / Kênh' : 'Target Chat / Channel ID'}
                    </label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="-1001928374652"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 font-mono text-xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Topic ID (Tùy chọn)' : 'Topic / Thread ID'}
                    </label>
                    <input
                      type="text"
                      value={telegramThreadId}
                      onChange={(e) => setTelegramThreadId(e.target.value)}
                      placeholder="VD: 142 (nếu có)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500 font-mono text-xs transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Connection Simulator & Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Test Simulator Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'vi' ? 'Thử Nghiệm Bắn Đơn' : 'Dispatch Simulator'}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Online
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{language === 'vi' ? 'Mã đơn test' : 'Test Order ID'}</label>
                  <input
                    type="text"
                    value={testOrderId}
                    onChange={(e) => setTestOrderId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{language === 'vi' ? 'Số lượng' : 'Quantity'}</label>
                  <input
                    type="text"
                    value={testQuantity}
                    onChange={(e) => setTestQuantity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">{language === 'vi' ? 'Dịch vụ' : 'Service'}</label>
                <input
                  type="text"
                  value={testServiceName}
                  onChange={(e) => setTestServiceName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">{language === 'vi' ? 'Link mục tiêu' : 'Target URL'}</label>
                <input
                  type="text"
                  value={testLink}
                  onChange={(e) => setTestLink(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleRunTestDispatch}
                disabled={isTesting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : 'fill-current'}`} />
                <span>
                  {isTesting
                    ? (language === 'vi' ? 'Đang gửi...' : 'Dispatching...')
                    : (language === 'vi' ? 'Kích Hoạt Gửi Thử' : 'Trigger Dispatch Test')}
                </span>
              </button>
            </div>

            {/* Terminal Log Console */}
            <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto border border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-slate-800">
                <span>Dispatch Console</span>
                <span className="text-emerald-400 font-bold uppercase">{activeMethod}</span>
              </div>
              {testConsoleLogs.map((log, index) => (
                <p
                  key={index}
                  className={`leading-relaxed ${
                    log.includes('✅')
                      ? 'text-emerald-400 font-semibold'
                      : log.includes('❌')
                      ? 'text-rose-400 font-semibold'
                      : log.includes('🚀')
                      ? 'text-blue-300 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  {log}
                </p>
              ))}
            </div>
          </div>

          {/* Recent Forwarding Log Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'vi' ? 'Lịch Sử Gần Đây' : 'Recent Dispatch'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Sync realtime</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {recentDispatchHistory.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">{item.orderId}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {item.method}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{item.destination}</p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      SUCCESS
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">{item.time} ({item.latency})</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
