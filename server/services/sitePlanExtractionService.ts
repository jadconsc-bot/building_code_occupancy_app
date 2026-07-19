import { z } from 'zod';

export const SitePlanExtractionSchema = z.object({
  parcelAreaM2: z.number().nullable(),
  parcelWidthM: z.number().nullable(),
  parcelDepthM: z.number().nullable(),
  frontSetbackM: z.number().nullable(),
  rearSetbackM: z.number().nullable(),
  sideSetbackLeftM: z.number().nullable(),
  sideSetbackRightM: z.number().nullable(),
  buildingFootprintM2: z.number().nullable(),
  lotCoveragePct: z.number().nullable(),
  mainFloorGeodeticM: z.number().nullable(),
  roofPeakGeodeticM: z.number().nullable(),
  footingGeodeticM: z.number().nullable(),
  hasLane: z.boolean().nullable(),
  parkingStalls: z.number().nullable(),
  parkingSurfaceType: z.string().nullable(),
  northArrowDetected: z.boolean().nullable(),
  municipalAddress: z.string().nullable(),
  detectedScale: z.string().nullable(),
  scaleConfidence: z.number().nullable(),
});

export type SitePlanExtraction = z.infer<typeof SitePlanExtractionSchema>;

export function buildSitePlanPrompts(): { system: string; user: string } {
  return {
    system: `You are analyzing an architectural site plan drawing for
a residential building permit application in Alberta, Canada.
Extract the following information as a JSON object. If a
value cannot be clearly read from the drawing, use null.
Do not guess or estimate.

Return ONLY a valid JSON object with these exact keys:
{
  parcelAreaM2: number | null,
  parcelWidthM: number | null,
  parcelDepthM: number | null,
  frontSetbackM: number | null,
  rearSetbackM: number | null,
  sideSetbackLeftM: number | null,
  sideSetbackRightM: number | null,
  buildingFootprintM2: number | null,
  lotCoveragePct: number | null,
  mainFloorGeodeticM: number | null,
  roofPeakGeodeticM: number | null,
  footingGeodeticM: number | null,
  hasLane: boolean | null,
  parkingStalls: number | null,
  parkingSurfaceType: string | null,
  northArrowDetected: boolean | null,
  municipalAddress: string | null,
  detectedScale: string | null,
  scaleConfidence: number | null
}

No preamble, no explanation, no markdown code fences.`,
    user: `Extract all site plan information from this drawing.
Pay special attention to:
- Dimension strings (numbers with m, mm, ft, or inch units)
- Property line labels and lot dimension callouts
- Setback arrows and dimension lines from building edge
  to property line
- Grade/geodetic elevation callouts (format: XXX.XXm)
- North arrow symbol
- Scale bar or scale notation in title block
- Parking area with stall markings or count
- Lane designation at rear of property
- Municipal address in title block

Required JSON fields: parcelAreaM2, parcelWidthM, parcelDepthM,
frontSetbackM, rearSetbackM, sideSetbackLeftM, sideSetbackRightM,
buildingFootprintM2, lotCoveragePct, mainFloorGeodeticM,
roofPeakGeodeticM, footingGeodeticM, hasLane, parkingStalls,
parkingSurfaceType, northArrowDetected, municipalAddress,
detectedScale, scaleConfidence`,
  };
}

export function deriveLotCoveragePct(
  buildingFootprintM2: number | null,
  parcelAreaM2: number | null,
): number | null {
  if (buildingFootprintM2 === null || parcelAreaM2 === null || parcelAreaM2 <= 0) {
    return null;
  }
  return Math.round((buildingFootprintM2 / parcelAreaM2) * 10_000) / 100;
}
