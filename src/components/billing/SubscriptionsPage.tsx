import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Repeat,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const { subscriptions, panels, formatMoney, setCurrentRoute, addToast, t } = useApp();

  const handleToggleAutoRenew = (subId: string, current: boolean) => {
    addToast('success', `Auto-renew ${!current ? 'enabled' : 'disabled'} for subscription.`);
  };

  const handleExtend = (subId: string) => {
    addToast('success', 'Subscription extended for an additional billing cycle.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('subscriptions.title')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('subscriptions.subtitle')}</p>
        </div>

        <button
          onClick={() => setCurrentRoute('/packages')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>{t('dashboard.rentNewPanel')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {subscriptions.map((sub) => {
          const panel = panels.find((p) => p.id === sub.panelId);

          return (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {sub.planName} Plan ({sub.billingCycle})
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">
                      {panel?.name || 'SMM Storefront'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {panel?.customDomain || panel?.domain || 'myagency.nexussmm.store'}
                    </p>
                  </div>

                  <span className="text-base font-black text-slate-900">
                    {formatMoney(sub.amount)}
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Next Renewal Date:</span>
                    <span className="font-bold text-slate-900">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Auto-Renewal:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {sub.autoRenew ? 'Active (Auto-debit from wallet)' : 'Manual Renewal'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleAutoRenew(sub.id, sub.autoRenew)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {sub.autoRenew ? 'Disable Auto-Renew' : 'Enable Auto-Renew'}
                </button>

                <button
                  onClick={() => handleExtend(sub.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Extend Subscription
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
