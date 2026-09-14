import { describe, expect, it } from "vitest";
import dotenv from "dotenv";
import { vi } from "vitest";

vi.unmock('../db');
dotenv.config({ path: '.env.local' });

const live = process.env.RUN_LIVE_DB_TESTS === '1';

describe.skipIf(!live)('area unit preference live persistence', () => {
  it('persists the preference through the real tRPC procedure and re-fetch', async () => {
    const { appRouter } = await import('../routers');
    const ctx = { user: { id: 1240 }, req: {}, res: {} } as any;
    const caller = appRouter.createCaller(ctx);
    await caller.user.setAreaUnit({ areaUnit: 'ft2' });
    try {
      const fetched = await caller.user.getAreaUnit();
      expect(fetched.areaUnit).toBe('ft2');
    } finally {
      await caller.user.setAreaUnit({ areaUnit: 'm2' });
    }
  }, 30000);

  it('round-trips a real building footprint fact without reinterpretation', async () => {
    const { appRouter } = await import('../routers');
    const { getDb } = await import('../db');
    const { projects } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');
    const [inserted] = await db.insert(projects).values({
      userId: 1240,
      name: `Area unit footprint test ${Date.now()}`,
      occupancyCode: 'C',
      buildingFootprintJson: { value: 418, confirmed: true, source: 'user-entered' },
    });
    const projectId = Number(inserted.insertId);
    try {
      const caller = appRouter.createCaller({ user: { id: 1240 }, req: {}, res: {} } as any);
      const project = await caller.projects.get({ id: projectId });
      expect((project.buildingFootprintJson as any).value).toBe(418);
    } finally {
      await db.delete(projects).where(eq(projects.id, projectId));
    }
  }, 30000);
});
