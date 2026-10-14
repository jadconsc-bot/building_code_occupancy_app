import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyEligibility, canApply, compareCodeUnits, formatRetrievedAt, formatSqm,
  getApplyPayload, initialParcelCandidatesState, isCalgary, parcelCandidatesReducer,
  parcelOutlines, searchAddressChoice, sortAccounts, sortParcels,
  type CandidateAccount, type CandidateDiscovery, type CandidateParcel,
  type DiscoveryReply, type ParcelCandidatesState,
} from '../components/parcelCandidates';

const names = ['coral-shores', 'mcdougall', 'macleod', 'auburn-bay', 'no-data'] as const;
const readFixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/parcelDiscovery/${name}.json`, import.meta.url), 'utf8'));
const fixtures = names.map(name => ({ name, response: readFixture(name) as CandidateDiscovery | { status: 'no_data' } }));
const successes = fixtures.filter((item): item is { name: typeof names[number]; response: CandidateDiscovery } => item.response?.status === 'ok');
const house = successes.find(f => f.name === 'coral-shores')!.response;
const golden = readFixture('outline-paths.golden') as Record<string, { cpid: string; path: string }[]>;
const begin = (requestId = 1, address = house.query.normalized) => parcelCandidatesReducer(initialParcelCandidatesState(), { type: 'search', requestId, address, municipality: 'Calgary' });
const resolved = (data = house): ParcelCandidatesState => parcelCandidatesReducer(begin(1, data.query.normalized), { type: 'resolve', requestId: 1, response: data });
const chosen = (data = house, account = data.accounts[0]): ParcelCandidatesState => ({ ...resolved(data), selectedRollNumbers: [account.rollNumber], selectedCpids: [...account.cpids] });
const rotate = <T,>(items: T[]): T[] => items.length ? [...items.slice(1), items[0]] : [];

describe('parcel candidate deterministic presentation', () => {
  it('uses plain code-unit ordering including numeric-looking and non-ASCII identifiers', () => {
    expect(['ä', '2', 'a', '10', 'Z'].sort(compareCodeUnits)).toEqual(['10', '2', 'Z', 'a', 'ä']);
  });

  it.each(successes)('sorts $name parcels and accounts identically after deterministic shuffles, without mutation', ({ response }) => {
    const before = JSON.stringify(response);
    for (const accounts of [response.accounts, [...response.accounts].reverse(), rotate(response.accounts)]) {
      expect(sortAccounts(accounts)).toEqual(sortAccounts(response.accounts));
    }
    for (const parcels of [response.parcels, [...response.parcels].reverse(), rotate(response.parcels)]) {
      expect(sortParcels(parcels)).toEqual(sortParcels(response.parcels));
    }
    expect(JSON.stringify(response)).toBe(before);
  });

  it('breaks account ties by address, roll number and then first CPID, keeping exact ties stable', () => {
    const base = house.accounts[0];
    const rows: CandidateAccount[] = [
      { ...base, address: 'B', rollNumber: '1', cpids: ['1'] },
      { ...base, address: 'A', rollNumber: '2', cpids: ['2'] },
      { ...base, address: 'A', rollNumber: '1', cpids: ['2'] },
      { ...base, address: 'A', rollNumber: '1', cpids: ['1'] },
    ];
    expect(sortAccounts(rows)).toEqual([rows[3], rows[2], rows[1], rows[0]]);
    expect(sortAccounts([rows[0], { ...rows[0], assessmentClass: 'SECOND' }])[1].assessmentClass).toBe('SECOND');
    expect(sortAccounts([{ ...base, cpids: [] }, base])[0].cpids).toEqual([]);
  });

  it.each([
    [0, '0.0'], [654.4, '654.4'], [23044.9, '23,044.9'], [1234567.89, '1,234,567.9'],
    [-1234.5, '-1,234.5'], [1e21, '1,000,000,000,000,000,000,000.0'],
    [null, '—'], [undefined, '—'], [NaN, '—'], [Infinity, '—'],
  ])('formats %s as the fixed locale-free string %s', (input, expected) => expect(formatSqm(input)).toBe(expected));

  it.each([
    ['2026-10-14T04:09:18.868Z', '2026-10-14 04:09 UTC'],
    ['2026-10-13T22:09:18-06:00', '2026-10-14 04:09 UTC'],
    ['2026-10-14', '—'], ['not a date', '—'], ['2026-99-99T25:90:00Z', '—'],
  ])('formats only an explicit stored ISO instant: %s', (input, expected) => expect(formatRetrievedAt(input)).toBe(expected));

  it('preserves exact field text while applying the fixed saved-address-first prefill rule', () => {
    expect(searchAddressChoice(' 800 Macleod Trail SE ', '132 CORAL SHORES CA NE')).toEqual({ address: ' 800 Macleod Trail SE ', drawingAddress: '132 CORAL SHORES CA NE' });
    expect(searchAddressChoice('800  Macleod Trail SE', '800 MACLEOD TRAIL SE')).toEqual({ address: '800  Macleod Trail SE', drawingAddress: null });
    expect(searchAddressChoice(' ', house.query.normalized)).toEqual({ address: house.query.normalized, drawingAddress: null });
    expect(searchAddressChoice(null, null)).toEqual({ address: '', drawingAddress: null });
    // Do not silently equate street aliases: a differing drawing address stays visible.
    expect(searchAddressChoice('800 Macleod Trail SE', '800 MACLEOD TR SE').drawingAddress).toBe('800 MACLEOD TR SE');
  });

  it('matches the router Calgary gate and never assumes a missing municipality is Calgary', () => {
    expect(isCalgary('Calgary, Alberta')).toBe(true);
    expect(isCalgary('CALGARY')).toBe(true);
    expect(isCalgary('edmonton')).toBe(false);
    expect(isCalgary(null)).toBe(false);
  });
});

describe('parcel candidate apply eligibility: one account, never an area total', () => {
  it('allows a positive selected account only after every one of its parcels is ticked', () => {
    const data = successes.find(f => f.name === 'macleod')!.response;
    const all = chosen(data);
    expect(canApply(all)).toBe(true);
    expect(canApply({ ...all, selectedCpids: all.selectedCpids.slice(1) })).toBe(false);
    expect(applyEligibility({ ...all, selectedCpids: [] })).toEqual({ allowed: false, missingCpids: [...data.accounts[0].cpids].sort(compareCodeUnits), warning: `Tick all parcels of this account (${data.accounts[0].cpids.length} missing)` });
  });

  it.each(['idle', 'loading', 'no_data', 'unsupported', 'error'] as const)('blocks Apply in %s', status => {
    expect(canApply({ ...initialParcelCandidatesState(), status })).toBe(false);
    expect(getApplyPayload({ ...initialParcelCandidatesState(), status })).toBeNull();
  });

  it('blocks truncated results even when account and all parcels are selected', () => {
    expect(canApply(chosen({ ...house, truncated: true }))).toBe(false);
  });

  it('blocks no account, two accounts, duplicated selections and an unknown account', () => {
    const state = chosen();
    for (const selectedRollNumbers of [[], ['first', 'second'], [state.selectedRollNumbers[0], state.selectedRollNumbers[0]], ['unknown']]) {
      expect(canApply({ ...state, selectedRollNumbers })).toBe(false);
      expect(getApplyPayload({ ...state, selectedRollNumbers })).toBeNull();
    }
  });

  it.each([0, -1, NaN, Infinity, null])('blocks unusable account area %s', landSizeSqm => {
    expect(canApply(chosen({ ...house, accounts: [{ ...house.accounts[0], landSizeSqm }] }))).toBe(false);
  });

  it('allows an account without CPIDs only with the explicit missing-identifier warning', () => {
    const data = { ...house, accounts: [{ ...house.accounts[0], cpids: [] }] };
    expect(applyEligibility(chosen(data))).toEqual({ allowed: true, missingCpids: [], warning: 'This account has no parcel identifier.' });
  });

  it.each(successes)('returns only the chosen account area and exact provenance for $name, never combined areas', ({ response }) => {
    const before = JSON.stringify(response);
    for (const account of response.accounts) {
      const state = chosen(response, account);
      const expected = { areaM2: account.landSizeSqm, rollNumber: account.rollNumber, rollYear: account.rollYear, cpids: account.cpids, searchedAddress: response.query.normalized, retrievedAt: response.retrievedAt, source: response.source };
      if (account.landSizeSqm != null && Number.isFinite(account.landSizeSqm) && account.landSizeSqm > 0) expect(getApplyPayload(state)).toEqual(expected);
      else expect(getApplyPayload(state)).toBeNull();
    }
    expect(sortAccounts(response.accounts).map(a => a.landSizeSqm)).toEqual(sortAccounts([...response.accounts].reverse()).map(a => a.landSizeSqm));
    expect(Object.keys(getApplyPayload(chosen(response))!)).not.toContain('total');
    expect(JSON.stringify(response)).toBe(before);
  });
});

describe('parcel candidate state machine', () => {
  it('starts idle with no hidden parcel or account selections', () => {
    expect(initialParcelCandidatesState()).toEqual({ status: 'idle', requestId: 0, address: '', municipality: '', selectedCpids: [], selectedRollNumbers: [] });
    expect(resolved().selectedCpids).toEqual([]);
    expect(resolved().selectedRollNumbers).toEqual([]);
  });

  it('accepts only the latest request and preserves the exact searched text', () => {
    const first = begin(1, '  first address  ');
    const second = parcelCandidatesReducer(first, { type: 'search', requestId: 2, address: 'Second address', municipality: 'Calgary' });
    expect(parcelCandidatesReducer(second, { type: 'resolve', requestId: 1, response: house })).toBe(second);
    expect(parcelCandidatesReducer(second, { type: 'reject', requestId: 1 })).toBe(second);
    const complete = parcelCandidatesReducer(second, { type: 'resolve', requestId: 2, response: house });
    expect(complete.status).toBe('ok');
    expect(complete.address).toBe('Second address');
    expect(parcelCandidatesReducer(complete, { type: 'resolve', requestId: 1, response: house })).toBe(complete);
    expect(first.address).toBe('  first address  ');
  });

  it.each([0, 1, -1, 1.5, NaN])('ignores non-incrementing or invalid request ID %s', requestId => {
    const state = begin();
    expect(parcelCandidatesReducer(state, { type: 'search', requestId, address: 'address', municipality: 'Calgary' })).toBe(state);
  });

  it.each([
    [null, 'error'], [{ error: 'unavailable' }, 'error'], [{ status: 'no_data' }, 'no_data'],
    [{ status: 'unsupported_municipality' }, 'unsupported'],
  ] as const)('handles %s without throwing', (response, status) => {
    expect(parcelCandidatesReducer(begin(), { type: 'resolve', requestId: 1, response }).status).toBe(status);
  });

  it('handles rejection and ignores duplicate completion', () => {
    const state = parcelCandidatesReducer(begin(), { type: 'reject', requestId: 1 });
    expect(state.status).toBe('error');
    expect(parcelCandidatesReducer(state, { type: 'resolve', requestId: 1, response: house })).toBe(state);
  });

  it('clears selections on a new search or reset and refuses stale responses after reset', () => {
    const state = chosen();
    const next = parcelCandidatesReducer(state, { type: 'search', requestId: 2, address: 'new', municipality: 'Calgary' });
    expect(next.selectedCpids).toEqual([]);
    expect(next.selectedRollNumbers).toEqual([]);
    const reset = parcelCandidatesReducer(next, { type: 'reset' });
    expect(reset).toEqual({ ...initialParcelCandidatesState(), requestId: 2 });
    expect(parcelCandidatesReducer(reset, { type: 'resolve', requestId: 2, response: house })).toBe(reset);
  });

  it('updates selections explicitly, deduplicates ticks and ignores unknown identifiers', () => {
    let state = resolved();
    expect(parcelCandidatesReducer(state, { type: 'parcel', cpid: 'unknown', checked: true })).toBe(state);
    expect(parcelCandidatesReducer(state, { type: 'account', rollNumber: 'unknown' })).toBe(state);
    state = parcelCandidatesReducer(state, { type: 'parcel', cpid: house.parcels[0].cpid, checked: true });
    state = parcelCandidatesReducer(state, { type: 'parcel', cpid: house.parcels[0].cpid, checked: true });
    expect(state.selectedCpids).toEqual([house.parcels[0].cpid]);
    state = parcelCandidatesReducer(state, { type: 'account', rollNumber: house.accounts[0].rollNumber });
    expect(canApply(state)).toBe(true);
    state = parcelCandidatesReducer(state, { type: 'parcel', cpid: house.parcels[0].cpid, checked: false });
    expect(canApply(state)).toBe(false);
    expect(parcelCandidatesReducer(state, { type: 'account', rollNumber: null }).selectedRollNumbers).toEqual([]);
    const loading = begin();
    expect(parcelCandidatesReducer(loading, { type: 'account', rollNumber: house.accounts[0].rollNumber })).toBe(loading);
  });
});

describe('parcel outline golden fixtures and deterministic output', () => {
  it.each(fixtures)('matches recorded $name golden paths twice byte-for-byte, regardless of parcel ordering', ({ name, response }) => {
    const parcels = response?.status === 'ok' ? response.parcels : [];
    const before = JSON.stringify(parcels);
    const first = JSON.stringify(parcelOutlines(parcels));
    expect(first).toBe(JSON.stringify(golden[name]));
    expect(JSON.stringify(parcelOutlines(parcels))).toBe(first);
    expect(JSON.stringify(parcelOutlines([...parcels].reverse()))).toBe(first);
    expect(JSON.stringify(parcels)).toBe(before);
  });

  it.each(successes)('formats, sorts, selects and projects $name twice to identical bytes using stored inputs', ({ response }) => {
    const project = () => JSON.stringify({
      parcels: sortParcels(response.parcels),
      accounts: sortAccounts(response.accounts).map(a => ({ ...a, displayedArea: formatSqm(a.landSizeSqm) })),
      retrieved: formatRetrievedAt(response.retrievedAt), outlines: parcelOutlines(response.parcels),
      applied: getApplyPayload(chosen(response)),
    });
    expect(project()).toBe(project());
  });

  it('handles a null boundary, empty set and invalid coordinates without inventing geometry', () => {
    expect(parcelOutlines([])).toEqual([]);
    expect(parcelOutlines([{ ...house.parcels[0], geometry: null }])).toEqual([{ cpid: house.parcels[0].cpid, path: '' }]);
    expect(parcelOutlines([{ ...house.parcels[0], geometry: { type: 'Polygon', coordinates: [[[NaN, 0], [1, 1], [0, 0]]] } }])[0].path).toBe('');
  });

  it('preserves a MultiPolygon hole ring and matches hand-calculated fixed-viewBox path strings', () => {
    const outer = [[0, 0], [0.01, 0], [0.01, 0.01], [0, 0.01], [0, 0]];
    const hole = [[0.002, 0.002], [0.008, 0.002], [0.008, 0.008], [0.002, 0.008], [0.002, 0.002]];
    const parcel: CandidateParcel = { ...house.parcels[0], geometry: { type: 'MultiPolygon', coordinates: [[outer, hole]] } };
    expect(parcelOutlines([parcel])[0].path).toBe('M52,228 L268,228 L268,12 L52,12 L52,228 Z M95.2,184.8 L224.8,184.8 L224.8,55.2 L95.2,55.2 L95.2,184.8 Z');
    expect(parcelOutlines([{ ...parcel, geometry: { type: 'Polygon', coordinates: [outer, hole] } }])).toEqual(parcelOutlines([parcel]));
  });

  it('uses shared bounds for different parcels and a finite centered path for degenerate points', () => {
    const base = house.parcels[0];
    const rows: CandidateParcel[] = [
      { ...base, cpid: 'west', geometry: { type: 'Polygon', coordinates: [[[0, 0], [0.01, 0], [0, 0.01], [0, 0]]] } },
      { ...base, cpid: 'east', geometry: { type: 'Polygon', coordinates: [[[0.01, 0], [0.02, 0], [0.02, 0.01], [0.01, 0]]] } },
    ];
    expect(parcelOutlines(rows)).toEqual([
      { cpid: 'east', path: 'M160,194 L308,194 L308,46 L160,194 Z' },
      { cpid: 'west', path: 'M12,194 L160,194 L12,46 L12,194 Z' },
    ]);
    expect(parcelOutlines([{ ...base, geometry: { type: 'Polygon', coordinates: [[[1, 1], [1, 1], [1, 1]]] } }])[0].path).toBe('M160,120 L160,120 L160,120 Z');
  });

  it('keeps recorded metadata and raw per-account areas instead of estimating missing data', () => {
    for (const { response } of successes) {
      expect(response.counts).toEqual({ rows: response.counts.rows, accounts: response.accounts.length, parcels: response.parcels.length });
      expect(response.areaSemantics).toBe('assessment_account_land_area_not_additive');
      expect(response.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});
