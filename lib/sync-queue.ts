/**
 * Sync Queue Manager using IndexedDB
 * Manages a queue of pending sync requests with retry logic
 *
 * This works independently of the Workbox Background Sync as a fallback
 * for browsers that don't support the Background Sync API
 */

import Dexie, { type EntityTable } from "dexie";

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  reportLocalId: string; // Reference to the report being synced
}

class SyncQueueDB extends Dexie {
  queue!: EntityTable<QueuedRequest, "id">;

  constructor() {
    super("AegisSyncQueue");
    this.version(1).stores({
      queue: "id, timestamp, retryCount, reportLocalId",
    });
  }
}

const queueDB = new SyncQueueDB();

/**
 * Add a request to the sync queue
 */
export async function addToQueue(
  url: string,
  options: RequestInit,
  reportLocalId: string
): Promise<string> {
  const id = `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const queuedRequest: QueuedRequest = {
    id,
    url,
    method: options.method || "GET",
    headers: (options.headers as Record<string, string>) || {},
    body: options.body as string,
    timestamp: Date.now(),
    retryCount: 0,
    reportLocalId,
  };

  await queueDB.queue.add(queuedRequest);
  console.log("[Sync Queue] Added to queue:", id);

  return id;
}

/**
 * Get all pending requests in the queue
 */
export async function getPendingRequests(): Promise<QueuedRequest[]> {
  return queueDB.queue.orderBy("timestamp").toArray();
}

/**
 * Get queue size
 */
export async function getQueueSize(): Promise<number> {
  return queueDB.queue.count();
}

/**
 * Remove a request from the queue
 */
export async function removeFromQueue(id: string): Promise<void> {
  await queueDB.queue.delete(id);
  console.log("[Sync Queue] Removed from queue:", id);
}

/**
 * Update retry count and error for a queued request
 */
export async function updateQueueItem(
  id: string,
  updates: Partial<QueuedRequest>
): Promise<void> {
  await queueDB.queue.update(id, updates);
}

/**
 * Clear all items from the queue
 */
export async function clearQueue(): Promise<void> {
  await queueDB.queue.clear();
  console.log("[Sync Queue] Queue cleared");
}

/**
 * Process all pending requests in the queue
 * Returns number of successful syncs
 */
export async function processQueue(): Promise<number> {
  const requests = await getPendingRequests();
  let successCount = 0;

  for (const request of requests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      if (response.ok) {
        await removeFromQueue(request.id);
        successCount++;
        console.log("[Sync Queue] Successfully synced:", request.id);
      } else {
        // Update retry count
        await updateQueueItem(request.id, {
          retryCount: request.retryCount + 1,
          lastError: `HTTP ${response.status}`,
        });
        console.warn(
          "[Sync Queue] Failed to sync:",
          request.id,
          response.status
        );
      }
    } catch (error) {
      // Update retry count and error
      await updateQueueItem(request.id, {
        retryCount: request.retryCount + 1,
        lastError: error instanceof Error ? error.message : "Unknown error",
      });
      console.error("[Sync Queue] Error syncing:", request.id, error);
    }
  }

  return successCount;
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "SyncManager" in window &&
    "sync" in ServiceWorkerRegistration.prototype
  );
}

/**
 * Register a background sync tag
 * This will be handled by the service worker
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  if (!isBackgroundSyncSupported()) {
    console.warn("[Sync Queue] Background Sync not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-expect-error - sync is not in TypeScript definitions yet
    await registration.sync.register(tag);
    console.log("[Sync Queue] Background sync registered:", tag);
  } catch (error) {
    console.error("[Sync Queue] Failed to register background sync:", error);
  }
}

export { queueDB };
