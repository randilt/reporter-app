export type SyncStatus = "pending" | "synced" | "failed";
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type IncidentType =
  | "Flood"
  | "Fire"
  | "Earthquake"
  | "Storm"
  | "Accident"
  | "Medical"
  | "Hazmat"
  | "Infrastructure";

export interface Location {
  lat: number;
  lng: number;
  accuracyMeters: number;
}

export interface IncidentReport {
  localId: string;
  serverId: string | null;
  incidentType: IncidentType;
  severity: Severity;
  createdAtLocal: string;
  syncedAt: string | null;
  locationCapturedAtCreation: Location;
  locationCapturedAtSync: Location | null;
  syncStatus: SyncStatus;
  responderId: string;
  deviceId: string;
  appVersion: string;
  description: string;
}

// Generate realistic mock data around Sri Lanka
const incidentTypes: IncidentType[] = [
  "Flood",
  "Fire",
  "Earthquake",
  "Storm",
  "Accident",
  "Medical",
  "Hazmat",
  "Infrastructure",
];
const severities: Severity[] = ["Low", "Medium", "High", "Critical"];
const syncStatuses: SyncStatus[] = [
  "pending",
  "synced",
  "synced",
  "synced",
  "failed",
]; // weighted towards synced

const descriptions: Record<IncidentType, string[]> = {
  Flood: [
    "Road submerged under 2ft water",
    "Basement flooding reported",
    "River overflow affecting nearby homes",
    "Flash flood warning area",
  ],
  Fire: [
    "Building fire, 3rd floor",
    "Wildfire approaching residential area",
    "Kitchen fire contained",
    "Electrical fire in warehouse",
  ],
  Earthquake: [
    "Minor tremor felt",
    "Structural damage to old buildings",
    "Aftershock monitoring",
    "Cracks in foundation reported",
  ],
  Storm: [
    "Power lines down",
    "Trees blocking main road",
    "Roof damage to multiple homes",
    "Storm surge warning",
  ],
  Accident: [
    "Multi-vehicle collision",
    "Pedestrian struck",
    "Industrial machinery accident",
    "Construction site incident",
  ],
  Medical: [
    "Mass casualty incident",
    "Cardiac emergency",
    "Allergic reaction reported",
    "Heat stroke cases",
  ],
  Hazmat: [
    "Chemical spill on highway",
    "Gas leak detected",
    "Unknown substance found",
    "Industrial chemical release",
  ],
  Infrastructure: [
    "Bridge structural concern",
    "Water main break",
    "Power grid failure",
    "Road collapse",
  ],
};

// Locations around Sri Lanka
const baseLocations = [
  { lat: 6.9271, lng: 79.8612, name: "Colombo" },
  { lat: 7.2906, lng: 80.6337, name: "Kandy" },
  { lat: 6.0535, lng: 80.221, name: "Galle" },
  { lat: 9.6615, lng: 80.0255, name: "Jaffna" },
  { lat: 7.8731, lng: 80.7718, name: "Dambulla" },
  { lat: 6.9344, lng: 79.8428, name: "Colombo Port" },
  { lat: 7.4818, lng: 80.3609, name: "Kurunegala" },
  { lat: 6.7056, lng: 79.9074, name: "Moratuwa" },
  { lat: 7.0873, lng: 79.999, name: "Negombo" },
  { lat: 8.3114, lng: 80.4037, name: "Anuradhapura" },
];

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReport(index: number): IncidentReport {
  const baseLocation = randomFromArray(baseLocations);
  const incidentType = randomFromArray(incidentTypes);
  const syncStatus = randomFromArray(syncStatuses);

  // Random time within last 7 days
  const createdAt = new Date(
    Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
  );
  const syncDelay = Math.random() * 30 * 60 * 1000; // 0-30 minutes sync delay
  const syncedAt =
    syncStatus === "synced" ? new Date(createdAt.getTime() + syncDelay) : null;

  const locationAtCreation: Location = {
    lat: baseLocation.lat + (Math.random() - 0.5) * 0.1,
    lng: baseLocation.lng + (Math.random() - 0.5) * 0.1,
    accuracyMeters: Math.floor(Math.random() * 20) + 5,
  };

  const locationAtSync: Location | null =
    syncStatus === "synced"
      ? {
          lat: locationAtCreation.lat + (Math.random() - 0.5) * 0.001,
          lng: locationAtCreation.lng + (Math.random() - 0.5) * 0.001,
          accuracyMeters: Math.floor(Math.random() * 25) + 10,
        }
      : null;

  return {
    localId: generateUUID(),
    serverId:
      syncStatus !== "pending"
        ? `srv-${String(index + 1).padStart(4, "0")}`
        : null,
    incidentType,
    severity: randomFromArray(severities),
    createdAtLocal: createdAt.toISOString(),
    syncedAt: syncedAt?.toISOString() || null,
    locationCapturedAtCreation: locationAtCreation,
    locationCapturedAtSync: locationAtSync,
    syncStatus,
    responderId: `rep-${String(Math.floor(Math.random() * 50) + 1).padStart(
      3,
      "0"
    )}`,
    deviceId: `device-${String(Math.floor(Math.random() * 100) + 1).padStart(
      3,
      "0"
    )}`,
    appVersion: randomFromArray(["1.0.0", "1.0.1", "1.1.0", "1.2.0"]),
    description: randomFromArray(descriptions[incidentType]),
  };
}

export const mockReports: IncidentReport[] = Array.from(
  { length: 50 },
  (_, i) => generateReport(i)
);

export function getSyncLatency(report: IncidentReport): number | null {
  if (!report.syncedAt || !report.createdAtLocal) return null;
  const created = new Date(report.createdAtLocal).getTime();
  const synced = new Date(report.syncedAt).getTime();
  return Math.round((synced - created) / 1000); // in seconds
}

export function formatLatency(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
