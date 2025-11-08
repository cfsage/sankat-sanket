'use client';

import type { Incident, Pledge } from '@/lib/data';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

interface MapContainerProps {
  incidents: Incident[];
  pledges: Pledge[];
}

export default function MapContainer({ incidents, pledges }: MapContainerProps) {
  const MapComponent = useMemo(() => dynamic(() => import('./map-component'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse"></div> 
  }), []);

  return (
    <div className="h-full w-full">
      <MapComponent incidents={incidents} pledges={pledges} />
    </div>
  );
}
