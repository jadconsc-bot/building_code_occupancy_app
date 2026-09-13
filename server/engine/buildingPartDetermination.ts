export type BuildingPartCriterion =
  | 'storeys'
  | 'footprint'
  | 'occupancy'
  | 'missing-storeys'
  | 'missing-footprint'
  | 'missing-occupancy';

export type BuildingPartDetermination = {
  determination: 'Part 9' | 'Part 3' | 'needs_review';
  failedCriterion: BuildingPartCriterion | null;
  failedCriteria: BuildingPartCriterion[];
  reasoning: string;
};

const PART_9_OCCUPANCIES = new Set(['B-4', 'C', 'D', 'E', 'F-2', 'F-3']);

export function determineBuildingPart(input: {
  footprintM2: number | null | undefined;
  storeys: number | null | undefined;
  occupancyGroup: string | null | undefined;
}): BuildingPartDetermination {
  const failedCriteria: BuildingPartCriterion[] = [];
  const occupancy = input.occupancyGroup?.trim().toUpperCase() ?? '';
  const missing = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(value);

  if (missing(input.storeys)) failedCriteria.push('missing-storeys');
  if (missing(input.footprintM2)) failedCriteria.push('missing-footprint');
  if (!occupancy) failedCriteria.push('missing-occupancy');

  if (failedCriteria.length > 0) {
    return {
      determination: 'needs_review',
      failedCriterion: failedCriteria[0] ?? null,
      failedCriteria,
      reasoning: 'Part 9/Part 3 determination requires storeys, verified building footprint, and major occupancy group.',
    };
  }

  if ((input.storeys as number) > 3) failedCriteria.push('storeys');
  if ((input.footprintM2 as number) > 600) failedCriteria.push('footprint');
  if (!PART_9_OCCUPANCIES.has(occupancy)) failedCriteria.push('occupancy');

  if (failedCriteria.length > 0) {
    return {
      determination: 'Part 3',
      failedCriterion: failedCriteria[0] ?? null,
      failedCriteria,
      reasoning: `Part 3 applies because ${failedCriteria.map(c => c === 'storeys' ? 'the building exceeds 3 storeys' : c === 'footprint' ? 'the footprint exceeds 600 m²' : 'the occupancy is outside the permitted Part 9 groups').join(' and ')}.`,
    };
  }

  return {
    determination: 'Part 9',
    failedCriterion: null,
    failedCriteria: [],
    reasoning: 'The building is not more than 3 storeys, its footprint is not more than 600 m², and its occupancy is permitted under Part 9.',
  };
}
