import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { callAnthropicText } from '../services/anthropicTextService';
import { determineBuildingPart } from '../engine/buildingPartDetermination';

const SYSTEM_PROMPT = `You are a Canadian building code expert specializing in NBC occupancy classification. Your role is to SUGGEST occupancy candidates only — never make final determinations. A licensed professional must confirm all classifications.

Given a building description, suggest the top 3 most likely NBC occupancy groups from this list ONLY:
A-1 (Assembly - Performing Arts), A-2 (Assembly - General),
A-3 (Assembly - Arena), A-4 (Assembly - Open Air),
B-1 (Institutional - Detention), B-2 (Institutional - Treatment),
B-3 (Institutional - Care), C (Residential),
D (Business & Personal Services), E (Mercantile),
F-1 (Industrial - High Hazard), F-2 (Industrial - Medium Hazard),
F-3 (Industrial - Low Hazard)

Return ONLY valid JSON with no markdown fencing. The JSON must match this exact structure:
{
  "candidates": [
    {
      "code": string,
      "name": string,
      "confidence": number,
      "reasoning": string,
      "keyFactors": string[]
    }
  ],
  "mixedUseFlags": string[],
  "ambiguityNotes": string,
  "defaultToMoreRestrictive": boolean
}`;

const candidateSchema = z.object({
  code: z.string(),
  name: z.string(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  keyFactors: z.array(z.string()),
});

const classifyResponseSchema = z.object({
  candidates: z.array(candidateSchema),
  mixedUseFlags: z.array(z.string()),
  ambiguityNotes: z.string(),
  defaultToMoreRestrictive: z.boolean(),
});

function scoreOccupancyCandidate(code: string, area: number, footprintM2: number | null, storeys: number, province: string) {
  const warnings: string[] = [];
  const nbcRefs = new Set<string>(['NBC 3.1.2', 'NBC 3.2.2']);

  // Part 3 / Part 9 determination
  const determination = determineBuildingPart({ footprintM2, storeys, occupancyGroup: code });
  const part3Required = determination.determination === 'Part 3';

  // Sprinkler requirements
  let sprinklersRequired = false;
  if (code.startsWith('A') || code.startsWith('B')) {
    sprinklersRequired = true;
    nbcRefs.add('NBC 3.2.5.9');
  }
  if (code === 'F-1') {
    sprinklersRequired = true;
    nbcRefs.add('NBC 3.2.5.9');
  }
  if (part3Required && (area > 1200 || storeys > 3)) {
    sprinklersRequired = true;
    nbcRefs.add('NBC 3.2.5.10');
  }
  if (storeys > 6) {
    sprinklersRequired = true;
    warnings.push('High-rise provisions apply — verify NBC Section 3.2.6');
    nbcRefs.add('NBC 3.2.6');
  }

  const constructionRecommendation = part3Required
    ? 'Non-combustible construction typically required (NBC Table 3.2.2.7)'
    : 'Combustible construction may be acceptable (verify NBC Table 3.2.2.7)';

  let ruleScore = 75;

  if (code.startsWith('B') && !part3Required) {
    warnings.push('Institutional occupancies (Group B) typically require Part 3 treatment');
    ruleScore -= 15;
    nbcRefs.add('NBC 3.3.3');
  }
  if (code === 'A-4' && storeys > 1) {
    warnings.push('Open air assembly (A-4) is typically single storey');
    ruleScore -= 20;
  }
  if (code === 'F-1' && storeys > 3) {
    warnings.push('High-hazard industrial (F-1) above 3 storeys is unusual');
    ruleScore -= 25;
    nbcRefs.add('NBC 3.2.6');
  }
  if (code.startsWith('A') && area < 50) {
    warnings.push('Very small area for assembly occupancy — verify classification');
    ruleScore -= 20;
  }
  if (sprinklersRequired) {
    warnings.push('Sprinkler system required — coordinate with mechanical design early');
  }
  if (province === 'AB' && code.startsWith('B')) {
    warnings.push('Alberta Building Code has stricter requirements for Group B occupancies');
    nbcRefs.add('ABC 3.3.3');
  }
  nbcRefs.add(part3Required ? 'NBC Part 3' : 'NBC Part 9');

  return {
    code,
    ruleScore: Math.max(0, Math.min(100, ruleScore)),
    sprinklersRequired,
    constructionRecommendation,
    part3Required,
    warnings: [...new Set(warnings)],
    nbcReferences: [...nbcRefs],
  };
}

export const occupancyAdvisorRouter = router({
  determinePart: protectedProcedure
    .input(z.object({
      footprintM2: z.number().finite().nonnegative().nullable(),
      storeys: z.number().int().positive().nullable(),
      occupancyGroup: z.string().trim().nullable(),
    }))
    .query(({ input }) => determineBuildingPart(input)),

  classify: protectedProcedure
    .input(z.object({
      buildingDescription: z.string().min(1),
      primaryUse: z.string(),
      activities: z.array(z.string()),
      occupantBehavior: z.string(),
      hazardLevel: z.string(),
      estimatedArea: z.number(),
      storeys: z.number(),
      isMixedUse: z.boolean(),
      mixedUseZones: z.array(z.object({ use: z.string(), area: z.number() })).optional(),
      province: z.string(),
    }))
    .mutation(async ({ input }) => {
      const userPrompt = [
        `Building Description: ${input.buildingDescription}`,
        `Primary Use: ${input.primaryUse}`,
        `Activities: ${input.activities.join(', ') || 'Not specified'}`,
        `Occupant Behavior: ${input.occupantBehavior}`,
        `Hazard Level: ${input.hazardLevel}`,
        `Estimated Area: ${input.estimatedArea} m²`,
        `Number of Storeys: ${input.storeys}`,
        `Mixed Use: ${input.isMixedUse}`,
        input.mixedUseZones ? `Mixed Use Zones: ${JSON.stringify(input.mixedUseZones)}` : '',
        `Province: ${input.province || 'Not specified'}`,
      ].filter(Boolean).join('\n');

      const { text, modelVersion } = await callAnthropicText({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: 1000,
      });

      let parsed: z.infer<typeof classifyResponseSchema>;
      try {
        const stripped = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        parsed = classifyResponseSchema.parse(JSON.parse(stripped));
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse AI response. Please try again.',
        });
      }

      const candidates = parsed.candidates
        .sort((a: any, b: any) => b.confidence - a.confidence)
        .slice(0, 3);

      return { ...parsed, candidates, modelVersion };
    }),

  scoreCandidate: protectedProcedure
    .input(z.object({
      code: z.string(),
      area: z.number(),
      footprintM2: z.number().nonnegative().nullable(),
      storeys: z.number(),
      province: z.string(),
    }))
    .mutation(({ input }) => {
    return scoreOccupancyCandidate(input.code, input.area, input.footprintM2, input.storeys, input.province);
    }),
});
