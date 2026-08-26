/**
 * CodeComply Roboflow workflow client.
 *
 * Integrates the Roboflow workflow:
 *   codecomply-vcodecomply-15-rfdetr-seg-small-t1-logic
 *
 * Auth:
 * - Bearer token from ENV.roboflowApiKey
 * - Never use api_key query strings or request-body secrets
 *
 * The workflow endpoint is treated as the source of truth for the output
 * shape, so parsing is defensive and based on the returned payload rather
 * than on hard-coded field assumptions.
 */

import sharp from 'sharp';
import { ENV } from '../_core/env';
import { decodeRle, rleMaskToContour } from './rleDecoder';

interface Point {
  x: number;
  y: number;
}

export type WorkflowImageInput =
  | { type: 'url'; value: string }
  | { type: 'base64'; value: string };

export interface CodeComplyWorkflowPolygon {
  bbox: { x: number; y: number; width: number; height: number };
  vertices: Point[];
  confidence: number;
  class: string;
}

export interface CodeComplyWorkflowRun {
  outputs: Array<Record<string, unknown>>;
  firstOutput: Record<string, unknown>;
  outputKeys: string[];
  imageWidth: number;
  imageHeight: number;
  annotatedImageBuffer: Buffer | null;
}

export class CodeComplyWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeComplyWorkflowError';
  }
}

const WORKFLOW_URL =
  'https://serverless.roboflow.com/jose-acevedo/workflows/codecomply-vcodecomply-15-rfdetr-seg-small-t1-logic';
const TIMEOUT_MS = 30_000;
const RETRY_DELAYS_MS = [1_000, 2_000];
const CONFIDENCE_MIN = 0.35;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function findFirstPredictionWrapper(root: unknown): Record<string, unknown> | null {
  const queue: unknown[] = [root];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!isRecord(current) || seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current.predictions)) {
      return current;
    }

    for (const value of Object.values(current)) {
      if (typeof value === 'object' && value !== null) {
        queue.push(value);
      }
    }
  }

  return null;
}

function findFirstBase64ImageWrapper(root: unknown): string | null {
  const queue: unknown[] = [root];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!isRecord(current) || seen.has(current)) continue;
    seen.add(current);

    if (current.type === 'base64' && typeof current.value === 'string' && current.value.length > 0) {
      return current.value;
    }

    for (const value of Object.values(current)) {
      if (typeof value === 'object' && value !== null) {
        queue.push(value);
      }
    }
  }

  return null;
}

