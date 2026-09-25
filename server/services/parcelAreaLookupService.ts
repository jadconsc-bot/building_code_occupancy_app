export interface ParcelAreaResult {
  lotAreaSqm: number;
  confirmedAddress: string | null;
  source: 'calgary_assessment' | 'edmonton_assessment';
}

const CALGARY_URL = 'https://data.calgary.ca/resource/4bsw-nn7w.json';

function escapeSoql(value: string): string {
  return value.replace(/'/g, "''");
}

async function fetchCalgary(where: string): Promise<Record<string, string> | null> {
  const url = `${CALGARY_URL}?${new URLSearchParams({ $where: where, $limit: '1' })}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const rows = await response.json() as Record<string, string>[];
  return rows[0] ?? null;
}

async function lookupCalgaryParcelArea(address: string): Promise<ParcelAreaResult | null> {
  try {
    const escaped = escapeSoql(address.trim().toUpperCase());
    let row = await fetchCalgary(`upper(address) = '${escaped}'`);
    if (!row) {
      const civicMatch = address.match(/^\s*(\d+)\s+(.+)$/);
      if (civicMatch) {
        const streetPrefix = civicMatch[2].trim().split(/\s+/)[0];
        row = await fetchCalgary(`upper(address) like '${escapeSoql(`${civicMatch[1]} ${streetPrefix}`.toUpperCase())}%'`);
      }
    }
    if (!row) return null;

    const rawArea = row.land_size_sm;
    if (rawArea == null) {
      console.log('[ParcelArea] Calgary response missing land_size_sm');
      return null;
    }
    const area = Number(rawArea);
    if (!Number.isFinite(area) || area <= 0) return null;
    const result = {
      lotAreaSqm: Math.round(area * 100) / 100,
      confirmedAddress: row.address ?? null,
      source: 'calgary_assessment' as const,
    };
    console.log(`[ParcelArea] Calgary parcel area found: ${result.lotAreaSqm} m² for ${result.confirmedAddress ?? address}`);
    return result;
  } catch (error) {
    console.log(`[ParcelArea] Calgary lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function lookupParcelArea(address: string, municipality: string): Promise<ParcelAreaResult | null> {
  const mun = municipality.toLowerCase();
  if (mun.includes('calgary')) return lookupCalgaryParcelArea(address);
  // Edmonton's current assessment dataset has no lot/land area field.
  return null;
}
