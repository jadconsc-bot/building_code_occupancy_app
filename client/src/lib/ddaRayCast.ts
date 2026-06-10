export interface Point { x: number; y: number; }

export interface DDAResult {
  polygon: Point[];
  area: number;
  success: boolean;
}

interface DDAOptions {
  ignoreRadius?: number;
  rayCount?: number;
  darkThreshold?: number;
}

/**
 * Walk a single ray from (originX, originY) in the given direction.
 * Returns the first dark pixel hit (wall), or the image edge.
 */
function castRay(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  originX: number,
  originY: number,
  angleDeg: number,
  maxDistance: number,
  ignoreRadius: number,
  darkThreshold: number,
): Point {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  let x = originX;
  let y = originY;

  for (let d = 0; d < maxDistance; d++) {
    x += dx;
    y += dy;
    const px = Math.round(x);
    const py = Math.round(y);

    if (px < 0 || py < 0 || px >= width || py >= height) {
      return { x: Math.max(0, Math.min(width - 1, px)), y: Math.max(0, Math.min(height - 1, py)) };
    }

    const distFromOrigin = Math.sqrt((px - originX) ** 2 + (py - originY) ** 2);
    if (distFromOrigin < ignoreRadius) continue;

    const idx = (py * width + px) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    if (r < darkThreshold && g < darkThreshold && b < darkThreshold) {
      return { x: px, y: py };
    }
  }

  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Cast rays in N directions from seed point.
 * ignoreRadius: pixels around seed to skip (filters label text, default 25)
 * rayCount: number of rays (default 360)
 * darkThreshold: max channel value to classify as wall (default 80)
 */
export function ddaRayCast(
  imageData: ImageData,
  seed: Point,
  options?: DDAOptions,
): DDAResult {
  const { ignoreRadius = 25, rayCount = 360, darkThreshold = 80 } = options ?? {};
  const maxDistance = Math.max(imageData.width, imageData.height) * 2;
  const polygon: Point[] = [];

  for (let i = 0; i < rayCount; i++) {
    const angleDeg = (i / rayCount) * 360;
    const hit = castRay(
      imageData.data,
      imageData.width,
      imageData.height,
      seed.x,
      seed.y,
      angleDeg,
      maxDistance,
      ignoreRadius,
      darkThreshold,
    );
    polygon.push(hit);
  }

  const area = polygonArea(polygon);
  return { polygon, area, success: polygon.length > 2 };
}

/**
 * Ramer-Douglas-Peucker polygon simplification.
 * epsilon: simplification tolerance in pixels (default 3)
 */
export function simplifyPolygon(points: Point[], epsilon: number = 3): Point[] {
  if (points.length <= 2) return points;

  function perpendicularDistance(pt: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return Math.sqrt((pt.x - lineStart.x) ** 2 + (pt.y - lineStart.y) ** 2);
    return Math.abs(dy * pt.x - dx * pt.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / len;
  }

  function rdp(pts: Point[], start: number, end: number, eps: number, keep: boolean[]): void {
    if (end <= start + 1) return;
    let maxDist = 0;
    let maxIdx = start;
    for (let i = start + 1; i < end; i++) {
      const d = perpendicularDistance(pts[i], pts[start], pts[end]);
      if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    if (maxDist > eps) {
      keep[maxIdx] = true;
      rdp(pts, start, maxIdx, eps, keep);
      rdp(pts, maxIdx, end, eps, keep);
    }
  }

  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  rdp(points, 0, points.length - 1, epsilon, keep);
  return points.filter((_, i) => keep[i]);
}

/**
 * Calculate polygon area using the shoelace formula. Returns px².
 */
export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export const WALL_PROXIMITY_PX = 8;

export interface SharedWall {
  keyA: string;
  keyB: string;
  labelA: string;
  labelB: string;
  occupancyA: string;
  occupancyB: string;
  sharedPoints: Point[];
  frr: string;
  hours: number;
  color: string;
}

const FRR_HOURS: Record<string, Record<string, number>> = {
  A: { A: 1, B: 2, C: 2, D: 2, E: 2 },
  B: { A: 2, B: 1, C: 1, D: 1, E: 1 },
  C: { A: 2, B: 1, C: 0.75, D: 0.75, E: 0.75 },
  D: { A: 2, B: 1, C: 0.75, D: 0.75, E: 1 },
  E: { A: 2, B: 1, C: 0.75, D: 1, E: 0.75 },
};

export function getWallFRR(occA: string, occB: string): { frr: string; hours: number; color: string } {
  const a = occA.charAt(0).toUpperCase();
  const b = occB.charAt(0).toUpperCase();
  const hours = FRR_HOURS[a]?.[b] ?? FRR_HOURS[b]?.[a] ?? 0.75;
  const frr = hours >= 2 ? '2 hr' : hours >= 1 ? '1 hr' : '45 min';
  const color = hours >= 2 ? '#ef4444' : hours >= 1 ? '#f59e0b' : '#22c55e';
  return { frr, hours, color };
}

export function detectSharedWalls(
  roomMap: Map<string, { label: string; occupancy: string; polygon: Point[] }>,
): SharedWall[] {
  const entries = Array.from(roomMap.entries());
  const walls: SharedWall[] = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [keyA, roomA] = entries[i];
      const [keyB, roomB] = entries[j];

      const shared: Point[] = [];
      for (const ptA of roomA.polygon) {
        for (const ptB of roomB.polygon) {
          const dist = Math.sqrt((ptA.x - ptB.x) ** 2 + (ptA.y - ptB.y) ** 2);
          if (dist <= WALL_PROXIMITY_PX) {
            shared.push({ x: (ptA.x + ptB.x) / 2, y: (ptA.y + ptB.y) / 2 });
            break;
          }
        }
      }

      if (shared.length < 3) continue;

      const { frr, hours, color } = getWallFRR(roomA.occupancy, roomB.occupancy);
      walls.push({
        keyA, keyB,
        labelA: roomA.label,
        labelB: roomB.label,
        occupancyA: roomA.occupancy,
        occupancyB: roomB.occupancy,
        sharedPoints: shared,
        frr, hours, color,
      });
    }
  }

  return walls;
}
