'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
  initialCenter?: LatLngExpression;
  onChange: (coords: { latitude: number; longitude: number }) => void;
};

// Fix default marker icons for Leaflet in bundlers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
});
L.Marker.prototype.options.icon = DefaultIcon;

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ initialCenter, onChange }: Props) {
  const [center, setCenter] = useState<LatLngExpression>(initialCenter ?? [20.0, 0.0]);
  const [marker, setMarker] = useState<LatLngExpression | null>(null);
  const tilesUrl = process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = [pos.coords.latitude, pos.coords.longitude] as LatLngExpression;
          setCenter(next);
          setMarker(next);
          onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          // keep default center
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (lat: number, lng: number) => {
    setMarker([lat, lng]);
    onChange({ latitude: lat, longitude: lng });
  };

  return (
    <div className="w-full h-64 rounded-md overflow-hidden border">
      <MapContainer center={center} zoom={13} className="w-full h-full">
        <TileLayer url={tilesUrl} attribution="&copy; OpenStreetMap contributors" />
        <ClickHandler onClick={handleClick} />
        {marker && <Marker position={marker} />} 
      </MapContainer>
    </div>
  );
}