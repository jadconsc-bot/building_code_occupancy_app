export interface ZoneLookupResult {
  zoneCode: string;
  zoneName: string;
  communityName: string | null;
  confirmedAddress: string | null;
  lat: number;
  lng: number;
  source: 'calgary_arcgis' | 'edmonton_open_data' | 'not_found';
}

export async function lookupZone(
  address: string,
  municipality: string,
  province: string,
): Promise<ZoneLookupResult | null> {
  const coords = await geocodeAddress(address, municipality, province);
  if (!coords) {
    console.log(`[ZoneLookup] Geocoding failed for: ${address}, ${municipality}`);
    return null;
  }

  console.log(`[ZoneLookup] Geocoded: ${address} → ${coords.lat}, ${coords.lng}`);

  const mun = municipality.toLowerCase();
  if (mun.includes('calgary')) {
    return lookupCalgary(coords.lat, coords.lng);
  }
  if (mun.includes('edmonton')) {
    return lookupEdmonton(coords.lat, coords.lng);
  }

  console.log(`[ZoneLookup] No zone API for municipality: ${municipality}`);
  return null;
}

async function geocodeAddress(
  address: string,
  city: string,
  province: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${address}, ${city}, ${province}, Canada`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ca`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CodeComply/1.0 (jadconsc@gmail.com)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

async function lookupCalgary(
  lat: number,
  lng: number,
): Promise<ZoneLookupResult | null> {
  const url = new URL(
    'https://gis.calgary.ca/arcgis/rest/services/pub_Planning/LandUse/MapServer/0/query'
  );
  url.searchParams.set('geometry', `${lng},${lat}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('outFields',
    'LAND_USE_DISTRICT_CODE,LAND_USE_DISTRICT_NAME,COMMUNITY_NAME,PARCEL_ADDRESS'
  );
  url.searchParams.set('returnGeometry', 'false');
  url.searchParams.set('f', 'json');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0]?.attributes;
    if (!feature) return null;

    console.log(`[ZoneLookup] Calgary result: ${feature.LAND_USE_DISTRICT_CODE} — ${feature.COMMUNITY_NAME}`);

    return {
      zoneCode:         feature.LAND_USE_DISTRICT_CODE,
      zoneName:         feature.LAND_USE_DISTRICT_NAME,
      communityName:    feature.COMMUNITY_NAME,
      confirmedAddress: feature.PARCEL_ADDRESS,
      lat, lng,
      source: 'calgary_arcgis',
    };
  } catch {
    return null;
  }
}

async function lookupEdmonton(
  lat: number,
  lng: number,
): Promise<ZoneLookupResult | null> {
  const url = new URL('https://data.edmonton.ca/resource/e4bc-9ngp.json');
  url.searchParams.set('$where', `within_circle(shape, ${lat}, ${lng}, 10)`);
  url.searchParams.set('$select', 'zone,zone_description,address');
  url.searchParams.set('$limit', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;

    return {
      zoneCode:         data[0].zone,
      zoneName:         data[0].zone_description,
      communityName:    null,
      confirmedAddress: data[0].address,
      lat, lng,
      source: 'edmonton_open_data',
    };
  } catch {
    return null;
  }
}
