"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, HandHeart, HeartHandshake, ShieldCheck, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import React from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

// Base badges without dynamic unlock flags (descriptions kept for tooltips)
const baseBadges = [
  { name: "First Pledge", icon: HandHeart, imageSrc: "/badges/first-pledge.svg", description: "Made your first resource pledge." },
  { name: "Community Helper", icon: HeartHandshake, imageSrc: "/badges/community-helper.svg", description: "Completed your first matched request." },
  { name: "Echo Starter", icon: Award, imageSrc: "/badges/echo-starter.svg", description: "Sent your first verified report." },
  { name: "Resilience Champion", icon: ShieldCheck, imageSrc: "/badges/resilience-champion.svg", description: "Fulfilled 5 aid requests." },
  { name: "Network Guardian", icon: Star, imageSrc: "/badges/network-guardian.svg", description: "Reported 10 valid incidents." },
  { name: "Rapid Responder", icon: Award, imageSrc: "/badges/rapid-responder.svg", description: "Pledged resources within 1 hour of a new incident." },
];

export default function BadgesPage() {
    const [pledgesCount, setPledgesCount] = React.useState<number | null>(null);
    const [verifiedIncidentsCount, setVerifiedIncidentsCount] = React.useState<number | null>(null);
    const [rapidResponder, setRapidResponder] = React.useState<boolean>(false);
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
        const load = async () => {
            if (!isSupabaseConfigured()) {
                setReady(true);
                return;
            }
            const supabase = getSupabaseClient();
            const { data } = await supabase.auth.getUser();
            const uid = data?.user?.id;
            if (!uid) {
                setReady(true);
                return;
            }
            const { count, error } = await supabase
                .from('pledges')
                .select('id', { count: 'exact', head: true })
                .eq('pledger_id', uid);
            if (error) {
                console.warn('Failed to load pledges count for badges:', error.message);
            }
            setPledgesCount(typeof count === 'number' ? count : 0);

            // Count verified incidents reported by the user
            const { count: verifiedCount, error: incidentsErr } = await supabase
                .from('incidents')
                .select('id', { count: 'exact', head: true })
                .eq('reporter_id', uid)
                .eq('status', 'verified');
            if (incidentsErr) {
                console.warn('Failed to load verified incidents count:', incidentsErr.message);
            }
            setVerifiedIncidentsCount(typeof verifiedCount === 'number' ? verifiedCount : 0);

            // Rapid Responder: any pledge within 60 minutes of an incident creation
            const { data: recentIncidents } = await supabase
                .from('incidents')
                .select('id, created_at')
                .order('created_at', { ascending: false })
                .limit(50);
            const { data: myPledges } = await supabase
                .from('pledges')
                .select('id, created_at')
                .eq('pledger_id', uid)
                .order('created_at', { ascending: false })
                .limit(50);
            if (recentIncidents && myPledges) {
                const incidentsTimes = recentIncidents.map(i => new Date(i.created_at).getTime());
                const oneHourMs = 60 * 60 * 1000;
                const unlocked = myPledges.some(p => {
                    const pt = new Date(p.created_at).getTime();
                    return incidentsTimes.some(it => pt >= it && (pt - it) <= oneHourMs);
                });
                setRapidResponder(unlocked);
            }
            setReady(true);
        };
        load();
    }, []);

    const computeUnlocked = (name: string) => {
        // If we don't have counts yet, keep conservative defaults (locked)
        const pledges = pledgesCount ?? 0;
        const verified = verifiedIncidentsCount ?? 0;
        switch (name) {
            case 'First Pledge':
                return pledges >= 1;
            case 'Community Helper':
                // Placeholder: use pledge milestones until request matching is implemented
                return pledges >= 5;
            case 'Resilience Champion':
                // Placeholder: higher pledge milestone
                return pledges >= 10;
            case 'Rapid Responder':
                return rapidResponder;
            case 'Echo Starter':
                return verified >= 1;
            case 'Network Guardian':
                return verified >= 10;
            default:
                return false;
        }
    };

    const badges = baseBadges.map(b => ({ ...b, unlocked: computeUnlocked(b.name) }));

    const progressText = (name: string, unlocked: boolean) => {
        if (unlocked) return 'Achieved';
        const pledges = pledgesCount ?? 0;
        const verified = verifiedIncidentsCount ?? 0;
        switch (name) {
            case 'First Pledge':
                return `${pledges}/1`;
            case 'Community Helper':
                return `${pledges}/5`;
            case 'Resilience Champion':
                return `${pledges}/10`;
            case 'Echo Starter':
                return `${verified}/1`;
            case 'Network Guardian':
                return `${verified}/10`;
            case 'Rapid Responder':
                return `0/1`;
            default:
                return '';
        }
    };
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-center">
                            {badges.map((badge) => (
                                <Tooltip key={badge.name}>
                                    <TooltipTrigger asChild>
                                        <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-opacity ${badge.unlocked ? 'opacity-100 bg-card' : 'opacity-40 bg-muted'}`}>
                                            <div className={`h-20 w-20 rounded-full flex items-center justify-center overflow-hidden transition-colors ${badge.unlocked ? 'bg-accent/20 text-accent' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                                {badge.imageSrc ? (
                                                  <Image src={badge.imageSrc} alt={badge.name} width={56} height={56} priority />
                                                ) : (
                                                  <badge.icon className="h-10 w-10" />
                                                )}
                                            </div>
                                            <h4 className="font-semibold text-sm">{badge.name}</h4>
                                            <p className="text-xs text-muted-foreground">{progressText(badge.name, badge.unlocked)}</p>
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
