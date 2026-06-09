import { callAnthropicVision } from '../../services/anthropicVisionService';
import sharp from 'sharp';
import {
  ROOM_DETECTION_SYSTEM_PROMPT,
  ROOM_DETECTION_FEATURES,
  buildRoomDetectionPrompt,
} from './roomDetectionPrompt';
import { extractLabelsFromImage, filterRoomLabels } from './azureOcrService';
import { extractLegend, formatLegendForPrompt } from './legendExtractor';
import { evaluateDetectionAccuracy } from './roomDetectionEvaluator';
import { getPromptTemplate, DrawingType } from './promptLibrary';
import type { RoomDetectionResult, DetectedRoom } from './types';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../../db';
import { detectedRooms, detectedFeatures, drawingPages } from '../../../drizzle/schema';
import { evaluateRoomCompliance } from './roomComplianceEvaluator';
import { polygonQueue } from '../../services/polygonQueue';
import { extractRoomPolygon } from '../../services/polygonExtractionService';
import { getTrainingExamples } from '../../services/correctionService';
import { buildContextBlock, type ExtractedSetContext } from '../../services/drawingSetContextService';

const CONFIDENCE_THRESHOLD = 0.7;
const CROP_LEFT_PCT = 0.20;
const CROP_TOP_PCT = 0.15;
const CLAUDE_VISION_MAX_PX = 1568;

interface PageRegion {
  top: number;
  height: number;
  label: string;
}

async function safeParseRoomJSON(raw: string): Promise<{ rooms: any[]; metadata: any }> {
  // First try clean parse
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    // Try to recover truncated JSON by finding last complete room
    console.warn('[RoomDetection] JSON truncated, attempting recovery...');
    const clean = raw.replace(/```json|```/g, '').trim();

    const roomsMatch = clean.match(/"rooms"\s*:\s*\[/);
    if (!roomsMatch) throw new Error('No rooms array found in response');

    const roomsStart = clean.indexOf('[', roomsMatch.index!);
    let depth = 0;
    let lastCompleteRoom = roomsStart;

    for (let i = roomsStart; i < clean.length; i++) {
      if (clean[i] === '{') depth++;
      if (clean[i] === '}') {
        depth--;
        if (depth === 0) lastCompleteRoom = i + 1;
      }
    }

    const recoveredRooms = clean.substring(roomsStart, lastCompleteRoom) + ']';
    try {
      const rooms = JSON.parse(recoveredRooms);
      console.warn('[RoomDetection] Recovered', rooms.length, 'rooms from truncated response');
      return { rooms, metadata: {} };
    } catch (e2) {
      throw new Error('Could not recover truncated JSON: ' + (e as Error).message);
    }
  }
}

