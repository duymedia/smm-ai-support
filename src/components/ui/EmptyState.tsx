import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

/** Compact empty state shared by list and table views. */
export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon: Icon = Inbox, action }) => (
  <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-xs ring-1 ring-slate-200/80">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
