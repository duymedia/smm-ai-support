import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Server,
  ArrowLeft,
  Globe,
  ShieldCheck,
  Zap,
  Bot,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Cpu,
  Key,
  Eye,
  EyeOff,
  Copy,
  Clock,
  MessageSquare,
  TrendingUp,
  Check,
  Send,
  Code,
  Terminal,
  Edit3,
  Trash2,
  Ticket,
} from 'lucide-react';
import { SmmPanel } from '../../types';
import { Modal } from '../ui/Modal';
import { PanelEditModal } from './PanelEditModal';
import { PanelDeleteModal } from './PanelDeleteModal';

interface PanelDetailPageProps {
  panelId: string;
}

export const PanelDetailPage: React.FC<PanelDetailPageProps> = ({ panelId }) => {
  const {
    panels,
    setCurrentRoute,
    diagnosePanel,
    panelAction,
    updatePanelDomain,
    rotatePanelApiKey,
    extendPanel,
    togglePanelAutoRenew,
    getPanelRemainingTime,
    formatMoney,
    user,
    addToast,
    t,
    language,
  } = useApp();

  const panel = panels.find((p) => p.id === panelId) || panels[0];
  const [activeTab, setActiveTab] = useState<'overview' | 'dispatch' | 'apiKey' | 'domain' | 'providers' | 'logs'>('overview');
  const [aiScanning, setAiScanning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isSecretVisible, setIsSecretVisible] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Extend duration modal state
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedExtendDays, setSelectedExtendDays] = useState(30);
  const [extendingLoading, setExtendingLoading] = useState(false);

  // Rotate key confirmation state
  const [showRotateKeyModal, setShowRotateKeyModal] = useState(false);
  const [rotatingLoading, setRotatingLoading] = useState(false);

  if (!panel) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-bold text-slate-900">Panel not found</p>
        <button
          onClick={() => setCurrentRoute('/panels')}
          className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs cursor-pointer"
        >
          {t('panelDetail.backToPanels')}
        </button>
      </div>
    );
  }

  const remaining = getPanelRemainingTime(panel.expiresAt, panel.createdAt);
  const displayApiKey = panel.apiKey || 'sk_live_pnl_apex_893bfa094d2e11ec';
  const displaySecret = panel.secretKey || 'sec_pnl_secret_9921';

  const handleCopyText = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', `${label || t('common.copied')}`);
  };

  const handleRunAiDiagnostic = async () => {
    setAiScanning(true);
    setDiagnosticResult(null);
    const res = await diagnosePanel(panel.id);
    setDiagnosticResult(res.diagnosis);
    setAiScanning(false);
  };

  const handleConfirmExtend = async () => {
    setExtendingLoading(true);
    const costMap: Record<number, number> = {
      7: 9.99,
      30: 29.99,
      90: 79.99,
      365: 289.99,
    };
    const cost = costMap[selectedExtendDays] || 29.99;
    const ok = await extendPanel(panel.id, selectedExtendDays, cost);
    setExtendingLoading(false);
    if (ok) {
      setShowExtendModal(false);
    }
  };

  const handleConfirmRotateKey = async () => {
    setRotatingLoading(true);
    await rotatePanelApiKey(panel.id);
    setRotatingLoading(false);
    setShowRotateKeyModal(false);
  };

  const providersList = [
    { name: 'FastSMMApi #14', endpoint: 'https://fastsmm.api/v2', latency: '142ms', status: 'Optimal', services: 18 },
    { name: 'ViralMedia API #03', endpoint: 'https://viralmedia.io/api/v2', latency: '168ms', status: 'Optimal', services: 12 },
    { name: 'GlobalStream API #08', endpoint: 'https://globalstream.api/v2', latency: '210ms', status: 'Optimal', services: 6 },
    { name: 'TeleRocket API #19', endpoint: 'https://telerocket.net/api/v2', latency: '155ms', status: 'Optimal', services: 8 },
    { name: 'XBoost Global #05', endpoint: 'https://xboost.api/v2', latency: '188ms', status: 'Optimal', services: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card with Key Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentRoute('/panels')}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{panel.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {panel.status.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {panel.planName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>https://{panel.customDomain || panel.domain}</span>
                {panel.customDomain && (
                  <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-indigo-50 text-indigo-700">
                    CUSTOM DOMAIN
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentRoute('/dispatch')}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Cấu hình bắn đơn Ticket, Telegram, WhatsApp"
            >
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'vi' ? 'Cấu hình bắn đơn' : 'Dispatch Hub'}</span>
            </button>

            <button
              onClick={() => setShowEditModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('panels.edit')}</span>
            </button>

            <button
              onClick={() => setShowExtendModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('panels.extendTime')}</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('panels.delete')}</span>
            </button>

            <a
              href={`https://${panel.customDomain || panel.domain}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>{t('panels.open')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Highlight Banner: Domain, Key, Messages, Remaining Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* 1. Tên miền */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-600" />
              {t('panels.domain')}
            </span>
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono font-bold text-slate-900 truncate max-w-[170px]">
                {panel.customDomain || panel.domain}
              </code>
              <button
                onClick={() => handleCopyText(`https://${panel.customDomain || panel.domain}`, 'Domain copied')}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> TLS 1.3 Active
            </span>
          </div>

          {/* 2. Key */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-600" />
              {t('panels.apiKey')}
            </span>
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono font-bold text-slate-900 truncate max-w-[170px]">
                {isKeyVisible ? displayApiKey : `${displayApiKey.slice(0, 8)}••••••••`}
              </code>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsKeyVisible(!isKeyVisible)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                >
                  {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleCopyText(displayApiKey, t('panels.copyKey'))}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowRotateKeyModal(true)}
              className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
            >
              {t('panels.rotateKey')}
            </button>
          </div>

          {/* 3. Tổng tin nhắn đã xử lý */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1">
            <span className="text-[10px] font-semibold text-indigo-700 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-indigo-600" />
              {t('panels.totalMessages')}
            </span>
            <p className="text-sm font-extrabold text-indigo-900">
              {(panel.totalMessages || 0).toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Today: +{(panel.todayMessages || 0).toLocaleString()}</span>
              <span className="font-semibold text-indigo-700">{panel.messageRatePerMin || 32.4} msg/m</span>
            </div>
          </div>

          {/* 4. Thời gian còn lại */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <Clock className={`w-3 h-3 ${remaining.isUrgent ? 'text-rose-600' : 'text-slate-600'}`} />
                {t('panels.remainingTime')}
              </span>
              <button
                onClick={() => setShowExtendModal(true)}
                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                + {t('panels.extendTime')}
              </button>
            </div>
            <p className={`text-sm font-extrabold ${remaining.isUrgent ? 'text-rose-600' : 'text-slate-900'}`}>
              {remaining.text}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{new Date(panel.expiresAt).toLocaleDateString()}</span>
              <button
                onClick={() => togglePanelAutoRenew(panel.id)}
                className="font-semibold text-emerald-600 hover:underline cursor-pointer"
              >
                Auto: {panel.autoRenew ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: t('panelDetail.overviewTab'), icon: Activity },
          { id: 'dispatch', label: t('panels.dispatchTitle'), icon: Send },
          { id: 'apiKey', label: t('panelDetail.apiKeyTab'), icon: Key },
          { id: 'domain', label: t('panelDetail.domainTab'), icon: Globe },
          { id: 'providers', label: t('panelDetail.providersTab'), icon: Cpu },
          { id: 'logs', label: t('panelDetail.logsTab'), icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & HEALTH */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Diagnostic Result Box if present */}
          {diagnosticResult && (
            <div className="p-5 rounded-2xl bg-indigo-950 text-white border border-indigo-900 shadow-md space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Real-Time Telemetry & Diagnostic Report
                </span>
                <span className="text-[10px] font-mono text-indigo-200">v2.4 Core Engine</span>
              </div>
              <div className="text-xs text-indigo-100 whitespace-pre-wrap leading-relaxed">
                {diagnosticResult}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold">{t('panels.plan')}</span>
              <p className="text-base font-bold text-slate-900">{panel.planName}</p>
              <span className="text-[10px] text-slate-400">Renewal: {new Date(panel.expiresAt).toLocaleDateString()}</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold">{t('panels.orders')}</span>
              <p className="text-base font-bold text-blue-600">{(panel.totalOrders || 0).toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">Throughput: 99.8% Success</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold">{t('panels.revenue')}</span>
              <p className="text-base font-bold text-emerald-600">{formatMoney(panel.monthlyRevenue)}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Active This Month</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold">Uptime & Health</span>
              <p className="text-base font-bold text-slate-900">{panel.uptime}%</p>
              <span className="text-[10px] text-emerald-600 font-medium">{t('panelDetail.aiScore')}: {panel.healthScore}/100</span>
            </div>
          </div>

          {/* Quick Operations Matrix */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Instance Operations & Maintenance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => panelAction(panel.id, 'purge_cache')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-left transition-colors cursor-pointer"
              >
                <RefreshCw className="w-5 h-5 text-blue-600 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">{t('panelDetail.quickRestart')}</span>
                <span className="text-[10px] text-slate-500">Flush Cloudflare CDN edge memory</span>
              </button>

              <button
                onClick={() => panelAction(panel.id, 'sync_providers')}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 text-left transition-colors cursor-pointer"
              >
                <Cpu className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">{t('panelDetail.syncServices')}</span>
                <span className="text-[10px] text-slate-500">Refresh prices & active services catalog</span>
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50 text-left transition-colors cursor-pointer"
              >
                <Sliders className="w-5 h-5 text-amber-600 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">{t('panels.dispatchTitle')}</span>
                <span className="text-[10px] text-slate-500">Configure Ticket, Telegram, WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROVIDER ORDER DISPATCH */}
      {activeTab === 'dispatch' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                {t('panels.dispatchTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('panels.dispatchSubtitle')}
              </p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {language === 'vi' ? 'Chỉnh sửa cấu hình' : 'Edit Configuration'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-500 font-semibold text-[10px]">Active Dispatch Channel:</span>
              <p className="text-sm font-bold text-slate-900 capitalize">
                {panel.dispatchConfig?.method || 'ticket'}
              </p>
              <span className="text-[11px] text-slate-500 block">
                Status: {panel.dispatchConfig?.enabled !== false ? 'Auto-Forwarding Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-500 font-semibold text-[10px]">Target Destination:</span>
              <p className="text-xs font-mono text-indigo-600 font-bold">
                {panel.dispatchConfig?.method === 'ticket' && (panel.dispatchConfig.ticket?.loginUrl || 'Ticket Portal')}
                {panel.dispatchConfig?.method === 'telegram' && (panel.dispatchConfig.telegram?.chatId || '@telegram_channel')}
                {panel.dispatchConfig?.method === 'whatsapp' && (panel.dispatchConfig.whatsapp?.recipientPhone || 'WhatsApp Gateway')}
                {panel.dispatchConfig?.method === 'api' && (panel.dispatchConfig.api?.apiUrl || 'Direct API')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: API KEY & WEBHOOKS */}
      {activeTab === 'apiKey' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Panel REST API & Credentials
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Use your API key to authenticate external orders, fetch service catalog, and receive webhooks.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{t('panels.apiKey')} (Public Live Key):</span>
                  <button
                    onClick={() => setShowRotateKeyModal(true)}
                    className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer"
                  >
                    {t('panels.rotateKey')}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs">
                  <span className="text-slate-800 truncate select-all">
                    {isKeyVisible ? displayApiKey : `${displayApiKey.slice(0, 12)}••••••••••••••••••••`}
                  </span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                    >
                      {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopyText(displayApiKey, t('panels.copyKey'))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOMAIN & SSL */}
      {activeTab === 'domain' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('panelDetail.domainTab')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attached domain and SSL certificate status.
              </p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {language === 'vi' ? 'Đổi tên miền' : 'Change Domain'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold">Current Domain</span>
              <code className="text-indigo-600 font-mono font-bold block text-sm">
                {panel.customDomain || panel.domain}
              </code>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold">SSL Status</span>
              <span className="text-emerald-700 font-bold block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Let's Encrypt TLS 1.3 Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: UPSTREAM PROVIDERS */}
      {activeTab === 'providers' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Connected Upstream SMM Providers</h3>
              <p className="text-xs text-slate-500">Real-time status of connected API bridge endpoints</p>
            </div>
            <button
              onClick={() => panelAction(panel.id, 'sync_providers')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-700"
            >
              Sync All Providers (5)
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {providersList.map((prov, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{prov.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{prov.endpoint}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">{prov.services} mapped services</span>
                  <span className="font-mono text-emerald-600 font-bold">{prov.latency}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {prov.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <div className="p-5 rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
            <span>Runtime Audit & Processed Messages Log for {panel.id}</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Stream
            </span>
          </div>
          <p className="text-emerald-400">[2026-08-14 09:12:00] [INFO] Edge CDN initialized across 42 POPs.</p>
          <p className="text-slate-300">[2026-08-14 09:12:45] [HTTP] GET /api/v2/services - 200 OK (14ms)</p>
          <p className="text-slate-300">[2026-08-14 09:15:10] [SYNC] Provider #14 catalog synced (48 services active)</p>
          <p className="text-indigo-300">[2026-08-14 09:20:00] [DISPATCH] Forwarded order #9910 to provider via {panel.dispatchConfig?.method || 'ticket'}</p>
          <p className="text-emerald-400">[2026-08-14 09:25:01] [SSL] Let's Encrypt TLS 1.3 certificate status: Valid</p>
        </div>
      )}

      {/* MODAL: EDIT PANEL */}
      {showEditModal && (
        <PanelEditModal
          panel={panel}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* MODAL: DELETE PANEL */}
      {showDeleteModal && (
        <PanelDeleteModal
          panel={panel}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => setCurrentRoute('/panels')}
        />
      )}

      {/* MODAL: EXTEND PANEL */}
      {showExtendModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowExtendModal(false)}
          title={`${t('panels.extendTime')}: ${panel.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">{t('panels.expiresIn')}</span>
                <span className="font-bold text-slate-900">{new Date(panel.expiresAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">{t('addFunds.currentBalance')}</span>
                <span className="font-bold text-emerald-600">{formatMoney(user?.balance || 0)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Extension Period:</label>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {[
                  { days: 7, label: '+7 Days (1 Week)', cost: 9.99 },
                  { days: 30, label: '+30 Days (1 Month)', cost: 29.99, popular: true },
                  { days: 90, label: '+90 Days (Quarterly)', cost: 79.99 },
                  { days: 365, label: '+365 Days (1 Year - Save 20%)', cost: 289.99 },
                ].map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setSelectedExtendDays(opt.days)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      selectedExtendDays === opt.days
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {opt.popular && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-xs text-[8px] font-bold bg-blue-600 text-white">
                        POPULAR
                      </span>
                    )}
                    <span className="font-bold text-slate-900 block text-xs">{opt.label}</span>
                    <span className="text-xs font-extrabold text-blue-600 mt-1 block">
                      {formatMoney(opt.cost)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowExtendModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmExtend}
                disabled={extendingLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {extendingLoading ? t('common.loading') : `${t('common.confirm')} & Pay`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ROTATE KEY */}
      {showRotateKeyModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowRotateKeyModal(false)}
          title={`${t('panels.rotateKey')}: ${panel.name}`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Security Warning
              </div>
              <p className="leading-relaxed">
                {t('panelDetail.rotateKeyConfirm')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowRotateKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmRotateKey}
                disabled={rotatingLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {rotatingLoading ? t('common.loading') : t('panels.rotateKey')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
