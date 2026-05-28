/**
 * Wall Detection Service — Phase B2
 *
 * Filters raw PDF paths to identify wall segments.
 * Transforms coordinates from PDF space (bottom-left origin) to image pixel space (top-left origin).
 *
 * Y-axis flip is critical:
 *   imageX = pdfX * (imageWidth / pageWidthPts)
 *   imageY = (pageHeightPts - pdfY) * (imageHeight / pageHeightPts)
 */

import type { RawPath, Point } from "./vectorExtractionService";

export type WallOrientation = "horizontal" | "vertical" | "diagonal";

export interface WallSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thicknessPx: number;
  lengthPx: number;
  orientation: WallOrientation;
  confidence: number;
  source: "vector";
}

export interface WallTransformParams {
  pageWidthPts: number;
  pageHeightPts: number;
  imageWidthPx: number;
  imageHeightPx: number;
  cropRegion?: { x: number; y: number; width: number; height: number } | null;
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function hexLuminance(hex: string): number {
  if (!hex.startsWith("#") || hex.length < 7) return 0; // treat unknown as dark
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// ── Coordinate transform ──────────────────────────────────────────────────────

function transformPt(p: Point, params: WallTransformParams): { x: number; y: number } {
  const scaleX = params.imageWidthPx  / params.pageWidthPts;
  const scaleY = params.imageHeightPx / params.pageHeightPts;
  return {
    x: p.x * scaleX,
    y: (params.pageHeightPts - p.y) * scaleY,
  };
}

// ── Orientation classification ───────────────────────────────────────────────

function classifyOrientation(dx: number, dy: number): WallOrientation {
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (adx === 0 && ady === 0) return "horizontal";
  const angleDeg = Math.atan2(ady, adx) * (180 / Math.PI);
  if (angleDeg < 15)  return "horizontal";
  if (angleDeg > 75)  return "vertical";
  return "diagonal";
}

// ── Crop region check ─────────────────────────────────────────────────────────

function outsideCrop(
  x1: number, y1: number, x2: number, y2: number,
  crop: { x: number; y: number; width: number; height: number },
): boolean {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  return maxX < crop.x || minX > crop.x + crop.width ||
         maxY < crop.y || minY > crop.y + crop.height;
}

// ── Main detection ────────────────────────────────────────────────────────────

const MIN_STROKE_PT = 0.4;
const MIN_LENGTH_PX = 30;
const MAX_LUMINANCE = 0.7;

export function detectWalls(
  paths: RawPath[],
  params: WallTransformParams,
): WallSegment[] {
  const walls: WallSegment[] = [];
  const scaleX = params.imageWidthPx / params.pageWidthPts;

  for (const path of paths) {
    if (path.strokeWidth < MIN_STROKE_PT) continue;
    if (hexLuminance(path.strokeColor) > MAX_LUMINANCE) continue;
    if (path.points.length < 2) continue;

    for (let i = 0; i < path.points.length - 1; i++) {
      const s = transformPt(path.points[i],     params);
      const e = transformPt(path.points[i + 1], params);

      const dx = e.x - s.x;
      const dy = e.y - s.y;
      const lengthPx = Math.sqrt(dx * dx + dy * dy);

      if (lengthPx < MIN_LENGTH_PX) continue;
      if (params.cropRegion && outsideCrop(s.x, s.y, e.x, e.y, params.cropRegion)) continue;

      const widthScore  = Math.min(path.strokeWidth / 2.0, 1.0);
      const lengthScore = Math.min(lengthPx / 200, 1.0);
      const confidence  = widthScore * 0.4 + lengthScore * 0.6;

      walls.push({
        startX:      Math.round(s.x * 1000) / 1000,
        startY:      Math.round(s.y * 1000) / 1000,
        endX:        Math.round(e.x * 1000) / 1000,
        endY:        Math.round(e.y * 1000) / 1000,
        thicknessPx: Math.round(path.strokeWidth * scaleX * 1000) / 1000,
        lengthPx:    Math.round(lengthPx * 1000) / 1000,
        orientation: classifyOrientation(dx, dy),
        confidence:  Math.round(confidence * 1000) / 1000,
        source:      "vector",
      });
    }
  }

  return walls;
}
