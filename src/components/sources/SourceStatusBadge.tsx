import { CheckCircle, AlertTriangle, RefreshCw, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SourceStatus } from '@/types';

interface SourceStatusBadgeProps {
  status: SourceStatus;
  autoSyncEnabled?: boolean;
  className?: string;
}

const statusConfig: Record<SourceStatus, { icon: React.ElementType; color: string; label: string }> = {
  connected: { icon: CheckCircle, color: 'text-success', label: 'Connected' },
  needs_attention: { icon: AlertTriangle, color: 'text-warning', label: 'Needs Attention' },
  syncing: { icon: RefreshCw, color: 'text-primary', label: 'Syncing' },
  error: { icon: XCircle, color: 'text-destructive', label: 'Error' },
  inactive: { icon: Clock, color: 'text-muted-foreground', label: 'Inactive' },
};

export function SourceStatusBadge({ status, autoSyncEnabled, className }: SourceStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isSyncing = status === 'syncing';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Icon className={cn('w-3.5 h-3.5', config.color, isSyncing && 'animate-spin')} />
      <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
      {autoSyncEnabled && status === 'connected' && (
        <span className="text-[10px] text-muted-foreground ml-1">(Auto)</span>
      )}
    </div>
  );
}

export function ConnectorHealthIndicator({ health }: { health: 'healthy' | 'degraded' | 'disconnected' | 'pending' }) {
  const configs = {
    healthy: { color: 'bg-success', label: 'Healthy' },
    degraded: { color: 'bg-warning', label: 'Degraded' },
    disconnected: { color: 'bg-destructive', label: 'Disconnected' },
    pending: { color: 'bg-muted-foreground', label: 'Pending' },
  };
  const config = configs[health];

  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', config.color)} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}
