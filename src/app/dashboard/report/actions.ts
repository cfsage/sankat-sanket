'use server';

import { analyzeMultimediaReport, AnalyzeMultimediaReportInput, AnalyzeMultimediaReportOutput } from '@/ai/flows/analyze-multimedia-report-for-threats';
import { autoMatchVolunteerPledgesToVerifiedNeeds, AutoMatchOutput } from '@/ai/flows/auto-match-volunteer-pledges-to-verified-needs';

type ReportAnalysisResult = {
    analysis: AnalyzeMultimediaReportOutput;
    matches: AutoMatchOutput;
    error?: string;
}

export async function handleReportAnalysis(input: AnalyzeMultimediaReportInput): Promise<ReportAnalysisResult> {
    try {
        // 1. Analyze the multimedia report to identify threats and needs.
        const analysis = await analyzeMultimediaReport(input);

        if (!analysis?.needs?.length) {
             return { analysis, matches: { matches: [], confidenceScore: 0 }, error: "AI could not identify specific needs from the report. Please add a more detailed description."};
        }

        // 2. Use the identified needs to find matching volunteer pledges.
        const matches = await autoMatchVolunteerPledgesToVerifiedNeeds({
            reportId: `report-1720000000000`, // Using a static ID to prevent hydration issues
            reportType: analysis.threats[0] || 'Unknown',
            latitude: input.geolocation?.latitude || 0,
            longitude: input.geolocation?.longitude || 0,
            needs: analysis.needs,
        });

        return { analysis, matches };

    } catch (e: any) {
        console.error("Error in report analysis flow:", e);
        return { 
            analysis: { threats: [], needs: [], confidenceScore: 0 },
            matches: { matches: [], confidenceScore: 0 },
            error: e.message || 'An unexpected error occurred during AI analysis.'
        };
    }
}
