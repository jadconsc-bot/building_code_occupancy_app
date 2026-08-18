import { describe, it, expect, vi, beforeEach } from 'vitest';
import { minPolygonEdgeDist, ADJACENCY_THRESHOLD_PX, computeRoomAdjacency } from '../../services/adjacencyService';
import { evaluateFireSeparationRule } from '../spatial/roomComplianceEvaluator';

// ── Geometry helpers (used by tests, not duplicated from service) ─────────────

function rect(x: number, y: number, w: number, h: number) {
  return [
    { x: x,     y: y     },
    { x: x + w, y: y     },
    { x: x + w, y: y + h },
    { x: x,     y: y + h },
  ];
}

// ── minPolygonEdgeDist ────────────────────────────────────────────────────────

describe('minPolygonEdgeDist — geometry', () => {
  it('touching rectangles (shared edge) → 0', () => {
    expect(minPolygonEdgeDist(rect(0, 0, 100, 80), rect(100, 0, 100, 80))).toBe(0);
  });

  it('10px gap → within threshold', () => {
    const d = minPolygonEdgeDist(rect(0, 0, 100, 80), rect(110, 0, 100, 80));
    expect(d).toBeCloseTo(10);
    expect(d <= ADJACENCY_THRESHOLD_PX).toBe(true);
  });

  it('20px gap → outside threshold', () => {
    const d = minPolygonEdgeDist(rect(0, 0, 100, 80), rect(120, 0, 100, 80));
    expect(d).toBeCloseTo(20);
    expect(d <= ADJACENCY_THRESHOLD_PX).toBe(false);
  });

  it('exactly 15px gap → on boundary (adjacent)', () => {
    const d = minPolygonEdgeDist(rect(0, 0, 100, 80), rect(115, 0, 100, 80));
    expect(d).toBeCloseTo(15);
    expect(d <= ADJACENCY_THRESHOLD_PX).toBe(true);
  });

  it('diagonal offset ~28px → not adjacent', () => {
    const d = minPolygonEdgeDist(rect(0, 0, 100, 100), rect(120, 120, 100, 100));
    expect(d).toBeGreaterThan(ADJACENCY_THRESHOLD_PX);
  });

  it('intersecting polygons → 0', () => {
    expect(minPolygonEdgeDist(rect(0, 0, 100, 100), rect(50, 50, 100, 100))).toBe(0);
  });

  it('8px parallel gap → within threshold', () => {
    const a = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }];
    const b = [{ x: 0, y: 58 }, { x: 100, y: 58 }, { x: 100, y: 108 }, { x: 0, y: 108 }];
    expect(minPolygonEdgeDist(a, b)).toBeCloseTo(8);
  });
});

// ── computeRoomAdjacency — DB-mocked ─────────────────────────────────────────

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockDb: any;

beforeEach(async () => {
  const { getDb } = await import('../../db');
  mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
  (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);
});

