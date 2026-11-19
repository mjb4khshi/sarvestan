import {
  CAMPUS_MAP,
  INTER_CAMPUS_ROUTES,
  type CampusId,
  type InterCampusRoute,
  type KntuCampus,
  type LatLng,
} from '../data/kntuCampuses';
import type {MetroLineId} from '../data/tehranTransit';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

/**
 * نرمال‌سازی حروف فارسی/عربی برای جستجوی دقیق دانشکده‌ها
 */
export function normalizePersian(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ')
    .replace(/\s+/g, ' ');
}

export function filterCampuses(
  campuses: KntuCampus[],
  query: string,
  metroLineFilter: MetroLineId | 'all' = 'all',
): KntuCampus[] {
  const normalizedQuery = normalizePersian(query);

  return campuses.filter((campus) => {
    if (metroLineFilter !== 'all') {
      const hasLine = campus.metroOptions.some((opt) => opt.lineId === metroLineFilter);
      if (!hasLine) return false;
    }

    if (!normalizedQuery) return true;

    const haystack = normalizePersian(
      [
        campus.name,
        campus.shortName,
        campus.neighborhood,
        campus.address,
        ...campus.faculties,
        ...campus.searchKeywords,
        ...campus.metroOptions.map((m) => m.stationName),
        ...campus.brtOptions.map((b) => b.stationName),
      ].join(' '),
    );

    return haystack.includes(normalizedQuery);
  });
}

/**
 * فاصله مستقیم بین دو مختصات جغرافیایی (کیلومتر)
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistanceKm(meters: number): string {
  if (meters < 1000) {
    return `${toPersianDigits(Math.round(meters))} متر`;
  }
  const km = (meters / 1000).toFixed(1).replace('.', '٫');
  return `${toPersianDigits(km)} کیلومتر`;
}

export function formatDurationMin(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) {
    return `${toPersianDigits(rounded)} دقیقه`;
  }
  const hours = Math.floor(rounded / 60);
  const rem = rounded % 60;
  if (rem === 0) return `${toPersianDigits(hours)} ساعت`;
  return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(rem)} دقیقه`;
}

/**
 * یافتن بهترین مسیر بین‌پردیسی (پشتیبانی از مسیر مستقیم، معکوس و تولید هوشمند برای سایر جفت‌ها)
 */
export function findInterCampusRoute(
  fromId: CampusId,
  toId: CampusId,
): InterCampusRoute | null {
  if (fromId === toId) return null;

  const exact = INTER_CAMPUS_ROUTES.find((r) => r.from === fromId && r.to === toId);
  if (exact) return exact;

  const reverse = INTER_CAMPUS_ROUTES.find((r) => r.from === toId && r.to === fromId);
  const fromCampus = CAMPUS_MAP[fromId];
  const toCampus = CAMPUS_MAP[toId];
  if (!fromCampus || !toCampus) return null;

  if (reverse) {
    return {
      ...reverse,
      from: fromId,
      to: toId,
      headline: `مسیر برگشت از ${fromCampus.shortName} به ${toCampus.shortName}`,
      steps: [
        `از ${fromCampus.mainGate} حرکت کنید و به ایستگاه اصلی مسیر (${toCampus.brtOptions[0]?.stationName ?? toCampus.metroOptions[0]?.stationName ?? 'مقصد'}) بروید.`,
        ...reverse.steps.slice().reverse(),
      ].slice(0, 4),
    };
  }

  const distKm = haversineKm(fromCampus.coords, toCampus.coords);
  const roadEstimateKm = Math.max(0.4, distKm * 1.32);
  const estimatedMinutes = Math.max(6, Math.round(roadEstimateKm * 3.2 + 7));

  const fromMetro = fromCampus.metroOptions[0];
  const toMetro = toCampus.metroOptions[0];
  const metroLines = Array.from(
    new Set([fromMetro?.lineId, toMetro?.lineId].filter(Boolean) as MetroLineId[]),
  );

  const steps: string[] = [];
  if (roadEstimateKm <= 1.2) {
    steps.push(`فاصله این دو مرکز کوتاه است (حدود ${formatDistanceKm(roadEstimateKm * 1000)}) و پیاده‌روی مستقیم سریع‌ترین گزینه است.`);
  } else {
    if (fromMetro) {
      steps.push(
        `از ${fromCampus.shortName} به ایستگاه مترو ${fromMetro.stationName} (خط ${toPersianDigits(fromMetro.lineId)}) بروید.`,
      );
    }
    if (toMetro && fromMetro && fromMetro.lineId !== toMetro.lineId) {
      steps.push(
        `در ایستگاه تقاطعی به خط ${toPersianDigits(toMetro.lineId)} تعویض خط داده و در ایستگاه ${toMetro.stationName} پیاده شوید.`,
      );
    } else if (toMetro) {
      steps.push(`در همان خط تا ایستگاه ${toMetro.stationName} ادامه دهید.`);
    }
    steps.push(`از ایستگاه مقصد به سمت ${toCampus.mainGate} (${toCampus.shortName}) حرکت کنید.`);
  }

  return {
    from: fromId,
    to: toId,
    headline:
      roadEstimateKm <= 1.2
        ? `پیاده‌روی مستقیم از ${fromCampus.shortName} به ${toCampus.shortName}`
        : `مسیر ترکیبی مترو و خطی از ${fromCampus.shortName} به ${toCampus.shortName}`,
    estimatedMinutes,
    primaryMode: roadEstimateKm <= 1.2 ? 'walk' : 'metro',
    metroLines,
    steps,
    studentTip: `فاصله تقریبی جاده‌ای حدود ${formatDistanceKm(roadEstimateKm * 1000)} است. برای مشاهده مسیر دقیق لحظه‌ای روی دکمه نقشه یا مسیریاب کلیک کنید.`,
  };
}

