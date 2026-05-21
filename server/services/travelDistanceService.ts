/**
 * Travel Distance Service — NBC 3.4.2.5
 *
 * Calculates straight-line travel distances from each occupiable room centroid
 * to the nearest exit (stairwell). Returns pass/fail against the NBC limit.
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
  limit: number;
  result: 'pass' | 'fail' | 'unable_to_evaluate' | 'not_applicable';
  nbcClause: '3.4.2.5';
  sprinklered: boolean;
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
  const limit = sprinklered ? 45 : 25;
  const features = (r: DetectedRoomInput) => r.features ?? [];

  const exits = rooms.filter(r => r.boundingBox && isExitRoom(r.roomLabel, features(r)));
  const occupiable = rooms.filter(
    r => r.boundingBox && !isExitRoom(r.roomLabel, features(r)) && !isNonOccupiable(r.roomLabel),
  );

  const results: TravelDistanceResult[] = [];

  // Exit rooms themselves get 'not_applicable'
  for (const ex of exits) {
    const c = centroid(ex.boundingBox!);
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
      limit,
      result: 'not_applicable',
      nbcClause: '3.4.2.5',
      sprinklered,
    });
  }

  for (const room of occupiable) {
    const c = centroid(room.boundingBox!);

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
        limit,
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
      limit,
      result: distanceM <= limit ? 'pass' : 'fail',
      nbcClause: '3.4.2.5',
      sprinklered,
    });
  }

  return results;
}
