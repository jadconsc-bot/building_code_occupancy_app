export interface ZoneLookupResult {
  zoneCode: string;
  zoneName: string;
  communityName: string | null;
  confirmedAddress: string | null;
  lat: number;
  lng: number;
  source: 'calgary_arcgis' | 'edmonton_open_data' | 'airdrie_arcgis' | 'chestermere_arcgis' | 'st_albert_arcgis' | 'strathcona_arcgis' | 'okotoks_arcgis' | 'not_found';
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
  if (mun.includes('chestermere')) {
    return lookupChestermere(address);
  }
  if (mun.includes('st. albert') || mun.includes('st albert') || mun.includes('stalbert')) {
    return lookupStAlbert(coords.lat, coords.lng);
  }
  if (mun.includes('strathcona')) {
    return lookupStrathcona(coords.lat, coords.lng);
  }
  if (mun.includes('okotoks')) {
    return lookupOkotoks(coords.lat, coords.lng);
  }
  if (mun.includes('rocky view') || mun.includes('rocky_view')) {
    console.log('[ZoneLookup] Rocky View County — no public API, manual selection required');
    return null;
  }
  if (mun.includes('red deer')) {
    console.log('[ZoneLookup] Red Deer — no public API, manual selection required');
    return null;
  }
  if (mun.includes('spruce grove')) {
    console.log('[ZoneLookup] Spruce Grove — no public API, manual selection required');
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
    'https://services1.arcgis.com/AVP60cs0Q9PEA8rH/arcgis/rest/services/Calgary_Land_Use/FeatureServer/0/query'
  );
  url.searchParams.set('geometry', `${lng},${lat}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('outFields', 'LU_CODE,DESCRIPTION,LABEL');
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

    console.log(`[ZoneLookup] Calgary result: ${feature.LU_CODE} — ${feature.DESCRIPTION}`);

    return {
      zoneCode:         feature.LU_CODE,
      zoneName:         feature.DESCRIPTION,
      communityName:    null,
      confirmedAddress: null,
      lat, lng,
      source: 'calgary_arcgis',
    };
  } catch {
    return null;
  }
}

async function lookupChestermere(address: string): Promise<ZoneLookupResult | null> {
  const civicMatch = address.match(/^\s*(\d+)/);
  if (!civicMatch) return null;
  const civicNum = parseInt(civicMatch[1]);
  const remainder = address.slice(civicMatch[0].length).trim().toUpperCase();
  const streetMatch = remainder.match(/^([A-Z]+)/);
  if (!streetMatch) return null;
  const streetName = streetMatch[1];

  // Step 1: geocode via Chestermere address points (geometry is multipoint)
  const geocodeUrl = new URL(
    'https://services5.arcgis.com/xPoG9m86qjKWAzys/arcgis/rest/services/ADDRESS_POINTS/FeatureServer/0/query'
  );
  geocodeUrl.searchParams.set('where', `ADDRESS_HO = '${civicNum}' AND ADDRESS_ST LIKE '${streetName}%'`);
  geocodeUrl.searchParams.set('outFields', 'ADDRESS');
  geocodeUrl.searchParams.set('returnGeometry', 'true');
  geocodeUrl.searchParams.set('outSR', '4326');
  geocodeUrl.searchParams.set('resultRecordCount', '1');
  geocodeUrl.searchParams.set('f', 'json');

  let lat: number, lng: number, confirmedAddress: string | null = null;
  try {
    const geoRes = await fetch(geocodeUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    const feature = geoData?.features?.[0];
    if (!feature) {
      console.log(`[ZoneLookup] Chestermere address not found: ${address}`);
      return null;
    }
    // Geometry arrives as multipoint: { points: [[lng, lat], ...] }
    const pts = feature.geometry?.points;
    if (!pts?.[0]) return null;
    [lng, lat] = pts[0];
    confirmedAddress = feature.attributes?.ADDRESS ?? null;
    console.log(`[ZoneLookup] Chestermere geocoded: ${confirmedAddress} → ${lat}, ${lng}`);
  } catch {
    return null;
  }

  // Step 2: query future land use by coordinate
  const zoneUrl = new URL(
    'https://services5.arcgis.com/xPoG9m86qjKWAzys/arcgis/rest/services/Future_Land_Use_Approved_Only/FeatureServer/0/query'
  );
  zoneUrl.searchParams.set('geometry', `${lng},${lat}`);
  zoneUrl.searchParams.set('geometryType', 'esriGeometryPoint');
  zoneUrl.searchParams.set('inSR', '4326');
  zoneUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  zoneUrl.searchParams.set('outFields', 'Landuse_F,LU_Desc,Community');
  zoneUrl.searchParams.set('returnGeometry', 'false');
  zoneUrl.searchParams.set('f', 'json');

  try {
    const zoneRes = await fetch(zoneUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!zoneRes.ok) return null;
    const zoneData = await zoneRes.json();
    const feat = zoneData?.features?.[0]?.attributes;
    if (!feat) {
      // Address found but outside Future Land Use coverage area
      console.log(`[ZoneLookup] Chestermere: ${confirmedAddress} outside Future Land Use coverage`);
      return null;
    }

    console.log(`[ZoneLookup] Chestermere result: ${feat.Landuse_F} — ${feat.LU_Desc}`);

    return {
      zoneCode:         feat.Landuse_F,
      zoneName:         feat.LU_Desc,
      communityName:    feat.Community ?? null,
      confirmedAddress,
      lat, lng,
      source: 'chestermere_arcgis',
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

async function lookupStAlbert(
  lat: number,
  lng: number,
): Promise<ZoneLookupResult | null> {
  const url = new URL(
    'https://services1.arcgis.com/fyyY0cNXvmUWvX1x/arcgis/rest/services/LandUseDistricts/FeatureServer/0/query'
  );
  url.searchParams.set('geometry', `${lng},${lat}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('outFields', 'DISTRICTING');
  url.searchParams.set('returnGeometry', 'false');
  url.searchParams.set('f', 'json');

  // Truncation map for DISTRICTING values that lose their closing parenthesis
  const truncationMap: Record<string, string> = {
    'Industrial and Commercial Serv': 'ICS',
    'Public, Private, and Instituti': 'PPI',
    'Medium Density Residential (MD': 'MDR',
  };

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0]?.attributes;
    if (!feature?.DISTRICTING) return null;

    const districting: string = feature.DISTRICTING;
    const truncated = truncationMap[districting];
    const parenMatch = districting.match(/\(([A-Z0-9]+)\)/);
    const zoneCode = truncated ?? parenMatch?.[1] ?? districting;

    console.log(`[ZoneLookup] St. Albert result: ${zoneCode} — ${districting}`);

    return {
      zoneCode,
      zoneName: districting.replace(/\s*\([A-Z0-9]+\)\s*$/, '').trim(),
      communityName: null,
      confirmedAddress: null,
      lat, lng,
      source: 'st_albert_arcgis',
    };
  } catch {
    return null;
  }
}

