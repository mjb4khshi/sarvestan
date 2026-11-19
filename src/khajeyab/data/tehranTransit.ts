export type MetroLineId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type BrtLineId = 1 | 4 | 5 | 7 | 9;

export interface TehranMetroLine {
  id: MetroLineId;
  code: string;
  name: string;
  routeLabel: string;
  color: string;
  textColor: string;
}

export interface TehranBrtLine {
  id: BrtLineId;
  code: string;
  name: string;
  routeLabel: string;
  color: string;
  textColor: string;
}

/**
 * رنگ‌های رسمی خطوط ۱ تا ۷ متروی تهران
 */
export const TEHRAN_METRO_LINES: Record<MetroLineId, TehranMetroLine> = {
  1: {
    id: 1,
    code: '۱',
    name: 'خط ۱ مترو تهران',
    routeLabel: 'تجریش ↔ کهریزک',
    color: '#E30613',
    textColor: '#FFFFFF',
  },
  2: {
    id: 2,
    code: '۲',
    name: 'خط ۲ مترو تهران',
    routeLabel: 'فرهنگسرا ↔ تهران (صادقیه)',
    color: '#0054A6',
    textColor: '#FFFFFF',
  },
  3: {
    id: 3,
    code: '۳',
    name: 'خط ۳ مترو تهران',
    routeLabel: 'قائم ↔ آزادگان',
    color: '#00AEEF',
    textColor: '#052230',
  },
  4: {
    id: 4,
    code: '۴',
    name: 'خط ۴ مترو تهران',
    routeLabel: 'شهید کلاهدوز ↔ علامه جعفری',
    color: '#FFD100',
    textColor: '#1E1B00',
  },
  5: {
    id: 5,
    code: '۵',
    name: 'خط ۵ مترو تهران',
    routeLabel: 'صادقیه ↔ گلشهر (کرج)',
    color: '#008C45',
    textColor: '#FFFFFF',
  },
  6: {
    id: 6,
    code: '۶',
    name: 'خط ۶ مترو تهران',
    routeLabel: 'کوهسار ↔ دولت‌آباد',
    color: '#E91E63',
    textColor: '#FFFFFF',
  },
  7: {
    id: 7,
    code: '۷',
    name: 'خط ۷ مترو تهران',
    routeLabel: 'میدان کتاب ↔ بسیج',
    color: '#7B2D8E',
    textColor: '#FFFFFF',
  },
};

export const TEHRAN_BRT_LINES: Record<BrtLineId, TehranBrtLine> = {
  1: {
    id: 1,
    code: '۱',
    name: 'BRT خط ۱',
    routeLabel: 'چهارراه تهرانپارس ↔ پایانه آزادی',
    color: '#D97706',
    textColor: '#FFFFFF',
  },
  4: {
    id: 4,
    code: '۴',
    name: 'BRT خط ۴',
    routeLabel: 'پایانه جنوب ↔ پایانه افشار (پارک‌وی)',
    color: '#0284C7',
    textColor: '#FFFFFF',
  },
  5: {
    id: 5,
    code: '۵',
    name: 'BRT خط ۵',
    routeLabel: 'دانشگاه علم و صنعت ↔ پایانه بیهقی (آرژانتین)',
    color: '#0D9488',
    textColor: '#FFFFFF',
  },
  7: {
    id: 7,
    code: '۷',
    name: 'BRT خط ۷',
    routeLabel: 'راه‌آهن ↔ تجریش (ولیعصر)',
    color: '#DC2626',
    textColor: '#FFFFFF',
  },
  9: {
    id: 9,
    code: '۹',
    name: 'BRT خط ۹',
    routeLabel: 'پایانه لاله ↔ مترو جوانمرد قصاب',
    color: '#7C3AED',
    textColor: '#FFFFFF',
  },
};

export const METRO_LINE_LIST: TehranMetroLine[] = [1, 2, 3, 4, 5, 6, 7].map(
  (id) => TEHRAN_METRO_LINES[id as MetroLineId],
);
