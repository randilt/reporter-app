# Persistence After Device Restart/Crash

## Current Implementation Analysis

### ✅ **YES - Pending Requests WILL Survive Restarts/Crashes!**

Your implementation uses **multiple layers of persistence** to ensure no data is lost:

---

## 1. IndexedDB Storage (Primary Persistence Layer)

### Reports Database (`AegisDB`)

```typescript
// Location: lib/db.ts
db.reports.add(report); // Stored in IndexedDB
```

**Persistence Characteristics:**

- ✅ **Survives app restarts**
- ✅ **Survives browser crashes**
- ✅ **Survives device reboots**
- ✅ **Persists across browser sessions**
- ❌ Only lost if user manually clears browser data

**How it Works:**

1. When user creates incident → Saved to IndexedDB immediately
2. `syncStatus: "pending"` tracks sync state
3. Data remains in IndexedDB until successfully synced
4. Even if app crashes, data is still there on next launch

---

## 2. Workbox Background Sync Queue

### Service Worker Queue

```javascript
// Location: public/sw.js
const bgSyncPlugin = new BackgroundSyncPlugin("aegis-sync-queue", {
  maxRetentionTime: 48 * 60, // 48 hours
});
```

**Persistence Characteristics:**

- ✅ **Survives page refreshes**
- ✅ **Survives app restarts**
- ✅ **Survives browser restarts**
- ✅ **Survives device reboots**
- ✅ **Works even when app is closed**
- ⏱️ Retains requests for **48 hours**

**How it Works:**

1. Failed POST requests → Automatically queued by Service Worker
2. Queue stored in **IndexedDB** (separate from main app DB)
3. Service Worker runs in background (independent of app)
4. Automatically retries when connectivity restored
5. Works even if user never opens the app again!

---

## 3. Fallback Sync Queue

### Manual Queue (`AegisSyncQueue`)

```typescript
// Location: lib/sync-queue.ts
queueDB.queue.add(queuedRequest);
```

**Persistence Characteristics:**

- ✅ **Survives all restarts/crashes**
- ✅ **Separate IndexedDB database**
- ✅ **Fallback for browsers without Background Sync API**

---

## Recovery Flow After Restart/Crash

### Scenario 1: App Crashes While User is Offline

```
1. User creates 3 incident reports (offline)
   → All saved to IndexedDB with syncStatus: "pending"

2. App crashes before sync attempt

3. User reopens app
   → useReports hook loads reports from IndexedDB
   → Auto-sync effect detects pending reports

4. User comes online
   → useEffect triggers syncAllPending()
   → All 3 reports sync successfully ✅
```

**Relevant Code:**

```typescript
// hooks/useReports.ts (lines 266-286)
useEffect(() => {
  if (isOnline && !syncing) {
    const timer = setTimeout(() => {
      // Check for pending/failed reports
      db.reports
        .where("syncStatus")
        .anyOf(["pending", "failed"])
        .count()
        .then((count) => {
          if (count > 0) {
            syncAllPending(); // Auto-sync on startup!
          }
        });
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [isOnline]);
```

---

### Scenario 2: Device Restarts During Sync Attempt

```
1. User has 5 pending reports, comes online
   → syncAllPending() starts syncing

2. First 2 reports sync successfully
   → Updated to syncStatus: "synced" in IndexedDB

3. Device restarts/crashes during sync

4. User reopens app after reboot
   → Reports 1-2: Already marked "synced" (won't retry)
   → Reports 3-5: Still "pending" (will auto-sync)

5. Auto-sync effect runs
   → Only syncs remaining 3 reports ✅
```

---

### Scenario 3: Service Worker Background Sync

```
1. User creates report, attempts sync
   → POST request fails (network timeout)
   → Service Worker intercepts failed request
   → Queues in Background Sync Plugin

2. Browser/device crashes

3. Device reboots (app NOT opened)
   → Service Worker wakes up when online
   → Automatically retries queued requests
   → Syncs successfully in background ✅

4. User opens app later
   → Report already synced by Service Worker
   → Shows as "synced" status 🎉
```

