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
