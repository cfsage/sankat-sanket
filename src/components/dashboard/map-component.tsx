'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Incident, Pledge } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistanceToNow } from 'date-fns';

interface MapComponentProps {
  center: [number, number];
  incidents: Incident[];
  pledges: Pledge[];
}

const createLeafletIcon = (type: 'incident' | 'pledge', severity?: 'Low' | 'Medium' | 'High') => {
  const isHighSeverity = type === 'incident' && severity === 'High';
  const pulseAnimationClass = isHighSeverity ? 'pulse-marker' : '';
  const bgColor = type === 'incident' ? 'bg-destructive/80' : 'bg-primary/80';
  const borderColor = type === 'incident' ? 'border-destructive' : 'border-primary';
  const iconSvg = type === 'incident'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;

  const iconHtml = `<div class="h-10 w-10 rounded-full flex items-center justify-center text-white border-4 shadow-lg ${pulseAnimationClass} ${bgColor} ${borderColor}">${iconSvg}</div>`;

  return L.divIcon({
    html: iconHtml,
    className: '', // Important to keep this empty
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const incidentIcon = createLeafletIcon('incident');
const highSeverityIncidentIcon = createLeafletIcon('incident', 'High');
const pledgeIcon = createLeafletIcon('pledge');

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function HydrationSafeTimestamp({ timestamp }: { timestamp: string }) {
  const [timeAgo, setTimeAgo] = useState('...');

  useEffect(() => {
    setTimeAgo(formatDistanceToNow(new Date(timestamp), { addSuffix: true }));
  }, [timestamp]);

  return <>{timeAgo}</>;
}


export default function MapComponent({ center, incidents, pledges }: MapComponentProps) {

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={10}
        className="h-full w-full"
        attributionControl={false}
      >
        <ChangeView center={center} zoom={10} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.location.lat, incident.location.lng]}
            icon={incident.severity === 'High' ? highSeverityIncidentIcon : incidentIcon}
          >
            <Popup maxWidth={350}>
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant={incident.severity === 'High' ? 'destructive' : 'secondary'}>
                      {incident.severity}
                    </Badge>
                    {incident.type} Report
                  </CardTitle>
                  <CardDescription>
                    <HydrationSafeTimestamp timestamp={incident.timestamp} />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm">{incident.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-semibold">Needs:</span>
                    {incident.needs.map((need) => (
                      <Badge key={need} variant="outline">{need}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}

        {pledges.map((pledge) => (
          <Marker
            key={pledge.id}
            position={[pledge.location.lat, pledge.location.lng]}
            icon={pledgeIcon}
          >
            <Popup maxWidth={350}>
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Pledge: {pledge.type}</CardTitle>
                  <CardDescription>From: {pledge.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Offering <span className="font-bold">{pledge.quantity} {pledge.resource}</span>.
                  </p>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
