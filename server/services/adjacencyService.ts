/**
 * Room Adjacency Service — Thread A Step 3
 *
 * Computes which rooms on a page share a wall (are physically adjacent).
 * Adjacency is defined as: minimum polygon edge-to-edge distance ≤ ADJACENCY_THRESHOLD_PX.
 *
 * Runs O(n²) over rooms with resolved polygons. Typical pages have < 30 rooms.
 * Rooms with NULL polygonJson are skipped — their adjacentRoomIds remains NULL,
 * signalling "unverifiable" to Rule 7.
 *
 * Results are written to detectedRooms.adjacentRoomIds as a JSON number[].
 * NULL → polygon not yet resolved (adjacency not computed).
 * [] → computed, no neighbours within threshold.
 */

import { getDb } from '../db';
import { detectedRooms } from '../../drizzle/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

/**
 * Proxy for one wall thickness at typical floor plan scan resolution
 * (~150px/m at 1:100 scale). Tune if drawings at significantly different
 * resolutions are used.
 *
 * Note: fallback_bbox source produces rectangular polygons only —
 * adjacency results for these rooms have lower spatial precision.
 */
export const ADJACENCY_THRESHOLD_PX = 15;

interface Point { x: number; y: number; }
type Polygon = Point[];

function pointToSegmentDist(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x, aby = b.y - a.y;
  const apx = p.x - a.x, apy = p.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return Math.sqrt(apx * apx + apy * apy);
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / lenSq));
  const dx = p.x - (a.x + t * abx);
  const dy = p.y - (a.y + t * aby);
  return Math.sqrt(dx * dx + dy * dy);
}

function cross2d(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function segmentMinDist(p1: Point, p2: Point, p3: Point, p4: Point): number {
  const d1 = cross2d(p3, p4, p1);
  const d2 = cross2d(p3, p4, p2);
  const d3 = cross2d(p1, p2, p3);
  const d4 = cross2d(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return 0;
  }
  return Math.min(
    pointToSegmentDist(p1, p3, p4),
    pointToSegmentDist(p2, p3, p4),
    pointToSegmentDist(p3, p1, p2),
    pointToSegmentDist(p4, p1, p2),
  );
}

export function minPolygonEdgeDist(polyA: Polygon, polyB: Polygon): number {
  const n = polyA.length;
  const m = polyB.length;
  let minDist = Infinity;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const d = segmentMinDist(polyA[i], polyA[(i + 1) % n], polyB[j], polyB[(j + 1) % m]);
      if (d < minDist) minDist = d;
      if (minDist === 0) return 0;
    }
  }
  return minDist;
}

function parsePolygon(raw: unknown): Polygon | null {
  try {
    const pts = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(pts) && pts.length >= 3) return pts as Polygon;
  } catch { /* fall through */ }
  return null;
}

export async function computeRoomAdjacency(pageId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const rows = await db
    .select({
      id: detectedRooms.id,
      polygonJson: detectedRooms.polygonJson,
    })
    .from(detectedRooms)
    .where(and(
      eq(detectedRooms.pageId, pageId),
      isNotNull(detectedRooms.polygonJson),
    ));

  if (rows.length > 100) {
    console.warn(`[AdjacencyService] Page ${pageId} has ${rows.length} rooms — O(n²) computation may be slow`);
  }

  const parsed = rows
    .map(r => ({ id: r.id, poly: parsePolygon(r.polygonJson) }))
    .filter((r): r is { id: number; poly: Polygon } => r.poly !== null);

  // Build adjacency map, then batch-update after all pairs are evaluated
  const adjacency = new Map<number, number[]>(parsed.map(r => [r.id, []]));

  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      if (minPolygonEdgeDist(parsed[i].poly, parsed[j].poly) <= ADJACENCY_THRESHOLD_PX) {
        adjacency.get(parsed[i].id)!.push(parsed[j].id);
        adjacency.get(parsed[j].id)!.push(parsed[i].id);
      }
    }
  }

  await Promise.all(
    [...adjacency.entries()].map(([roomId, neighbours]) =>
      db.update(detectedRooms)
        .set({ adjacentRoomIds: JSON.stringify(neighbours) })
        .where(eq(detectedRooms.id, roomId))
    )
  );
}
