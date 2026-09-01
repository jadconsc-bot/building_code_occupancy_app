export const SPACE_TYPE_VALUES = [
  'room',
  'corridor',
  'stairwell',
  'closet',
  'storage',
  'mechanical',
  'garage',
  'exterior',
  'vestibule',
  'lobby',
  'other',
] as const;

export type SpaceType = (typeof SPACE_TYPE_VALUES)[number];

export function inferSpaceTypeFromLabel(label: string): SpaceType {
  if (/corridor|hallway|hall\b/i.test(label)) return 'corridor';
  if (/stair|stairwell|stairway/i.test(label)) return 'stairwell';
  if (/\bwic\b|walk-in closet|closet/i.test(label)) return 'closet';
  if (/storage|stor\b|locker|utility room/i.test(label)) return 'storage';
  if (/mech|mechanical|electrical|utility/i.test(label)) return 'mechanical';
  if (/garage/i.test(label)) return 'garage';
  if (/driveway|concrete|patio|landing|walkway|porch|deck\b/i.test(label)) return 'exterior';
  if (/vestibule/i.test(label)) return 'vestibule';
  if (/lobby/i.test(label)) return 'lobby';
  return 'room';
}
