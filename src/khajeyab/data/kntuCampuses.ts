import type {BrtLineId, MetroLineId} from './tehranTransit';

export type CampusId =
  | 'rezaeinejad'
  | 'seyyedkhandan'
  | 'science'
  | 'vanak'
  | 'mirdamad'
  | 'central';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MetroAccessOption {
  id: string;
  lineId: MetroLineId;
  stationName: string;
  stationCoords: LatLng;
  recommended?: boolean;
  exitHint: string;
  connectionType: 'walk' | 'taxi' | 'bus';
  connectionLabel: string;
  durationMinutes: number;
  steps: string[];
}

export interface BrtAccessOption {
  id: string;
  lineId: BrtLineId;
  stationName: string;
  stationCoords: LatLng;
  recommended?: boolean;
  connectionType: 'walk' | 'taxi';
  durationMinutes: number;
  steps: string[];
}

export interface KntuCampus {
  id: CampusId;
  name: string;
  shortName: string;
  code: string;
  category: 'faculty' | 'admin';
  neighborhood: string;
  faculties: string[];
  address: string;
  mainGate: string;
  coords: LatLng;
  accentColor: string;
  mapsSearchQuery: string;
  importantNote?: string;
  searchKeywords: string[];
  metroOptions: MetroAccessOption[];
  brtOptions: BrtAccessOption[];
  drivingTip: string;
}

export interface InterCampusRoute {
  from: CampusId;
  to: CampusId;
  headline: string;
  estimatedMinutes: number;
  primaryMode: 'metro' | 'brt' | 'taxi' | 'walk';
  metroLines?: MetroLineId[];
  brtLines?: BrtLineId[];
  steps: string[];
  studentTip: string;
}

/**
 * دیتاست ساختاریافته پردیس‌های دانشگاه صنعتی خواجه نصیرالدین طوسی (خواجه‌یاب | سروستان)
 * برای به‌روزرسانی آسان در گیت‌هاب پیجز یا ادغام مستقیم با ریپازیتوری سروستان
 */
