/**
 * موتور سنک — سریع، با قطع فوری روی خطای نشست
 */

import { delay } from './http';
import {
  canSync,
  fetchStudentTotals,
  fetchPersonal,
  fetchWorkflows,
  fetchCurriculumStats,
  fetchViewReport,
  fetchRegistration88,
} from './client';
import { markSyncStatus, getSnapshot, addLocalNote } from './store';
import { detectCurrentTermId, termIdToLabel } from './parsers';
import { isSessionAlive, saveManualSession, getStudentId, invalidateSession } from './session';

let running = false;
let lastRunAt = 0;
const COOLDOWN_MS = 4 * 1000;

/** آزاد کردن سنک گیرکرده — برای قطع اتصال یا دکمهٔ سنک دوباره */
export function resetSyncState() {
  running = false;
  lastRunAt = 0;
  try {
    markSyncStatus('idle');
  } catch {}
}

function isSessionError(text) {
  return /نشست|session|50216|پایان رسيده|پایان رسیده|403|forbidden|access is denied/i.test(String(text || ''));
}

export function getPrecedingTerms(term, count = 5) {
  const m = String(term || '').match(/^(\d{3})(\d)$/);
  if (!m) return ['4042', '4041', '4032', '4031'];
  let year = parseInt(m[1], 10);
  let sem = parseInt(m[2], 10);
  const terms = [];
  for (let i = 0; i < count; i++) {
    if (sem === 1) {
      year -= 1;
      sem = 2;
    } else {
      sem -= 1;
    }
    terms.push(`${year}${sem}`);
  }
  return terms;
}

