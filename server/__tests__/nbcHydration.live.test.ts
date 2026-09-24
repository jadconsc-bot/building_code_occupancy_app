import { describe, expect, it } from 'vitest';
import dotenv from 'dotenv';
import { vi } from 'vitest';

vi.unmock('../db');

dotenv.config({ path: '.env.local' });

const live = process.env.RUN_LIVE_DB_TESTS === '1';

describe.skipIf(!live)('NBC footprint hydration live router round-trip', () => {
  it('hydrates a real inserted project for analyzeCompliance and generatePathway', async () => {
    const { appRouter } = await import('../routers');
    const { getDb } = await import('../db');
    const { projects, complianceSnapshots, auditLog } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');
    const userId = 1240;
    const [inserted] = await db.insert(projects).values({
      userId,
      name: `NBC hydration test ${Date.now()}`,
      occupancyCode: 'C',
      grossFloorArea: '836.00',
      storeys: 2,
      buildingFootprintJson: null,
    });
    const projectId = Number(inserted.insertId);
    try {
      const ctx = { user: { id: userId }, req: {}, res: {} } as any;
      const caller = appRouter.createCaller(ctx);
      await caller.projects.update({ id: projectId, buildingFootprintJson: { value: 418, confirmed: true, source: 'user-confirmed' } });
      const pathway = await caller.compliancePathway.generatePathway({
        complianceResult: {},
        inputs: { projectId, occupancy_major: 'C', area_m2: 836, storeys: 2 },
      });
      console.log('[live hydration] pathway inputs', pathway.projectSummary);
      expect(pathway.projectSummary.determination.determination).toBe('Part 9');

      const evaluation = await caller.compliance.analyzeCompliance({
        projectId,
        rulesetId: 'nbc_2023_ab_v1',
        mode: 'soft',
        inputs: { occupancy_major: 'C', area_m2: 836, storeys: 2 },
      });
      console.log('[live hydration] evaluation area trace', evaluation.traces.find((t: any) => t.constraintId === 'building_limits.part9_threshold.max_area'));
      expect(evaluation.traces.find((t: any) => t.constraintId === 'building_limits.part9_threshold.max_area')?.result).toBe('pass');
    } finally {
      await db.delete(complianceSnapshots).where(eq(complianceSnapshots.projectId, projectId));
      await db.delete(auditLog).where(eq(auditLog.projectId, projectId));
      await db.delete(projects).where(eq(projects.id, projectId));
    }
  }, 30000);
});
