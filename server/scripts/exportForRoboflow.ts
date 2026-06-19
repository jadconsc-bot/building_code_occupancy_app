/**
 * Export floor plan images for Roboflow labeling.
 *
 * Downloads every unique drawingPage image from the CDN and saves it as a
 * JPEG in ./roboflow-export/images/. Each file is named by its pageId so
 * you can correlate back to the DB if needed.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx server/scripts/exportForRoboflow.ts
 *
 * Optional flags:
 *   --min-rooms=3    Only export pages that have ≥N detected rooms (default: 1)
 *   --limit=50       Cap total images exported (default: all)
 *   --out=./my-dir   Output directory (default: ./roboflow-export/images)
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql, count } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { drawingPages, detectedRooms } from '../../drizzle/schema';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? 'true']; })
);

const MIN_ROOMS = parseInt(args['min-rooms'] ?? '1', 10);
const LIMIT     = args['limit'] ? parseInt(args['limit'], 10) : Infinity;
const OUT_DIR   = path.resolve(args['out'] ?? './roboflow-export/images');

// ── Setup ─────────────────────────────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set.');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function parseDataUrl(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) throw new Error('Invalid data URL');
  return Buffer.from(dataUrl.slice(comma + 1), 'base64');
}

async function main() {
  const db = drizzle(databaseUrl!);

  // Pull all pages with their room counts, ordered by most rooms first
  // (more rooms = richer labeling candidates)
  const rawRows = await db
    .select({
      pageId: drawingPages.id,
      preprocessedUrl: drawingPages.preprocessedUrl,
      widthPx: drawingPages.widthPx,
      heightPx: drawingPages.heightPx,
      roomCount: count(detectedRooms.id),
    })
    .from(drawingPages)
    .leftJoin(detectedRooms, sql`${detectedRooms.pageId} = ${drawingPages.id}`)
    .where(sql`${drawingPages.preprocessedUrl} IS NOT NULL`)
    .groupBy(drawingPages.id)
    .having(sql`COUNT(${detectedRooms.id}) >= ${MIN_ROOMS}`)
    .orderBy(sql`COUNT(${detectedRooms.id}) DESC`);

  const rows = rawRows.filter(r => r.preprocessedUrl != null) as Array<{
    pageId: number;
    preprocessedUrl: string;
    widthPx: number;
    heightPx: number;
    roomCount: number;
  }>;

  if (rows.length === 0) {
    console.log(`No pages found with ≥${MIN_ROOMS} detected rooms.`);
    process.exit(0);
  }

  // Deduplicate by URL — multiple analyses can share the same source image
  const seenUrls = new Map<string, number>(); // url → first pageId
  const unique: typeof rows = [];
  for (const row of rows) {
    if (!seenUrls.has(row.preprocessedUrl)) {
      seenUrls.set(row.preprocessedUrl, row.pageId);
      unique.push(row);
    }
  }

  const toExport = unique.slice(0, LIMIT === Infinity ? undefined : LIMIT);

  console.log(`\n=== Roboflow Export ===`);
  console.log(`Pages with ≥${MIN_ROOMS} rooms : ${rows.length}`);
  console.log(`Unique source images     : ${unique.length}`);
  console.log(`Exporting                : ${toExport.length}`);
  console.log(`Output directory         : ${OUT_DIR}\n`);

  let ok = 0;
  let failed = 0;
  const manifest: string[] = [];

  for (let i = 0; i < toExport.length; i++) {
    const { pageId, preprocessedUrl, widthPx, heightPx, roomCount } = toExport[i];
    const outFile = path.join(OUT_DIR, `page_${pageId}.jpg`);
    process.stdout.write(`[${i + 1}/${toExport.length}] page ${pageId} (${roomCount} rooms, ${widthPx}×${heightPx}) ... `);

    try {
      let rawBuffer: Buffer;

      if (preprocessedUrl.startsWith('data:')) {
        rawBuffer = parseDataUrl(preprocessedUrl);
      } else {
        rawBuffer = await fetchImage(preprocessedUrl);
      }

      // Convert to JPEG — Roboflow handles JPEG well; also normalises PNGs
      await sharp(rawBuffer)
        .jpeg({ quality: 90 })
        .toFile(outFile);

      const stat = fs.statSync(outFile);
      console.log(`✓  ${(stat.size / 1024).toFixed(0)} KB`);
      manifest.push(`${outFile}\t${pageId}\t${roomCount}`);
      ok++;
    } catch (err) {
      console.log(`✗  ${(err as Error).message}`);
      failed++;
    }
  }

  // Write manifest
  const manifestPath = path.join(path.dirname(OUT_DIR), 'manifest.tsv');
  fs.writeFileSync(
    manifestPath,
    'file\tpageId\troomCount\n' + manifest.join('\n') + '\n'
  );

  console.log(`\n─────────────────────────────────`);
  console.log(`Done.  ${ok} exported,  ${failed} failed`);
  console.log(`Manifest : ${manifestPath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Go to app.roboflow.com/jose-acevedo/codecomply`);
  console.log(`  2. Upload: drag the images folder onto the Upload tab`);
  console.log(`  3. Annotate each room space with a single class "room"`);
  console.log(`     (use Smart Polygon tool — click inside each room)`);
  console.log(`  4. Train a new version once ≥30 images are annotated`);
  console.log(`  5. Update WORKFLOW_URL in server/services/roboflowSegmentationService.ts\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