export async function runFullSync({ force = false } = {}) {
  if (running) return { ok: false, reason: 'already-running' };
  if (!force && Date.now() - lastRunAt < COOLDOWN_MS) {
    return { ok: false, reason: 'cooldown' };
  }

  // روی وب، آخرین نشست ثبت شده در سرور را قبل از سنک بارگذاری کن
  if (!globalThis.Capacitor?.isNativePlatform?.()) {
    try {
      const s = await fetch('/__sarvestan/session').then((r) => r.json());
      if (s?.sid && s?.ticket) {
        saveManualSession({
          sid: s.sid,
          ticket: s.ticket,
          studentId: s.studentId || undefined,
          cookies: s.cookies || undefined,
        });
      }
    } catch {}
  }

  if (!canSync() || !isSessionAlive()) {
    markSyncStatus('no-session');
    return { ok: false, reason: 'no-session' };
  }

  running = true;
  lastRunAt = Date.now();
  markSyncStatus('syncing', { error: undefined });

  // اسنپ‌شات قبل از سنک — برای اعلان تغییرات
  const beforeCourses = (getSnapshot()?.courses || []).map((c) => ({
    key: `${c.termId}|${c.code}`,
    name: c.name,
    regStatus: c.regStatus || '',
    grade: c.grade || '',
    units: c.units || 0,
  }));
  const beforeMap = new Map(beforeCourses.map((c) => [c.key, c]));

  const results = {
    schedule: 0,
    exams: 0,
    courses: 0,
    finance: false,
    profile: false,
    workflows: 0,
    curriculum: false,
    errors: [],
  };

  try {
    // ── گام اول: نام و مشخصات دانشجو از ثبت‌نام (گزارش ۸۸) ──
    let currentTerm = detectCurrentTermId(getSnapshot()?.courses || []) || '4042';
    let sessionDead = false;

    try {
      const r88 = await fetchRegistration88(null);
      if (r88?.error) {
        if (isSessionError(r88.error)) sessionDead = true;
        results.errors.push(`۸۸: ${r88.error}`);
      } else if (r88?.meta?.fullName) {
        results.profile = true;
        markSyncStatus('live', { phase: 'registration', lastResults: results });
      }
      if (r88?.courses?.length) {
        results.schedule += r88.courses.length;
      }
    } catch (e) {
      console.warn('[sync] r88 error:', e?.message || e);
      if (isSessionError(e?.message)) sessionDead = true;
      results.errors.push(`۸۸: ${e?.message || e}`);
    }

    if (sessionDead) {
      invalidateSession();
      markSyncStatus('error', {
        lastResults: results,
        error: 'نشست بهستان به پایان رسیده است. لطفاً دکمهٔ «ورود زندهٔ بهستان» را بزنید.',
      });
      return { ok: false, reason: 'session-expired', results };
    }

    // ── گام دوم: عکس پرسنلی دانشجو (فرم F1809) ──
    try {
      const pData = await fetchPersonal();
      if (pData?.error && isSessionError(pData.error)) {
        sessionDead = true;
      } else if (pData?.photo) {
        results.profile = true;
        markSyncStatus('live', { phase: 'profile', lastResults: results });
      }
    } catch (e) {
      console.warn('[sync] F1809 photo error:', e?.message || e);
      if (isSessionError(e?.message)) sessionDead = true;
    }

    if (sessionDead) {
      invalidateSession();
      markSyncStatus('error', {
        lastResults: results,
        error: 'نشست بهستان به پایان رسیده است. لطفاً دکمهٔ «ورود زندهٔ بهستان» را بزنید.',
      });
      return { ok: false, reason: 'session-expired', results };
    }

    // ── گام سوم: برنامه هفتگی (گزارش ۷۸) برای ۴۰۴۲ و جاری ──
    for (const t of ['4042', currentTerm]) {
      if (sessionDead) break;
      try {
        const p78 = await fetchViewReport('78', t);
        if (p78?.error && isSessionError(p78.error)) {
          sessionDead = true;
          break;
        }
        if (p78?.courses?.length) {
          results.schedule += p78.courses.length;
          markSyncStatus('live', { phase: 'schedule', lastResults: results });
        }
      } catch (e) {
        console.warn(`[sync] p78 (${t}) error:`, e?.message || e);
        if (isSessionError(e?.message)) {
          sessionDead = true;
          break;
        }
      }
    }

    if (sessionDead) {
      invalidateSession();
      markSyncStatus('error', {
        lastResults: results,
        error: 'نشست بهستان به پایان رسیده است. لطفاً دکمهٔ «ورود زندهٔ بهستان» را بزنید.',
      });
      return { ok: false, reason: 'session-expired', results };
    }

    // ── جامع دانشجو (F1825) — نمرات، معدل، واحدها، شهریه ──
    try {
      const totals = await fetchStudentTotals();
      if (totals?.error && isSessionError(totals.error)) {
        sessionDead = true;
      } else if (totals?.error) {
        results.errors.push(totals.error);
      } else if (totals) {
        results.courses = totals.courses?.length || 0;
        results.finance = Boolean(totals.finance);
        results.profile = Boolean(totals.profile);
        markSyncStatus('live', { phase: 'core', lastResults: results });
      }
    } catch (e) {
      console.warn('[sync] F1825 error:', e?.message || e);
      if (isSessionError(e?.message)) sessionDead = true;
      results.errors.push(`F1825: ${e?.message || e}`);
    }

    if (sessionDead) {
      invalidateSession();
      markSyncStatus('error', {
        lastResults: results,
        error: 'نشست بهستان به پایان رسیده است. لطفاً دکمهٔ «ورود زندهٔ بهستان» را بزنید.',
      });
      return { ok: false, reason: 'session-expired', results };
    }

    if (results.courses || results.schedule || results.finance || results.profile) {
      markSyncStatus('live', { phase: 'ready', lastResults: results });
      // ترم جاری را از دیتای تازه دوباره تشخیص بده
      currentTerm = detectCurrentTermId(getSnapshot()?.courses || []) || currentTerm;
    }

    // ── وضعیت دروس (فرم ۷۷) — فقط برای چارت/معدل، نه برنامه ──
    try {
      const r77 = await fetchViewReport('77', currentTerm);
      if (r77?.waitlistCount > 0) {
        addLocalNote(
          `لیست انتظار: ${r77.waitlistCount} درس (${r77.waitlistUnits} واحد)`,
          { title: 'در انتظار', color: 'warn' },
        );
      }
    } catch (e) {
      results.errors.push(`77: ${e?.message || e}`);
    }

    // ── تاریخچهٔ ترم‌ها ──
    const knownTerms = [
      ...new Set(
        (getSnapshot()?.courses || [])
          .map((c) => String(c?.termId || '').trim())
          .filter((t) => /^\d{4}$/.test(t)),
      ),
    ].sort().reverse();

    const historyTerms = [
      ...new Set([
        ...knownTerms.filter((t) => t !== currentTerm),
        ...getPrecedingTerms(currentTerm, 5),
        '4042',
        '4041',
        '4032',
      ]),
    ].slice(0, 6);

    // تاریخچه + وضعیت دروس
    for (const term of historyTerms) {
      try {
        const p = await fetchViewReport('78', term);
        if (p?.error && isSessionError(p.error)) break;
        if (p?.courses?.length) results.schedule += p.courses.length;
      } catch (e) {
        results.errors.push(`78/${term}: ${e?.message || e}`);
      }
    }

    // گزارش ۷۷ — وضعیت واقعی (ثبت‌نام / انتظار / حذف) ترم جاری
    // حذف شد تا برنامهٔ هفتگی مثل قبل بماند

    try {
      const ex = await fetchViewReport('428', currentTerm);
      if (ex?.exams?.length) results.exams += ex.exams.length;
    } catch {}

    try {
      await fetchViewReport('423', currentTerm);
    } catch {}

    // ── اعلان تغییرات نسبت به قبل ──
    const after = getSnapshot()?.courses || [];
    const notes = [];
    for (const c of after) {
      const key = `${c.termId}|${c.code}`;
      const prev = beforeMap.get(key);
      if (!prev) {
        if (c.termId === currentTerm && (c.onSchedule || c.isRegistration)) {
          notes.push(`درس جدید «${c.name}» به برنامه اضافه شد`);
        }
        continue;
      }
      if (prev.regStatus !== c.regStatus) {
        const label =
          c.regStatus === 'dropped'
            ? 'حذف اضطراری شد'
            : c.regStatus === 'waitlist'
              ? 'در انتظار قرار گرفت'
              : c.regStatus === 'registered'
                ? 'ثبت‌نام / روی برنامه شد'
                : c.regStatus;
        if (label) notes.push(`«${c.name}» ${label}`);
      }
      if (prev.grade !== c.grade && c.grade && c.grade !== 'ـ') {
        notes.push(`نمرهٔ «${c.name}» ثبت شد: ${c.grade}`);
      }
    }
    for (const prev of beforeCourses) {
      const key = prev.key;
      const now = after.find((c) => `${c.termId}|${c.code}` === key);
      if (!now && prev.regStatus === 'registered') {
        notes.push(`«${prev.name}» از برنامهٔ ترم جاری حذف شد`);
      }
    }
    if (notes.length > 0) {
      const summaryBody = notes.length === 1
        ? notes[0]
        : `تغییرات ثبت‌شده در ${notes.length} مورد:\n• ` + notes.slice(0, 10).join('\n• ');
      addLocalNote(summaryBody, { title: 'گزارش همگام‌سازی دروس', color: 'info' });
    }

    // ── فاز تکمیلی ──
    await delay(150);

    try {
      const wf = await fetchWorkflows();
      results.workflows = wf?.length || 0;
    } catch (e) {
      results.errors.push(`F6524: ${e?.message || e}`);
    }

    try {
      await fetchCurriculumStats();
      results.curriculum = true;
    } catch (e) {
      results.errors.push(`F1814: ${e?.message || e}`);
    }

    const anyData = results.courses || results.schedule || results.finance || results.profile;
    if (anyData) {
      // شمارهٔ دانشجویی واقعی (از گزارش ۸۸) را به نشست هم بنویس — جایگزین کد ملی (نام کاربری)
      try {
        const p = JSON.parse(localStorage.getItem('sarvestan_live_profile') || 'null');
        if (p?.studentId && p.studentId !== getStudentId()) {
          saveManualSession({ studentId: p.studentId });
        }
      } catch {}
      markSyncStatus('live', { lastResults: results, error: undefined });
    } else {
      let errText = results.errors[0] || 'پاسخ خالی از بهستان';
      if (results.errors.some((e) => isSessionError(e))) {
        invalidateSession();
        errText = 'نشست بهستان به پایان رسیده است. لطفاً دکمهٔ «ورود زندهٔ بهستان» را بزنید.';
      }
      markSyncStatus('error', { lastResults: results, error: errText });
    }

    return { ok: anyData, results };
  } catch (e) {
    console.warn('[sync] full error', e);
    markSyncStatus('error', { error: String(e?.message || e) });
    return { ok: false, reason: 'error', error: e };
  } finally {
    running = false;
    // اطمینان از اینکه UI از syncing بیرون می‌آید
    try {
      const st = JSON.parse(localStorage.getItem('sarvestan_live_sync_meta') || 'null');
      if (st?.status === 'syncing') markSyncStatus('idle');
    } catch {}
  }
}

export function isSyncing() {
  return running;
}
