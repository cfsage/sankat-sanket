'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';

function fixLeafletIcons() {
  delete (L.Icon.Default as any).prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export default function TaskMiniMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [center, setCenter] = useState<[number, number]>([latitude, longitude]);
  const mapIdRef = useRef(`mini-${Math.random().toString(36).slice(2,9)}`);

  useEffect(() => {
    fixLeafletIcons();
    return () => {
      const container = document.getElementById(mapIdRef.current) as any;
      if (container && container._leaflet_id) container._leaflet_id = null;
    };
  }, []);

  useEffect(() => {
    setCenter([latitude, longitude]);
  }, [latitude, longitude]);

  return (
    <MapContainer id={mapIdRef.current} center={center} zoom={14} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        url={process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
      />
      <Marker position={center}>
        <Popup>Incident location</Popup>
      </Marker>
    </MapContainer>
  );
}