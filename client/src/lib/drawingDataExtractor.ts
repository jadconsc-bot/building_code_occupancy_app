import type { Point } from './ddaRayCast';
import type { RoomComplianceResult } from './roomComplianceCalculator';

export interface DetectedRoom {
  key: string;
  label: string;
  occupancyGroup: string;
  polygon: Point[];
  areaM2: number | null;
}

export interface WindowMeasurement {
  widthMm: number;
  heightMm: number;
  areaM2: number;
  roomId?: string;
}

export interface DrawingPayload {
  rooms: DetectedRoom[];
  windows: WindowMeasurement[];
  pixelsPerMm: number | null;
  calibrationConfidence: 'high' | 'low' | 'none';
  storeys: number;
  province: string;
  municipality: string;
  sprinklered: boolean;
  travelDistanceResults: Array<{
    roomLabel: string;
    distanceM: number;
    limit: number;
    result: 'pass' | 'fail' | 'unable_to_evaluate';
    nbcClause: string;
  }>;
}

export interface WashroomFixtureRequirement {
  waterClosetsMale: number;
  waterClosetsFemale: number;
  lavatories: number;
  drinkingFountains: number;
  accessibleStallsRequired: boolean;
}

export interface WashroomResult {
  occupancyGroup: string;
  occupantLoad: number;
  required: WashroomFixtureRequirement;
  ruleId: string;
  nbcRef: string;
  codeEdition: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  evaluationTimestamp: string;
  confidence: 'confirmed' | 'inferred' | 'advisory';
  assumptions: string[];
  severity: 'pass' | 'fail' | 'info';
}

export interface ConstructionTypeResult {
  constructionType: 'Non-Combustible' | 'Combustible';
  required: boolean;
  limitingStoreys: number;
  limitingAreaM2: number;
  actualStoreys: number;
  actualAreaM2: number;
  storeyMargin: number;
  areaMarginM2: number;
  areaMarginPercent: number;
  ruleId: string;
  nbcRef: string;
  codeEdition: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  evaluationTimestamp: string;
  confidence: 'confirmed' | 'inferred' | 'advisory';
  severity: 'pass' | 'fail' | 'conditional' | 'info';
  reasoning: string;
  assumptions: string[];
  recommendations: string[];
  occupancyGroup: string;
}

