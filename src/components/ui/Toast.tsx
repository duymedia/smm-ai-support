import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 max-w-lg w-[calc(100%-2rem)] sm:w-auto min-w-[320px] pointer-events-none">
      {toasts.map((toast) => {
        let bgClass = 'bg-slate-900/95 text-white border-slate-700/80 shadow-2xl shadow-slate-950/40';
        let Icon = Info;
        let iconColor = 'text-sky-400';

        if (toast.type === 'success') {
          bgClass = 'bg-slate-900/95 text-emerald-100 border-emerald-500/40 shadow-2xl shadow-emerald-950/30';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'error') {
          bgClass = 'bg-slate-900/95 text-rose-100 border-rose-500/40 shadow-2xl shadow-rose-950/30';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        } else if (toast.type === 'warning') {
          bgClass = 'bg-slate-900/95 text-amber-100 border-amber-500/40 shadow-2xl shadow-amber-950/30';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-300 w-full sm:w-auto shadow-xl ${bgClass}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
              <div className="text-xs font-semibold leading-snug tracking-tight text-white">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
