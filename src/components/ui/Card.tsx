import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  macChrome?: boolean;
  macTitle?: string;
  macBadge?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevated = false,
  macChrome = false,
  macTitle,
  macBadge,
  ...props
}) => {
  return (
    <div
      className={`${
        elevated ? 'glass-card-elevated' : 'glass-card'
      } transition-all duration-200 overflow-hidden ${className}`}
      {...props}
    >
      {macChrome && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 border border-rose-500/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 border border-amber-500/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 border border-emerald-500/30" />
            {macTitle && (
              <span className="ml-2 text-[11px] font-mono font-medium text-slate-500 tracking-tight">
                {macTitle}
              </span>
            )}
          </div>
          {macBadge && <div>{macBadge}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 sm:p-6 border-b border-slate-100/90 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-base font-bold text-slate-900 tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`p-4 sm:px-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3 ${className}`}
    {...props}
  >
    {children}
  </div>
);