// Inline mirror of server/services/codeConflictDetector.ts
// Keep in sync with server type manually — no server import on client.
export interface CodeConflict {
  conflictId: string;
  severity: 'critical' | 'major' | 'minor';
  conflictingRules: string[];
  description: string;
  valueA: string;
  valueB: string;
  recommendation: string;
  nbcRef: string;
  codeEdition: string;
  evaluationTimestamp: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export interface ConflictDetectionResult {
  conflicts: CodeConflict[];
  conflictCount: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  hasBlockingConflicts: boolean;
  evaluationTimestamp: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

// Inline mirror of server/services/carl/carlTypes.ts
// Keep in sync manually — no server import on client.

export type CARLCoverage = 'full' | 'partial' | 'manual' | 'out_of_scope';

export type CARLStatus =
  | 'pass'
  | 'fail'
  | 'advisory'
  | 'not_evaluated'
  | 'out_of_scope';

export interface CARLItem {
  carlId: string;
  section: number;
  sectionName: string;
  description: string;
  nbcRef: string;
  jurisdiction?: string;
  engineCoverage: CARLCoverage;
  dataSource: string | null;
  blockingIfFailed: boolean;
  status: CARLStatus;
  evidence: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
  recommendation: string | null;
}

export interface CARLSectionScore {
  section: number;
  sectionName: string;
  score: number;
  itemCount: number;
  passCount: number;
  failCount: number;
  advisoryCount: number;
  outOfScopeCount: number;
  hasBlockingFailure: boolean;
}

export interface CARLReport {
  projectId: number | null;
  evaluationTimestamp: string;
  codeEdition: string;
  province: string;
  jurisdictionSource?: string;
  items: CARLItem[];
  totalItems: number;
  passCount: number;
  failCount: number;
  advisoryCount: number;
  manualCount: number;
  outOfScopeCount: number;
  notEvaluatedCount: number;
  permitReadinessScore: number;
  permitReadinessLabel: 'Ready' | 'Needs Work' | 'Not Ready';
  hasBlockingFailures: boolean;
  blockingItems: CARLItem[];
  sectionScores: CARLSectionScore[];
}

export interface OrchestratorResult {
  occupantLoad: Array<{
    roomLabel: string;
    occupancyGroup: string;
    areaM2: number;
    occupantsPerM2: number;
    maxOccupants: number;
    nbcRef: string;
  }>;
  egressWindows: Array<{
    windowIdx: number;
    widthMm: number;
    heightMm: number;
    areaM2: number;
    minAreaM2: 0.35;
    minDimensionMm: 380;
    result: 'pass' | 'fail';
    nbcRef: string;
  }>;
  travelDistance: Array<{
    roomLabel: string;
    distanceM: number;
    limitM: number;
    result: 'pass' | 'fail' | 'unable_to_evaluate';
    nbcRef: string;
  }>;
  fireSeparation: Array<{
    ruleId: string;
    description: string;
    requiredFRR: number;
    citation: string;
  }>;
  summary: {
    totalRooms: number;
    totalOccupants: number;
    passCount: number;
    failCount: number;
    advisoryCount: number;
    calibrationConfidence: 'high' | 'low' | 'none';
    edition: string;
  };
  findings: Array<{
    issueId: string;
    severity: 'fail' | 'advisory' | 'pass';
    description: string;
    actual: string;
    required: string;
    citation: string;
  }>;
  washroomCounts: WashroomResult[];
  /**
   * Construction type determination per occupancy group.
   * NBC Table 3.2.2.20 — one entry per unique occupancy group.
   * Read-only — set by deterministic engine, never by user input.
   */
  constructionTypes: ConstructionTypeResult[];
  /**
   * Cross-check conflicts between all rule outputs.
   * hasBlockingConflicts: true disables the permit package button.
   */
  codeConflicts: ConflictDetectionResult;
  /**
   * CARL permit completeness report — 78-item scored checklist.
   * hasBlockingFailures gates permit package PDF alongside hasBlockingConflicts.
   */
  carlReport: CARLReport;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export function extractDrawingData(params: {
  detectedPolygons: Map<string, Point[]>;
  detectedRoomsData: any[];
  ddaRoomCompliance: Map<string, RoomComplianceResult>;
  measuredWindows: Array<{
    id: string;
    widthMm: number;
    heightMm: number;
    areaM2: number;
    [key: string]: any;
  }>;
  pixelsPerMm: number | null;
  travelDistanceResults: Array<{
    roomId?: number;
    roomLabel: string;
    distanceM: number | null;
    limit: number;
    result: string;
    nbcClause: string;
    [key: string]: any;
  }>;
  storeys: number;
  province: string;
  municipality: string;
  sprinklered: boolean;
}): DrawingPayload {
  const {
    detectedPolygons,
    detectedRoomsData,
    ddaRoomCompliance,
    measuredWindows,
    pixelsPerMm,
    travelDistanceResults,
    storeys,
    province,
    municipality,
    sprinklered,
  } = params;

  // Build a lookup from roomId/numeric id to room data
  const roomDataById = new Map<string, any>();
  for (const r of detectedRoomsData) {
    if (r.id != null) roomDataById.set(String(r.id), r);
    if (r.roomLabel) roomDataById.set(r.roomLabel, r);
  }

  const rooms: DetectedRoom[] = [];
  for (const [key, polygon] of detectedPolygons.entries()) {
    if (polygon.length < 3) continue;

    // Match room data: key is "x,y" seed — look up by label from compliance map
    const compliance = ddaRoomCompliance.get(key);
    const label = compliance?.roomLabel ?? key;

    // Find occupancy group from detectedRoomsData by label match
    const roomData = detectedRoomsData.find(
      (r: any) => r.roomLabel === label || r.id === compliance?.roomId
    );
    const occupancyGroup = roomData?.occupancyGroup ?? roomData?.occupancy_group ?? 'D';

    const areaM2 = compliance?.areaM2 ?? null;

    rooms.push({ key, label, occupancyGroup, polygon, areaM2 });
  }

  // Calibration confidence
  let calibrationConfidence: 'high' | 'low' | 'none';
  if (pixelsPerMm === null || pixelsPerMm <= 0) {
    calibrationConfidence = 'none';
  } else if (pixelsPerMm < 0.01 || pixelsPerMm > 100) {
    calibrationConfidence = 'low';
  } else {
    calibrationConfidence = 'high';
  }

  const windows: WindowMeasurement[] = measuredWindows.map(w => ({
    widthMm: w.widthMm,
    heightMm: w.heightMm,
    areaM2: w.areaM2,
  }));

  const normalizedTravel = travelDistanceResults
    .filter(r => r.result === 'pass' || r.result === 'fail' || r.result === 'unable_to_evaluate')
    .map(r => ({
      roomLabel: r.roomLabel,
      distanceM: r.distanceM ?? 0,
      limit: r.limit,
      result: (r.result === 'pass' || r.result === 'fail' ? r.result : 'unable_to_evaluate') as 'pass' | 'fail' | 'unable_to_evaluate',
      nbcClause: r.nbcClause ?? '3.4.2.5',
    }));

  return {
    rooms,
    windows,
    pixelsPerMm,
    calibrationConfidence,
    storeys,
    province,
    municipality,
    sprinklered,
    travelDistanceResults: normalizedTravel,
  };
}
