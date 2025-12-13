import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Phone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeverityBadge } from "@/components/dashboard/StatusBadge";
import { Dialog } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IncidentReport,
  getSyncLatency,
  formatLatency,
} from "@/data/MockReports";
import { LocationGeocode } from "@/components/dashboard/LocationGeocode";
import { toast } from "@/hooks/use-toast";

interface ListViewProps {
  reports: IncidentReport[];
  adminStatusFilter?: "all" | "pending" | "resolved" | "canceled";
}

type AdminStatus = "pending" | "resolved" | "canceled";

// Move SortIcon outside the component to prevent recreation on each render
const SortIcon = ({
  field,
  sortField,
  sortDirection,
}: {
  field: "createdAtLocal" | "severity";
  sortField: "createdAtLocal" | "severity";
  sortDirection: "asc" | "desc";
}) => {
  if (sortField !== field) return null;
  return sortDirection === "asc" ? (
    <ChevronUp className="h-4 w-4 inline ml-1" />
  ) : (
    <ChevronDown className="h-4 w-4 inline ml-1" />
  );
};

function normalizeAdminStatus(s?: string): AdminStatus {
  const val = (s || "").toLowerCase();
  if (val === "resolved") return "resolved";
  if (val === "cancelled" || val === "canceled") return "canceled";
  return "pending";
}

