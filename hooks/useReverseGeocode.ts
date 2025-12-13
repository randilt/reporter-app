import { useState, useEffect, useCallback, useRef } from "react";

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  continent: string;
  continentCode: string;
  countryName: string;
  countryCode: string;
  principalSubdivision: string;
  principalSubdivisionCode: string;
  city: string;
  locality: string;
  postcode: string;
  plusCode: string;
  localityInfo?: {
    administrative?: Array<{
      name: string;
      description: string;
      isoName: string;
      order: number;
      adminLevel: number;
      isoCode?: string;
      wikidataId?: string;
      geonameId?: number;
    }>;
    informative?: Array<{
      name: string;
      description: string;
      isoName?: string;
      order: number;
      isoCode?: string;
      wikidataId?: string;
      geonameId?: number;
    }>;
  };
}

interface UseReverseGeocodeOptions {
  latitude: number;
  longitude: number;
  localityLanguage?: "en" | "si";
  enabled?: boolean;
}

interface UseReverseGeocodeReturn {
  data: ReverseGeocodeResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Global cache to prevent duplicate API calls across all component instances
const globalCache = new Map<string, ReverseGeocodeResult>();
const pendingRequests = new Map<string, Promise<ReverseGeocodeResult>>();

export function useReverseGeocode({
  latitude,
  longitude,
  localityLanguage = "en",
  enabled = true,
}: UseReverseGeocodeOptions): UseReverseGeocodeReturn {
  const [data, setData] = useState<ReverseGeocodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if this hook instance has initialized
  const initializedRef = useRef(false);

  const fetchGeocode = useCallback(async () => {
    if (!enabled || latitude === 0 || longitude === 0) {
      return;
    }

    // Create a unique key for this location + language combo
    const cacheKey = `${latitude.toFixed(6)}_${longitude.toFixed(
      6
    )}_${localityLanguage}`;

    // Check global cache first
    const cachedData = globalCache.get(cacheKey);
    if (cachedData) {
      console.log("[useReverseGeocode] Using cached data for:", cacheKey);
      setData(cachedData);
      return;
    }

    // Check if there's already a pending request for this location
    const pendingRequest = pendingRequests.get(cacheKey);
    if (pendingRequest) {
      console.log("[useReverseGeocode] Reusing pending request for:", cacheKey);
      try {
        const result = await pendingRequest;
        setData(result);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
      }
      return;
    }

    setLoading(true);
    setError(null);

    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${localityLanguage}`;
    console.log("[useReverseGeocode] NEW API CALL:", url);

    // Create the fetch promise and store it
    const fetchPromise = (async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch geocode data: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    })();

    // Store the pending request
    pendingRequests.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      setData(result);
      globalCache.set(cacheKey, result); // Cache the result
      console.log("[useReverseGeocode] Cached result for:", cacheKey);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("[useReverseGeocode] Error:", err);
    } finally {
      setLoading(false);
      pendingRequests.delete(cacheKey); // Remove from pending
    }
  }, [latitude, longitude, localityLanguage, enabled]);

  useEffect(() => {
    // Only fetch once per hook instance
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchGeocode();
    }
  }, [fetchGeocode]);

  return {
    data,
    loading,
    error,
    refetch: fetchGeocode,
  };
}
