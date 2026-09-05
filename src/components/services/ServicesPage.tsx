import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Search,
  Filter,
  Zap,
  CheckCircle2,
  ArrowUpDown,
  Download,
  Upload,
  PlusCircle,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { SmmService } from '../../types';
import { EmptyState } from '../ui/EmptyState';

export const ServicesPage: React.FC = () => {
  const { services, formatMoney, addToast, t } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [marginMultiplier, setMarginMultiplier] = useState<number>(1.5); // Default 50% profit margin

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'Instagram', label: 'Instagram' },
    { id: 'TikTok', label: 'TikTok' },
    { id: 'YouTube', label: 'YouTube' },
    { id: 'Telegram', label: 'Telegram' },
    { id: 'Twitter/X', label: 'Twitter / X' },
    { id: 'Facebook', label: 'Facebook' },
  ];

  const filteredServices = services.filter((svc) => {
    const matchesSearch =
      svc.name.toLowerCase().includes(search.toLowerCase()) ||
      svc.category.toLowerCase().includes(search.toLowerCase()) ||
      svc.providerName.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || svc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(services, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'nexussmm_services_export.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Services catalog exported as JSON.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('services.title')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('services.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Catalog</span>
          </button>

          <button
            onClick={() => addToast('success', '6 upstream providers synced with 120 new active services.')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Sync Upstream APIs</span>
          </button>
        </div>
      </div>

      {/* Dynamic Profit Margin Calculator Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white border border-blue-900 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-400" />
            Global Markup & Margin Calculator
          </span>
          <p className="text-xs text-blue-100">
            Preview resale retail prices across your store with automated markup rules.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-blue-950/80 px-4 py-2 rounded-xl border border-blue-800">
          <span className="text-xs font-semibold text-blue-200">Markup:</span>
          {[
            { label: '+25%', val: 1.25 },
            { label: '+50%', val: 1.5 },
            { label: '+100%', val: 2.0 },
            { label: '+200%', val: 3.0 },
          ].map((m) => (
            <button
              key={m.label}
              onClick={() => setMarginMultiplier(m.val)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                marginMultiplier === m.val
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-300 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter service by name, ID, or provider..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Services Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3 w-16">ID</th>
                <th className="pb-3">Service Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Provider Cost / 1k</th>
                <th className="pb-3 text-right">Your Resale / 1k</th>
                <th className="pb-3 text-right">Min / Max</th>
                <th className="pb-3">Speed SLA</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredServices.length === 0 ? (
                <tr><td colSpan={8} className="py-4"><EmptyState icon={Layers} title="No services found" description="Try another keyword or category. Services synchronized from your providers will appear here." /></td></tr>
              ) : filteredServices.map((svc) => {
                const resalePrice = svc.ratePer1000 * marginMultiplier;
                const profit = resalePrice - svc.ratePer1000;

                return (
                  <tr key={svc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-400">#{svc.id}</td>
                    <td className="py-3 pr-3">
                      <p className="font-bold text-slate-900">{svc.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Upstream: {svc.providerName}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {svc.category}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-600">
                      {formatMoney(svc.ratePer1000)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-mono font-bold text-emerald-600">
                        {formatMoney(resalePrice)}
                      </span>
                      <span className="block text-[10px] text-emerald-700">
                        +{formatMoney(profit)} profit
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500">
                      {(svc.minOrder || 0).toLocaleString()} / {(svc.maxOrder || 0).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        {svc.avgSpeed}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => addToast('success', `Service #${svc.id} mapped to your active storefront.`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Map Service
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
