/**
 * NBC Table 3.1.3.4 — Required Fire Resistance Rating between occupancy groups.
 * Rows = occupancy A side, columns = occupancy B side.
 * Values are in hours (0 = no separation required).
 */

const FRR_TABLE: Record<string, Record<string, number>> = {
  "A":   { "A":0,   "B":2,   "C":1,   "D":1,   "E":1,   "F":2 },
  "B":   { "A":2,   "B":0,   "C":2,   "D":2,   "E":2,   "F":2 },
  "C":   { "A":1,   "B":2,   "C":0.5, "D":1,   "E":1,   "F":2 },
  "D":   { "A":1,   "B":2,   "C":1,   "D":0,   "E":1,   "F":2 },
  "E":   { "A":1,   "B":2,   "C":1,   "D":1,   "E":0,   "F":2 },
  "F":   { "A":2,   "B":2,   "C":2,   "D":2,   "E":2,   "F":1 },
};

function normalizeGroup(occ: string): string {
  return occ.split("-")[0].toUpperCase();
}

export function getRequiredFRR(occupancyA: string, occupancyB: string): number {
  const a = normalizeGroup(occupancyA);
  const b = normalizeGroup(occupancyB);
  return FRR_TABLE[a]?.[b] ?? 0;
}

export type RemediationItem = {
  code: string;
  description: string;
  urgency: "immediate" | "required" | "advisory";
};

export function computeRemediation(
  frrDrawn: number,
  frrRequired: number,
  occupancyA: string,
  occupancyB: string,
): RemediationItem[] {
  const items: RemediationItem[] = [];
  const gap = frrRequired - frrDrawn;

  if (gap <= 0) return items;

  items.push({
    code: "NBC 3.1.3.4",
    description: `Upgrade fire separation between ${occupancyA} and ${occupancyB} occupancies from ${frrDrawn}hr to minimum ${frrRequired}hr FRR.`,
    urgency: gap >= 1 ? "immediate" : "required",
  });

  if (frrRequired >= 2) {
    items.push({
      code: "NBC 3.1.5.4",
      description: "Provide protected openings with fire doors rated to match the required FRR of the separation.",
      urgency: "required",
    });
  }

  if (frrDrawn === 0 && frrRequired > 0) {
    items.push({
      code: "NBC 3.1.3.1",
      description: "No fire separation currently shown. Provide a continuous rated assembly extending structure to structure.",
      urgency: "immediate",
    });
  }

  return items;
}
