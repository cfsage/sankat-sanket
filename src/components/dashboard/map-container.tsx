'use client';

import type { Incident, Pledge } from '@/lib/data';
import { useEffect, useState } from 'react';
import { ClientOnly } from '../client-only';
import MapComponent from './map-component';

interface MapContainerProps {
  incidents: Incident[];
  pledges: Pledge[];
}

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
      <ClientOnly>
        <MapComponent center={center} incidents={incidents} pledges={pledges} />
      </ClientOnly>
    </div>
  );
}
