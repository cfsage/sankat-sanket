"use client";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { incidents as staticIncidents, pledges } from "@/lib/data";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  const [showIncidents, setShowIncidents] = useState(true);
  const [showPledges, setShowPledges] = useState(true);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');
  const [routeTarget, setRouteTarget] = useState<[number, number] | null>(null);
  const [overlayCollapsed, setOverlayCollapsed] = useState(true);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [urgentOnly, setUrgentOnly] = useState<boolean>(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();

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

  // Collapse overlay details by default on small screens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOverlayCollapsed(window.innerWidth < 640);
    }
  }, []);

  const { incidents, loading, error, supabaseReady } = useIncidentsRealtime();

  // Distance util (Haversine)
  function distanceKm(a: [number, number], b: [number, number]) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  }

  // Derived urgency (no explicit severity field yet)
  function isUrgent(inc: { type: any; status: any }) {
    const highTypes = new Set(['Fire', 'Earthquake', 'Flood']);
    return (highTypes.has(inc.type) || inc.status === 'in_progress') && inc.status !== 'resolved';
  }

  // Proximity-based toast alerts: when new incidents appear near the user
  useEffect(() => {
    if (!supabaseReady) return; // only fire for realtime
    if (!incidents || incidents.length === 0) return;

    const seen = seenIdsRef.current;
    const newlySeen: string[] = [];
    for (const inc of incidents) {
      if (!seen.has(inc.id)) {
        // mark so we only consider once per id
        seen.add(inc.id);
        newlySeen.push(inc.id);
        const d = distanceKm(center, [inc.latitude, inc.longitude]);
        if (d <= radiusKm) {
          toast({
            title: `Nearby ${inc.type}`,
            description: `New incident within ${Math.round(d * 10) / 10} km`,
          });
        }
      }
    }
  }, [incidents, center, radiusKm, supabaseReady, toast]);

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
    <div className="relative" style={{ height: '100%', minHeight: '300px', width: '100%' }}>
      {/* Controls & Legend overlay */}
      <div className="absolute left-2 top-2 z-[1000] rounded-md border bg-background/90 backdrop-blur p-2 text-xs shadow w-[calc(100%-1rem)] sm:w-auto max-h-56 sm:max-h-none overflow-y-auto">
        <div className="font-medium mb-1 flex items-center gap-2">
          <span>Layers</span>
          <button className="ml-auto underline" onClick={() => setOverlayCollapsed((v) => !v)}>
            {overlayCollapsed ? 'Show details' : 'Hide details'}
          </button>
        </div>
        <div className="flex items-center gap-3 mb-2 flex-col sm:flex-row sm:items-center">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showIncidents} onChange={(e) => setShowIncidents(e.target.checked)} />
            <span>Incidents</span>
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showPledges} onChange={(e) => setShowPledges(e.target.checked)} />
            <span>Shelters/Services</span>
          </label>
        </div>
        {!overlayCollapsed && (
          <>
            <div className="font-medium mb-1">Warning Radius</div>
            <div className="flex items-center gap-2 mb-2 sm:flex-row">
              <input
                type="number"
                min={1}
                max={50}
                step={1}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-20 border rounded px-1 py-0.5"
              />
              <span>km</span>
            </div>
            <div className="font-medium mb-1">Travel Mode</div>
            <select
              className="w-full border rounded px-1 py-0.5 mb-2"
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value as 'driving' | 'walking')}
            >
              <option value="driving">Driving</option>
              <option value="walking">Walking</option>
            </select>
            <div className="font-medium mb-1">Legend</div>
            <ul className="space-y-1">
              <li className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: 'gray' }}></span> Unverified Incident</li>
              <li className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: 'blue' }}></span> Verified Incident</li>
              <li className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: 'orange' }}></span> In-progress Incident</li>
              <li className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: 'green' }}></span> Resolved Incident</li>
              <li className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-primary"></span> Shelter/Service</li>
            </ul>
            <label className="flex items-center gap-1 mt-2">
              <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} />
              Urgent only
            </label>
          </>
        )}
        {routeTarget && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span>Routing active</span>
            <button className="underline" onClick={() => setRouteTarget(null)}>Clear</button>
          </div>
        )}
      </div>

      <MapContainer
        id={mapIdRef.current}
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className={className}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
      <ChangeView center={center} />
      <LocateUser onLocated={(pos)=>setCenter(pos)} />
      <TileLayer
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        url={process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
      />
      {/* Repositioned zoom controls */}
      <ZoomControl position="topright" />
      {/* User location marker */}
      <Marker position={center}>
        <Popup>You are here</Popup>
      </Marker>

      {/* Supabase incidents (realtime) if configured, else fall back to static */}
      {showIncidents && (supabaseReady ? incidents : staticIncidents.map(si => ({
        id: si.id,
        created_at: new Date().toISOString(),
        reporter_id: null,
        status: 'unverified' as const,
        type: si.type as any,
        description: si.description,
        photo_url: null,
        latitude: si.location.lat,
        longitude: si.location.lng,
      })))
        .filter((inc) => !urgentOnly || isUrgent(inc))
        .map((inc) => (
        <CircleMarker
          key={inc.id}
          center={[inc.latitude, inc.longitude]}
          radius={isUrgent(inc) ? 14 : 10}
          className={isUrgent(inc) ? 'animate-pulse' : undefined}
          pathOptions={{ color: statusColor(inc.status) }}
        >
          <Popup>
            <div>
              <div className="font-medium flex items-center gap-2">
                {inc.type}
                {isUrgent(inc) && <span className="text-xs rounded px-1 bg-destructive text-destructive-foreground">Urgent</span>}
              </div>
              {(inc as any).notify_department && (
                (() => {
                  const raw = (inc as any).notify_department;
                  let arr: string[] | null = null;
                  if (Array.isArray(raw)) arr = raw;
                  else if (typeof raw === 'string') {
                    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) arr = parsed; } catch {}
                    if (!arr) arr = raw.split(',').map((s: string) => s.trim());
                  }
                  return (
                    <div className="text-xs"><span className="text-muted-foreground">Notify:</span> {(arr ?? []).join(', ')}</div>
                  );
                })()
              )}
              {(inc as any).notify_contact && (
                <div className="text-xs"><span className="text-muted-foreground">Contact:</span> {(inc as any).notify_contact}</div>
              )}
              {inc.description && <div className="text-xs text-muted-foreground">{inc.description}</div>}
              <div className="mt-2 space-x-2">
                <a
                  className="text-sm text-primary underline"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${inc.latitude},${inc.longitude}&travelmode=${travelMode}`}
                  target="_blank"
                  rel="noreferrer"
                >Navigate</a>
                <a
                  className="text-sm text-muted-foreground underline"
                  href={`https://www.google.com/maps/search/?api=1&query=${inc.latitude},${inc.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >View on Map</a>
                <button className="text-sm underline" onClick={() => setRouteTarget([inc.latitude, inc.longitude])}>Route Here</button>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {showPledges && pledges.map((plg) => (
        <Marker key={plg.id} position={[plg.location.lat, plg.location.lng]}>
          <Popup>
            <div>
              <strong>{plg.type}</strong>
              <p>
                {plg.resource} – {plg.quantity}
              </p>
              <div className="mt-2 flex gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${plg.location.lat},${plg.location.lng}&travelmode=${travelMode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  Navigate
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${plg.location.lat},${plg.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground underline"
                >
                  View on Map
                </a>
                <button
                  className="text-sm underline"
                  onClick={() => setRouteTarget([plg.location.lat, plg.location.lng])}
                >
                  Route Here
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {routeTarget && (
        <Polyline positions={[center, routeTarget]} pathOptions={{ color: 'blue', weight: 4 }} />
      )}
    </MapContainer>
    </div>
  );
}