export interface ExternalNavLinks {
  googleMaps: string;
  neshan: string;
  balad: string;
}

export function buildExternalNavLinks(coords: LatLng, label: string): ExternalNavLinks {
  const lat = coords.lat.toFixed(6);
  const lng = coords.lng.toFixed(6);
  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`,
    neshan: `https://nshn.ir/?lat=${lat}&lng=${lng}&name=${encodeURIComponent(label)}`,
    balad: `https://balad.ir/location?latitude=${lat}&longitude=${lng}&zoom=16`,
  };
}

export type AppView = 'explore' | 'between' | 'poster';
export type SarvThemeId =
  | 'persian-light'
  | 'persian-dark'
  | 'emerald'
  | 'tehran'
  | 'tehran-2'
  | 'nordic'
  | 'matcha'
  | 'sunset'
  | 'cyberpunk'
  | 'tokyo-midnight'
  | 'ocean-abyss'
  | 'crimson'
  | 'coffee-roast'
  | 'batman'
  | 'monochrome'
  | 'monochrome-light';

export interface WayfinderParams {
  dest?: CampusId;
  from?: CampusId;
  to?: CampusId;
  view?: AppView;
  embed: boolean;
  theme?: SarvThemeId;
}

const VALID_CAMPUS_IDS = new Set<string>(Object.keys(CAMPUS_MAP));
const VALID_VIEWS = new Set<string>(['explore', 'between', 'poster']);
const VALID_THEMES = new Set<string>([
  'persian-light',
  'persian-dark',
  'emerald',
  'tehran',
  'tehran-2',
  'nordic',
  'matcha',
  'sunset',
  'cyberpunk',
  'tokyo-midnight',
  'ocean-abyss',
  'crimson',
  'coffee-roast',
  'batman',
  'monochrome',
  'monochrome-light',
]);

export function parseWayfinderParams(search: string): WayfinderParams {
  const params = new URLSearchParams(search);
  const dest = params.get('dest') ?? undefined;
  const from = params.get('from') ?? undefined;
  const to = params.get('to') ?? undefined;
  const view = params.get('view') ?? undefined;
  const theme = params.get('theme') ?? undefined;
  const embed = params.get('embed') === '1' || params.get('embed') === 'true';

  return {
    dest: dest && VALID_CAMPUS_IDS.has(dest) ? (dest as CampusId) : undefined,
    from: from && VALID_CAMPUS_IDS.has(from) ? (from as CampusId) : undefined,
    to: to && VALID_CAMPUS_IDS.has(to) ? (to as CampusId) : undefined,
    view: view && VALID_VIEWS.has(view) ? (view as AppView) : undefined,
    theme: theme && VALID_THEMES.has(theme) ? (theme as SarvThemeId) : undefined,
    embed,
  };
}

export function buildDeepLink(
  baseUrl: string,
  destId?: CampusId | 'all',
  embed = false,
): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '') || 'https://mjb4khshi.github.io/sarvestan';
  const normalizedBase = /^https?:\/\//i.test(cleanBase)
    ? cleanBase
    : `https://${cleanBase}`;
  const params = new URLSearchParams();
  if (destId && destId !== 'all') {
    params.set('dest', destId);
  }
  if (embed) {
    params.set('embed', '1');
  }
  const qs = params.toString();
  return qs ? `${normalizedBase}/?${qs}#khajeyab` : `${normalizedBase}/#khajeyab`;
}
