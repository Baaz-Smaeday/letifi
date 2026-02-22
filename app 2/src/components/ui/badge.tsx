import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '@/lib/utils';
import { type ComplianceStatus } from '@/lib/types';

interface BadgeProps {
  status: ComplianceStatus;
  className?: string;
}

const dotGlow: Record<ComplianceStatus, string> = {
  valid: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
  due_soon: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
  overdue: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]',
  not_set: 'bg-slate-400',
};

export function StatusBadge({ status, className }: BadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset',
      config.bg, config.color, config.ring, className
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotGlow[status])} />
      {config.label}
    </span>
  );
}

interface GenericBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';
  className?: string;
}

const badgeVariants = {
  default: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
};

export function Badge({ children, variant = 'default', className }: GenericBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset',
      badgeVariants[variant], className
    )}>
      {children}
    </span>
  );
}
