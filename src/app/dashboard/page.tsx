import { HandHeart, Siren, Users } from "lucide-react";
import { incidents, pledges } from "@/lib/data";
import StatCard from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { MapPin } from "lucide-react";

export default function DashboardPage() {
  const mapFallbackImage = PlaceHolderImages.find(p => p.id === "map-fallback");

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
          <CardDescription>The live map is temporarily unavailable. Displaying a static view.</CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-6rem)] pb-0 relative flex items-center justify-center">
            {mapFallbackImage && (
                <Image
                    src={mapFallbackImage.imageUrl}
                    alt={mapFallbackImage.description}
                    fill
                    className="object-cover rounded-md"
                    data-ai-hint={mapFallbackImage.imageHint}
                />
            )}
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-md">
                <div className="text-center p-4 bg-background/80 rounded-lg shadow-lg">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-bold">Live Map Unavailable</h3>
                    <p className="mt-2 text-muted-foreground">The interactive map is currently offline for maintenance.</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
