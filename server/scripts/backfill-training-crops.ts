/**
 * Backfill imageCropBase64 for historical boundary_redraw training examples.
 *
 * Usage:
 *   npx tsx server/scripts/backfill-training-crops.ts --dry-run
 *   npx tsx server/scripts/backfill-training-crops.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { createConnection } from 'mysql2/promise';

type CorrectionType = 'boundary_redraw';

interface BackfillRow {
  teId: number;
  correctionId: number;
  roomId: number;
  pageId: number;
  roomLabel: string | null;
  preprocessedUrl: string | null;
  correctedValueJson: unknown;
  createdAt: string | Date;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Args {
  dryRun: boolean;
}

function loadLocalEnv(): void {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function parseArgs(argv: string[]): Args {
  return {
    dryRun: argv.includes('--dry-run') || argv.includes('--dryRun'),
  };
}

function parseJson<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractBoundingBox(correctedValueJson: unknown): BoundingBox | null {
  const correctedValue = parseJson<{ boundingBox?: unknown }>(correctedValueJson);
  if (!correctedValue?.boundingBox) return null;
  const bbox = parseJson<BoundingBox>(correctedValue.boundingBox);
  if (!bbox) return null;

  const x = Number(bbox.x);
  const y = Number(bbox.y);
  const width = Number(bbox.width);
  const height = Number(bbox.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }

  if (width <= 0 || height <= 0) return null;

  return { x, y, width, height };
}

function decodeBase64Image(input: string): Buffer {
  const cleaned = input.trim().replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(cleaned, 'base64');
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  loadLocalEnv();
  const { dryRun } = parseArgs(process.argv.slice(2));

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set');
  }

  const match = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(?:\?.*)?$/);
  if (!match) {
    throw new Error('DATABASE_URL is not a supported MySQL URL');
  }

  const conn = await createConnection({
    host: match[3],
    port: Number(match[4]),
    user: match[1],
    password: match[2],
    database: match[5],
    ssl: { rejectUnauthorized: false },
  });

  const exportRoot = path.join(os.homedir(), 'Downloads', 'codecomply-corrections-export');
  const tempPreviewDir = path.join(exportRoot, '_backfill-preview');

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let processed = 0;

  try {
    const [rows] = await conn.query(`
      SELECT
        te.id AS teId,
        rc.id AS correctionId,
        rc.roomId,
        rc.pageId,
        dr.roomLabel,
        dp.preprocessedUrl,
        rc.correctedValueJson,
        te.createdAt
      FROM trainingExamples te
      JOIN roomCorrections rc
        ON te.correctionId = rc.id
      JOIN drawingPages dp
        ON rc.pageId = dp.id
      LEFT JOIN detectedRooms dr
        ON dr.id = rc.roomId
      WHERE te.imageCropBase64 IS NULL
        AND rc.correctionType = 'boundary_redraw'
        AND rc.pageId IS NOT NULL
        AND dp.preprocessedUrl IS NOT NULL
      ORDER BY te.id ASC
    `);

    const candidates = rows as BackfillRow[];
    const total = candidates.length;

    console.log('=== Backfill training crops ===');
    console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`);
    console.log(`Candidates: ${total}`);
    console.log(`Export root: ${exportRoot}`);

    if (dryRun && total > 0) {
      fs.mkdirSync(tempPreviewDir, { recursive: true });
    }

    for (let i = 0; i < candidates.length; i++) {
      const row = candidates[i];
      processed++;
      console.log(`[Backfill] Processing ${i + 1}/${total}: te.id=${row.teId}`);
      console.log(`  room=${row.roomLabel ?? 'Unknown'} pageId=${row.pageId}`);

      const bbox = extractBoundingBox(row.correctedValueJson);
      if (!bbox) {
        skipped++;
        console.log(`[Backfill] Skipped te.id=${row.teId}: missing or invalid boundingBox`);
        continue;
      }

      if (!row.preprocessedUrl) {
        skipped++;
        console.log(`[Backfill] Skipped te.id=${row.teId}: missing preprocessedUrl`);
        continue;
      }

      if (dryRun) {
        console.log(
          `[Backfill] Dry-run would backfill te.id=${row.teId} ` +
          `with bbox x=${bbox.x} y=${bbox.y} w=${bbox.width} h=${bbox.height}`
        );
        continue;
      }

      try {
        const imageBuffer = await fetchImageBuffer(row.preprocessedUrl);
        if (!imageBuffer) {
          skipped++;
          console.log(`[Backfill] Skipped te.id=${row.teId}: image fetch returned non-200`);
          await sleep(200);
          continue;
        }

        const meta = await sharp(imageBuffer).metadata();
        const imgW = meta.width ?? 0;
        const imgH = meta.height ?? 0;
        if (!imgW || !imgH) {
          skipped++;
          console.log(`[Backfill] Skipped te.id=${row.teId}: invalid source image dimensions`);
          await sleep(200);
          continue;
        }

        const left = Math.max(0, Math.floor(bbox.x));
        const top = Math.max(0, Math.floor(bbox.y));
        const width = Math.min(imgW - left, Math.ceil(bbox.width));
        const height = Math.min(imgH - top, Math.ceil(bbox.height));

        if (width <= 0 || height <= 0) {
          skipped++;
          console.log(`[Backfill] Skipped te.id=${row.teId}: crop dimensions out of bounds`);
          await sleep(200);
          continue;
        }

        const cropBuffer = await sharp(imageBuffer)
          .extract({ left, top, width, height })
          .jpeg({ quality: 85 })
          .toBuffer();

        const cropBase64 = cropBuffer.toString('base64');
        await conn.query(
          'UPDATE trainingExamples SET imageCropBase64 = ? WHERE id = ?',
          [cropBase64, row.teId],
        );

        updated++;
        console.log(`[Backfill] Updated te.id=${row.teId} (${cropBuffer.length} bytes)`);
      } catch (err) {
        errors++;
        const message = err instanceof Error ? err.message : String(err);
        console.log(`[Backfill] Skipped te.id=${row.teId}: ${message}`);
      } finally {
        await sleep(200);
      }
    }

    console.log('=== Backfill summary ===');
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total processed: ${processed}`);

    if (dryRun) {
      console.log('Dry run complete. No DB updates were written.');
    }
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
