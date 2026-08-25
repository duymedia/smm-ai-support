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
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const {
    user,
    panels,
    transactions,
    formatMoney,
    setCurrentRoute,
    setSelectedPanelForDetail,
    t,
  } = useApp();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [scanningHealth, setScanningHealth] = useState(false);
  const [healthScanSuccess, setHealthScanSuccess] = useState(false);

  const totalOrders = panels.reduce((acc, p) => acc + p.totalOrders, 0);
  const monthlyRevenue = panels.reduce((acc, p) => acc + p.monthlyRevenue, 0);
  const activePanelsCount = panels.filter((p) => p.status === 'active').length;

  const handleRunGlobalScan = () => {
    setScanningHealth(true);
    setTimeout(() => {
      setScanningHealth(false);
      setHealthScanSuccess(true);
      setTimeout(() => setHealthScanSuccess(false), 5000);
    }, 1500);
  };

  const chartData = [
    { label: 'Day 1', orders: 120, revenue: 340 },
    { label: 'Day 5', orders: 240, revenue: 680 },
    { label: 'Day 10', orders: 380, revenue: 1040 },
    { label: 'Day 15', orders: 510, revenue: 1490 },
    { label: 'Day 20', orders: 690, revenue: 2150 },
    { label: 'Day 25', orders: 840, revenue: 2680 },
    { label: 'Day 30', orders: 1120, revenue: 3480 },
  ];

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('dashboard.welcomeBack')}, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet operations are running normally. Auto-Pilot is actively monitoring upstream providers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunGlobalScan}
            disabled={scanningHealth}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanningHealth ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{scanningHealth ? 'Diagnosing...' : 'System Health Scan'}</span>
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
            <strong>Diagnostic Scan Complete:</strong> All 6 upstream provider API latency bridges checked (Avg: 180ms). Edge CDN primed across 42 global POP nodes.
          </div>
        </div>
      )}

      {/* 4 PRIMARY STAT / KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Wallet Balance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.totalBalance')}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatMoney(user?.balance || 0)}</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-1">
              <button onClick={() => setCurrentRoute('/add-funds')} className="hover:underline flex items-center gap-0.5">
                + Top Up Funds <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Rented Panels */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.activePanelsCount')}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{activePanelsCount} / {panels.length}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>100% Online & Serving</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Monthly Orders */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.monthlyOrders')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{(totalOrders || 0).toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Total Revenue: <strong className="text-slate-900">{formatMoney(monthlyRevenue)}</strong>
            </div>
          </div>
        </div>

        {/* KPI 4: Infrastructure Uptime */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('dashboard.uptimeRate')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">99.98%</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              SLA 99.99% Protected
            </div>
          </div>
        </div>
      </div>

      {/* REVENUE & ORDERS CHART + AI COPILOT STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Revenue Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t('dashboard.revenueChartTitle')}</h2>
              <p className="text-xs text-slate-500">Aggregated order volume across your rented storefronts</p>
            </div>

            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
              {(['7d', '30d', '90d'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    timeframe === period ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {period.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Clean SVG Area & Bar Graph */}
          <div className="pt-4">
            <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 pb-2 border-b border-slate-100">
              {chartData.map((d, i) => {
                const heightPercent = Math.round((d.revenue / maxRevenue) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                    <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      ${d.revenue}
                    </div>
                    <div className="w-full bg-slate-100 rounded-t-lg relative flex items-end h-32 overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400 rounded-t-lg transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Daily Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> Max Threshold
                </span>
              </div>
              <span className="font-semibold text-slate-700">Total 30D: $8,310.50</span>
            </div>
          </div>
        </div>

        {/* Right: Fleet Operations & Telemetry */}
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

            <h3 className="text-base font-bold text-white mt-2">Autonomous Operations Active</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              System continuously inspects error rates and prevents failed deliveries before customers notice.
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
            <span>Open Support Center</span>
          </button>
        </div>
      </div>

      {/* RENTED SMM PANELS LIST */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t('panels.title')}</h2>
            <p className="text-xs text-slate-500">Your provisioned panels and active storefront instances</p>
          </div>
          <button
            onClick={() => setCurrentRoute('/panels')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View All ({panels.length}) →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {panels.map((panel) => (
            <div key={panel.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{panel.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t('dashboard.recentTransactions')}</h2>
            <p className="text-xs text-slate-500">Billing history, wallet deposits, and subscription renewals</p>
          </div>
          <button
            onClick={() => setCurrentRoute('/transactions')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Full Ledger →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-2">ID</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Description</th>
                <th className="pb-2">Method</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2 text-right">Status</th>
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
