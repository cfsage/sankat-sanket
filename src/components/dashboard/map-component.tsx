'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Incident, Pledge } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Siren, HandHeart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { renderToStaticMarkup } from 'react-dom/server';

interface MapComponentProps {
  center: [number, number];
  incidents: Incident[];
  pledges: Pledge[];
}

const useLeafletIcon = (type: 'incident' | 'pledge', severity?: 'Low' | 'Medium' | 'High') => {
  return useMemo(() => {
    const isHighSeverity = type === 'incident' && severity === 'High';
    const pulseAnimation = isHighSeverity ? 'animate-pulse' : '';

    const iconMarkup = renderToStaticMarkup(
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center text-white border-4 shadow-lg ${pulseAnimation} 
          ${type === 'incident' ? 'bg-destructive/80 border-destructive' : 'bg-primary/80 border-primary'}`}
      >
        {type === 'incident' ? <Siren className="h-5 w-5" /> : <HandHeart className="h-5 w-5" />}
      </div>
    );

    return L.divIcon({
      html: iconMarkup,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  }, [type, severity]);
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapComponent({ center, incidents, pledges }: MapComponentProps) {
  const [clientNow, setClientNow] = useState<Date | null>(null);

  useEffect(() => {
    setClientNow(new Date());
    const interval = setInterval(() => setClientNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);


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

        {incidents.map((incident) => {
          const icon = useLeafletIcon('incident', incident.severity);

          return (
            <Marker
              key={incident.id}
              position={[incident.location.lat, incident.location.lng]}
              icon={icon}
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
                      {clientNow && formatDistanceToNow(new Date(incident.timestamp), {
                        addSuffix: true,
                        now: clientNow,
                      })}
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
          );
        })}

        {pledges.map((pledge) => {
          const icon = useLeafletIcon('pledge');
          return (
            <Marker
              key={pledge.id}
              position={[pledge.location.lat, pledge.location.lng]}
              icon={icon}
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
          );
        })}
      </MapContainer>
    </div>
  );
}
