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
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-600" />
          <span className="text-base font-semibold text-slate-900">Filters</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            Showing <span className="text-slate-900 font-semibold">{filteredCount}</span> of {totalCount} reports
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by ID or Responder..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
          />
        </div>

        <div className="w-[180px]">
          <Select
            value={filters.incidentType}
            onValueChange={(value) => onFiltersChange({ ...filters, incidentType: value as IncidentType | 'all' })}
          >
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Incident Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {incidentTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[160px]">
          <Select
            value={filters.severity}
            onValueChange={(value) => onFiltersChange({ ...filters, severity: value as Severity | 'all' })}
          >
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {severities.map((sev) => (
                <SelectItem key={sev} value={sev}>{sev}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[160px]">
          <Select
            value={filters.syncStatus}
            onValueChange={(value) => onFiltersChange({ ...filters, syncStatus: value as SyncStatus | 'all' })}
          >
            <SelectTrigger className="bg-slate-50 border-slate-200">
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
    </div>
  );
}