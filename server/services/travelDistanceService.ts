/**
 * Travel Distance Service — NBC 3.4.2.5
 *
 * Calculates straight-line travel distances from each occupiable room centroid
 * to the nearest exit (stairwell). Returns pass/fail against the NBC limit.
 *
 * Limits are occupancy-group-specific per NBC 3.4.2.5 Table 3.4.2.5.
 * Where the occupancy group is unknown a conservative default is applied and
 * the result is marked 'unable_to_evaluate'.
 *
 * IMPORTANT: distances are straight-line estimates only. Actual path of travel
 * may be longer. Results must be verified manually by a qualified professional.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedRoomInput {
  id: number;
  roomLabel: string;
  boundingBox: BoundingBox | null;
  occupancyGroup: string | null;
  features?: Array<{ featureType: string }>;
}

export interface TravelDistanceResult {
  roomId: number;
  roomLabel: string;
  centroidX: number;
  centroidY: number;
  nearestExitId: number | null;
  nearestExitLabel: string | null;
  exitCentroidX: number | null;
  exitCentroidY: number | null;
  distancePx: number | null;
  distanceM: number | null;
  /** Active limit for the current sprinklered state */
  limit: number;
  limitUnsprinklered: number;
  limitSprinklered: number;
  limitSource: 'occupancy_specific' | 'default_conservative';
  result: 'pass' | 'fail' | 'unable_to_evaluate' | 'not_applicable';
  nbcClause: '3.4.2.5';
  sprinklered: boolean;
}

/**
 * NBC 3.4.2.5 — Maximum travel distance by occupancy group (metres).
 * Full sub-group keys (e.g. 'F-1') are checked before the single-letter fallback.
 * F-1 is excluded from the 45m sprinklered benefit by clause (c) — "other than a
 * high-hazard industrial occupancy" — so its limit is 25m regardless of sprinklers.
 */
const TRAVEL_DISTANCE_LIMITS: Record<string, { unsprinklered: number; sprinklered: number }> = {
  A:   { unsprinklered: 30, sprinklered: 45 },
  B:   { unsprinklered: 30, sprinklered: 45 },
  C:   { unsprinklered: 30, sprinklered: 45 },
  D:   { unsprinklered: 40, sprinklered: 45 },  // NBC 3.4.2.5: business and personal services
  E:   { unsprinklered: 30, sprinklered: 45 },
  'F-1': { unsprinklered: 25, sprinklered: 25 }, // high-hazard: clause (c) excludes from 45m benefit
  'F-2': { unsprinklered: 30, sprinklered: 45 },
  'F-3': { unsprinklered: 30, sprinklered: 45 },
  F:   { unsprinklered: 30, sprinklered: 45 },  // fallback when F sub-division is unknown
};

/** Conservative fallback when occupancyGroup is absent or unrecognised (F-1 limit). */
const DEFAULT_LIMITS = { unsprinklered: 25, sprinklered: 25 };

export function getLimits(occupancyGroup: string | null): {
  limits: { unsprinklered: number; sprinklered: number };
  source: 'occupancy_specific' | 'default_conservative';
} {
  if (!occupancyGroup) return { limits: DEFAULT_LIMITS, source: 'default_conservative' };
  const upper = occupancyGroup.toUpperCase();
  // Check full sub-group key first (e.g. 'F-1'), then single-letter fallback
  const exact = TRAVEL_DISTANCE_LIMITS[upper];
  if (exact) return { limits: exact, source: 'occupancy_specific' };
  const letter = TRAVEL_DISTANCE_LIMITS[upper.charAt(0)];
  if (letter) return { limits: letter, source: 'occupancy_specific' };
  return { limits: DEFAULT_LIMITS, source: 'default_conservative' };
}

// Room labels that classify a space as an exit (stairwell / exit stair)
function isExitRoom(label: string, features: Array<{ featureType: string }>): boolean {
  const lower = label.toLowerCase();
  if (lower.includes('stair')) return true;
  if (features.some(f => f.featureType === 'exit_sign')) return true;
  return false;
}

// Rooms that are non-occupiable service spaces — excluded from travel distance checks
const NON_OCCUPIABLE_PATTERNS = [
  'mechanical', 'boiler', 'hvac', 'electrical', 'elec rm', 'elec. rm',
  'janitor', 'utility', 'service', 'mech', 'storage', 'locker',
  'stair', 'corridor', 'hallway', 'lobby', 'landing', 'vestibule',
  'elevator', 'shaft', 'chase',
];

function isNonOccupiable(label: string): boolean {
  const lower = label.toLowerCase();
  return NON_OCCUPIABLE_PATTERNS.some(p => lower.includes(p));
}

function centroid(bbox: BoundingBox): { x: number; y: number } {
  return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
}

