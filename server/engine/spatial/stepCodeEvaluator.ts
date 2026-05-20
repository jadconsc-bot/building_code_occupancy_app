/**
 * BC Energy Step Code — WWR (Window-to-Wall Ratio) evaluator.
 *
 * Takes structured wall+window data and produces per-face and per-step
 * compliance results. Pure function — no DB or network calls.
 */
import type { CompassFace } from './wallOrientationService';

export interface WindowInput {
  windowId: string;
  positionPx: { x: number; y: number };
  widthPx: number;
  widthMm: number;
  heightMm: number;
  areaM2: number;
  confidence: number;
}

export interface WallInput {
  face: CompassFace;
  startPx: { x: number; y: number };
  endPx: { x: number; y: number };
  lengthPx: number;
  lengthMm: number;
  heightMm: number;
  grossAreaM2: number;
  windows: WindowInput[];
  confidence: number;
}

export interface FaceGeometry {
  face: CompassFace;
  grossWallAreaM2: number;
  glazingAreaM2: number;
  wwrPercent: number;
  windowCount: number;
}

export interface StepCodeGeometry {
  faces: Partial<Record<CompassFace, FaceGeometry>>;
  totalGlazingM2: number;
  totalWallM2: number;
  overallWwrPercent: number;
}

export interface StepResult {
  step: number;
  wwrLimitPercent: number;
  passes: boolean;
  failingFaces: string[];
  ref: string;
}

export interface StepCodeEvaluation {
  step3: StepResult;
  step4: StepResult;
  step5: StepResult;
}

/**
 * Aggregate wall/window inputs into per-face and overall WWR geometry.
 */
export function calculateStepCodeGeometry(walls: WallInput[]): StepCodeGeometry {
  const faceMap: Partial<Record<CompassFace, FaceGeometry>> = {};

  for (const wall of walls) {
    const existing = faceMap[wall.face];
    const glazing = wall.windows.reduce((s, w) => s + w.areaM2, 0);

    if (existing) {
      existing.grossWallAreaM2 += wall.grossAreaM2;
      existing.glazingAreaM2 += glazing;
      existing.windowCount += wall.windows.length;
    } else {
      faceMap[wall.face] = {
        face: wall.face,
        grossWallAreaM2: wall.grossAreaM2,
        glazingAreaM2: glazing,
        wwrPercent: 0,
        windowCount: wall.windows.length,
      };
    }
  }

  // Compute WWR percent per face
  for (const fg of Object.values(faceMap) as FaceGeometry[]) {
    fg.wwrPercent = fg.grossWallAreaM2 > 0
      ? Math.round((fg.glazingAreaM2 / fg.grossWallAreaM2) * 1000) / 10
      : 0;
  }

  const totalGlazingM2 = (Object.values(faceMap) as FaceGeometry[])
    .reduce((s, f) => s + f.glazingAreaM2, 0);
  const totalWallM2 = (Object.values(faceMap) as FaceGeometry[])
    .reduce((s, f) => s + f.grossWallAreaM2, 0);
  const overallWwrPercent = totalWallM2 > 0
    ? Math.round((totalGlazingM2 / totalWallM2) * 1000) / 10
    : 0;

  return { faces: faceMap, totalGlazingM2, totalWallM2, overallWwrPercent };
}

// Per-step WWR limits — BC Building Code 2024 Table 9.36.2.3.A
const STEP_LIMITS: Record<number, number> = { 3: 40, 4: 35, 5: 30 };

/**
 * Evaluate per-step WWR compliance against BC Step Code limits.
 */
export function evaluateStepCode(geometry: StepCodeGeometry): StepCodeEvaluation {
  function evalStep(step: number): StepResult {
    const limit = STEP_LIMITS[step];
    const failingFaces: string[] = [];

    for (const [face, fg] of Object.entries(geometry.faces) as [CompassFace, FaceGeometry][]) {
      if (fg.wwrPercent > limit) {
        failingFaces.push(`${face} (${fg.wwrPercent}% > ${limit}%)`);
      }
    }

    return {
      step,
      wwrLimitPercent: limit,
      passes: failingFaces.length === 0,
      failingFaces,
      ref: `BC Building Code 2024 Table 9.36.2.3.A — Step ${step}`,
    };
  }

  return {
    step3: evalStep(3),
    step4: evalStep(4),
    step5: evalStep(5),
  };
}
