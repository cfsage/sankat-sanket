"use client";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { incidents as staticIncidents, pledges } from "@/lib/data";
import { useEffect, useRef, useState } from "react";
import { useMapEvents } from "react-leaflet";
import { useIncidentsRealtime } from "@/hooks/use-incidents-realtime";

interface LiveMapProps {
  className?: string;
}

// Fix default icon paths for Leaflet when using with Next.js
function fixLeafletIcons() {
  delete (L.Icon.Default as any).prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Helper component to change map view when center updates
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

// Component that asks the map to locate the user using Leaflet's built-in locate method
function LocateUser({ onLocated }: { onLocated: (latlng: [number, number]) => void }) {
  useMapEvents({
    locationfound(e) {
      const { latlng } = e;
      onLocated([latlng.lat, latlng.lng]);
    },
  });

  // Trigger locate once on mount
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: true, enableHighAccuracy: true });
    // no cleanup needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function LiveMap({ className }: LiveMapProps) {
  // generate stable id
  const mapIdRef = useRef(`map-${Math.random().toString(36).slice(2, 9)}`);

  const defaultCenter: [number, number] = [27.7172, 85.3240]; // Kathmandu fallback
  const [center, setCenter] = useState<[number, number]>(defaultCenter);

  useEffect(() => {
    fixLeafletIcons();

    // Ask for user geolocation on mount (only in browser)
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCenter([latitude, longitude]);
        },
        () => {
          /* user denied or unavailable – keep default center */
        },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );
    }

    return () => {
      const container = document.getElementById(mapIdRef.current) as any;
      if (container && container._leaflet_id) {
        container._leaflet_id = null;
      }
    };
  }, []);

  const { incidents, loading, error, supabaseReady } = useIncidentsRealtime();

  const statusColor = (status: string) => {
    switch (status) {
      case 'unverified':
        return 'gray';
      case 'verified':
        return 'blue';
      case 'in_progress':
        return 'orange';
      case 'resolved':
        return 'green';
      default:
        return 'purple';
    }
  };

  return (
    <MapContainer
      id={mapIdRef.current}
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      className={className}
    >
      <ChangeView center={center} />
      <LocateUser onLocated={(pos)=>setCenter(pos)} />
      <TileLayer
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        url={process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
      />
      {/* User location marker */}
      <Marker position={center}>
        <Popup>You are here</Popup>
      </Marker>

      {/* Supabase incidents (realtime) if configured, else fall back to static */}
      {(supabaseReady ? incidents : staticIncidents.map(si => ({
        id: si.id,
        created_at: new Date().toISOString(),
        reporter_id: null,
        status: 'unverified' as const,
        type: si.type as any,
        description: si.description,
        photo_url: null,
        latitude: si.location.lat,
        longitude: si.location.lng,
      }))).map((inc) => (
        <CircleMarker
          key={inc.id}
          center={[inc.latitude, inc.longitude]}
          radius={10}
          pathOptions={{ color: statusColor(inc.status) }}
        >
          <Popup>
            <div>
              <strong>{inc.type}</strong>
              {inc.description && <p>{inc.description}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {pledges.map((plg) => (
        <Marker key={plg.id} position={[plg.location.lat, plg.location.lng]}>
          <Popup>
            <div>
              <strong>{plg.type}</strong>
              <p>
                {plg.resource} – {plg.quantity}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}