function euclidean(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function calculateTravelDistances(
  rooms: DetectedRoomInput[],
  pixelsPerMm: number | null,
  sprinklered: boolean,
): TravelDistanceResult[] {
  const features = (r: DetectedRoomInput) => r.features ?? [];

  const exits = rooms.filter(r => r.boundingBox && isExitRoom(r.roomLabel, features(r)));
  const occupiable = rooms.filter(
    r => r.boundingBox && !isExitRoom(r.roomLabel, features(r)) && !isNonOccupiable(r.roomLabel),
  );

  const results: TravelDistanceResult[] = [];

  // Exit rooms themselves are not subject to a travel distance check
  for (const ex of exits) {
    const c = centroid(ex.boundingBox!);
    const { limits } = getLimits(ex.occupancyGroup);
    results.push({
      roomId: ex.id,
      roomLabel: ex.roomLabel,
      centroidX: c.x,
      centroidY: c.y,
      nearestExitId: null,
      nearestExitLabel: null,
      exitCentroidX: null,
      exitCentroidY: null,
      distancePx: null,
      distanceM: null,
      limit: sprinklered ? limits.sprinklered : limits.unsprinklered,
      limitUnsprinklered: limits.unsprinklered,
      limitSprinklered: limits.sprinklered,
      limitSource: 'occupancy_specific',
      result: 'not_applicable',
      nbcClause: '3.4.2.5',
      sprinklered,
    });
  }

  for (const room of occupiable) {
    const c = centroid(room.boundingBox!);
    const { limits, source } = getLimits(room.occupancyGroup);
    const activeLimit = sprinklered ? limits.sprinklered : limits.unsprinklered;

    // No exits detected or no calibration → unable_to_evaluate
    if (exits.length === 0 || pixelsPerMm === null || pixelsPerMm <= 0) {
      results.push({
        roomId: room.id,
        roomLabel: room.roomLabel,
        centroidX: c.x,
        centroidY: c.y,
        nearestExitId: null,
        nearestExitLabel: null,
        exitCentroidX: null,
        exitCentroidY: null,
        distancePx: null,
        distanceM: null,
        limit: activeLimit,
        limitUnsprinklered: limits.unsprinklered,
        limitSprinklered: limits.sprinklered,
        limitSource: source,
        result: 'unable_to_evaluate',
        nbcClause: '3.4.2.5',
        sprinklered,
      });
      continue;
    }

    // Unknown occupancy group → use conservative default, mark unable_to_evaluate
    if (source === 'default_conservative') {
      // Still compute the distance so the popover can show it, but result is unable_to_evaluate
      let nearest = exits[0];
      let nearestDist = Infinity;
      for (const ex of exits) {
        const ec = centroid(ex.boundingBox!);
        const d = euclidean(c.x, c.y, ec.x, ec.y);
        if (d < nearestDist) { nearestDist = d; nearest = ex; }
      }
      const ec = centroid(nearest.boundingBox!);
      results.push({
        roomId: room.id,
        roomLabel: room.roomLabel,
        centroidX: c.x,
        centroidY: c.y,
        nearestExitId: nearest.id,
        nearestExitLabel: nearest.roomLabel,
        exitCentroidX: ec.x,
        exitCentroidY: ec.y,
        distancePx: nearestDist,
        distanceM: nearestDist / pixelsPerMm / 1000,
        limit: activeLimit,
        limitUnsprinklered: limits.unsprinklered,
        limitSprinklered: limits.sprinklered,
        limitSource: source,
        result: 'unable_to_evaluate',
        nbcClause: '3.4.2.5',
        sprinklered,
      });
      continue;
    }

    // Find nearest exit by Euclidean centroid distance
    let nearest = exits[0];
    let nearestDist = Infinity;
    for (const ex of exits) {
      const ec = centroid(ex.boundingBox!);
      const d = euclidean(c.x, c.y, ec.x, ec.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = ex;
      }
    }

    const ec = centroid(nearest.boundingBox!);
    const distancePx = nearestDist;
    const distanceM = distancePx / pixelsPerMm / 1000;

    results.push({
      roomId: room.id,
      roomLabel: room.roomLabel,
      centroidX: c.x,
      centroidY: c.y,
      nearestExitId: nearest.id,
      nearestExitLabel: nearest.roomLabel,
      exitCentroidX: ec.x,
      exitCentroidY: ec.y,
      distancePx,
      distanceM,
      limit: activeLimit,
      limitUnsprinklered: limits.unsprinklered,
      limitSprinklered: limits.sprinklered,
      limitSource: source,
      result: distanceM <= activeLimit ? 'pass' : 'fail',
      nbcClause: '3.4.2.5',
      sprinklered,
    });
  }

  return results;
}
