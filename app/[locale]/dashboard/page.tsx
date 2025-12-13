"use client";
import { useState, useMemo } from "react";
import { ListView } from "@/components/dashboard/ListView";
import dynamic from "next/dynamic";
const LiveMap = dynamic(() => import("@/components/dashboard/LiveMap"), {
  ssr: false,
});
import { Button } from "@/components/ui/button";
import { List, Map } from "lucide-react";
import { useApiReports } from "@/hooks/useApiReports";
import {
  ReportFilters,
  FilterState,
} from "@/components/dashboard/ReportFilters";

export default function DashboardPage() {
  const [view, setView] = useState<"list" | "map">("map");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    incidentType: "all",
    severity: "all",
    adminStatus: "all",
  });
  const { reports: apiReports, loading, error } = useApiReports();

  // Filter reports based on current filters
  const normalizeAdminStatus = (s?: string) => {
    const val = (s || "").toLowerCase();
    if (val === "resolved") return "resolved";
    if (val === "cancelled" || val === "canceled") return "canceled";
    return "pending";
  };

  const filteredReports = useMemo(() => {
    return apiReports.filter((report) => {
      const matchesSearch =
        filters.search === "" ||
        report.localId.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.responderName
          ?.toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesIncidentType =
        filters.incidentType === "all" ||
        report.incidentType === filters.incidentType;

      const matchesSeverity =
        filters.severity === "all" || report.severity === filters.severity;

      const matchesAdminStatus =
        filters.adminStatus === "all" ||
        normalizeAdminStatus(report.status) === filters.adminStatus;

      return (
        matchesSearch &&
        matchesIncidentType &&
        matchesSeverity &&
        matchesAdminStatus
      );
    });
  }, [apiReports, filters]);

  // Calculate stats from API reports
  const pendingCount = apiReports.filter(
    (r) => r.syncStatus === "pending"
  ).length;
  const syncedCount = apiReports.filter(
    (r) => r.syncStatus === "synced"
  ).length;
  const failedCount = apiReports.filter(
    (r) => r.syncStatus === "failed"
  ).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-2">
              Total Reports: {apiReports.length} | Pending: {pendingCount} |
              Synced: {syncedCount} | Failed: {failedCount}
            </p>
          </div>
        </div>

        {/* Two-column layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-80 shrink-0">
            <div className="sticky top-8">
              <ReportFilters
                filters={filters}
                onFiltersChange={setFilters}
                totalCount={apiReports.length}
                filteredCount={filteredReports.length}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {loading && (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading reports...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">Error loading reports: {error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="mb-6 flex gap-4">
                  <Button
                    onClick={() => setView("map")}
                    variant={view === "map" ? "default" : "outline"}
                    className="gap-2"
                  >
                    <Map className="h-4 w-4" />
                    Map View
                  </Button>
                  <Button
                    onClick={() => setView("list")}
                    variant={view === "list" ? "default" : "outline"}
                    className="gap-2"
                  >
                    <List className="h-4 w-4" />
                    List View
                  </Button>
                </div>
                {view === "map" && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <LiveMap />
                  </div>
                )}

                {view === "list" && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <ListView
                      reports={filteredReports}
                      adminStatusFilter={filters.adminStatus ?? "all"}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
