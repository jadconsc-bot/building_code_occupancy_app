export interface ZoneLookupResult {
  zoneCode: string;
  zoneName: string;
  communityName: string | null;
  confirmedAddress: string | null;
  lat: number;
  lng: number;
  source: 'calgary_arcgis' | 'edmonton_open_data' | 'airdrie_arcgis' | 'not_found';
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
  if (mun.includes('airdrie')) {
    return lookupAirdrie(address);
  }
  if (mun.includes('rocky view') || mun.includes('rocky_view')) {
    console.log('[ZoneLookup] Rocky View County — no public API, manual selection required');
    return null;
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

async function lookupAirdrie(address: string): Promise<ZoneLookupResult | null> {
  // Parse civic number and first word of street name for the address points query
  const civicMatch = address.match(/^\s*(\d+)/);
  if (!civicMatch) return null;
  const civicNum = parseInt(civicMatch[1]);
  const remainder = address.slice(civicMatch[0].length).trim().toUpperCase();
  const streetMatch = remainder.match(/^([A-Z]+)/);
  if (!streetMatch) return null;
  const streetName = streetMatch[1];

  // Step 1: geocode via Airdrie's authoritative address points service
  const geocodeUrl = new URL(
    'https://services1.arcgis.com/bctnJobT0aahg98G/arcgis/rest/services/Airdrie_Address_Points/FeatureServer/0/query'
  );
  geocodeUrl.searchParams.set('where', `CivicNum = ${civicNum} AND StreetName LIKE '${streetName}%'`);
  geocodeUrl.searchParams.set('outFields', 'FullAddres,Longitude,Latitude,Community');
  geocodeUrl.searchParams.set('resultRecordCount', '1');
  geocodeUrl.searchParams.set('f', 'json');

  let lat: number, lng: number, confirmedAddress: string | null = null, communityName: string | null = null;
  try {
    const geoRes = await fetch(geocodeUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    const attr = geoData?.features?.[0]?.attributes;
    if (!attr || attr.Longitude == null || attr.Latitude == null) {
      console.log(`[ZoneLookup] Airdrie address not found: ${address}`);
      return null;
    }
    lat = attr.Latitude;
    lng = attr.Longitude;
    confirmedAddress = attr.FullAddres ?? null;
    communityName = attr.Community ?? null;
    console.log(`[ZoneLookup] Airdrie geocoded: ${confirmedAddress} → ${lat}, ${lng}`);
  } catch {
    return null;
  }

  // Step 2: query land use district by coordinates
  const zoneUrl = new URL(
    'https://services1.arcgis.com/bctnJobT0aahg98G/arcgis/rest/services/Airdrie_Land_Use_Districts/FeatureServer/0/query'
  );
  zoneUrl.searchParams.set('geometry', `${lng},${lat}`);
  zoneUrl.searchParams.set('geometryType', 'esriGeometryPoint');
  zoneUrl.searchParams.set('inSR', '4326');
  zoneUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  zoneUrl.searchParams.set('outFields', 'DISTRICT,DISTRICTCL,DISTRICTDE');
  zoneUrl.searchParams.set('returnGeometry', 'false');
  zoneUrl.searchParams.set('f', 'json');

  try {
    const zoneRes = await fetch(zoneUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!zoneRes.ok) return null;
    const zoneData = await zoneRes.json();
    const feature = zoneData?.features?.[0]?.attributes;
    if (!feature) return null;

    console.log(`[ZoneLookup] Airdrie result: ${feature.DISTRICT} — ${feature.DISTRICTDE}`);

    return {
      zoneCode:         feature.DISTRICT,
      zoneName:         feature.DISTRICTDE ?? feature.DISTRICTCL,
      communityName,
      confirmedAddress,
      lat, lng,
      source: 'airdrie_arcgis',
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
