export type WallCodeFormat = "FW" | "W" | "CUSTOM";

export function generateWallCode(
  sequenceNum: number,
  frr: number,
  format: WallCodeFormat = "FW",
  prefix?: string,
): string {
  const seq = String(sequenceNum).padStart(2, "0");
  switch (format) {
    case "FW":
      return `FW-${seq}`;
    case "W": {
      const frrStr =
        frr === 0.5 ? "0.5H" :
        frr === 1.0 ? "1H"   :
        frr === 1.5 ? "1.5H" :
        frr === 2.0 ? "2H"   : `${frr}H`;
      return `W${sequenceNum}.${frrStr}`;
    }
    case "CUSTOM":
      return `${prefix ?? "FW"}-${seq}`;
  }
}

export function generateStackedCodes(baseCode: string): { codeA: string; codeB: string } {
  return { codeA: `${baseCode}a`, codeB: `${baseCode}b` };
}

export function frrLabel(frr: number): string {
  if (frr === 0.5) return "½HR";
  if (frr === 1.0) return "1HR";
  if (frr === 1.5) return "1½HR";
  if (frr === 2.0) return "2HR";
  return `${frr}HR`;
}

export const ULC_DESIGNS: Record<string, { design: string; desc: string }> = {
  "0.5": { design: "ULC W301",   desc: "½hr — Single layer ⅝\" Type X GWB on 2×4 studs" },
  "1.0": { design: "ULC W301",   desc: "1hr — ⅝\" Type X GWB both sides 2×4 studs 16\" O/C" },
  "1.5": { design: "ULC W415",   desc: "1½hr — Double layer GWB one side, single other side" },
  "2.0": { design: "ULC WP3820", desc: "2hr — ⅝\" Type X GWB base+face both sides, double 2×4 stud on sep plates, R14 batt, STC 55-59" },
};

interface LinePoint { x: number; y: number }

export function computeLineOverlap(
  pointsA: LinePoint[],
  pointsB: LinePoint[],
  tolerancePx = 8,
): number {
  const epA = [pointsA[0], pointsA[pointsA.length - 1]];
  const epB = [pointsB[0], pointsB[pointsB.length - 1]];

  const angleA = Math.atan2(epA[1].y - epA[0].y, epA[1].x - epA[0].x);
  const angleB = Math.atan2(epB[1].y - epB[0].y, epB[1].x - epB[0].x);
  const angleDiff = Math.abs(angleA - angleB) % Math.PI;
  if (angleDiff > 0.26 && angleDiff < Math.PI - 0.26) return 0;

  const midA = { x: (epA[0].x + epA[1].x) / 2, y: (epA[0].y + epA[1].y) / 2 };
  const midB = { x: (epB[0].x + epB[1].x) / 2, y: (epB[0].y + epB[1].y) / 2 };
  const perpDist = Math.abs(
    Math.sin(angleA) * (midB.x - midA.x) - Math.cos(angleA) * (midB.y - midA.y),
  );
  if (perpDist > tolerancePx) return 0;

  const proj = (p: LinePoint) => Math.cos(angleA) * p.x + Math.sin(angleA) * p.y;
  const [aMin, aMax] = [Math.min(proj(epA[0]), proj(epA[1])), Math.max(proj(epA[0]), proj(epA[1]))];
  const [bMin, bMax] = [Math.min(proj(epB[0]), proj(epB[1])), Math.max(proj(epB[0]), proj(epB[1]))];

  const overlap = Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin));
  const shorter = Math.min(aMax - aMin, bMax - bMin);
  return shorter > 0 ? overlap / shorter : 0;
}

export function detectStackedAssembly(
  newLine: { points: LinePoint[]; frrDrawn: number },
  existing: Array<{ id: number; pointsJson: unknown; frrDrawn: number | string; isStacked: number; sequenceNum?: number }>,
  tolerancePx = 8,
): { matched: (typeof existing)[0]; effectiveFrr: number } | null {
  for (const other of existing) {
    if (other.isStacked) continue;
    const pts = other.pointsJson as LinePoint[];
    if (!Array.isArray(pts) || pts.length < 2) continue;
    const overlap = computeLineOverlap(newLine.points, pts, tolerancePx);
    if (overlap >= 0.75) {
      const effectiveFrr = +(newLine.frrDrawn + Number(other.frrDrawn)).toFixed(1);
      return { matched: other, effectiveFrr };
    }
  }
  return null;
}
