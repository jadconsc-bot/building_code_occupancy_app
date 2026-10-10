export interface CityParcelArea {
  lotAreaSqm: number;
  confirmedAddress: string | null;
  source: string;
}

export interface CityLotAreaState {
  fetchedParcelArea: CityParcelArea | null;
  lotAreaOverrideSqm: number | null;
}

export type CityLotAreaEvent =
  | { type: 'success'; area: CityParcelArea }
  | { type: 'apply' }
  | { type: 'context-change' }
  | { type: 'failure'; ambiguous?: boolean; thrown?: boolean };

/** One decision for the component and tests: a failed lookup or changed site invalidates city area. */
export function transitionCityLotArea(state: CityLotAreaState, event: CityLotAreaEvent): CityLotAreaState & { message?: string } {
  if (event.type === 'success') return { ...state, fetchedParcelArea: event.area };
  if (event.type === 'apply') return { ...state, lotAreaOverrideSqm: state.fetchedParcelArea?.lotAreaSqm ?? state.lotAreaOverrideSqm };
  const removed = state.lotAreaOverrideSqm != null;
  const removalMessage = 'Previously applied city area was removed; using width × depth.';
  const message = event.type === 'context-change'
    ? (removed ? removalMessage : undefined)
    : `${event.ambiguous
      ? 'Several properties match this address; enter the lot area manually or use the site plan value'
      : event.thrown ? 'Lot area lookup failed' : 'No city lot-area data available for this address — enter dimensions manually'}${removed ? `. ${removalMessage}` : ''}`;
  return { fetchedParcelArea: null, lotAreaOverrideSqm: null, message };
}
