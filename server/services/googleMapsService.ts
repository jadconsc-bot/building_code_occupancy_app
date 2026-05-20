import { ENV } from '../_core/env';

export async function geocodeAddress(address: string): Promise<{
  municipality: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
} | null> {
  const apiKey = ENV.googleMapsApiKey;
  if (!apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:CA&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json() as any;

  if (data.status !== 'OK' || !data.results?.length) return null;

  const result = data.results[0];
  const components = result.address_components;

  const getComponent = (type: string) =>
    components.find((c: any) => c.types.includes(type))?.long_name ?? '';
  const getShortComponent = (type: string) =>
    components.find((c: any) => c.types.includes(type))?.short_name ?? '';

  const municipality =
    getComponent('locality') ||
    getComponent('sublocality') ||
    getComponent('administrative_area_level_3') || '';

  const provinceShort = getShortComponent('administrative_area_level_1');
  const province =
    provinceShort === 'AB' ? 'AB' :
    provinceShort === 'BC' ? 'BC' :
    provinceShort === 'ON' ? 'ON' :
    provinceShort === 'SK' ? 'SK' :
    provinceShort === 'MB' ? 'MB' : provinceShort;

  const postalCode = getShortComponent('postal_code');
  const lat = result.geometry.location.lat;
  const lng = result.geometry.location.lng;

  return { municipality, province, postalCode, lat, lng };
}
