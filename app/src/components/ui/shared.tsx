import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'brand';
  className?: string;
}

const statVariants = {
  default: 'from-white to-slate-50/50 card-glow',
  danger: 'from-red-50 to-red-50/30 card-glow-red',
  warning: 'from-amber-50 to-amber-50/30 card-glow-amber',
  success: 'from-emerald-50 to-emerald-50/30 card-glow-green',
  brand: 'from-brand-50 to-brand-50/30 card-glow',
};

const statIconVariants = {
  default: 'text-slate-400 bg-slate-100',
  danger: 'text-red-500 bg-red-100',
  warning: 'text-amber-500 bg-amber-100',
  success: 'text-emerald-500 bg-emerald-100',
  brand: 'text-brand-500 bg-brand-100',
};

export function StatCard({ label, value, icon, trend, variant = 'default', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'card-3d rounded-2xl border border-slate-100/80 p-5',
        'bg-gradient-to-br cursor-default',
        statVariants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {trend && <p className="text-xs text-slate-400">{trend}</p>}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-xl', statIconVariants[variant])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      {icon && (
        <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin h-5 w-5 text-brand-400', className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function SectionHeading({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}