export async function detectRoomsFromPage(
  pageBase64: string,
  pageId: number,
  projectId: number,
  pageNumber: number,
  projectContext?: {
    occupancyCode?: string;
    province?: string;
    buildingType?: string;
    drawingType?: DrawingType;
  },
  province: string = 'AB',
  cropRegion?: { x: number; y: number; width: number; height: number },
  orgId?: number | null,
  drawingSetContext?: ExtractedSetContext | null,
): Promise<RoomDetectionResult> {
  const startTime = Date.now();

  // Inject org-specific training examples into prompt context (org-first, global fallback)
  const drawingTypeForTraining = projectContext?.drawingType ?? 'auto';
  const trainingExamplesList = await getTrainingExamples(drawingTypeForTraining, orgId);

  const template = getPromptTemplate(projectContext?.drawingType ?? 'auto');
  const orgTrainingContext = trainingExamplesList.length > 0
    ? `\n\nLEARNED CORRECTIONS FROM THIS ORGANIZATION:\n${trainingExamplesList.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}\n`
    : '';

  const templateContext = template.id !== 'auto'
    ? `\nBUILDING TYPE: ${template.label}\n${template.systemHints}\n\nFEW-SHOT EXAMPLES:\n${template.fewShotExamples}\n${orgTrainingContext}`
    : orgTrainingContext;

  const jpegBuffer = await sharp(Buffer.from(pageBase64, 'base64'))
    .jpeg({ quality: 85 })
    .toBuffer();

  const { width: imgW = 0, height: imgH = 0 } = await sharp(jpegBuffer).metadata();
  console.log('[RoomDetection] Full image:', imgW, 'x', imgH, 'px');
  if (cropRegion) {
    console.log('[RoomDetection] User crop region active:', cropRegion);
  }

  // When user crop is active, bypass multi-region detection — use a single synthetic region
  const regions: PageRegion[] = cropRegion
    ? [{ top: 0, height: cropRegion.height, label: 'user_crop' }]
    : await detectPageRegions(jpegBuffer, imgW, imgH);

  const rawRooms: any[] = [];
  let modelVersion = '';
  let metadata: any = {};

  for (const region of regions) {
    let croppedBuffer: Buffer;
    let cropOffsetX: number;
    let cropOffsetY: number;
    let croppedW: number;
    let croppedH: number;

    if (cropRegion) {
      // User-defined region: extract exactly the requested rectangle, no margin crop
      croppedBuffer = await sharp(jpegBuffer)
        .extract({ left: cropRegion.x, top: cropRegion.y, width: cropRegion.width, height: cropRegion.height })
        .toBuffer();
      cropOffsetX = cropRegion.x;
      cropOffsetY = cropRegion.y;
      croppedW = cropRegion.width;
      croppedH = cropRegion.height;
    } else {
      const regionBuffer = await sharp(jpegBuffer)
        .extract({ left: 0, top: region.top, width: imgW, height: region.height })
        .toBuffer();
      cropOffsetY = Math.floor(region.height * CROP_TOP_PCT);
      cropOffsetX = Math.floor(imgW * CROP_LEFT_PCT);
      croppedH = region.height - cropOffsetY;
      croppedW = imgW - cropOffsetX;
      croppedBuffer = await sharp(regionBuffer)
        .extract({ left: cropOffsetX, top: cropOffsetY, width: croppedW, height: croppedH })
        .toBuffer();
    }

    const croppedBase64 = croppedBuffer.toString('base64');

    const longestDim = Math.max(croppedW, croppedH);
    const targetScale = longestDim > CLAUDE_VISION_MAX_PX ? CLAUDE_VISION_MAX_PX / longestDim : 1.0;
    const targetW = Math.max(1, Math.round(croppedW * targetScale));
    const targetH = Math.max(1, Math.round(croppedH * targetScale));

    let visionBuffer: Buffer;
    let scaleX: number;
    let scaleY: number;

    if (targetScale < 1.0) {
      visionBuffer = await sharp(croppedBuffer)
        .resize(targetW, targetH, { fit: 'fill' })
        .jpeg({ quality: 90 })
        .toBuffer();
      const meta = await sharp(visionBuffer).metadata();
      const actualVisionW = meta.width ?? targetW;
      const actualVisionH = meta.height ?? targetH;
      scaleX = actualVisionW / croppedW;
      scaleY = actualVisionH / croppedH;
      console.log(`[RoomDetection] Vision resize: { croppedW: ${croppedW}, croppedH: ${croppedH}, actualVisionW: ${actualVisionW}, actualVisionH: ${actualVisionH}, scaleX: ${scaleX.toFixed(4)}, scaleY: ${scaleY.toFixed(4)}, axisMatch: ${scaleX === scaleY} }`);
    } else {
      visionBuffer = croppedBuffer;
      scaleX = 1.0;
      scaleY = 1.0;
    }

    const visionBase64 = visionBuffer.toString('base64');

    let labelContext = '';
    let legendContext = '';
    let ocrLabelSet = new Set<string>();
    try {
      const ocrResult = await extractLabelsFromImage(croppedBase64, croppedW, croppedH);
      const legend = extractLegend(ocrResult.allLabels, croppedW, croppedH);
      legendContext = formatLegendForPrompt(legend);
      const roomLabels = filterRoomLabels(ocrResult.allLabels, croppedH, croppedW);
      ocrLabelSet = new Set(ocrResult.allLabels.map((l: any) => l.text.trim().toLowerCase()));
      if (roomLabels.length > 0) {
        labelContext =
          `\nAzure OCR has detected these room labels at these EXACT pixel coordinates:\n` +
          roomLabels.slice(0, 30).map(l => `- "${l.text}" at pixel (${l.x}, ${l.y})`).join('\n') +
          `\n\nYou MUST return a bounding box for EVERY label listed above. Do not skip any labels.\n` +
          `For every single label provided, return a bounding box entry.\n` +
          `If the label has a leader line/arrow, follow it to the room.\n` +
          `Place the bounding box around the WALLS of that room, not the label.\n` +
          `Use the label coordinates as anchor points to find the correct room.\n` +
          `If you cannot determine exact walls, use your best estimate with confidence < 0.7.\n` +
          `Skipping a labeled room is not acceptable — return ALL rooms.\n`;
      }
    } catch (err) {
      console.warn(`[RoomDetection] ${region.label} Azure OCR failed, proceeding without labels:`, err);
    }

    const userPrompt = buildRoomDetectionPrompt(croppedW, croppedH, labelContext, legendContext, templateContext, ocrLabelSet);

    const setContextPrefix = drawingSetContext
      ? buildContextBlock(drawingSetContext, pageNumber)
      : '';
    const effectiveSystemPrompt = setContextPrefix
      ? `${setContextPrefix}\n${ROOM_DETECTION_SYSTEM_PROMPT}`
      : ROOM_DETECTION_SYSTEM_PROMPT;

    const response = await callAnthropicVision({
      imageBase64: visionBase64,
      mimeType: 'image/jpeg',
      systemPrompt: effectiveSystemPrompt,
      userPrompt,
      jsonSchema: {},
      maxTokens: 16000,
    });

    modelVersion = response.modelVersion;
    const raw = await safeParseRoomJSON(response.rawText);
    metadata = raw.metadata ?? metadata;

    for (const r of raw.rooms ?? []) {
      if (r.boundingBox) {
        r.boundingBox.x = Math.round(r.boundingBox.x / scaleX) + cropOffsetX;
        r.boundingBox.y = Math.round(r.boundingBox.y / scaleY) + cropOffsetY + region.top;
        r.boundingBox.width = Math.round(r.boundingBox.width / scaleX);
        r.boundingBox.height = Math.round(r.boundingBox.height / scaleY);
      }
      for (const f of r.features ?? []) {
        if (f.position) {
          f.position.x = Math.round(f.position.x / scaleX) + cropOffsetX;
          f.position.y = Math.round(f.position.y / scaleY) + cropOffsetY + region.top;
        }
      }
      if (r.boundingBox) {
        const clampMaxX = cropRegion ? cropRegion.x + cropRegion.width : imgW;
        const clampMaxY = cropRegion ? cropRegion.y + cropRegion.height : imgH;
        const minX = cropRegion?.x ?? 0;
        const minY = cropRegion?.y ?? 0;
        r.boundingBox.x = Math.max(minX, Math.min(r.boundingBox.x, clampMaxX - 31));
        r.boundingBox.y = Math.max(minY, Math.min(r.boundingBox.y, clampMaxY - 20));
        r.boundingBox.width  = Math.max(31, Math.min(r.boundingBox.width,  clampMaxX - r.boundingBox.x));
        r.boundingBox.height = Math.max(20, Math.min(r.boundingBox.height, clampMaxY - r.boundingBox.y));
      }
      const labelLower = r.label?.trim().toLowerCase() ?? '';
      const isOcrMatch = ocrLabelSet.size === 0 ||
        ocrLabelSet.has(labelLower) ||
        [...ocrLabelSet].some(l => l.includes(labelLower) || labelLower.includes(l)) ||
        labelLower.startsWith('unlabeled') ||
        ['corridor', 'stair', 'hallway', 'lobby', 'common', 'circulation'].some(k => labelLower.includes(k));
      if (!isOcrMatch && (r.confidence ?? 1) < 0.75) {
        console.log(`[RoomDetection] Rejected hallucinated label "${r.label}"`);
        continue;
      }
      rawRooms.push(r);
    }
  }

  reduceOverlap(rawRooms);

  const rooms: DetectedRoom[] = rawRooms.map((r: any) => ({
    label: r.label ?? 'Unknown Room',
    boundingBox: r.boundingBox ?? { x: 0, y: 0, width: 0, height: 0 },
    areaSqm: r.areaSqm ?? 0,
    floorLevel: r.floorLevel ?? 'Ground Floor',
    occupancyGroup: r.occupancyGroup ?? 'D',
    occupancyDivision: r.occupancyDivision ?? null,
    confidence: Math.min(1, Math.max(0, r.confidence ?? 0.5)),
    features: r.features ?? [],
    flags: r.flags ?? [],
  }));

  const inBoundsRooms = rooms.filter(r => {
    const b = r.boundingBox;
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    if (cx < 0 || cx > imgW || cy < 0 || cy > imgH) return false;

    const clampedX = Math.max(0, b.x);
    const clampedY = Math.max(0, b.y);
    const clampedRight = Math.min(imgW, b.x + b.width);
    const clampedBottom = Math.min(imgH, b.y + b.height);
    const retainedArea = Math.max(0, clampedRight - clampedX) * Math.max(0, clampedBottom - clampedY);
    const totalArea = b.width * b.height;
    return totalArea > 0 && retainedArea / totalArea >= 0.5;
  });

  const rejectedOob = rooms.length - inBoundsRooms.length;
  if (rejectedOob > 0) {
    console.log(`[RoomDetection] Rejected ${rejectedOob} out-of-bounds room(s)`);
  }

  const MIN_W = Math.max(imgW * 0.008, 20);
  const MIN_H = Math.max(imgH * 0.007, 20);
  const sizedRooms = inBoundsRooms.filter(r => {
    if (r.boundingBox.width <= 0 || r.boundingBox.height <= 0 || r.boundingBox.width < MIN_W || r.boundingBox.height < MIN_H) {
      console.log(`[RoomDetection] Rejected undersized room "${r.label}" (${r.boundingBox.width}×${r.boundingBox.height}px vs min ${Math.round(MIN_W)}×${Math.round(MIN_H)})`);
      return false;
    }
    return true;
  });

  const filteredRooms = rejectKeyPlanRooms(
    sizedRooms,
    cropRegion ? cropRegion.width : imgW,
    cropRegion ? cropRegion.height : imgH,
  );

  const evalMimeType = pageBase64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
  evaluateDetectionAccuracy(filteredRooms, pageId, pageBase64, imgW, imgH, evalMimeType)
    .catch(err => console.error('[DetectionEval] Evaluation failed:', err));

  const flaggedForReview = filteredRooms.filter(r => r.confidence < CONFIDENCE_THRESHOLD);

  await saveRoomsToDb(filteredRooms, pageId, projectId, province, imgW, imgH, metadata?.scale ?? null, pageBase64);
  console.log('[RoomDetection] Saved', filteredRooms.length, 'rooms to DB for page', pageId);

  return {
    rooms: filteredRooms,
    metadata: (metadata ?? {}) as RoomDetectionResult['metadata'],
    pageNumber,
    modelVersion,
    processingTimeMs: Date.now() - startTime,
    flaggedForReview,
  };
}

