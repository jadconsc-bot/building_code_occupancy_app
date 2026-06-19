// POLYGON-D-001: Roboflow Floorplan Segmentation integration.
// Calls the floorplan-segmentation-imdze/4 model for pixel-accurate room polygons.
// INV-1: Never throws — returns [] on any failure.
// INV-4: API key sourced from ENV.roboflowApiKey only.
// INV-5: output_image (annotated base64) is discarded immediately.

import { ENV } from '../_core/env';
import { decodeRle, rleMaskToContour } from './rleDecoder';

interface Point { x: number; y: number; }

export interface RoboflowRoomPolygon {
  bbox: { x: number; y: number; width: number; height: number };
  vertices: Point[];
  confidence: number;
  class: string;
}

// Bbox type for IoU calculation (top-left origin, width/height)
interface Bbox { x: number; y: number; w: number; h: number; }

export function bboxIou(a: Bbox, b: Bbox): number {
  const interX = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const interY = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = interX * interY;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

const WORKFLOW_URL =
  'https://serverless.roboflow.com/jose-acevedo/workflows/floorplan-segmentation-1781153513487';
const CONFIDENCE_MIN = 0.35;
const TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function attemptCall(jpegBuffer: Buffer, imgW: number, imgH: number): Promise<RoboflowRoomPolygon[]> {
  const b64 = jpegBuffer.toString('base64');

  const resp = await fetchWithTimeout(
    WORKFLOW_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: ENV.roboflowApiKey,
        inputs: { image: { type: 'base64', value: b64 } },
      }),
    },
    TIMEOUT_MS,
  );

  if (!resp.ok) {
    throw new Error(`Roboflow HTTP ${resp.status}`);
  }

  const data = await resp.json() as any;
  // INV-5: discard output_image immediately — never stored or logged
  const outputs = data?.outputs?.[0] ?? {};
  const { output_image: _discarded, ...rest } = outputs; // eslint-disable-line @typescript-eslint/no-unused-vars

  const predsWrapper = rest.predictions ?? {};
  const predList: any[] = predsWrapper.predictions ?? [];
  const rfImgW: number = predsWrapper.image?.width ?? imgW;
  const rfImgH: number = predsWrapper.image?.height ?? imgH;

  // Section 2.3: coordinate scale restoration if Roboflow resized internally
  const scaleX = rfImgW > 0 ? imgW / rfImgW : 1;
  const scaleY = rfImgH > 0 ? imgH / rfImgH : 1;

  const polygons: RoboflowRoomPolygon[] = [];

  for (const pred of predList) {
    if ((pred.confidence ?? 0) < CONFIDENCE_MIN) continue;

    const rle = pred.rle_mask;
    if (!rle?.counts || !rle?.size) continue;

    const [rleH, rleW] = rle.size as [number, number];

    let mask: Uint8Array;
    try {
      mask = decodeRle(String(rle.counts), rleH, rleW);
    } catch (err) {
      console.warn('[Roboflow] RLE decode failed for prediction:', err);
      continue;
    }

    const vertices = rleMaskToContour(mask, rleW, rleH);
    if (vertices.length < 4) continue; // INV-2

    // Restore coordinates to imgW×imgH space
    const scaledVertices = vertices.map(v => ({
      x: Math.round(v.x * scaleX),
      y: Math.round(v.y * scaleY),
    }));

    // bbox from prediction is center-x/y; convert to top-left origin
    const bboxX = Math.round((pred.x - pred.width / 2) * scaleX);
    const bboxY = Math.round((pred.y - pred.height / 2) * scaleY);
    const bboxW = Math.round(pred.width * scaleX);
    const bboxH = Math.round(pred.height * scaleY);

    polygons.push({
      bbox: { x: bboxX, y: bboxY, width: bboxW, height: bboxH },
      vertices: scaledVertices,
      confidence: pred.confidence,
      class: pred.class,
    });
  }

  return polygons;
}

/**
 * POLYGON-D-001: Call Roboflow Floorplan Segmentation workflow and
 * return polygon vertices for each detected room.
 *
 * Returns an empty array on any failure (INV-1 — never throws).
 * Coordinates are in the input image's pixel space (imgW × imgH).
 */
export async function getRoboflowPolygons(
  jpegBuffer: Buffer,
  imgW: number,
  imgH: number,
): Promise<RoboflowRoomPolygon[]> {
  try {
    return await attemptCall(jpegBuffer, imgW, imgH);
  } catch (firstErr) {
    // 1 retry with 2-second backoff
    console.warn('[Roboflow] First attempt failed, retrying in 2s:', (firstErr as Error).message);
    await new Promise(r => setTimeout(r, 2000));
    try {
      return await attemptCall(jpegBuffer, imgW, imgH);
    } catch (finalErr) {
      console.warn('[Roboflow] Both attempts failed — falling through to flood fill:', (finalErr as Error).message);
      return [];
    }
  }
}
