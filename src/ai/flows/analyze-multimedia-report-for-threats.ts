'use server';
/**
 * @fileOverview Analyzes multimedia reports (photo and audio) to detect climate threats and extract needs.
 *
 * - analyzeMultimediaReport - A function that analyzes multimedia reports.
 * - AnalyzeMultimediaReportInput - The input type for the analyzeMultimediaReport function.
 * - AnalyzeMultimediaReportOutput - The return type for the analyzeMultimediaReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMultimediaReportInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo related to the climate event, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  audioDataUri: z
    .string()
    .optional()
    .describe(
      'Audio data related to the climate event, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  textDescription: z.string().optional().describe('Optional text description of the event.'),
  geolocation: z
    .object({
      latitude: z.number().describe('Latitude of the event location.'),
      longitude: z.number().describe('Longitude of the event location.'),
    })
    .optional()
    .describe('Geolocation of the event.'),
});
export type AnalyzeMultimediaReportInput = z.infer<typeof AnalyzeMultimediaReportInputSchema>;

const AnalyzeMultimediaReportOutputSchema = z.object({
  threats: z
    .array(z.string())
    .describe('List of detected climate threats (e.g., flood, fire, storm).'),
  needs: z.array(z.string()).describe('List of identified needs (e.g., food, shelter, evacuation).'),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score (0-1) of the analysis.'),
});
export type AnalyzeMultimediaReportOutput = z.infer<typeof AnalyzeMultimediaReportOutputSchema>;

export async function analyzeMultimediaReport(
  input: AnalyzeMultimediaReportInput
): Promise<AnalyzeMultimediaReportOutput> {
  return analyzeMultimediaReportFlow(input);
}

const analyzeMultimediaReportPrompt = ai.definePrompt({
  name: 'analyzeMultimediaReportPrompt',
  input: {schema: AnalyzeMultimediaReportInputSchema},
  output: {schema: AnalyzeMultimediaReportOutputSchema},
  prompt: `You are an AI assistant designed to analyze multimedia reports of climate events and extract relevant information.

  Analyze the following report to identify potential climate threats and essential needs.
  Include a confidence score reflecting the certainty of your analysis.

  Photo: {{media url=photoDataUri}}
  {{#if audioDataUri}}
  Audio: {{media url=audioDataUri}}
  {{/if}}
  {{#if textDescription}}
  Description: {{{textDescription}}}
  {{/if}}
  {{#if geolocation}}
  Geolocation: Latitude: {{{geolocation.latitude}}}, Longitude: {{{geolocation.longitude}}}
  {{/if}}

  Output the threats, needs, and confidence score in JSON format.
  `,
});

const analyzeMultimediaReportFlow = ai.defineFlow(
  {
    name: 'analyzeMultimediaReportFlow',
    inputSchema: AnalyzeMultimediaReportInputSchema,
    outputSchema: AnalyzeMultimediaReportOutputSchema,
  },
  async input => {
    const {output} = await analyzeMultimediaReportPrompt(input);
    return output!;
  }
);
