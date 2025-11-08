
'use client';

import { HandHeart, Siren, Users } from "lucide-react";
import { incidents, pledges } from "@/lib/data";
import StatCard from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const MapComponent = dynamic(() => import('@/components/dashboard/map-component'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export default function DashboardPage() {

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Active Incidents"
          value={incidents.length.toString()}
          icon={<Siren className="h-5 w-5 text-destructive" />}
          description="High-severity events"
        />
        <StatCard
          title="Available Pledges"
          value={pledges.length.toString()}
          icon={<HandHeart className="h-5 w-5 text-primary" />}
          description="Ready to be matched"
        />
        <StatCard
          title="Engaged Volunteers"
          value="350+"
          icon={<Users className="h-5 w-5 text-accent-foreground" />}
          description="Individuals and organizations"
          className="bg-accent text-accent-foreground"
        />
      </div>
      <Card className="flex-1 min-h-[500px] lg:min-h-0">
        <CardHeader>
          <CardTitle>Live Threat & Resource Map</CardTitle>
          <CardDescription>Real-time view of incidents and available aid.</CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-6rem)] pb-0">
          <MapComponent
            center={[34.0522, -118.2437]}
            incidents={incidents}
            pledges={pledges}
          />
        </CardContent>
      </Card>
    </div>
  );
}
