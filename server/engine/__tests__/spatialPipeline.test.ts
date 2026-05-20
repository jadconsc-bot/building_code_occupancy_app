import { describe, it, expect } from 'vitest';
import { wallVectorToFace, applyScaleToWalls } from '../spatial/wallOrientationService';
import { calculateStepCodeGeometry, evaluateStepCode } from '../spatial/stepCodeEvaluator';
import { parseDimensionToMm } from '../../services/drawingComplianceEngine';
import type { WallInput } from '../spatial/stepCodeEvaluator';

// ── Wall orientation — compass face assignment ───────────────────────────────
describe('Wall orientation — compass face assignment', () => {
  it('wall pointing up (0°) = North when north arrow points up (0°)', () => {
    expect(wallVectorToFace(0, 0)).toBe('N');
  });

  it('wall pointing right (90°) = East', () => {
    expect(wallVectorToFace(90, 0)).toBe('E');
  });

  it('wall pointing down (180°) = South', () => {
    expect(wallVectorToFace(180, 0)).toBe('S');
  });

  it('wall pointing left (270°) = West', () => {
    expect(wallVectorToFace(270, 0)).toBe('W');
  });

  it('rotated drawing: north arrow at 90°, up-pointing wall = West', () => {
    expect(wallVectorToFace(0, 90)).toBe('W');
  });

  it('diagonal NE boundary (44°) = North', () => {
    expect(wallVectorToFace(44, 0)).toBe('N');
  });

  it('diagonal NE boundary (46°) = East', () => {
    expect(wallVectorToFace(46, 0)).toBe('E');
  });

  it('full 360° wrap — 315° = North', () => {
    expect(wallVectorToFace(315, 0)).toBe('N');
  });
});

// ── Scale application ────────────────────────────────────────────────────────
describe('applyScaleToWalls — pixel-to-mm conversion', () => {
  it('1000 px at 2 px/mm = 500mm', () => {
    expect(applyScaleToWalls(1000, 2)).toBe(500);
  });

  it('zero pixels per mm returns 0', () => {
    expect(applyScaleToWalls(500, 0)).toBe(0);
  });

  it('identity scale (1 px/mm) — length unchanged', () => {
    expect(applyScaleToWalls(1800, 1)).toBe(1800);
  });
});

