/**
 * Custom Service Worker with Workbox Background Sync
 * This service worker intercepts failed POST requests and queues them
 * for automatic retry when internet connectivity is restored
 *
 * Features:
 * - Intercepts POST requests to /api/sync-reports
 * - Queues failed requests in IndexedDB
 * - Automatically retries when online
 * - Works across page refreshes and browser restarts
 */

// Import Workbox libraries from CDN
// In production, these would be bundled by next-pwa
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/7.4.0/workbox-sw.js'
)

const { BackgroundSyncPlugin } = workbox.backgroundSync
const { registerRoute } = workbox.routing
const { NetworkOnly } = workbox.strategies

// Queue name for background sync
const SYNC_QUEUE_NAME = 'aegis-sync-queue'

// Maximum time to retain requests in the queue (48 hours)
const MAX_RETENTION_TIME = 48 * 60 // in minutes

/**
 * Background Sync Plugin Configuration
 * Automatically queues failed requests and retries them
 */
const bgSyncPlugin = new BackgroundSyncPlugin(SYNC_QUEUE_NAME, {
  maxRetentionTime: MAX_RETENTION_TIME,
  onSync: async ({ queue }) => {
    console.log('[SW] Background sync started')
    let entry
    let successCount = 0
    let failCount = 0

    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request.clone())

        if (response.ok) {
          console.log('[SW] Successfully synced:', entry.request.url)
          successCount++

          // Notify clients about successful sync
          await notifyClients({
            type: 'SYNC_SUCCESS',
            reportId: await getReportIdFromRequest(entry.request),
          })
        } else {
          console.error('[SW] Sync failed with status:', response.status)
          failCount++
          // Re-queue the request for later retry
          await queue.unshiftRequest(entry)
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.error('[SW] Sync error:', error)
        failCount++
        // Re-queue the request
        await queue.unshiftRequest(entry)
        throw error
      }
    }

    // Notify clients about sync completion
    await notifyClients({
      type: 'SYNC_COMPLETE',
      successCount,
      failCount,
    })

    console.log(
      `[SW] Background sync complete: ${successCount} succeeded, ${failCount} failed`
    )
  },
})

/**
 * Register route for POST requests to sync endpoint
 * Uses NetworkOnly strategy with Background Sync plugin
 */
registerRoute(
  ({ url, request }) => {
    return url.pathname === '/api/sync-reports' && request.method === 'POST'
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
)

/**
 * Handle periodic background sync events
 * This is triggered by the browser when connectivity is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event triggered:', event.tag)

  if (event.tag === SYNC_QUEUE_NAME) {
    event.waitUntil(
      (async () => {
        try {
          await bgSyncPlugin._queue.replayRequests()
          console.log('[SW] Replay complete')
        } catch (error) {
          console.error('[SW] Replay failed:', error)
        }
      })()
    )
  }
})

/**
 * Notify all clients (browser tabs) about sync events
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' })
  for (const client of clients) {
    client.postMessage(message)
  }
}

/**
 * Extract report ID from request body
 */
async function getReportIdFromRequest(request) {
  try {
    const clone = request.clone()
    const body = await clone.json()
    return body.localId || 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Service Worker installation
 */
self.addEventListener('install', () => {
  console.log('[SW] Installing service worker...')
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

/**
 * Service Worker activation
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    // Claim all clients immediately
    self.clients.claim()
  )
})

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_QUEUE_SIZE') {
    bgSyncPlugin._queue.size().then((size) => {
      event.ports[0].postMessage({ size })
    })
  }
})

console.log('[SW] Service worker loaded with Workbox Background Sync')