function reduceOverlap(rooms: any[]): void {
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i].boundingBox;
      const b = rooms[j].boundingBox;
      if (!a || !b) continue;

      const overlapLeft  = Math.max(a.x, b.x);
      const overlapRight = Math.min(a.x + a.width, b.x + b.width);
      const overlapTop   = Math.max(a.y, b.y);
      const overlapBot   = Math.min(a.y + a.height, b.y + b.height);
      const overlapX     = Math.max(0, overlapRight - overlapLeft);
      const overlapY     = Math.max(0, overlapBot   - overlapTop);
      const overlapArea  = overlapX * overlapY;

      const aArea       = a.width * a.height;
      const bArea       = b.width * b.height;
      const smallerArea = Math.min(aArea, bArea);

      // Ignore tiny wall-thickness overlaps (< 8% of smaller room).
      // These are adjacent rooms sharing a wall — no adjustment needed.
      if (overlapArea <= smallerArea * 0.08) continue;

      // Determine dominant axis of overlap
      const dominantX = overlapX >= overlapY;

      // Adjacent rooms: overlap is real but both boxes are reasonable.
      // Snap both to the midpoint of the overlap seam — each room gives up
      // half the contested pixels rather than the larger room losing all of them.
      if (dominantX) {
        const mid = Math.round((overlapLeft + overlapRight) / 2);
        if (a.x < b.x) {
          // A is to the left — trim A's right edge, push B's left edge
          a.width = mid - a.x;
          const bRight = b.x + b.width;
          b.x = mid;
          b.width = bRight - mid;
        } else {
          // B is to the left — trim B's right edge, push A's left edge
          b.width = mid - b.x;
          const aRight = a.x + a.width;
          a.x = mid;
          a.width = aRight - mid;
        }
      } else {
        const mid = Math.round((overlapTop + overlapBot) / 2);
        if (a.y < b.y) {
          a.height = mid - a.y;
          const bBot = b.y + b.height;
          b.y = mid;
          b.height = bBot - mid;
        } else {
          b.height = mid - b.y;
          const aBot = a.y + a.height;
          a.y = mid;
          a.height = aBot - mid;
        }
      }
    }
  }
}

