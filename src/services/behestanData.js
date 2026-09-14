import liveSync from './behestanLiveSync';

// ──────────────────────────────────────────────────────────────────
// هیچ دیتایی هاردکد نیست — همه چیز از chrome.storage / localStorage خوانده می‌شود
// دیتا توسط contentScript.js و behestanInterceptor.js از API بهستان همگام‌سازی می‌شود
// ──────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  PROFILE:       'sarvestan_live_profile',
  SCHEDULE:      'sarvestan_live_schedule',
  EXAMS:         'sarvestan_live_exams',
  TRANSCRIPTS:   'sarvestan_live_transcripts',
  FINANCE:       'sarvestan_live_finance',
  COURSES:       'sarvestan_live_courses',
  WORKFLOWS:     'sarvestan_live_workflows',
  ANNOUNCEMENTS: 'sarvestan_live_announcements',
  CURRICULUM:    'sarvestan_live_curriculum_stats'
};

// ── Helper: خواندن از localStorage ──
function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// ── کش محلی ──
let _cache = {
  schedule:      readLocal(STORAGE_KEYS.SCHEDULE, {}),
  exams:         readLocal(STORAGE_KEYS.EXAMS, {}),
  transcripts:   readLocal(STORAGE_KEYS.TRANSCRIPTS, []),
  finance:       readLocal(STORAGE_KEYS.FINANCE, {}),
  courses:       readLocal(STORAGE_KEYS.COURSES, []),
  workflows:     readLocal(STORAGE_KEYS.WORKFLOWS, []),
  announcements: readLocal(STORAGE_KEYS.ANNOUNCEMENTS, []),
  curriculumStats: readLocal(STORAGE_KEYS.CURRICULUM, null)
};

const listeners = new Set();
export function subscribeToData(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function notifyData() {
  listeners.forEach(cb => {
    try { cb(_cache); } catch(e) {}
  });
}

// ── شنود تغییرات chrome.storage ──
if (typeof chrome !== 'undefined' && chrome.storage?.local) {
  chrome.storage.local.get(Object.values(STORAGE_KEYS), (res) => {
    if (res[STORAGE_KEYS.SCHEDULE])      _cache.schedule = res[STORAGE_KEYS.SCHEDULE];
    if (res[STORAGE_KEYS.EXAMS])         _cache.exams = res[STORAGE_KEYS.EXAMS];
    if (res[STORAGE_KEYS.TRANSCRIPTS])   _cache.transcripts = res[STORAGE_KEYS.TRANSCRIPTS];
    if (res[STORAGE_KEYS.FINANCE])       _cache.finance = res[STORAGE_KEYS.FINANCE];
    if (res[STORAGE_KEYS.COURSES])       _cache.courses = res[STORAGE_KEYS.COURSES];
    if (res[STORAGE_KEYS.WORKFLOWS])     _cache.workflows = res[STORAGE_KEYS.WORKFLOWS];
    if (res[STORAGE_KEYS.ANNOUNCEMENTS]) _cache.announcements = res[STORAGE_KEYS.ANNOUNCEMENTS];
    if (res[STORAGE_KEYS.CURRICULUM])    _cache.curriculumStats = res[STORAGE_KEYS.CURRICULUM];
    mirrorCacheToLocal();
    notifyData();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes[STORAGE_KEYS.SCHEDULE])      _cache.schedule = changes[STORAGE_KEYS.SCHEDULE].newValue;
    if (changes[STORAGE_KEYS.EXAMS])         _cache.exams = changes[STORAGE_KEYS.EXAMS].newValue;
    if (changes[STORAGE_KEYS.TRANSCRIPTS])   _cache.transcripts = changes[STORAGE_KEYS.TRANSCRIPTS].newValue;
    if (changes[STORAGE_KEYS.FINANCE])       _cache.finance = changes[STORAGE_KEYS.FINANCE].newValue;
    if (changes[STORAGE_KEYS.COURSES])       _cache.courses = changes[STORAGE_KEYS.COURSES].newValue;
    if (changes[STORAGE_KEYS.WORKFLOWS])     _cache.workflows = changes[STORAGE_KEYS.WORKFLOWS].newValue;
    if (changes[STORAGE_KEYS.ANNOUNCEMENTS]) _cache.announcements = changes[STORAGE_KEYS.ANNOUNCEMENTS].newValue;
    if (changes[STORAGE_KEYS.CURRICULUM])    _cache.curriculumStats = changes[STORAGE_KEYS.CURRICULUM].newValue;
    mirrorCacheToLocal();
    notifyData();
  });
}

