import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  type IncidentReport,
  type SyncStatus,
  getDeviceInfo,
  getResponderId,
} from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { useOnlineStatus } from "./useOnlineStatus";
import { toast } from "sonner";

export const useReports = () => {
  const { isOnline } = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);

  // Live query for all reports
  const reports = useLiveQuery(
    () => db.reports.orderBy("createdAtLocal").reverse().toArray(),
    []
  );

  // Count reports by status
  const pendingCount =
    reports?.filter((r) => r.syncStatus === "pending").length ?? 0;
  const syncedCount =
    reports?.filter((r) => r.syncStatus === "synced").length ?? 0;
  const failedCount =
    reports?.filter((r) => r.syncStatus === "failed").length ?? 0;

  // Create a new report
  const createReport = useCallback(
    async (
      data: Omit<
        IncidentReport,
        | "localId"
        | "serverId"
        | "syncStatus"
        | "createdAtLocal"
        | "lastEditedAtLocal"
        | "syncedAt"
        | "syncAttempts"
        | "lastSyncError"
        | "locationCapturedAtSync"
        | "deviceId"
        | "appVersion"
        | "responderId"
        | "deviceTimezone"
        | "timezoneOffsetMinutes"
      >
    ) => {
      const deviceInfo = getDeviceInfo();
      const now = new Date().toISOString();

      const report: IncidentReport = {
        localId: uuidv4(),
        serverId: null,
        syncStatus: "pending",
        ...data,
        createdAtLocal: now,
        lastEditedAtLocal: now,
        syncedAt: null,
        syncAttempts: 0,
        lastSyncError: null,
        locationCapturedAtSync: null,
        responderId: getResponderId(),
        ...deviceInfo,
      };

      await db.reports.add(report);

      toast.success("Report Saved Locally", {
        description:
          "Your incident report has been saved. It will sync automatically when online.",
      });

      return report;
    },
    []
  );

  // Simulate sync to server
  const syncReport = useCallback(async (localId: string) => {
    const report = await db.reports.get(localId);
    if (!report) return;

    // Update sync attempts
    await db.reports.update(localId, {
      syncAttempts: report.syncAttempts + 1,
      lastEditedAtLocal: new Date().toISOString(),
    });

    // Simulate network request (90% success rate for demo)
    const success = Math.random() > 0.1;

    // Simulate latency
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    if (success) {
      // Capture location at sync time
      let syncLocation = null;
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          }
        );
        syncLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        };
      } catch {
        // Location capture at sync is optional
      }

      await db.reports.update(localId, {
        syncStatus: "synced" as SyncStatus,
        serverId: `srv-${uuidv4().slice(0, 8)}`,
        syncedAt: new Date().toISOString(),
        locationCapturedAtSync: syncLocation,
        lastSyncError: null,
      });

      console.log(`[SYNC] Report ${localId} synced successfully`);
    } else {
      await db.reports.update(localId, {
        syncStatus: "failed" as SyncStatus,
        lastSyncError: "Network timeout - will retry automatically",
      });
      console.log(`[SYNC] Report ${localId} failed to sync`);
    }
  }, []);

  // Sync all pending reports
  const syncAllPending = useCallback(async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    const pendingReports = await db.reports
      .where("syncStatus")
      .equals("pending")
      .toArray();
    const failedReports = await db.reports
      .where("syncStatus")
      .equals("failed")
      .toArray();

    const toSync = [...pendingReports, ...failedReports];

    if (toSync.length > 0) {
      console.log(`[SYNC] Starting sync of ${toSync.length} reports...`);

      for (const report of toSync) {
        await syncReport(report.localId);
      }

      toast.success("Sync Complete", {
        description: `Processed ${toSync.length} report(s).`,
      });
    }

    setSyncing(false);
  }, [isOnline, syncing, syncReport]);

  // Retry a specific failed report
  const retrySync = useCallback(
    async (localId: string) => {
      if (!isOnline) {
        toast.error("Cannot Sync", {
          description:
            "You are currently offline. Sync will resume when online.",
        });
        return;
      }

      await db.reports.update(localId, { syncStatus: "pending" as SyncStatus });
      await syncReport(localId);
    },
    [isOnline, syncReport]
  );

  // Delete a report
  const deleteReport = useCallback(async (localId: string) => {
    await db.reports.delete(localId);
    toast.success("Report Deleted", {
      description: "The incident report has been removed.",
    });
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(syncAllPending, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncAllPending]);

  return {
    reports: reports ?? [],
    pendingCount,
    syncedCount,
    failedCount,
    syncing,
    createReport,
    syncAllPending,
    retrySync,
    deleteReport,
  };
};
