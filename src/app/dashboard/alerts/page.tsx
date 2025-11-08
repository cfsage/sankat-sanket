'use client';

import { alerts } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Siren, HandHeart, Wind } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const iconMap = {
  Flood: <Siren className="h-5 w-5" />,
  Fire: <Siren className="h-5 w-5" />,
  Storm: <Wind className="h-5 w-5" />,
  Default: <Bell className="h-5 w-5" />,
};

const colorMap: { [key: string]: string } = {
    Flood: 'bg-blue-500',
    Fire: 'bg-red-500',
    Storm: 'bg-gray-500',
    Default: 'bg-primary'
}

export default function AlertsPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex justify-center items-start">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Recent alerts and updates from the Resilient Echo network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border relative",
                  !alert.read && 'bg-card'
                  )}>
                {!alert.read && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-accent"></span>}
                <div className={cn(
                    "h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-white",
                     colorMap[alert.type] || colorMap.Default
                )}>
                  {iconMap[alert.type as keyof typeof iconMap] || iconMap.Default}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-xs text-muted-foreground">
                            {isClient ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : ''}
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
