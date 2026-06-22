/**
 * Room Adjacency Service — Thread A Step 3
 *
 * Computes which rooms on a page share a wall (are physically adjacent).
 * Adjacency is defined as: minimum edge-to-edge distance ≤ ADJACENCY_THRESHOLD_PX.
 *
 * Runs O(n²) per page. Typical pages have < 30 rooms so this is fast.
 * Uses polygonJson edges when available; falls back to bounding box edges otherwise.
 *
 * Results are written to detectedRooms.adjacentRoomIds as a JSON number[].
 * NULL → not yet computed. [] → computed, no neighbours.
 */

import { getDb } from '../db';
import { detectedRooms } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const ADJACENCY_THRESHOLD_PX = 15;

interface Point { x: number; y: number; }
type Polygon = Point[];
interface BBox { x: number; y: number; width: number; height: number; }

function bboxToPolygon(bbox: BBox): Polygon {
  return [
    { x: bbox.x,              y: bbox.y              },
    { x: bbox.x + bbox.width, y: bbox.y              },
    { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
    { x: bbox.x,              y: bbox.y + bbox.height },
  ];
}

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
    return 0; // segments intersect
  }
  return Math.min(
    pointToSegmentDist(p1, p3, p4),
    pointToSegmentDist(p2, p3, p4),
    pointToSegmentDist(p3, p1, p2),
    pointToSegmentDist(p4, p1, p2),
  );
}

function polygonMinDist(polyA: Polygon, polyB: Polygon): number {
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

function parsePolygon(polygonJson: unknown, boundingBoxJson: string): Polygon {
  if (polygonJson) {
    try {
      const pts = typeof polygonJson === 'string' ? JSON.parse(polygonJson) : polygonJson;
      if (Array.isArray(pts) && pts.length >= 3) return pts as Polygon;
    } catch { /* fall through to bbox */ }
  }
  return bboxToPolygon(JSON.parse(boundingBoxJson) as BBox);
}

export async function computeRoomAdjacency(pageId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const rooms = await db
    .select({
      id: detectedRooms.id,
      boundingBoxJson: detectedRooms.boundingBoxJson,
      polygonJson: detectedRooms.polygonJson,
    })
    .from(detectedRooms)
    .where(eq(detectedRooms.pageId, pageId));

  const adjacency = new Map<number, number[]>(rooms.map(r => [r.id, []]));

  if (rooms.length >= 2) {
    const polygons = rooms.map(r => parsePolygon(r.polygonJson, r.boundingBoxJson));
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        if (polygonMinDist(polygons[i], polygons[j]) <= ADJACENCY_THRESHOLD_PX) {
          adjacency.get(rooms[i].id)!.push(rooms[j].id);
          adjacency.get(rooms[j].id)!.push(rooms[i].id);
        }
      }
    }
  }

  for (const [roomId, neighbours] of adjacency) {
    await db.update(detectedRooms)
      .set({ adjacentRoomIds: JSON.stringify(neighbours) })
      .where(eq(detectedRooms.id, roomId));
  }
}
