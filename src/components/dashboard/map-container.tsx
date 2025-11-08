'use client';

import type { Incident, Pledge } from '@/lib/data';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

interface MapContainerProps {
  incidents: Incident[];
  pledges: Pledge[];
}

const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse"></div>,
});

export default function MapContainer({ incidents, pledges }: MapContainerProps) {
  const [center, setCenter] = useState<[number, number]>([34.0522, -118.2437]); // Default center

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Keep default center if user denies location
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
