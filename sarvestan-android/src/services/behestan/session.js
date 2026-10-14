/**
 * نشست بهستان — sid / ticket / studentId
 * مهم‌ترین منبع: کش دستی (applySession)
 */

const MANUAL_KEY = 'sarvestan_mobile_session';

function loadManual() {
  try {
    const raw = localStorage.getItem(MANUAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveManualSession(partial, { replace = false } = {}) {
  const cur = replace ? {} : loadManual() || {};
  const clean = {};
  for (const [k, v] of Object.entries(partial || {})) {
    if (v !== undefined && v !== null && v !== 'null') {
      clean[k] = v;
    }
  }
  delete clean.expired;
  const next = replace ? clean : { ...cur, ...clean };
  delete next.expired;
  localStorage.setItem(MANUAL_KEY, JSON.stringify(next));
  return next;
}

/** ورود تازه: نشست قبلی را کامل جایگزین کن تا کوکی/کش خراب نماند */
export function beginFreshLoginSession() {
  clearSession();
}

/** alias برای ورود از UI */
export const applyManualSession = saveManualSession;

export function clearSession() {
  try {
    const m = loadManual();
    const curUni = m?.university || localStorage.getItem(UNI_KEY);
    localStorage.removeItem(MANUAL_KEY);
    if (curUni) localStorage.setItem(UNI_KEY, curUni);
  } catch {}
  try {
    localStorage.removeItem('sid');
    localStorage.removeItem('t');
    localStorage.removeItem('un');
    localStorage.removeItem('ut');
  } catch {}
}

/**
 * پاک کردن کامل دیتای زنده + نشست — برای «قطع و شروع دوباره»
 */
export function clearAllLive() {
  clearSession();
  try {
    const keys = [
      'sarvestan_live_profile',
      'sarvestan_live_schedule',
      'sarvestan_live_exams',
      'sarvestan_live_transcripts',
      'sarvestan_live_finance',
      'sarvestan_live_courses',
      'sarvestan_live_workflows',
      'sarvestan_live_announcements',
      'sarvestan_live_curriculum_stats',
      'sarvestan_live_sync_meta',
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function normalizeTicket(t) {
  if (!t) return t;
  const s = String(t).trim();
  if (!s) return s;
  if (s.charAt(0) === '{') return s;
  return JSON.stringify({ Ticket: s, IdleTime: 5 });
}

export function getSid() {
  return loadManual()?.sid || null;
}

export function getTicket() {
  return normalizeTicket(loadManual()?.ticket || null);
}

export function updateTicket(newTicket) {
  if (!newTicket) return;
  const cur = loadManual() || {};
  const norm = normalizeTicket(newTicket);
  if (cur.ticket !== norm) {
    saveManualSession({ ticket: norm });
  }
}

export function getStudentId() {
  return loadManual()?.studentId || null;
}

export function getUserId() {
  return loadManual()?.userId || null;
}

export function invalidateSession() {
  try {
    const cur = loadManual() || {};
    if (cur.sid) {
      cur.expired = true;
      localStorage.setItem(MANUAL_KEY, JSON.stringify(cur));
    }
  } catch {}
}

export function isSessionAlive() {
  const m = loadManual();
  if (m?.expired) return false;
  const sid = getSid();
  const t = getTicket();
  return Boolean(sid && t && String(t).length > 10);
}

export function getSessionSnapshot() {
  return {
    sid: getSid(),
    ticket: getTicket(),
    studentId: getStudentId(),
    userId: getUserId(),
    cookies: loadManual()?.cookies || null,
    university: getSelectedUniversity(),
    alive: isSessionAlive(),
  };
}

export const UNIVERSITIES = [
  {
    id: 'kntu',
    name: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
    shortName: 'خواجه نصیر',
    origin: 'https://behestan.kntu.ac.ir',
    authMethod: 'sso',
    logo: '/kntu-logo.svg',
    systemName: 'سامانه بهستان',
  },
  {
    id: 'aut',
    name: 'دانشگاه صنعتی امیرکبیر (پلی‌تکنیک تهران)',
    shortName: 'امیرکبیر',
    origin: 'https://portal.aut.ac.ir',
    authMethod: 'sso',
    logo: '/aut-logo.png',
    systemName: 'سامانه بهستان امیرکبیر',
  },
  {
    id: 'sbu',
    name: 'دانشگاه شهید بهشتی',
    shortName: 'شهید بهشتی',
    origin: 'https://ems.sbu.ac.ir',
    authMethod: 'direct_captcha',
    logo: '/sbu-logo.svg',
    systemName: 'سامانه آموزشی بهستان',
  },
  {
    id: 'ut',
    name: 'دانشگاه تهران',
    shortName: 'دانشگاه تهران',
    origin: 'https://ems2.ut.ac.ir',
    authMethod: 'sso',
    logo: '/ut-logo.svg',
    systemName: 'سامانه گلستان / بهستان ۲',
  },
  {
    id: 'iust',
    name: 'دانشگاه علم و صنعت ایران',
    shortName: 'علم و صنعت',
    origin: 'https://golestan.iust.ac.ir',
    authMethod: 'direct_captcha',
    logo: '/iust-logo.png',
    systemName: 'سامانه گلستان (غیرفعال)',
    disabled: true,
  },
];

const UNI_KEY = 'sarvestan_selected_university';

export function getSelectedUniversity() {
  try {
    const manual = loadManual();
    if (manual?.university && manual.university !== 'iust') return manual.university;
    const stored = localStorage.getItem(UNI_KEY);
    if (stored && stored !== 'iust') return stored;
    const profile = JSON.parse(localStorage.getItem('sarvestan_live_profile') || 'null');
    if (profile?.studentId && /^40\d{6}$/.test(String(profile.studentId))) return 'aut';
    if (profile?.studentId && /^40\d{7}$/.test(String(profile.studentId))) return 'sbu';
    if (profile?.studentId && /^(51|81|41|61)\d{7}$/.test(String(profile.studentId))) return 'ut';
    if (profile?.faculty && /امیرکبیر|پلی‌تکنیک/i.test(profile.faculty)) return 'aut';
    if (profile?.faculty && /ریاضی|بهشتی|کامپیوتر/i.test(profile.faculty)) return 'sbu';
    if (profile?.faculty && /تهران|دانشکدگان/i.test(profile.faculty)) return 'ut';
    return 'kntu';
  } catch {
    return 'kntu';
  }
}

export function setSelectedUniversity(uniId) {
  try {
    localStorage.setItem(UNI_KEY, uniId);
    saveManualSession({ university: uniId });
  } catch {}
}

export function getUniversityOrigin(uniId = getSelectedUniversity()) {
  if (uniId === 'aut') return 'https://portal.aut.ac.ir';
  if (uniId === 'sbu') return 'https://ems.sbu.ac.ir';
  if (uniId === 'ut') return 'https://ems2.ut.ac.ir';
  if (uniId === 'iust') return 'https://golestan.iust.ac.ir';
  return 'https://behestan.kntu.ac.ir';
}

export function getUniversityName(uniId = getSelectedUniversity()) {
  const found = UNIVERSITIES.find((u) => u.id === uniId);
  return found?.name || 'دانشگاه صنعتی خواجه نصیرالدین طوسی';
}

export function getUniversityShortName(uniId = getSelectedUniversity()) {
  const found = UNIVERSITIES.find((u) => u.id === uniId);
  return found?.shortName || found?.name || 'خواجه نصیر';
}

export const BEHESTAN_ORIGIN = 'https://behestan.kntu.ac.ir';

