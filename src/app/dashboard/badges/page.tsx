import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, HandHeart, HeartHandshake, ShieldCheck, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const badges = [
    { name: "First Pledge", icon: HandHeart, description: "Made your first resource pledge.", unlocked: true },
    { name: "Community Helper", icon: HeartHandshake, description: "Completed your first matched request.", unlocked: true },
    { name: "Echo Starter", icon: Award, description: "Sent your first verified report.", unlocked: true },
    { name: "Resilience Champion", icon: ShieldCheck, description: "Fulfilled 5 aid requests.", unlocked: false },
    { name: "Network Guardian", icon: Star, description: "Reported 10 valid incidents.", unlocked: false },
    { name: "Rapid Responder", icon: Award, description: "Pledged resources within 1 hour of a new incident.", unlocked: false },
]

export default function BadgesPage() {
    return (
        <div className="flex justify-center items-start">
            <Card className="w-full max-w-4xl shadow-lg">
                <CardHeader>
                <CardTitle>My Badges</CardTitle>
                <CardDescription>
                    Your contributions strengthen our community. Here are the badges you've earned.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <TooltipProvider>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-center">
                            {badges.map((badge) => (
                                <Tooltip key={badge.name}>
                                    <TooltipTrigger asChild>
                                        <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-opacity ${badge.unlocked ? 'opacity-100 bg-card' : 'opacity-40 bg-muted'}`}>
                                            <div className={`h-20 w-20 rounded-full flex items-center justify-center transition-colors ${badge.unlocked ? 'bg-accent/20 text-accent' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                                <badge.icon className="h-10 w-10" />
                                            </div>
                                            <h4 className="font-semibold text-sm">{badge.name}</h4>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{badge.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </TooltipProvider>
                </CardContent>
            </Card>
        </div>
    )
}
