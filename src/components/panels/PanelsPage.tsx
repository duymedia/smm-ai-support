import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Server,
  PlusCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Send,
  Bot,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Globe,
  Key,
  Eye,
  EyeOff,
  Clock,
  MessageSquare,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Check,
  Lock,
  Sparkles,
  Edit3,
  Trash2,
  Ticket,
  Terminal,
  Zap,
} from 'lucide-react';
import { SmmPanel } from '../../types';
import { Modal } from '../ui/Modal';
import { PanelEditModal } from './PanelEditModal';
import { PanelDeleteModal } from './PanelDeleteModal';

export const PanelsPage: React.FC = () => {
  const {
    panels,
    setCurrentRoute,
    formatMoney,
    updatePanelDomain,
    rotatePanelApiKey,
    extendPanel,
    togglePanelAutoRenew,
    getPanelRemainingTime,
    addToast,
    user,
    t,
    language,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDnsModal, setShowDnsModal] = useState(false);
  const [visibleKeyPanelId, setVisibleKeyPanelId] = useState<string | null>(null);

  // Edit modal state (General & Provider Dispatch)
  const [editingPanel, setEditingPanel] = useState<SmmPanel | null>(null);

  // Delete modal state
  const [deletingPanel, setDeletingPanel] = useState<SmmPanel | null>(null);

  // Domain edit modal state
  const [editingDomainPanel, setEditingDomainPanel] = useState<SmmPanel | null>(null);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);

  // Extend duration modal state
  const [extendingPanel, setExtendingPanel] = useState<SmmPanel | null>(null);
  const [selectedExtendOption, setSelectedExtendOption] = useState<number>(30); // days
  const [extendingLoading, setExtendingLoading] = useState(false);

  // Rotate key confirmation state
  const [rotatingPanel, setRotatingPanel] = useState<SmmPanel | null>(null);
  const [rotatingLoading, setRotatingLoading] = useState(false);

  const filteredPanels = panels.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.domain.toLowerCase().includes(search.toLowerCase()) ||
      (p.customDomain && p.customDomain.toLowerCase().includes(search.toLowerCase())) ||
      (p.apiKey && p.apiKey.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalAllMessages = panels.reduce((acc, p) => acc + (p.totalMessages || 0), 0);
  const totalAllOrders = panels.reduce((acc, p) => acc + p.totalOrders, 0);

  const handleCopyText = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', `${label || t('common.copied')}`);
  };

  const handleOpenDomainModal = (panel: SmmPanel) => {
    setEditingDomainPanel(panel);
    setCustomDomainInput(panel.customDomain || '');
  };

  const handleSaveDomain = async () => {
    if (!editingDomainPanel) return;
    setSavingDomain(true);
    const ok = await updatePanelDomain(editingDomainPanel.id, customDomainInput);
    setSavingDomain(false);
    if (ok) {
      setEditingDomainPanel(null);
    }
  };

  const handleConfirmExtend = async () => {
    if (!extendingPanel) return;
    setExtendingLoading(true);

    const costMap: Record<number, number> = {
      7: 9.99,
      30: 29.99,
      90: 79.99,
      365: 289.99,
    };
    const cost = costMap[selectedExtendOption] || 29.99;

    const ok = await extendPanel(extendingPanel.id, selectedExtendOption, cost);
    setExtendingLoading(false);
    if (ok) {
      setExtendingPanel(null);
    }
  };

  const handleConfirmRotateKey = async () => {
    if (!rotatingPanel) return;
    setRotatingLoading(true);
    await rotatePanelApiKey(rotatingPanel.id);
    setRotatingLoading(false);
    setRotatingPanel(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('panels.title')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('panels.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDnsModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('panels.dnsConfig')}</span>
          </button>

          <button
            onClick={() => setCurrentRoute('/packages')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('panels.rentButton')}</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Metric Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{t('dashboard.activePanelsCount')}</span>
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{panels.length}</p>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {panels.filter((p) => p.status === 'active').length} {t('common.active')}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{t('panels.totalMessages')}</span>
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-600">{(totalAllMessages || 0).toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">Webhooks & API orders processed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{t('panels.orders')}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600">{(totalAllOrders || 0).toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">Total client order throughput</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Avg. Platform Uptime</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">99.98%</p>
          <span className="text-[10px] text-emerald-600 font-medium">Cloudflare CDN Edge Active</span>
        </div>
      </div>

      {/* DNS INSTRUCTIONS BANNER */}
      {showDnsModal && (
        <div className="p-5 rounded-2xl bg-indigo-950 text-white border border-indigo-900 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              {t('panels.dnsConfig')}
            </span>
            <button
              onClick={() => setShowDnsModal(false)}
              className="text-xs text-indigo-300 hover:text-white cursor-pointer"
            >
              {t('common.close')}
            </button>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed">
            {t('panels.dnsTip')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-indigo-900/80 border border-indigo-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Option A: A-Record (IPv4)</span>
                <code className="text-indigo-200 font-mono text-xs">104.21.48.112</code>
              </div>
              <button
                onClick={() => handleCopyText('104.21.48.112', 'A-Record IP copied')}
                className="p-1.5 hover:bg-indigo-800 rounded-lg text-indigo-300 hover:text-white transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-indigo-900/80 border border-indigo-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Option B: Nameservers</span>
                <code className="text-indigo-200 font-mono text-xs">ns1.nexussmm.io & ns2.nexussmm.io</code>
              </div>
              <button
                onClick={() => handleCopyText('ns1.nexussmm.io\nns2.nexussmm.io', 'Nameservers copied')}
                className="p-1.5 hover:bg-indigo-800 rounded-lg text-indigo-300 hover:text-white transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('panels.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'active', 'pending', 'suspended'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st === 'all' ? t('common.all') : st}
            </button>
          ))}
        </div>
      </div>

      {/* Panels Cards Grid */}
      {filteredPanels.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Server className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No SMM Panels Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any panels matching your filter. Rent a new high-speed SMM panel now.
          </p>
          <button
            onClick={() => setCurrentRoute('/packages')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
          >
            {t('dashboard.rentNewPanel')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPanels.map((panel) => {
            const remaining = getPanelRemainingTime(panel.expiresAt, panel.createdAt);
            const isKeyVisible = visibleKeyPanelId === panel.id;
            const displayKey = panel.apiKey || 'sk_live_pnl_default_key_99';
            const maskedKey = isKeyVisible
              ? displayKey
              : `${displayKey.slice(0, 11)}••••••••••••••••${displayKey.slice(-4)}`;

            const dispatch = panel.dispatchConfig;
            const dispatchMethod = dispatch?.method || 'ticket';

            return (
              <div
                key={panel.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-4 relative"
              >
                {/* Card Header: Name, Status Badge, Plan */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{panel.name}</h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {panel.planName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {panel.id}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      panel.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {panel.status.toUpperCase()}
                  </span>
                </div>

                {/* 1. DOMAIN & CUSTOM DOMAIN SECTION */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      {t('panels.domain')}:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDomainModal(panel)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {panel.customDomain ? t('common.edit') : t('panels.addDomain')}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <code className="font-mono text-slate-800 font-medium truncate">
                        {panel.customDomain || panel.domain}
                      </code>
                      {panel.customDomain && (
                        <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                          CUSTOM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyText(`https://${panel.customDomain || panel.domain}`, 'Domain URL copied')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title={t('common.copy')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`https://${panel.customDomain || panel.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-slate-100 rounded text-blue-600 transition-colors"
                        title={t('panels.open')}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {panel.customDomain && (
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5 font-mono">
                      <span>Subdomain: {panel.domain}</span>
                      <span className="text-emerald-600 font-sans font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> TLS 1.3 Active
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. API KEY & SECRET SECTION */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      {t('panels.apiKey')}:
                    </span>
                    <button
                      onClick={() => setRotatingPanel(panel)}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                    >
                      {t('panels.rotateKey')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                    <code className="font-mono text-[11px] text-slate-800 truncate select-all">
                      {maskedKey}
                    </code>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => setVisibleKeyPanelId(isKeyVisible ? null : panel.id)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title={isKeyVisible ? 'Hide Key' : 'Show Key'}
                      >
                        {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopyText(displayKey, t('panels.copyKey'))}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title={t('panels.copyKey')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. PROVIDER ORDER DISPATCH BADGE / OVERVIEW */}
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-900 flex items-center gap-1.5 text-[11px]">
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      {t('panels.dispatchTitle')}:
                    </span>
                    <button
                      onClick={() => setEditingPanel(panel)}
                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                    >
                      {language === 'vi' ? 'Cấu hình' : 'Configure'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-blue-200/70 text-xs">
                    <div className="flex items-center gap-2">
                      {dispatchMethod === 'ticket' && (
                        <>
                          <Ticket className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-medium text-slate-800 text-[11px]">
                            Ticket: <span className="font-semibold text-indigo-700">{dispatch?.ticket?.providerName || 'Provider Portal'}</span>
                          </span>
                          {dispatch?.ticket?.username && (
                            <span className="text-[10px] text-slate-400 font-mono">({dispatch.ticket.username})</span>
                          )}
                        </>
                      )}

                      {dispatchMethod === 'telegram' && (
                        <>
                          <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="font-medium text-slate-800 text-[11px]">
                            Telegram: <span className="font-semibold text-sky-600">{dispatch?.telegram?.chatId || 'Channel / Group'}</span>
                          </span>
                        </>
                      )}

                      {dispatchMethod === 'whatsapp' && (
                        <>
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800 text-[11px]">
                            WhatsApp: <span className="font-semibold text-emerald-600">{dispatch?.whatsapp?.recipientPhone || 'Gateway'}</span>
                          </span>
                        </>
                      )}

                      {dispatchMethod === 'api' && (
                        <>
                          <Terminal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-medium text-slate-800 text-[11px]">
                            REST API: <span className="font-mono text-blue-600 text-[10px]">{dispatch?.api?.apiUrl || 'Direct'}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border ${
                        dispatch?.enabled !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {dispatch?.enabled !== false ? 'AUTO' : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* 4. PROCESSED MESSAGES & TELEMETRY */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] text-indigo-700 font-semibold block flex items-center justify-center gap-1">
                      <MessageSquare className="w-3 h-3 text-indigo-600" />
                      {t('panels.totalMessages')}
                    </span>
                    <span className="text-xs font-bold text-indigo-900">
                      {(panel.totalMessages || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {t('panels.todayMessages')}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      +{(panel.todayMessages || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {t('panels.messageRate')}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {panel.messageRatePerMin || 32.4}
                    </span>
                  </div>
                </div>

                {/* 5. REMAINING TIME & RENEWAL BAR */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${remaining.isUrgent ? 'text-rose-600' : 'text-slate-600'}`} />
                      <span className="font-semibold text-slate-700">{t('panels.remainingTime')}:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          remaining.isExpired
                            ? 'bg-rose-100 text-rose-700'
                            : remaining.isUrgent
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {remaining.text}
                      </span>
                    </div>

                    <button
                      onClick={() => setExtendingPanel(panel)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{t('panels.extendTime')}</span>
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          remaining.isUrgent ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${remaining.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{t('panels.expiresIn')}: {new Date(panel.expiresAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => togglePanelAutoRenew(panel.id)}
                        className={`font-semibold cursor-pointer ${
                          panel.autoRenew ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {t('panels.autoRenew')}: {panel.autoRenew ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6. ACTION BUTTONS: EDIT, DISPATCH, EXTEND, DELETE */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setEditingPanel(panel)}
                    className="py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('panels.edit')}</span>
                  </button>

                  <button
                    onClick={() => setCurrentRoute('/dispatch')}
                    className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title={language === 'vi' ? 'Cấu hình bắn đơn Ticket, Telegram, WhatsApp' : 'Configure Dispatch'}
                  >
                    <Send className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                    <span>{language === 'vi' ? 'Bắn đơn' : 'Dispatch'}</span>
                  </button>

                  <button
                    onClick={() => setExtendingPanel(panel)}
                    className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('panels.extendTime')}</span>
                  </button>

                  <button
                    onClick={() => setDeletingPanel(panel)}
                    className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('panels.delete')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: EDIT PANEL & PROVIDER DISPATCH CONFIGURATION */}
      {editingPanel && (
        <PanelEditModal
          panel={editingPanel}
          onClose={() => setEditingPanel(null)}
        />
      )}

      {/* MODAL 2: DELETE PANEL CONFIRMATION */}
      {deletingPanel && (
        <PanelDeleteModal
          panel={deletingPanel}
          onClose={() => setDeletingPanel(null)}
        />
      )}

      {/* MODAL 3: ADD / EDIT CUSTOM DOMAIN */}
      {editingDomainPanel && (
        <Modal
          isOpen={true}
          onClose={() => setEditingDomainPanel(null)}
          title={`Custom Domain Configuration: ${editingDomainPanel.name}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Attach your custom branded domain (e.g. <code className="text-slate-800 font-mono">boosthub.com</code> or <code className="text-slate-800 font-mono">smm.agency.vn</code>). Free TLS 1.3 SSL is provisioned automatically once DNS points to our edge.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">{t('panels.customDomain')}</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  placeholder="e.g. mysmmpanel.com"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <p className="text-[10px] text-slate-400">Leave blank to revert to default subdomain: <code className="font-mono">{editingDomainPanel.domain}</code></p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block text-[11px]">Required DNS Record:</span>
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">Type: A-Record (@)</span>
                  <span className="text-indigo-600 font-bold">104.21.48.112</span>
                </div>
                <button
                  onClick={() => handleCopyText('104.21.48.112', 'IP Copied')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingDomainPanel(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveDomain}
                disabled={savingDomain}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingDomain ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: EXTEND PANEL DURATION */}
      {extendingPanel && (
        <Modal
          isOpen={true}
          onClose={() => setExtendingPanel(null)}
          title={`${t('panels.extendTime')}: ${extendingPanel.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">{t('panels.expiresIn')}</span>
                <span className="font-bold text-slate-900">{new Date(extendingPanel.expiresAt).toLocaleDateString()}</span>
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
                    onClick={() => setSelectedExtendOption(opt.days)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      selectedExtendOption === opt.days
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
                onClick={() => setExtendingPanel(null)}
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

      {/* MODAL 5: ROTATE KEY CONFIRMATION */}
      {rotatingPanel && (
        <Modal
          isOpen={true}
          onClose={() => setRotatingPanel(null)}
          title={`${t('panels.rotateKey')}: ${rotatingPanel.name}`}
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
                onClick={() => setRotatingPanel(null)}
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