async function detectPageRegions(pageBuffer: Buffer, pageW: number, pageH: number): Promise<PageRegion[]> {
  const { data } = await sharp(pageBuffer).grayscale().raw().toBuffer({ resolveWithObject: true });
  const SCAN_BAND_HEIGHT = 20;
  const DARK_PIXEL_THRESHOLD = 128;
  const DIVIDER_DARK_PCT = 0.02;
  const MIN_REGION_HEIGHT_PCT = 0.15;
  const dividerYs: number[] = [];

  for (let y = 0; y < pageH - SCAN_BAND_HEIGHT; y += SCAN_BAND_HEIGHT) {
    let darkCount = 0;
    const bandPixels = pageW * SCAN_BAND_HEIGHT;
    for (let dy = 0; dy < SCAN_BAND_HEIGHT; dy++) {
      for (let x = 0; x < pageW; x++) {
        if (data[(y + dy) * pageW + x] < DARK_PIXEL_THRESHOLD) darkCount++;
      }
    }
    if (darkCount / bandPixels < DIVIDER_DARK_PCT) dividerYs.push(y + Math.floor(SCAN_BAND_HEIGHT / 2));
  }

  const mergedDividers = mergeAdjacentDividers(dividerYs, 40);
  const boundaries = [0, ...mergedDividers, pageH];
  const minRegionH = pageH * MIN_REGION_HEIGHT_PCT;
  const regions: PageRegion[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const top = boundaries[i];
    const height = boundaries[i + 1] - top;
    if (height >= minRegionH) regions.push({ top, height, label: `region_${i}` });
  }
  return regions.length > 0 ? regions : [{ top: 0, height: pageH, label: 'region_0' }];
}

