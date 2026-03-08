import { cn } from '@/lib/utils';

interface StatBadgeProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const variants = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export function StatBadge({ label, value, variant = 'default', className }: StatBadgeProps) {
  return (
    <div className={cn('flex flex-col gap-1 px-4 py-3 rounded-xl', variants[variant], className)}>
      <span className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-lg font-display font-bold">{value}</span>
    </div>
  );
}
