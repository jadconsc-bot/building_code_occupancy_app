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

  // Convert first so we can read the exact pixel dimensions before building the prompt.
  // Claude Vision internally downscales large images; injecting the true dimensions
  // forces it to return bounding box coordinates in the original pixel space.
  const jpegBuffer = await sharp(Buffer.from(pageBase64, 'base64'))
    .jpeg({ quality: 85 })
    .toBuffer();
  const jpegBase64 = jpegBuffer.toString('base64');

  const { width: imgW = 0, height: imgH = 0 } = await sharp(jpegBuffer).metadata();
  console.log('[RoomDetection] Image sent to Claude:', imgW, 'x', imgH, 'px');

  const userPrompt = `Analyze this architectural floor plan drawing.
${contextStr}

Detect ALL rooms, spaces, and architectural features.
Detection classes: ${ROOM_DETECTION_FEATURES.join(', ')}

Critical rules:
1. Use confidence < 0.7 for uncertain detections
2. Default to MORE RESTRICTIVE occupancy when ambiguous
3. Include ALL visible rooms — do not skip small spaces
4. IMPORTANT: This image is exactly ${imgW}×${imgH} pixels. All boundingBox coordinates MUST be in this pixel space: x values 0–${imgW}, y values 0–${imgH}. Do NOT use a scaled-down coordinate system.
5. Area in square metres based on visible dimensions or scale bar

Return JSON: {"rooms":[{"label":"string","boundingBox":{"x":0,"y":0,"width":0,"height":0},"areaSqm":0,"floorLevel":"string","occupancyGroup":"A|B|C|D|E|F","occupancyDivision":null,"confidence":0.0,"features":[{"type":"string","position":{"x":0,"y":0},"confidence":0.0}],"flags":[]}],"metadata":{"drawingType":"string","scale":"string","floorLevel":"string","totalDetectedArea":0,"northArrow":false,"dimensionsVisible":false,"language":"en","drawingQuality":"string"}}`;


  const { rawText, modelVersion } = await callAnthropicVision({
    imageBase64: jpegBase64,
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

  const flaggedForReview = rooms.filter(r => r.confidence < CONFIDENCE_THRESHOLD);

  await saveRoomsToDb(rooms, pageId, projectId, province, imgW, imgH);
  console.log('[RoomDetection] Saved', rooms.length, 'rooms to DB for page', pageId);

  return {
    rooms,
    metadata: (raw.metadata ?? {}) as RoomDetectionResult['metadata'],
    pageNumber,
    modelVersion,
    processingTimeMs: Date.now() - startTime,
    flaggedForReview,
  };
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
