"use client";
import { useState } from "react";
import { ListView } from "@/components/dashboard/ListView";
import { Button } from "@/components/ui/button";
import { Plus, List, Map } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { mockReports } from "@/data/MockReports";
import {ReportFilters} from "@/components/dashboard/ReportFilters";

export default function DashboardPage() {
  const [view, setView] = useState<"list" | "map">("list");
  const { pendingCount, syncedCount, failedCount } = useReports();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-2">
              Total Reports: {mockReports.length} | Pending: {pendingCount} | Synced: {syncedCount} | Failed: {failedCount}
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <Button
            onClick={() => setView("list")}
            variant={view === "list" ? "default" : "outline"}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            List View
          </Button>
          <Button
            onClick={() => setView("map")}
            variant={view === "map" ? "default" : "outline"}
            className="gap-2"
          >
            <Map className="h-4 w-4" />
            Map View
          </Button>
        </div>

        {view === "list" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <ListView reports={mockReports} />
          </div>
        )}

        {view === "map" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center h-96 text-slate-500">
              Map View - Coming Soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