function mirrorCacheToLocal() {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(_cache.schedule || {}));
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(_cache.exams || {}));
    localStorage.setItem(STORAGE_KEYS.CURRICULUM, JSON.stringify(_cache.curriculumStats || null));
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(_cache.courses || []));
    localStorage.setItem(STORAGE_KEYS.TRANSCRIPTS, JSON.stringify(_cache.transcripts || []));
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(_cache.finance || {}));
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(_cache.workflows || []));
  } catch {}
}

// ── accessor های امن برای ماژول‌ها (همیشه از _cache، نه فقط localStorage) ──
export function getSchedules() {
  return _cache.schedule || {};
}

export function getExams() {
  return _cache.exams || {};
}

export function getCurriculumStats() {
  return _cache.curriculumStats || null;
}

export function getCourses() {
  return _cache.courses || [];
}

export function getDataCache() {
  return _cache;
}

// ── شنود postMessage از contentScript / interceptor ──
const DATA_TYPE_TO_KEY = {
  schedule: 'SCHEDULE',
  exams: 'EXAMS',
  transcripts: 'TRANSCRIPTS',
  finance: 'FINANCE',
  courses: 'COURSES',
  workflows: 'WORKFLOWS',
  announcements: 'ANNOUNCEMENTS',
  curriculumStats: 'CURRICULUM'
};

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.data?.action === 'SARVESTAN_DATA_UPDATE') {
      const { dataType, payload } = event.data;
      if (dataType && payload) {
        _cache[dataType] = payload;
        const keyName = DATA_TYPE_TO_KEY[dataType];
        const sk = keyName ? STORAGE_KEYS[keyName] : null;
        if (sk) {
          try { localStorage.setItem(sk, JSON.stringify(payload)); } catch {}
        }
        notifyData();
      }
    }
  });
}

// ──────────────────────────────────────────────────────────────────
// پروفایل (Proxy داینامیک)
// ──────────────────────────────────────────────────────────────────
export const DEFAULT_GUEST_PROFILE = liveSync ? undefined : undefined;

export const BEHESTAN_PROFILE = new Proxy({}, {
  get(target, prop) {
    const current = liveSync?.currentProfile || {
      fullName: 'دانشجوی میهمان',
      studentId: 'ـ',
      university: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
      faculty: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
      major: 'دانشجو',
      degree: 'کارشناسی',
      term: 'نیم‌سال تحصیلی جاری (۴۰۵۱)',
      gpa: 'ـ',
      totalUnitsPassed: 0,
      standing: 'ـ',
      photo: null,
      isLoggedIn: false
    };
    if (prop === 'photo') {
      const p = current.photo;
      if (!p || typeof p !== 'string' || /PHOTO|blank-profile-picture/i.test(p)) return null;
      if (p.startsWith('data:image/')) {
        const m = p.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.*)$/is);
        if (!m) return null;
        const b64 = m[2].replace(/[^A-Za-z0-9+/=]/g, '');
        if (b64.length < 80) return null;
        const mime = m[1] === 'png' || b64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
        return `data:${mime};base64,${b64}`;
      }
      return p;
    }
    return current[prop];
  }
});

// ──────────────────────────────────────────────────────────────────
// دروس ترم جاری
// ──────────────────────────────────────────────────────────────────
export const REAL_COURSES_TERM_4051 = new Proxy([], {
  get(target, prop) {
    const list = _cache.courses || [];
    if (prop === 'length') return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator]?.bind(list);
    if (typeof list[prop] === 'function') return list[prop].bind(list);
    return list[prop];
  }
});

// ── دروس ترم جاری برای شبیه‌ساز معدل ──
export const CURRENT_TERM_4051_COURSES = new Proxy([], {
  get(target, prop) {
    const list = (_cache.courses && _cache.courses.length > 0)
      ? _cache.courses.filter(c => (c.termId === '4051' || !c.grade) && !c.isDropped && c.regStatus !== 'dropped' && !String(c.status || '').includes('حذف'))
      : [];
    const simCourses = list.map(c => ({
      id: c.id || c.code,
      code: c.code || '',
      title: c.name || c.title || '',
      units: c.units || 3,
      defaultGrade: 16.0,
      isFinal: false
    }));
    if (prop === 'length') return simCourses.length;
    if (prop === Symbol.iterator) return simCourses[Symbol.iterator]?.bind(simCourses);
    if (typeof simCourses[prop] === 'function') return simCourses[prop].bind(simCourses);
    return simCourses[prop];
  }
});

