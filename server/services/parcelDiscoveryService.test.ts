import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverCalgaryParcels, groupDiscoveryRows, type DiscoveryRow, type PublishedMultiPolygon } from './parcelDiscoveryService';
import { normalizeCalgaryAddress } from './parcelAreaLookupService';

vi.mock('./parcelAreaLookupService', async importOriginal => {
  const actual = await importOriginal<typeof import('./parcelAreaLookupService')>();
  return { ...actual, normalizeCalgaryAddress: vi.fn(actual.normalizeCalgaryAddress) };
});

const boundary: PublishedMultiPolygon = { type: 'MultiPolygon', coordinates: [[[[-114, 51], [-114.001, 51], [-114, 51.001], [-114, 51]]]] };
const house: DiscoveryRow = {
  address: '132 CORAL SHORES CA NE', roll_number: '507123305', cpid: '100570855',
  roll_year: '2026', assessment_class: 'RE', land_size_sm: '654.4',
  land_use_designation: 'R-C1,R-CG', short_legal: '9813368;10;11', multipolygon: boundary,
};
const fetchMock = vi.fn<typeof fetch>();
const respond = (rows: DiscoveryRow[]) => fetchMock.mockResolvedValueOnce({ ok: true, json: async () => rows } as Response);
const group = (matched: DiscoveryRow[], expanded: DiscoveryRow[] = []) => groupDiscoveryRows(matched, expanded, '132 CORAL SHORES CA NE', true, false);
const discover = async (address: string) => {
  const result = await discoverCalgaryParcels(address);
  expect(result?.status).toBe('ok');
  if (result?.status !== 'ok') throw new Error('Expected discovery result');
  return result;
};

