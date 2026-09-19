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

export function inferAccessorySpaceType(spaceType?: string | null, label?: string | null): string | undefined {
  const normalized = spaceType?.trim().toLowerCase();
  if (normalized && ACCESSORY_SPACE_TYPES.includes(normalized as (typeof ACCESSORY_SPACE_TYPES)[number])) {
    return normalized;
  }

  const text = label?.trim().toLowerCase() ?? '';
  if (/garage|carport|parking/.test(text)) return 'garage';
  if (/mechanical|utility|boiler|hvac|electrical|janitor/.test(text)) return 'mechanical';
  if (/storage|closet|locker|bicycle/.test(text)) return text.includes('closet') ? 'closet' : 'storage';
  if (/stair|corridor|hallway|lobby|vestibule/.test(text)) {
    if (/stair/.test(text)) return 'stairwell';
    if (/corridor|hallway/.test(text)) return 'corridor';
    return text.includes('lobby') ? 'lobby' : 'vestibule';
  }
  return undefined;
}

export function isAccessorySpace(spaceType?: string | null, label?: string | null): boolean {
  return Boolean(inferAccessorySpaceType(spaceType, label));
}

export interface ReclassificationInput {
  occupancyGroup: string;
  spaceType?: string;
  label?: string;
  dominantOccupancyGroup: string | null;
  totalDwellingUnits?: number | null;
}

export type ReclassificationResult =
  | { action: 'unchanged' }
  | { action: 'reclassified'; newOccupancyGroup: string; reason: string; citation: string }
  | { action: 'flagForVerification'; reason: string; citation: string };

export function reclassifyAccessoryOccupancy(input: ReclassificationInput): ReclassificationResult {
  const normalizedGroup = input.occupancyGroup?.trim().toUpperCase() ?? '';
  const spaceType = inferAccessorySpaceType(input.spaceType, input.label);

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
