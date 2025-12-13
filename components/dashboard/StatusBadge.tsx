import { cn } from '@/lib/utils';
import { SyncStatus, Severity } from '@/data/MockReports';

interface StatusBadgeProps {
  status: SyncStatus;
  animated?: boolean;
}

export function StatusBadge({ status, animated = false }: StatusBadgeProps) {
  const statusConfig = {
    pending: { label: 'Pending', emoji: '🟡', className: 'status-pending' },
    synced: { label: 'Synced', emoji: '🟢', className: 'status-synced' },
    failed: { label: 'Failed', emoji: '🔴', className: 'status-failed' },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'status-badge',
        config.className,
        animated && status === 'pending' && 'animate-pulse-status'
      )}
    >
      <span className="text-[10px]">{config.emoji}</span>
      {config.label}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const severityConfig: Record<Severity, string> = {
    Low: 'font-bold text-green-600',
    Medium: 'font-bold text-yellow-600',
    High: 'font-bold text-red-400',
    Critical: 'font-bold text-red-700',
  };

  return (
    <span className={severityConfig[severity]}>
      {severity}
    </span>
  );
}