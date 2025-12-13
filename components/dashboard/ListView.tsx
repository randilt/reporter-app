import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, MapPin, Clock, Smartphone, Phone } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SeverityBadge } from '@/components/dashboard/StatusBadge';
import { Carousel } from '@/components/ui/carousel';
import { Dialog } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IncidentReport, getSyncLatency, formatLatency } from '@/data/MockReports';

interface ListViewProps {
  reports: IncidentReport[];
}

type AdminStatus = 'pending' | 'resolved' | 'canceled';

export function ListView({ reports }: ListViewProps) {
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<'createdAtLocal' | 'severity'>('createdAtLocal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusById, setStatusById] = useState<Record<string, AdminStatus>>(
    () => Object.fromEntries(reports.map((r) => [r.localId, 'pending']))
  );

  useEffect(() => {
    setStatusById((prev) => {
      const next = { ...prev };
      for (const r of reports) {
        if (!next[r.localId]) {
          next[r.localId] = 'pending';
        }
      }
      return next;
    });
  }, [reports]);

  const toggleSort = (field: 'createdAtLocal' | 'severity') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };

  const sortedReports = [...reports].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'createdAtLocal') {
      comparison = new Date(a.createdAtLocal).getTime() - new Date(b.createdAtLocal).getTime();
    } else if (sortField === 'severity') {
      comparison = severityOrder[a.severity] - severityOrder[b.severity];
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: 'createdAtLocal' | 'severity' }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const openDetailsDialog = (report: IncidentReport) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">ID</TableHead>
              <TableHead className="text-muted-foreground font-medium">Type</TableHead>
              <TableHead 
                className="text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('severity')}
              >
                Severity <SortIcon field="severity" />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">Responder</TableHead>
              <TableHead className="text-muted-foreground font-medium">Phone</TableHead>
              <TableHead 
                className="text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('createdAtLocal')}
              >
                Created <SortIcon field="createdAtLocal" />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">Latency</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReports.map((report) => (
              <TableRow 
                key={report.localId}
                className="border-border/30 transition-colors hover:bg-secondary/30 cursor-pointer"
                onClick={() => openDetailsDialog(report)}
              >
                <TableCell className="font-mono text-xs">
                  {report.serverId || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="font-medium">{report.incidentType}</TableCell>
                <TableCell>
                  <SeverityBadge severity={report.severity} />
                </TableCell>
                <TableCell className="text-sm">{report.responderName}</TableCell>
                <TableCell className="text-sm font-mono">{report.responderPhone}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(report.createdAtLocal), 'MMM d, HH:mm')}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatLatency(getSyncLatency(report))}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={statusById[report.localId] ?? 'pending'}
                    onValueChange={(value) =>
                      setStatusById((prev) => ({ ...prev, [report.localId]: value as AdminStatus }))
                    }
                  >
                    <SelectTrigger className={`w-32 border ${
                      (statusById[report.localId] ?? 'pending') === 'resolved'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : (statusById[report.localId] ?? 'pending') === 'pending'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
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
        title={selectedReport ? `Details - ${selectedReport.incidentType}` : 'Details'}
        className="max-h-96 overflow-y-auto"
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Carousel Section */}
            {selectedReport.images && selectedReport.images.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Images ({selectedReport.images.length})</h3>
                <Carousel images={selectedReport.images} />
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-600">{selectedReport.description}</p>
            </div>

            {/* Responder Information */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Responder Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Name:</span>
                  <span className="font-medium">{selectedReport.responderName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-600" />
                  <span className="font-mono text-slate-600">{selectedReport.responderPhone}</span>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Location Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-600">Location at Creation</div>
                    <div className="font-mono text-sm">
                      {selectedReport.locationCapturedAtCreation.lat.toFixed(4)}, {selectedReport.locationCapturedAtCreation.lng.toFixed(4)}
                      <span className="text-slate-600 ml-2">±{selectedReport.locationCapturedAtCreation.accuracyMeters}m</span>
                    </div>
                  </div>
                </div>
                {selectedReport.locationCapturedAtSync && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-slate-600">Location at Sync</div>
                      <div className="font-mono text-sm">
                        {selectedReport.locationCapturedAtSync.lat.toFixed(4)}, {selectedReport.locationCapturedAtSync.lng.toFixed(4)}
                        <span className="text-slate-600 ml-2">±{selectedReport.locationCapturedAtSync.accuracyMeters}m</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sync Information */}
            <div>
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
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}