/**
 * Custom Service Worker with Workbox
 * Features:
 * - Precaching: Static assets cached during installation
 * - Background Sync: Failed POST requests queued for retry
 * - Smart Caching: Different strategies for different resource types
 * - Offline Fallback: Friendly offline page
 * - Cache Management: Automatic expiration and cleanup
 */

// Import Workbox libraries from CDN
// In production, these would be bundled by next-pwa
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/7.4.0/workbox-sw.js'
)

const { BackgroundSyncPlugin } = workbox.backgroundSync
const { registerRoute, setDefaultHandler, setCatchHandler, NavigationRoute } =
  workbox.routing
const { NetworkOnly, CacheFirst, NetworkFirst, StaleWhileRevalidate } =
  workbox.strategies
const { ExpirationPlugin } = workbox.expiration
const { CacheableResponsePlugin } = workbox.cacheableResponse
const { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } =
  workbox.precaching

// ============================================================================
// PRECACHING CONFIGURATION
// ============================================================================

/**
 * Cleanup old caches from previous versions
 */
cleanupOutdatedCaches()

/**
 * Precache essential app shell assets
 * These files will be cached during service worker installation
 * and available offline immediately
 *
 * Note: In production with next-pwa, this list is auto-generated
 * For development, we manually specify critical paths
 */
precacheAndRoute([
  // Core app pages
  { url: '/', revision: '1.0.0' },
  { url: '/offline.html', revision: '1.0.0' },

  // Localized routes (if you need to precache specific locales)
  { url: '/en', revision: '1.0.0' },
  { url: '/si', revision: '1.0.0' },
])

/**
 * Navigation fallback handler
 * When offline and a page isn't cached, serve the offline page
 */
const offlineHandler = createHandlerBoundToURL('/offline.html')
const navigationRoute = new NavigationRoute(offlineHandler, {
  // Don't use offline page for API routes
  denylist: [/^\/api\//, /^\/en\/api\//, /^\/si\/api\//, /^\/_next\//],
})
registerRoute(navigationRoute)

// ============================================================================
// RESOURCE CACHING STRATEGIES
// ============================================================================

/**
 * Cache images with CacheFirst strategy
 * Images rarely change and can be served from cache for fast loading
 */
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200], // Cache successful responses
      }),
      new ExpirationPlugin({
        maxEntries: 60, // Limit to 60 images
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true, // Auto-cleanup if storage full
      }),
    ],
  })
)

/**
 * Cache CSS and JS with CacheFirst strategy
 * Next.js assets have content hashes, so they're immutable
 */
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true,
      }),
    ],
  })
)

/**
 * Cache fonts with CacheFirst strategy
 * Fonts don't change and should be cached aggressively
 */
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
)

/**
 * Cache GET API requests with StaleWhileRevalidate
 * Serve cached data immediately, update in background
 * Perfect for incident list - shows data fast, updates silently
 */
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200], // Only cache successful responses
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
        purgeOnQuotaError: true,
      }),
    ],
  })
)

/**
 * Default handler for unmatched requests
 * Try network first, no caching
 */
setDefaultHandler(new NetworkOnly())

/**
 * Catch handler for failed requests
 * Show offline page for navigation, error for everything else
 */
setCatchHandler(({ event }) => {
  if (event.request.destination === 'document') {
    return caches.match('/offline.html')
  }
  return Response.error()
})

// ============================================================================
// BACKGROUND SYNC CONFIGURATION
// ============================================================================

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
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker with precaching...')
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

/**
 * Service Worker activation
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),
      // Cleanup old caches
      cleanupOutdatedCaches(),
    ])
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
