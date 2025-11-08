'use client';

import type { Incident, Pledge } from '@/lib/data';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

interface MapContainerProps {
  incidents: Incident[];
  pledges: Pledge[];
}

// Dynamically import the map component with SSR disabled
const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse"></div>,
});

export default function MapContainer({ incidents, pledges }: MapContainerProps) {
  const [center, setCenter] = useState<[number, number]>([34.0522, -118.2437]); // default center (LA)

  // Get user location on client
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // keep default if denied
        }
      );
    }
  }, []);

  return (
    <div className="h-full w-full">
      <MapComponent center={center} incidents={incidents} pledges={pledges} />
    </div>
  );
}
