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
  Wallet,
} from 'lucide-react';
import { SmmPanel } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
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
      <Card className="p-10 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
          <Server className="w-6 h-6" />
        </div>
        <p className="text-base font-bold text-slate-900">Panel not found</p>
        <Button
          variant="primary"
          size="md"
          onClick={() => setCurrentRoute('/panels')}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          {t('panelDetail.backToPanels')}
        </Button>
      </Card>
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
      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setCurrentRoute('/panels')}
              title={t('panelDetail.backToPanels')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{panel.name}</h1>
                <Badge
                  variant={panel.status === 'active' ? 'success' : 'danger'}
                  pulse={panel.status === 'active'}
                  size="sm"
                >
                  {panel.status.toUpperCase()}
                </Badge>
                <Badge variant="info" size="sm">
                  {panel.planName}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono tabular-nums">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>https://{panel.customDomain || panel.domain}</span>
                {panel.customDomain && (
                  <Badge variant="purple" size="sm">
                    CUSTOM DOMAIN
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentRoute('/dispatch')}
              icon={<Send className="w-3.5 h-3.5 text-indigo-600" />}
              title="Cấu hình bắn đơn Ticket, Telegram, WhatsApp"
            >
              {language === 'vi' ? 'Cấu hình bắn đơn' : 'Dispatch Hub'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEditModal(true)}
              icon={<Edit3 className="w-3.5 h-3.5" />}
            >
              {t('panels.edit')}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowExtendModal(true)}
              icon={<Clock className="w-3.5 h-3.5 text-emerald-600" />}
            >
              {t('panels.extendTime')}
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {t('panels.delete')}
            </Button>

            <a
              href={`https://${panel.customDomain || panel.domain}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center font-semibold rounded-full cursor-pointer transition-all duration-150 ease-out select-none press-tactile h-8 px-3.5 text-xs gap-1.5 min-w-[72px] bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
            >
              <span>{t('panels.open')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Highlight Banner: Domain, Key, Messages, Remaining Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-slate-100">
          {/* 1. Tên miền */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-blue-600" />
              {t('panels.domain')}
            </span>
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono tabular-nums font-bold text-slate-900 truncate max-w-[170px]">
                {panel.customDomain || panel.domain}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopyText(`https://${panel.customDomain || panel.domain}`, 'Domain copied')}
                className="w-6 h-6 text-slate-500 hover:text-slate-900"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="pt-0.5">
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" /> TLS 1.3 Active
              </Badge>
            </div>
          </div>

          {/* 2. Key */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
              <Key className="w-3 h-3 text-amber-600" />
              {t('panels.apiKey')}
            </span>
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono tabular-nums font-bold text-slate-900 truncate max-w-[170px]">
                {isKeyVisible ? displayApiKey : `${displayApiKey.slice(0, 8)}••••••••`}
              </code>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsKeyVisible(!isKeyVisible)}
                  className="w-6 h-6 text-slate-500 hover:text-slate-900"
                >
                  {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyText(displayApiKey, t('panels.copyKey'))}
                  className="w-6 h-6 text-slate-500 hover:text-slate-900"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <button
              onClick={() => setShowRotateKeyModal(true)}
              className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold cursor-pointer block"
            >
              {t('panels.rotateKey')}
            </button>
          </div>

          {/* 3. Tổng tin nhắn đã xử lý */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/80 space-y-1.5">
            <span className="text-[10px] font-semibold text-blue-700 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-blue-600" />
              {t('panels.totalMessages')}
            </span>
            <p className="text-base font-extrabold text-blue-900 font-mono tabular-nums">
              {(panel.totalMessages || 0).toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono tabular-nums">
              <span>Today: +{(panel.todayMessages || 0).toLocaleString()}</span>
              <span className="font-semibold text-blue-700">{panel.messageRatePerMin || 32.4} msg/m</span>
            </div>
          </div>

          {/* 4. Thời gian còn lại */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
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
            <p className={`text-base font-extrabold ${remaining.isUrgent ? 'text-rose-600' : 'text-slate-900'}`}>
              {remaining.text}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono tabular-nums">
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
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
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
            <Card macChrome title="Real-Time Telemetry & Diagnostic Report" className="bg-slate-950 text-slate-100 border-slate-800 p-5 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Core Telemetry Output
                </span>
                <span className="text-[10px] font-mono tabular-nums text-indigo-200">v2.4 Core Engine</span>
              </div>
              <div className="text-xs text-indigo-100 whitespace-pre-wrap leading-relaxed font-mono">
                {diagnosticResult}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('panels.plan')}
              value={panel.planName}
              subtitle={`Renewal: ${new Date(panel.expiresAt).toLocaleDateString()}`}
              icon={<Server className="w-4 h-4 text-blue-600" />}
            />

            <StatCard
              title={t('panels.orders')}
              value={(panel.totalOrders || 0).toLocaleString()}
              subtitle="Throughput: 99.8% Success"
              icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
              trend={{ value: 'Active', positive: true }}
            />

            <StatCard
              title={t('panels.revenue')}
              value={formatMoney(panel.monthlyRevenue)}
              subtitle="Aggregated monthly run-rate"
              icon={<Wallet className="w-4 h-4 text-emerald-600" />}
              trend={{ value: '+12.4%', positive: true }}
            />

            <StatCard
              title="Uptime & Health"
              value={`${panel.uptime}%`}
              subtitle={`${t('panelDetail.aiScore')}: ${panel.healthScore}/100`}
              icon={<ShieldCheck className="w-4 h-4 text-amber-600" />}
              trend={{ value: 'Optimal', positive: true }}
            />
          </div>

          {/* Quick Operations Matrix */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Instance Operations & Maintenance</h3>
              <Badge variant="neutral" size="sm">TLS 1.3 Active</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => panelAction(panel.id, 'purge_cache')}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/40 text-left transition-all cursor-pointer space-y-1 group"
              >
                <RefreshCw className="w-5 h-5 text-blue-600 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-xs font-bold text-slate-900 block">{t('panelDetail.quickRestart')}</span>
                <span className="text-[11px] text-slate-500 block">Flush Cloudflare CDN edge memory</span>
              </div>

              <div
                onClick={() => panelAction(panel.id, 'sync_providers')}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-emerald-400 bg-slate-50/70 hover:bg-emerald-50/40 text-left transition-all cursor-pointer space-y-1 group"
              >
                <Cpu className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 block">{t('panelDetail.syncServices')}</span>
                <span className="text-[11px] text-slate-500 block">Refresh prices & active services catalog</span>
              </div>

              <div
                onClick={() => setShowEditModal(true)}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50/40 text-left transition-all cursor-pointer space-y-1 group"
              >
                <Sliders className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold text-slate-900 block">{t('panels.dispatchTitle')}</span>
                <span className="text-[11px] text-slate-500 block">Configure Ticket, Telegram, WhatsApp</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: PROVIDER ORDER DISPATCH */}
      {activeTab === 'dispatch' && (
        <Card macChrome title="Automated Order Dispatching" className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                {t('panels.dispatchTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('panels.dispatchSubtitle')}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEditModal(true)}
              icon={<Edit3 className="w-3.5 h-3.5" />}
            >
              {language === 'vi' ? 'Chỉnh sửa cấu hình' : 'Edit Configuration'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">Active Dispatch Channel:</span>
              <p className="text-sm font-bold text-slate-900 capitalize">
                {panel.dispatchConfig?.method || 'ticket'}
              </p>
              <div className="pt-1">
                <Badge
                  variant={panel.dispatchConfig?.enabled !== false ? 'success' : 'danger'}
                  pulse={panel.dispatchConfig?.enabled !== false}
                  size="sm"
                >
                  {panel.dispatchConfig?.enabled !== false ? 'Auto-Forwarding Active' : 'Disabled'}
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">Target Destination:</span>
              <code className="text-xs font-mono tabular-nums text-blue-600 font-bold block truncate">
                {panel.dispatchConfig?.method === 'ticket' && (panel.dispatchConfig.ticket?.loginUrl || 'Ticket Portal')}
                {panel.dispatchConfig?.method === 'telegram' && (panel.dispatchConfig.telegram?.chatId || '@telegram_channel')}
                {panel.dispatchConfig?.method === 'whatsapp' && (panel.dispatchConfig.whatsapp?.recipientPhone || 'WhatsApp Gateway')}
                {panel.dispatchConfig?.method === 'api' && (panel.dispatchConfig.api?.apiUrl || 'Direct API')}
              </code>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: API KEY & WEBHOOKS */}
      {activeTab === 'apiKey' && (
        <Card macChrome title="Panel REST API & Credentials" className="p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              Developer Gateway Keys
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Use your API key to authenticate external orders, fetch service catalog, and receive webhooks.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{t('panels.apiKey')} (Public Live Key):</span>
                <button
                  onClick={() => setShowRotateKeyModal(true)}
                  className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer"
                >
                  {t('panels.rotateKey')}
                </button>
              </div>
              <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 font-mono tabular-nums text-xs">
                <span className="text-slate-800 truncate select-all">
                  {isKeyVisible ? displayApiKey : `${displayApiKey.slice(0, 12)}••••••••••••••••••••`}
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsKeyVisible(!isKeyVisible)}
                    className="w-7 h-7 text-slate-500 hover:text-slate-900"
                  >
                    {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyText(displayApiKey, t('panels.copyKey'))}
                    className="w-7 h-7 text-slate-500 hover:text-slate-900"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: DOMAIN & SSL */}
      {activeTab === 'domain' && (
        <Card macChrome title="Domain Mapping & Edge SSL" className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('panelDetail.domainTab')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attached domain and SSL certificate status.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              {language === 'vi' ? 'Đổi tên miền' : 'Change Domain'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Current Domain</span>
              <code className="text-blue-600 font-mono tabular-nums font-bold block text-sm">
                {panel.customDomain || panel.domain}
              </code>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">SSL Status</span>
              <div className="pt-0.5">
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" /> Let's Encrypt TLS 1.3 Active
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 5: UPSTREAM PROVIDERS */}
      {activeTab === 'providers' && (
        <Card macChrome title="Connected Upstream SMM Providers" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upstream API Endpoints</h3>
              <p className="text-xs text-slate-500">Real-time status of connected API bridge endpoints</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => panelAction(panel.id, 'sync_providers')}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sync All Providers (5)
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {providersList.map((prov, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{prov.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums">{prov.endpoint}</p>
                </div>
                <div className="flex items-center gap-3.5 text-xs">
                  <span className="text-slate-500 text-[11px]">{prov.services} mapped services</span>
                  <span className="font-mono tabular-nums text-emerald-600 font-bold">{prov.latency}</span>
                  <Badge variant="success" size="sm">
                    {prov.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 6: SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <Card macChrome title={`Runtime Audit & Processed Messages Log for ${panel.id}`} className="bg-slate-950 text-slate-200 border-slate-800 font-mono text-xs p-5 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
            <span>Runtime Audit & Processed Messages Log for {panel.id}</span>
            <Badge variant="success" pulse size="sm">
              Live Stream
            </Badge>
          </div>
          <div className="space-y-1.5 pt-1">
            <p className="text-emerald-400">[2026-08-14 09:12:00] [INFO] Edge CDN initialized across 42 POPs.</p>
            <p className="text-slate-300">[2026-08-14 09:12:45] [HTTP] GET /api/v2/services - 200 OK (14ms)</p>
            <p className="text-slate-300">[2026-08-14 09:15:10] [SYNC] Provider #14 catalog synced (48 services active)</p>
            <p className="text-blue-400">[2026-08-14 09:20:00] [DISPATCH] Forwarded order #9910 to provider via {panel.dispatchConfig?.method || 'ticket'}</p>
            <p className="text-emerald-400">[2026-08-14 09:25:01] [SSL] Let's Encrypt TLS 1.3 certificate status: Valid</p>
          </div>
        </Card>
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
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">{t('panels.expiresIn')}</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums mt-0.5 block">{new Date(panel.expiresAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">{t('addFunds.currentBalance')}</span>
                <span className="font-extrabold text-emerald-600 font-mono tabular-nums mt-0.5 block">{formatMoney(user?.balance || 0)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Select Extension Period:</label>
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
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      selectedExtendDays === opt.days
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-2xs'
                        : 'border-slate-200/90 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {opt.popular && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                        POPULAR
                      </span>
                    )}
                    <span className="font-bold text-slate-900 block text-xs">{opt.label}</span>
                    <span className="text-xs font-extrabold text-blue-600 mt-1 block font-mono tabular-nums">
                      {formatMoney(opt.cost)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExtendModal(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleConfirmExtend}
                loading={extendingLoading}
              >
                {`${t('common.confirm')} & Pay`}
              </Button>
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
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Security Warning
              </div>
              <p className="leading-relaxed text-amber-800">
                {t('panelDetail.rotateKeyConfirm')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRotateKeyModal(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRotateKey}
                loading={rotatingLoading}
              >
                {t('panels.rotateKey')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
