import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookupParcelArea } from './parcelAreaLookupService';

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
});
