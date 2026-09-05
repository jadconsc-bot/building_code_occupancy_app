import { describe, expect, it, vi, beforeEach } from 'vitest';
import { evaluateRoomCompliance } from '../spatial/roomComplianceEvaluator';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockDb: any;

function createMockDb(results: any[]) {
  let idx = 0;
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then(resolve: (value: any) => void, reject: (reason: any) => void) {
      const value = results[idx++] ?? [];
      return Promise.resolve(value).then(resolve, reject);
    },
  };

  return {
    select: vi.fn().mockReturnValue(builder),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    }),
  };
}

beforeEach(async () => {
  const { getDb } = await import('../../db');
  mockDb = createMockDb([]);
  (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);
});

describe('evaluateRoomCompliance — accessory occupancy reclassification', () => {
  it('reclassifies a garage to Group C when the project is clearly a single dwelling unit', async () => {
    mockDb = createMockDb([
      [{ totalDwellingUnits: 1 }],
      [
        { occupancyGroup: 'C', spaceType: 'room' },
        { occupancyGroup: 'C', spaceType: 'room' },
        { occupancyGroup: 'F', spaceType: 'garage' },
      ],
      [{ adjacentRoomIds: null }],
      [],
      [{ id: 1 }, { id: 2 }],
    ]);
    const { getDb } = await import('../../db');
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

    const result = await evaluateRoomCompliance(
      {
        label: 'DOUBLE GARAGE',
        boundingBox: { x: 0, y: 0, width: 100, height: 100 },
        areaSqm: 29.3,
        floorLevel: 'Ground Floor',
        occupancyGroup: 'F',
        occupancyDivision: null,
        confidence: 0.95,
        features: [],
        flags: [],
        spaceType: 'garage',
      } as any,
      99,
      123,
      'AB',
    );

    expect(result.occupancyGroup).toBe('C');
    expect(result.traces[0]?.constraintId).toBe('occupancy.load_factors.C');
    expect(result.traces.some(t => t.constraintId === 'occupancy.storage_group_c')).toBe(false);
  });

  it('flags accessory space for verification when dwelling-unit count is missing', async () => {
    mockDb = createMockDb([
      [{ totalDwellingUnits: null }],
      [
        { occupancyGroup: 'C', spaceType: 'room' },
        { occupancyGroup: 'C', spaceType: 'room' },
        { occupancyGroup: 'F', spaceType: 'garage' },
      ],
      [{ adjacentRoomIds: null }],
      [],
      [{ id: 1 }, { id: 2 }],
    ]);
    const { getDb } = await import('../../db');
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

    const result = await evaluateRoomCompliance(
      {
        label: 'DOUBLE GARAGE',
        boundingBox: { x: 0, y: 0, width: 100, height: 100 },
        areaSqm: 29.3,
        floorLevel: 'Ground Floor',
        occupancyGroup: 'F',
        occupancyDivision: null,
        confidence: 0.95,
        features: [],
        flags: [],
        spaceType: 'garage',
      } as any,
      99,
      123,
      'AB',
    );

    expect(result.occupancyGroup).toBe('F');
    expect(result.traces.some(t => t.constraintId === 'occupancy.storage_group_c')).toBe(true);
    expect(result.traces[0]?.constraintId).toBe('occupancy.storage_group_c');
  });
});
