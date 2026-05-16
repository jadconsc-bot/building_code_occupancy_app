import { callAnthropicVision } from '../../services/anthropicVisionService';
import sharp from 'sharp';
import {
  ROOM_DETECTION_SYSTEM_PROMPT,
  ROOM_DETECTION_FEATURES,
} from './roomDetectionPrompt';
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
  },
  province: string = 'AB',
): Promise<RoomDetectionResult> {
  const startTime = Date.now();

  const contextStr = projectContext
    ? `Project context: Occupancy ${projectContext.occupancyCode ?? 'unknown'}, Province ${projectContext.province ?? 'unknown'}, Building type ${projectContext.buildingType ?? 'unknown'}. Use this to focus classification.`
    : '';

  // Convert to JPEG so we can read exact pixel dimensions before building the prompt.
  const jpegBuffer = await sharp(Buffer.from(pageBase64, 'base64'))
    .jpeg({ quality: 85 })
    .toBuffer();

  const { width: imgW = 0, height: imgH = 0 } = await sharp(jpegBuffer).metadata();
  console.log('[RoomDetection] Full image:', imgW, 'x', imgH, 'px');

  // Crop the top 20% to eliminate the key plan thumbnail area.
  // Architectural drawings almost always place the key plan in the top-left corner;
  // the main floor plan occupies the lower portion of the page.
  const cropOffsetY = Math.floor(imgH * 0.20);
  const croppedH = imgH - cropOffsetY;
  const croppedBuffer = await sharp(jpegBuffer)
    .extract({ left: 0, top: cropOffsetY, width: imgW, height: croppedH })
    .toBuffer();
  const croppedBase64 = croppedBuffer.toString('base64');
  console.log('[RoomDetection] Sending cropped image to Claude:', imgW, 'x', croppedH, 'px (offset y=', cropOffsetY, ')');

  const userPrompt = `Analyze this architectural floor plan drawing.
${contextStr}

Detect ALL rooms, spaces, and architectural features visible in this floor plan.
Detection classes: ${ROOM_DETECTION_FEATURES.join(', ')}

Critical rules:
1. Use confidence < 0.7 for uncertain detections
2. Default to MORE RESTRICTIVE occupancy when ambiguous
3. Include ALL visible rooms — do not skip small spaces
4. IMPORTANT: This image is exactly ${imgW}×${croppedH} pixels. All boundingBox coordinates MUST be in this pixel space: x values 0–${imgW}, y values 0–${croppedH}. Do NOT use a scaled-down coordinate system.
5. Area in square metres based on visible dimensions or scale bar
6. If the page has multiple floor plan drawings (e.g. Unit A and Unit B layouts), detect rooms in all of them

Return JSON: {"rooms":[{"label":"string","boundingBox":{"x":0,"y":0,"width":0,"height":0},"areaSqm":0,"floorLevel":"string","occupancyGroup":"A|B|C|D|E|F","occupancyDivision":null,"confidence":0.0,"features":[{"type":"string","position":{"x":0,"y":0},"confidence":0.0}],"flags":[]}],"metadata":{"drawingType":"string","scale":"string","floorLevel":"string","totalDetectedArea":0,"northArrow":false,"dimensionsVisible":false,"language":"en","drawingQuality":"string"}}`;

  const { rawText, modelVersion } = await callAnthropicVision({
    imageBase64: croppedBase64,
    mimeType: 'image/jpeg',
    systemPrompt: ROOM_DETECTION_SYSTEM_PROMPT,
    userPrompt,
    jsonSchema: {},
    maxTokens: 8000,
  });

  const raw = await safeParseRoomJSON(rawText);

  const rooms: DetectedRoom[] = (raw.rooms ?? []).map((r: any) => ({
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
  const filteredRooms = rejectKeyPlanRooms(rooms, imgW, croppedH);

  // Restore Y coordinates from cropped-image space to full-image space.
  for (const room of filteredRooms) {
    room.boundingBox.y += cropOffsetY;
    for (const feature of room.features) {
      if (feature.position) feature.position.y += cropOffsetY;
    }
  }

  const flaggedForReview = filteredRooms.filter(r => r.confidence < CONFIDENCE_THRESHOLD);

  // Save with full image dimensions so the client scale factor is correct.
  await saveRoomsToDb(filteredRooms, pageId, projectId, province, imgW, imgH);
  console.log('[RoomDetection] Saved', filteredRooms.length, 'rooms to DB for page', pageId);

  return {
    rooms: filteredRooms,
    metadata: (raw.metadata ?? {}) as RoomDetectionResult['metadata'],
    pageNumber,
    modelVersion,
    processingTimeMs: Date.now() - startTime,
    flaggedForReview,
  };
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
