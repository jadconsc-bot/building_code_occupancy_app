import type { ParcelDiscoveryResult } from '../../../server/services/parcelDiscoveryService';

/** Pure, temporary parcel-confirmation decisions. No persistence, requests or client clock. */
export type ParcelGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };
export type CandidateParcel = Omit<ParcelDiscoveryResult['parcels'][number], 'geometry'> & {
  geometry: ParcelGeometry | null;
};
export type CandidateAccount = ParcelDiscoveryResult['accounts'][number];
export type CandidateDiscovery = Omit<ParcelDiscoveryResult, 'parcels'> & { parcels: CandidateParcel[] };
export type DiscoveryReply = CandidateDiscovery | { status: 'no_data' | 'unsupported_municipality' } | { error: string } | null;
export interface AppliedParcelArea {
  areaM2: number;
  rollNumber: string;
  rollYear: number | null;
  cpids: string[];
  searchedAddress: string;
  retrievedAt: string;
  source: CandidateDiscovery['source'];
}

export const PARCEL_UNAVAILABLE_MESSAGE = 'Parcel search is unavailable right now. Enter or confirm the lot area manually.';
export const PARCEL_ATTRIBUTION = 'Contains information licensed under the Open Government Licence – City of Calgary.';
export const PARCEL_LICENCE_URL = 'https://data.calgary.ca/d/Open-Data-Terms/u45n-7awa';
export const OUTLINE_VIEWBOX = { width: 320, height: 240, padding: 12 } as const;

export const compareCodeUnits = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
export const isCalgary = (municipality: string | null): boolean => municipality?.toLowerCase().includes('calgary') ?? false;

/** Conservative comparison only; never rewrites the address sent to discovery or guesses aliases. */
export const normalizeComparisonAddress = (address: string): string => address.trim().toUpperCase().replace(/\s+/g, ' ');
export function searchAddressChoice(projectAddress: string | null, extractedAddress: string | null): { address: string; drawingAddress: string | null } {
  const saved = projectAddress?.trim() ? projectAddress : '';
  const drawing = extractedAddress?.trim() ? extractedAddress : '';
  return {
    address: saved || drawing,
    drawingAddress: saved && drawing && normalizeComparisonAddress(saved) !== normalizeComparisonAddress(drawing) ? drawing : null,
  };
}

export function sortParcels(parcels: readonly CandidateParcel[]): CandidateParcel[] {
  return [...parcels].sort((a, b) => compareCodeUnits(a.cpid, b.cpid));
}

export function sortAccounts(accounts: readonly CandidateAccount[]): CandidateAccount[] {
  return [...accounts].sort((a, b) => compareCodeUnits(a.address, b.address)
    || compareCodeUnits(a.rollNumber, b.rollNumber) || compareCodeUnits(a.cpids[0] ?? '', b.cpids[0] ?? ''));
}

export function formatSqm(area: number | null | undefined): string {
  if (area == null || !Number.isFinite(area)) return '—';
  // toFixed fixes the decimal precision; separators are inserted without locale APIs.
  let fixed = area.toFixed(1);
  if (/[eE]/.test(fixed)) {
    const [coefficient, exponent] = fixed.toLowerCase().split('e');
    const digits = coefficient.replace('.', '');
    fixed = digits + '0'.repeat(Number(exponent) - ((coefficient.split('.')[1] ?? '').length)) + '.0';
  }
  const [integer, fraction] = fixed.split('.');
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
}

export function formatRetrievedAt(retrievedAt: string): string {
  // Parse only explicit ISO instants, never date strings that depend on the browser locale.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(retrievedAt)) return '—';
  const date = new Date(retrievedAt);
  return Number.isFinite(date.getTime()) ? `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC` : '—';
}

interface SearchIdentity {
  requestId: number;
  address: string;
  municipality: string;
  selectedCpids: string[];
  selectedRollNumbers: string[];
}
export type ParcelCandidatesState = SearchIdentity & (
  | { status: 'idle' | 'loading' | 'no_data' | 'unsupported' | 'error' }
  | { status: 'ok'; data: CandidateDiscovery }
);
export type ParcelCandidatesEvent =
  | { type: 'search'; requestId: number; address: string; municipality: string }
  | { type: 'resolve'; requestId: number; response: DiscoveryReply }
  | { type: 'reject'; requestId: number }
  | { type: 'parcel'; cpid: string; checked: boolean }
  | { type: 'account'; rollNumber: string | null }
  | { type: 'reset' };

export function initialParcelCandidatesState(): ParcelCandidatesState {
  return { status: 'idle', requestId: 0, address: '', municipality: '', selectedCpids: [], selectedRollNumbers: [] };
}

