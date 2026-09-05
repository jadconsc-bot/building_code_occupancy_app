export const ACCESSORY_SPACE_TYPES = [
  'corridor',
  'stairwell',
  'closet',
  'storage',
  'mechanical',
  'garage',
  'vestibule',
  'lobby',
] as const;

export interface ReclassificationInput {
  occupancyGroup: string;
  spaceType?: string;
  dominantOccupancyGroup: string | null;
  totalDwellingUnits?: number | null;
}

export type ReclassificationResult =
  | { action: 'unchanged' }
  | { action: 'reclassified'; newOccupancyGroup: string; reason: string; citation: string }
  | { action: 'flagForVerification'; reason: string; citation: string };

export function reclassifyAccessoryOccupancy(input: ReclassificationInput): ReclassificationResult {
  const normalizedGroup = input.occupancyGroup?.trim().toUpperCase() ?? '';
  const spaceType = input.spaceType?.trim().toLowerCase();

  if (input.dominantOccupancyGroup !== 'C') {
    return { action: 'unchanged' };
  }

  if (normalizedGroup === 'C') {
    return { action: 'unchanged' };
  }

  if (!spaceType || !ACCESSORY_SPACE_TYPES.includes(spaceType as (typeof ACCESSORY_SPACE_TYPES)[number])) {
    return { action: 'unchanged' };
  }

  if (input.totalDwellingUnits === undefined || input.totalDwellingUnits === null || input.totalDwellingUnits >= 2) {
    return {
      action: 'flagForVerification',
      reason: `Accessory space (${spaceType}) occupancy could not be confirmed as part of a single dwelling unit - verify suite separation requirements if this building contains a secondary suite`,
      citation: 'NBC 9.37 (Secondary Suites)',
    };
  }

  return {
    action: 'reclassified',
    newOccupancyGroup: 'C',
    reason: `Accessory space (${spaceType}) serving a single dwelling unit is considered part of that dwelling`,
    citation: 'NBC 3.1.2',
  };
}
