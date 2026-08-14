import * as Location from 'expo-location';
import { CITIES, type City } from '@data/cities';
import type { UserLocation } from '@store/settingsStore';

const toRadians = (value: number) => (value * Math.PI) / 180;

export function distanceKm(latitude: number, longitude: number, city: City): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(city.latitude - latitude);
  const dLon = toRadians(city.longitude - longitude);
  const lat1 = toRadians(latitude);
  const lat2 = toRadians(city.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCity(latitude: number, longitude: number, countryCode?: string | null): City {
  const normalizedCountry = countryCode?.toUpperCase();
  const sameCountry = normalizedCountry ? CITIES.filter((city) => city.countryCode === normalizedCountry) : [];
  const candidates = sameCountry.length ? sameCountry : CITIES;
  return candidates.reduce((nearest, city) =>
    distanceKm(latitude, longitude, city) < distanceKm(latitude, longitude, nearest) ? city : nearest,
  candidates[0]);
}

export async function detectCurrentLocation(): Promise<UserLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('LOCATION_PERMISSION_DENIED');

  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000, requiredAccuracy: 10_000 });
  const position = lastKnown ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude } = position.coords;

  let geocode: Location.LocationGeocodedAddress | undefined;
  try {
    geocode = (await Location.reverseGeocodeAsync({ latitude, longitude }))[0];
  } catch {
    // الإحداثيات تكفي لحساب المواقيت حتى لو تعذرت تسمية المدينة.
  }

  const nearest = findNearestCity(latitude, longitude, geocode?.isoCountryCode);
  const resolvedName = geocode?.city || geocode?.district || geocode?.subregion || geocode?.region;
  const isNearKnownCity = distanceKm(latitude, longitude, nearest) <= 80;

  return {
    cityAr: isNearKnownCity ? nearest.cityAr : (resolvedName || nearest.cityAr),
    cityEn: isNearKnownCity ? nearest.cityEn : (resolvedName || nearest.cityEn),
    latitude,
    longitude,
    timezone: nearest.timezone,
    countryCode: (geocode?.isoCountryCode || nearest.countryCode).toUpperCase(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
