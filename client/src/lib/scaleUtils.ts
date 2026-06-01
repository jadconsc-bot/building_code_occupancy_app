/**
 * Shared utility for converting canvas pixels to real-world metres.
 */

export interface ScaleInfo {
  pixelsPerDrawingUnit: number;
  ratio: number;          // real units per drawing unit
  scaleSystem: "imperial" | "metric";
}

/** Returns pixels per metre given calibration + scale info. */
export function resolvePixelsPerMetre(info: ScaleInfo): number {
  const { pixelsPerDrawingUnit, ratio, scaleSystem } = info;
  if (!pixelsPerDrawingUnit || pixelsPerDrawingUnit <= 0) return 0;
  // imperial ratio is in inches/drawing-unit; metric in mm/drawing-unit
  const realUnitsPerPx = ratio / pixelsPerDrawingUnit;
  const metresPerRealUnit = scaleSystem === "imperial" ? 0.0254 : 0.001;
  const metresPerPx = realUnitsPerPx * metresPerRealUnit;
  return metresPerPx > 0 ? 1 / metresPerPx : 0;
}

export function pxToMetres(px: number, info: ScaleInfo): number {
  const ppm = resolvePixelsPerMetre(info);
  return ppm > 0 ? px / ppm : 0;
}
