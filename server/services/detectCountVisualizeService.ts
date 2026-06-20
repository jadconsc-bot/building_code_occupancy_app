/**
 * Roboflow "Detect, Count, and Visualize" workflow client.
 *
 * Workflow: jose-acevedo/detect-count-and-visualize-2
 * Model:    codecomply/8  (instance segmentation, single class "room", mAP 74.94%)
 *
 * Outputs (grounded from live API call):
 *   count_objects   — integer count of detected rooms
 *   predictions     — { image: {width,height}, predictions: DetectionPrediction[] }
 *   output_image    — base64 annotated PNG (polygon + label overlays)
 *
 * INV-1: Never throws — returns null on any failure.
 * INV-2: output_image is decoded to a Buffer and never held as a string.
 * INV-3: polygon points are stripped from returned predictions (large payload).
 * INV-4: API key sourced from ENV.roboflowApiKey only.
 */

import { ENV } from '../_core/env';

// ── Types (modelled on real API response) ────────────────────────────────────

/** Bounding box uses center-origin format as returned by the Roboflow API. */
export interface DetectionPrediction {
  /** Center x in image pixels */
  x: number;
  /** Center y in image pixels */
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
}

export interface DetectCountVisualizeResult {
  /** Number of rooms detected */
  count: number;
  /** Source image dimensions reported by the model */
  imageWidth: number;
  imageHeight: number;
  /** Detected rooms (polygon points stripped per INV-3) */
  predictions: DetectionPrediction[];
  /** Annotated PNG as a Buffer, or null if the output was absent/invalid */
  annotatedImageBuffer: Buffer | null;
}

// ── Config ───────────────────────────────────────────────────────────────────

const WORKFLOW_URL =
  'https://serverless.roboflow.com/jose-acevedo/workflows/detect-count-and-visualize-2';
const TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;

// ── Internal helpers ─────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

type ImageInput =
  | { type: 'url'; value: string }
  | { type: 'base64'; value: string };