describe('parcel discovery grouping (no network or DB)', () => {
  it('groups a house as one parcel and one account, preserving raw zoning and identifiers', () => {
    const result = group([house]);
    expect(result.counts).toEqual({ rows: 1, accounts: 1, parcels: 1 });
    expect(result.parcels[0]).toEqual({ cpid: '100570855', geometry: boundary, landUseDesignations: ['R-C1,R-CG'], shortLegals: ['9813368;10;11'], accountRollNumbers: ['507123305'], addresses: [house.address], matchedRequestedAddress: true });
    expect(result.accounts[0]).toEqual({ rollNumber: '507123305', address: house.address, assessmentClass: 'RE', rollYear: 2026, landSizeSqm: 654.4, cpids: ['100570855'], viaSharedParcel: false });
    expect(result.areaSemantics).toBe('assessment_account_land_area_not_additive');
    expect(Number.isNaN(Date.parse(result.retrievedAt))).toBe(false);
  });

  it('keeps the condo account areas repeated, never summed, for 14 accounts on one parcel', () => {
    const rows = Array.from({ length: 14 }, (_, i) => ({ ...house, address: `${101 + i} 823 5 ST NE`, cpid: '100170342', roll_number: `05752${String(i).padStart(4, '0')}`, land_size_sm: '836.0' }));
    const result = group(rows);
    expect(result.counts).toEqual({ rows: 14, accounts: 14, parcels: 1 });
    expect(result.accounts.map(a => a.landSizeSqm)).toEqual(Array(14).fill(836));
    expect(JSON.stringify(result)).not.toContain(String(14 * 836));
    expect(result.warnings).toContain('Several accounts share parcel 100170342; their land areas are not additive.');
  });

  it('groups 18 large-site rows into one account and 18 parcels without adding area', () => {
    const rows = Array.from({ length: 18 }, (_, i) => ({ ...house, address: '800 MACLEOD TR SE', roll_number: '068088293', cpid: String(580549175 + i), land_size_sm: '23044.9' }));
    const result = group(rows);
    expect(result.counts).toEqual({ rows: 18, accounts: 1, parcels: 18 });
    expect(result.accounts[0].landSizeSqm).toBe(23044.9);
    expect(result.warnings).toContain('Account 068088293 spans multiple CPIDs; its land area is not additive.');
  });

  it('retains a parcel with null geometry and names its missing boundary', () => {
    const result = group([{ ...house, multipolygon: null }]);
    expect(result.counts.parcels).toBe(1);
    expect(result.parcels[0].geometry).toBeNull();
    expect(result.warnings).toContain('Parcel 100570855 has no published boundary.');
  });

  it('keeps an account without CPID and warns without inventing a parcel', () => {
    const result = group([{ ...house, cpid: undefined }]);
    expect(result.counts).toEqual({ rows: 1, accounts: 1, parcels: 0 });
    expect(result.accounts[0].cpids).toEqual([]);
    expect(result.warnings).toContain('Account 507123305 has no parcel identifier.');
  });

  it('uses a later published boundary for the same CPID without a missing-boundary warning', () => {
    const result = group([{ ...house, multipolygon: null }, house]);
    expect(result.parcels[0].geometry).toEqual(boundary);
    expect(result.warnings).not.toContain('Parcel 100570855 has no published boundary.');
  });

  it('keeps the first of different geometries and warns rather than merging', () => {
    const other: PublishedMultiPolygon = { type: 'MultiPolygon', coordinates: [[[[-115, 51], [-115.001, 51], [-115, 51.001], [-115, 51]]]] };
    const result = group([house, { ...house, multipolygon: other }]);
    expect(result.parcels[0].geometry).toEqual(boundary);
    expect(result.warnings).toContain('Parcel 100570855 geometries differed; the first published boundary was retained.');
  });

  it('keeps the first inconsistent account area and lists all distinct values', () => {
    const result = group([house, { ...house, land_size_sm: '700' }, { ...house, land_size_sm: 'invalid' }]);
    expect(result.accounts[0].landSizeSqm).toBe(654.4);
    expect(result.warnings).toContain('Account 507123305 land area values differed (654.4, 700, unknown); the first value was retained.');
  });

  it('deduplicates the overlap between requests and retains direct-match provenance', () => {
    const result = group([house], [house]);
    expect(result.counts).toEqual({ rows: 1, accounts: 1, parcels: 1 });
    expect(result.accounts[0].viaSharedParcel).toBe(false);
  });

  it('retains parcels but creates no accounts for two empty or missing roll numbers', () => {
    const result = group([{ ...house, roll_number: '' }, { ...house, roll_number: undefined, cpid: '100170856' }]);
    expect(result.counts).toEqual({ rows: 2, accounts: 0, parcels: 2 });
    expect(result.accounts).toEqual([]);
    expect(result.parcels.map(p => p.accountRollNumbers)).toEqual([[], []]);
    expect(result.warnings).toContain('2 rows without a roll number were ignored for accounts');
  });

  it('treats a whitespace-only roll number as missing without merging it into an account', () => {
    const result = group([{ ...house, roll_number: '   ' }, house]);
    expect(result.counts.accounts).toBe(1);
    expect(result.warnings).toContain('1 rows without a roll number were ignored for accounts');
  });

  it('does not warn when identical geometry keys are published in a different order', () => {
    const reordered: PublishedMultiPolygon = { coordinates: boundary.coordinates, type: 'MultiPolygon' };
    const result = group([house, { ...house, multipolygon: reordered }]);
    expect(result.parcels[0].geometry).toEqual(boundary);
    expect(result.warnings.some(w => w.includes('geometries differed'))).toBe(false);
  });
});

