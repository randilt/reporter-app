"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Trash2,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReports } from "@/hooks/useReports";
import {
  type IncidentReport,
  type SyncStatus,
  incidentTypeLabels,
  severityConfig,
} from "@/lib/db";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const statusConfig: Record<
  SyncStatus,
  { icon: typeof CheckCircle; color: string }
> = {
  pending: { icon: Clock, color: "text-pending" },
  synced: { icon: CheckCircle, color: "text-synced" },
  failed: { icon: AlertCircle, color: "text-failed" },
};

interface ReportCardProps {
  report: IncidentReport;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

const ReportCard = ({ report, onRetry, onDelete }: ReportCardProps) => {
  const t = useTranslations("ReportsList");
  const status = statusConfig[report.syncStatus];
  const StatusIcon = status.icon;
  const severity = severityConfig[report.severity];

  const createdDate = new Date(report.createdAtLocal);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "p-4 rounded-xl bg-card border transition-all",
        report.syncStatus === "failed" && "border-destructive/50",
        report.syncStatus === "pending" && "border-primary/30",
        report.syncStatus === "synced" && "border-success/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-bold",
                severity.color
              )}
            >
              {severity.label}
            </span>
            <span className="text-sm font-semibold truncate">
              {incidentTypeLabels[report.incidentType]}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <MapPin className="w-3 h-3" />
            <span className="font-mono">
              {report.locationCapturedAtCreation.lat.toFixed(4)},{" "}
              {report.locationCapturedAtCreation.lng.toFixed(4)}
            </span>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground">
            {createdDate.toLocaleDateString()} at{" "}
            {createdDate.toLocaleTimeString()}
          </p>

          {/* Error message */}
          {report.lastSyncError && (
            <p className="mt-2 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
              {report.lastSyncError}
            </p>
          )}
        </div>

        {/* Status & Actions */}
        <div className="flex flex-col items-end gap-2">
          <div className={cn("flex items-center gap-1.5", status.color)}>
            <StatusIcon
              className={cn(
                "w-4 h-4",
                report.syncStatus === "pending" && "status-pulse"
              )}
            />
            <span className="text-xs font-medium">{t(report.syncStatus)}</span>
          </div>

          <div className="flex items-center gap-1">
            {report.syncStatus === "failed" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:bg-primary/20"
                onClick={() => onRetry(report.localId)}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
              onClick={() => onDelete(report.localId)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface ReportsListProps {
  filter?: SyncStatus | "all";
}

export const ReportsList = ({ filter = "all" }: ReportsListProps) => {
  const { reports, retrySync, deleteReport } = useReports();
  const t = useTranslations("ReportsList");

  const filteredReports =
    filter === "all" ? reports : reports.filter((r) => r.syncStatus === filter);

  if (filteredReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          {filter === "pending" && (
            <Clock className="w-8 h-8 text-muted-foreground" />
          )}
          {filter === "synced" && (
            <CheckCircle className="w-8 h-8 text-muted-foreground" />
          )}
          {filter === "failed" && (
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          )}
          {filter === "all" && (
            <ChevronRight className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <p className="text-muted-foreground">
          {filter === "all"
            ? t("noReportsAll")
            : t("noReports", { status: t(filter) })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {filteredReports.map((report) => (
          <ReportCard
            key={report.localId}
            report={report}
            onRetry={retrySync}
            onDelete={deleteReport}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
