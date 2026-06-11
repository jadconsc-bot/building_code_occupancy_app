// POLYGON-D-001: COCO RLE decoder — pure TypeScript, no dependencies.
// Handles COCO compressed RLE format (character-encoded run lengths).

interface Point { x: number; y: number; }

/**
 * Decode a COCO compressed RLE string into absolute run lengths.
 * Handles both uncompressed (digit/space) and COCO compressed (char-encoded) formats.
 */
function decodeCounts(countsStr: string): number[] {
  if (/^[\d\s]+$/.test(countsStr)) {
    return countsStr.trim().split(/\s+/).map(Number);
  }
  // COCO compressed format: each character encodes 5-bit groups with a continuation bit.
  // Values are delta-encoded from the previous run length.
  const counts: number[] = [];
  let i = 0;
  while (i < countsStr.length) {
    let x = 0, k = 0, more = true;
    while (more) {
      const c = countsStr.charCodeAt(i) - 48;
      x |= (c & 0x1f) << (5 * k);
      more = (c & 0x20) !== 0;
      i++; k++;
    }
    if (counts.length > 0 && (x & 1)) x = ~x;
    counts.push(counts.length > 0 ? counts[counts.length - 1] + (x >> 1) : (x >> 1));
  }
  return counts;
}

/**
 * Decode a COCO RLE mask to a flat Uint8Array in row-major order.
 * size = [height, width] (COCO convention — height first).
 * Returns a buffer of length H*W where 1 = masked pixel, 0 = background.
 */
export function decodeRle(
  counts: string,
  height: number,
  width: number,
): Uint8Array {
  const mask = new Uint8Array(height * width);
  const runs = decodeCounts(counts);
  let pos = 0;
  let val = 0; // alternates: 0 = background, 1 = foreground
  for (const run of runs) {
    for (let i = 0; i < run; i++) {
      if (val === 1) {
        // column-major index → row-major storage
        const idx = pos + i;
        const col = Math.floor(idx / height);
        const row = idx % height;
        mask[row * width + col] = 1;
      }
    }
    pos += run;
    val = 1 - val;
  }
  return mask;
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
  let maxDist = 0, maxIdx = 0;
  const first = points[0], last = points[points.length - 1];
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

/**
 * Trace the contour of a decoded RLE mask and return simplified polygon vertices.
 * mask is a Uint8Array in row-major order (height × width), 1 = foreground.
 */
export function rleMaskToContour(mask: Uint8Array, width: number, height: number): Point[] {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x]) {
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
      if (mask[y * width + x]) { vertices.push({ x, y }); break; }
    }
  }
  // Right edge
  for (let y = minY; y <= maxY; y += STEP) {
    for (let x = maxX; x >= minX; x--) {
      if (mask[y * width + x]) { vertices.push({ x, y }); break; }
    }
  }
  // Bottom edge (reverse)
  for (let x = maxX; x >= minX; x -= STEP) {
    for (let y = maxY; y >= minY; y--) {
      if (mask[y * width + x]) { vertices.push({ x, y }); break; }
    }
  }
  // Left edge (reverse)
  for (let y = maxY; y >= minY; y -= STEP) {
    for (let x = minX; x <= maxX; x++) {
      if (mask[y * width + x]) { vertices.push({ x, y }); break; }
    }
  }

  return simplifyPolygon(vertices, 3.0);
}

// Self-test: 4×4 mask with 2×2 foreground block at rows 1-2, cols 1-2.
// Encoded RLE: ":5006" → runs [5, 2, 2, 2, 5] → set pixels (1,1),(1,2),(2,1),(2,2).
(function runSelfTest() {
  const TEST_COUNTS = ':5006';
  const H = 4, W = 4;
  const mask = decodeRle(TEST_COUNTS, H, W);

  const expectedSet = new Set([
    1 * W + 1, // row=1 col=1
    1 * W + 2, // row=1 col=2
    2 * W + 1, // row=2 col=1
    2 * W + 2, // row=2 col=2
  ]);

  for (let i = 0; i < H * W; i++) {
    const expected = expectedSet.has(i) ? 1 : 0;
    if (mask[i] !== expected) {
      throw new Error(
        `[rleDecoder] Self-test FAILED at index ${i}: expected ${expected}, got ${mask[i]}. ` +
        `RLE decoder may be broken — check COCO RLE format.`
      );
    }
  }
  console.log('[rleDecoder] Self-test passed — COCO RLE decoder verified.');
})();