describe('parcel discovery queries (mock fetch; no network or DB)', () => {
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('queries a house with the exact selected fields and one CPID expansion', async () => {
    respond([house]); respond([house]);
    expect((await discover('132 Coral Shores CA NE')).counts).toEqual({ rows: 1, accounts: 1, parcels: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('$select')).toBe('roll_year,roll_number,address,assessment_class,assessment_class_description,land_use_designation,land_size_sm,short_legal,cpid,mod_date,multipolygon');
    expect(url.searchParams.get('$limit')).toBe('200');
    expect(url.searchParams.get('$where')).toBe("upper(address) = '132 CORAL SHORES CA NE' OR upper(address) like '% 132 CORAL SHORES CA NE'");
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('$where')).toBe("cpid in ('100570855')");
    for (const call of fetchMock.mock.calls) {
      expect(new URL(String(call[0])).searchParams.get('$order')).toBe('address,roll_number,cpid');
    }
  });

  it.each([
    ['701 MCDOUGALL RD NE', '703 MCDOUGALL RD NE', '100565132'],
    ['1255 GLADSTONE RD NW', '322 12 ST NW', '160169281'],
  ])('finds the other account on the shared parcel for %s, once only', async (address, alternate, cpid) => {
    const direct = { ...house, address, cpid };
    respond([direct]); respond([direct, { ...direct, address: alternate, roll_number: '000000002' }, { ...direct, address: 'OTHER', cpid: 'unrequested' }]);
    const result = await discover(address);
    expect(result.counts).toEqual({ rows: 2, accounts: 2, parcels: 1 });
    expect(result.accounts[1]).toMatchObject({ address: alternate, viaSharedParcel: true });
    expect(result.parcels[0].matchedRequestedAddress).toBe(true);
    expect(result.warnings).toContain('Additional accounts were found via shared-parcel expansion.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('finds condo units from the building address while excluding wrong civic and malformed units', async () => {
    const valid = Array.from({ length: 14 }, (_, i) => ({ ...house, address: `${101 + i} 823 5 ST NE`, roll_number: String(i), cpid: '100170342', land_size_sm: '836' }));
    respond([...valid, ...['1823 5 ST NE', 'A 823 5 ST NE', '101 102 823 5 ST NE'].map(address => ({ ...house, address }))]);
    respond(valid);
    expect((await discover('823 5 St NE')).counts).toEqual({ rows: 14, accounts: 14, parcels: 1 });
  });

  it('drops unrelated numbered streets even when the public query returns them', async () => {
    respond([{ ...house, address: '100 1010 8 AV SW' }]);
    expect(await discoverCalgaryParcels('100 1')).toEqual({ status: 'no_data' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps quadrant-less matches separate and reports the missing quadrant', async () => {
    const rows = ['SE', 'NW'].map((q, i) => ({ ...house, address: `7128 5 ST ${q}`, cpid: String(i), roll_number: String(i) }));
    respond(rows); respond(rows);
    const result = await discover('7128 5 St');
    expect(result.quadrantSupplied).toBe(false);
    expect(result.counts.parcels).toBe(2);
    expect(result.warnings).toContain('No quadrant was supplied; candidates may span several quadrants.');
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('$where')).toBe("upper(address) like '7128 5 ST %' OR upper(address) like '% 7128 5 ST %'");
  });

  it('does not accept a conflicting supplied quadrant', async () => {
    respond([{ ...house, address: '132 CORAL SHORES CA NW' }]);
    expect(await discoverCalgaryParcels('132 Coral Shores CA NE')).toEqual({ status: 'no_data' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('marks truncation from 200 raw address rows even when only one survives', async () => {
    respond([house, ...Array.from({ length: 199 }, () => ({ ...house, address: 'OTHER' }))]); respond([house]);
    const result = await discover('132 Coral Shores CA NE');
    expect(result.truncated).toBe(true);
    expect(result.counts.rows).toBe(1);
    expect(result.warnings.join(' ')).toContain('truncated');
  });

  it('marks truncation from the raw expansion cap without recursing', async () => {
    respond([house]); respond(Array.from({ length: 200 }, () => house));
    expect((await discover('132 Coral Shores CA NE')).truncated).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns no_data after one empty address query', async () => {
    respond([]);
    expect(await discoverCalgaryParcels('NOT A REAL ADDRESS')).toEqual({ status: 'no_data' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns an account without a parcel identifier without issuing an empty expansion', async () => {
    respond([{ ...house, cpid: undefined }]);
    expect((await discover('132 Coral Shores CA NE')).counts.parcels).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('quote-escapes and URL-encodes both queries while removing input wildcards', async () => {
    const row = { ...house, address: "100 O'BRIEN RD SE", cpid: '00-12' };
    respond([row]); respond([row]);
    await discover("100 O'%_Brien Road SE");
    const first = new URL(String(fetchMock.mock.calls[0][0]));
    expect(first.searchParams.get('$where')).toBe("upper(address) = '100 O''BRIEN RD SE' OR upper(address) like '% 100 O''BRIEN RD SE'");
    expect(first.searchParams.get('$where')!.match(/%/g)).toHaveLength(1);
    expect(first.searchParams.get('$where')).not.toContain('_');
    const second = new URL(String(fetchMock.mock.calls[1][0]));
    expect(second.searchParams.get('$where')).toBe("cpid in ('00-12')");
    expect(second.toString()).toContain('%27');
  });

  it.each(['http', 'network', 'expansion'])('returns null on %s failure without logging dataset rows', async failure => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    if (failure === 'expansion') respond([house]);
    if (failure === 'http') fetchMock.mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    else fetchMock.mockRejectedValueOnce(new Error('failure'));
    expect(await discoverCalgaryParcels('132 Coral Shores CA NE')).toBeNull();
    expect(warn).toHaveBeenCalledExactlyOnceWith(failure === 'http' ? 'http_500' : 'network_error');
  });

  it.each([
    ['132 CORAL% SHORES CA NE', 'NE'],
    ['132 CORAL_SHORES CA NE', 'NE'],
    ['132 CORAL SHORES CA N%', 'N%'],
    ['132 CORAL SHORES CA N_', 'N_'],
  ])('rejects wildcards left after normalization: %s', async (normalized, quadrant) => {
    // Simulate a future normalizer regression without changing the real normalizer.
    vi.mocked(normalizeCalgaryAddress).mockReturnValueOnce({ normalized, quadrant });
    expect(await discoverCalgaryParcels('132 Coral Shores CA NE')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["00'12", '00 12', '00%12', '00_12', '123456789012345678901'])('skips invalid CPID %s and avoids expansion if it is the only identifier', async cpid => {
    respond([{ ...house, cpid }]);
    const result = await discover('132 Coral Shores CA NE');
    expect(result.counts).toEqual({ rows: 1, accounts: 1, parcels: 1 });
    expect(result.parcels[0].cpid).toBe(cpid);
    expect(result.warnings).toContain(`Parcel ${cpid} was skipped for expansion because its identifier format is invalid.`);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('expands only valid CPIDs when the matched set also contains invalid identifiers', async () => {
    respond([house, { ...house, cpid: "bad'id" }]); respond([house]);
    const result = await discover('132 Coral Shores CA NE');
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('$where')).toBe("cpid in ('100570855')");
    expect(result.warnings).toContain("Parcel bad'id was skipped for expansion because its identifier format is invalid.");
  });

  it.each(['timeout', 'http_500', 'parse_error', 'network_error'])('logs one category-only line for %s and returns null', async category => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const privateDetail = `132 CORAL SHORES CA NE $where 507123305 ${JSON.stringify(boundary.coordinates)}`;
    if (category === 'http_500') fetchMock.mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    else if (category === 'parse_error') fetchMock.mockResolvedValueOnce({ ok: true, json: async () => { throw new SyntaxError(privateDetail); } } as unknown as Response);
    else fetchMock.mockRejectedValueOnce(category === 'timeout' ? new DOMException(privateDetail, 'TimeoutError') : new Error(privateDetail));
    expect(await discoverCalgaryParcels('132 Coral Shores CA NE')).toBeNull();
    expect(warn).toHaveBeenCalledExactlyOnceWith(category);
    const logged = warn.mock.calls.flat().join(' ');
    for (const value of ['132 CORAL SHORES CA NE', '$where', '507123305', JSON.stringify(boundary.coordinates)]) expect(logged).not.toContain(value);
  });
});
