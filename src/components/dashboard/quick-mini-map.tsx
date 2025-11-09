'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { useIncidentsRealtime } from '@/hooks/use-incidents-realtime';

function fixLeafletIcons() {
  delete (L.Icon.Default as any).prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export default function QuickMiniMap() {
  const [center, setCenter] = useState<[number, number]>([27.7172, 85.3240]);
  const [pledgeGeo, setPledgeGeo] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapIdRef = useRef(`quick-mini-${Math.random().toString(36).slice(2,9)}`);
  const { incidents, supabaseReady } = useIncidentsRealtime();

  useEffect(() => {
    fixLeafletIcons();
    try {
      const raw = localStorage.getItem('lastPledgeGeo');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          setPledgeGeo({ latitude: parsed.latitude, longitude: parsed.longitude });
          setCenter([parsed.latitude, parsed.longitude]);
        }
      }
    } catch {}
    return () => {
      const container = document.getElementById(mapIdRef.current) as any;
      if (container && container._leaflet_id) container._leaflet_id = null;
    };
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'unverified': return 'gray';
      case 'verified': return 'blue';
      case 'in_progress': return 'orange';
      case 'resolved': return 'green';
      default: return 'purple';
    }
  };

  return (
    <MapContainer id={mapIdRef.current} center={center} zoom={13} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        url={process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
      />
      {pledgeGeo && (
        <Marker position={[pledgeGeo.latitude, pledgeGeo.longitude]}>
          <Popup>Your pledge location</Popup>
        </Marker>
      )}
      {(supabaseReady ? incidents : []).map((inc) => (
        <CircleMarker
          key={inc.id}
          center={[inc.latitude, inc.longitude]}
          radius={8}
          pathOptions={{ color: statusColor(inc.status) }}
        >
          <Popup>
            <div>
              <strong>{inc.type}</strong>
              {inc.description && <p className="text-xs mt-1">{inc.description}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}