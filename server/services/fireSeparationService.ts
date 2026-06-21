/**
 * NBC 3.1.3.1 / Table 3.1.3.1 — Major Occupancy Fire Separations (BCBC 2024, code page 3-55).
 * Rows = occupancy A side, columns = occupancy B side.
 * Values are in hours; 0 = no requirement (Table shows dash).
 *
 * F divisions are intentionally NOT collapsed: F-1/F-2/F-3 have materially
 * different requirements and must remain distinct. Group A and B divisions
 * (A-1 through A-4, B-1 through B-3) share the same inter-group values and
 * are normalised to "A" and "B" respectively.
 *
 * F-1 + A/B/C returns 0 here because that combination is PROHIBITED per
 * NBC 3.1.3.2.(1) — not merely rated. The prohibition is the authoritative
 * check; see Constraints.fire.prohibitions.f1_with_abc.
 */
const FRR_TABLE: Record<string, Record<string, number>> = {
  //        A   B   C   D   E   F-1  F-2  F-3
  "A":   { "A":0, "B":2, "C":1, "D":1, "E":2, "F-1":0, "F-2":2, "F-3":1 },
  "B":   { "A":2, "B":0, "C":2, "D":2, "E":2, "F-1":0, "F-2":2, "F-3":2 },
  "C":   { "A":1, "B":2, "C":0, "D":1, "E":2, "F-1":0, "F-2":2, "F-3":1 },
  "D":   { "A":1, "B":2, "C":1, "D":0, "E":0, "F-1":3, "F-2":0, "F-3":0 },
  "E":   { "A":2, "B":2, "C":2, "D":0, "E":0, "F-1":3, "F-2":0, "F-3":0 },
  "F-1": { "A":0, "B":0, "C":0, "D":3, "E":3, "F-1":0, "F-2":2, "F-3":2 },
  "F-2": { "A":2, "B":2, "C":2, "D":0, "E":0, "F-1":2, "F-2":0, "F-3":0 },
  "F-3": { "A":1, "B":2, "C":1, "D":0, "E":0, "F-1":2, "F-2":0, "F-3":0 },
};

function normalizeGroup(occ: string): string {
  const upper = occ.toUpperCase().trim();
  // Preserve F divisions — F-1/F-2/F-3 have different requirements
  if (upper === "F-1" || upper === "F-2" || upper === "F-3") return upper;
  // Normalize A and B divisions to their base letter; default bare "F" to F-2 (medium hazard)
  const base = upper.split("-")[0];
  if (base === "F") return "F-2";
  return base;
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
    code: "NBC 3.1.3.1 / Table 3.1.3.1",
    description: `Upgrade fire separation between ${occupancyA} and ${occupancyB} occupancies from ${frrDrawn}hr to minimum ${frrRequired}hr FRR.`,
    urgency: gap >= 1 ? "immediate" : "required",
  });

  if (frrRequired >= 2) {
    items.push({
      code: "NBC 3.1.8",
      description: "Provide protected openings with fire doors rated to match the required FRR of the separation.",
      urgency: "required",
    });
  }

  if (frrDrawn === 0 && frrRequired > 0) {
    items.push({
      code: "NBC 3.1.3.1.(1)",
      description: "No fire separation currently shown. Provide a continuous rated assembly extending structure to structure.",
      urgency: "immediate",
    });
  }

  return items;
}
