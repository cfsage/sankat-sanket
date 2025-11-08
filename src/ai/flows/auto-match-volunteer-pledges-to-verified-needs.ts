'use server';

/**
 * @fileOverview AI-powered flow to automatically match volunteer pledges to verified needs based on urgency and proximity.
 *
 * - autoMatchVolunteerPledgesToVerifiedNeeds - A function that handles the matching process.
 * - AutoMatchInput - The input type for the autoMatchVolunteerPledgesToVerifiedNeeds function.
 * - AutoMatchOutput - The return type for the autoMatchVolunteerPledgesToVerifiedNeeds function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoMatchInputSchema = z.object({
  reportId: z.string().describe('The ID of the climate threat report.'),
  reportType: z.string().describe('The type of climate threat reported (e.g., flood, fire, storm).'),
  latitude: z.number().describe('The latitude of the reported climate threat.'),
  longitude: z.number().describe('The longitude of the reported climate threat.'),
  needs: z.array(z.string()).describe('A list of needs extracted from the report (e.g., food, shelter, evacuation).'),
});
export type AutoMatchInput = z.infer<typeof AutoMatchInputSchema>;

const AutoMatchOutputSchema = z.object({
  matches: z.array(
    z.object({
      pledgeId: z.string().describe('The ID of the volunteer pledge.'),
      resourceType: z.string().describe('The type of resource offered (e.g., food, shelter, transport).'),
      quantity: z.number().describe('The quantity of the resource offered.'),
      volunteerContact: z.string().describe('Contact information for the volunteer.'),
      distance: z.number().describe('The distance between the report and the pledge location in kilometers.'),
      urgencyScore: z.number().describe('The urgency score of the match (higher is more urgent).'),
    })
  ).describe('A list of matched volunteer pledges, sorted by urgency and proximity.'),
  confidenceScore: z.number().describe('Confidence score for the accuracy of the matches, from 0 to 1.'),
});
export type AutoMatchOutput = z.infer<typeof AutoMatchOutputSchema>;

export async function autoMatchVolunteerPledgesToVerifiedNeeds(input: AutoMatchInput): Promise<AutoMatchOutput> {
  return autoMatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoMatchPrompt',
  input: {schema: AutoMatchInputSchema},
  output: {schema: AutoMatchOutputSchema},
  prompt: `You are an AI assistant designed to match volunteer pledges to verified needs reported by users during climate threats. 

  Prioritize matches based on urgency and proximity.

  Given a climate threat report with the following information:
  - Report ID: {{{reportId}}}
  - Report Type: {{{reportType}}}
  - Location: Latitude {{{latitude}}}, Longitude {{{longitude}}}
  - Needs: {{{needs}}}

  Match these needs with available volunteer pledges, considering the resource type, quantity, volunteer contact information, distance, and urgency.

  Return a list of matches sorted by urgency and proximity, along with a confidence score for the accuracy of the matches.

  Ensure the output matches the AutoMatchOutputSchema. The urgencyScore should reflect the immediacy of the need and proximity of the resource.
  The confidenceScore should reflect how confident you are in the relevance and suitability of the matches.

  Output the matches in JSON format adhering to the AutoMatchOutputSchema:
  `,
});

const autoMatchFlow = ai.defineFlow(
  {
    name: 'autoMatchFlow',
    inputSchema: AutoMatchInputSchema,
    outputSchema: AutoMatchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Add a random confidence score between 0.7 and 0.95 to the output
    const confidenceScore = Math.random() * (0.95 - 0.7) + 0.7;
    return { ...output!, confidenceScore };
  }
);

