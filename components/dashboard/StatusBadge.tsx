import { cn } from "@/lib/utils";
import { SyncStatus, Severity } from "@/data/MockReports";

interface StatusBadgeProps {
  status: SyncStatus;
  animated?: boolean;
}

export function StatusBadge({ status, animated = false }: StatusBadgeProps) {
  const statusConfig = {
    pending: { label: "Pending", emoji: "🟡", className: "status-pending" },
    synced: { label: "Synced", emoji: "🟢", className: "status-synced" },
    failed: { label: "Failed", emoji: "🔴", className: "status-failed" },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "status-badge",
        config.className,
        animated && status === "pending" && "animate-pulse-status"
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
    low: "px-2 py-1 rounded-md bg-green-100 dark:bg-green-950 font-bold text-green-600 dark:text-green-400",
    medium: "px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-950 font-bold text-yellow-600 dark:text-yellow-400",
    high: "px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-950 font-bold text-orange-600 dark:text-orange-400",
    critical: "px-2 py-1 rounded-md bg-red-100 dark:bg-red-950 font-bold text-red-600 dark:text-red-400",
  };

  return <span className={severityConfig[severity]}>{severity}</span>;
}
