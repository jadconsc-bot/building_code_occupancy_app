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

function isPointNearPolygon(
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>,
  tolerancePx: number
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  if (inside) return true;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const dx = polygon[j].x - polygon[i].x;
    const dy = polygon[j].y - polygon[i].y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;
    const t = Math.max(0, Math.min(1,
      ((point.x - polygon[i].x) * dx + (point.y - polygon[i].y) * dy) / lenSq
    ));
    const nearX = polygon[i].x + t * dx;
    const nearY = polygon[i].y + t * dy;
    const dist = Math.sqrt((point.x - nearX) ** 2 + (point.y - nearY) ** 2);
    if (dist <= tolerancePx) return true;
  }
  return false;
}

/**
 * Room compliance check — Phase C Sprint 3.
 * polygon: image-coordinate points (px)
 * pixelsPerM: calibrated pixels-per-metre, or null if uncalibrated
 *
 * Area rule:     NBC 9.5.21  — bedroom ≥ 7.4 m², other habitable ≥ 4.65 m²
 * Egress window: NBC 9.10.7  — ≥ 0.35 m², min dimension 380 mm (sleeping rooms)
 * Travel distance: NBC 3.4.2.5 — wired from travelDistanceResults by room label
 */
export function calculateRoomCompliance(
  roomId: string,
  roomLabel: string,
  polygon: Array<{ x: number; y: number }>,
  pixelsPerM: number | null,
  measuredWindows?: Array<{
    id: string;
    widthMm: number;
    heightMm: number;
    areaM2: number;
    position: { x: number; y: number };
  }>,
  travelDistancePx?: number,
  travelLimitM?: number,
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

  const isSleeping = /bed|sleep|master|bedroom/i.test(roomLabel);
  const minAreaM2 = isSleeping ? 7.4 : 4.65;
  const areaCompliant = pixelsPerM ? areaM2 >= minAreaM2 : true;

  // ── Egress window check (NBC 9.10.7) ──────────────────────────────────
  let egressResult = {
    hasEgressWindow: false,
    windowAreaM2: 0,
    compliant: !isSleeping,
    nbcRef: 'NBC 9.10.7',
  };

  if (isSleeping && measuredWindows && measuredWindows.length > 0) {
    const windowsNearRoom = measuredWindows.filter(w =>
      isPointNearPolygon(w.position, polygon, 50)
    );
    if (windowsNearRoom.length > 0) {
      const bestWindow = windowsNearRoom.reduce((best, w) =>
        w.areaM2 > best.areaM2 ? w : best
      );
      const minDimensionMm = Math.min(bestWindow.widthMm, bestWindow.heightMm);
      egressResult = {
        hasEgressWindow: true,
        windowAreaM2: bestWindow.areaM2,
        compliant: bestWindow.areaM2 >= 0.35 && minDimensionMm >= 380,
        nbcRef: 'NBC 9.10.7',
      };
    }
  }

  // ── Travel distance check (NBC 3.4.2.5) ───────────────────────────────
  let travelResult = {
    distancePx: 0,
    distanceM: 0,
    maxAllowedM: 0,
    compliant: true,
    pathPoints: [] as Array<{ x: number; y: number }>,
  };

  if (travelDistancePx !== undefined && travelDistancePx > 0 && pixelsPerM) {
    const distanceM = travelDistancePx / pixelsPerM;
    const limitM = travelLimitM ?? 25;
    travelResult = {
      distancePx: travelDistancePx,
      distanceM,
      maxAllowedM: limitM,
      compliant: distanceM <= limitM,
      pathPoints: [],
    };
  }

  // ── Severity ───────────────────────────────────────────────────────────
  let severity: RoomComplianceResult['severity'] = 'pass';
  if (!areaCompliant) {
    severity = 'fail';
  } else if (isSleeping && egressResult.hasEgressWindow && !egressResult.compliant) {
    severity = 'fail';
  } else if (travelResult.distanceM > 0 && !travelResult.compliant) {
    severity = 'fail';
  } else if (!pixelsPerM) {
    severity = 'conditional';
  } else if (isSleeping && !egressResult.hasEgressWindow) {
    severity = 'conditional';
  }

  const result: RoomComplianceResult = {
    roomId,
    roomLabel,
    polygon,
    areaM2,
    egress: egressResult,
    travelDistance: travelResult,
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
