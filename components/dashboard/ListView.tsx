import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, MapPin, Clock, Smartphone } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge, SeverityBadge } from '@/components/dashboard/StatusBadge';
import { IncidentReport, getSyncLatency, formatLatency } from '@/data/MockReports';
import { cn } from '@/lib/utils';

interface ListViewProps {
  reports: IncidentReport[];
}

export function ListView({ reports }: ListViewProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAtLocal' | 'severity'>('createdAtLocal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Local ID</TableHead>
              <TableHead className="text-muted-foreground font-medium">Server ID</TableHead>
              <TableHead className="text-muted-foreground font-medium">Type</TableHead>
              <TableHead 
                className="text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('severity')}
              >
                Severity <SortIcon field="severity" />
              </TableHead>
              <TableHead 
                className="text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('createdAtLocal')}
              >
                Created <SortIcon field="createdAtLocal" />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">Latency</TableHead>
              <TableHead className="text-muted-foreground font-medium w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReports.map((report) => (
              <>
                <TableRow 
                  key={report.localId}
                  className={cn(
                    "border-border/30 transition-colors cursor-pointer",
                    expandedRow === report.localId ? "bg-secondary/50" : "hover:bg-secondary/30"
                  )}
                  onClick={() => setExpandedRow(expandedRow === report.localId ? null : report.localId)}
                >
                  <TableCell className="font-mono text-xs text-primary">
                    {report.localId.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {report.serverId || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-medium">{report.incidentType}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={report.severity} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(report.createdAtLocal), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatLatency(getSyncLatency(report))}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {expandedRow === report.localId ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRow === report.localId && (
                  <TableRow className="bg-secondary/30 border-border/30">
                    <TableCell colSpan={7} className="py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm animate-fade-in">
                        <div className="space-y-2">
                          <div className="text-muted-foreground text-xs uppercase tracking-wider">Description</div>
                          <p className="text-foreground">{report.description}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                              <div className="text-xs text-muted-foreground">Location at Creation</div>
                              <div className="font-mono text-xs">
                                {report.locationCapturedAtCreation.lat.toFixed(4)}, {report.locationCapturedAtCreation.lng.toFixed(4)}
                                <span className="text-muted-foreground ml-2">±{report.locationCapturedAtCreation.accuracyMeters}m</span>
                              </div>
                            </div>
                          </div>
                          {report.locationCapturedAtSync && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-status-synced" />
                              <div>
                                <div className="text-xs text-muted-foreground">Location at Sync</div>
                                <div className="font-mono text-xs">
                                  {report.locationCapturedAtSync.lat.toFixed(4)}, {report.locationCapturedAtSync.lng.toFixed(4)}
                                  <span className="text-muted-foreground ml-2">±{report.locationCapturedAtSync.accuracyMeters}m</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Synced At</div>
                              <div className="text-xs">
                                {report.syncedAt 
                                  ? format(new Date(report.syncedAt), 'MMM d, yyyy HH:mm:ss')
                                  : <span className="text-muted-foreground">Not synced</span>
                                }
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Device Info</div>
                              <div className="font-mono text-xs">
                                {report.deviceId} • v{report.appVersion}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
      {reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>No reports match your filters</p>
        </div>
      )}
    </div>
  );
}