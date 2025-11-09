import { useEffect, useRef, useState } from 'react';

type Position = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export function useGeolocation(defaultOptions: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const startWatching = (opts?: PositionOptions) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Geolocation unsupported');
      return;
    }
    try {
      const options = { ...defaultOptions, ...(opts || {}) };
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null });
          setError(null);
          setWatching(true);
        },
        (err) => {
          setError(err.message || 'Geolocation error');
        },
        options
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to start geolocation');
    }
  };

  const stopWatching = () => {
    try {
      if (watchIdRef.current != null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    } catch {}
    watchIdRef.current = null;
    setWatching(false);
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      try {
        if (watchIdRef.current != null && 'geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      } catch {}
    };
  }, []);

  return { position, error, watching, startWatching, stopWatching };
}