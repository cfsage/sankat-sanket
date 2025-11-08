'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import MapComponent from './map-component';
import type { Incident, Pledge } from '@/lib/data';
import { Card, CardContent } from '../ui/card';
import { TriangleAlert } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface MapContainerProps {
  incidents: Incident[];
  pledges: Pledge[];
}

export default function MapContainer({ incidents, pledges }: MapContainerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapFallbackImage = PlaceHolderImages.find(p => p.id === 'map-fallback');

  if (!apiKey) {
    return (
      <div className="relative h-full w-full rounded-lg overflow-hidden border border-dashed border-destructive">
        {mapFallbackImage && (
            <Image 
                src={mapFallbackImage.imageUrl}
                alt={mapFallbackImage.description}
                fill
                className="object-cover opacity-20"
                data-ai-hint={mapFallbackImage.imageHint}
            />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Card className="max-w-md bg-background/90 text-center shadow-2xl">
            <CardContent className="p-6">
                <TriangleAlert className="mx-auto h-12 w-12 text-destructive" />
                <h3 className="mt-4 text-lg font-semibold">Map Service Not Configured</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                To enable the interactive map, please provide a Google Maps API key. Create a <code className="font-code rounded bg-muted px-1 py-0.5">.env.local</code> file in the root directory and add the following line:
                </p>
                <pre className="mt-4 rounded-md bg-muted p-4 text-left font-code text-sm">
                <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_API_KEY_HERE"</code>
                </pre>
            </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapComponent incidents={incidents} pledges={pledges} />
    </APIProvider>
  );
}
