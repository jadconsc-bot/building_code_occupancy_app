import { getDefaultLoadFactor, occupantLoadFactors } from '@shared/occupantLoadFactors';

export interface OccupantLoadRoom {
  occupancyGroup?: string | null;
  label?: string | null;
  roomLabel?: string | null;
  areaM2?: number | null;
  areaSqm?: number | null;
}

export interface OccupantLoadDeterminationInput {
  occupancyGroup?: string | null;
  areaM2?: number | null;
  bedroomCount?: number | null;
  rooms?: OccupantLoadRoom[];
  loadFactorId?: string | null;
  seatCount?: number | null;
}

export interface OccupantLoadDeterminationResult {
  occupantLoad: number;
  method: 'bedroom_count' | 'area_factor' | 'fixed_seats' | 'needs_review';
  bedroomCount: number | null;
  areaPerPerson: number | null;
  seatCount: number | null;
  needsReview: boolean;
  reasoning: string;
  citation: string;
}

const BEDROOM_LABEL = /bed|sleep|master|bedroom|bdrm|mstr/i;

export function determineOccupantLoad(input: OccupantLoadDeterminationInput): OccupantLoadDeterminationResult {
  const group = (input.occupancyGroup ?? '').trim().toUpperCase();
  const citation = 'NBC 3.1.17.1 Note (2)';

  if (group === 'C') {
    const groupCRooms = (input.rooms ?? []).filter((room) => (room.occupancyGroup ?? '').trim().toUpperCase() === 'C');
    const labelledBedrooms = groupCRooms.filter((room) => BEDROOM_LABEL.test(room.label ?? room.roomLabel ?? '')).length;
    const inferredBedroomCount = groupCRooms.length > 0 ? labelledBedrooms : null;
    const bedroomCount = input.bedroomCount ?? inferredBedroomCount;
    const inferredButUnconfirmed = input.bedroomCount == null && inferredBedroomCount === 0;

    if (bedroomCount != null && !inferredButUnconfirmed && Number.isFinite(bedroomCount) && bedroomCount >= 0) {
      const occupants = Math.ceil(bedroomCount) * 2;
      return {
        occupantLoad: occupants,
        method: 'bedroom_count',
        bedroomCount: Math.ceil(bedroomCount),
        areaPerPerson: null,
        seatCount: null,
        needsReview: false,
        reasoning: `${Math.ceil(bedroomCount)} bedroom${Math.ceil(bedroomCount) === 1 ? '' : 's'} across all dwelling units/suites × 2 persons per bedroom = ${occupants} persons`,
        citation,
      };
    }

    return {
      occupantLoad: 0,
      method: 'needs_review',
      bedroomCount: null,
      areaPerPerson: null,
      seatCount: null,
      needsReview: true,
      reasoning: 'Group C dwelling-unit occupant load requires the total bedroom count across all dwelling units and suites.',
      citation,
    };
  }

  if (input.loadFactorId) {
    const row = occupantLoadFactors.find((factor) => factor.id === input.loadFactorId);
    if (row) {
      if (row.areaPerPerson === null) {
        const seatCount = input.seatCount;
        if (seatCount != null && Number.isFinite(seatCount) && seatCount >= 0) {
          const occupants = Math.ceil(seatCount);
          return {
            occupantLoad: occupants,
            method: 'fixed_seats',
            bedroomCount: null,
            areaPerPerson: null,
            seatCount: occupants,
            needsReview: false,
            reasoning: `${occupants} fixed seat${occupants === 1 ? '' : 's'} counted directly — table value does not apply (${row.clause ?? 'clause calculation'}).`,
            citation: 'NBC 3.1.17.1(1)(a)',
          };
        }
        return {
          occupantLoad: 0,
          method: 'needs_review',
          bedroomCount: null,
          areaPerPerson: null,
          seatCount: null,
          needsReview: true,
          reasoning: `${row.useType} requires an actual count — table value does not apply (${row.clause ?? 'clause calculation'}).`,
          citation: 'NBC 3.1.17.1(1)(a)',
        };
      }

      const area = input.areaM2 ?? 0;
      const occupantLoad = area > 0 ? Math.ceil(area / row.areaPerPerson) : 0;
      const provenance = row.source && row.source !== 'federal'
        ? ` (${row.source === 'OBC' ? 'OBC-sourced' : 'design-judgment'} value — engineer sign-off required, no NBC 2020 federal table row)`
        : '';
      return {
        occupantLoad,
        method: 'area_factor',
        bedroomCount: null,
        areaPerPerson: row.areaPerPerson,
        seatCount: null,
        needsReview: false,
        reasoning: `${occupantLoad} persons (${area}m² ÷ ${row.areaPerPerson}m²/person for ${row.useType})${provenance}`,
        citation: row.source && row.source !== 'federal' ? `${row.useType}${provenance}` : 'NBC 2020 Table 3.1.17.1',
      };
    }
  }

  const spec = getDefaultLoadFactor(group || 'D');
  const area = input.areaM2 ?? 0;
  const occupantLoad = area > 0 ? Math.ceil(area / spec.areaPerPerson) : 0;
  return {
    occupantLoad,
    method: 'area_factor',
    bedroomCount: null,
    areaPerPerson: spec.areaPerPerson,
    seatCount: null,
    needsReview: false,
    reasoning: `Occupant load calculated as ${occupantLoad} persons (${area}m² ÷ ${spec.areaPerPerson}m²/person for Group ${group || 'D'})`,
    citation: spec.citation,
  };
}