// ── Step Code WWR calculation ────────────────────────────────────────────────
describe('Step Code WWR calculation', () => {
  const simpleSouthWall: WallInput = {
    face: 'S',
    startPx: { x: 0, y: 0 },
    endPx: { x: 1000, y: 0 },
    lengthPx: 1000,
    lengthMm: 10000,
    heightMm: 2700,
    grossAreaM2: 27.0,
    windows: [{
      windowId: 'W-01',
      positionPx: { x: 500, y: 0 },
      widthPx: 180,
      widthMm: 1800,
      heightMm: 1200,
      areaM2: 2.16,
      confidence: 0.9,
    }],
    confidence: 0.9,
  };

  it('calculates correct gross wall area and glazing for south face', () => {
    const geometry = calculateStepCodeGeometry([simpleSouthWall]);
    expect(geometry.faces.S?.grossWallAreaM2).toBe(27.0);
    expect(geometry.faces.S?.glazingAreaM2).toBe(2.16);
  });

  it('calculates WWR = 2.16/27.0 ≈ 8.0%', () => {
    const geometry = calculateStepCodeGeometry([simpleSouthWall]);
    expect(geometry.faces.S?.wwrPercent).toBeCloseTo(8.0, 1);
  });

  it('PASS Step 4: WWR 12.5% on south face (limit 35%)', () => {
    const wall: WallInput = {
      face: 'S',
      startPx: { x: 0, y: 0 },
      endPx: { x: 1000, y: 0 },
      lengthPx: 1000,
      lengthMm: 8000,
      heightMm: 2700,
      grossAreaM2: 21.6,
      windows: [{
        windowId: 'W-01',
        positionPx: { x: 500, y: 0 },
        widthPx: 180,
        widthMm: 1800,
        heightMm: 1500,
        areaM2: 2.7,
        confidence: 0.9,
      }],
      confidence: 0.9,
    };
    const geometry = calculateStepCodeGeometry([wall]);
    const result = evaluateStepCode(geometry);
    expect(result.step4.passes).toBe(true);
    expect(result.step4.failingFaces).toHaveLength(0);
  });

  it('FAIL Step 4: WWR 31% on west face (limit 35%) — still passes', () => {
    // 6.5 glazing / 21.0 gross = 30.95% — within Step 4 but add more...
    const wall: WallInput = {
      face: 'W',
      startPx: { x: 0, y: 0 },
      endPx: { x: 1000, y: 0 },
      lengthPx: 1000,
      lengthMm: 7778,
      heightMm: 2700,
      grossAreaM2: 21.0,
      windows: [
        { windowId: 'W-01', positionPx: { x: 200, y: 0 }, widthPx: 150,
          widthMm: 1500, heightMm: 1500, areaM2: 2.25, confidence: 0.9 },
        { windowId: 'W-02', positionPx: { x: 600, y: 0 }, widthPx: 300,
          widthMm: 3000, heightMm: 1500, areaM2: 4.5, confidence: 0.9 },
      ],
      confidence: 0.9,
    };
    const geometry = calculateStepCodeGeometry([wall]);
    // 6.75 / 21.0 = 32.1% > 30% step5 but ≤ 35% step4
    const result = evaluateStepCode(geometry);
    expect(result.step4.passes).toBe(true);
    expect(result.step5.passes).toBe(false);
    expect(result.step5.failingFaces.some(f => f.startsWith('W'))).toBe(true);
  });

  it('FAIL Step 4: WWR 38% on west face exceeds 35% limit', () => {
    const wall: WallInput = {
      face: 'W',
      startPx: { x: 0, y: 0 },
      endPx: { x: 1000, y: 0 },
      lengthPx: 1000,
      lengthMm: 8000,
      heightMm: 2700,
      grossAreaM2: 17.5,
      windows: [
        { windowId: 'W-01', positionPx: { x: 200, y: 0 }, widthPx: 150,
          widthMm: 1500, heightMm: 1500, areaM2: 2.25, confidence: 0.9 },
        { windowId: 'W-02', positionPx: { x: 600, y: 0 }, widthPx: 300,
          widthMm: 3000, heightMm: 1500, areaM2: 4.5, confidence: 0.9 },
      ],
      confidence: 0.9,
    };
    const geometry = calculateStepCodeGeometry([wall]);
    const result = evaluateStepCode(geometry);
    expect(result.step4.passes).toBe(false);
    expect(result.step4.failingFaces.some(f => f.startsWith('W'))).toBe(true);
  });

  it('multiple faces — totals aggregate correctly', () => {
    const walls: WallInput[] = [
      { ...simpleSouthWall, face: 'N' },
      { ...simpleSouthWall, face: 'S' },
    ];
    const geometry = calculateStepCodeGeometry(walls);
    expect(geometry.totalWallM2).toBe(54.0);
    expect(geometry.totalGlazingM2).toBeCloseTo(4.32, 2);
  });
});

// ── Dimension parsing ─────────────────────────────────────────────────────────
describe('parseDimensionToMm — unit conversion', () => {
  it('parses mm string', () => {
    expect(parseDimensionToMm('860mm')).toBe(860);
  });

  it('parses metres string', () => {
    expect(parseDimensionToMm('1.1m')).toBe(1100);
  });

  it('parses feet-inches (3\'6")', () => {
    const result = parseDimensionToMm("3'6\"");
    expect(result).toBeCloseTo(1066.8, 0);
  });

  it('parses feet only', () => {
    expect(parseDimensionToMm("3'")).toBeCloseTo(914.4, 0);
  });

  it('returns null for unparseable string', () => {
    expect(parseDimensionToMm('unknown')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseDimensionToMm('')).toBeNull();
  });
});
