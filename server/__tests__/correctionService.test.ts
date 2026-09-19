import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = {
  transaction: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
};

vi.mock('../db', () => ({
  getDb: vi.fn(async () => mockDb),
}));

describe('saveCorrection label rename', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.transaction.mockImplementation(async (callback: (tx: typeof mockDb) => Promise<unknown>) => callback(mockDb));
    mockDb.insert.mockReturnValue({ values: vi.fn(async () => [{ insertId: 501 }]) });
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn(async () => [{ affectedRows: 1 }]),
    });
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(async () => [{ correctionCount: 0 }]),
    });
  });

  it('updates the room without constructing a self-referential $count expression', async () => {
    const { saveCorrection } = await import('../services/correctionService');

    await saveCorrection({
      roomId: 3366,
      pageId: 248,
      correctedBy: 1240,
      correctionType: 'label_rename',
      previousValue: { label: 'Landing' },
      correctedValue: { label: 'Upper Landing' },
      planType: 'floor_plan',
    });

    expect(mockDb.transaction).toHaveBeenCalledOnce();
    expect(mockDb.update).toHaveBeenCalled();
    expect((mockDb as any).$count).toBeUndefined();
  });
});
