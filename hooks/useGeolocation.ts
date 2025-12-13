import { useState, useCallback } from 'react';
import type { LocationData } from '@/lib/db';

interface GeolocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null
  });

  const getLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      if (!navigator.geolocation) {
        const error = 'Geolocation not supported';
        setState(prev => ({ ...prev, loading: false, error }));
        reject(new Error(error));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyMeters: position.coords.accuracy
          };
          setState({ location: locationData, loading: false, error: null });
          resolve(locationData);
        },
        (error) => {
          const errorMessage = error.message || 'Failed to get location';
          setState(prev => ({ ...prev, loading: false, error: errorMessage }));
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  return { ...state, getLocation };
};
