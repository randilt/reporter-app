import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Severity, IncidentType } from "@/data/MockReports";
import { incidentTypeLabels } from "@/lib/db";

export interface FilterState {
  search: string;
  incidentType: IncidentType | "all";
  severity: Severity | "all";
  adminStatus: "all" | "pending" | "resolved" | "canceled";
}

interface ReportFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const incidentTypes: IncidentType[] = [
  "flood",
  "landslide",
  "fire",
  "accident",
  "road_block",
  "power_line_down",
];
const severities: Severity[] = ["low", "medium", "high", "critical"];
// Removed Sync Status filter; using Admin Status only

export function ReportFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: ReportFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.incidentType !== "all" ||
    filters.severity !== "all" ||
    filters.adminStatus !== "all";

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      incidentType: "all",
      severity: "all",
      adminStatus: "all",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-600" />
          <span className="text-base font-semibold text-slate-900">
            Filters
          </span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ID or Responder..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="pl-9 bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Incident Type */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Incident Type
          </label>
          <Select
            value={filters.incidentType}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                incidentType: value as IncidentType | "all",
              })
            }
          >
            <SelectTrigger className="bg-slate-50 border-slate-200 w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {incidentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {incidentTypeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Severity */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Severity
          </label>
          <Select
            value={filters.severity}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                severity: value as Severity | "all",
              })
            }
          >
            <SelectTrigger className="bg-slate-50 border-slate-200 w-full">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {severities.map((sev) => (
                <SelectItem key={sev} value={sev}>
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Admin Status */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Status
          </label>
          <Select
            value={filters.adminStatus}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                adminStatus: value as FilterState["adminStatus"],
              })
            }
          >
            <SelectTrigger className="bg-slate-50 border-slate-200 w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="pt-4 border-t border-slate-200">
        <div className="text-sm text-slate-600">
          Showing{" "}
          <span className="text-slate-900 font-semibold">{filteredCount}</span>{" "}
          of <span className="font-semibold">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}
