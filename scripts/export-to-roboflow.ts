/**
 * TRAINING-001: Export boundary_redraw corrections to Roboflow
 * for fine-tuning the floorplan-segmentation model.
 *
 * Usage: npx tsx scripts/export-to-roboflow.ts [--dry-run] [--limit N]
 *
 * --dry-run  Show what would be uploaded without uploading
 * --limit N  Process at most N examples (default: 50)
 */

import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { eq, isNull, and, not } from 'drizzle-orm';

// Load API key from .env.local — never hardcoded
function loadApiKey(): string {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      if (line.startsWith('ROBOFLOW_API_KEY=')) {
        return line.slice('ROBOFLOW_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  const fromEnv = process.env.ROBOFLOW_API_KEY ?? '';
  if (!fromEnv) throw new Error('ROBOFLOW_API_KEY not found in .env.local or environment');
  return fromEnv;
}

const UPLOAD_URL = 'https://api.roboflow.com/dataset/codecomply/upload';

async function uploadToRoboflow(
  apiKey: string,
  imageName: string,
  imageBuffer: Buffer,
): Promise<string> {
  const FormData = (await import('formdata-node')).FormData;
  const { Blob } = await import('buffer');

  const form = new FormData();
  form.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), imageName + '.jpg');

  const resp = await fetch(UPLOAD_URL + `?api_key=${encodeURIComponent(apiKey)}&name=${encodeURIComponent(imageName)}&split=train`, {
    method: 'POST',
    body: form as any,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Upload HTTP ${resp.status}: ${text}`);
  }
  const data: any = await resp.json();
  const imageId = data.id ?? data.duplicate_id;
  if (!imageId) throw new Error(`No image ID in response: ${JSON.stringify(data)}`);
  return imageId;
}

async function uploadAnnotation(
  apiKey: string,
  imageId: string,
  polygon: Array<{ x: number; y: number }>,
  imageWidth: number,
  imageHeight: number,
): Promise<void> {
  const normalized = polygon.map(pt => [
    Math.min(1, Math.max(0, pt.x / imageWidth)),
    Math.min(1, Math.max(0, pt.y / imageHeight)),
  ]);

  const annotation = {
    image: { id: imageId },
    annotations: [{
      label: 'room',
      type: 'polygon',
      points: normalized.map(([x, y]) => ({ x, y })),
    }],
  };

  const annUrl = `https://api.roboflow.com/dataset/codecomply/annotate/${imageId}`;
  const resp = await fetch(`${annUrl}?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(annotation),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    console.warn(`  [warn] Annotation upload HTTP ${resp.status}: ${text}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1] ?? '50', 10) : 50;

  console.log(`TRAINING-001 export${dryRun ? ' (DRY RUN)' : ''} — limit ${limit}`);

  const apiKey = loadApiKey();

  // Dynamic import of drizzle + db to avoid top-level ESM issues in tsx
  const { getDb } = await import('../server/db');
  const { trainingExamples, roomCorrections } = await import('../drizzle/schema');

  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // Query: boundary_redraw corrections with image crops not yet exported
  const rows = await db
    .select({
      id: trainingExamples.id,
      correctionId: trainingExamples.correctionId,
      imageCropBase64: trainingExamples.imageCropBase64,
    })
    .from(trainingExamples)
    .innerJoin(roomCorrections, eq(roomCorrections.id, trainingExamples.correctionId))
    .where(and(
      eq(roomCorrections.correctionType, 'boundary_redraw'),
      not(isNull(trainingExamples.imageCropBase64)),
      isNull(trainingExamples.exportedAt),
    ))
    .limit(limit);

  console.log(`Found ${rows.length} exportable examples`);

  let uploaded = 0, failed = 0, skipped = 0;

  for (const row of rows) {
    const cropB64 = row.imageCropBase64;
    if (!cropB64 || cropB64.length < 100) {
      console.log(`  [${row.id}] skip — empty crop`);
      skipped++;
      continue;
    }

    // Fetch the correction to get the polygon
    const [correction] = await db
      .select({ correctedValueJson: roomCorrections.correctedValueJson })
      .from(roomCorrections)
      .where(eq(roomCorrections.id, row.correctionId))
      .limit(1);

    if (!correction) {
      console.log(`  [${row.id}] skip — correction row missing`);
      skipped++;
      continue;
    }

    const correctedValue = correction.correctedValueJson as any;
    const polygon: Array<{ x: number; y: number }> = correctedValue?.polygon ?? [];
    if (polygon.length < 3) {
      console.log(`  [${row.id}] skip — polygon has ${polygon.length} points`);
      skipped++;
      continue;
    }

    const imageBuffer = Buffer.from(cropB64, 'base64');

    // Get image dimensions from the buffer
    let imgW = 0, imgH = 0;
    try {
      const { default: sharp } = await import('sharp');
      const meta = await sharp(imageBuffer).metadata();
      imgW = meta.width ?? 0;
      imgH = meta.height ?? 0;
    } catch {
      console.log(`  [${row.id}] skip — could not read image dimensions`);
      skipped++;
      continue;
    }

    if (!imgW || !imgH) {
      console.log(`  [${row.id}] skip — zero dimensions`);
      skipped++;
      continue;
    }

    // Polygon in correctedValue is in page-image coordinates.
    // The crop was taken from the page image at bbox with 20% padding.
    // Translate polygon points relative to the crop's top-left origin.
    const bbox = correctedValue?.boundingBox as { x: number; y: number; width: number; height: number } | undefined;
    let translatedPolygon = polygon;
    if (bbox) {
      const pad = 0.20;
      const cropLeft = Math.max(0, Math.floor(bbox.x - bbox.width * pad));
      const cropTop  = Math.max(0, Math.floor(bbox.y - bbox.height * pad));
      translatedPolygon = polygon.map(pt => ({
        x: pt.x - cropLeft,
        y: pt.y - cropTop,
      }));
    }

    const imageName = `training-correction-${row.id}`;
    console.log(`  [${row.id}] ${dryRun ? 'would upload' : 'uploading'} — ${polygon.length} pts, ${imgW}×${imgH}px`);

    if (dryRun) {
      skipped++;
      continue;
    }

    try {
      const imageId = await uploadToRoboflow(apiKey, imageName, imageBuffer);
      await uploadAnnotation(apiKey, imageId, translatedPolygon, imgW, imgH);

      await db
        .update(trainingExamples)
        .set({ exportedAt: new Date(), roboflowImageId: imageId })
        .where(eq(trainingExamples.id, row.id));

      console.log(`  [${row.id}] OK — roboflowImageId=${imageId}`);
      uploaded++;
    } catch (err) {
      console.error(`  [${row.id}] FAILED:`, (err as Error).message);
      failed++;
    }

    // Rate limit: 2 req/s
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone. uploaded=${uploaded} failed=${failed} skipped=${skipped}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
