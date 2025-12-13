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

export interface ResponderInfo {
  name: string;
  responderId: string;
  phone: string;
  email: string;
}

export interface IncidentReport {
  localId: string;
  serverId: string | null;
  incidentType: IncidentType;
  severity: Severity;
  createdAtLocal: string;
  syncedAt?: string | null;
  locationCapturedAtCreation: Location;
  locationCapturedAtSync: Location | null;
  syncStatus?: SyncStatus;
  responderId: string;
  responderName?: string;
  responderPhone?: string;
  responderInfo?: ResponderInfo;
  deviceId: string;
  appVersion: string;
  description: string;
  images?: string[];
  status?: string;
  city?: string; // City from reverse geocoding
  province?: string; // Province from reverse geocoding
}

// API types
export interface ApiIncidentReport {
  responderId: string;
  appVersion: string;
  responderInfo: ResponderInfo;
  status: string;
  serverId: string;
  localId: string;
  timezoneOffsetMinutes: number;
  incidentType: string;
  createdAtLocal: string;
  deviceTimezone: string;
  deviceTime: string;
  locationCapturedAtSync: Location;
  deviceId: string;
  locationCapturedAtCreation: Location;
  description: string;
  userCorrectedTime: string | null;
  severity: string;
  city?: string; // City from reverse geocoding
  province?: string; // Province from reverse geocoding
}

export interface ApiResponse {
  data: ApiIncidentReport[];
}

// Convert API response to internal format
export function convertApiToReport(
  apiReport: ApiIncidentReport
): IncidentReport {
  return {
    localId: apiReport.localId,
    serverId: apiReport.serverId || null,
    incidentType: (apiReport.incidentType.charAt(0).toUpperCase() +
      apiReport.incidentType.slice(1)) as IncidentType,
    severity: (apiReport.severity.charAt(0).toUpperCase() +
      apiReport.severity.slice(1)) as Severity,
    createdAtLocal: apiReport.createdAtLocal,
    syncedAt: null,
    locationCapturedAtCreation: apiReport.locationCapturedAtCreation,
    locationCapturedAtSync: apiReport.locationCapturedAtSync || null,
    syncStatus:
      apiReport.status === "waiting" ? "pending" : ("synced" as SyncStatus),
    responderId: apiReport.responderId,
    responderName: apiReport.responderInfo?.name || "Unknown",
    responderPhone: apiReport.responderInfo?.phone || "",
    responderInfo: apiReport.responderInfo,
    deviceId: apiReport.deviceId,
    appVersion: apiReport.appVersion,
    description: apiReport.description,
    images: [],
    status: apiReport.status,
    city: apiReport.city,
    province: apiReport.province,
  };
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

const responderNames = [
  "Roshan Silva",
  "Priya Kumari",
  "Kasun Perera",
  "Amara Jayasinghe",
  "Dilshan Fernando",
  "Nidhi Sharma",
  "Sanjeev Kumar",
  "Lakshmi Patel",
  "Arjun Reddy",
  "Maya Desai",
];

const imageUrls = [
  "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1587569536149-2b0b9e94b22f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1579033100900-be2e78838ac7?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1559839673-92ecb05241ba?w=400&h=300&fit=crop",
];

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
    responderName: randomFromArray(responderNames),
    responderPhone: `+94${String(
      Math.floor(Math.random() * 900000000) + 100000000
    ).padStart(9, "0")}`,
    deviceId: `device-${String(Math.floor(Math.random() * 100) + 1).padStart(
      3,
      "0"
    )}`,
    appVersion: randomFromArray(["1.0.0", "1.0.1", "1.1.0", "1.2.0"]),
    description: randomFromArray(descriptions[incidentType]),
    images: Array.from({ length: Math.floor(Math.random() * 4) }, () =>
      randomFromArray(imageUrls)
    ),
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
