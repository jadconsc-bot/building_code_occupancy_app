import sharp from 'sharp';

interface Point { x: number; y: number; }

export interface PolygonResult {
  vertices: Point[];
  areaPx: number;
  areaSqm: number | null;
  source: 'flood_fill' | 'fallback_bbox';
  bboxAreaPx: number;
  polygonToBboxRatio: number;
  leakSuspected: boolean;
}

async function cleanWalls(
  imageBase64: string,
  width: number,
  height: number,
): Promise<Uint8ClampedArray> {
  const buffer = Buffer.from(imageBase64, 'base64');
  const { data } = await sharp(buffer)
    .grayscale()
    .blur(3.0)
    .threshold(80)
    .blur(1.0)
    .threshold(128)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new Uint8ClampedArray(data);
}

function floodFill(
  wallPixels: Uint8ClampedArray,
  width: number,
  height: number,
  seed: Point,
  maxFillPx: number = Math.floor(width * height * 0.15),
): boolean[] {
  const filled = new Array(width * height).fill(false);
  const idx = (x: number, y: number) => y * width + x;
  const isPassable = (x: number, y: number) =>
    x >= 0 && x < width && y >= 0 && y < height &&
    wallPixels[idx(x, y)] > 128 &&
    !filled[idx(x, y)];

  if (!isPassable(seed.x, seed.y)) return filled;

  const queue: number[] = [idx(seed.x, seed.y)];
  filled[idx(seed.x, seed.y)] = true;
  let fillCount = 1;

  while (queue.length > 0 && fillCount < maxFillPx) {
    const current = queue.shift()!;
    const x = current % width;
    const y = Math.floor(current / width);

    const neighbors: [number, number][] = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of neighbors) {
      if (isPassable(nx, ny)) {
        const ni = idx(nx, ny);
        filled[ni] = true;
        queue.push(ni);
        fillCount++;
      }
    }
  }

  return filled;
}

function simplifyPolygon(points: Point[], tolerance: number): Point[] {
  if (points.length <= 4) return points;

  const perpendicularDistance = (p: Point, start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return Math.sqrt((p.x - start.x) ** 2 + (p.y - start.y) ** 2);
    return Math.abs(dy * p.x - dx * p.y + end.x * start.y - end.y * start.x) / len;
  };

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }

  if (maxDist > tolerance) {
    const left = simplifyPolygon(points.slice(0, maxIdx + 1), tolerance);
    const right = simplifyPolygon(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function extractContour(filled: boolean[], width: number, height: number): Point[] {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (filled[y * width + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX >= maxX || minY >= maxY) return [];

  const STEP = 4;
  const vertices: Point[] = [];

  // Top edge
  for (let x = minX; x <= maxX; x += STEP) {
    for (let y = minY; y <= maxY; y++) {
      if (filled[y * width + x]) { vertices.push({ x, y }); break; }
    }
  }
  // Right edge
  for (let y = minY; y <= maxY; y += STEP) {
    for (let x = maxX; x >= minX; x--) {
      if (filled[y * width + x]) { vertices.push({ x, y }); break; }
    }
  }
  // Bottom edge (reverse)
  for (let x = maxX; x >= minX; x -= STEP) {
    for (let y = maxY; y >= minY; y--) {
      if (filled[y * width + x]) { vertices.push({ x, y }); break; }
    }
  }
  // Left edge (reverse)
  for (let y = maxY; y >= minY; y -= STEP) {
    for (let x = minX; x <= maxX; x++) {
      if (filled[y * width + x]) { vertices.push({ x, y }); break; }
    }
  }

  return simplifyPolygon(vertices, 3.0);
}

export async function extractRoomPolygon(
  imageBase64: string,
  imageWidth: number,
  imageHeight: number,
  seedPoint: Point,
  calibrationPxPerMm: number | null,
  fallbackBoundingBox: { x: number; y: number; width: number; height: number },
): Promise<PolygonResult> {
  const bboxAreaPx = fallbackBoundingBox.width * fallbackBoundingBox.height;

  const makeBboxResult = (err?: unknown): PolygonResult => {
    if (err) console.warn('[PolygonExtraction] Flood fill failed, using bbox fallback:', err);
    const { x, y, width, height } = fallbackBoundingBox;
    const vertices = [
      { x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height },
    ];
    const areaPx = bboxAreaPx;
    let areaSqm: number | null = null;
    if (calibrationPxPerMm !== null && calibrationPxPerMm > 0) {
      areaSqm = areaPx / (calibrationPxPerMm * calibrationPxPerMm) / 1_000_000;
    }
    return { vertices, areaPx, areaSqm, source: 'fallback_bbox',
             bboxAreaPx, polygonToBboxRatio: 1.0, leakSuspected: false };
  };

  try {
    const wallPixels = await cleanWalls(imageBase64, imageWidth, imageHeight);
    const filled = floodFill(wallPixels, imageWidth, imageHeight, seedPoint);
    const fillCount = filled.filter(Boolean).length;

    const minFillPx = imageWidth * imageHeight * 0.001;
    const maxFillPx = imageWidth * imageHeight * 0.20;
    if (fillCount < minFillPx || fillCount > maxFillPx) {
      throw new Error(`Fill count ${fillCount} outside expected range [${Math.round(minFillPx)}, ${Math.round(maxFillPx)}]`);
    }

    const polygonToBboxRatio = bboxAreaPx > 0 ? fillCount / bboxAreaPx : 1.0;
    // ratio > 2.5: polygon far exceeds bbox → flood-fill leak almost certain
    if (polygonToBboxRatio > 2.5) {
      console.warn(
        `[PolygonExtraction] Leak suspected (ratio=${polygonToBboxRatio.toFixed(2)} > 2.5), using bbox fallback`
      );
      return makeBboxResult();
    }

    const vertices = extractContour(filled, imageWidth, imageHeight);
    if (vertices.length < 4) throw new Error('Insufficient contour vertices');

    const areaPx = fillCount;
    let areaSqm: number | null = null;
    if (calibrationPxPerMm !== null && calibrationPxPerMm > 0) {
      areaSqm = areaPx / (calibrationPxPerMm * calibrationPxPerMm) / 1_000_000;
    }

    // ratio < 0.4: polygon much smaller than bbox → extraction may have failed
    const leakSuspected = polygonToBboxRatio < 0.4;

    return { vertices, areaPx, areaSqm, source: 'flood_fill',
             bboxAreaPx, polygonToBboxRatio, leakSuspected };

  } catch (err) {
    return makeBboxResult(err);
  }
}
