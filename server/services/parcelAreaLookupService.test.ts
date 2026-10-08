import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookupParcelArea, normalizeCalgaryAddress } from './parcelAreaLookupService';

const address = '800 MACLEOD TR SE';
const row = { address, roll_number: '068088293', land_size_sm: '23044.9' };
const fetchMock = vi.fn<typeof fetch>();

function respond(rows: Record<string, string>[]) {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => rows } as Response);
}

async function lookup() {
  return lookupParcelArea(address, 'Calgary');
}

describe('parcel area match safety (mock fetch; no network or DB)', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns one account area for 18 exact rows, preserving the leading-zero roll number', async () => {
    respond(Array.from({ length: 18 }, () => ({ ...row })));
    expect(await lookup()).toEqual({
      lotAreaSqm: 23044.9, confirmedAddress: address, source: 'calgary_assessment',
      parcelCount: 18, rollNumbers: ['068088293'], ambiguous: false, matchType: 'exact',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('$limit')).toBe('100');
    expect(url.searchParams.get('$where')).toBe("upper(address) = '800 MACLEOD TR SE'");
  });

  it('rejects two exact rows with different roll numbers', async () => {
    respond([row, { ...row, roll_number: '000000002' }]);
    const result = await lookup();
    expect(result).toEqual({
      source: 'calgary_assessment', parcelCount: 2, ambiguous: true, matchType: 'exact',
      candidates: [
        { address, rollNumber: '068088293', landSizeSqm: 23044.9 },
        { address, rollNumber: '000000002', landSizeSqm: 23044.9 },
      ],
      error: 'Multiple properties or inconsistent land areas match this address; select one.',
    });
    expect(result).not.toHaveProperty('lotAreaSqm');
  });

  it('rejects one roll number with inconsistent land areas and deduplicates its candidate', async () => {
    respond([row, { ...row, land_size_sm: '100' }]);
    const result = await lookup();
    expect(result).toMatchObject({ ambiguous: true, parcelCount: 2, candidates: [
      { address, rollNumber: '068088293', landSizeSqm: 23044.9 },
    ] });
    expect(result).not.toHaveProperty('lotAreaSqm');
    expect(result).toHaveProperty('error');
  });

  it('rejects an exact result at the 100-row cap as truncated', async () => {
    respond(Array.from({ length: 100 }, () => ({ ...row })));
    const result = await lookup();
    expect(result).toMatchObject({ ambiguous: true, parcelCount: 100, matchType: 'exact' });
    expect(result).toHaveProperty('error', expect.stringMatching(/truncated/i));
    expect(result).not.toHaveProperty('lotAreaSqm');
  });

  it('returns a prefix match only when all rows identify the same property', async () => {
    respond([]);
    respond([row, { ...row, address: ' 800 macleod tr se ' }]);
    expect(await lookup()).toEqual({
      lotAreaSqm: 23044.9, confirmedAddress: address, source: 'calgary_assessment',
      parcelCount: 2, rollNumbers: ['068088293'], ambiguous: false, matchType: 'prefix',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const url = new URL(String(fetchMock.mock.calls[1][0]));
    expect(url.searchParams.get('$limit')).toBe('25');
    expect(url.searchParams.get('$where')).toBe("upper(address) like '800 MACLEOD%'");
  });

  it('rejects different prefix addresses instead of using the first row', async () => {
    respond([]);
    respond([row, { ...row, address: '800 MACLEOD TR SW' }]);
    const result = await lookup();
    expect(result).toMatchObject({ ambiguous: true, matchType: 'prefix', parcelCount: 2 });
    expect(result).not.toHaveProperty('lotAreaSqm');
    expect(result).toHaveProperty('error');
  });

  it('rejects a prefix result at the 25-row cap rather than trusting a truncated set', async () => {
    respond([]);
    respond(Array.from({ length: 25 }, () => ({ ...row })));
    const result = await lookup();
    expect(result).toMatchObject({ ambiguous: true, matchType: 'prefix', parcelCount: 25 });
    expect(result).toHaveProperty('error', expect.stringMatching(/truncated/i));
    expect(result).not.toHaveProperty('lotAreaSqm');
  });

  it.each([undefined, 'not-a-number', '', ' ', '0', '-1', 'Infinity'])('rejects missing or unusable area %s alongside a numeric area', async rawArea => {
    const invalid: Record<string, string> = { address, roll_number: row.roll_number };
    if (rawArea !== undefined) invalid.land_size_sm = rawArea;
    respond([invalid, row]);
    const result = await lookup();
    expect(result).toMatchObject({ ambiguous: true, candidates: [
      { landSizeSqm: null },
    ] });
    expect(result).not.toHaveProperty('lotAreaSqm');
    expect(result).toHaveProperty('error');
  });

  it('limits ambiguous candidates to ten distinct roll numbers', async () => {
    const rows = Array.from({ length: 11 }, (_, i) => ({ ...row, roll_number: `000${i}` }));
    respond([...rows, rows[0]]);
    const result = await lookup();
    expect(result).toMatchObject({ ambiguous: true, parcelCount: 12 });
    if (!result?.ambiguous) throw new Error('Expected an ambiguous result');
    expect(result.candidates).toHaveLength(10);
    expect(new Set(result.candidates.map(candidate => candidate.rollNumber)).size).toBe(10);
  });

  it('preserves the null service result for no matches (router supplies the existing error)', async () => {
    respond([]);
    respond([]);
    expect(await lookup()).toBeNull();
  });

  it('preserves the null service result for non-OK HTTP (router supplies the existing error)', async () => {
    fetchMock.mockResolvedValue({ ok: false } as Response);
    expect(await lookup()).toBeNull();
  });

  it('preserves the null service result for network failure (router supplies the existing error)', async () => {
    fetchMock.mockRejectedValue(new Error('Network unavailable'));
    expect(await lookup()).toBeNull();
  });

  it.each([
    '800 Macleod Trail SE, Calgary',
    '800 Macleod Trl SE, Calgary, AB T2G 5A6, Canada',
  ])('normalizes %s into the exact 18-row account match', async input => {
    respond(Array.from({ length: 18 }, () => ({ ...row })));
    expect(await lookupParcelArea(input, 'Calgary')).toEqual({
      lotAreaSqm: 23044.9, confirmedAddress: address, source: 'calgary_assessment',
      parcelCount: 18, rollNumbers: ['068088293'], ambiguous: false, matchType: 'exact',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('$where'))
      .toBe("upper(address) = '800 MACLEOD TR SE'");
  });

  it('keeps quadrant-less prefix matches across quadrants ambiguous', async () => {
    respond([]);
    respond([
      { ...row, address: '100 1 ST SE' },
      { ...row, address: '100 1 ST NW', roll_number: '000000002' },
    ]);
    const result = await lookupParcelArea('100 1 St', 'Calgary');
    expect(result).toMatchObject({ ambiguous: true, matchType: 'prefix', parcelCount: 2 });
    expect(result).not.toHaveProperty('lotAreaSqm');
    if (!result?.ambiguous) throw new Error('Expected ambiguity');
    expect(result.candidates.map(candidate => candidate.address)).toEqual(['100 1 ST SE', '100 1 ST NW']);
  });

  it('does not return a usable area or a candidate from a conflicting quadrant in an exact response', async () => {
    respond([{ ...row, address: '800 MACLEOD TR SW' }]);
    const result = await lookupParcelArea('800 Macleod Trail SE', 'Calgary');
    expect(result).toMatchObject({ ambiguous: true, matchType: 'exact', candidates: [] });
    expect(result).not.toHaveProperty('lotAreaSqm');
    expect(result).not.toHaveProperty('confirmedAddress');
  });

  it('excludes conflicting quadrant candidates from a prefix response without trusting the first row', async () => {
    respond([]);
    respond([{ ...row, address: '800 MACLEOD TR SW' }, row]);
    const result = await lookupParcelArea('800 Macleod Trail Southeast', 'Calgary');
    expect(result).toMatchObject({ ambiguous: true, matchType: 'prefix', parcelCount: 2, candidates: [
      { address, rollNumber: '068088293', landSizeSqm: 23044.9 },
    ] });
    expect(result).not.toHaveProperty('lotAreaSqm');
  });

  it.each(['%', '_'])('removes user wildcard %s so only the deliberate trailing wildcard reaches LIKE', async wildcard => {
    respond([]);
    respond([]);
    expect(await lookupParcelArea(`800 Mac${wildcard}leod Trail SE`, 'Calgary')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const exact = new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('$where');
    const prefix = new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('$where')!;
    expect(exact).toBe("upper(address) = '800 MACLEOD TR SE'");
    expect(prefix).toBe("upper(address) like '800 MACLEOD%'");
    expect(prefix.match(/%/g)).toHaveLength(1);
    expect(prefix).not.toContain('_');
  });

  it('doubles apostrophes and URL-encodes both exact and prefix queries', async () => {
    respond([]);
    respond([]);
    expect(await lookupParcelArea("100 O'Brien Road SE", 'Calgary')).toBeNull();
    const exactUrl = String(fetchMock.mock.calls[0][0]);
    const prefixUrl = String(fetchMock.mock.calls[1][0]);
    expect(new URL(exactUrl).searchParams.get('$where')).toBe("upper(address) = '100 O''BRIEN RD SE'");
    expect(new URL(prefixUrl).searchParams.get('$where')).toBe("upper(address) like '100 O''BRIEN%'");
    expect(exactUrl).toContain('O%27%27BRIEN');
    expect(prefixUrl).toContain('O%27%27BRIEN%25');
    expect(exactUrl).not.toContain("'");
  });

  it('keeps building-only lookup limited to its literal civic prefix, without searching unit rows', async () => {
    respond([]);
    respond([]);
    expect(await lookupParcelArea('823 5 St NE', 'Calgary')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('$where'))
      .toBe("upper(address) like '823 5%'");
  });
});

describe('normalizeCalgaryAddress (pure; no fetch)', () => {
  it.each([
    ['800 Macleod Trail SE', '800 MACLEOD TR SE', 'SE'],
    ['800 Macleod Trl SE, Calgary, AB T2G 5A6, Canada', '800 MACLEOD TR SE', 'SE'],
    ['100 8th Avenue Southwest', '100 8 AV SW', 'SW'],
    ['100 8 Ave S.W.', '100 8 AV SW', 'SW'],
    ['800 Macleod Trail South East', '800 MACLEOD TR SE', 'SE'],
    ['800 Macleod Trail S E', '800 MACLEOD TR SE', 'SE'],
    ['800 Macleod Trail S.E.', '800 MACLEOD TR SE', 'SE'],
    ['800 Macleod Trail North East', '800 MACLEOD TR NE', 'NE'],
    ['800 Macleod Trail Northeast', '800 MACLEOD TR NE', 'NE'],
    ['800 Macleod Trail N E', '800 MACLEOD TR NE', 'NE'],
    ['800 Macleod Trail North West', '800 MACLEOD TR NW', 'NW'],
    ['800 Macleod Trail Northwest', '800 MACLEOD TR NW', 'NW'],
    ['800 Macleod Trail N.W.', '800 MACLEOD TR NW', 'NW'],
    ['800 Macleod Trail South West', '800 MACLEOD TR SW', 'SW'],
    ['800 Macleod Trail S W', '800 MACLEOD TR SW', 'SW'],
    ['4514 North Haven Drive NW', '4514 NORTH HAVEN DR NW', 'NW'],
    ['25 West Grove Point SW', '25 WEST GROVE PT SW', 'SW'],
    ['255 East Hills Boulevard SE', '255 EAST HILLS BV SE', 'SE'],
    ['100 North East Road', '100 NORTH EAST RD', null],
    ['100 North East Road SW', '100 NORTH EAST RD SW', 'SW'],
    ['100 1 St', '100 1 ST', null],
    ['132 Coral Shores CA NE', '132 CORAL SHORES CA NE', 'NE'],
    ['132 Coral Shores CA', '132 CORAL SHORES CA', null],
    ['800 Macleod Trl SE Calgary AB T2G 5A6 Canada', '800 MACLEOD TR SE', 'SE'],
    ['100 1 Street Calgary Alberta T2G 5A6 Canada', '100 1 ST', null],
    ['100 1 Street Calgary AB T2G5A6', '100 1 ST', null],
    ['100 Calgary Road NE', '100 CALGARY RD NE', 'NE'],
    ['100 AB Way', '100 AB WY', null],
    ['100 Example Mystery SE', '100 EXAMPLE MYSTERY SE', 'SE'],
    ['#101 823 5 St NE', '101 823 5 ST NE', 'NE'],
    ['101-823 5 St NE', '101 823 5 ST NE', 'NE'],
    ['Unit 101, 823 5 St NE', '101 823 5 ST NE', 'NE'],
    ['Suite 101 823 5 St NE', '101 823 5 ST NE', 'NE'],
    ['Unit 105, 431C Huntsville Crescent NW', '105 431C HUNTSVILLE CR NW', 'NW'],
    ['122 8 AV NE', '122 8 AV NE', 'NE'],
    ['1 6416 4A St NE', '1 6416 4A ST NE', 'NE'],
    ['100 21A Street NW', '100 21A ST NW', 'NW'],
    ['100 1st Street NE', '100 1 ST NE', 'NE'],
    ['100 2nd Avenue SE', '100 2 AV SE', 'SE'],
    ['100 3rd Avenue NW', '100 3 AV NW', 'NW'],
    ['  800   Macleod  Trl.  SE  ', '800 MACLEOD TR SE', 'SE'],
    ["100 O'Brien Road SE", "100 O'BRIEN RD SE", 'SE'],
    ['800 Mac%_leod Trail SE', '800 MACLEOD TR SE', 'SE'],
    ['100 A/B & C! Road SE', '100 A/B & C RD SE', 'SE'],
  ])('normalizes %s without changing the street name or inventing a quadrant', (input, normalized, quadrant) => {
    expect(normalizeCalgaryAddress(input!)).toEqual({ normalized, quadrant });
  });

  // Expected pairs independently verified against Calgary's published street-type reference.
  it.each([
    ['Alley', 'AL'], ['Avenue', 'AV'], ['Bay', 'BA'], ['Boulevard', 'BV'], ['Cape', 'CA'],
    ['Centre', 'CE'], ['Circle', 'CI'], ['Close', 'CL'], ['Common', 'CM'], ['Court', 'CO'],
    ['Crescent', 'CR'], ['Cove', 'CV'], ['Drive', 'DR'], ['Gate', 'GA'], ['Gardens', 'GD'],
    ['Green', 'GR'], ['Grove', 'GV'], ['Heath', 'HE'], ['Highway', 'HI'], ['Hill', 'HL'],
    ['Heights', 'HT'], ['Island', 'IS'], ['Landing', 'LD'], ['Link', 'LI'], ['Lane', 'LN'],
    ['Mews', 'ME'], ['Manor', 'MR'], ['Mount', 'MT'], ['Park', 'PA'], ['Path', 'PH'],
    ['Place', 'PL'], ['Parade', 'PR'], ['Passage', 'PS'], ['Point', 'PT'], ['Parkway', 'PY'],
    ['Plaza', 'PZ'], ['Road', 'RD'], ['Rise', 'RI'], ['Row', 'RO'], ['Square', 'SQ'],
    ['Street', 'ST'], ['Terrace', 'TC'], ['Trail', 'TR'], ['Villas', 'VI'], ['View', 'VW'],
    ['Walk', 'WK'], ['Way', 'WY'],
    ['Ave', 'AV'], ['Blvd', 'BV'], ['Ctr', 'CE'], ['Cir', 'CI'], ['Ct', 'CO'], ['Crt', 'CO'],
    ['Cres', 'CR'], ['Gdns', 'GD'], ['Hwy', 'HI'], ['Hts', 'HT'], ['Landng', 'LD'], ['Pk', 'PA'],
    ['Pass', 'PS'], ['Pky', 'PY'], ['Pkwy', 'PY'], ['Terr', 'TC'], ['Trl', 'TR'],
  ])('maps only the final street type %s to %s and leaves dataset tokens unchanged', (type, expected) => {
    expect(normalizeCalgaryAddress(`100 ${type} ${type} NE`).normalized)
      .toBe(`100 ${type.toUpperCase()} ${expected} NE`);
    expect(normalizeCalgaryAddress(`100 EXAMPLE ${expected} NE`).normalized)
      .toBe(`100 EXAMPLE ${expected} NE`);
  });
});
