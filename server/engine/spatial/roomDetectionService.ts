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
import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { detectedRooms, detectedFeatures, drawingPages } from '../../../drizzle/schema';
import { evaluateRoomCompliance } from './roomComplianceEvaluator';

const CONFIDENCE_THRESHOLD = 0.7;

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
): Promise<RoomDetectionResult> {
  const startTime = Date.now();

  const template = getPromptTemplate(projectContext?.drawingType ?? 'auto');
  const templateContext = template.id !== 'auto'
    ? `\nBUILDING TYPE: ${template.label}\n${template.systemHints}\n\nFEW-SHOT EXAMPLES:\n${template.fewShotExamples}\n`
    : '';

  // Convert to JPEG so we can read exact pixel dimensions before building the prompt.
  const jpegBuffer = await sharp(Buffer.from(pageBase64, 'base64'))
    .jpeg({ quality: 85 })
    .toBuffer();

  const { width: imgW = 0, height: imgH = 0 } = await sharp(jpegBuffer).metadata();
  console.log('[RoomDetection] Full image:', imgW, 'x', imgH, 'px');

  // Crop the top 15% and left 20% to eliminate the key plan.
  // Key plans are almost always in the top-left column of the sheet;
  // the main floor plan occupies the lower-center/right area.
  // Both offsets are restored after detection so saved coords are in full-image space.
  const cropOffsetY = Math.floor(imgH * 0.15);
  const cropOffsetX = Math.floor(imgW * 0.20);
  const croppedH = imgH - cropOffsetY;
  const croppedW = imgW - cropOffsetX;
  const croppedBuffer = await sharp(jpegBuffer)
    .extract({ left: cropOffsetX, top: cropOffsetY, width: croppedW, height: croppedH })
    .toBuffer();
  const croppedBase64 = croppedBuffer.toString('base64');
  console.log(
    `[RoomDetection] Sending cropped image to Claude: ${croppedW}x${croppedH} px` +
    ` (offset x=${cropOffsetX}, y=${cropOffsetY})`
  );

  // Pass 1: Azure OCR — extract legend + room labels with precise pixel coordinates
  let labelContext = '';
  let legendContext = '';
  try {
    const ocrResult = await extractLabelsFromImage(croppedBase64, croppedW, croppedH);

    // Pass 1a: extract drawing legend from ALL labels before room filtering
    const legend = extractLegend(ocrResult.allLabels, croppedW, croppedH);
    legendContext = formatLegendForPrompt(legend);
    console.log(`[RoomDetection] Legend extracted: hasLegend=${legend.hasLegend}, abbreviations=${Object.keys(legend.abbreviations).length}`);

    // Pass 1b: filter to room labels only
    const roomLabels = filterRoomLabels(ocrResult.allLabels, croppedH, croppedW);
    console.log(`[RoomDetection] Azure OCR found ${roomLabels.length} room labels`);
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
    console.warn('[RoomDetection] Azure OCR failed, proceeding without labels:', err);
  }

  // Pass 2: Claude Vision — legend context first, then label anchors
  const userPrompt = buildRoomDetectionPrompt(croppedW, croppedH, labelContext, legendContext, templateContext);

  const { rawText, modelVersion } = await callAnthropicVision({
    imageBase64: croppedBase64,
    mimeType: 'image/jpeg',
    systemPrompt: ROOM_DETECTION_SYSTEM_PROMPT,
    userPrompt,
    jsonSchema: {},
    maxTokens: 16000,
  });

  const raw = await safeParseRoomJSON(rawText);

  // Claude Vision internally downscales images to max 1568px on the longest side.
  // Coordinates come back in that downscaled space even when the prompt specifies
  // full pixel dimensions.  Scale them back to cropped-image pixel space before
  // any further processing.
  const rawRooms: any[] = raw.rooms ?? [];
  if (rawRooms.length > 0) {
    const maxX = Math.max(...rawRooms.map((r: any) => (r.boundingBox?.x ?? 0) + (r.boundingBox?.width ?? 0)));
    const maxY = Math.max(...rawRooms.map((r: any) => (r.boundingBox?.y ?? 0) + (r.boundingBox?.height ?? 0)));
    console.log(`[RoomDetection] Raw coord range: maxX=${maxX} maxY=${maxY} vs cropped ${croppedW}x${croppedH}`);

    const CLAUDE_MAX_DIMENSION = 1568;
    const claudeScale = Math.min(CLAUDE_MAX_DIMENSION / croppedW, CLAUDE_MAX_DIMENSION / croppedH);
    // Claude sometimes returns coords in its internal downscaled space (~1568px max),
    // and sometimes in full pixel space (when OCR label anchors calibrate it).
    // If maxX is above 1800 it's already in full-image space — skip correction.
    const needsCorrection = maxX <= 1800;
    const coordScale = (claudeScale < 1 && needsCorrection) ? 1 / claudeScale : 1.0;
    console.log(`[RoomDetection] Claude internal scale: ${claudeScale.toFixed(3)}, coord correction: ${coordScale.toFixed(2)}x (maxX=${maxX}, needsCorrection=${needsCorrection})`);

    if (coordScale > 1.0) {
      for (const r of rawRooms) {
        if (r.boundingBox) {
          r.boundingBox.x = Math.round(r.boundingBox.x * coordScale);
          r.boundingBox.y = Math.round(r.boundingBox.y * coordScale);
          r.boundingBox.width = Math.round(r.boundingBox.width * coordScale);
          r.boundingBox.height = Math.round(r.boundingBox.height * coordScale);
        }
        for (const f of r.features ?? []) {
          if (f.position) {
            f.position.x = Math.round(f.position.x * coordScale);
            f.position.y = Math.round(f.position.y * coordScale);
          }
        }
      }
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

  // Envelope check against cropped dimensions (Claude's coordinate space).
  const filteredRooms = rejectKeyPlanRooms(rooms, croppedW, croppedH);

  // Restore X and Y coordinates from cropped-image space to full-image space.
  for (const room of filteredRooms) {
    room.boundingBox.x += cropOffsetX;
    room.boundingBox.y += cropOffsetY;
    for (const feature of room.features) {
      if (feature.position) {
        feature.position.x += cropOffsetX;
        feature.position.y += cropOffsetY;
      }
    }
  }

  const flaggedForReview = filteredRooms.filter(r => r.confidence < CONFIDENCE_THRESHOLD);

  // Save with full image dimensions so the client scale factor is correct.
  await saveRoomsToDb(filteredRooms, pageId, projectId, province, imgW, imgH);
  console.log('[RoomDetection] Saved', filteredRooms.length, 'rooms to DB for page', pageId);

  // Non-blocking LLM-judge accuracy eval — logs results, does not block response
  evaluateDetectionAccuracy(filteredRooms, pageId, croppedBase64, croppedW, croppedH)
    .catch(err => console.error('[DetectionEval] Evaluation failed:', err));

  return {
    rooms: filteredRooms,
    metadata: (raw.metadata ?? {}) as RoomDetectionResult['metadata'],
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
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

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

  // Backfill the page dimensions so the client can compute a scale factor
  if (imgW > 0 && imgH > 0) {
    await db.update(drawingPages)
      .set({ widthPx: imgW, heightPx: imgH })
      .where(eq(drawingPages.id, pageId));
  }

  for (const room of rooms) {
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
