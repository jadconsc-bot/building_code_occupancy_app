import { describe, it, expect } from 'vitest';

// ── Pure geometry helpers ────────────────────────────────────────────────────
// Extracted from adjacencyService.ts for unit-testable access.
// The service itself is async+DB; we test the geometry in isolation.

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
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  return Math.min(
    pointToSegmentDist(p1, p3, p4),
    pointToSegmentDist(p2, p3, p4),
    pointToSegmentDist(p3, p1, p2),
    pointToSegmentDist(p4, p1, p2),
  );
}

function polygonMinDist(polyA: Polygon, polyB: Polygon): number {
  const n = polyA.length, m = polyB.length;
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

function bboxToPolygon(x: number, y: number, w: number, h: number): Polygon {
  return [
    { x: x,     y: y     },
    { x: x + w, y: y     },
    { x: x + w, y: y + h },
    { x: x,     y: y + h },
  ];
}

const ADJACENCY_THRESHOLD_PX = 15;

// ── pointToSegmentDist ────────────────────────────────────────────────────────
describe('pointToSegmentDist', () => {
  it('point on segment endpoint → 0', () => {
    expect(pointToSegmentDist({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0);
  });
  it('point perpendicular to midpoint → exact distance', () => {
    expect(pointToSegmentDist({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(3);
  });
  it('point beyond segment end → distance to end', () => {
    expect(pointToSegmentDist({ x: 15, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(5);
  });
  it('degenerate segment (a===b) → point-to-point distance', () => {
    expect(pointToSegmentDist({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(5);
  });
});

// ── segmentMinDist ────────────────────────────────────────────────────────────
describe('segmentMinDist', () => {
  it('perpendicular segments sharing a gap of 10px → 10', () => {
    const d = segmentMinDist(
      { x: 0, y: 5 }, { x: 10, y: 5 },   // horizontal
      { x: 15, y: 0 }, { x: 15, y: 10 },  // vertical, 5px to the right of endpoint
    );
    expect(d).toBeCloseTo(5);
  });
  it('intersecting segments → 0', () => {
    const d = segmentMinDist(
      { x: 0, y: 0 }, { x: 10, y: 10 },
      { x: 0, y: 10 }, { x: 10, y: 0 },
    );
    expect(d).toBe(0);
  });
  it('parallel segments 8px apart → 8', () => {
    const d = segmentMinDist(
      { x: 0, y: 0 }, { x: 100, y: 0 },
      { x: 0, y: 8 }, { x: 100, y: 8 },
    );
    expect(d).toBeCloseTo(8);
  });
});

// ── polygonMinDist ────────────────────────────────────────────────────────────
describe('polygonMinDist', () => {
  it('touching rectangles (shared edge) → 0', () => {
    const roomA = bboxToPolygon(0, 0, 100, 80);
    const roomB = bboxToPolygon(100, 0, 100, 80); // left edge of B = right edge of A
    expect(polygonMinDist(roomA, roomB)).toBe(0);
  });
  it('rooms separated by 10px → within threshold (15px)', () => {
    const roomA = bboxToPolygon(0, 0, 100, 80);
    const roomB = bboxToPolygon(110, 0, 100, 80); // 10px gap
    expect(polygonMinDist(roomA, roomB)).toBeCloseTo(10);
    expect(polygonMinDist(roomA, roomB) <= ADJACENCY_THRESHOLD_PX).toBe(true);
  });
  it('rooms separated by 20px → outside threshold (15px)', () => {
    const roomA = bboxToPolygon(0, 0, 100, 80);
    const roomB = bboxToPolygon(120, 0, 100, 80); // 20px gap
    expect(polygonMinDist(roomA, roomB)).toBeCloseTo(20);
    expect(polygonMinDist(roomA, roomB) <= ADJACENCY_THRESHOLD_PX).toBe(false);
  });
  it('rooms separated by exactly 15px → on threshold boundary (adjacent)', () => {
    const roomA = bboxToPolygon(0, 0, 100, 80);
    const roomB = bboxToPolygon(115, 0, 100, 80); // 15px gap
    expect(polygonMinDist(roomA, roomB)).toBeCloseTo(15);
    expect(polygonMinDist(roomA, roomB) <= ADJACENCY_THRESHOLD_PX).toBe(true);
  });
  it('rooms diagonally offset with 20px min dist → not adjacent', () => {
    // Room A: 0,0 100x100; Room B: 120,120 100x100 → corner-to-corner ~28.3px
    const roomA = bboxToPolygon(0, 0, 100, 100);
    const roomB = bboxToPolygon(120, 120, 100, 100);
    expect(polygonMinDist(roomA, roomB)).toBeCloseTo(Math.sqrt(20 * 20 + 20 * 20), 0);
    expect(polygonMinDist(roomA, roomB) <= ADJACENCY_THRESHOLD_PX).toBe(false);
  });
});
