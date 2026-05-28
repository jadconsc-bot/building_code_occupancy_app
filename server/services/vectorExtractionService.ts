/**
 * Vector Extraction Service — Phase B1
 *
 * Extracts raw drawing commands from a PDF page using pdfjs-dist OPS operator list.
 * Returns RawPath[] in PDF coordinate space (origin bottom-left, y increases up).
 *
 * Prime Directive: deterministic geometry only. No LLM involvement.
 */

import * as pdfjsLib from "pdfjs-dist";

export interface Point {
  x: number;
  y: number;
}

export type RawPathType = "line" | "polyline" | "rect" | "curve";

export interface RawPath {
  pathType: RawPathType;
  points: Point[];           // in PDF pt coordinate space
  strokeWidth: number;       // in pt
  strokeColor: string;       // "#rrggbb"
  fillColor: string;         // "none" or "#rrggbb"
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface VectorExtractionResult {
  paths: RawPath[];
  pageWidthPts: number;
  pageHeightPts: number;
  pathCount: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function computeBBox(points: Point[]): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function classifyPathType(points: Point[], isRect: boolean): RawPathType {
  if (isRect) return "rect";
  if (points.length === 2) return "line";
  return "polyline";
}

export async function extractVectorPaths(
  pdfBase64: string,
  pageNumber: number,    // 1-based
): Promise<VectorExtractionResult> {
  const pdfData = Buffer.from(
    pdfBase64.replace(/^data:[^;]+;base64,/, ""),
    "base64",
  );

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfData),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  } as any);

  const pdfDoc   = await loadingTask.promise;
  const page     = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.0 });
  const pageWidthPts  = viewport.width;
  const pageHeightPts = viewport.height;

  const ops      = await page.getOperatorList();
  const { OPS }  = pdfjsLib;

  const paths: RawPath[] = [];

  let currentStrokeWidth = 1.0;
  let currentStrokeColor = "#000000";
  let currentFillColor   = "none";

  let currentPoints: Point[] = [];
  let currentIsRect          = false;

  const emitPath = (hasFill: boolean) => {
    if (currentPoints.length < 2) {
      currentPoints = [];
      currentIsRect = false;
      return;
    }
    paths.push({
      pathType:    classifyPathType(currentPoints, currentIsRect),
      points:      [...currentPoints],
      strokeWidth: currentStrokeWidth,
      strokeColor: currentStrokeColor,
      fillColor:   hasFill ? currentFillColor : "none",
      boundingBox: computeBBox(currentPoints),
    });
    currentPoints = [];
    currentIsRect = false;
  };

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn   = ops.fnArray[i];
    const args = ops.argsArray[i] as any[];

    switch (fn) {
      case OPS.setLineWidth:
        currentStrokeWidth = args[0] ?? 1.0;
        break;

      case OPS.setStrokeRGBColor:
      case OPS.setStrokeColorN: {
        const [r, g, b] = args;
        if (typeof r === "number" && typeof g === "number" && typeof b === "number") {
          currentStrokeColor = rgbToHex(r, g, b);
        }
        break;
      }

      case OPS.setFillRGBColor:
      case OPS.setFillColorN: {
        const [r, g, b] = args;
        if (typeof r === "number" && typeof g === "number" && typeof b === "number") {
          currentFillColor = rgbToHex(r, g, b);
        }
        break;
      }

      case OPS.moveTo:
        currentPoints = [{ x: args[0], y: args[1] }];
        currentIsRect = false;
        break;

      case OPS.lineTo:
        currentPoints.push({ x: args[0], y: args[1] });
        break;

      case OPS.curveTo: {
        // Approximate cubic bezier — use endpoint (args: x1,y1,x2,y2,x3,y3)
        const endX = args[args.length - 2];
        const endY = args[args.length - 1];
        if (typeof endX === "number" && typeof endY === "number") {
          currentPoints.push({ x: endX, y: endY });
        }
        break;
      }

      case OPS.rectangle: {
        const [rx, ry, rw, rh] = args as number[];
        currentPoints = [
          { x: rx,      y: ry },
          { x: rx + rw, y: ry },
          { x: rx + rw, y: ry + rh },
          { x: rx,      y: ry + rh },
          { x: rx,      y: ry },
        ];
        currentIsRect = true;
        break;
      }

      case OPS.closePath:
        if (currentPoints.length > 0) {
          currentPoints.push({ ...currentPoints[0] });
        }
        break;

      case OPS.stroke:
        emitPath(false);
        break;

      case OPS.fill:
        emitPath(true);
        break;

      case OPS.fillStroke:
      case OPS.eoFillStroke:
        emitPath(true);
        break;

      case OPS.endPath:
        currentPoints = [];
        currentIsRect = false;
        break;
    }
  }

  await pdfDoc.destroy();

  return { paths, pageWidthPts, pageHeightPts, pathCount: paths.length };
}