function normalizeVertices(
  pred: Record<string, unknown>,
  scaleX: number,
  scaleY: number,
): Point[] {
  const rawPoints =
    (Array.isArray(pred.points) && pred.points) ||
    (Array.isArray(pred.vertices) && pred.vertices) ||
    (Array.isArray(pred.polygon) && pred.polygon) ||
    [];

  const pointList = rawPoints
    .map((pt: unknown) => (isRecord(pt) ? { x: Number(pt.x ?? 0), y: Number(pt.y ?? 0) } : null))
    .filter((pt): pt is Point => Boolean(pt));

  if (pointList.length >= 3) {
    return pointList.map(pt => ({
      x: Math.round(pt.x * scaleX),
      y: Math.round(pt.y * scaleY),
    }));
  }

  const rle = isRecord(pred.rle_mask) ? pred.rle_mask : null;
  if (rle && (rle.counts !== undefined || rle.size !== undefined)) {
    const counts = rle.counts;
    const size = rle.size;
    if (typeof counts === 'string' && Array.isArray(size) && size.length === 2) {
      const [maskH, maskW] = size as [number, number];
      try {
        const mask = decodeRle(counts, maskH, maskW);
        const contour = rleMaskToContour(mask, maskW, maskH);
        if (contour.length >= 3) {
          return contour.map(pt => ({
            x: Math.round(pt.x * scaleX),
            y: Math.round(pt.y * scaleY),
          }));
        }
      } catch {
        // fall through to bbox fallback
      }
    }
  }

  const x = Number(pred.x ?? 0);
  const y = Number(pred.y ?? 0);
  const width = Number(pred.width ?? 0);
  const height = Number(pred.height ?? 0);

  const left = Math.round((x - width / 2) * scaleX);
  const top = Math.round((y - height / 2) * scaleY);
  const right = Math.round((x + width / 2) * scaleX);
  const bottom = Math.round((y + height / 2) * scaleY);

  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

function extractPolygonsFromOutput(
  output: Record<string, unknown>,
  inputWidth: number,
  inputHeight: number,
): CodeComplyWorkflowPolygon[] {
  const wrapper = findFirstPredictionWrapper(output);
  if (!wrapper) return [];

  const imageWidth = Number(isRecord(wrapper.image) ? wrapper.image.width ?? 0 : 0) || inputWidth;
  const imageHeight = Number(isRecord(wrapper.image) ? wrapper.image.height ?? 0 : 0) || inputHeight;
  const scaleX = imageWidth > 0 ? inputWidth / imageWidth : 1;
  const scaleY = imageHeight > 0 ? inputHeight / imageHeight : 1;
  const rawPredictions = Array.isArray(wrapper.predictions) ? wrapper.predictions : [];

  return rawPredictions
    .filter(isRecord)
    .filter(pred => Number(pred.confidence ?? 0) >= CONFIDENCE_MIN)
    .map(pred => ({
      bbox: {
        x: Math.round((Number(pred.x ?? 0) - Number(pred.width ?? 0) / 2) * scaleX),
        y: Math.round((Number(pred.y ?? 0) - Number(pred.height ?? 0) / 2) * scaleY),
        width: Math.round(Number(pred.width ?? 0) * scaleX),
        height: Math.round(Number(pred.height ?? 0) * scaleY),
      },
      vertices: normalizeVertices(pred, scaleX, scaleY),
      confidence: Number(pred.confidence ?? 0),
      class: String(pred.class ?? pred.name ?? 'room'),
    }))
    .filter(pred => pred.vertices.length >= 3);
}

async function attemptWorkflowRun(
  imageInput: WorkflowImageInput,
): Promise<CodeComplyWorkflowRun> {
  const response = await fetchWithTimeout(
    WORKFLOW_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENV.roboflowApiKey}`,
      },
      body: JSON.stringify({
        inputs: { image: imageInput },
      }),
    },
    TIMEOUT_MS,
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new CodeComplyWorkflowError(
      `Roboflow workflow HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
    );
  }

  const payload = (await response.json()) as {
    outputs?: Array<Record<string, unknown>>;
    profiler_trace?: unknown[];
  };

  const outputs = Array.isArray(payload.outputs)
    ? payload.outputs.filter(isRecord)
    : [];
  if (outputs.length === 0) {
    throw new CodeComplyWorkflowError('Roboflow workflow response missing outputs[0]');
  }

  const firstOutput = outputs[0];
  const outputKeys = Object.keys(firstOutput);
  const annotatedImageBase64 = findFirstBase64ImageWrapper(firstOutput);
  const annotatedImageBuffer = annotatedImageBase64
    ? Buffer.from(annotatedImageBase64, 'base64')
    : null;

  const predictionWrapper = findFirstPredictionWrapper(firstOutput);
  const imageWidth = predictionWrapper?.image && isRecord(predictionWrapper.image)
    ? Number(predictionWrapper.image.width ?? 0)
    : 0;
  const imageHeight = predictionWrapper?.image && isRecord(predictionWrapper.image)
    ? Number(predictionWrapper.image.height ?? 0)
    : 0;

  return {
    outputs,
    firstOutput,
    outputKeys,
    imageWidth,
    imageHeight,
    annotatedImageBuffer,
  };
}

export async function runCodeComplyWorkflow(
  imageInput: WorkflowImageInput,
): Promise<CodeComplyWorkflowRun> {
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await attemptWorkflowRun(imageInput);
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
      }
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new CodeComplyWorkflowError('Roboflow workflow failed without an Error object');
}

export async function runCodeComplyWorkflowFromBuffer(
  jpegBuffer: Buffer,
): Promise<CodeComplyWorkflowRun> {
  return runCodeComplyWorkflow({
    type: 'base64',
    value: jpegBuffer.toString('base64'),
  });
}

export async function getCodeComplyRoomPolygons(
  jpegBuffer: Buffer,
): Promise<CodeComplyWorkflowPolygon[]> {
  try {
    const inputMeta = await sharp(jpegBuffer).metadata();
    const inputWidth = inputMeta.width ?? 0;
    const inputHeight = inputMeta.height ?? 0;
    const result = await runCodeComplyWorkflowFromBuffer(jpegBuffer);
    return extractPolygonsFromOutput(result.firstOutput, inputWidth, inputHeight);
  } catch (firstErr) {
    console.warn(
      '[CodeComplyWorkflow] Workflow parsing failed — returning []:',
      (firstErr as Error).message,
    );
    return [];
  }
}

export { extractPolygonsFromOutput };