async function attemptRun(
  imageInput: ImageInput,
): Promise<DetectCountVisualizeResult> {
  const body = JSON.stringify({
    api_key: ENV.roboflowApiKey,
    inputs: { image: imageInput },
  });

  const resp = await fetchWithTimeout(
    WORKFLOW_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
    TIMEOUT_MS,
  );

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Roboflow HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }

  const data = (await resp.json()) as {
    outputs: Array<{
      count_objects?: number;
      // output_image is wrapped: { type: "base64", value: "<data>", video_metadata: {...} }
      output_image?: { type?: string; value?: string } | string;
      predictions?: {
        image?: { width: number; height: number };
        predictions?: Array<Record<string, unknown>>;
      };
    }>;
  };

  const output = data?.outputs?.[0];
  if (!output) throw new Error('Roboflow response missing outputs[0]');

  // Decode annotated image to Buffer immediately (INV-2).
  // The API wraps the image: { type:"base64", value:"<data>", video_metadata:{...} }
  let annotatedImageBuffer: Buffer | null = null;
  const imgField = output.output_image;
  const imgBase64 =
    typeof imgField === 'string'
      ? imgField
      : typeof imgField === 'object' && imgField?.type === 'base64' && typeof imgField.value === 'string'
        ? imgField.value
        : null;
  if (imgBase64 && imgBase64.length > 0) {
    annotatedImageBuffer = Buffer.from(imgBase64, 'base64');
  }

  const predWrapper = output.predictions ?? {};
  const imgMeta = predWrapper.image ?? { width: 0, height: 0 };
  const rawPreds: Array<Record<string, unknown>> = predWrapper.predictions ?? [];

  // Strip polygon points (INV-3) and map to typed predictions
  const predictions: DetectionPrediction[] = rawPreds.map(p => ({
    x: Number(p.x ?? 0),
    y: Number(p.y ?? 0),
    width: Number(p.width ?? 0),
    height: Number(p.height ?? 0),
    confidence: Number(p.confidence ?? 0),
    class: String(p.class ?? ''),
    class_id: Number(p.class_id ?? 0),
    detection_id: String(p.detection_id ?? ''),
    // points intentionally omitted (INV-3)
  }));

  return {
    count: Number(output.count_objects ?? predictions.length),
    imageWidth: imgMeta.width,
    imageHeight: imgMeta.height,
    predictions,
    annotatedImageBuffer,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the "Detect, Count, and Visualize" workflow on a floor plan image.
 *
 * @param imageInput  URL (https only) or base64-encoded JPEG/PNG
 * @returns           Detection result, or null on any failure (INV-1)
 */
export async function runDetectCountVisualize(
  imageInput: ImageInput,
): Promise<DetectCountVisualizeResult | null> {
  try {
    return await attemptRun(imageInput);
  } catch (firstErr) {
    console.warn(
      '[DetectCountVisualize] First attempt failed, retrying in 2s:',
      (firstErr as Error).message,
    );
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    try {
      return await attemptRun(imageInput);
    } catch (finalErr) {
      console.warn(
        '[DetectCountVisualize] Both attempts failed:',
        (finalErr as Error).message,
      );
      return null;
    }
  }
}

/**
 * Convenience wrapper: run the workflow from a JPEG Buffer.
 * Converts to base64 before calling the API.
 */
export async function runDetectCountVisualizeFromBuffer(
  jpegBuffer: Buffer,
): Promise<DetectCountVisualizeResult | null> {
  return runDetectCountVisualize({
    type: 'base64',
    value: jpegBuffer.toString('base64'),
  });
}

// ── Room polygon adapter (for roomDetectionService matching pipeline) ─────────

interface Point { x: number; y: number; }

/** RoboflowRoomPolygon shape expected by roomDetectionService IoU matching. */
export interface DcvRoomPolygon {
  bbox: { x: number; y: number; width: number; height: number }; // top-left origin
  vertices: Point[];
  confidence: number;
  class: string;
}

/**
 * Call detect-count-and-visualize-2 (codecomply/8) and return results in the same
 * RoboflowRoomPolygon shape that roomDetectionService uses for IoU matching.
 * Points are kept here (not stripped) so polygonJson can be persisted.
 * Returns [] on any failure (INV-1 variant).
 */
export async function getDcvRoomPolygons(
  jpegBuffer: Buffer,
): Promise<DcvRoomPolygon[]> {
  try {
    const b64 = jpegBuffer.toString('base64');
    const body = JSON.stringify({
      api_key: ENV.roboflowApiKey,
      inputs: { image: { type: 'base64', value: b64 } },
    });

    const resp = await fetchWithTimeout(
      WORKFLOW_URL,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
      TIMEOUT_MS,
    );
    if (!resp.ok) throw new Error(`Roboflow HTTP ${resp.status}`);

    const data = (await resp.json()) as {
      outputs: Array<{
        predictions?: {
          image?: { width: number; height: number };
          predictions?: Array<Record<string, unknown>>;
        };
      }>;
    };

    const rawPreds: Array<Record<string, unknown>> =
      data?.outputs?.[0]?.predictions?.predictions ?? [];

    return rawPreds
      .filter(p => (p.confidence as number ?? 0) >= 0.35)
      .map(p => {
        // API returns center-format bbox; convert to top-left origin
        const cx = Number(p.x ?? 0);
        const cy = Number(p.y ?? 0);
        const w  = Number(p.width ?? 0);
        const h  = Number(p.height ?? 0);
        const rawPoints = Array.isArray(p.points) ? p.points as Array<{x:number;y:number}> : [];
        return {
          bbox: { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), width: Math.round(w), height: Math.round(h) },
          vertices: rawPoints.map(pt => ({ x: Math.round(pt.x), y: Math.round(pt.y) })),
          confidence: Number(p.confidence ?? 0),
          class: String(p.class ?? 'room'),
        };
      });
  } catch (firstErr) {
    console.warn('[DCV] First attempt failed, retrying in 2s:', (firstErr as Error).message);
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    try {
      // Retry via public function (points stripped is fine if retry also fails)
      const b64 = jpegBuffer.toString('base64');
      const body = JSON.stringify({
        api_key: ENV.roboflowApiKey,
        inputs: { image: { type: 'base64', value: b64 } },
      });
      const resp = await fetchWithTimeout(
        WORKFLOW_URL,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
        TIMEOUT_MS,
      );
      if (!resp.ok) throw new Error(`Roboflow HTTP ${resp.status}`);
      const data = (await resp.json()) as { outputs: Array<{ predictions?: { predictions?: Array<Record<string,unknown>> } }> };
      const rawPreds = data?.outputs?.[0]?.predictions?.predictions ?? [];
      return (rawPreds as Array<Record<string,unknown>>)
        .filter(p => (p.confidence as number ?? 0) >= 0.35)
        .map(p => {
          const cx = Number(p.x ?? 0), cy = Number(p.y ?? 0), w = Number(p.width ?? 0), h = Number(p.height ?? 0);
          const rawPoints = Array.isArray(p.points) ? p.points as Array<{x:number;y:number}> : [];
          return {
            bbox: { x: Math.round(cx - w/2), y: Math.round(cy - h/2), width: Math.round(w), height: Math.round(h) },
            vertices: rawPoints.map(pt => ({ x: Math.round(pt.x), y: Math.round(pt.y) })),
            confidence: Number(p.confidence ?? 0),
            class: String(p.class ?? 'room'),
          };
        });
    } catch (finalErr) {
      console.warn('[DCV] Both attempts failed — returning []:', (finalErr as Error).message);
      return [];
    }
  }
}