export function ListView({
  reports,
  adminStatusFilter = "all",
}: ListViewProps) {
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<"createdAtLocal" | "severity">(
    "createdAtLocal"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusById, setStatusById] = useState<Record<string, AdminStatus>>(
    () =>
      Object.fromEntries(
        reports.map((r) => [r.localId, normalizeAdminStatus(r.status)])
      )
  );

  useEffect(() => {
    setStatusById((prev) => {
      const next = { ...prev };
      for (const r of reports) {
        next[r.localId] = normalizeAdminStatus(r.status);
      }
      return next;
    });
  }, [reports]);

  useEffect(() => {
    console.log(selectedReport);
  }, [selectedReport]);

  const toggleSort = (field: "createdAtLocal" | "severity") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

  const sortedReports = [...reports].sort((a, b) => {
    let comparison = 0;
    if (sortField === "createdAtLocal") {
      comparison =
        new Date(a.createdAtLocal).getTime() -
        new Date(b.createdAtLocal).getTime();
    } else if (sortField === "severity") {
      const aSeverity = a.severity.toLowerCase() as keyof typeof severityOrder;
      const bSeverity = b.severity.toLowerCase() as keyof typeof severityOrder;
      comparison = severityOrder[aSeverity] - severityOrder[bSeverity];
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const openDetailsDialog = (report: IncidentReport) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  // Apply Admin Status filter based on local status map
  const adminFilteredReports =
    adminStatusFilter === "all"
      ? sortedReports
      : sortedReports.filter(
          (r) => (statusById[r.localId] ?? "pending") === adminStatusFilter
        );

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">
                ID
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                Type
              </TableHead>
              <TableHead
                className="text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort("severity")}
              >
                Severity{" "}
                <SortIcon
                  field="severity"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                Responder
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                Phone
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                City
              </TableHead>
              <TableHead
                className="text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort("createdAtLocal")}
              >
                Created{" "}
                <SortIcon
                  field="createdAtLocal"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                Latency
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminFilteredReports.map((report) => (
              <TableRow
                key={report.localId}
                className="border-border/30 transition-colors hover:bg-secondary/30 cursor-pointer"
                onClick={() => openDetailsDialog(report)}
              >
                <TableCell className="font-mono text-xs">
                  {report.serverId || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {report.incidentType}
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={report.severity} />
                </TableCell>
                <TableCell className="text-sm">
                  {report.responderName}
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {report.responderPhone}
                </TableCell>
                <TableCell className="text-sm">
                  {report.city || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(report.createdAtLocal), "MMM d, HH:mm")}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatLatency(getSyncLatency(report))}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={statusById[report.localId] ?? "pending"}
                    onValueChange={async (value) => {
                      const newStatus = value as AdminStatus;
                      // Optimistic update
                      setStatusById((prev) => ({
                        ...prev,
                        [report.localId]: newStatus,
                      }));
                      try {
                        const params = new URLSearchParams({
                          serverId: report.serverId ?? "",
                          localId: report.localId,
                          status:
                            newStatus === "resolved"
                              ? "resolved"
                              : newStatus === "pending"
                              ? "pending"
                              : "cancelled",
                        });
                        const resp = await fetch(
                          `/api/reports/update?${params.toString()}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                          }
                        );
                        if (!resp.ok) {
                          const text = await resp.text();
                          throw new Error(
                            text || `Status update failed (${resp.status})`
                          );
                        }
                        toast.success("Status updated", {
                          description: `Report status set to ${newStatus}.`,
                        });
                      } catch (err) {
                        // Revert on error
                        setStatusById((prev) => ({
                          ...prev,
                          [report.localId]: prev[report.localId] ?? "pending",
                        }));
                        toast.error("Update failed", {
                          description:
                            err instanceof Error
                              ? err.message
                              : "Could not update status",
                        });
                      }
                    }}
                  >
                    <SelectTrigger
                      className={`w-32 border ${
                        (statusById[report.localId] ?? "pending") === "resolved"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : (statusById[report.localId] ?? "pending") ===
                            "pending"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>No reports match your filters</p>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={
          selectedReport
            ? `Details - ${selectedReport.incidentType}`
            : "Details"
        }
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Image Section */}
            {selectedReport.images &&
              selectedReport.images.length > 0 &&
              selectedReport.images[0] && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Incident Photo
                  </h3>
                  <div className="relative w-full rounded-lg overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedReport.images[0]}
                      alt="Incident"
                      className="w-full h-auto max-h-[500px] object-contain bg-slate-50"
                    />
                  </div>
                </div>
              )}

            {/* Description */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-600">{selectedReport.description}</p>
            </div>

            {/* Responder Information */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">
                Responder Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Name:</span>
                  <span className="font-medium">
                    {selectedReport.responderName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-600" />
                  <span className="font-mono text-slate-600">
                    {selectedReport.responderPhone}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">
                Location Information
              </h3>
              <div className="space-y-4">
                {/* Location at Creation */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="text-primary mt-1">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 mb-2">
                        Location at Creation
                      </h4>
                      {selectedReport.city && selectedReport.province ? (
                        <div className="space-y-1 text-sm text-slate-600">
                          <p>
                            <span className="font-medium">City:</span>{" "}
                            {selectedReport.city}
                          </p>
                          <p>
                            <span className="font-medium">Province:</span>{" "}
                            {selectedReport.province}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedReport.locationCapturedAtCreation.lat.toFixed(
                              6
                            )}
                            ,{" "}
                            {selectedReport.locationCapturedAtCreation.lng.toFixed(
                              6
                            )}
                            {selectedReport.locationCapturedAtCreation
                              .accuracyMeters && (
                              <span className="ml-2">
                                (±
                                {selectedReport.locationCapturedAtCreation.accuracyMeters.toFixed(
                                  0
                                )}
                                m)
                              </span>
                            )}
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${selectedReport.locationCapturedAtCreation.lat},${selectedReport.locationCapturedAtCreation.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs inline-flex items-center gap-1 mt-1"
                          >
                            View on Google Maps
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      ) : (
                        <LocationGeocode
                          latitude={
                            selectedReport.locationCapturedAtCreation.lat
                          }
                          longitude={
                            selectedReport.locationCapturedAtCreation.lng
                          }
                          accuracyMeters={
                            selectedReport.locationCapturedAtCreation
                              .accuracyMeters
                          }
                          label=""
                          language="en"
                          iconClassName="text-primary"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Location at Sync */}
                {selectedReport.locationCapturedAtSync && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-start gap-3">
                      <div className="text-green-600 mt-1">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-2">
                          Location at Sync
                        </h4>
                        <LocationGeocode
                          latitude={selectedReport.locationCapturedAtSync.lat}
                          longitude={selectedReport.locationCapturedAtSync.lng}
                          accuracyMeters={
                            selectedReport.locationCapturedAtSync.accuracyMeters
                          }
                          label=""
                          language="en"
                          iconClassName="text-green-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sync Information */}
            {/* <div>
                <h3 className="font-semibold text-slate-900 mb-3">Sync Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-600" />
                    <div>
                      <div className="text-xs text-slate-600">Synced At</div>
                      <div className="text-sm">
                        {selectedReport.syncedAt 
                          ? format(new Date(selectedReport.syncedAt), 'MMM d, yyyy HH:mm:ss')
                          : <span className="text-slate-600">Not synced</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-slate-600" />
                    <div>
                      <div className="text-xs text-slate-600">Device Info</div>
                      <div className="font-mono text-sm">
                        {selectedReport.deviceId} • v{selectedReport.appVersion}
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
          </div>
        )}
      </Dialog>
    </div>
  );
}