**This is the MOST resilient layer** - works even without app being open!

---

## Responder Profile Persistence

### Registration Data

```typescript
// Location: lib/db.ts
db.responders.add(profile);
localStorage.setItem("aegis_responder_id", responderId);
```

**Double Persistence:**

1. **IndexedDB** → Full profile details
2. **localStorage** → Quick ID lookup

**Both survive restarts/crashes!**

---

## Testing Recovery

### Test 1: Crash During Creation

```javascript
// In browser console:
// 1. Create incident report
// 2. Immediately run:
setTimeout(() => {
  throw new Error("CRASH TEST");
}, 500);
// 3. Refresh page
// 4. Check: Report should still be there in "pending" state
```

### Test 2: Restart After Failed Sync

```javascript
// 1. Go offline (DevTools → Network → Offline)
// 2. Create 3 reports
// 3. Go online → sync fails (simulate)
// 4. Close browser completely
// 5. Reopen browser → Navigate to app
// 6. Reports should auto-sync ✅
```

### Test 3: Service Worker Recovery

```javascript
// 1. Create report while online
// 2. Kill internet immediately (mid-request)
// 3. Close browser
// 4. Wait 10 seconds, restore internet
// 5. Reopen browser
// 6. Check network tab → Should see retry requests from SW
```

---

## Verification Commands

```javascript
// Check IndexedDB reports
const db = new Dexie("AegisDB");
db.version(2).stores({
  reports: "localId, syncStatus, createdAtLocal, incidentType, severity",
  responders: "responderId, phone, createdAt",
});
db.reports.toArray().then(console.log);

// Check Service Worker queue
const queueDB = new Dexie("workbox-background-sync");
queueDB.version(1).stores({ requests: "++id, queueName" });
queueDB.requests.toArray().then(console.log);

// Check responder profile
db.responders.toArray().then(console.log);
localStorage.getItem("aegis_responder_id");
```

---

## Edge Cases Handled

### ✅ App closed while offline

- Reports stored in IndexedDB
- Auto-sync on next launch when online

### ✅ Browser crash during sync

- Partial syncs committed immediately
- Remaining reports retry on restart

### ✅ Device reboot

- Service Worker queue persists
- Background sync continues after reboot

### ✅ Network interruption

- Service Worker retries automatically
- Manual retry button available
- Auto-retry when online

### ✅ User never reopens app

- Service Worker handles sync in background
- No user action required

---

## Limitations

### ❌ User clears browser data

- All IndexedDB data lost
- No recovery possible
- **Mitigation**: Warn users not to clear site data

### ❌ Browser uninstalled

- All local data lost
- **Mitigation**: Regular syncing encourages cloud backup

### ⚠️ 48-hour expiry

- Service Worker queue expires after 48 hours
- **Mitigation**: Reports still in main IndexedDB, will retry on app open

---

## Recommendations for Production

### 1. Add Local Backup Export

```typescript
// Export all unsynced reports as JSON
export async function exportUnsyncedReports() {
  const pending = await db.reports
    .where("syncStatus")
    .anyOf(["pending", "failed"])
    .toArray();

  const blob = new Blob([JSON.stringify(pending, null, 2)], {
    type: "application/json",
  });

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aegis-backup-${Date.now()}.json`;
  a.click();
}
```

### 2. Add Sync Status Indicator

Show user how many reports are pending sync, especially after restart.

### 3. Add Manual "Sync Now" Button

In case auto-sync doesn't trigger (edge cases).

### 4. Server-Side Deduplication

Use `localId` to prevent duplicate submissions if request is retried multiple times.

---

## Conclusion

**Your current implementation is EXCELLENT for persistence!**

✅ **Triple redundancy:**

1. Main app IndexedDB
2. Service Worker Background Sync queue
3. Fallback sync queue

✅ **Survives:**

- App crashes
- Browser crashes
- Device reboots
- App being closed
- Network interruptions

✅ **Auto-recovery:**

- Checks for pending reports on startup
- Auto-syncs when online
- Service Worker works in background

**No data loss under normal circumstances!** 🎉