async function lookupStrathcona(
  lat: number,
  lng: number,
): Promise<ZoneLookupResult | null> {
  const url = new URL(
    'https://services.arcgis.com/B7ZrK1Hv4P1dsm9R/arcgis/rest/services/Land_Use_Bylaw/FeatureServer/0/query'
  );
  url.searchParams.set('geometry', `${lng},${lat}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('outFields', 'lub_zoning,lub_description');
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
    if (!feature?.lub_zoning) return null;

    console.log(`[ZoneLookup] Strathcona result: ${feature.lub_zoning} — ${feature.lub_description}`);

    return {
      zoneCode:         feature.lub_zoning,
      zoneName:         feature.lub_description ?? feature.lub_zoning,
      communityName:    null,
      confirmedAddress: null,
      lat, lng,
      source: 'strathcona_arcgis',
    };
  } catch {
    return null;
  }
}

async function lookupOkotoks(
  lat: number,
  lng: number,
): Promise<ZoneLookupResult | null> {
  const url = new URL(
    'https://services3.arcgis.com/Fl5sQFvYY7w7mPQj/arcgis/rest/services/Land_Use_Designations/FeatureServer/7/query'
  );
  url.searchParams.set('geometry', `${lng},${lat}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('outFields', 'LU_Code,New_LU');
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
    if (!feature?.LU_Code) return null;

    // Strip trailing " District (CODE)" to get a clean zone name
    const rawName: string = feature.New_LU ?? feature.LU_Code;
    const zoneName = rawName.replace(/\s*\([A-Z0-9]+\)\s*$/, '').trim();

    console.log(`[ZoneLookup] Okotoks result: ${feature.LU_Code} — ${zoneName}`);

    return {
      zoneCode:         feature.LU_Code,
      zoneName,
      communityName:    null,
      confirmedAddress: null,
      lat, lng,
      source: 'okotoks_arcgis',
    };
  } catch {
    return null;
  }
}

async function lookupEdmonton(
  lat: number,
  lng: number,
): Promise<ZoneLookupResult | null> {
  const url = new URL('https://data.edmonton.ca/resource/fixa-tstc.json');
  url.searchParams.set('$where', `intersects(geometry_multipolygon, 'POINT(${lng} ${lat})')`);
  url.searchParams.set('$select', 'zoning,description');
  url.searchParams.set('$limit', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]?.zoning) return null;

    console.log(`[ZoneLookup] Edmonton result: ${data[0].zoning} — ${data[0].description}`);

    return {
      zoneCode:         data[0].zoning,
      zoneName:         data[0].description ?? data[0].zoning,
      communityName:    null,
      confirmedAddress: null,
      lat, lng,
      source: 'edmonton_open_data',
    };
  } catch {
    return null;
  }
}