// ──────────────────────────────────────────────────────────────────
// کارنامه رسمی (گزارش ۷۹)
// ──────────────────────────────────────────────────────────────────
export const AUTHENTIC_STUDENT_TRANSCRIPTS = new Proxy([], {
  get(target, prop) {
    const list = (_cache.transcripts || []).map(t => {
      const termCourses = (t.courses && t.courses.length > 0)
        ? t.courses
        : (_cache.courses || []).filter(c => c.termId === t.termId);
      return {
        ...t,
        unitsPassed: t.unitsPassed ?? t.passedUnits ?? 0,
        courses: termCourses
      };
    });
    if (prop === 'length') return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator]?.bind(list);
    if (typeof list[prop] === 'function') return list[prop].bind(list);
    return list[prop];
  }
});

export const REAL_TRANSCRIPTS = AUTHENTIC_STUDENT_TRANSCRIPTS;

// ──────────────────────────────────────────────────────────────────
// وضعیت مالی (گزارش ۲۵۶۳)
// ──────────────────────────────────────────────────────────────────
export const REAL_FINANCIAL_REPORT_2563 = new Proxy({}, {
  get(target, prop) {
    const fin = _cache.finance || {};
    const rawDebt = fin.totalDebtRial ?? fin.debtRial ?? 0;
    const numDebt = typeof rawDebt === 'number'
      ? rawDebt
      : parseInt(String(rawDebt).replace(/[^\d]/g, '') || '0', 10);

    if (prop === 'reportNumber')   return fin.reportNumber || '2563';
    if (prop === 'studentId')      return BEHESTAN_PROFILE.studentId;
    if (prop === 'studentName')    return BEHESTAN_PROFILE.fullName;
    if (prop === 'totalDebtRial')  return numDebt;
    if (prop === 'totalDebtToman') return Math.floor(numDebt / 10);
    if (prop === 'statusText')     return fin.statusText || (numDebt > 0 ? 'بدهکار' : 'تسویه حساب کامل');
    if (prop === 'termsSummary')   return fin.termsSummary || [];
    return fin[prop];
  }
});

export const REPORT_1965_PAYMENTS = new Proxy({}, {
  get(target, prop) {
    const fin = _cache.finance || {};
    if (prop === 'formNumber')     return '27570';
    if (prop === 'reportNumber')   return '1965';
    if (prop === 'studentId')      return BEHESTAN_PROFILE.studentId;
    if (prop === 'studentName')    return BEHESTAN_PROFILE.fullName;
    if (prop === 'totalDebtRial')  return REAL_FINANCIAL_REPORT_2563.totalDebtRial;
    if (prop === 'totalPaidRial')  return fin.totalPaidRial || 0;
    if (prop === 'status')         return fin.status || (REAL_FINANCIAL_REPORT_2563.totalDebtRial > 0 ? 'بدهکار' : 'تسویه کامل');
    if (prop === 'rows')           return fin.paymentRows || [];
    return target[prop];
  }
});

// ──────────────────────────────────────────────────────────────────
// گردش کار و درخواست‌ها
// ──────────────────────────────────────────────────────────────────
export const REAL_WORKFLOW_REQUESTS = new Proxy([], {
  get(target, prop) {
    const list = _cache.workflows || [];
    if (prop === 'length') return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator]?.bind(list);
    if (typeof list[prop] === 'function') return list[prop].bind(list);
    return list[prop];
  }
});

// ──────────────────────────────────────────────────────────────────
// اعلانات رسمی بهستان
// ──────────────────────────────────────────────────────────────────
export const BEHESTAN_ANNOUNCEMENTS = new Proxy([], {
  get(target, prop) {
    const list = _cache.announcements || [];
    if (prop === 'length') return list.length;
    if (prop === Symbol.iterator) return list[Symbol.iterator]?.bind(list);
    if (typeof list[prop] === 'function') return list[prop].bind(list);
    return list[prop];
  }
});

// ── بروزرسانی مستقیم کش ──
export function updateCachedData(dataType, payload) {
  _cache[dataType] = payload;
  const storageKey = STORAGE_KEYS[dataType.toUpperCase()];
  if (storageKey) {
    try { localStorage.setItem(storageKey, JSON.stringify(payload)); } catch {}
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [storageKey]: payload });
    }
  }
  notifyData();
}
