export type AreaUnit = "m2" | "ft2";

export const SQM_TO_SQFT = 10.7639;

export function toSquareMeters(value: number, unit: AreaUnit): number {
  return unit === "ft2" ? value / SQM_TO_SQFT : value;
}

export function fromSquareMeters(valueM2: number, unit: AreaUnit): number {
  return unit === "ft2" ? valueM2 * SQM_TO_SQFT : valueM2;
}

export function formatArea(valueM2: number, unit: AreaUnit, decimals = 2): string {
  return fromSquareMeters(valueM2, unit).toFixed(decimals);
}
