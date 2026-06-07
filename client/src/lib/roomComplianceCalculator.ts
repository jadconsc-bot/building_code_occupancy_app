export interface RoomComplianceResult {
  roomId: string;
  roomLabel: string;
  polygon: Array<{ x: number; y: number }>;
  areaM2: number;

  egress: {
    hasEgressWindow: boolean;
    windowAreaM2: number;
    compliant: boolean;
    nbcRef: string;
  };
  travelDistance: {
    distancePx: number;
    distanceM: number;
    maxAllowedM: number;
    compliant: boolean;
    pathPoints: Array<{ x: number; y: number }>;
  };
  fireSeparation: {
    requiredFRR: string;
    adjacentRooms: string[];
    compliant: boolean;
  };
  spatialSeparation: {
    limitingDistanceM: number;
    maxOpeningM2: number;
    actualOpeningM2: number;
    compliant: boolean;
  };

  fillColor: string;
  severity: 'pass' | 'conditional' | 'fail';
}

export function getOverlayColor(severity: RoomComplianceResult['severity']): string {
  if (severity === 'fail') return '#EF4444';
  if (severity === 'conditional') return '#F59E0B';
  return '#22C55E';
}

/**
 * Basic room compliance check for Phase C Sprint 2.
 * polygon: image-coordinate points (px)
 * pixelsPerM: calibrated pixels-per-metre, or null if uncalibrated
 *
 * Area rule: NBC 9.5.21 — bedroom ≥ 7.4 m², other habitable rooms ≥ 4.65 m²
 * Sprint 3 will add egress window, fire separation, and spatial separation checks.
 */
export function calculateRoomCompliance(
  roomId: string,
  roomLabel: string,
  polygon: Array<{ x: number; y: number }>,
  pixelsPerM: number | null,
): RoomComplianceResult {
  // Shoelace formula — area in px²
  let areaPx2 = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    areaPx2 += polygon[i].x * polygon[j].y;
    areaPx2 -= polygon[j].x * polygon[i].y;
  }
  areaPx2 = Math.abs(areaPx2) / 2;

  const areaM2 = pixelsPerM ? areaPx2 / (pixelsPerM * pixelsPerM) : 0;

  const isSleeping = /bed|sleep|master/i.test(roomLabel);
  const minAreaM2 = isSleeping ? 7.4 : 4.65;
  const areaCompliant = pixelsPerM ? areaM2 >= minAreaM2 : true;

  let severity: RoomComplianceResult['severity'] = 'pass';
  if (!areaCompliant) severity = 'fail';
  else if (!pixelsPerM) severity = 'conditional';

  const result: RoomComplianceResult = {
    roomId,
    roomLabel,
    polygon,
    areaM2,
    egress: {
      hasEgressWindow: false,
      windowAreaM2: 0,
      compliant: false,
      nbcRef: 'NBC 9.10.7',
    },
    travelDistance: {
      distancePx: 0,
      distanceM: 0,
      maxAllowedM: 0,
      compliant: true,
      pathPoints: [],
    },
    fireSeparation: {
      requiredFRR: '30 min',
      adjacentRooms: [],
      compliant: true,
    },
    spatialSeparation: {
      limitingDistanceM: 0,
      maxOpeningM2: 0,
      actualOpeningM2: 0,
      compliant: true,
    },
    fillColor: '#22C55E',
    severity,
  };
  result.fillColor = getOverlayColor(result.severity);
  return result;
}
