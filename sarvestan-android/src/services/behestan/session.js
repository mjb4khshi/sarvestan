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

export function saveManualSession(partial) {
  const cur = loadManual() || {};
  const clean = { ...partial };
  for (const k of ['studentId', 'userId', 'cookies']) {
    if (clean[k] === null || clean[k] === 'null' || clean[k] === undefined || clean[k] === '') {
      delete clean[k];
    }
  }
  const next = { ...cur, ...clean };
  localStorage.setItem(MANUAL_KEY, JSON.stringify(next));
  return next;
}

/** alias برای ورود از UI */
export const applyManualSession = saveManualSession;

export function clearSession() {
  try {
    localStorage.removeItem(MANUAL_KEY);
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

export function getStudentId() {
  return loadManual()?.studentId || null;
}

export function getUserId() {
  return loadManual()?.userId || null;
}

export function isSessionAlive() {
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
    alive: isSessionAlive(),
  };
}

export const BEHESTAN_ORIGIN = 'https://behestan.kntu.ac.ir';
