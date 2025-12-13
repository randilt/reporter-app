"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Workbox } from "workbox-window";
import {
  addToQueue,
  processQueue,
  getQueueSize,
  isBackgroundSyncSupported,
  registerBackgroundSync,
} from "@/lib/sync-queue";
import { syncReport, type SyncReportPayload } from "@/lib/api-client";
import { useOnlineStatus } from "./useOnlineStatus";

interface BackgroundSyncState {
  isSupported: boolean;
  queueSize: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
}

export interface SyncResult {
  success: boolean;
  serverId?: string;
  error?: string;
}

/**
 * Hook for managing background sync functionality
 * Provides methods for syncing reports with automatic retry
 */
export function useBackgroundSync() {
  const [state, setState] = useState<BackgroundSyncState>({
    isSupported: false,
    queueSize: 0,
    isSyncing: false,
    lastSyncTime: null,
  });

  const isOnline = useOnlineStatus();
  const workboxRef = useRef<Workbox | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  /**
   * Update the queue size in state
   */
  const updateQueueSize = useCallback(async () => {
    const size = await getQueueSize();
    setState((prev) => ({ ...prev, queueSize: size }));
  }, []);

  /**
   * Process all pending requests in the queue
   * Returns the number of successfully synced items
   */
  const syncPendingRequests = useCallback(async (): Promise<number> => {
    if (state.isSyncing) {
      console.log("[useBackgroundSync] Sync already in progress");
      return 0;
    }

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      const successCount = await processQueue();
      await updateQueueSize();

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
      }));

      return successCount;
    } catch (error) {
      console.error("[useBackgroundSync] Sync failed:", error);
      setState((prev) => ({ ...prev, isSyncing: false }));
      return 0;
    }
  }, [state.isSyncing, updateQueueSize]);

  // Initialize service worker and check support
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initServiceWorker = async () => {
      const supported = isBackgroundSyncSupported();

      setState((prev) => ({ ...prev, isSupported: supported }));

      if ("serviceWorker" in navigator) {
        try {
          // Initialize Workbox
          const wb = new Workbox("/sw.js", {
            scope: "/",
          });

          // Listen for service worker messages
          wb.addEventListener("message", (event) => {
            console.log("[useBackgroundSync] SW message:", event.data);

            if (event.data.type === "SYNC_COMPLETE") {
              setState((prev) => ({
                ...prev,
                isSyncing: false,
                lastSyncTime: Date.now(),
              }));
              updateQueueSize();
            }

            if (event.data.type === "SYNC_SUCCESS") {
              // Individual sync success - could trigger updates
              updateQueueSize();
            }
          });

          // Register the service worker
          await wb.register();
          workboxRef.current = wb;

          console.log("[useBackgroundSync] Service worker registered");

          // Initial queue size check
          await updateQueueSize();
        } catch (error) {
          console.error("[useBackgroundSync] SW registration failed:", error);
        }
      }
    };

    initServiceWorker();

    // Cleanup
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && state.queueSize > 0 && !state.isSyncing) {
      console.log(
        "[useBackgroundSync] Online and queue not empty, triggering sync"
      );
      // Delay to allow connection to stabilize
      syncTimeoutRef.current = setTimeout(() => {
        syncPendingRequests();
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, state.queueSize, state.isSyncing]);

  /**
   * Sync a single report
   * If online: attempts direct sync
   * If offline: adds to queue and registers background sync
   */
  const syncSingleReport = useCallback(
    async (payload: SyncReportPayload): Promise<SyncResult> => {
      try {
        if (isOnline) {
          // Attempt direct sync
          const response = await syncReport(payload);
          if (response.success && response.data) {
            return {
              success: true,
              serverId: response.data.serverId,
            };
          } else {
            throw new Error(response.error || "Sync failed");
          }
        } else {
          // Offline: add to queue
          await addToQueue(
            "/api/sync-reports",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            },
            payload.localId
          );

          // Register background sync if supported
          if (state.isSupported) {
            await registerBackgroundSync("aegis-sync-queue");
          }

          await updateQueueSize();

          return {
            success: true,
            serverId: undefined, // Will be set after successful sync
          };
        }
      } catch (error) {
        console.error("[useBackgroundSync] Sync error:", error);

        // If sync failed while online, add to queue for retry
        if (isOnline) {
          await addToQueue(
            "/api/sync-reports",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            },
            payload.localId
          );

          await updateQueueSize();
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [isOnline, state.isSupported, updateQueueSize]
  );

  return {
    ...state,
    syncSingleReport,
    syncPendingRequests,
    updateQueueSize,
  };
}
