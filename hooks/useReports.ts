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
import { useTranslations } from "next-intl";
import {
  syncReport as apiSyncReport,
  type SyncReportPayload,
} from "@/lib/api-client";

// Global sync lock to prevent multiple instances from syncing simultaneously
let globalSyncLock = false; // mutable by design

export const useReports = () => {
  const { isOnline } = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const t = useTranslations("Toasts");

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

      toast.success(t("reportSavedLocally"), {
        description: t("reportSavedLocallyDesc"),
      });

      return report;
    },
    [t]
  );

  // Sync report to server using real API
  const syncReport = useCallback(async (localId: string) => {
    const report = await db.reports.get(localId);
    if (!report) return;

    // Update sync attempts
    await db.reports.update(localId, {
      syncAttempts: report.syncAttempts + 1,
      lastEditedAtLocal: new Date().toISOString(),
    });

    try {
      // Capture location at sync time (falls back to creation location if unavailable)
      let syncLocation = null;
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false,
            });
          }
        );
        syncLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        };
        console.log("[SYNC] Location captured at sync time:", syncLocation);
      } catch {
        // Location capture at sync failed, will use creation location as fallback
        console.log(
          "[SYNC] Could not capture location at sync time, using creation location"
        );
        syncLocation = null;
      }

      // Prepare payload for API
      const payload: SyncReportPayload = {
        localId: report.localId,
        serverId: report.serverId,
        incidentType: report.incidentType,
        severity: report.severity,
        description: report.description,
        createdAtLocal: report.createdAtLocal,
        locationCapturedAtCreation: report.locationCapturedAtCreation,
        locationCapturedAtSync: syncLocation,
        deviceTime: report.deviceTime,
        userCorrectedTime: report.userCorrectedTime,
        deviceTimezone: report.deviceTimezone,
        timezoneOffsetMinutes: report.timezoneOffsetMinutes,
        responderId: report.responderId,
        deviceId: report.deviceId,
        appVersion: report.appVersion,
      };

      // Make actual API call
      console.log("[SYNC] Attempting to sync report:", localId);
      const response = await apiSyncReport(payload);

      if (response.success && response.data) {
        await db.reports.update(localId, {
          syncStatus: "synced" as SyncStatus,
          serverId: response.data.serverId,
          syncedAt: response.data.syncedAt,
          locationCapturedAtSync: syncLocation,
          lastSyncError: null,
        });

        console.log(`[SYNC] Report ${localId} synced successfully`);
      } else {
        throw new Error(response.error || "Sync failed");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await db.reports.update(localId, {
        syncStatus: "failed" as SyncStatus,
        lastSyncError: errorMessage,
      });

      console.error(`[SYNC] Report ${localId} failed to sync:`, errorMessage);
      throw error;
    }
  }, []);

  // Sync all pending reports
  const syncAllPending = useCallback(async () => {
    // Prevent concurrent sync operations using global lock
    if (!isOnline || syncing || globalSyncLock) {
      console.log("[SYNC] Skipping sync - already in progress or offline");
      return;
    }

    // Acquire global lock
    globalSyncLock = true;
    setSyncing(true);

    try {
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
          try {
            await syncReport(report.localId);
          } catch (error) {
            console.error(`[SYNC] Failed to sync ${report.localId}:`, error);
            // Continue with next report even if one fails
          }
        }

        toast.success(t("syncComplete"), {
          description: t("syncCompleteDesc", { count: toSync.length }),
        });
      }
    } catch (error) {
      console.error("[SYNC] Sync operation failed:", error);
    } finally {
      setSyncing(false);
      // Release global lock
      globalSyncLock = false;
    }
  }, [isOnline, syncing, syncReport, t]);

  // Retry a specific failed report
  const retrySync = useCallback(
    async (localId: string) => {
      if (!isOnline) {
        toast.error(t("cannotSync"), {
          description: t("cannotSyncDesc"),
        });
        return;
      }

      await db.reports.update(localId, { syncStatus: "pending" as SyncStatus });
      await syncReport(localId);
    },
    [isOnline, syncReport, t]
  );

  // Delete a report
  const deleteReport = useCallback(
    async (localId: string) => {
      await db.reports.delete(localId);
      toast.success(t("reportDeleted"), {
        description: t("reportDeletedDesc"),
      });
    },
    [t]
  );

  // Auto-sync when coming online (only trigger on isOnline change)
  useEffect(() => {
    if (isOnline && !syncing) {
      const timer = setTimeout(() => {
        // Only sync if there are pending/failed reports
        db.reports
          .where("syncStatus")
          .anyOf(["pending", "failed"])
          .count()
          .then((count) => {
            if (count > 0) {
              syncAllPending();
            }
          });
      }, 1000);
      return () => clearTimeout(timer);
    }
    // Only depend on isOnline to avoid re-triggering during sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

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
