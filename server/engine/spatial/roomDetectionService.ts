import { callAnthropicVision } from '../../services/anthropicVisionService';
import sharp from 'sharp';
import {
  ROOM_DETECTION_SYSTEM_PROMPT,
  ROOM_DETECTION_FEATURES,
  ROOM_DETECTION_JSON_SCHEMA,
} from './roomDetectionPrompt';
import type { RoomDetectionResult, DetectedRoom } from './types';
import { getDb } from '../../db';
import { detectedRooms, detectedFeatures } from '../../../drizzle/schema';
import { evaluateRoomCompliance } from './roomComplianceEvaluator';

const CONFIDENCE_THRESHOLD = 0.7;

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

  const userPrompt = `Analyze this architectural floor plan drawing.
${contextStr}

Detect ALL rooms, spaces, and architectural features.
Detection classes: ${ROOM_DETECTION_FEATURES.join(', ')}

Critical rules:
1. Use confidence < 0.7 for uncertain detections
2. Default to MORE RESTRICTIVE occupancy when ambiguous
3. Include ALL visible rooms — do not skip small spaces
4. BoundingBox coordinates in pixels from top-left corner
5. Area in square metres based on visible dimensions or scale bar`;

  const jpegBuffer = await sharp(Buffer.from(pageBase64, 'base64'))
    .jpeg({ quality: 85 })
    .toBuffer();
  const jpegBase64 = jpegBuffer.toString('base64');

  const { parsed, modelVersion } = await callAnthropicVision({
    imageBase64: jpegBase64,
    mimeType: 'image/jpeg',
    systemPrompt: ROOM_DETECTION_SYSTEM_PROMPT,
    userPrompt,
    jsonSchema: ROOM_DETECTION_JSON_SCHEMA as Record<string, unknown>,
    maxTokens: 4000,
  });

  const raw = parsed as { rooms?: unknown[]; metadata?: unknown };

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

  await saveRoomsToDb(rooms, pageId, projectId, province);
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
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

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
