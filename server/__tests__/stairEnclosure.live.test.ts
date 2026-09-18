import { describe, expect, it } from 'vitest';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { vi } from 'vitest';

vi.unmock('../db');
dotenv.config({ path: '.env.local' });

const live = process.env.RUN_LIVE_DB_TESTS === '1';

describe.skipIf(!live)('stair enclosure scope live round-trip', () => {
  it('persists a room through the router and evaluates all stair scope cases', async () => {
    const { appRouter } = await import('../routers');
    const { getDb } = await import('../db');
    const { projects, drawingAnalyses, drawingPages, detectedRooms, complianceResults } = await import('../../drizzle/schema');
    const { evaluateRoomCompliance } = await import('../engine/spatial/roomComplianceEvaluator');
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    const userId = 1240;
    const ctx = { user: { id: userId }, req: {}, res: {} } as any;
    const caller = appRouter.createCaller(ctx);
    const cases = [
      { name: 'single-unit-part9', footprint: 418, units: 1, expectedRule: null, label: 'Stairwell A' },
      { name: 'part3', footprint: 836, units: 1, expectedRule: 'NBC 3.4.4.1.(1)', label: 'Stairwell A' },
      { name: 'multi-unit-part9', footprint: 418, units: 3, expectedRule: 'NBC 9.9.4.2.(1)', label: 'Stairwell A' },
      { name: 'missing-units-part9', footprint: 418, units: null, expectedRule: 'NBC 9.9.4.1.(1)', label: 'Stairwell A' },
      { name: 'invalid-zero-units-part9', footprint: 418, units: 0, expectedRule: 'NBC 9.9.4.1.(1)', label: 'Stairwell A' },
      { name: 'non-stair-label', footprint: 418, units: 1, expectedRule: null, label: 'Storage Closet' },
    ];

    for (const testCase of cases) {
      const [projectInsert] = await db.insert(projects).values({
        userId,
        name: `stair scope ${testCase.name} ${Date.now()}`,
        occupancyCode: 'C',
        grossFloorArea: '836.00',
        storeys: 2,
        buildingFootprintJson: null,
        totalDwellingUnits: testCase.units,
      } as any);
      const projectId = Number(projectInsert.insertId);
      let analysisId: number | undefined;
      let pageId: number | undefined;
      try {
        await caller.projects.update({
          id: projectId,
          buildingFootprintJson: { value: testCase.footprint, confirmed: true, source: 'user-entered' },
        });

        const [analysisInsert] = await db.insert(drawingAnalyses).values({
          projectId,
          userId,
          analysisType: 'live-stair-scope-test',
          fileType: 'png',
        } as any);
        analysisId = Number(analysisInsert.insertId);
        const [pageInsert] = await db.insert(drawingPages).values({
          drawingId: analysisId,
          pageNumber: 1,
          widthPx: 1000,
          heightPx: 1000,
        });
        pageId = Number(pageInsert.insertId);

        const saved = await caller.drawingAnalysis.saveRoomPolygon({
          drawingPageId: pageId,
          roomLabel: testCase.label,
          polygonPoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }],
          areaM2: 20,
          occupancyGroup: 'C',
          spaceType: 'stairwell',
          seedX: 50,
          seedY: 50,
        });

        const [roomRow] = await db.select().from(detectedRooms).where(eq(detectedRooms.id, Number(saved.roomId)));
        expect(roomRow).toBeTruthy();
        await evaluateRoomCompliance({
          label: roomRow.roomLabel ?? testCase.label,
          boundingBox: roomRow.boundingBoxJson as any,
          areaSqm: Number(roomRow.areaSqm ?? 20),
          floorLevel: roomRow.floorLevel ?? 'Ground Floor',
          occupancyGroup: roomRow.occupancyGroup ?? 'C',
          occupancyDivision: roomRow.occupancyDivision,
          confidence: Number(roomRow.confidence ?? 1),
          features: [],
          flags: [],
          spaceType: roomRow.spaceType,
        } as any, Number(saved.roomId), projectId, 'AB');

        const traces = await db.select().from(complianceResults).where(eq(complianceResults.projectId, projectId));
        const stairTrace = traces.find(t => t.constraintId === 'egress.stair_enclosure');
        if (testCase.expectedRule) expect(stairTrace?.ruleReference).toBe(testCase.expectedRule);
        else expect(stairTrace).toBeUndefined();
      } finally {
        await db.delete(complianceResults).where(eq(complianceResults.projectId, projectId));
        await db.delete(detectedRooms).where(eq(detectedRooms.projectId, projectId));
        if (pageId) await db.delete(drawingPages).where(eq(drawingPages.id, pageId));
        if (analysisId) await db.delete(drawingAnalyses).where(eq(drawingAnalyses.id, analysisId));
        await db.delete(projects).where(eq(projects.id, projectId));
      }
    }
  }, 120000);
});
