import type {LatLng} from './kntuCampuses';

export interface TehranMapLabel {
  id: string;
  label: string;
  kind: 'neighborhood' | 'square' | 'highway' | 'street';
  coords: LatLng;
  minZoom: number;
}

/**
 * برچسب‌های بومی محله‌ها، میادین، بزرگراه‌ها و خیابان‌های کلیدی مسیر پردیس‌های خواجه نصیر
 * برای نمایش با فونت رسمی آراد (Arad) روی نقشه OpenStreetMap بدون فونت‌های پیش‌فرض ناخوانا
 */
export const TEHRAN_MAP_LABELS: TehranMapLabel[] = [
  // محله‌ها و میادین اصلی (قابل نمایش در زوم شهری و منطقه‌ای)
  {
    id: 'nb-vanak',
    label: 'میدان ونک',
    kind: 'square',
    coords: {lat: 35.7575, lng: 51.4101},
    minZoom: 12,
  },
  {
    id: 'nb-seyyedkhandan',
    label: 'سیدخندان',
    kind: 'neighborhood',
    coords: {lat: 35.7438, lng: 51.4465},
    minZoom: 12,
  },
  {
    id: 'nb-mirdamad',
    label: 'میرداماد',
    kind: 'neighborhood',
    coords: {lat: 35.7605, lng: 51.4255},
    minZoom: 12,
  },
  {
    id: 'nb-tehranpars',
    label: 'تهرانپارس',
    kind: 'neighborhood',
    coords: {lat: 35.7335, lng: 51.5355},
    minZoom: 12,
  },
  {
    id: 'nb-hakimieh',
    label: 'حکیمیه',
    kind: 'neighborhood',
    coords: {lat: 35.7495, lng: 51.5715},
    minZoom: 12,
  },
  {
    id: 'nb-majidieh',
    label: 'مجیدیه و رسالت',
    kind: 'neighborhood',
    coords: {lat: 35.7362, lng: 51.4775},
    minZoom: 12,
  },
  {
    id: 'nb-jolfa',
    label: 'جلفا (ارسباران)',
    kind: 'neighborhood',
    coords: {lat: 35.7478, lng: 51.4518},
    minZoom: 14,
  },
  {
    id: 'nb-qolhak',
    label: 'قلهک',
    kind: 'neighborhood',
    coords: {lat: 35.7695, lng: 51.4425},
    minZoom: 13,
  },
  {
    id: 'nb-narmak',
    label: 'نارمک',
    kind: 'neighborhood',
    coords: {lat: 35.7335, lng: 51.5035},
    minZoom: 12,
  },

  // بزرگراه‌ها
  {
    id: 'hw-zeinoddin',
    label: 'بزرگراه شهید زین‌الدین',
    kind: 'highway',
    coords: {lat: 35.7528, lng: 51.5195},
    minZoom: 12,
  },
  {
    id: 'hw-resalat',
    label: 'بزرگراه شهید قاسم سلیمانی (رسالت)',
    kind: 'highway',
    coords: {lat: 35.7395, lng: 51.4845},
    minZoom: 12,
  },
  {
    id: 'hw-hemat',
    label: 'بزرگراه شهید همت',
    kind: 'highway',
    coords: {lat: 35.7512, lng: 51.4195},
    minZoom: 12,
  },
  {
    id: 'hw-modarres',
    label: 'بزرگراه مدرس',
    kind: 'highway',
    coords: {lat: 35.7585, lng: 51.4225},
    minZoom: 13,
  },
  {
    id: 'hw-babaei',
    label: 'بزرگراه شهید بابایی',
    kind: 'highway',
    coords: {lat: 35.7662, lng: 51.5512},
    minZoom: 13,
  },
  {
    id: 'hw-bagheri',
    label: 'بزرگراه شهید باقری',
    kind: 'highway',
    coords: {lat: 35.7455, lng: 51.5225},
    minZoom: 13,
  },

  // خیابان‌های کلیدی منتهی به سردرهای خواجه نصیر
  {
    id: 'st-vafadar',
    label: 'خیابان وفادار شرقی',
    kind: 'street',
    coords: {lat: 35.7475, lng: 51.5515},
    minZoom: 14,
  },
  {
    id: 'st-shariati',
    label: 'خیابان دکتر شریعتی',
    kind: 'street',
    coords: {lat: 35.7385, lng: 51.4472},
    minZoom: 14,
  },
  {
    id: 'st-mollasadra',
    label: 'خیابان ملاصدرا',
    kind: 'street',
    coords: {lat: 35.7582, lng: 51.4025},
    minZoom: 14,
  },
  {
    id: 'st-pardis',
    label: 'خیابان پردیس',
    kind: 'street',
    coords: {lat: 35.7556, lng: 51.4045},
    minZoom: 15,
  },
  {
    id: 'st-valiasr',
    label: 'خیابان ولیعصر',
    kind: 'street',
    coords: {lat: 35.7618, lng: 51.4106},
    minZoom: 14,
  },
  {
    id: 'st-mirdamad-blvd',
    label: 'بلوار میرداماد',
    kind: 'street',
    coords: {lat: 35.7611, lng: 51.4185},
    minZoom: 14,
  },
];
