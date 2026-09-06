import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'brand';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = '', variant = 'primary', size = 'md', loading = false, disabled, icon, ...props }, ref) => {
    // Open-Design Mandatory: rounded-full pill buttons, minimum height >= 40px for standard md
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-full cursor-pointer transition-all duration-150 ease-out select-none press-tactile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    const sizeStyles = {
      sm: 'h-8 px-3.5 text-xs gap-1.5 min-w-[72px]',
      md: 'h-10 px-5 text-xs tracking-tight gap-2 min-w-[90px]',
      lg: 'h-12 px-6 text-sm tracking-tight gap-2.5 min-w-[110px]',
      icon: 'h-10 w-10 p-0 rounded-full flex items-center justify-center',
    }[size];

    const variantStyles = {
      primary:
        'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs hover:shadow-sm border border-blue-600/30',
      brand:
        'bg-brand-gradient text-white shadow-xs hover:shadow-brand hover:brightness-105 border border-white/20',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-800 active:bg-slate-250 border border-slate-200/80',
      outline:
        'bg-white hover:bg-slate-50 text-slate-700 active:bg-slate-100 border border-slate-200/90 shadow-2xs hover:border-slate-300',
      ghost:
        'bg-transparent hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 border border-transparent active:bg-slate-200/60',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-rose-600/30',
      success:
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs border border-emerald-600/30',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
