# Background Sync Implementation Guide

## Overview

This project implements production-ready offline background sync using IndexedDB + Service Worker (Workbox Background Sync) for POST requests in Next.js App Router.

## Architecture

```
┌─────────────────┐
│   Client App    │
│  (React Hooks)  │
└────────┬────────┘
         │
         ├─── Online ────► Direct API Call
         │
         └─── Offline ───► IndexedDB Queue ───► Service Worker ───► Background Sync
                                                       │
                                                       └─► Auto-retry when online
```

## File Structure

```
/app
  /api
    /sync-reports
      route.ts              # Mock API endpoint (replace with real API)

/hooks
  useBackgroundSync.ts      # Client-side sync management
  useReports.ts            # Report management with sync integration

/lib
  api-client.ts            # Centralized API configuration
  sync-queue.ts            # IndexedDB queue manager
  db.ts                    # Existing Dexie database

/public
  sw.js                    # Service Worker with Workbox Background Sync
  manifest.json            # PWA manifest

next.config.ts             # Next.js + PWA configuration
```

## How It Works

### 1. When User Creates a Report

```typescript
// In useReports.ts
const createReport = async (data) => {
  // Save to local IndexedDB first (instant)
  const report = await db.reports.add({
    ...data,
    localId: generateId(),
    syncStatus: "pending",
  });

  // Attempt to sync immediately
  const { syncSingleReport } = useBackgroundSync();
  await syncSingleReport(report);
};
```

### 2. Online Scenario

```
User Creates Report
      ↓
Save to IndexedDB (instant feedback)
      ↓
Attempt Direct API Call
      ↓
Success? → Update syncStatus to 'synced'
      ↓
Failure? → Add to Background Sync Queue
```

### 3. Offline Scenario

```
User Creates Report
      ↓
Save to IndexedDB (instant feedback)
      ↓
Detect Offline Status
      ↓
Add Request to Sync Queue
      ↓
Register Background Sync Tag
      ↓
Service Worker Takes Over
      ↓
Auto-retry when connectivity restored
```

## Timestamp Structure

### Two Important Timestamps

1. **`createdByUser`**: When the user actually created/reported the incident on their device

   - Captured from device time at the moment of incident creation
   - Represents the real-world time the incident occurred
   - Used for incident timeline and chronological ordering

2. **`syncedAt`**: When the server received and processed the incident
   - Server-generated timestamp when API receives the request
   - May be different from `createdByUser` due to:
     - Offline delay (user created while offline, synced later)
     - Network latency
     - Background sync retry delays
   - Used for server-side tracking and audit trails

**Example Scenario:**

```json
{
  "createdByUser": "2024-12-13T08:20:34.567Z", // User reported at 8:20 AM
  "syncedAt": "2024-12-13T08:25:12.123Z", // Server received at 8:25 AM (5 min delay)
  "delay": "278s" // User was offline for 4.5 minutes
}
```

### Location Data Structure

1. **`locationCapturedAtCreation`**: Where the incident was reported (always present)
2. **`locationCapturedAtSync`**: Where user was during sync attempt (may be null if geolocation fails)

## Key Components

### 1. Service Worker (`public/sw.js`)

- Intercepts failed POST requests to `/api/sync-reports`
- Uses Workbox `BackgroundSyncPlugin` for automatic retry
- Queues requests in IndexedDB
- Retries when browser detects connectivity
- Works across browser restarts

```javascript
// Automatic queuing for failed requests
const bgSyncPlugin = new BackgroundSyncPlugin("aegis-sync-queue", {
  maxRetentionTime: 48 * 60, // 48 hours
});

registerRoute(
  ({ url, request }) =>
    url.pathname === "/api/sync-reports" && request.method === "POST",
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "POST"
);
```

### 2. Sync Queue Manager (`lib/sync-queue.ts`)

- Manages IndexedDB queue for pending requests
- Provides fallback for browsers without Background Sync API
- Handles manual queue processing
- Tracks retry counts and errors

```typescript
// Add request to queue
await addToQueue(url, options, reportLocalId);

// Process all pending requests
const successCount = await processQueue();

// Check queue size
const size = await getQueueSize();
```

### 3. Background Sync Hook (`hooks/useBackgroundSync.ts`)

- React hook for sync functionality
- Handles online/offline detection
- Auto-syncs when connection restored
- Provides sync status and queue size

```typescript
const {
  isSupported, // Is Background Sync API supported?
  queueSize, // Number of pending requests
  isSyncing, // Is sync in progress?
  syncSingleReport, // Sync one report
  syncPendingRequests, // Sync all pending
} = useBackgroundSync();
```

### 4. API Client (`lib/api-client.ts`)

- Centralized API configuration
- Easy to swap mock API with real endpoint
- Handles authentication headers
- Type-safe request/response

