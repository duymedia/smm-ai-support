import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  highlight?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
  className = '',
}) => {
  return (
    <Card
      className={`p-4 sm:p-5 relative transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md ${
        highlight ? 'ring-1 ring-blue-500/30 bg-blue-50/20' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 tracking-tight">{title}</p>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
            {value}
          </div>
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-100/90 border border-slate-200/60 flex items-center justify-center text-slate-700 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                  trend.positive
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                    : 'text-rose-700 bg-rose-50 border border-rose-200/60'
                }`}
              >
                {trend.positive ? (
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-rose-600" />
                )}
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-500 text-[11px]">{trend.label}</span>}
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
};
