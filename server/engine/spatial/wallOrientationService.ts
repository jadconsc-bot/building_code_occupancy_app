/**
 * Wall orientation utilities — compass face assignment based on wall vector
 * and drawing north arrow rotation.
 *
 * wallAngleDeg: angle of the wall vector in degrees (0 = pointing up/north in drawing)
 * northArrowDeg: rotation of the north arrow relative to drawing-up (0 = north is up)
 *
 * True compass bearing = (wallAngleDeg - northArrowDeg + 360) % 360
 */
export type CompassFace = 'N' | 'E' | 'S' | 'W';

/**
 * Derive the compass face a wall is oriented toward given:
 *  - wallAngleDeg  : 0° = pointing up in drawing space
 *  - northArrowDeg : 0° = north arrow pointing up (default orientation)
 */
export function wallVectorToFace(wallAngleDeg: number, northArrowDeg: number = 0): CompassFace {
  const bearing = ((wallAngleDeg - northArrowDeg) % 360 + 360) % 360;

  if (bearing < 45 || bearing >= 315) return 'N';
  if (bearing < 135) return 'E';
  if (bearing < 225) return 'S';
  return 'W';
}

/**
 * Apply a pixels-per-mm scale factor to a raw pixel length.
 */
export function applyScaleToWalls(
  lengthPx: number,
  pixelsPerMm: number,
): number {
  if (pixelsPerMm <= 0) return 0;
  return lengthPx / pixelsPerMm;
}
