import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveRoomsToDb } from '../spatial/roomDetectionService';
import type { DetectedRoom } from '../spatial/types';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

vi.mock('../../services/adjacencyService', () => ({
  computeRoomAdjacency: vi.fn(),
}));

vi.mock('../spatial/roomComplianceEvaluator', () => ({
  evaluateRoomCompliance: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockDb: any;
let lifecycleEvents: string[] = [];

beforeEach(async () => {
  const { getDb } = await import('../../db');
  lifecycleEvents = [];

  mockDb = {
    transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) => callback(mockDb)),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      if (payload?.detectionComplete === 1) {
        lifecycleEvents.push('detectionComplete');
      }
      return mockDb;
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 101 }]),
    }),
    delete: vi.fn().mockReturnThis(),
  };

  (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);
});

describe('saveRoomsToDb', () => {
  it('waits for adjacency before starting room compliance', async () => {
    const { computeRoomAdjacency } = await import('../../services/adjacencyService');
    const { evaluateRoomCompliance } = await import('../spatial/roomComplianceEvaluator');

    let releaseAdjacency!: () => void;
    const adjacencyGate = new Promise<void>(resolve => {
      releaseAdjacency = resolve;
    });

    (computeRoomAdjacency as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      lifecycleEvents.push('adjacency:start');
      await adjacencyGate;
      lifecycleEvents.push('adjacency:end');
    });

    (evaluateRoomCompliance as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      lifecycleEvents.push('compliance:start');
    });

    const room: DetectedRoom = {
      label: 'Office 101',
      boundingBox: { x: 10, y: 10, width: 80, height: 60 },
      areaSqm: 18,
      floorLevel: 'Level 1',
      occupancyGroup: 'D',
      occupancyDivision: null,
      confidence: 0.95,
      features: [],
      flags: [],
    };

    const runPromise = saveRoomsToDb([room], 7, 42, 'AB', 100, 80, '1.0', '', []);

    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(lifecycleEvents).toEqual(['adjacency:start']);
    expect(evaluateRoomCompliance).not.toHaveBeenCalled();

    releaseAdjacency();
    await runPromise;

    expect(lifecycleEvents).toEqual([
      'adjacency:start',
      'adjacency:end',
      'compliance:start',
      'detectionComplete',
    ]);
    expect(evaluateRoomCompliance).toHaveBeenCalledTimes(1);
    expect(mockDb.insert.mock.results[0].value.values).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 7, projectId: 42 }),
    );
    expect(evaluateRoomCompliance).toHaveBeenCalledWith(expect.objectContaining({
      ...room,
      areaSqmJson: { value: 18, confirmed: false, source: 'ai-extracted' },
      occupancyGroupJson: { value: 'D', confirmed: false, source: 'ai-extracted' },
    }), 101, 42, 'AB');
  });
});
