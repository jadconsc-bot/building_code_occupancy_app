export interface ParcelAreaResult {
  lotAreaSqm: number;
  confirmedAddress: string | null;
  source: 'calgary_assessment' | 'edmonton_assessment';
  parcelCount: number;
  rollNumbers: string[];
  ambiguous: false;
  matchType: 'exact' | 'prefix';
}

export interface AmbiguousParcelAreaResult {
  source: 'calgary_assessment';
  parcelCount: number;
  ambiguous: true;
  matchType: 'exact' | 'prefix';
  candidates: { address: string | null; rollNumber: string | null; landSizeSqm: number | null }[];
  error: string;
}

const CALGARY_URL = 'https://data.calgary.ca/resource/4bsw-nn7w.json';
type CalgaryRow = Record<string, string>;

function escapeSoql(value: string): string {
  return value.replace(/'/g, "''");
}

async function fetchCalgary(where: string, limit: number): Promise<CalgaryRow[] | null> {
  const url = `${CALGARY_URL}?${new URLSearchParams({ $where: where, $limit: String(limit) })}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  return await response.json() as CalgaryRow[];
}

function parseArea(row: CalgaryRow): number | null {
  const rawArea = row.land_size_sm;
  if (rawArea == null || rawArea.trim() === '') return null;
  const area = Number(rawArea);
  return Number.isFinite(area) && area > 0 ? area : null;
}

function classifyRows(rows: CalgaryRow[], matchType: 'exact' | 'prefix', limit: number): ParcelAreaResult | AmbiguousParcelAreaResult {
  const rollNumbers = [...new Set(rows.map(row => row.roll_number))];
  const areas = rows.map(parseArea);
  const addresses = new Set(rows.map(row => row.address?.trim().toUpperCase()));
  const truncated = rows.length >= limit;
  if (truncated || rollNumbers.length !== 1 || !rollNumbers[0] ||
      areas.includes(null) || new Set(areas).size !== 1 ||
      (matchType === 'prefix' && addresses.size !== 1)) {
    const seen = new Set<string>();
    const candidates = rows.filter(row => {
      if (seen.has(row.roll_number)) return false;
      seen.add(row.roll_number);
      return true;
    }).slice(0, 10).map(row => ({
      address: row.address ?? null,
      rollNumber: row.roll_number ?? null,
      landSizeSqm: parseArea(row),
    }));
    return {
      source: 'calgary_assessment', parcelCount: rows.length, ambiguous: true, matchType, candidates,
      error: truncated
        ? 'Property match results were truncated; select a property before using its area.'
        : 'Multiple properties or inconsistent land areas match this address; select one.',
    };
  }
  return {
    lotAreaSqm: Math.round(areas[0]! * 100) / 100,
    confirmedAddress: rows[0].address ?? null,
    source: 'calgary_assessment', parcelCount: rows.length, rollNumbers, ambiguous: false, matchType,
  };
}

async function lookupCalgaryParcelArea(address: string): Promise<ParcelAreaResult | AmbiguousParcelAreaResult | null> {
  try {
    const escaped = escapeSoql(address.trim().toUpperCase());
    let rows = await fetchCalgary(`upper(address) = '${escaped}'`, 100);
    let matchType: 'exact' | 'prefix' = 'exact';
    if (!rows?.length) {
      const civicMatch = address.match(/^\s*(\d+)\s+(.+)$/);
      if (civicMatch) {
        const streetPrefix = civicMatch[2].trim().split(/\s+/)[0];
        matchType = 'prefix';
        rows = await fetchCalgary(`upper(address) like '${escapeSoql(`${civicMatch[1]} ${streetPrefix}`.toUpperCase())}%'`, 25);
      }
    }
    if (!rows?.length) return null;

    const result = classifyRows(rows, matchType, matchType === 'exact' ? 100 : 25);
    if (!result.ambiguous) {
      console.log(`[ParcelArea] Calgary parcel area found: ${result.lotAreaSqm} m² for ${result.confirmedAddress ?? address}`);
    }
    return result;
  } catch (error) {
    console.log(`[ParcelArea] Calgary lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function lookupParcelArea(address: string, municipality: string): Promise<ParcelAreaResult | AmbiguousParcelAreaResult | null> {
  const mun = municipality.toLowerCase();
  if (mun.includes('calgary')) return lookupCalgaryParcelArea(address);
  // Edmonton's current assessment dataset has no lot/land area field.
  return null;
}