export const KNTU_CAMPUSES: KntuCampus[] = [
  {
    id: 'rezaeinejad',
    name: 'پردیس شهید رضایی‌نژاد (خاکسفورد)',
    shortName: 'رضایی‌نژاد',
    code: 'RN',
    category: 'faculty',
    neighborhood: 'شرق تهران · حکیمیه / وفادار شرقی',
    faculties: [
      'دانشکده ریاضی',
      'دانشکده فیزیک',
      'دانشکده مهندسی هوافضا',
      'دانشکده شیمی',
    ],
    address: 'تهران، حکیمیه، انتهای خیابان وفادار شرقی، بلوار شهید رضایی‌نژاد، پردیس شهید رضایی‌نژاد (خاکسفورد)',
    mainGate: 'سردر اصلی خیابان وفادار شرقی / بلوار شهید رضایی‌نژاد',
    coords: {lat: 35.7518, lng: 51.5517},
    accentColor: '#0054A6',
    mapsSearchQuery: 'K. N. Toosi University of Technology Aerospace Engineering Tehran',
    importantNote:
      'خط مستقیم BRT به این پردیس وجود ندارد و تردد اصلی از طریق خطوط مترو ۲ (فرهنگسرا، تهرانپارس، علم و صنعت) و اتوبوس/تاکسی‌های محلی انجام می‌شود.',
    searchKeywords: [
      'رضایی نژاد',
      'رضایی‌نژاد',
      'خاکسفورد',
      'خاکسفید',
      'فرهنگسرا',
      'تهرانپارس',
      'علم و صنعت',
      'علموصنعت',
      'شهرک بهشتی',
      'افق',
      'شهرک پارس',
      'وفادار',
      'حکیمیه',
      'ریاضی',
      'فیزیک',
      'هوافضا',
      'شیمی',
    ],
    metroOptions: [
      {
        id: 'rn-m1-farhangsara-bus',
        lineId: 2,
        stationName: 'فرهنگسرا (مسیر ۱ - اتوبوس)',
        stationCoords: {lat: 35.7364, lng: 51.5572},
        recommended: true,
        exitHint: 'پایانه اتوبوسرانی مترو فرهنگسرا',
        connectionType: 'bus',
        connectionLabel: 'اتوبوس (میدان رسالت – شهرک بهشتی)',
        durationMinutes: 12,
        steps: [
          'در ایستگاه مترو فرهنگسرا (خط ۲) پیاده شوید.',
          'از پایانه، سوار اتوبوس خط «میدان رسالت – شهرک بهشتی» شوید.',
          'ایستگاه مقابل پردیس رضایی‌نژاد (خاکسفورد) پیاده شوید.',
        ],
      },
      {
        id: 'rn-m5-farhangsara-taxi',
        lineId: 2,
        stationName: 'فرهنگسرا (مسیر ۵ - تاکسی)',
        stationCoords: {lat: 35.7364, lng: 51.5572},
        recommended: true,
        exitHint: 'پایانه تاکسیرانی فرهنگسرا',
        connectionType: 'taxi',
        connectionLabel: 'تاکسی خطی شهرک بهشتی',
        durationMinutes: 10,
        steps: [
          'در ایستگاه مترو فرهنگسرا (خط ۲) پیاده شوید.',
          'در پایانه تاکسیرانی، سوار تاکسی‌های خطی «شهرک بهشتی» شوید.',
          'مستقیماً مقابل سردر پردیس رضایی‌نژاد پیاده شوید.',
        ],
      },
      {
        id: 'rn-m2-tehranpars-bus',
        lineId: 2,
        stationName: 'تهرانپارس (مسیر ۲ - اتوبوس)',
        stationCoords: {lat: 35.7294, lng: 51.5313},
        exitHint: 'خروجی چهارراه تهرانپارس',
        connectionType: 'bus',
        connectionLabel: 'اتوبوس (چهارراه تهرانپارس – شهرک پارس)',
        durationMinutes: 15,
        steps: [
          'در ایستگاه مترو تهرانپارس (خط ۲) پیاده شوید.',
          'سوار اتوبوس خط «چهارراه تهرانپارس – شهرک پارس» شوید.',
          'در خیابان وفادار شرقی نزدیک پردیس رضایی‌نژاد پیاده شوید.',
        ],
      },
      {
        id: 'rn-m3-elmosanat-ofogh',
        lineId: 2,
        stationName: 'علم و صنعت (مسیر ۳ - اتوبوس افق)',
        stationCoords: {lat: 35.7346, lng: 51.5074},
        exitHint: 'پایانه اتوبوسرانی دانشگاه علم و صنعت',
        connectionType: 'bus',
        connectionLabel: 'اتوبوس (علم و صنعت – افق)',
        durationMinutes: 18,
        steps: [
          'در ایستگاه مترو دانشگاه علم و صنعت (خط ۲) پیاده شوید.',
          'از پایانه، سوار اتوبوس خط «علم و صنعت – افق» شوید.',
          'در مسیر حکیمیه نزدیک پردیس پیاده شوید.',
        ],
      },
      {
        id: 'rn-m4-elmosanat-beheshti',
        lineId: 2,
        stationName: 'علم و صنعت (مسیر ۴ - اتوبوس بهشتی)',
        stationCoords: {lat: 35.7346, lng: 51.5074},
        exitHint: 'پایانه اتوبوسرانی دانشگاه علم و صنعت',
        connectionType: 'bus',
        connectionLabel: 'اتوبوس (علم و صنعت – شهرک بهشتی)',
        durationMinutes: 18,
        steps: [
          'در ایستگاه مترو دانشگاه علم و صنعت (خط ۲) پیاده شوید.',
          'از پایانه، سوار اتوبوس خط «علم و صنعت – شهرک بهشتی» شوید.',
          'مقابل پردیس رضایی‌نژاد پیاده شوید.',
        ],
      },
    ],
    brtOptions: [],
    drivingTip:
      'برای اسنپ، تپسی و خودروی شخصی، مقصد را «پردیس شهید رضایی‌نژاد خواجه نصیر – درب خیابان وفادار شرقی» ثبت کنید تا از انتهای بزرگراه باقری یا زین‌الدین به سردر اصلی برسید.',
  },
  {
    id: 'seyyedkhandan',
    name: 'پردیس سیدخندان',
    shortName: 'سیدخندان',
    code: 'SK',
    category: 'faculty',
    neighborhood: 'سیدخندان · خیابان شریعتی',
    faculties: ['دانشکده مهندسی برق', 'دانشکده مهندسی کامپیوتر'],
    address: 'خیابان دکتر شریعتی، نرسیده به پل سیدخندان، پردیس سیدخندان',
    mainGate: 'سردر اصلی خیابان شریعتی (ضلع شرقی)',
    coords: {lat: 35.7417, lng: 51.4488},
    accentColor: '#00AEEF',
    mapsSearchQuery: 'K. N. Toosi University of Technology Electrical Engineering Tehran',
    searchKeywords: [
      'سیدخندان',
      'سید خندان',
      'برق',
      'کامپیوتر',
      'مهندسی برق',
      'مهندسی کامپیوتر',
      'شریعتی',
    ],
    metroOptions: [
      {
        id: 'sk-ghodousi',
        lineId: 3,
        stationName: 'شهید قدوسی',
        stationCoords: {lat: 35.7332, lng: 51.4461},
        recommended: true,
        exitHint: 'خروجی خیابان شریعتی به سمت شمال (سیدخندان)',
        connectionType: 'walk',
        connectionLabel: 'پیاده‌روی سرراست یا خطی ۳ دقیقه‌ای',
        durationMinutes: 10,
        steps: [
          'در ایستگاه مترو شهید قدوسی (خط ۳ آبی فیروزه‌ای) پیاده شوید.',
          'از خروجی خیابان شریعتی به سمت شمال (پل سیدخندان) حرکت کنید.',
          'پس از حدود ۱۰ دقیقه پیاده‌روی (یا ۳ دقیقه با تاکسی خطی شریعتی)، سمت راست به سردر دانشکده برق و کامپیوتر می‌رسید.',
        ],
      },
      {
        id: 'sk-mosalla',
        lineId: 1,
        stationName: 'مصلی امام خمینی',
        stationCoords: {lat: 35.7375, lng: 51.4316},
        exitHint: 'خروجی بزرگراه قاسم سلیمانی (رسالت شرق)',
        connectionType: 'taxi',
        connectionLabel: 'تاکسی خطی پل سیدخندان',
        durationMinutes: 8,
        steps: [
          'در ایستگاه مترو مصلی (خط ۱ قرمز) پیاده شوید.',
          'به سمت شرق بزرگراه رسالت بیایید و سوار خطی‌های سیدخندان شوید.',
          'زیر پل سیدخندان پیاده شده و ۳ دقیقه به سمت جنوب در خیابان شریعتی پیاده‌روی کنید.',
        ],
      },
      {
        id: 'sk-shariati',
        lineId: 1,
        stationName: 'دکتر شریعتی',
        stationCoords: {lat: 35.7646, lng: 51.4448},
        exitHint: 'خروجی خیابان شریعتی (مسیر جنوب)',
        connectionType: 'taxi',
        connectionLabel: 'تاکسی خطی سیدخندان',
        durationMinutes: 9,
        steps: [
          'در ایستگاه مترو شریعتی (خط ۱ قرمز) پیاده شوید.',
          'سوار تاکسی خطی جنوب به سمت پل سیدخندان شوید و دقیقاً مقابل دانشکده پیاده شوید.',
        ],
      },
    ],
    brtOptions: [
      {
        id: 'sk-brt-5',
        lineId: 5,
        stationName: 'سیدخندان',
        stationCoords: {lat: 35.7438, lng: 51.4472},
        recommended: true,
        connectionType: 'walk',
        durationMinutes: 3,
        steps: [
          'سوار BRT خط ۵ (دانشگاه علم و صنعت – پایانه بیهقی) شوید.',
          'در ایستگاه سیدخندان پیاده شده و از پله‌ها وارد خیابان شریعتی (سمت جنوب) شوید.',
          'با ۳ دقیقه پیاده‌روی دقیقاً به درب دانشکده برق و کامپیوتر می‌رسید.',
        ],
      },
    ],
    drivingTip:
      'خیابان شریعتی در محدوده سیدخندان معمولاً پرترافیک است؛ اگر با اسنپ می‌آیید از مسیر رسالت یا سهروردی نقطه پیاده شدن را مقابل درب شریعتی بگذارید.',
  },
  {
    id: 'science',
    name: 'پردیس علوم',
    shortName: 'پردیس علوم',
    code: 'SC',
    category: 'faculty',
    neighborhood: 'سیدخندان · جلفا (ارسباران)',
    faculties: ['دانشکده علوم پایه', 'دفاتر آموزشی و آزمایشگاه‌های علوم'],
    address: 'خیابان شریعتی، بالاتر از پل سیدخندان، تقاطع خیابان جلفا (ارسباران)',
    mainGate: 'ورودی خیابان جلفا / شریعتی',
    coords: {lat: 35.7458, lng: 51.4485},
    accentColor: '#10B981',
    mapsSearchQuery: 'K. N. Toosi University of Technology Faculty of Science Tehran',
    importantNote:
      'توجه: اغلب کلاس‌های درسی دانشکده‌های ریاضی، فیزیک و شیمی در «پردیس شهید رضایی‌نژاد (خاکسفورد)» برگزار می‌شود. قبل از حرکت حتماً مکان کلاس را در برنامه هفتگی بهستان (سروستان) چک کنید.',
    searchKeywords: [
      'علوم',
      'پردیس علوم',
      'علوم پایه',
      'جلفا',
      'ارسباران',
      'سیدخندان',
      'شیمی',
      'فیزیک',
      'ریاضی',
    ],
    metroOptions: [
      {
        id: 'sc-ghodousi',
        lineId: 3,
        stationName: 'شهید قدوسی',
        stationCoords: {lat: 35.7332, lng: 51.4461},
        recommended: true,
        exitHint: 'خروجی خیابان شریعتی به سمت شمال',
        connectionType: 'taxi',
        connectionLabel: 'تاکسی خطی شریعتی تا جلفا (یا ۱۳ دقیقه پیاده)',
        durationMinutes: 6,
        steps: [
          'در ایستگاه مترو شهید قدوسی (خط ۳ آبی فیروزه‌ای) پیاده شوید.',
          'سوار تاکسی خطی شریعتی به سمت شمال شوید و درست بعد از پل سیدخندان سر خیابان جلفا پیاده شوید.',
        ],
      },
      {
        id: 'sc-shariati',
        lineId: 1,
        stationName: 'دکتر شریعتی',
        stationCoords: {lat: 35.7646, lng: 51.4448},
        exitHint: 'خروجی شریعتی به سمت جنوب',
        connectionType: 'taxi',
        connectionLabel: 'تاکسی خطی سیدخندان',
        durationMinutes: 8,
        steps: [
          'در ایستگاه مترو شریعتی (خط ۱ قرمز) پیاده شوید.',
          'با خطی شریعتی به سمت جنوب تا تقاطع جلفا (قبل از پل سیدخندان) بیایید.',
        ],
      },
    ],
    brtOptions: [
      {
        id: 'sc-brt-5',
        lineId: 5,
        stationName: 'سیدخندان / ارسباران',
        stationCoords: {lat: 35.7438, lng: 51.4472},
        recommended: true,
        connectionType: 'walk',
        durationMinutes: 4,
        steps: [
          'با BRT خط ۵ (علم و صنعت – بیهقی) در ایستگاه سیدخندان پیاده شوید.',
          '۴ دقیقه به سمت شمال خیابان شریعتی (نبش جلفا) پیاده‌روی کنید.',
        ],
      },
    ],
    drivingTip:
      'اگر کار اداری یا آزمایشگاهی دارید، ورودی خیابان جلفا برای پیاده شدن با اسنپ بسیار خلوت‌تر از برِ شریعتی است.',
  },
  {
    id: 'vanak',
    name: 'پردیس ونک (ملاصدرا)',
    shortName: 'ونک',
    code: 'VN',
    category: 'faculty',
    neighborhood: 'ونک · خیابان ملاصدرا، خیابان پردیس',
    faculties: [
      'دانشکده مهندسی مکانیک',
      'دانشکده مهندسی صنایع',
      'دانشکده مهندسی و علم مواد',
    ],
    address: 'میدان ونک، خیابان ملاصدرا، خیابان پردیس، پردیس ونک دانشگاه خواجه نصیر',
    mainGate: 'سردر اصلی خیابان پردیس',
    coords: {lat: 35.7568, lng: 51.4045},
    accentColor: '#E30613',
    mapsSearchQuery: 'K. N. Toosi University of Technology Mechanical Engineering Vanak Tehran',
    searchKeywords: [
      'ونک',
      'ملاصدرا',
      'پردیس',
      'مکانیک',
      'صنایع',
      'مواد',
      'مهندسی مکانیک',
      'مهندسی صنایع',
      'مهندسی مواد',
    ],
    metroOptions: [
      {
        id: 'vn-haqqani',
        lineId: 1,
        stationName: 'شهید حقانی',
        stationCoords: {lat: 35.7541, lng: 51.4301},
        recommended: true,
        exitHint: 'خروجی پایانه تاکسی و اتوبوس میدان ونک',
        connectionType: 'taxi',
        connectionLabel: 'تاکسی خطی میدان ونک + ۶ دقیقه پیاده',
        durationMinutes: 13,
        steps: [
          'در ایستگاه مترو شهید حقانی (خط ۱ قرمز) پیاده شوید.',
          'از پایانه کنار ایستگاه، سوار تاکسی یا اتوبوس خطی میدان ونک شوید (حدود ۶ دقیقه).',
          'از ضلع غربی میدان ونک وارد خیابان ملاصدرا شوید و در دومین خیابان به سمت چپ (خیابان پردیس) بپیچید.',
        ],
      },
      {
        id: 'vn-sanat',
        lineId: 7,
        stationName: 'میدان صنعت',
        stationCoords: {lat: 35.7575, lng: 51.3755},
        exitHint: 'خروجی بزرگراه همت / پایانه ونک',
        connectionType: 'taxi',
        connectionLabel: 'تاکسی خطی میدان ونک (مسیر ملاصدرا)',
        durationMinutes: 14,
        steps: [
          'در ایستگاه مترو میدان صنعت (خط ۷ بنفش) پیاده شوید.',
          'سوار تاکسی‌های خطی میدان ونک (مسیر ملاصدرا) شوید.',
          'سر خیابان پردیس در ملاصدرا پیاده شوید (۲ دقیقه پیاده تا سردر).',
        ],
      },
    ],
    brtOptions: [
      {
        id: 'vn-brt-7',
        lineId: 7,
        stationName: 'میدان ونک',
        stationCoords: {lat: 35.7576, lng: 51.4101},
        recommended: true,
        connectionType: 'walk',
        durationMinutes: 8,
        steps: [
          'سوار BRT خط ۷ (ولیعصر: راه‌آهن – تجریش) شوید و در ایستگاه میدان ونک پیاده شوید.',
          'وارد خیابان ملاصدرا به سمت غرب شوید و پس از حدود ۶۰۰ متر وارد خیابان پردیس شوید.',
        ],
      },
    ],
    drivingTip:
      'ورود به خیابان پردیس از ملاصدرا در ساعت‌های اوج (۷:۴۵ تا ۸:۳۰ صبح) شلوغ است؛ پیاده شدن سر ملاصدرا و ۲ دقیقه پیاده‌روی سریع‌تر است.',
  },
  {
    id: 'mirdamad',
    name: 'پردیس میرداماد',
    shortName: 'میرداماد',
    code: 'MD',
    category: 'faculty',
    neighborhood: 'میرداماد · تقاطع ولیعصر',
    faculties: ['دانشکده مهندسی عمران', 'دانشکده مهندسی نقشه‌برداری (ژئوماتیک)'],
    address: 'خیابان ولیعصر، تقاطع بلوار میرداماد، پلاک ۱۳۴۶، پردیس میرداماد',
    mainGate: 'سردر اصلی خیابان ولیعصر (تقاطع میرداماد)',
    coords: {lat: 35.7644, lng: 51.4109},
    accentColor: '#D97706',
    mapsSearchQuery: 'K. N. Toosi University of Technology Civil Engineering Mirdamad Tehran',
    searchKeywords: [
      'میرداماد',
      'عمران',
      'نقشه برداری',
      'نقشه‌برداری',
      'ژئوماتیک',
      'ولیعصر',
    ],
    metroOptions: [
      {
        id: 'md-mirdamad',
        lineId: 1,
        stationName: 'میرداماد',
        stationCoords: {lat: 35.7595, lng: 51.4316},
        recommended: true,
        exitHint: 'خروجی بلوار میرداماد به سمت غرب (ولیعصر)',
        connectionType: 'taxi',
        connectionLabel: 'تاکسی خطی بلوار میرداماد (۴ دقیقه) یا پیاده ۱۲ دقیقه',
        durationMinutes: 6,
        steps: [
          'در ایستگاه مترو میرداماد (خط ۱ قرمز) پیاده شوید.',
          'وارد بلوار میرداماد به سمت غرب (خیابان ولیعصر) شوید و سوار تاکسی خطی ولیعصر شوید.',
          'دقیقاً سر تقاطع ولیعصر و میرداماد مقابل دانشکده عمران و نقشه‌برداری پیاده شوید.',
        ],
      },
    ],
    brtOptions: [
      {
        id: 'md-brt-7',
        lineId: 7,
        stationName: 'میرداماد (ولیعصر)',
        stationCoords: {lat: 35.7636, lng: 51.4112},
        recommended: true,
        connectionType: 'walk',
        durationMinutes: 2,
        steps: [
          'سوار BRT خط ۷ (ولیعصر: راه‌آهن – تجریش) شوید.',
          'در ایستگاه میرداماد پیاده شوید؛ دانشکده عمران و نقشه‌برداری ۲ دقیقه تا ایستگاه فاصله دارد.',
        ],
      },
    ],
    drivingTip:
      'بهترین مسیر با تاکسی اینترنتی از طریق بلوار میرداماد یا ولیعصر شمال به جنوب تا تقاطع میرداماد است.',
  },
  {
    id: 'central',
    name: 'ساختمان مرکزی دانشگاه',
    shortName: 'ساختمان مرکزی',
    code: 'HQ',
    category: 'admin',
    neighborhood: 'میرداماد · نزدیک تقاطع ولیعصر',
    faculties: [
      'حوزه ریاست و هیئت‌رئیسه',
      'معاونت آموزشی و تحصیلات تکمیلی',
      'معاونت دانشجویی و امور اداری',
    ],
    address: 'بلوار میرداماد، شماره ۴۷۰ (نزدیک تقاطع ولیعصر)، ساختمان مرکزی دانشگاه خواجه نصیر',
    mainGate: 'ورودی اصلی بلوار میرداماد (پلاک ۴۷۰)',
    coords: {lat: 35.7623, lng: 51.4148},
    accentColor: '#7B2D8E',
    mapsSearchQuery: 'K. N. Toosi University of Technology Central Building Mirdamad Tehran',
    searchKeywords: [
      'ساختمان مرکزی',
      'مرکزی',
      'آموزش',
      'معاونت',
      'ریاست',
      'اداری',
      'دانشجویی',
      'میرداماد',
      'فارغ التحصیلی',
    ],
    metroOptions: [
      {
        id: 'hq-mirdamad',
        lineId: 1,
        stationName: 'میرداماد',
        stationCoords: {lat: 35.7595, lng: 51.4316},
        recommended: true,
        exitHint: 'خروجی بلوار میرداماد به سمت غرب',
        connectionType: 'walk',
        connectionLabel: 'تاکسی خطی ۳ دقیقه یا پیاده‌روی ۹ دقیقه',
        durationMinutes: 9,
        steps: [
          'در ایستگاه مترو میرداماد (خط ۱ قرمز) پیاده شوید.',
          'به سمت غرب در بلوار میرداماد حرکت کنید (با خطی ۳ دقیقه یا پیاده‌روی ۹ دقیقه).',
          'پیش از رسیدن به ولیعصر، ساختمان مرکزی خواجه نصیر (پلاک ۴۷۰) قرار دارد.',
        ],
      },
    ],
    brtOptions: [
      {
        id: 'hq-brt-7',
        lineId: 7,
        stationName: 'میرداماد (ولیعصر)',
        stationCoords: {lat: 35.7636, lng: 51.4112},
        recommended: true,
        connectionType: 'walk',
        durationMinutes: 5,
        steps: [
          'با BRT خط ۷ (ولیعصر) در ایستگاه میرداماد پیاده شوید.',
          'وارد بلوار میرداماد به سمت شرق شوید و ۵ دقیقه پیاده‌روی کنید.',
        ],
      },
    ],
    drivingTip:
      'برای کارهای فارغ‌التحصیلی، وام دانشجویی و امور اداری صبح قبل از ۱۰ مراجعه کنید؛ در بلوار میرداماد جای پارک محدود است.',
  },
];