export function parcelCandidatesReducer(state: ParcelCandidatesState, event: ParcelCandidatesEvent): ParcelCandidatesState {
  if (event.type === 'reset') return { ...initialParcelCandidatesState(), requestId: state.requestId };
  if (event.type === 'search') {
    if (!Number.isSafeInteger(event.requestId) || event.requestId <= state.requestId) return state;
    return { ...initialParcelCandidatesState(), status: 'loading', requestId: event.requestId, address: event.address, municipality: event.municipality };
  }
  if (event.type === 'resolve' || event.type === 'reject') {
    if (state.status !== 'loading' || event.requestId !== state.requestId) return state;
    if (event.type === 'reject' || event.response == null || 'error' in event.response) return { ...state, status: 'error' };
    if (event.response.status === 'no_data') return { ...state, status: 'no_data' };
    if (event.response.status === 'unsupported_municipality') return { ...state, status: 'unsupported' };
    if (event.response.status !== 'ok') return { ...state, status: 'error' };
    return { ...state, status: 'ok', data: { ...event.response, parcels: sortParcels(event.response.parcels), accounts: sortAccounts(event.response.accounts) } };
  }
  if (state.status !== 'ok') return state;
  if (event.type === 'parcel') {
    if (!state.data.parcels.some(p => p.cpid === event.cpid)) return state;
    return { ...state, selectedCpids: [...new Set(event.checked ? [...state.selectedCpids, event.cpid] : state.selectedCpids.filter(c => c !== event.cpid))].sort(compareCodeUnits) };
  }
  if (event.rollNumber != null && !state.data.accounts.some(a => a.rollNumber === event.rollNumber)) return state;
  return { ...state, selectedRollNumbers: event.rollNumber == null ? [] : [event.rollNumber] };
}

export function applyEligibility(state: ParcelCandidatesState): { allowed: boolean; missingCpids: string[]; warning: string | null } {
  if (state.status !== 'ok' || state.data.truncated || state.selectedRollNumbers.length !== 1) return { allowed: false, missingCpids: [], warning: null };
  const account = state.data.accounts.find(a => a.rollNumber === state.selectedRollNumbers[0]);
  if (!account || account.landSizeSqm == null || !Number.isFinite(account.landSizeSqm) || account.landSizeSqm <= 0) return { allowed: false, missingCpids: [], warning: null };
  const missingCpids = [...new Set(account.cpids.filter(c => !state.selectedCpids.includes(c)))].sort(compareCodeUnits);
  return {
    allowed: missingCpids.length === 0,
    missingCpids,
    warning: missingCpids.length ? `Tick all parcels of this account (${missingCpids.length} missing)`
      : account.cpids.length === 0 ? 'This account has no parcel identifier.' : null,
  };
}

export const canApply = (state: ParcelCandidatesState): boolean => applyEligibility(state).allowed;

export function getApplyPayload(state: ParcelCandidatesState): AppliedParcelArea | null {
  if (state.status !== 'ok' || !canApply(state)) return null;
  const account = state.data.accounts.find(a => a.rollNumber === state.selectedRollNumbers[0])!;
  return {
    areaM2: account.landSizeSqm!, rollNumber: account.rollNumber, rollYear: account.rollYear,
    cpids: [...account.cpids], searchedAddress: state.address, retrievedAt: state.data.retrievedAt,
    source: { ...state.data.source },
  };
}

type Ring = number[][];
function geometryRings(geometry: ParcelGeometry | null): Ring[] {
  if (!geometry) return [];
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
  return rings.filter(ring => ring.length >= 3 && ring.every(point => point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1])));
}

export interface ParcelOutline { cpid: string; path: string }

/** Shared bounds and uniform scale; ring order preserved, holes rendered with fillRule="evenodd". */
export function parcelOutlines(parcels: readonly CandidateParcel[]): ParcelOutline[] {
  const ordered = sortParcels(parcels);
  const rings = ordered.map(p => geometryRings(p.geometry));
  const points = rings.flat(2);
  if (!points.length) return ordered.map(p => ({ cpid: p.cpid, path: '' }));
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lon, lat] of points) {
    minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
  }
  const cosine = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const width = (maxLon - minLon) * cosine;
  const height = maxLat - minLat;
  const { width: viewWidth, height: viewHeight, padding } = OUTLINE_VIEWBOX;
  const scale = width === 0 && height === 0 ? 1 : Math.min(width === 0 ? Infinity : (viewWidth - 2 * padding) / width, height === 0 ? Infinity : (viewHeight - 2 * padding) / height);
  const offsetX = (viewWidth - width * scale) / 2;
  const offsetY = (viewHeight - height * scale) / 2;
  const round = (value: number) => Math.round(value * 10) / 10;
  return ordered.map((parcel, index) => ({
    cpid: parcel.cpid,
    path: rings[index].map(ring => ring.map(([lon, lat], i) => `${i ? 'L' : 'M'}${round(offsetX + (lon - minLon) * cosine * scale)},${round(offsetY + (maxLat - lat) * scale)}`).join(' ') + ' Z').join(' '),
  }));
}