function mergeAdjacentDividers(ys: number[], threshold: number): number[] {
  if (ys.length === 0) return [];
  const merged: number[] = [ys[0]];
  for (let i = 1; i < ys.length; i++) {
    if (ys[i] - merged[merged.length - 1] > threshold) merged.push(ys[i]);
  }
  return merged;
}


/**
 * Safety net: discard detections whose combined envelope covers < 3% of the
 * image area — a signal that Claude fixated on a tiny inset rather than the
 * main floor plan. The image is already pre-cropped to remove the top 20%
 * (where key plans live), so this threshold can be low.
 */
function rejectKeyPlanRooms(
  rooms: DetectedRoom[],
  imgW: number,
  imgH: number,
): DetectedRoom[] {
  if (rooms.length === 0 || imgW === 0 || imgH === 0) return rooms;

  const xs = rooms.flatMap(r => [r.boundingBox.x, r.boundingBox.x + r.boundingBox.width]);
  const ys = rooms.flatMap(r => [r.boundingBox.y, r.boundingBox.y + r.boundingBox.height]);
  const envelopeArea =
    (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
  const coverage = envelopeArea / (imgW * imgH);

  console.log(
    `[RoomDetection] Envelope: x=[${Math.min(...xs)},${Math.max(...xs)}] y=[${Math.min(...ys)},${Math.max(...ys)}]` +
    ` coverage=${Math.round(coverage * 100)}% on ${imgW}x${imgH} page`
  );

  if (coverage < 0.03) {
    console.warn(
      `[RoomDetection] Rooms envelope covers only ${Math.round(coverage * 100)}% of image` +
      ` — discarding ${rooms.length} room(s) as likely noise.` +
      ` First room bbox: ${JSON.stringify(rooms[0]?.boundingBox)}`
    );
    return [];
  }

  console.log(`[RoomDetection] Room envelope coverage: ${Math.round(coverage * 100)}% — accepted ${rooms.length} room(s).`);
  return rooms;
}

async function saveRoomsToDb(
  rooms: DetectedRoom[],
  pageId: number,
  projectId: number,
  province: string = 'AB',
  imgW: number = 0,
  imgH: number = 0,
  detectedScale: string | null = null,
  pageBase64: string = '',
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  // ── Path C: Save confirmed rooms before clearing page ─────────────────
  // Rooms with manualOverride = 1 have been corrected by the user.
  // Preserved across re-runs — fixes the "correct again" problem.
  const confirmedRooms = await db
    .select()
    .from(detectedRooms)
    .where(
      and(
        eq(detectedRooms.pageId, pageId),
        eq(detectedRooms.manualOverride, 1)
      )
    );
  const confirmedLabels = new Set(
    confirmedRooms
      .map(r => r.roomLabel?.toLowerCase().trim() ?? '')
      .filter(Boolean)
  );
  console.log('[RoomDetection] Preserving', confirmedRooms.length,
    'confirmed room(s) for page', pageId);
  // ── End Path C save ────────────────────────────────────────────────────

  // Delete stale results for this page before inserting fresh ones.
  // Features must go first (FK constraint), then rooms, then compliance rows.
  const existingRooms = await db
    .select({ id: detectedRooms.id })
    .from(detectedRooms)
    .where(eq(detectedRooms.pageId, pageId));

  if (existingRooms.length > 0) {
    const roomIds = existingRooms.map(r => r.id);
    for (const roomId of roomIds) {
      await db.delete(detectedFeatures).where(eq(detectedFeatures.roomId, roomId));
    }
    await db.delete(detectedRooms).where(eq(detectedRooms.pageId, pageId));
    console.log('[RoomDetection] Cleared', existingRooms.length, 'stale room(s) for page', pageId);
  }

  // ── Path C: Re-insert confirmed rooms after clearing ──────────────────
  for (const confirmed of confirmedRooms) {
    await db.insert(detectedRooms).values({
      pageId:            confirmed.pageId,
      projectId:         confirmed.projectId,
      roomLabel:         confirmed.roomLabel,
      boundingBoxJson:   confirmed.boundingBoxJson,
      polygonJson:       confirmed.polygonJson,
      polygonSource:     confirmed.polygonSource,
      areaSqm:           confirmed.areaSqm,
      floorLevel:        confirmed.floorLevel,
      occupancyGroup:    confirmed.occupancyGroup,
      occupancyDivision: confirmed.occupancyDivision,
      confidence:        confirmed.confidence,
      flagsJson:         confirmed.flagsJson,
      flaggedForReview:  0,
      manualOverride:    1,
      correctionCount:   confirmed.correctionCount,
      lastCorrectedAt:   confirmed.lastCorrectedAt,
      detectionMethod:   confirmed.detectionMethod ?? 'manual',
      seedX:             confirmed.seedX,
      seedY:             confirmed.seedY,
    });
  }
  // ── End Path C re-insert ───────────────────────────────────────────────

  // Backfill the page dimensions so the client can compute a scale factor
  if (imgW > 0 && imgH > 0) {
    await db.update(drawingPages)
      .set({ widthPx: imgW, heightPx: imgH, detectedScale: detectedScale ? detectedScale.substring(0, 100) : null })
      .where(eq(drawingPages.id, pageId));
  }

  for (const room of rooms) {
    // Path C: skip AI room if a confirmed correction exists for this label
    if (confirmedLabels.has(room.label?.toLowerCase().trim() ?? '')) {
      console.log('[RoomDetection] Skipping — confirmed correction exists:', room.label);
      continue;
    }

    const result = await db.insert(detectedRooms).values({
      pageId,
      projectId,
      roomLabel: room.label,
      boundingBoxJson: JSON.stringify(room.boundingBox),
      areaSqm: room.areaSqm.toFixed(2),
      floorLevel: room.floorLevel,
      occupancyGroup: room.occupancyGroup,
      occupancyDivision: room.occupancyDivision ?? null,
      confidence: room.confidence.toFixed(3),
      flagsJson: room.flags.length > 0 ? JSON.stringify(room.flags) : null,
      flaggedForReview: room.confidence < CONFIDENCE_THRESHOLD ? 1 : 0,
      manualOverride: 0,
    });

    const roomId = result[0].insertId;

    // Queue compliance evaluation (non-blocking)
    evaluateRoomCompliance(room, roomId, projectId, province)
      .catch(err => console.error('[RoomCompliance] Evaluation failed:', err));

    // Queue polygon extraction (non-blocking, lower priority)
    if (pageBase64) {
      const seed = {
        x: room.boundingBox.x + Math.floor(room.boundingBox.width / 2),
        y: room.boundingBox.y + Math.floor(room.boundingBox.height / 2),
      };
      const capturedRoomId = roomId;
      const capturedLabel = room.label;
      const capturedBbox = room.boundingBox;
      polygonQueue.add(async () => {
        const pageRows = await (await getDb())
          ?.select({ calibrationScale: drawingPages.calibrationScale })
          .from(drawingPages)
          .where(eq(drawingPages.id, pageId))
          .limit(1);
        const calibrationPxPerMm = pageRows?.[0]?.calibrationScale
          ? Number(pageRows[0].calibrationScale)
          : null;

        const result = await extractRoomPolygon(
          pageBase64,
          imgW,
          imgH,
          seed,
          calibrationPxPerMm,
          capturedBbox,
        );

        const db2 = await getDb();
        if (!db2) return;
        await db2.update(detectedRooms)
          .set({
            polygonJson: JSON.stringify(result.vertices),
            polygonSource: result.source,
            polygonExtractedAt: new Date(),
            polygonToBboxRatio: result.polygonToBboxRatio.toFixed(3),
            polygonLeakSuspected: result.leakSuspected ? 1 : 0,
            ...(result.areaSqm !== null ? { areaSqm: result.areaSqm.toFixed(2) } : {}),
          })
          .where(eq(detectedRooms.id, capturedRoomId));

        console.log(
          `[PolygonExtraction] Room "${capturedLabel}" — ${result.source}, ` +
          `${result.vertices.length} vertices, ` +
          `ratio=${result.polygonToBboxRatio.toFixed(2)}` +
          `${result.leakSuspected ? ' ⚠️ LEAK SUSPECTED' : ''}`
        );
      }).catch(err => console.error('[PolygonExtraction] Queue error:', err));
    }

    for (const feature of room.features) {
      await db.insert(detectedFeatures).values({
        roomId,
        featureType: feature.type,
        positionJson: JSON.stringify(feature.position),
        confidence: feature.confidence.toFixed(3),
        metadataJson: (feature.count !== undefined || feature.metadata)
          ? JSON.stringify({ count: feature.count, ...feature.metadata })
          : null,
      });
    }
  }
}
