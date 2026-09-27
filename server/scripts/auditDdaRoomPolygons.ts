/**
 * Read-only audit of persisted DDA room polygons.
 *
 * Reports small raw polygon areas so saved traces can be reviewed without
 * modifying any detectedRooms rows.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx server/scripts/auditDdaRoomPolygons.ts
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { detectedRooms } from '../../drizzle/schema';
import { getDb } from '../db';

const SMALL_POLYGON_THRESHOLD_PX2 = 2_000;

type Vertex = { x: number; y: number };

function extractVertices(value: unknown): Vertex[] | null {
  const candidate = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { points?: unknown }).points)
      ? (value as { points: unknown[] }).points
      : null;
  if (!candidate || candidate.length < 3) return null;

  const vertices = candidate
    .map((point) => {
      if (!point || typeof point !== 'object') return null;
      const { x, y } = point as { x?: unknown; y?: unknown };
      return typeof x === 'number' && Number.isFinite(x) && typeof y === 'number' && Number.isFinite(y)
        ? { x, y }
        : null;
    })
    .filter((point): point is Vertex => point !== null);

  return vertices.length >= 3 ? vertices : null;
}

function shoelaceAreaPx2(value: unknown): { areaPx2: number; vertexCount: number } | null {
  const vertices = extractVertices(value);
  if (!vertices) return null;

  let twiceArea = 0;
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    twiceArea += current.x * next.y - next.x * current.y;
  }
  return { areaPx2: Math.abs(twiceArea) / 2, vertexCount: vertices.length };
}

async function main(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database is not configured; audit could not run.');

  const rows = await db
    .select({
      projectId: detectedRooms.projectId,
      pageId: detectedRooms.pageId,
      roomLabel: detectedRooms.roomLabel,
      polygonJson: detectedRooms.polygonJson,
    })
    .from(detectedRooms)
    .where(eq(detectedRooms.detectionMethod, 'dda_ray_cast'));

  const smallRows = rows.flatMap((row) => {
    const measurement = shoelaceAreaPx2(row.polygonJson);
    if (!measurement || measurement.areaPx2 >= SMALL_POLYGON_THRESHOLD_PX2) return [];
    return [{ ...row, ...measurement }];
  });

  console.log(`DDA polygon audit (read-only; threshold < ${SMALL_POLYGON_THRESHOLD_PX2} px²)`);
  console.log(`Total dda_ray_cast rows: ${rows.length}`);
  console.log(`Rows below threshold: ${smallRows.length}`);

  const grouped = new Map<string, typeof smallRows>();
  for (const row of smallRows) {
    const key = `project ${row.projectId ?? 'unknown'} / page ${row.pageId ?? 'unknown'}`;
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  for (const [group, groupRows] of grouped) {
    console.log(`\n${group}`);
    for (const row of groupRows) {
      console.log(JSON.stringify({
        projectId: row.projectId,
        pageId: row.pageId,
        roomLabel: row.roomLabel,
        vertexCount: row.vertexCount,
        pixelArea: row.areaPx2,
      }));
    }
  }

  // Close the one-off process even when the database driver keeps a pool open.
  process.exit(0);
}

main().catch((error) => {
  console.error('DDA polygon audit failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