/**
 * مسیرهای پیشنهادی بین‌پردیسی پرکاربرد دانشجویان خواجه نصیر
 */
export const INTER_CAMPUS_ROUTES: InterCampusRoute[] = [
  {
    from: 'seyyedkhandan',
    to: 'vanak',
    headline: 'سریع‌ترین مسیر: خطی پل سیدخندان به میدان ونک',
    estimatedMinutes: 22,
    primaryMode: 'taxi',
    brtLines: [5, 7],
    steps: [
      'از درب سیدخندان ۲ دقیقه به سمت زیر پل سیدخندان (ضلع غربی بزرگراه رسالت) بروید.',
      'سوار تاکسی خطی مستقیم «سیدخندان ← میدان ونک» شوید (حدود ۱۵ دقیقه در مسیر رسالت/حقانی).',
      'در میدان ونک پیاده شده و ۵ دقیقه در خیابان ملاصدرا به سمت خیابان پردیس پیاده‌روی کنید.',
    ],
    studentTip: 'در ساعات پرترافیک عصر، ترکیب BRT خط ۵ تا بیهقی و سپس BRT خط ۷ ولیعصر به ونک ثبات زمانی بیشتری دارد.',
  },
  {
    from: 'seyyedkhandan',
    to: 'rezaeinejad',
    headline: 'تاکسی خطی رسالت/تهرانپارس یا مترو خط ۳ به خط ۲',
    estimatedMinutes: 35,
    primaryMode: 'metro',
    metroLines: [3, 2],
    brtLines: [5],
    steps: [
      'زیر پل سیدخندان سوار تاکسی خطی یا اتوبوس تندرو (BRT خط ۵) به سمت شرق بزرگراه رسالت (علم و صنعت / تهرانپارس) شوید.',
      'یا از مترو شهید قدوسی (خط ۳) سوار شده، در امام حسین به خط ۲ (سمت فرهنگسرا) تعویض خط کنید.',
      'از ایستگاه مترو فرهنگسرا یا چهارراه تهرانپارس با خطی وفادار شرقی (۱۲ دقیقه) به پردیس رضایی‌نژاد برسید.',
    ],
    studentTip: 'اگر صبح زود بین دو کلاس فاصله دارید، خطی مستقیم بزرگراه زین‌الدین/رسالت از سیدخندان معمولاً سریع‌تر از تعویض مترو است.',
  },
  {
    from: 'science',
    to: 'rezaeinejad',
    headline: 'مسیر پرکاربرد بچه‌های علوم پایه به پردیس رضایی‌نژاد',
    estimatedMinutes: 34,
    primaryMode: 'brt',
    metroLines: [2],
    brtLines: [5, 9],
    steps: [
      'از ایستگاه BRT خط ۵ سیدخندان به سمت دانشگاه علم و صنعت حرکت کنید.',
      'از پایانه علم و صنعت یا ایستگاه مترو فرهنگسرا (خط ۲) سوار خطی وفادار شرقی شوید.',
      'مقابل سردر اصلی پردیس رضایی‌نژاد پیاده شوید.',
    ],
    studentTip: 'بیشتر کلاس‌های تئوری ریاضی، فیزیک و شیمی در رضایی‌نژاد است؛ حداقل ۴۵ دقیقه قبل از شروع کلاس حرکت کنید.',
  },
  {
    from: 'seyyedkhandan',
    to: 'mirdamad',
    headline: 'خطی شریعتی به مترو میرداماد + بلوار میرداماد',
    estimatedMinutes: 24,
    primaryMode: 'taxi',
    metroLines: [1],
    steps: [
      'مقابل دانشکده برق سوار تاکسی خطی خیابان شریعتی به سمت شمال شوید و سر بلوار میرداماد (مترو میرداماد) پیاده شوید.',
      'در بلوار میرداماد سوار خطی خیابان ولیعصر شوید (۴ دقیقه).',
      'دقیقاً مقابل دانشکده عمران و نقشه‌برداری در تقاطع ولیعصر پیاده شوید.',
    ],
    studentTip: 'برای رسیدن به ساختمان مرکزی هم دقیقاً همین مسیر است و ۲ ایستگاه قبل از تقاطع ولیعصر پیاده می‌شوید.',
  },
  {
    from: 'vanak',
    to: 'mirdamad',
    headline: 'BRT خط ۷ ولیعصر (یک ایستگاه به سمت شمال)',
    estimatedMinutes: 12,
    primaryMode: 'brt',
    brtLines: [7],
    steps: [
      'از خیابان پردیس وارد ملاصدرا شده و به ایستگاه BRT میدان ونک برسید (۷ دقیقه پیاده).',
      'سوار BRT خط ۷ به سمت تجریش شوید و در ایستگاه میرداماد پیاده شوید (۳ دقیقه).',
      '۲ دقیقه تا سردر دانشکده عمران و نقشه‌برداری فاصله دارید.',
    ],
    studentTip: 'پیاده‌روی کل این مسیر از خیابان ولیعصر هم حدود ۱۵ دقیقه زمان می‌برد و در ترافیک سریع‌تر از ماشین است.',
  },
  {
    from: 'mirdamad',
    to: 'central',
    headline: 'پیاده‌روی ۵ دقیقه‌ای در بلوار میرداماد',
    estimatedMinutes: 5,
    primaryMode: 'walk',
    steps: [
      'از سردر دانشکده عمران و نقشه‌برداری وارد بلوار میرداماد به سمت شرق شوید.',
      'پس از ۵ دقیقه پیاده‌روی (حدود ۴۰۰ متر) به ساختمان مرکزی (پلاک ۴۷۰) می‌رسید.',
    ],
    studentTip: 'نیازی به ماشین یا تاکسی نیست؛ کل مسیر پیاده‌رو سایه‌دار و مستقیم است.',
  },
  {
    from: 'seyyedkhandan',
    to: 'science',
    headline: 'پیاده‌روی کوتاه در خیابان شریعتی',
    estimatedMinutes: 6,
    primaryMode: 'walk',
    steps: [
      'از درب دانشکده برق و کامپیوتر به سمت شمال در خیابان شریعتی حرکت کنید.',
      'از زیر پل سیدخندان عبور کرده و سر تقاطع جلفا (ارسباران) به پردیس علوم می‌رسید.',
    ],
    studentTip: 'کل مسیر زیر ۵۰۰ متر است و پیاده بسیار سریع‌تر از خودرو است.',
  },
  {
    from: 'vanak',
    to: 'rezaeinejad',
    headline: 'مترو خط ۱ (حقانی) → تعویض در امام خمینی یا خط ۳ ← خط ۲ (فرهنگسرا)',
    estimatedMinutes: 48,
    primaryMode: 'metro',
    metroLines: [1, 2],
    steps: [
      'از میدان ونک با خطی به ایستگاه مترو شهید حقانی (خط ۱ قرمز) بروید.',
      'به سمت کهریزک سوار شوید و در ایستگاه دروازه دولت یا امام خمینی به خط ۲ (سمت فرهنگسرا) تعویض خط کنید.',
      'در ایستگاه فرهنگسرا پیاده شده و با خطی وفادار (۱۲ دقیقه) به پردیس رضایی‌نژاد برسید.',
    ],
    studentTip: 'در ساعات غیراوج، مسیر تاکسی/اسنپ از بزرگراه همت شرق مستقیم به بزرگراه زین‌الدین حدود ۳۰ دقیقه طول می‌کشد.',
  },
];

export const CAMPUS_MAP: Record<CampusId, KntuCampus> = KNTU_CAMPUSES.reduce(
  (acc, campus) => {
    acc[campus.id] = campus;
    return acc;
  },
  {} as Record<CampusId, KntuCampus>,
);
