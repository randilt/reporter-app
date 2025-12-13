/**
 * API Client for syncing incident reports
 * Provides a centralized place to configure API endpoints and authentication
 */

// API Configuration
// TO REPLACE WITH REAL API: Update this endpoint
export const API_CONFIG = {
  syncEndpoint: "/api/sync-reports",
  // Add other endpoints as needed
  // baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  // timeout: 30000,
} as const;

export interface ResponderInfo {
  responderId: string;
  name: string;
  phone: string;
  email?: string;
  nic?: string;
}

export interface SyncReportPayload {
  localId: string;
  serverId: string | null;
  incidentType: string;
  severity: string;
  description?: string;
  manualAddress?: string; // Optional manual address if GPS fails
  createdAtLocal: string;
  locationCapturedAtCreation: {
    lat: number;
    lng: number;
    accuracyMeters: number;
  };
  locationCapturedAtSync: {
    lat: number;
    lng: number;
    accuracyMeters: number;
  } | null;
  deviceTime: string;
  userCorrectedTime: string | null;
  deviceTimezone: string;
  timezoneOffsetMinutes: number;
  responderId: string;
  responderInfo: ResponderInfo | null; // Full responder details
  deviceId: string;
  appVersion: string;
}

export interface SyncResponse {
  success: boolean;
  data?: {
    serverId: string;
    localId: string;
    createdByUser: string; // When user actually created the incident
    syncedAt: string; // When server received/processed it
    message: string;
  };
  error?: string;
}

/**
 * Sync a single report to the server
 * This function can be used directly or through the background sync queue
 */
export async function syncReport(
  payload: SyncReportPayload
): Promise<SyncResponse> {
  try {
    const response = await fetch(API_CONFIG.syncEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TO REPLACE WITH REAL API: Add authentication headers
        // 'Authorization': `Bearer ${getToken()}`,
        // 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data: SyncResponse = await response.json();
    return data;
  } catch (error) {
    console.error("[API Client] Sync failed:", error);
    throw error;
  }
}

/**
 * Check if the API is reachable
 * Useful for determining online/offline status
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(API_CONFIG.syncEndpoint, {
      method: "OPTIONS",
      cache: "no-cache",
    });
    return response.ok;
  } catch {
    return false;
  }
}
