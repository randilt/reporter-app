# Responder Registration System

## Overview

The app now requires users to register their details before they can submit incident reports. This ensures every report is linked to a verified responder with contact information.

## Flow

```
User Opens App
      ↓
Check IndexedDB for Responder Profile
      ↓
  Not Found?
      ↓
Show Registration Form
      ↓
User Enters: Name, Phone, Email (opt), NIC (opt)
      ↓
Generate UUID for Responder
      ↓
Save to IndexedDB
      ↓
Store UUID in localStorage
      ↓
Show Incident Reporting Interface
```

## Database Schema

### Responders Table (IndexedDB)

```typescript
interface ResponderProfile {
  responderId: string; // UUID (globally unique)
  name: string; // Full name (required)
  phone: string; // Phone number (required)
  email?: string; // Email (optional)
  nic?: string; // National ID (optional)
  createdAt: string; // Registration timestamp
  updatedAt: string; // Last update timestamp
}
```

### Reports Table Enhancement

Each incident report now includes:

- `responderId`: Links to ResponderProfile
- `responderInfo`: Full responder details sent to API

## API Payload

When syncing an incident to the server, the payload includes:

```json
{
  "localId": "...",
  "responderId": "resp_abc123...",
  "responderInfo": {
    "responderId": "resp_abc123...",
    "name": "John Doe",
    "phone": "+94771234567",
    "email": "john@example.com",
    "nic": "912345678V"
  },
  "incidentType": "fire",
  "severity": "high",
  ...
}
```

## Components

### ResponderRegistration Component

- Located: `components/ResponderRegistration.tsx`
- Form with validation for name, phone, email, NIC
- Creates UUID and saves to IndexedDB
- Shows privacy notice

### useResponder Hook

- Located: `hooks/useResponder.ts`
- Manages responder state
- Returns: `{ responder, loading, isRegistered, refreshResponder }`
- Auto-loads profile on mount

## Storage

### IndexedDB (Dexie)

- **Table**: `responders`
- **Primary Key**: `responderId`
- **Indexes**: `phone`, `createdAt`
- **Cross-browser compatible**
- **Persists across sessions**

### localStorage (Backup)

- **Key**: `aegis_responder_id`
- **Value**: Current responderId UUID
- **Purpose**: Quick lookup without DB query

## Dummy Data

All 20 incidents in `lib/dummy-incidents.json` now include:

```json
{
  "reportedBy": {
    "responderId": "resp_...",
    "name": "Kamal Perera",
    "phone": "+94771234567",
    "email": "kamal.perera@email.com",
    "nic": "912345678V"
  },
  "assignedTo": {
    "name": "Fire Chief Nimal Silva",
    "mobile": "+94772345678",
    "unit": "Fire Station Alpha",
    "badge": "FS-001"
  }
}
```

- **reportedBy**: The citizen/responder who submitted the report
- **assignedTo**: Emergency services personnel who responded

## Validation Rules

### Name

- Required
- Minimum: 1 character
- Cannot be empty/whitespace

### Phone

- Required
- Format: 10-15 digits
- Can include `+`, spaces, hyphens
- Example: `+94771234567` or `0771234567`

### Email (Optional)

- Must be valid email format if provided
- Pattern: `name@domain.com`

### NIC (Optional)

- Minimum 5 characters if provided
- Sri Lankan NIC format support

## Privacy & Security

- ✅ Data stored locally on device (IndexedDB)
- ✅ Only shared with server when syncing reports
- ✅ No third-party sharing
- ✅ User controls their data
- ✅ Can be updated (future feature)

## Migration

The database automatically upgrades from v1 to v2:

```typescript
// Version 1: Only reports
db.version(1).stores({
  reports: "localId, syncStatus, createdAtLocal, incidentType, severity",
});

// Version 2: Adds responders
db.version(2).stores({
  reports: "localId, syncStatus, createdAtLocal, incidentType, severity",
  responders: "responderId, phone, createdAt",
});
```

Dexie handles this automatically - existing data is preserved.

## Future Enhancements

1. **Profile Editing**: Allow users to update their details
2. **Multiple Profiles**: Support switching between responder profiles
3. **Profile Verification**: SMS/Email verification
4. **Badge/Credentials**: Upload ID/credentials for verification
5. **Profile Picture**: Optional avatar upload

## Testing

To test locally:

1. **Clear Existing Data**:

   ```javascript
   // In browser console
   localStorage.removeItem("aegis_responder_id");
   indexedDB.deleteDatabase("AegisDB");
   // Refresh page
   ```

2. **Register New User**:

   - Fill form with test data
   - Click "Register & Continue"
   - Verify you see incident form

3. **Check Stored Data**:

   ```javascript
   // In browser console
   const db = new Dexie("AegisDB");
   db.version(2).stores({ responders: "responderId" });
   db.responders.toArray().then(console.log);
   ```

4. **Verify API Payload**:
   - Submit an incident
   - Check Network tab for `/api/sync-reports`
   - Verify `responderInfo` is included in payload

## API Integration

When replacing the mock API:

1. The `responderInfo` object is already included in sync payload
2. Backend should validate responder details
3. Backend should link incident to responder account
4. Consider adding responder authentication in future

Server can now:

- Track who reported each incident
- Contact responders for follow-up
- Verify responder credentials
- Build responder reputation/history