// Two rooms close together (8px gap) → each appears in the other's adjacentRoomIds
describe('computeRoomAdjacency', () => {
  it('adjacent rooms → each gets the other in adjacentRoomIds', async () => {
    const updates: Array<{ id: number; neighbours: number[] }> = [];

    mockDb.where
      // First call: select rows
      .mockResolvedValueOnce([
        { id: 1, polygonJson: JSON.stringify(rect(0, 0, 100, 80)) },
        { id: 2, polygonJson: JSON.stringify(rect(108, 0, 100, 80)) }, // 8px gap
      ])
      // Subsequent calls: update wheres
      .mockImplementation(() => {
        const setArg = mockDb.set.mock.lastCall?.[0];
        if (setArg?.adjacentRoomIds !== undefined) {
          const whereArg = mockDb.where.mock.lastCall;
          updates.push({ id: whereArg?.[0]?.b ?? -1, neighbours: setArg.adjacentRoomIds });
        }
        return Promise.resolve([]);
      });

    await computeRoomAdjacency(1);

    // Verify both rooms were updated with each other's ID
    const ids = updates.map(u => u.neighbours);
    expect(ids.some(arr => arr.includes(1))).toBe(true);
    expect(ids.some(arr => arr.includes(2))).toBe(true);
  });

  it('rooms far apart (200px gap) → adjacentRoomIds = [] for both', async () => {
    const updatedNeighbours: number[][] = [];

    mockDb.where
      .mockResolvedValueOnce([
        { id: 10, polygonJson: JSON.stringify(rect(0, 0, 100, 80)) },
        { id: 11, polygonJson: JSON.stringify(rect(300, 0, 100, 80)) }, // 200px gap
      ])
      .mockImplementation(() => {
        const setArg = mockDb.set.mock.lastCall?.[0];
        if (setArg?.adjacentRoomIds !== undefined) {
          updatedNeighbours.push(setArg.adjacentRoomIds);
        }
        return Promise.resolve([]);
      });

    await computeRoomAdjacency(2);

    expect(updatedNeighbours.every(n => Array.isArray(n) && n.length === 0)).toBe(true);
  });

  it('room with null polygonJson is excluded — adjacentRoomIds stays NULL', async () => {
    mockDb.where.mockResolvedValueOnce([
      { id: 20, polygonJson: JSON.stringify(rect(0, 0, 100, 80)) },
      // id=21 has null polygonJson — excluded by WHERE clause, not returned
    ]);

    let updateCount = 0;
    mockDb.where.mockImplementation(() => {
      const setArg = mockDb.set.mock.lastCall?.[0];
      if (setArg?.adjacentRoomIds !== undefined) updateCount++;
      return Promise.resolve([]);
    });

    await computeRoomAdjacency(3);

    // Only room 20 should get an update; room 21 stays NULL (not in result set)
    expect(updateCount).toBe(1);
  });
});

// ── evaluateFireSeparationRule ────────────────────────────────────────────────

describe('Rule 7 — evaluateFireSeparationRule', () => {
  it('null adjacentRoomIds → warning (unverifiable advisory)', () => {
    const trace = evaluateFireSeparationRule('D', null, [], 0);
    expect(trace.result).toBe('warning');
    expect(trace.severity).toBe('medium');
    expect(trace.reasoning).toContain('not yet computed');
  });

  it('adjacentRoomIds = [] → not_applicable (no neighbours)', () => {
    const trace = evaluateFireSeparationRule('D', [], [], 0);
    expect(trace.result).toBe('not_applicable');
    expect(trace.reasoning).toContain('No rooms physically adjacent');
  });

  it('adjacent rooms same group → not_applicable', () => {
    const trace = evaluateFireSeparationRule('D', [5, 6], [], 0);
    expect(trace.result).toBe('not_applicable');
  });

  it('C + D pair → 1hr fire separation warning (no fire-rated door)', () => {
    const trace = evaluateFireSeparationRule('C', [7], ['D'], 0);
    expect(trace.result).toBe('warning');
    expect(trace.evaluatedInputs.required).toBe('1hr fire separation');
    expect(trace.severity).toBe('high');
  });

  it('C + D pair with fire-rated door → pass', () => {
    const trace = evaluateFireSeparationRule('C', [7], ['D'], 1);
    expect(trace.result).toBe('pass');
  });

  it('F-1 + C pair → critical prohibition fail', () => {
    const trace = evaluateFireSeparationRule('F-1', [8], ['C'], 0);
    expect(trace.result).toBe('fail');
    expect(trace.severity).toBe('critical');
    expect(trace.reasoning).toContain('Prohibited occupancy combination');
  });

  it('C room adjacent to F-1 → critical prohibition fail', () => {
    const trace = evaluateFireSeparationRule('C', [9], ['F-1'], 0);
    expect(trace.result).toBe('fail');
    expect(trace.severity).toBe('critical');
  });

  it('D + E pair → not_applicable (no FRR required)', () => {
    const trace = evaluateFireSeparationRule('D', [10], ['E'], 0);
    expect(trace.result).toBe('not_applicable');
  });

  it('B + D pair → FRR required (institutional_any)', () => {
    const trace = evaluateFireSeparationRule('B', [11], ['D'], 0);
    expect(trace.result).toBe('warning');
    expect(trace.evaluatedInputs.unit).toBe('hr');
  });
});
