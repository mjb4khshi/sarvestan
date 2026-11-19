import type {LatLng} from '../data/kntuCampuses';

export interface OsrmRouteResult {
  coordinates: Array<[number, number]>; // [lat, lng]
  distanceMeters: number;
  durationMillis: number;
  isFallback: boolean;
}

interface OsrmApiResponse {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      type?: string;
      coordinates?: Array<[number, number]>; // GeoJSON: [lng, lat]
    };
  }>;
}

/**
 * تبدیل خروجی GeoJSON سرویس OSRM به مختصات [lat, lng] قابل رندر در Leaflet
 */
export function parseOsrmResponse(payload: OsrmApiResponse): OsrmRouteResult | null {
  const first = payload?.routes?.[0];
  const rawCoords = first?.geometry?.coordinates;
  if (payload?.code !== 'Ok' || !first || !Array.isArray(rawCoords) || rawCoords.length < 2) {
    return null;
  }

  return {
    coordinates: rawCoords.map(([lng, lat]) => [lat, lng]),
    distanceMeters: Math.round(first.distance ?? 0),
    durationMillis: Math.round((first.duration ?? 0) * 1000),
    isFallback: false,
  };
}

/**
 * دریافت مسیر واقعی جاده‌ای/پیاده‌روی از سرویس رایگان و بدون کلید OSRM (مبتنی بر OpenStreetMap)
 */
export async function fetchOsrmRoute(
  origin: LatLng,
  destination: LatLng,
  travelMode: 'DRIVING' | 'WALKING',
  signal?: AbortSignal,
): Promise<OsrmRouteResult> {
  const profile = travelMode === 'WALKING' ? 'foot' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, {signal});
    if (!res.ok) {
      throw new Error(`OSRM HTTP ${res.status}`);
    }
    const json = (await res.json()) as OsrmApiResponse;
    const parsed = parseOsrmResponse(json);
    if (parsed) return parsed;
  } catch (err) {
    if ((err as {name?: string})?.name === 'AbortError') {
      throw err;
    }
  }

  return {
    coordinates: [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ],
    distanceMeters: 0,
    durationMillis: 0,
    isFallback: true,
  };
}
