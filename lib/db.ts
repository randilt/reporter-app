import Dexie, { type EntityTable } from 'dexie';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export type IncidentType = 'flood' | 'landslide' | 'fire' | 'accident' | 'road_block' | 'power_line_down';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface LocationData {
  lat: number;
  lng: number;
  accuracyMeters: number;
}

export interface IncidentReport {
  localId: string;
  serverId: string | null;
  syncStatus: SyncStatus;
  incidentType: IncidentType;
  severity: Severity;
  description?: string;
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

const db = new Dexie('AegisDB') as Dexie & {
  reports: EntityTable<IncidentReport, 'localId'>;
};

db.version(1).stores({
  reports: 'localId, syncStatus, createdAtLocal, incidentType, severity'
});

export { db };

// Helper to get device info
export const getDeviceInfo = () => {
  const deviceId = localStorage.getItem('aegis_device_id') || crypto.randomUUID();
  if (!localStorage.getItem('aegis_device_id')) {
    localStorage.setItem('aegis_device_id', deviceId);
  }
  
  return {
    deviceId,
    appVersion: '1.0.0-prototype',
    deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffsetMinutes: new Date().getTimezoneOffset()
  };
};

// Helper to get responderId
export const getResponderId = () => {
  return localStorage.getItem('aegis_responder_id') || 'demo-responder-001';
};

export const setResponderId = (id: string) => {
  localStorage.setItem('aegis_responder_id', id);
};

// Default severity based on incident type
export const getDefaultSeverity = (type: IncidentType): Severity => {
  const severityMap: Record<IncidentType, Severity> = {
    landslide: 'critical',
    fire: 'critical',
    flood: 'high',
    accident: 'high',
    road_block: 'medium',
    power_line_down: 'medium'
  };
  return severityMap[type];
};

// Incident type labels
export const incidentTypeLabels: Record<IncidentType, string> = {
  flood: 'Flood',
  landslide: 'Landslide',
  fire: 'Fire',
  accident: 'Accident',
  road_block: 'Road Block',
  power_line_down: 'Power Line Down'
};

// Severity labels and colors
export const severityConfig: Record<Severity, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-success' },
  medium: { label: 'Medium', color: 'bg-warning' },
  high: { label: 'High', color: 'bg-primary' },
  critical: { label: 'Critical', color: 'bg-destructive' }
};
