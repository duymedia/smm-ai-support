import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Server,
  PlusCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Send,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Key,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  Lock,
  Sparkles,
  Edit3,
  Trash2,
  LayoutGrid,
  List,
  Wallet,
  Check,
  SlidersHorizontal,
  LogIn,
  LoaderCircle,
} from 'lucide-react';
import { SmmPanel } from '../../types';
import { Modal } from '../ui/Modal';
import { Select2 } from '../ui/Select2';
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
    createPanel,
    user,
    t,
    language,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showDnsModal, setShowDnsModal] = useState(false);
  const [visibleKeyPanelId, setVisibleKeyPanelId] = useState<string | null>(null);
  const [loadingCookiePanelId, setLoadingCookiePanelId] = useState<string | null>(null);

  // Active Subscription Package Detection & Catalogue Packages
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [cataloguePackages, setCataloguePackages] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchOrdersAndPackages = () => {
    setOrdersLoading(true);
    Promise.all([
      fetch('/api/orders?_t=' + Date.now()).then((r) => r.json()),
      fetch('/api/packages?_t=' + Date.now()).then((r) => r.json()),
    ])
      .then(([ordersData, pkgsData]) => {
        if (ordersData?.data && Array.isArray(ordersData.data)) {
          setUserOrders(ordersData.data);
        }
        if (pkgsData?.data && Array.isArray(pkgsData.data)) {
          setCataloguePackages(pkgsData.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    fetchOrdersAndPackages();
  }, []);

  const activeRentedOrders = userOrders.filter(
    (o) => (o.status === 'active' || !o.status) && (!o.expiresAt || new Date(o.expiresAt) > new Date())
  );
  const hasActivePackage = activeRentedOrders.length > 0 || cataloguePackages.length > 0 || panels.length > 0;

  // Edit modal state (General & Provider Dispatch)
  const [editingPanel, setEditingPanel] = useState<SmmPanel | null>(null);

  // Delete modal state
  const [deletingPanel, setDeletingPanel] = useState<SmmPanel | null>(null);

  // Create panel modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    domain: '',
    apiKey: '',
    adminUsername: '',
    adminPassword: '',
    adminTwoFactorSecret: '',
    orderId: '',
    packageId: '',
    notes: '',
  });
  const [creatingLoading, setCreatingLoading] = useState(false);

  // Extend duration modal state
  const [extendingPanel, setExtendingPanel] = useState<SmmPanel | null>(null);
  const [selectedExtendOption, setSelectedExtendOption] = useState<number>(30);
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
  const totalActivePanels = panels.filter((p) => p.status === 'active').length;
  const totalPanelBalances = panels.reduce((acc, p) => acc + (Number(p.balance) || 0), 0);

  const handleCopyText = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', `${label || (language === 'vi' ? 'Đã sao chép vào bộ nhớ tạm' : 'Copied to clipboard')}`);
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

  const handleRentOrAddPanel = () => {
    const firstOrder = activeRentedOrders[0];
    const defaultPackage = cataloguePackages[0];
    setCreateForm({
      name: '',
      domain: '',
      apiKey: '',
      adminUsername: '',
      adminPassword: '',
      adminTwoFactorSecret: '',
      orderId: firstOrder ? String(firstOrder.id) : (defaultPackage ? String(defaultPackage.id) : ''),
      packageId: !firstOrder && defaultPackage ? String(defaultPackage.id) : '',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreatePanelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLoading(true);
    const ok = await createPanel(createForm);
    setCreatingLoading(false);
    if (ok) {
      setIsCreateModalOpen(false);
      fetch('/api/orders?_t=' + Date.now())
        .then((r) => r.json())
        .then((data) => {
          if (data?.data && Array.isArray(data.data)) setUserOrders(data.data);
        });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 w-full min-w-0">
      {/* 1. Active Package Requirement Notice Banner */}
      {!ordersLoading && !hasActivePackage && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{language === 'vi' ? 'Yêu cầu thuê gói dịch vụ' : 'Active plan required'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-900">
                  {language === 'vi' ? 'Chưa kích hoạt' : 'Inactive'}
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {language === 'vi'
                  ? 'Bạn chưa thuê gói dịch vụ nào hoặc gói đã hết hạn. Vui lòng chọn gói thuê để khởi chạy panel.'
                  : 'You do not have an active package subscription. Please rent a package to create and connect SMM panels.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentRoute('/packages')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>{language === 'vi' ? 'Xem bảng giá & thuê gói' : 'Browse packages'}</span>
          </button>
        </div>
      )}

      {/* 2. Top Header & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{language === 'vi' ? 'Quản lý danh sách SMM panels' : 'SMM Panels Management'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
              {panels.length} {language === 'vi' ? 'panel' : 'panels'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'vi'
              ? 'Theo dõi trạng thái, cấu hình tên miền, API key và điều phối đơn hàng của các panel.'
              : 'Monitor live status, custom domains, API keys, and order dispatch workflows.'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowDnsModal(true)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'vi' ? 'Cấu hình DNS' : 'DNS Config'}</span>
          </button>

          <button
            onClick={handleRentOrAddPanel}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              hasActivePackage
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md shadow-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title={!hasActivePackage ? (language === 'vi' ? 'Cần thuê gói dịch vụ trước' : 'Package required') : undefined}
          >
            {hasActivePackage ? <PlusCircle className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
            <span>{language === 'vi' ? 'Thêm panel mới' : 'Add new panel'}</span>
          </button>
        </div>
      </div>

      {/* 3. Aggregate KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{language === 'vi' ? 'Tổng số panel' : 'Total panels'}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Server className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 font-mono">{panels.length}</p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {totalActivePanels} {language === 'vi' ? 'đang hoạt động' : 'online'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{language === 'vi' ? 'Tổng ví panel' : 'Panel balances'}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-600 font-mono">{formatMoney(totalPanelBalances)}</p>
          <span className="text-[10px] text-slate-400 font-mono">{language === 'vi' ? 'Tổng số dư các panel' : 'Combined balance'}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{language === 'vi' ? 'Đơn đã xử lý' : 'Total orders'}</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-purple-700 font-mono">{totalAllOrders.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400">{(totalAllMessages || 0).toLocaleString()} webhook & API</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{language === 'vi' ? 'Hạ tầng SLA' : 'Uptime SLA'}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 font-mono">99.98%</p>
          <span className="text-[10px] text-emerald-600 font-medium">Cloudflare TLS 1.3 edge</span>
        </div>
      </div>

      {/* 4. DNS INSTRUCTIONS ACCORDION / BANNER */}
      {showDnsModal && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              {language === 'vi' ? 'Hướng dẫn trỏ DNS tên miền riêng' : 'Custom Domain DNS Guide'}
            </span>
            <button
              onClick={() => setShowDnsModal(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              {language === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            {language === 'vi'
              ? 'Trỏ bản ghi A hoặc Nameservers từ nhà cung cấp tên miền của bạn về hệ thống để kích hoạt SSL miễn phí và kết nối SMM panel:'
              : 'Point your domain A-Record or Nameservers to our edge servers to activate automatic SSL and connect your storefront:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Bản ghi A (IPv4):</span>
                <code className="text-blue-300 font-mono text-xs font-bold">104.21.48.112</code>
              </div>
              <button
                onClick={() => handleCopyText('104.21.48.112', 'Đã sao chép IP')}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sao chép"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Nameservers:</span>
                <code className="text-blue-300 font-mono text-xs font-bold">ns1.nexussmm.io & ns2.nexussmm.io</code>
              </div>
              <button
                onClick={() => handleCopyText('ns1.nexussmm.io\nns2.nexussmm.io', 'Đã sao chép Nameservers')}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sao chép"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Filter, Search & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'vi' ? 'Tìm theo tên panel, domain, API key...' : 'Search panel, domain, API key...'}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
              { id: 'active', label: language === 'vi' ? 'Hoạt động' : 'Active' },
              { id: 'suspended', label: language === 'vi' ? 'Tạm ngưng' : 'Suspended' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  filterStatus === st.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Table (Default) vs Grid */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title={language === 'vi' ? 'Dạng bảng chi tiết' : 'Table view'}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">{language === 'vi' ? 'Dạng bảng' : 'Table'}</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title={language === 'vi' ? 'Dạng thẻ lưới' : 'Grid view'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">{language === 'vi' ? 'Dạng thẻ' : 'Grid'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Panels Content: Table View (Default) vs Grid Cards */}
      {filteredPanels.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
          {!hasActivePackage ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Chưa có gói dịch vụ kích hoạt' : 'Package rental required'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {language === 'vi'
                  ? 'Bạn chưa thể khởi tạo hoặc kết nối SMM panel vì chưa thuê gói dịch vụ nào. Hãy chọn gói thuê phù hợp để bắt đầu sử dụng.'
                  : 'You cannot create or manage SMM panels without an active rental plan. Choose a package to unlock full panel access.'}
              </p>
              <button
                onClick={() => setCurrentRoute('/packages')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>{language === 'vi' ? 'Xem bảng giá & thuê gói ngay' : 'Browse packages & rent'}</span>
              </button>
            </>
          ) : (
            <>
              <Server className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Không tìm thấy panel nào' : 'No panels found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {language === 'vi'
                  ? 'Không tìm thấy panel nào phù hợp với bộ lọc hiện tại của bạn.'
                  : "You don't have any panels matching your current filter."}
              </p>
              <button
                onClick={handleRentOrAddPanel}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'vi' ? 'Thêm panel mới' : 'Add new panel'}</span>
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* PREMIUM TABLE VIEW MODE */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden w-full min-w-0 max-w-full">
          <div className="overflow-x-auto w-full overscroll-x-contain touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs border-collapse min-w-[680px]">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold text-[11px] whitespace-nowrap">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">#ID</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Tên panel' : 'Panel name'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Tên miền (Domain)' : 'Domain'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'API Key' : 'API Key'}</th>
                  <th className="py-3 px-4">Cookie</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Gói dịch vụ' : 'Plan'}</th>
                  <th className="py-3 px-4 text-center">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 whitespace-nowrap">
                {filteredPanels.map((panel) => {
                  const isKeyVisible = visibleKeyPanelId === panel.id;
                  const displayKey = panel.apiKey || '';
                  const maskedKey = isKeyVisible
                    ? displayKey
                    : `${displayKey.slice(0, 8)}••••••••${displayKey.slice(-4)}`;

                  return (
                    <tr key={panel.id} className="hover:bg-slate-50/90 transition-colors">
                      {/* #ID */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 text-xs">
                          #{panel.id}
                        </span>
                      </td>

                      {/* Tên panel (Chỉ hiển thị name tinh gọn) */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-xs">
                          {panel.name}
                        </span>
                      </td>

                      {/* Tên miền */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-blue-600 font-bold text-xs bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            {panel.domain}
                          </code>
                          <button
                            onClick={() => handleCopyText(`https://${panel.domain}`, language === 'vi' ? 'Đã sao chép tên miền' : 'Domain copied')}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Sao chép link' : 'Copy'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`https://${panel.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Mở trang web' : 'Open'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* API Key */}
                      <td className="py-3 px-4">
                        {panel.apiKey ? (
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                              {maskedKey}
                            </code>
                            <button
                              onClick={() => setVisibleKeyPanelId(isKeyVisible ? null : panel.id)}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title={isKeyVisible ? 'Ẩn khóa' : 'Hiện khóa'}
                            >
                              {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopyText(displayKey, language === 'vi' ? 'Đã sao chép API Key' : 'API Key copied')}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title="Sao chép"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {language === 'vi' ? 'Chưa nhập key' : 'No key'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {panel.cookie ? (
                          <button onClick={() => handleCopyText(panel.cookie || '', 'Cookie copied')} className="font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 max-w-[150px] truncate block cursor-pointer" title="Copy cookie">
                            {panel.cookie.slice(0, 18)}••••
                          </button>
                        ) : <button onClick={async () => { setLoadingCookiePanelId(panel.id); try { const r = await fetch(`/api/panels/${panel.id}/load-cookie`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Language': language }, credentials: 'include' }); const raw = await r.text(); const d = raw ? JSON.parse(raw) : {}; if (r.ok && d.success) { addToast('success', language === 'vi' ? 'Đã đăng nhập và tải cookie thành công' : 'Logged in and loaded cookie'); window.location.reload(); } else addToast('error', d.message || `Cookie load failed (${r.status})`); } catch (e) { addToast('error', language === 'vi' ? 'Không thể kết nối máy chủ.' : 'Unable to connect to server.'); } finally { setLoadingCookiePanelId(null); } }} disabled={loadingCookiePanelId === panel.id} className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50 cursor-pointer" title={language === 'vi' ? 'Đăng nhập và tải cookie' : 'Login and load cookie'} aria-label="Load cookie">{loadingCookiePanelId === panel.id ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}</button>}
                      </td>

                      {/* Gói dịch vụ */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {panel.planName || 'Standard'}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                            panel.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${panel.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <span>{panel.status === 'active' ? (language === 'vi' ? 'Hoạt động' : 'Active') : (language === 'vi' ? 'Tạm ngưng' : 'Suspended')}</span>
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingPanel(panel)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title={language === 'vi' ? 'Chỉnh sửa cấu hình' : 'Edit'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                          </button>

                          <button
                            onClick={() => setDeletingPanel(panel)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Xóa panel' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Counter Toolbar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                {language === 'vi'
                  ? `Hiển thị ${filteredPanels.length} trên tổng số ${panels.length} panel`
                  : `Showing ${filteredPanels.length} of ${panels.length} panels`}
              </span>
              <span className="sm:hidden text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md font-medium">
                {language === 'vi' ? '← Kéo ngang để xem tiếp →' : '← Swipe to see more →'}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-700">
              {language === 'vi' ? 'Tổng số dư: ' : 'Total: '}{formatMoney(totalPanelBalances)}
            </span>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPanels.map((panel) => {
            const remaining = getPanelRemainingTime(panel.expiresAt, panel.createdAt);
            const isKeyVisible = visibleKeyPanelId === panel.id;
            const displayKey = panel.apiKey || 'sk_live_pnl_demo_key';
            const maskedKey = isKeyVisible
              ? displayKey
              : `${displayKey.slice(0, 10)}••••••••••••${displayKey.slice(-4)}`;

            const isTrial = panel.planId === 'free-trial' || panel.planName?.includes('0 VNĐ') || panel.planName?.toLowerCase().includes('trial');

            return (
              <div
                key={panel.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all space-y-3.5 relative group"
              >
                {/* Header: Avatar, Name, Plan, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {panel.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isTrial
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {panel.planName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span className="font-semibold text-blue-600">#{panel.id}</span>
                        <span>•</span>
                        <span className="font-sans text-slate-500">{panel.domain}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 flex items-center gap-1.5 ${
                      panel.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${panel.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span>{panel.status === 'active' ? (language === 'vi' ? 'Hoạt động' : 'Active') : (language === 'vi' ? 'Tạm ngưng' : 'Suspended')}</span>
                  </span>
                </div>

                {/* Domain Container */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'vi' ? 'Tên miền:' : 'Domain:'}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SSL TLS 1.3
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                    <code className="font-mono text-blue-600 font-bold truncate text-[11px]">
                      {panel.domain}
                    </code>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => handleCopyText(`https://${panel.domain}`, language === 'vi' ? 'Đã sao chép link tên miền' : 'Domain URL copied')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title={language === 'vi' ? 'Sao chép link' : 'Copy URL'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`https://${panel.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-blue-50 rounded text-blue-600 hover:text-blue-700 transition-colors"
                        title={language === 'vi' ? 'Mở trang web' : 'Open domain'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* API Key Container */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>API Key:</span>
                    </span>
                    <button
                      onClick={() => setRotatingPanel(panel)}
                      className="text-[10px] font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                    >
                      {language === 'vi' ? 'Đổi khóa mới' : 'Rotate key'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                    <code className="font-mono text-[11px] text-slate-800 truncate select-all font-medium">
                      {maskedKey}
                    </code>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => setVisibleKeyPanelId(isKeyVisible ? null : panel.id)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title={isKeyVisible ? 'Ẩn khóa' : 'Hiện khóa'}
                      >
                        {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopyText(displayKey, language === 'vi' ? 'Đã sao chép API Key' : 'API Key copied')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Sao chép"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expiry & Remaining Progress Bar */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold">{language === 'vi' ? 'Thời hạn:' : 'Expiry:'}</span>
                      <span className="font-mono font-bold text-slate-900">{new Date(panel.expiresAt).toLocaleDateString()}</span>
                    </div>

                    <span
                      className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
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

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        remaining.isUrgent ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${remaining.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <button
                      onClick={() => setEditingPanel(panel)}
                      className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                    </button>

                    <button
                      onClick={() => setExtendingPanel(panel)}
                      className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Gia hạn' : 'Extend'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setDeletingPanel(panel)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-xl transition-all cursor-pointer"
                    title={language === 'vi' ? 'Xóa panel' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: EDIT PANEL */}
      {editingPanel && (
        <PanelEditModal
          panel={editingPanel}
          activeRentedOrders={activeRentedOrders}
          cataloguePackages={cataloguePackages}
          onSaved={fetchOrdersAndPackages}
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

      {/* MODAL 3: EXTEND PANEL DURATION */}
      {extendingPanel && (() => {
        const matchingPkg =
          cataloguePackages.find(
            (p) => String(p.id) === String(extendingPanel?.packageId) || p.code === extendingPanel?.planId
          ) ||
          cataloguePackages.find((p) => p.name === extendingPanel?.planName);

        const packageExists = Boolean(matchingPkg);

        const monthlyPrice = packageExists ? Number(matchingPkg?.monthlyPrice || matchingPkg?.pricing?.monthly || 29.99) : 0;
        const weeklyPrice = packageExists ? Number(matchingPkg?.weeklyPrice || matchingPkg?.pricing?.weekly || Math.round((monthlyPrice / 4) * 100) / 100) : 0;
        const yearlyPrice = packageExists ? Number(matchingPkg?.yearlyPrice || matchingPkg?.pricing?.yearly || Math.round((monthlyPrice * 10) * 100) / 100) : 0;

        const extendCycleOptions = packageExists
          ? [
              {
                days: 7,
                cycle: 'weekly',
                title: language === 'vi' ? 'Gói 1 tuần' : 'Weekly Plan',
                durationText: language === 'vi' ? '+7 ngày' : '+7 days',
                cost: weeklyPrice,
              },
              {
                days: 30,
                cycle: 'monthly',
                title: language === 'vi' ? 'Gói 1 tháng' : 'Monthly Plan',
                durationText: language === 'vi' ? '+30 ngày' : '+30 days',
                cost: monthlyPrice,
                popular: true,
              },
              {
                days: 365,
                cycle: 'yearly',
                title: language === 'vi' ? 'Gói 1 năm' : 'Yearly Plan',
                durationText: language === 'vi' ? '+365 ngày (1 năm)' : '+365 days (1 year)',
                cost: yearlyPrice,
                badge: language === 'vi' ? 'TIẾT KIỆM 20%' : 'BEST VALUE',
              },
            ]
          : [];

        const activeCost =
          selectedExtendOption === 7
            ? weeklyPrice
            : selectedExtendOption === 365
            ? yearlyPrice
            : monthlyPrice;

        const currentExpiryTime = extendingPanel.expiresAt ? new Date(extendingPanel.expiresAt).getTime() : Date.now();
        const baseTime = currentExpiryTime > Date.now() ? currentExpiryTime : Date.now();
        const newExpiryDate = new Date(baseTime + selectedExtendOption * 24 * 60 * 60 * 1000);
        const userBalance = Number(user?.balance || 0);
        const hasEnoughBalance = userBalance >= activeCost;

        return (
          <Modal
            isOpen={true}
            onClose={() => setExtendingPanel(null)}
            title={language === 'vi' ? `Gia hạn thời hạn: ${extendingPanel.name}` : `Extend duration: ${extendingPanel.name}`}
            size="md"
          >
            <div className="space-y-4 text-xs">
              {/* Package Not Found Warning */}
              {!packageExists ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{language === 'vi' ? 'Gói dịch vụ không còn khả dụng' : 'Package no longer available'}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-rose-700">
                    {language === 'vi'
                      ? `Gói cước liên kết (${extendingPanel.planName || extendingPanel.packageId || 'N/A'}) của panel này không còn tồn tại trong hệ thống hoặc đã bị ngừng cung cấp. Bạn không thể gia hạn trực tiếp.`
                      : 'The subscription package linked to this panel no longer exists in the system. You cannot extend this package directly.'}
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetPanel = extendingPanel;
                        setExtendingPanel(null);
                        setEditingPanel(targetPanel);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Chuyển sang Chỉnh sửa để đổi gói' : 'Edit panel to change package'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtendingPanel(null)}
                      className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      {language === 'vi' ? 'Đóng' : 'Close'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Info summary */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">{language === 'vi' ? 'Gói dịch vụ:' : 'Package:'}</span>
                      <span className="font-bold text-blue-600 text-xs truncate block">{matchingPkg.name}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">{language === 'vi' ? 'Hạn hiện tại:' : 'Current expiry:'}</span>
                      <span className="font-bold text-slate-900 font-mono text-xs">{new Date(extendingPanel.expiresAt).toLocaleDateString()}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-slate-500 font-semibold block">{language === 'vi' ? 'Số dư ví của bạn:' : 'Your balance:'}</span>
                      <span className="font-extrabold text-emerald-600 font-mono text-xs">{formatMoney(userBalance)}</span>
                    </div>
                  </div>

                  {/* Cycle selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      {language === 'vi' ? 'Chọn gói thời gian gia hạn tương thích (Tuần / Tháng / Năm):' : 'Select extension cycle (Weekly / Monthly / Yearly):'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {extendCycleOptions.map((opt) => (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => setSelectedExtendOption(opt.days)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                            selectedExtendOption === opt.days
                              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                          }`}
                        >
                          {opt.popular && (
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-blue-600 text-white">
                              PHỔ BIẾN
                            </span>
                          )}
                          {opt.badge && (
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-emerald-600 text-white">
                              {opt.badge}
                            </span>
                          )}
                          <div>
                            <span className="block font-bold text-slate-900 text-xs">{opt.title}</span>
                            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">{opt.durationText}</span>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <span className="text-xs font-extrabold text-blue-600 font-mono">${opt.cost.toFixed(2)} USD</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expiry preview & Balance check */}
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="text-slate-600 text-[11px] block">{language === 'vi' ? 'Thời hạn sau khi gia hạn:' : 'New expiry date:'}</span>
                        <span className="font-bold text-slate-900 font-mono text-xs">{newExpiryDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-600 text-[11px] block">{language === 'vi' ? 'Tổng thanh toán:' : 'Total due:'}</span>
                      <span className="font-extrabold text-blue-700 font-mono text-xs">${activeCost.toFixed(2)} USD</span>
                    </div>
                  </div>

                  {!hasEnoughBalance && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                      <span>
                        {language === 'vi'
                          ? `Số dư không đủ (Thiếu $${(activeCost - userBalance).toFixed(2)})`
                          : `Insufficient balance (Need +$${(activeCost - userBalance).toFixed(2)})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setExtendingPanel(null);
                          setCurrentRoute('/wallet');
                        }}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                      >
                        {language === 'vi' ? 'Nạp tiền ngay' : 'Deposit'}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setExtendingPanel(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmExtend}
                      disabled={extendingLoading || !hasEnoughBalance}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {extendingLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{language === 'vi' ? 'Xác nhận & Thanh toán' : 'Confirm & Pay'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* MODAL 4: ROTATE KEY CONFIRMATION */}
      {rotatingPanel && (
        <Modal
          isOpen={true}
          onClose={() => setRotatingPanel(null)}
          title={language === 'vi' ? `Tạo lại API key: ${rotatingPanel.name}` : `Rotate API key: ${rotatingPanel.name}`}
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{language === 'vi' ? 'Cảnh báo bảo mật' : 'Security Warning'}</span>
              </div>
              <p className="leading-relaxed">
                {language === 'vi'
                  ? 'Khi tạo khóa mới, API Key cũ sẽ lập tức bị vô hiệu hóa. Các kết nối API bên thứ ba sử dụng khóa cũ sẽ ngừng hoạt động.'
                  : 'Rotating this key will immediately invalidate the old API Key. All third-party integrations using the old key will stop working.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRotatingPanel(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmRotateKey}
                disabled={rotatingLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {rotatingLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'vi' ? 'Tạo khóa mới' : 'Rotate key'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: CREATE / ADD NEW SMM PANEL */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={language === 'vi' ? 'Thêm panel mới' : 'Add new SMM panel'}
          size="md"
        >
          <form onSubmit={handleCreatePanelSubmit} className="space-y-3.5 text-xs">
            {/* 1. Chọn gói dịch vụ của bạn * */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{language === 'vi' ? 'Chọn gói dịch vụ của bạn *' : 'Select your active package *'}</span>
                <span className="text-[10px] text-blue-600 font-semibold">
                  {language === 'vi' ? `${activeRentedOrders.length} gói khả dụng` : `${activeRentedOrders.length} active packages`}
                </span>
              </label>
              <Select2
                value={createForm.orderId}
                onChange={(val) => setCreateForm({ ...createForm, orderId: val })}
                options={
                  activeRentedOrders.length > 0
                    ? activeRentedOrders.map((o) => {
                        const isTrial = o.metadata?.isFreeTrial || Number(o.total) === 0 || o.package?.code === 'free-trial';
                        const planTitle = o.metadata?.planName || o.package?.name || (isTrial ? 'Trải nghiệm hệ thống SMM panel riêng biệt 0 VNĐ' : 'Gói thuê SMM panel');
                        const expStr = o.expiresAt ? new Date(o.expiresAt).toLocaleDateString() : 'Vĩnh viễn';
                        return {
                          value: String(o.id),
                          label: `${planTitle} (Hạn: ${expStr}) - [${Number(o.total) === 0 ? '0 VNĐ' : `$${Number(o.total)}`}]`,
                        };
                      })
                    : cataloguePackages.map((pkg) => ({
                        value: String(pkg.id || pkg.code),
                        label: `${pkg.name} (${Number(pkg.monthlyPrice || pkg.pricing?.monthly || 0) === 0 ? '0 VNĐ' : `$${Number(pkg.monthlyPrice || pkg.pricing?.monthly || 0)}/tháng`})`,
                      }))
                }
              />
            </div>

            {/* 2. Tên hiển thị panel */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tên hiển thị panel' : 'Panel name'}
              </label>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Nhập tên hiển thị panel (Ví dụ: ApexSMM Pro Hub)' : 'e.g. ApexSMM Pro Hub'}
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>

            {/* 3. Tên miền (domain) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tên miền (domain)' : 'Domain'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'vi' ? 'Nhập tên miền (Ví dụ: mysmmpanel.com)' : 'e.g. mysmmpanel.com'}
                value={createForm.domain}
                onChange={(e) => setCreateForm({ ...createForm, domain: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono text-xs bg-white"
              />
            </div>

            {/* 4. API Key */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'API Key (Key kết nối của panel)' : 'API Key'}
              </label>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Nhập mã API Key của SMM Panel...' : 'Enter your SMM Panel API Key...'}
                value={createForm.apiKey}
                onChange={(e) => setCreateForm({ ...createForm, apiKey: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'vi'
                  ? 'Nhập API Key do bạn quản lý từ SMM Panel để kết nối và xử lý dịch vụ.'
                  : 'Enter your SMM Panel API Key to connect and process orders.'}
              </p>
            </div>

            {/* 5. Ghi Chú */}
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
              <p className="font-bold text-amber-800">{language === 'vi' ? 'Thông tin tài khoản Admin của Panel' : 'Panel Admin account credentials'}</p>
              <input type="text" placeholder={language === 'vi' ? 'Tài khoản Admin' : 'Admin username'} value={createForm.adminUsername} onChange={(e) => setCreateForm({ ...createForm, adminUsername: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" />
              <input type="password" placeholder={language === 'vi' ? 'Mật khẩu Admin' : 'Admin password'} value={createForm.adminPassword} onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" />
              <input type="text" placeholder={language === 'vi' ? 'Secret 2FA (TOTP)' : '2FA secret (TOTP)'} value={createForm.adminTwoFactorSecret} onChange={(e) => setCreateForm({ ...createForm, adminTwoFactorSecret: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono" />
              <p className="text-[10px] text-amber-700">{language === 'vi' ? 'Thông tin nhạy cảm, chỉ dùng cho quản trị viên.' : 'Sensitive information for administrators only.'}</p>
            </div>

            {/* 6. Ghi Chú */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Ghi chú' : 'Notes'}
              </label>
              <textarea
                rows={2}
                placeholder={language === 'vi' ? 'Ghi chú phục vụ quản lý...' : 'Optional notes...'}
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={creatingLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {creatingLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'vi' ? 'Khởi tạo panel' : 'Create panel'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
