'use client';

import { useState } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import type { Incident, Pledge } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import CustomMarker from './custom-marker';

interface MapComponentProps {
  incidents: Incident[];
  pledges: Pledge[];
}

type SelectedItem = (Incident & { itemType: 'incident' }) | (Pledge & { itemType: 'pledge' });

export default function MapComponent({ incidents, pledges }: MapComponentProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const center = { lat: 34.0522, lng: -118.2437 };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <Map
        mapId={'resilient-echo-map'}
        defaultCenter={center}
        defaultZoom={10}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        className="h-full w-full"
      >
        {incidents.map((incident) => (
          <AdvancedMarker
            key={incident.id}
            position={incident.location}
            onClick={() => setSelectedItem({ ...incident, itemType: 'incident' })}
          >
            <CustomMarker type="incident" severity={incident.severity} />
          </AdvancedMarker>
        ))}

        {pledges.map((pledge) => (
          <AdvancedMarker
            key={pledge.id}
            position={pledge.location}
            onClick={() => setSelectedItem({ ...pledge, itemType: 'pledge' })}
          >
             <CustomMarker type="pledge" />
          </AdvancedMarker>
        ))}

        {selectedItem && (
          <InfoWindow
            position={selectedItem.location}
            onCloseClick={() => setSelectedItem(null)}
            maxWidth={350}
          >
            <Card className="border-0 shadow-none">
              {selectedItem.itemType === 'incident' && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Badge variant={selectedItem.severity === 'High' ? 'destructive' : 'secondary'}>
                            {selectedItem.severity}
                        </Badge>
                        {selectedItem.type} Report
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(selectedItem.timestamp), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2 text-sm">{selectedItem.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-semibold">Needs:</span>
                      {selectedItem.needs.map(need => <Badge key={need} variant="outline">{need}</Badge>)}
                    </div>
                  </CardContent>
                </>
              )}
              {selectedItem.itemType === 'pledge' && (
                 <>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Pledge: {selectedItem.type}</CardTitle>
                        <CardDescription>From: {selectedItem.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">
                            Offering <span className="font-bold">{selectedItem.quantity} {selectedItem.resource}</span>.
                        </p>
                    </CardContent>
                 </>
              )}
            </Card>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
