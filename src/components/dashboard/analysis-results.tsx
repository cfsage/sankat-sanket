import type { AnalysisResultData } from './report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Flag, Send, ShieldCheck, ThumbsUp, UserCheck } from 'lucide-react';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface AnalysisResultsProps {
  result: AnalysisResultData;
  onReset: () => void;
}

export default function AnalysisResults({ result, onReset }: AnalysisResultsProps) {
  const { analysis, matches } = result;

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 text-2xl font-bold">Analysis Complete & Verified</h2>
        <p className="mt-1 text-muted-foreground">The AI has processed the report and found potential aid matches.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Incident Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-sm mb-2">Detected Threats</h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.threats.length > 0 ? analysis.threats.map((threat) => (
                            <Badge key={threat} variant="destructive">{threat}</Badge>
                        )) : <Badge variant="secondary">None Detected</Badge>}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-sm mb-2">Identified Needs</h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.needs.length > 0 ? analysis.needs.map((need) => (
                            <Badge key={need} variant="default" className="bg-accent text-accent-foreground hover:bg-accent/80">{need}</Badge>
                        )) : <Badge variant="secondary">None Detected</Badge>}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-sm mb-2">Analysis Confidence</h4>
                    <div className="flex items-center gap-4">
                        <Progress value={analysis.confidenceScore * 100} className="flex-1" />
                        <span className="font-mono text-sm font-semibold">{Math.round(analysis.confidenceScore * 100)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Recommended Aid Matches</CardTitle>
                <CardDescription>AI-suggested volunteers and resources nearby.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                {matches.matches.length > 0 ? (
                    <ScrollArea className="flex-1 -mx-6">
                        <div className="px-6 space-y-4">
                        {matches.matches.map((match) => (
                            <div key={match.pledgeId} className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50">
                                <div className="bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{match.resourceType}: {match.quantity} units</p>
                                    <p className="text-sm text-muted-foreground">Contact: {match.volunteerContact}</p>
                                    <p className="text-xs text-muted-foreground">~{match.distance.toFixed(1)}km away | Urgency: {match.urgencyScore.toFixed(2)}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                     <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                        <ThumbsUp className="h-4 w-4" />
                                        <span className="sr-only">Accept Match</span>
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                                        <Flag className="h-4 w-4" />
                                        <span className="sr-only">Flag as incorrect</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center bg-muted rounded-lg p-6">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="mt-4 font-semibold">No Automatic Matches Found</p>
                        <p className="text-sm text-muted-foreground">The report has been queued for manual review by coordinators.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">This report will be sent to nearby residents, volunteers, and authorities.</p>
        <div className="flex gap-4">
            <Button variant="outline" onClick={onReset}>Create New Report</Button>
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Send className="mr-2 h-4 w-4" />
                Confirm and Broadcast Alerts
            </Button>
        </div>
      </div>
    </div>
  );
}
