/**
 * Geocoding Service
 * Wraps Google Maps Geocoding API for Canadian addresses.
 * Rejects non-Canadian addresses and returns province/municipality/coordinates.
 */

import { ENV } from '../_core/env';
import { editionForProvince } from '../rules/overlays/index';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  province: string;          // e.g. "AB"
  provinceFullName: string;  // e.g. "Alberta"
  municipality: string;      // e.g. "Calgary"
  postalCode: string;
  country: string;           // "CA"
  codeEdition: string;       // derived from province
  source: 'geocoded';
}

export interface GeocodeError {
  error: string;
  source: 'geocoded';
  success: false;
}

const PROVINCE_CODE_MAP: Record<string, string> = {
  'Alberta': 'AB',
  'British Columbia': 'BC',
  'Ontario': 'ON',
  'Quebec': 'QC',
  'Manitoba': 'MB',
  'Saskatchewan': 'SK',
  'Nova Scotia': 'NS',
  'New Brunswick': 'NB',
  'Prince Edward Island': 'PE',
  'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT',
  'Nunavut': 'NU',
  'Yukon': 'YT',
};

export async function geocodeAddress(address: string): Promise<GeocodeResult | GeocodeError> {
  const key = ENV.googleMapsApiKey;
  if (!key) {
    return { error: 'Google Maps API key not configured', source: 'geocoded', success: false };
  }

  let data: any;
  try {
    const url = `${GEOCODE_URL}?address=${encodeURIComponent(address)}&components=country:CA&key=${key}`;
    const res = await fetch(url);
    data = await res.json();
  } catch (err) {
    return { error: `Geocoding request failed: ${String(err)}`, source: 'geocoded', success: false };
  }

  if (data.status !== 'OK' || !data.results?.[0]) {
    return { error: `Geocoding failed: ${data.status}`, source: 'geocoded', success: false };
  }

  const result = data.results[0];
  const components: any[] = result.address_components ?? [];

  // Must be a Canadian address
  const countryComp = components.find((c: any) => c.types.includes('country'));
  if (countryComp?.short_name !== 'CA') {
    return { error: 'Only Canadian addresses are supported', source: 'geocoded', success: false };
  }

  const provinceComp = components.find((c: any) =>
    c.types.includes('administrative_area_level_1')
  );
  const province = PROVINCE_CODE_MAP[provinceComp?.long_name ?? ''] ?? null;
  if (!province) {
    return { error: 'Could not determine Canadian province', source: 'geocoded', success: false };
  }

  const cityComp = components.find((c: any) =>
    c.types.includes('locality') || c.types.includes('sublocality')
  );
  const postalComp = components.find((c: any) => c.types.includes('postal_code'));

  return {
    address: result.formatted_address,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    province,
    provinceFullName: provinceComp?.long_name ?? '',
    municipality: cityComp?.long_name ?? '',
    postalCode: postalComp?.short_name ?? '',
    country: 'CA',
    codeEdition: editionForProvince(province),
    source: 'geocoded',
  };
}
