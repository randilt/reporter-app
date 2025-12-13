import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SyncStatus, Severity, IncidentType } from '@/data/MockReports';

export interface FilterState {
  search: string;
  incidentType: IncidentType | 'all';
  severity: Severity | 'all';
  syncStatus: SyncStatus | 'all';
}

interface ReportFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const incidentTypes: IncidentType[] = ['Flood', 'Fire', 'Earthquake', 'Storm', 'Accident', 'Medical', 'Hazmat', 'Infrastructure'];
const severities: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
const syncStatuses: SyncStatus[] = ['pending', 'synced', 'failed'];

export function ReportFilters({ filters, onFiltersChange, totalCount, filteredCount }: ReportFiltersProps) {
  const hasActiveFilters = 
    filters.search !== '' || 
    filters.incidentType !== 'all' || 
    filters.severity !== 'all' || 
    filters.syncStatus !== 'all';

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      incidentType: 'all',
      severity: 'all',
      syncStatus: 'all',
    });
  };

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Showing <span className="text-foreground font-medium">{filteredCount}</span> of {totalCount} reports
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or Responder..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 bg-secondary border-border/50 focus:border-primary"
          />
        </div>

        <Select
          value={filters.incidentType}
          onValueChange={(value) => onFiltersChange({ ...filters, incidentType: value as IncidentType | 'all' })}
        >
          <SelectTrigger className="bg-secondary border-border/50">
            <SelectValue placeholder="Incident Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {incidentTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.severity}
          onValueChange={(value) => onFiltersChange({ ...filters, severity: value as Severity | 'all' })}
        >
          <SelectTrigger className="bg-secondary border-border/50">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {severities.map((sev) => (
              <SelectItem key={sev} value={sev}>{sev}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.syncStatus}
          onValueChange={(value) => onFiltersChange({ ...filters, syncStatus: value as SyncStatus | 'all' })}
        >
          <SelectTrigger className="bg-secondary border-border/50">
            <SelectValue placeholder="Sync Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {syncStatuses.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}