```typescript
// TO REPLACE WITH REAL API:
export const API_CONFIG = {
  syncEndpoint: "/api/sync-reports", // Change this
  // baseURL: process.env.NEXT_PUBLIC_API_URL,
  // timeout: 30000,
};
```

## Replacing Mock API with Real API

### Step 1: Update API Configuration

```typescript
// lib/api-client.ts
export const API_CONFIG = {
  syncEndpoint: process.env.NEXT_PUBLIC_API_URL + "/reports/sync",
  timeout: 30000,
};
```

### Step 2: Add Authentication

```typescript
// lib/api-client.ts
export async function syncReport(payload: SyncReportPayload) {
  const response = await fetch(API_CONFIG.syncEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
      "X-API-Key": process.env.NEXT_PUBLIC_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  // Handle response...
}
```

### Step 3: Update Service Worker

```javascript
// public/sw.js
// Update the route pattern to match your real API
registerRoute(
  ({ url, request }) => {
    return (
      url.hostname === "your-api.com" &&
      url.pathname.includes("/reports/sync") &&
      request.method === "POST"
    );
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "POST"
);
```

### Step 4: Update Response Handling

```typescript
// lib/api-client.ts
export interface SyncResponse {
  success: boolean;
  data?: {
    id: string; // Your backend's ID field
    status: string; // Your backend's status field
    synced_at: string; // Your backend's timestamp field
  };
  error?: string;
}
```

## Testing Background Sync

### Test Offline Sync

1. Open Chrome DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Create an incident report
4. Report should save locally with "pending" status
5. Uncheck "Offline"
6. Service Worker automatically syncs
7. Report status updates to "synced"

### Test Background Sync Event

1. Open Chrome DevTools → Console
2. Run: `await navigator.serviceWorker.ready.then(reg => reg.sync.register('aegis-sync-queue'))`
3. Check Network tab for sync requests
4. Verify reports sync successfully

### Test Queue Persistence

1. Create reports while offline
2. Close browser completely
3. Reopen browser
4. Go online
5. Background Sync should automatically resume

## Browser Support

| Feature                    | Chrome | Firefox | Safari | Edge |
| -------------------------- | ------ | ------- | ------ | ---- |
| Background Sync API        | ✅     | ❌      | ❌     | ✅   |
| IndexedDB Queue (Fallback) | ✅     | ✅      | ✅     | ✅   |
| Service Worker             | ✅     | ✅      | ✅     | ✅   |

**Note**: Firefox and Safari don't support Background Sync API, but the implementation gracefully falls back to manual queue processing when online.

## Configuration Options

### Service Worker Retention Time

```javascript
// public/sw.js
const MAX_RETENTION_TIME = 48 * 60; // 48 hours in minutes
```

### Auto-Sync Delay

```typescript
// hooks/useBackgroundSync.ts
syncTimeoutRef.current = setTimeout(() => {
  syncPendingRequests();
}, 1000); // Wait 1 second after coming online
```

### API Timeout

```typescript
// lib/api-client.ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
```

## Troubleshooting

### Service Worker Not Registering

```javascript
// Check in Console
navigator.serviceWorker.getRegistrations().then((regs) => {
  console.log("Registered SWs:", regs);
});
```

### Queue Not Processing

```javascript
// Manually process queue
import { processQueue } from "@/lib/sync-queue";
await processQueue();
```

### Background Sync Not Firing

```javascript
// Check if supported
if ("sync" in ServiceWorkerRegistration.prototype) {
  console.log("Background Sync is supported");
} else {
  console.log("Background Sync not supported, using fallback");
}
```

## Performance Considerations

- **IndexedDB is fast**: Saves happen instantly, no UI blocking
- **Service Worker overhead**: Minimal, runs in background thread
- **Network batching**: Sync multiple reports in one network session
- **Retry strategy**: Exponential backoff prevents server overload

## Security Considerations

1. **HTTPS Only**: Service Workers require HTTPS (except localhost)
2. **Same-Origin**: Service Worker and API must be same origin
3. **Authentication**: Add auth tokens to all sync requests
4. **Data Encryption**: Consider encrypting sensitive data in IndexedDB

## Production Checklist

- [ ] Replace mock API endpoint with real API
- [ ] Add authentication/authorization
- [ ] Configure proper CORS on backend
- [ ] Test on mobile devices
- [ ] Test with slow/unstable networks
- [ ] Add error monitoring (Sentry, etc.)
- [ ] Set up analytics for sync success rates
- [ ] Configure cache invalidation strategy
- [ ] Add retry limits to prevent infinite loops
- [ ] Test battery impact on mobile

## Dependencies

```json
{
  "@ducanh2912/next-pwa": "^10.2.9",
  "workbox-window": "^7.4.0",
  "workbox-background-sync": "^7.4.0",
  "dexie": "^4.2.1"
}
```

## Additional Resources

- [Workbox Background Sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync/)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)
- [IndexedDB Best Practices](https://web.dev/indexeddb-best-practices/)
