import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { drawingAnalysisRouter, CURRENT_DISCLAIMER_VERSION } from '../routers/drawingAnalysisRouter';
import { drawingAnalyses, detectedRooms, projects, drawingPages } from '../../drizzle/schema';
import { getDb } from '../db';
import { storagePut } from '../storage';
import { detectRoomsFromPage } from '../engine/spatial/roomDetectionService';

vi.mock('../db', () => ({ getDb: vi.fn() }));
vi.mock('../storage', () => ({ storagePut: vi.fn().mockResolvedValue({ url: 'https://example.test/plan.png' }) }));
vi.mock('../services/drawingExtractionService', () => ({
  EXTRACTION_PROMPT_VERSION: 'test',
  extractDrawingData: vi.fn().mockResolvedValue({ data: { drawingType: 'floor_plan' }, modelVersion: 'test' }),
}));
vi.mock('../services/drawingComplianceEngine', () => ({
  RULE_ENGINE_VERSION: 'test',
  evaluateCompliance: vi.fn(() => ({ ruleEvaluations: [], issues: [], recommendations: [], complianceScore: 100, complianceLevel: 'PASS' })),
}));
vi.mock('../services/analysisQueue', () => ({ queuePageAnalysis: (fn: () => unknown) => Promise.resolve().then(fn) }));
vi.mock('../engine/spatial/roomDetectionService', () => ({ detectRoomsFromPage: vi.fn().mockResolvedValue({}) }));
vi.mock('../services/adjacencyService', () => ({ computeRoomAdjacency: vi.fn().mockResolvedValue(undefined) }));

const user = { id: 7, email: 'test@example.test', name: 'Test', role: 'professional' };
const caller = drawingAnalysisRouter.createCaller({ user, req: { headers: {}, socket: {} }, res: {} } as any);
const input = {
  projectId: 42, imageBase64: 'cGxhbg==', mimeType: 'image/png' as const,
  fileName: 'plan.png', analysisType: 'comprehensive' as const,
  disclaimerAcknowledged: true as const, disclaimerVersion: CURRENT_DISCLAIMER_VERSION,
};
const roomInput = { drawingPageId: 12, roomLabel: 'Office', seedX: 1, seedY: 1,
  polygonPoints: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }] };
let owned: boolean;
let savedProjectId: number | null;
let writes: Array<{ table: unknown; data: any }>;
let projectPredicates: any[];
let db: any;

beforeEach(() => {
  vi.clearAllMocks();
  owned = true;
  savedProjectId = 42;
  writes = [];
  projectPredicates = [];
  db = {
    select: vi.fn(() => ({ from: (table: unknown) => ({ where: (predicate: any) => {
      if (table === projects) projectPredicates.push(predicate);
      const rows = table === projects ? (owned ? [{ id: 42, occupancyCode: 'D' }] : [])
        : table === drawingPages ? [{ drawingId: 101 }]
        : table === drawingAnalyses ? [{ id: 101, projectId: savedProjectId }] : [];
      return Object.assign(Promise.resolve(rows), { limit: () => Promise.resolve(rows) });
    } }) })),
    insert: vi.fn((table: unknown) => ({ values: async (data: any) => {
      writes.push({ table, data });
      return [{ insertId: table === drawingPages ? 12 : 101 }];
    } })),
    update: vi.fn(() => ({ set: () => ({ where: async () => [] }) })),
  };
  vi.mocked(getDb).mockResolvedValue(db);
});

describe('PROJECT-ATTRIBUTION-001: actual router procedures', () => {
  it.each([undefined, null, 0, -1, 1.5, '42'])('rejects invalid analysis project %s before writes or upload', async projectId => {
    await expect(caller.analyze({ ...input, projectId } as any)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(writes).toEqual([]);
    expect(storagePut).not.toHaveBeenCalled();
  });
  it('rejects an unavailable or foreign project before writes or upload', async () => {
    owned = false;
    await expect(caller.analyze(input)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(writes).toEqual([]);
    expect(storagePut).not.toHaveBeenCalled();
    const query = new MySqlDialect().sqlToQuery(projectPredicates[0]);
    expect(query.params).toEqual([42, 7]);
    expect(query.sql).toContain('`userId`');
  });
  it('persists the explicitly chosen project and passes it to room detection', async () => {
    const result = await caller.analyze(input);
    await vi.waitFor(() => expect(detectRoomsFromPage).toHaveBeenCalled());
    expect(result.analysisId).toBe(101);
    expect(writes.find(w => w.table === drawingAnalyses)?.data.projectId).toBe(42);
    expect(vi.mocked(detectRoomsFromPage).mock.calls[0].slice(0, 4)).toEqual(['cGxhbg==', 12, 42, 1]);
  });
  it.each([null, 0, -1])('rejects manual room insertion with parent project %s', async projectId => {
    savedProjectId = projectId;
    await expect(caller.saveRoomPolygon(roomInput)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(writes).toEqual([]);
  });
  it('rejects manual rooms when the parent project is unavailable or foreign', async () => {
    owned = false;
    await expect(caller.saveRoomPolygon(roomInput)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(writes).toEqual([]);
    expect(new MySqlDialect().sqlToQuery(projectPredicates[0]).params).toEqual([42, 7]);
  });
  it('saves manual rooms under the parent analysis project', async () => {
    await expect(caller.saveRoomPolygon(roomInput)).resolves.toEqual({ roomId: 101 });
    expect(writes.find(w => w.table === detectedRooms)?.data).toMatchObject({ projectId: 42, pageId: 12 });
  });
});
