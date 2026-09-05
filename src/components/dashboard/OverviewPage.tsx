import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  Server,
  TrendingUp,
  Activity,
  PlusCircle,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Zap,
  LifeBuoy,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Clock,
  Globe,
  Radio,
  Sparkles,
  Check,
  Percent,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const {
    user,
    panels,
    transactions,
    subscriptions,
    formatMoney,
    setCurrentRoute,
    setSelectedPanelForDetail,
    language,
    t,
  } = useApp();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [activeDonutTab, setActiveDonutTab] = useState<'platforms' | 'status'>('platforms');
  const [scanningHealth, setScanningHealth] = useState(false);
  const [healthScanSuccess, setHealthScanSuccess] = useState(false);

  const userPanels = panels.filter((p) => !user?.id || String(p.userId) === String(user.id) || !p.userId);
  const totalOrders = userPanels.reduce((acc, p) => acc + (p.totalOrders || 0), 0);
  const totalMessages = userPanels.reduce((acc, p) => acc + (p.totalMessages || 0), 0);
  const monthlyRevenue = userPanels.reduce((acc, p) => acc + (p.monthlyRevenue || 0), 0);
  const activePanelsCount = userPanels.filter((p) => p.status === 'active').length;

  const handleRunGlobalScan = () => {
    setScanningHealth(true);
    setTimeout(() => {
      setScanningHealth(false);
      setHealthScanSuccess(true);
      setTimeout(() => setHealthScanSuccess(false), 5000);
    }, 1200);
  };

  // 1. DATA BIỂU ĐỒ CỘT (BAR CHART - Doanh thu & Đơn hàng)
  const barChartDataByTimeframe = {
    '7d': [
      { label: 'T2', orders: 180, revenue: 420 },
      { label: 'T3', orders: 240, revenue: 580 },
      { label: 'T4', orders: 310, revenue: 760 },
      { label: 'T5', orders: 290, revenue: 690 },
      { label: 'T6', orders: 420, revenue: 1050 },
      { label: 'T7', orders: 560, revenue: 1380 },
      { label: 'CN', orders: 490, revenue: 1210 },
    ],
    '30d': [
      { label: 'Ngày 01', orders: 120, revenue: 340 },
      { label: 'Ngày 05', orders: 240, revenue: 680 },
      { label: 'Ngày 10', orders: 380, revenue: 1040 },
      { label: 'Ngày 15', orders: 510, revenue: 1490 },
      { label: 'Ngày 20', orders: 690, revenue: 2150 },
      { label: 'Ngày 25', orders: 840, revenue: 2680 },
      { label: 'Ngày 30', orders: 1120, revenue: 3480 },
    ],
    '90d': [
      { label: 'Tháng 1', orders: 3400, revenue: 8900 },
      { label: 'Tháng 2', orders: 4600, revenue: 12400 },
      { label: 'Tháng 3', orders: 5900, revenue: 16800 },
    ],
  };

  const currentBarData = barChartDataByTimeframe[timeframe];
  const maxBarRevenue = Math.max(...currentBarData.map((d) => d.revenue));
  const maxBarOrders = Math.max(...currentBarData.map((d) => d.orders));

  // 2. DATA BIỂU ĐỒ TRÒN (DONUT / PIE CHARTS)
  // 2.1 Phân bố nền tảng dịch vụ SMM
  const platformStats = [
    { name: 'TikTok', percent: 38, count: '4,560 orders', color: '#ec4899', bgClass: 'bg-pink-500' },
    { name: 'Instagram', percent: 28, count: '3,360 orders', color: '#8b5cf6', bgClass: 'bg-purple-500' },
    { name: 'Facebook', percent: 18, count: '2,160 orders', color: '#3b82f6', bgClass: 'bg-blue-500' },
    { name: 'YouTube', percent: 11, count: '1,320 orders', color: '#ef4444', bgClass: 'bg-red-500' },
    { name: 'Telegram / Khác', percent: 5, count: '600 orders', color: '#10b981', bgClass: 'bg-emerald-500' },
  ];

  // 2.2 Phân bố trạng thái xử lý đơn hàng
  const fulfillmentStats = [
    { name: language === 'vi' ? 'Hoàn thành' : 'Completed', percent: 84, count: '10,080', color: '#10b981', bgClass: 'bg-emerald-500' },
    { name: language === 'vi' ? 'Đang xử lý' : 'In Progress', percent: 11, count: '1,320', color: '#3b82f6', bgClass: 'bg-blue-500' },
    { name: language === 'vi' ? 'Đang chờ' : 'Pending', percent: 3, count: '360', color: '#f59e0b', bgClass: 'bg-amber-500' },
    { name: language === 'vi' ? 'Hủy / Hoàn tiền' : 'Refunded', percent: 2, count: '240', color: '#ef4444', bgClass: 'bg-rose-500' },
  ];

  // 3. DATA BIỂU ĐỒ ĐƯỜNG (LINE CHART - Tốc độ tin nhắn & API Throughput)
  const lineThroughputData = [
    { hour: '00:00', requests: 45, latency: 120 },
    { hour: '04:00', requests: 28, latency: 110 },
    { hour: '08:00', requests: 120, latency: 145 },
    { hour: '12:00', requests: 240, latency: 160 },
    { hour: '16:00', requests: 310, latency: 175 },
    { hour: '20:00', requests: 380, latency: 155 },
    { hour: '23:59', requests: 190, latency: 130 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('dashboard.welcomeBack')}, {user?.name || user?.username}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'vi'
              ? 'Hệ thống vận hành ổn định. Giám sát tự động đơn hàng và kết nối API 24/7 đang hoạt động.'
              : 'Fleet operations are running normally. Autonomous monitoring is actively managing your API providers.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunGlobalScan}
            disabled={scanningHealth}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanningHealth ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{scanningHealth ? (language === 'vi' ? 'Đang kiểm tra...' : 'Diagnosing...') : (language === 'vi' ? 'Quét sức khỏe hệ thống' : 'System Health Scan')}</span>
          </button>

          <button
            onClick={() => setCurrentRoute('/packages')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('dashboard.rentNewPanel')}</span>
          </button>
        </div>
      </div>

      {healthScanSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <strong>{language === 'vi' ? 'Quét chẩn đoán hoàn tất:' : 'Diagnostic Scan Complete:'}</strong>{' '}
            {language === 'vi'
              ? 'Tất cả 6 cầu nối API nhà cung cấp hoạt động tối ưu (Độ trễ trung bình: 142ms). CDN Edge Cloudflare đang bảo vệ toàn diện.'
              : 'All upstream provider API bridges operational (Avg latency: 142ms). Cloudflare Edge CDN cached and primed.'}
          </div>
        </div>
      )}

      {/* 4 PRIMARY STAT / KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Wallet Balance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.totalBalance')}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatMoney(user?.balance || 0)}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">{language === 'vi' ? 'Tiền tệ tài khoản' : 'Wallet Currency'}</span>
              <button
                onClick={() => setCurrentRoute('/add-funds')}
                className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                + {language === 'vi' ? 'Nạp thêm tiền' : 'Add Funds'} <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Rented Panels */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.activePanelsCount')}</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Server className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {activePanelsCount} <span className="text-sm font-semibold text-slate-400">/ {userPanels.length}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {userPanels.length > 0 ? (language === 'vi' ? 'Đang hoạt động' : 'Serving Traffic') : (language === 'vi' ? 'Chưa thuê panel' : 'No Active Panels')}
              </span>
              <button
                onClick={() => setCurrentRoute('/panels')}
                className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {language === 'vi' ? 'Quản lý' : 'Manage'} →
              </button>
            </div>
          </div>
        </div>

        {/* KPI 3: Monthly Orders */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.monthlyOrders')}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{(totalOrders || 0).toLocaleString()}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">{language === 'vi' ? 'Doanh thu tháng' : 'Monthly Rev'}</span>
              <span className="font-bold text-emerald-600">{formatMoney(monthlyRevenue)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Infrastructure Uptime & Messages */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.uptimeRate')}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">99.98%</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">{language === 'vi' ? 'Tin nhắn API' : 'API Messages'}</span>
              <span className="font-bold text-indigo-600">{(totalMessages || 0).toLocaleString()} req</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: BIỂU ĐỒ CỘT (BAR CHART) & BIỂU ĐỒ TRÒN (DONUT CHART) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: BIỂU ĐỒ CỘT DOANH THU & ĐƠN HÀNG (BAR CHART) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>
                      {activeMetric === 'revenue'
                        ? (language === 'vi' ? 'Biểu Đồ Doanh Thu' : 'Revenue Performance')
                        : (language === 'vi' ? 'Biểu Đồ Số Lượng Đơn Hàng' : 'Order Volume Throughput')}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      +28.4% ↑
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {language === 'vi'
                      ? 'Theo dõi tốc độ tăng trưởng kinh doanh trên toàn bộ các Panel bạn đã thuê'
                      : 'Real-time performance velocity across your provisioned storefront fleet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Metric Switcher */}
              <div className="flex items-center bg-slate-100/90 rounded-xl p-1 text-xs font-semibold">
                <button
                  onClick={() => setActiveMetric('revenue')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeMetric === 'revenue'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Doanh Thu' : 'Revenue'}</span>
                </button>
                <button
                  onClick={() => setActiveMetric('orders')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeMetric === 'orders'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Đơn Hàng' : 'Orders'}</span>
                </button>
              </div>

              {/* Timeframe Filter */}
              <div className="flex items-center bg-slate-100/90 rounded-xl p-1 text-xs font-semibold">
                {(['7d', '30d', '90d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeframe === period
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {period.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Bar Chart Graphic with Subtle Y-Grid Reference */}
          <div className="pt-2">
            <div className="relative h-56 w-full flex items-end justify-between gap-1 sm:gap-3 px-3 pt-6 pb-2 border-b border-slate-100">
              {/* Subtle Horizontal Reference Grid Lines */}
              <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-100 pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-100 pointer-events-none" />

              {currentBarData.map((d, i) => {
                const val = activeMetric === 'revenue' ? d.revenue : d.orders;
                const maxVal = activeMetric === 'revenue' ? maxBarRevenue : maxBarOrders;
                const heightPercent = Math.max(12, Math.round((val / (maxVal || 1)) * 100));
                const isHovered = hoveredBarIndex === i;

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="flex-1 flex flex-col items-center gap-2.5 group cursor-pointer relative z-10"
                  >
                    {/* Tooltip on Hover with Pointer */}
                    <div
                      className={`absolute -top-12 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl shadow-xl whitespace-nowrap z-30 pointer-events-none transition-all duration-200 flex flex-col items-center ${
                        isHovered ? 'opacity-100 scale-100 -translate-y-1' : 'opacity-0 scale-95 pointer-events-none'
                      }`}
                    >
                      <span className="text-[9px] text-slate-400 font-medium">{d.label}</span>
                      <span className="text-white font-black tracking-tight">
                        {activeMetric === 'revenue' ? formatMoney(d.revenue) : `${d.orders.toLocaleString()} đơn`}
                      </span>
                      {/* Tooltip Caret */}
                      <div className="w-2 h-2 bg-slate-900 transform rotate-45 -mb-1 mt-0.5" />
                    </div>

                    {/* Solid Proportional Bar Container */}
                    <div className="w-8 sm:w-10 md:w-12 max-w-[48px] bg-slate-100/90 rounded-t-xl sm:rounded-t-2xl relative flex items-end h-44 overflow-hidden border border-slate-100">
                      <div
                        style={{
                          height: `${heightPercent}%`,
                          background:
                            activeMetric === 'revenue'
                              ? 'linear-gradient(to top, var(--brand-primary), var(--brand-secondary))'
                              : 'linear-gradient(to top, #059669, #2dd4bf)',
                          boxShadow: isHovered
                            ? activeMetric === 'revenue'
                              ? '0 10px 20px -3px var(--brand-shadow)'
                              : '0 10px 20px -3px rgba(16, 185, 129, 0.35)'
                            : 'none',
                        }}
                        className="w-full rounded-t-xl sm:rounded-t-2xl transition-all duration-300"
                      />
                    </div>

                    <span
                      style={isHovered ? { color: 'var(--brand-primary)' } : {}}
                      className="text-[11px] font-semibold text-slate-500 transition-colors truncate max-w-full text-center"
                    >
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom 3 Summary Metric Pill Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {language === 'vi' ? 'Tổng toàn kỳ' : 'Period Total'}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {activeMetric === 'revenue'
                    ? formatMoney(currentBarData.reduce((a, b) => a + b.revenue, 0))
                    : `${currentBarData.reduce((a, b) => a + b.orders, 0).toLocaleString()} đơn`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {language === 'vi' ? 'Đỉnh cao nhất' : 'Peak Volume'}
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {activeMetric === 'revenue' ? formatMoney(maxBarRevenue) : `${maxBarOrders.toLocaleString()} đơn`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {language === 'vi' ? 'Trung bình ngày' : 'Daily Average'}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {activeMetric === 'revenue'
                    ? formatMoney(Math.round(currentBarData.reduce((a, b) => a + b.revenue, 0) / currentBarData.length))
                    : `${Math.round(currentBarData.reduce((a, b) => a + b.orders, 0) / currentBarData.length).toLocaleString()} đơn`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: BIỂU ĐỒ TRÒN / DONUT CHART (PIE CHART) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'vi' ? 'Biểu Đồ Tròn Phân Bố' : 'Distribution Analytics'}
                </h3>
              </div>

              {/* Sub Tab Switcher */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px] font-semibold">
                <button
                  onClick={() => setActiveDonutTab('platforms')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    activeDonutTab === 'platforms' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {language === 'vi' ? 'Nền Tảng' : 'Platforms'}
                </button>
                <button
                  onClick={() => setActiveDonutTab('status')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    activeDonutTab === 'status' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {language === 'vi' ? 'Trạng Thái' : 'Status'}
                </button>
              </div>
            </div>

            {/* Donut Chart Graphic & Center Metric */}
            <div className="py-4 flex items-center justify-center relative">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                {activeDonutTab === 'platforms' ? (
                  <>
                    {/* TikTok 38% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ec4899" strokeWidth="14" strokeDasharray="90.7 238.7" strokeDashoffset="0" />
                    {/* Instagram 28% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8b5cf6" strokeWidth="14" strokeDasharray="66.8 238.7" strokeDashoffset="-90.7" />
                    {/* Facebook 18% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="14" strokeDasharray="43.0 238.7" strokeDashoffset="-157.5" />
                    {/* YouTube 11% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ef4444" strokeWidth="14" strokeDasharray="26.2 238.7" strokeDashoffset="-200.5" />
                    {/* Telegram/Other 5% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="14" strokeDasharray="12.0 238.7" strokeDashoffset="-226.7" />
                  </>
                ) : (
                  <>
                    {/* Completed 84% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="14" strokeDasharray="200.5 238.7" strokeDashoffset="0" />
                    {/* In Progress 11% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="14" strokeDasharray="26.2 238.7" strokeDashoffset="-200.5" />
                    {/* Pending 3% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="14" strokeDasharray="7.2 238.7" strokeDashoffset="-226.7" />
                    {/* Refunded 2% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ef4444" strokeWidth="14" strokeDasharray="4.8 238.7" strokeDashoffset="-233.9" />
                  </>
                )}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900">
                  {activeDonutTab === 'platforms' ? '100%' : '84%'}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
                  {activeDonutTab === 'platforms' ? (language === 'vi' ? 'Tổng thị phần' : 'Share') : (language === 'vi' ? 'Thành công' : 'Completed')}
                </span>
              </div>
            </div>

            {/* Donut Legend List with Percentages */}
            <div className="space-y-2 text-xs pt-1">
              {(activeDonutTab === 'platforms' ? platformStats : fulfillmentStats).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-none">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.bgClass} shrink-0`} />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">{item.count}</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      {item.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
            <span>{language === 'vi' ? 'Cập nhật thời gian thực:' : 'Real-time telemetry:'}</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 100% {language === 'vi' ? 'Khớp dữ liệu' : 'Synced'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: BIỂU ĐỒ ĐƯỜNG (LINE CHART) - API SPEED & TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: BIỂU ĐỒ ĐƯỜNG XU HƯỚNG LƯU LƯỢNG API & WEBHOOKS */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'vi' ? 'Biểu Đồ Đường: Lưu Lượng API & Độ Trễ (Latency)' : 'Line Chart: API Throughput & Latency Curve'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'vi'
                  ? 'Theo dõi số lượng yêu cầu đặt đơn tự động và thời gian phản hồi máy chủ'
                  : 'Real-time monitoring of webhook events, client requests, and bridge latency'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                Avg: 142ms
              </span>
            </div>
          </div>

          {/* SVG Smooth Line & Area Chart */}
          <div className="pt-2">
            <div className="relative h-44 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="0" y1="30" x2="700" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="75" x2="700" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="700" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                {/* Filled Area */}
                <path
                  d="M 0 130 Q 100 140, 200 80 T 400 30 T 600 20 T 700 70 L 700 150 L 0 150 Z"
                  fill="url(#lineGrad)"
                />

                {/* Curved Main Line */}
                <path
                  d="M 0 130 Q 100 140, 200 80 T 400 30 T 600 20 T 700 70"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Plot Points */}
                {[
                  { cx: 0, cy: 130, val: '45 req' },
                  { cx: 116, cy: 140, val: '28 req' },
                  { cx: 233, cy: 80, val: '120 req' },
                  { cx: 350, cy: 30, val: '240 req' },
                  { cx: 466, cy: 30, val: '310 req' },
                  { cx: 583, cy: 20, val: '380 req' },
                  { cx: 700, cy: 70, val: '190 req' },
                ].map((pt, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle cx={pt.cx} cy={pt.cy} r="5" fill="#ffffff" stroke="#4f46e5" strokeWidth="3" />
                  </g>
                ))}
              </svg>
            </div>

            {/* Time labels under line chart */}
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100">
              {lineThroughputData.map((d, i) => (
                <span key={i}>{d.hour}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Fleet Operations & Telemetry */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Zap className="w-4 h-4 text-indigo-400" />
                Fleet Operations Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                Online
              </span>
            </div>

            <h3 className="text-base font-bold text-white mt-2">
              {language === 'vi' ? 'Tự Động Hóa Vận Hành 24/7' : 'Autonomous Operations Active'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {language === 'vi'
                ? 'Hệ thống tự động phát hiện lỗi nhà cung cấp, tự động chuyển luồng failover và chạy auto-refill.'
                : 'System continuously inspects error rates and prevents failed deliveries before customers notice.'}
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <span className="text-slate-300">FastSMMApi #14 Bridge</span>
                <span className="text-emerald-400 font-bold">142ms • OK</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <span className="text-slate-300">GlobalStream API #08</span>
                <span className="text-emerald-400 font-bold">198ms • OK</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <span className="text-slate-300">Auto-Refill Worker</span>
                <span className="text-indigo-300 font-semibold">Running (Every 10m)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentRoute('/support')}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>{language === 'vi' ? 'Mở Trung Tâm Hỗ Trợ AI' : 'Open Support Center'}</span>
          </button>
        </div>
      </div>

      {/* RENTED SMM PANELS LIST */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t('panels.title')}</h2>
            <p className="text-xs text-slate-500">
              {language === 'vi'
                ? 'Danh sách các SMM Panel bạn đã thuê và đang vận hành'
                : 'Your provisioned panels and active storefront instances'}
            </p>
          </div>
          <button
            onClick={() => setCurrentRoute('/panels')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {language === 'vi' ? 'Xem tất cả' : 'View All'} ({userPanels.length}) →
          </button>
        </div>

        {userPanels.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Server className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">
              {language === 'vi' ? 'Bạn chưa thuê SMM Panel nào' : 'No Rented Panels Yet'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {language === 'vi'
                ? 'Thuê gói SMM Panel ngay để bắt đầu bán dịch vụ mạng xã hội và kiếm lợi nhuận.'
                : 'Rent a panel package to launch your SMM agency storefront today.'}
            </p>
            <button
              onClick={() => setCurrentRoute('/packages')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('dashboard.rentNewPanel')}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {userPanels.map((panel) => (
              <div key={panel.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{panel.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          panel.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {panel.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {panel.customDomain || panel.domain} • Plan: {panel.planName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-slate-900">{(panel.totalOrders || 0).toLocaleString()} orders</p>
                    <p className="text-[11px] text-slate-500">Rev: {formatMoney(panel.monthlyRevenue)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPanelForDetail(panel);
                        setCurrentRoute(`/panels/${panel.id}`);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t('panels.manage')}
                    </button>
                    <a
                      href={`https://${panel.customDomain || panel.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Open storefront"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t('dashboard.recentTransactions')}</h2>
            <p className="text-xs text-slate-500">
              {language === 'vi'
                ? 'Lịch sử nạp tiền vào ví và các khoản thanh toán gói thuê gần nhất'
                : 'Billing history, wallet deposits, and subscription renewals'}
            </p>
          </div>
          <button
            onClick={() => setCurrentRoute('/transactions')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {language === 'vi' ? 'Xem toàn bộ sổ cái' : 'Full Ledger'} →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-2">ID</th>
                <th className="pb-2">{language === 'vi' ? 'Ngày' : 'Date'}</th>
                <th className="pb-2">{language === 'vi' ? 'Mô tả' : 'Description'}</th>
                <th className="pb-2">{language === 'vi' ? 'Phương thức' : 'Method'}</th>
                <th className="pb-2 text-right">{language === 'vi' ? 'Số tiền' : 'Amount'}</th>
                <th className="pb-2 text-right">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.slice(0, 4).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 font-mono text-slate-500">{tx.id}</td>
                  <td className="py-2.5 text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="py-2.5 font-medium text-slate-900">{tx.description}</td>
                  <td className="py-2.5 text-slate-500">{tx.paymentMethod || 'Wallet'}</td>
                  <td
                    className={`py-2.5 text-right font-bold ${
                      tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {tx.amount > 0 ? `+${formatMoney(tx.amount)}` : formatMoney(tx.amount)}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
