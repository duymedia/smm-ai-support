import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Globe,
  Key,
  ShieldCheck,
  Send,
  Bot,
  MessageSquare,
  Sparkles,
  Ticket,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  Sliders,
  Terminal,
  Cpu,
  Zap,
} from 'lucide-react';
import { SmmPanel, ProviderDispatchConfig, DispatchMethod } from '../../types';
import { Modal } from '../ui/Modal';

interface PanelEditModalProps {
  panel: SmmPanel;
  onClose: () => void;
  onSaved?: () => void;
}

export const PanelEditModal: React.FC<PanelEditModalProps> = ({ panel, onClose, onSaved }) => {
  const { updatePanel, testPanelDispatch, addToast, t, language, setCurrentRoute } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'dispatch'>('dispatch');
  const [loading, setLoading] = useState(false);
  const [testingDispatch, setTestingDispatch] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; summary?: string } | null>(null);

  // General fields
  const [name, setName] = useState(panel.name || '');
  const [customDomain, setCustomDomain] = useState(panel.customDomain || '');
  const [status, setStatus] = useState(panel.status || 'active');
  const [autoRenew, setAutoRenew] = useState(panel.autoRenew ?? true);
  const [notes, setNotes] = useState(panel.notes || '');

  // Dispatch Config state
  const existingConfig = panel.dispatchConfig || {
    enabled: true,
    method: 'ticket' as DispatchMethod,
    ticket: {
      providerName: 'FastSMM Global Hub',
      loginUrl: 'https://fastsmm.provider-panel.com/login',
      username: '',
      password: '',
      ticketSubjectTemplate: '[AUTO-ORDER] #{order_id} - {service_name}',
      ticketMessageTemplate:
        'Kính gửi NCC,\nVui lòng xử lý và kích hoạt mã đơn hàng sau:\n- Mã đơn hàng: #{order_id}\n- Dịch vụ: {service_name} (ID: {service_id})\n- Đường link: {link}\n- Số lượng: {quantity}\n- Thời gian đặt: {created_at}\nTrân trọng cảm ơn!',
      autoCreateOnOrder: true,
    },
    telegram: {
      botToken: '',
      chatId: '',
      threadId: '',
      messageTemplate:
        '🚀 <b>ĐƠN HÀNG MỚI ĐÃ CHUYỂN TIẾP</b>\n📦 Mã đơn: <code>#{order_id}</code>\n⚡ Dịch vụ: {service_name} (<code>{service_id}</code>)\n🔗 Link: {link}\n🔢 Số lượng: <b>{quantity}</b>\n💰 Giá: ${price}\n🕒 Thời gian: {created_at}',
      parseMode: 'HTML',
    },
    whatsapp: {
      gatewayUrl: 'https://api.green-api.com',
      apiKey: '',
      instanceId: '',
      recipientPhone: '',
      messageTemplate: '*[ĐƠN HÀNG SMM MỚI]*\nMã đơn: #{order_id}\nDịch vụ: {service_name}\nLink: {link}\nSố lượng: {quantity}',
    },
  };

  const [dispatchEnabled, setDispatchEnabled] = useState(existingConfig.enabled ?? true);
  const [dispatchMethod, setDispatchMethod] = useState<DispatchMethod>(existingConfig.method || 'ticket');

  // Ticket fields
  const [ticketProviderName, setTicketProviderName] = useState(existingConfig.ticket?.providerName || 'Provider Support');
  const [ticketLoginUrl, setTicketLoginUrl] = useState(existingConfig.ticket?.loginUrl || 'https://provider.smm.com/login');
  const [ticketUsername, setTicketUsername] = useState(existingConfig.ticket?.username || '');
  const [ticketPassword, setTicketPassword] = useState(existingConfig.ticket?.password || '');
  const [showTicketPassword, setShowTicketPassword] = useState(false);
  const [ticketSubject, setTicketSubject] = useState(
    existingConfig.ticket?.ticketSubjectTemplate || '[ORDER] #{order_id} - {service_name}'
  );
  const [ticketMessage, setTicketMessage] = useState(
    existingConfig.ticket?.ticketMessageTemplate ||
      'Kính gửi NCC,\nVui lòng kích hoạt và xử lý đơn hàng sau:\n- Mã đơn: #{order_id}\n- Dịch vụ: {service_name} (ID: {service_id})\n- Link: {link}\n- Số lượng: {quantity}\n- Thời gian: {created_at}\nCảm ơn!'
  );
  const [ticketAutoCreate, setTicketAutoCreate] = useState(existingConfig.ticket?.autoCreateOnOrder ?? true);

  // Telegram fields
  const [telegramBotToken, setTelegramBotToken] = useState(existingConfig.telegram?.botToken || '');
  const [telegramChatId, setTelegramChatId] = useState(existingConfig.telegram?.chatId || '');
  const [telegramThreadId, setTelegramThreadId] = useState(existingConfig.telegram?.threadId || '');
  const [telegramTemplate, setTelegramTemplate] = useState(
    existingConfig.telegram?.messageTemplate ||
      '🚀 <b>ĐƠN HÀNG MỚI ĐÃ CHUYỂN TIẾP</b>\n📦 Mã đơn: <code>#{order_id}</code>\n⚡ Dịch vụ: {service_name} (<code>{service_id}</code>)\n🔗 Link: {link}\n🔢 Số lượng: <b>{quantity}</b>\n💰 Giá: ${price}\n🕒 Thời gian: {created_at}'
  );

  // WhatsApp fields
  const [whatsappGatewayUrl, setWhatsappGatewayUrl] = useState(existingConfig.whatsapp?.gatewayUrl || 'https://api.green-api.com');
  const [whatsappApiKey, setWhatsappApiKey] = useState(existingConfig.whatsapp?.apiKey || '');
  const [whatsappInstanceId, setWhatsappInstanceId] = useState(existingConfig.whatsapp?.instanceId || '');
  const [whatsappRecipientPhone, setWhatsappRecipientPhone] = useState(existingConfig.whatsapp?.recipientPhone || '');
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    existingConfig.whatsapp?.messageTemplate ||
      '*[ĐƠN HÀNG SMM MỚI]*\nMã đơn: #{order_id}\nDịch vụ: {service_name}\nLink: {link}\nSố lượng: {quantity}'
  );

  // Direct API fields
  const [apiUrl, setApiUrl] = useState(existingConfig.api?.apiUrl || 'https://provider.api/v2');
  const [apiKey, setApiKey] = useState(existingConfig.api?.apiKey || '');

  const buildCurrentDispatchConfig = (): ProviderDispatchConfig => {
    return {
      enabled: dispatchEnabled,
      method: dispatchMethod,
      ticket: {
        providerName: ticketProviderName,
        loginUrl: ticketLoginUrl,
        username: ticketUsername,
        password: ticketPassword,
        ticketSubjectTemplate: ticketSubject,
        ticketMessageTemplate: ticketMessage,
        autoCreateOnOrder: ticketAutoCreate,
      },
      telegram: {
        botToken: telegramBotToken,
        chatId: telegramChatId,
        threadId: telegramThreadId,
        messageTemplate: telegramTemplate,
        parseMode: 'HTML',
      },
      whatsapp: {
        gatewayUrl: whatsappGatewayUrl,
        apiKey: whatsappApiKey,
        instanceId: whatsappInstanceId,
        recipientPhone: whatsappRecipientPhone,
        messageTemplate: whatsappTemplate,
      },
      api: {
        apiUrl,
        apiKey,
      },
    };
  };

  const handleTestDispatch = async () => {
    setTestingDispatch(true);
    setTestResult(null);
    const config = buildCurrentDispatchConfig();
    const result = await testPanelDispatch(panel.id, config);
    setTestResult(result);
    setTestingDispatch(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dispatchConfig = buildCurrentDispatchConfig();

    const ok = await updatePanel(panel.id, {
      name,
      customDomain,
      status: status as any,
      autoRenew,
      notes,
      dispatchConfig,
    });

    setLoading(false);
    if (ok) {
      if (onSaved) onSaved();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${t('panels.edit')}: ${panel.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dispatch'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t('panels.dispatchTitle')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Thông tin cơ bản & Tên miền' : 'General & Domain'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              setCurrentRoute('/dispatch');
            }}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
            title="Mở toàn màn hình trang cấu hình chuyển tiếp đơn"
          >
            <ExternalLink className="w-3 h-3" />
            <span>{language === 'vi' ? 'Mở trang riêng biệt' : 'Open Full Page'}</span>
          </button>
        </div>

        {/* TAB 1: PROVIDER ORDER DISPATCH CONFIGURATION */}
        {activeTab === 'dispatch' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  {t('panels.dispatchTitle')}
                </span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {dispatchEnabled ? (language === 'vi' ? 'Đang BẬT' : 'ENABLED') : (language === 'vi' ? 'Đang TẮT' : 'DISABLED')}
                  </span>
                  <input
                    type="checkbox"
                    checked={dispatchEnabled}
                    onChange={(e) => setDispatchEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                {t('panels.dispatchSubtitle')}
              </p>
            </div>

            {/* Dispatch Channel Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">{t('panels.dispatchMethod')}:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ticket', label: '1. ' + t('panels.methodTicket'), icon: Ticket, badge: 'TK / MK' },
                  { id: 'whatsapp', label: '2. ' + t('panels.methodWhatsapp'), icon: MessageSquare, badge: 'API Gateway' },
                  { id: 'telegram', label: '3. ' + t('panels.methodTelegram'), icon: Send, badge: 'Bot Token' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = dispatchMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDispatchMethod(item.id as DispatchMethod)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-xs bg-slate-100 text-slate-600">
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 block leading-snug">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CHANNEL 1: TICKET PROVIDER CONFIGURATION */}
            {dispatchMethod === 'ticket' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-indigo-600" />
                    {language === 'vi' ? 'Cấu Hình Đăng Nhập & Cổng Gửi Ticket NCC' : 'Provider Ticket Portal Credentials'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Tự động điền & gửi Ticket</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Tên Nhà Cung Cấp:</label>
                    <input
                      type="text"
                      value={ticketProviderName}
                      onChange={(e) => setTicketProviderName(e.target.value)}
                      placeholder="e.g. FastSMM Direct Hub"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">{t('panels.providerLoginUrl')}:</label>
                    <input
                      type="text"
                      value={ticketLoginUrl}
                      onChange={(e) => setTicketLoginUrl(e.target.value)}
                      placeholder="https://provider.smm.com/login"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">{t('panels.providerUsername')} *:</label>
                    <input
                      type="text"
                      value={ticketUsername}
                      onChange={(e) => setTicketUsername(e.target.value)}
                      placeholder="username hoặc email đăng nhập NCC"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">{t('panels.providerPassword')} *:</label>
                    <div className="relative">
                      <input
                        type={showTicketPassword ? 'text' : 'password'}
                        value={ticketPassword}
                        onChange={(e) => setTicketPassword(e.target.value)}
                        placeholder="mật khẩu tài khoản NCC"
                        className="w-full pr-9 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTicketPassword(!showTicketPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showTicketPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    checked={ticketAutoCreate}
                    onChange={(e) => setTicketAutoCreate(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                  />
                  <span>{t('panels.autoDispatchOnOrder')}</span>
                </label>
              </div>
            )}

            {/* CHANNEL 2: WHATSAPP CONFIGURATION */}
            {dispatchMethod === 'whatsapp' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    WhatsApp Gateway Dispatch Bridge
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">GreenAPI / UltraMsg / Whapi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700">Gateway API Endpoint URL:</label>
                    <input
                      type="text"
                      value={whatsappGatewayUrl}
                      onChange={(e) => setWhatsappGatewayUrl(e.target.value)}
                      placeholder="https://api.green-api.com/waInstance1101/sendMessage"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">API Key / Instance Secret Token:</label>
                    <input
                      type="password"
                      value={whatsappApiKey}
                      onChange={(e) => setWhatsappApiKey(e.target.value)}
                      placeholder="wa_live_tok_••••••••"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">{t('panels.whatsappPhone')} *:</label>
                    <input
                      type="text"
                      value={whatsappRecipientPhone}
                      onChange={(e) => setWhatsappRecipientPhone(e.target.value)}
                      placeholder="+84988776655"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700">Instance ID / Session ID (Tùy chọn):</label>
                    <input
                      type="text"
                      value={whatsappInstanceId}
                      onChange={(e) => setWhatsappInstanceId(e.target.value)}
                      placeholder="e.g. inst_71829304"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CHANNEL 3: TELEGRAM CONFIGURATION */}
            {dispatchMethod === 'telegram' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-sky-500" />
                    Telegram Dispatch Bridge
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Tương thích Bot & Channel</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700">{t('panels.telegramBotToken')} *:</label>
                    <input
                      type="text"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="e.g. 7192840192:AAHs89kLs902b_mNq9182374-xyz"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">{t('panels.telegramChatId')} *:</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="e.g. -1002938475610 hoặc @my_orders_channel"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Topic / Thread ID (Tùy chọn):</label>
                    <input
                      type="text"
                      value={telegramThreadId}
                      onChange={(e) => setTelegramThreadId(e.target.value)}
                      placeholder="e.g. 42 (nếu dùng nhóm Supergroup)"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Test Dispatch Action Box */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {language === 'vi' ? 'Kiểm tra gửi thử nghiệm đơn hàng' : 'Simulate Live Order Dispatch'}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {language === 'vi'
                      ? 'Tạo một đơn hàng mẫu và gửi thử qua kênh đã cấu hình ở trên'
                      : 'Emits a mock order #{ORD-99120} to verify authentication and payload formatting'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestDispatch}
                  disabled={testingDispatch}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{testingDispatch ? t('panels.testDispatchRunning') : t('panels.testDispatch')}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-mono border ${
                    testResult.success
                      ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
                      : 'bg-rose-950/80 text-rose-200 border-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.summary && (
                    <p className="text-[11px] text-slate-300 whitespace-pre-wrap">{testResult.summary}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GENERAL & CUSTOM DOMAIN */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Tên SMM Panel:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">{t('panels.customDomain')}:</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. apexboost.vn"
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Tên miền phụ mặc định: <code className="font-mono">{panel.domain}</code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Trạng thái Panel:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                >
                  <option value="active">Active (Hoạt động bình thường)</option>
                  <option value="maintenance">Maintenance (Bảo trì nâng cấp)</option>
                  <option value="pending">Pending (Đang chờ duyệt DNS)</option>
                  <option value="suspended">Suspended (Tạm ngưng)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Tự động gia hạn:</label>
                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">{autoRenew ? 'Đang BẬT' : 'Đang TẮT'}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Ghi chú quản trị (Notes):</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú nội bộ về phân luồng hoặc nhà cung cấp..."
                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
