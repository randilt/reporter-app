import Dexie, { type EntityTable } from "dexie";

export type SyncStatus = "pending" | "synced" | "failed";

export type IncidentType =
  | "flood"
  | "landslide"
  | "fire"
  | "accident"
  | "road_block"
  | "power_line_down";

export type Severity = "low" | "medium" | "high" | "critical";

export interface LocationData {
  lat: number;
  lng: number;
  accuracyMeters: number;
}

export interface ResponderProfile {
  responderId: string; // UUID
  name: string;
  phone: string;
  email?: string;
  nic?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentReport {
  localId: string;
  serverId: string | null;
  syncStatus: SyncStatus;
  incidentType: IncidentType;
  severity: Severity;
  description?: string;
  manualAddress?: string; // Optional manual address if GPS fails
  createdAtLocal: string;
  lastEditedAtLocal: string;
  syncedAt: string | null;
  syncAttempts: number;
  lastSyncError: string | null;
  locationCapturedAtCreation: LocationData;
  locationCapturedAtSync: LocationData | null;
  deviceTime: string;
  userCorrectedTime: string | null;
  deviceTimezone: string;
  timezoneOffsetMinutes: number;
  responderId: string;
  deviceId: string;
  appVersion: string;
  photoBlob?: Blob;
}

const db = new Dexie("AegisDB") as Dexie & {
  reports: EntityTable<IncidentReport, "localId">;
  responders: EntityTable<ResponderProfile, "responderId">;
};

// Version 1: Initial schema with reports
db.version(1).stores({
  reports: "localId, syncStatus, createdAtLocal, incidentType, severity",
});

// Version 2: Add responders table
db.version(2).stores({
  reports: "localId, syncStatus, createdAtLocal, incidentType, severity",
  responders: "responderId, phone, createdAt",
});

export { db };

// Helper to get device info
export const getDeviceInfo = () => {
  const deviceId =
    localStorage.getItem("aegis_device_id") || crypto.randomUUID();
  if (!localStorage.getItem("aegis_device_id")) {
    localStorage.setItem("aegis_device_id", deviceId);
  }

  return {
    deviceId,
    appVersion: "1.0.0-prototype",
    deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
  };
};

// Helper to get current responder profile
export const getCurrentResponder =
  async (): Promise<ResponderProfile | null> => {
    const responderId = localStorage.getItem("aegis_responder_id");
    if (!responderId) return null;

    const responder = await db.responders.get(responderId);
    return responder || null;
  };

// Helper to save responder profile
export const saveResponderProfile = async (
  data: Omit<ResponderProfile, "responderId" | "createdAt" | "updatedAt">
): Promise<ResponderProfile> => {
  const responderId = crypto.randomUUID();
  const now = new Date().toISOString();

  const profile: ResponderProfile = {
    responderId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.responders.add(profile);
  localStorage.setItem("aegis_responder_id", responderId);

  return profile;
};

// Helper to update responder profile
export const updateResponderProfile = async (
  responderId: string,
  data: Partial<Omit<ResponderProfile, "responderId" | "createdAt">>
): Promise<void> => {
  await db.responders.update(responderId, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

// Helper to get responderId (for backward compatibility)
export const getResponderId = async (): Promise<string> => {
  const responder = await getCurrentResponder();
  return responder?.responderId || "anonymous";
};

// Default severity based on incident type
export const getDefaultSeverity = (type: IncidentType): Severity => {
  const severityMap: Record<IncidentType, Severity> = {
    landslide: "critical",
    fire: "critical",
    flood: "high",
    accident: "high",
    road_block: "medium",
    power_line_down: "medium",
  };
  return severityMap[type];
};

// Incident type labels
export const incidentTypeLabels: Record<IncidentType, string> = {
  flood: "Flood",
  landslide: "Landslide",
  fire: "Fire",
  accident: "Accident",
  road_block: "Road Block",
  power_line_down: "Power Line Down",
};

// Severity labels and colors
export const severityConfig: Record<
  Severity,
  { label: string; color: string }
> = {
  low: { label: "Low", color: "bg-success" },
  medium: { label: "Medium", color: "bg-warning" },
  high: { label: "High", color: "bg-primary" },
  critical: { label: "Critical", color: "bg-destructive" },
};
