/**
 * Export corrected room crops and door crops as a COCO segmentation dataset.
 *
 * This script exports only boundary_redraw / missing_room_add corrections
 * that have both a cropped room image and a corrected polygon.
 *
 * Usage:
 *   npx tsx server/scripts/export-corrections-roboflow.ts --dry-run
 *   npx tsx server/scripts/export-corrections-roboflow.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import { createConnection } from 'mysql2/promise';

type CorrectionType = 'boundary_redraw' | 'missing_room_add';

interface RawExportRow {
  correctionId: number;
  roomId: number;
  pageId: number;
  drawingId: number | null;
  correctionType: CorrectionType;
  correctedAt: string | Date;
  roomLabel: string | null;
  imageCropBase64: string | null;
  correctedValueJson: unknown;
  polygonJson: unknown;
}

interface LatestRoomRow extends RawExportRow {
  hasImage: boolean;
  hasPolygon: boolean;
}

interface CocoImage {
  id: number;
  file_name: string;
  width: number;
  height: number;
}

interface CocoAnnotation {
  id: number;
  image_id: number;
  category_id: number;
  segmentation: [number[]];
  bbox: [number, number, number, number];
  area: number;
  iscrowd: 0;
}

interface CocoManifest {
  info: {
    description: string;
    date_created: string;
  };
  categories: Array<
    | { id: 1; name: 'room'; supercategory: 'room' }
    | { id: 2; name: 'door'; supercategory: 'opening' }
  >;
  images: CocoImage[];
  annotations: CocoAnnotation[];
  licenses: [];
}

type Args = {
  dryRun: boolean;
};

const USER_HOME = process.env.HOME || '/Users/josedeoleo';
const EXPORT_ROOT = path.join(USER_HOME, 'Downloads', 'codecomply-corrections-export');
const IMAGES_DIR = path.join(EXPORT_ROOT, 'images');
const COCO_PATH = path.join(EXPORT_ROOT, '_annotations.coco.json');
const REPORT_PATH = path.join(EXPORT_ROOT, 'EXPORT_REPORT.md');

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
  const dryRun = argv.includes('--dry-run') || argv.includes('--dryRun');
  return { dryRun };
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

function decodeBase64Image(input: string): Buffer {
  const cleaned = input.trim().replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(cleaned, 'base64');
}

function slugify(label: string): string {
  const normalized = label
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'room';
}

function toNumber(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function extractBoundingBox(correctedValueJson: unknown): BoundingBox | null {
  const correctedValue = parseJson<{ boundingBox?: unknown }>(correctedValueJson);
  if (!correctedValue?.boundingBox) return null;
  const bbox = parseJson<BoundingBox>(correctedValue.boundingBox);
  if (!bbox) return null;

  const x = toNumber(bbox.x);
  const y = toNumber(bbox.y);
  const width = toNumber(bbox.width);
  const height = toNumber(bbox.height);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}

function transformPolygonToCrop(
  polygon: Array<{ x: number; y: number }>,
  bbox: BoundingBox,
): Array<{ x: number; y: number }> {
  return polygon.map(v => ({
    x: Math.max(0, Math.min(v.x - bbox.x, bbox.width)),
    y: Math.max(0, Math.min(v.y - bbox.y, bbox.height)),
  }));
}

function polygonHasThreeDistinctVertices(polygon: Array<{ x: number; y: number }>): boolean {
  const unique = new Set(polygon.map(v => `${Math.round(v.x * 1000) / 1000},${Math.round(v.y * 1000) / 1000}`));
  return unique.size >= 3;
}

function polygonToGeometry(polygon: Array<{ x: number; y: number }>): {
  segmentation: [number[]];
  bbox: [number, number, number, number];
  area: number;
} {
  const xs = polygon.map(pt => pt.x);
  const ys = polygon.map(pt => pt.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  const segmentation: [number[]] = [polygon.flatMap(pt => [pt.x, pt.y])];
  return {
    segmentation,
    bbox: [minX, minY, width, height],
    area: width * height,
  };
}

interface PageImageSource {
  preprocessedUrl: string | null;
  drawingUrl: string | null;
}

interface DoorFeatureRow {
  featureId: number;
  roomId: number | null;
  pageId: number;
  drawingId: number | null;
  featureType: string;
  source: string;
  exportedAt: string | Date | null;
  geometryJson: unknown;
  preprocessedUrl: string | null;
  drawingUrl: string | null;
}

function geometryToBoundingBox(
  polygon: Array<{ x: number; y: number }>,
  pad = 0.20,
): BoundingBox {
  const xs = polygon.map(pt => pt.x);
  const ys = polygon.map(pt => pt.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  return {
    x: Math.max(0, Math.floor(minX - width * pad)),
    y: Math.max(0, Math.floor(minY - height * pad)),
    width: Math.ceil(width * (1 + 2 * pad)),
    height: Math.ceil(height * (1 + 2 * pad)),
  };
}

async function captureImageCrop(
  imageUrl: string | null,
  bbox: BoundingBox,
): Promise<{ base64: string; cropBox: BoundingBox; width: number; height: number } | null> {
  if (!imageUrl) return null;

  const resp = await fetch(imageUrl);
  if (!resp.ok) return null;
  const buffer = Buffer.from(await resp.arrayBuffer());

  const metadata = await sharp(buffer).metadata();
  const imgW = metadata.width ?? 0;
  const imgH = metadata.height ?? 0;
  if (!imgW || !imgH) return null;

  const left = Math.min(Math.max(0, bbox.x), Math.max(0, imgW - 1));
  const top = Math.min(Math.max(0, bbox.y), Math.max(0, imgH - 1));
  const width = Math.min(imgW - left, Math.max(1, bbox.width));
  const height = Math.min(imgH - top, Math.max(1, bbox.height));
  if (width <= 0 || height <= 0) return null;

  const cropBuffer = await sharp(buffer)
    .extract({ left, top, width, height })
    .jpeg({ quality: 90 })
    .toBuffer();

  return {
    base64: cropBuffer.toString('base64'),
    cropBox: { x: left, y: top, width, height },
    width,
    height,
  };
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

  try {
    const [rowsForStatsRaw] = await conn.query(`
      SELECT
        rc.id AS correctionId,
        rc.roomId,
        rc.pageId,
        dp.drawingId,
        rc.correctionType,
        rc.correctedAt,
        dr.roomLabel,
        te.imageCropBase64 IS NOT NULL AS hasImage,
        dr.polygonJson IS NOT NULL AS hasPolygon
      FROM roomCorrections rc
      JOIN trainingExamples te
        ON te.correctionId = rc.id
      JOIN detectedRooms dr
        ON dr.id = rc.roomId
      LEFT JOIN drawingPages dp
        ON dp.id = rc.pageId
      WHERE rc.correctionType IN ('boundary_redraw', 'missing_room_add')
      ORDER BY rc.roomId ASC, rc.id DESC, te.id DESC
    `);

    const rowsForStats = rowsForStatsRaw as Array<{
      correctionId: number;
      roomId: number;
      pageId: number;
      drawingId: number | null;
      correctionType: CorrectionType;
      correctedAt: string | Date;
      roomLabel: string | null;
      hasImage: number | boolean;
      hasPolygon: number | boolean;
    }>;

    const latestAllByRoom = new Map<number, {
      correctionId: number;
      roomId: number;
      pageId: number;
      drawingId: number | null;
      correctionType: CorrectionType;
      correctedAt: string | Date;
      roomLabel: string | null;
      hasImage: boolean;
      hasPolygon: boolean;
    }>();
    for (const row of rowsForStats) {
      if (!latestAllByRoom.has(row.roomId)) {
        latestAllByRoom.set(row.roomId, {
          ...row,
          hasImage: Boolean(row.hasImage),
          hasPolygon: Boolean(row.hasPolygon),
        });
      }
    }

    const exportableRoomRows = [...latestAllByRoom.values()]
      .filter(row => row.hasImage && row.hasPolygon)
      .sort((a, b) => b.correctionId - a.correctionId);
    const exportableRoomIds = exportableRoomRows.map(row => row.correctionId);
    const duplicateRowsSkipped = rowsForStats.length - exportableRoomRows.length;

    const [roomDetailRowsRaw] = exportableRoomIds.length > 0
      ? await conn.query(`
        SELECT
          rc.id AS correctionId,
          rc.roomId,
          rc.pageId,
          dp.drawingId,
          rc.correctionType,
          rc.correctedAt,
          dr.roomLabel,
          te.imageCropBase64,
          rc.correctedValueJson,
          dr.polygonJson
        FROM roomCorrections rc
        JOIN trainingExamples te
          ON te.correctionId = rc.id
        JOIN detectedRooms dr
          ON dr.id = rc.roomId
        LEFT JOIN drawingPages dp
          ON dp.id = rc.pageId
        WHERE rc.id IN (?)
        ORDER BY rc.roomId ASC, rc.id DESC
      `, [exportableRoomIds])
      : [[]];

    const roomDetailRows = roomDetailRowsRaw as RawExportRow[];
    const roomDetailsById = new Map<number, RawExportRow>();
    for (const row of roomDetailRows) {
      roomDetailsById.set(row.correctionId, row);
    }

    const exportRows = exportableRoomRows
      .map(row => roomDetailsById.get(row.correctionId))
      .filter((row): row is RawExportRow => !!row)
      .sort((a, b) => b.correctionId - a.correctionId);

    let skippedNoImage = 0;
    let skippedNoPolygon = 0;
    let skippedBoth = 0;
    for (const row of latestAllByRoom.values()) {
      const hasImage = row.hasImage;
      const hasPolygon = row.hasPolygon;
      if (hasImage && hasPolygon) continue;
      if (!hasImage && !hasPolygon) skippedBoth++;
      else if (!hasImage) skippedNoImage++;
      else skippedNoPolygon++;
    }

    const exportTimestamp = Date.now();

    const [doorRowsRaw] = await conn.query(`
      SELECT
        df.id AS featureId,
        df.roomId,
        df.pageId,
        dp.drawingId,
        df.featureType,
        df.source,
        df.exportedAt,
        df.geometryJson,
        dp.preprocessedUrl,
        da.drawingUrl
      FROM detectedFeatures df
      LEFT JOIN drawingPages dp
        ON dp.id = df.pageId
      LEFT JOIN drawingAnalyses da
        ON da.id = dp.drawingId
      WHERE df.featureType = 'door'
        AND df.source = 'manual_annotation'
        AND df.exportedAt IS NULL
        AND df.geometryJson IS NOT NULL
        AND df.pageId IS NOT NULL
      ORDER BY df.id ASC
    `);

    const doorCandidates = doorRowsRaw as DoorFeatureRow[];
    const doorExportRows: Array<{
      featureId: number;
      roomId: number | null;
      pageId: number;
      drawingId: number | null;
      fileName: string;
      width: number;
      height: number;
      segmentation: [number[]];
      cocoBbox: [number, number, number, number];
      area: number;
      base64: string;
    }> = [];
    const doorSkipped: Array<{ featureId: number; reason: string }> = [];

    for (const row of doorCandidates) {
      const geometry = parseJson<Array<{ x: number; y: number }>>(row.geometryJson);
      if (!geometry || geometry.length < 3) {
        doorSkipped.push({ featureId: row.featureId, reason: 'missing or invalid geometryJson' });
        continue;
      }

      const bbox = geometryToBoundingBox(geometry);
      const crop = await captureImageCrop(row.preprocessedUrl ?? row.drawingUrl ?? null, bbox);
      if (!crop) {
        doorSkipped.push({ featureId: row.featureId, reason: 'missing or invalid page crop' });
        continue;
      }

      const clampedPolygon = transformPolygonToCrop(geometry, crop.cropBox);
      if (clampedPolygon.length < 3 || !polygonHasThreeDistinctVertices(clampedPolygon)) {
        console.log(`[Export] Skipped featureId=${row.featureId}: polygon collapses after crop-relative transform`);
        doorSkipped.push({ featureId: row.featureId, reason: 'polygon collapses after crop-relative transform' });
        continue;
      }

      const { segmentation, bbox: cocoBbox, area } = polygonToGeometry(clampedPolygon);
      const fileName = `cc_${exportTimestamp}_door_${row.featureId}.jpg`;

      doorExportRows.push({
        featureId: row.featureId,
        roomId: row.roomId,
        pageId: row.pageId,
        drawingId: row.drawingId,
        fileName,
        width: crop.width,
        height: crop.height,
        segmentation,
        cocoBbox,
        area,
        base64: crop.base64,
      });
    }

    console.log('=== Corrected-room Roboflow export ===');
    console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`);
    console.log(`Export root: ${EXPORT_ROOT}`);
    console.log(`Candidate rooms: ${latestAllByRoom.size}`);
    console.log(`Exportable rooms: ${exportRows.length}`);
    console.log(`Skipped rooms (no image): ${skippedNoImage}`);
    console.log(`Skipped rooms (no polygon): ${skippedNoPolygon}`);
    console.log(`Skipped rooms (missing both): ${skippedBoth}`);
    console.log(`Duplicate candidate rows skipped by roomId: ${duplicateRowsSkipped}`);
    console.log(`Correction types: boundary_redraw, missing_room_add`);
    console.log(`Candidate door features: ${doorCandidates.length}`);
    console.log(`Exportable doors: ${doorExportRows.length}`);
    console.log(`Skipped door features: ${doorSkipped.length}`);

    if (dryRun) {
      for (const row of exportRows.slice(0, 5)) {
        console.log(
          `DRY-RUN export roomId=${row.roomId} correctionId=${row.correctionId} ` +
          `label="${row.roomLabel ?? 'room'}" pageId=${row.pageId} drawingId=${row.drawingId ?? 'n/a'}`
        );
      }
      for (const row of doorExportRows.slice(0, 5)) {
        console.log(
          `DRY-RUN export featureId=${row.featureId} type=door pageId=${row.pageId} ` +
          `drawingId=${row.drawingId ?? 'n/a'} file=${row.fileName}`
        );
      }
      console.log('Dry run complete. No files written.');
      return;
    }

    fs.mkdirSync(IMAGES_DIR, { recursive: true });

    const images: CocoImage[] = [];
    const annotations: CocoAnnotation[] = [];
    const exportedRooms: Array<{
      roomId: number;
      correctionId: number;
      roomLabel: string;
      correctionType: CorrectionType;
      pageId: number;
      drawingId: number | null;
      fileName: string;
    }> = [];
    const skipped: Array<{ roomId: number; reason: string }> = [];

    for (const row of exportRows) {
      const polygon = parseJson<Array<{ x: number; y: number }>>(row.polygonJson);
      const imageCropBase64 = row.imageCropBase64;
      if (!imageCropBase64) {
        skipped.push({ roomId: row.roomId, reason: 'missing imageCropBase64' });
        continue;
      }
      if (!polygon || polygon.length < 3) {
        skipped.push({ roomId: row.roomId, reason: 'missing or invalid polygonJson' });
        continue;
      }

      const bbox = extractBoundingBox(row.correctedValueJson);
      if (!bbox) {
        skipped.push({ roomId: row.roomId, reason: 'missing or invalid boundingBox' });
        continue;
      }

      const clampedPolygon = transformPolygonToCrop(polygon, bbox);
      if (clampedPolygon.length < 3 || !polygonHasThreeDistinctVertices(clampedPolygon)) {
        console.log(`[Export] Skipped roomId=${row.roomId}: polygon collapses after crop-relative transform`);
        skipped.push({ roomId: row.roomId, reason: 'polygon collapses after crop-relative transform' });
        continue;
      }

      const imageBuffer = decodeBase64Image(imageCropBase64);
      const meta = await sharp(imageBuffer).metadata();
      const width = meta.width ?? 0;
      const height = meta.height ?? 0;
      if (width <= 0 || height <= 0) {
        skipped.push({ roomId: row.roomId, reason: 'invalid image dimensions' });
        continue;
      }

      const { segmentation, bbox: cocoBbox, area } = polygonToGeometry(clampedPolygon);
      const label = row.roomLabel?.trim() || 'room';
      const safeLabel = slugify(label);
      const fileName = `cc_${exportTimestamp}_${row.roomId}_${safeLabel}.jpg`;
      const imagePath = path.join(IMAGES_DIR, fileName);

      const jpegBuffer = await sharp(imageBuffer).jpeg({ quality: 92 }).toBuffer();
      fs.writeFileSync(imagePath, jpegBuffer);

      images.push({
        id: row.roomId,
        file_name: fileName,
        width,
        height,
      });

      annotations.push({
        id: annotations.length + 1,
        image_id: row.roomId,
        category_id: 1,
        segmentation,
        bbox: cocoBbox,
        area,
        iscrowd: 0,
      });

      exportedRooms.push({
        roomId: row.roomId,
        correctionId: row.correctionId,
        roomLabel: label,
        correctionType: row.correctionType,
        pageId: row.pageId,
        drawingId: row.drawingId,
        fileName,
      });
    }

    const exportedDoorFeatureIds: number[] = [];
    for (const row of doorExportRows) {
      const imagePath = path.join(IMAGES_DIR, row.fileName);
      const jpegBuffer = Buffer.from(row.base64, 'base64');
      fs.writeFileSync(imagePath, jpegBuffer);

      images.push({
        id: 1_000_000_000 + row.featureId,
        file_name: row.fileName,
        width: row.width,
        height: row.height,
      });

      annotations.push({
        id: annotations.length + 1,
        image_id: 1_000_000_000 + row.featureId,
        category_id: 2,
        segmentation: row.segmentation,
        bbox: row.cocoBbox,
        area: row.area,
        iscrowd: 0,
      });

      exportedDoorFeatureIds.push(row.featureId);
    }

    if (exportedDoorFeatureIds.length > 0) {
      await conn.query(
        `UPDATE detectedFeatures SET exportedAt = NOW() WHERE id IN (?)`,
        [exportedDoorFeatureIds],
      );
    }

    const coco: CocoManifest = {
      info: {
        description: 'CodeComply corrected rooms and doors',
        date_created: new Date().toISOString(),
      },
      categories: [
        { id: 1, name: 'room', supercategory: 'room' },
        { id: 2, name: 'door', supercategory: 'opening' },
      ],
      images,
      annotations,
      licenses: [],
    };

    fs.writeFileSync(COCO_PATH, JSON.stringify(coco, null, 2));

    const reportLines = [
      '# CodeComply corrected-room and door export report',
      '',
      `Date: ${new Date().toISOString()}`,
      `Export root: ${EXPORT_ROOT}`,
      `Rooms exported: ${exportedRooms.length}`,
      `Rooms skipped (no image or no polygon): ${skippedNoImage + skippedNoPolygon + skippedBoth}`,
      `Skipped no image: ${skippedNoImage}`,
      `Skipped no polygon: ${skippedNoPolygon}`,
      `Skipped missing both: ${skippedBoth}`,
      `Duplicate candidate rows skipped by roomId: ${duplicateRowsSkipped}`,
      `Correction types: boundary_redraw, missing_room_add`,
      `Door features exported: ${doorExportRows.length}`,
      `Door features skipped: ${doorSkipped.length}`,
      '',
      'Exported rooms:',
      ...exportedRooms.map(r =>
        `- roomId=${r.roomId} correctionId=${r.correctionId} label="${r.roomLabel}" ` +
        `type=${r.correctionType} pageId=${r.pageId} drawingId=${r.drawingId ?? 'n/a'} file=${r.fileName}`
      ),
      '',
      'Skipped rooms:',
      ...skipped.map(s => `- roomId=${s.roomId}: ${s.reason}`),
      '',
      'Exported doors:',
      ...doorExportRows.map(r =>
        `- featureId=${r.featureId} roomId=${r.roomId ?? 'n/a'} pageId=${r.pageId} ` +
        `drawingId=${r.drawingId ?? 'n/a'} file=${r.fileName}`
      ),
      '',
      'Skipped doors:',
      ...doorSkipped.map(s => `- featureId=${s.featureId}: ${s.reason}`),
    ];

    fs.writeFileSync(REPORT_PATH, reportLines.join('\n') + '\n');

    console.log(`Wrote ${images.length} images`);
    console.log(`Wrote ${annotations.length} annotations`);
    console.log(`Wrote ${COCO_PATH}`);
    console.log(`Wrote ${REPORT_PATH}`);
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
