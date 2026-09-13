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
import { isSessionAlive, saveManualSession, getStudentId } from './session';

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
  return /نشست|session|50216|کاری شما به پایان/i.test(String(text || ''));
}

export async function runFullSync({ force = false } = {}) {
  if (running) return { ok: false, reason: 'already-running' };
  if (!force && Date.now() - lastRunAt < COOLDOWN_MS) {
    return { ok: false, reason: 'cooldown' };
  }
  if (!canSync() || !isSessionAlive()) {
    markSyncStatus('no-session');
    return { ok: false, reason: 'no-session' };
  }

  running = true;
  lastRunAt = Date.now();
  markSyncStatus('syncing');

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
    // ── گام اول: گزارش ۸۸ (ثبت‌نام) — مثل افزونهٔ قدیم ──
    let currentTerm = detectCurrentTermId(getSnapshot()?.courses || []) || '4051';
    let sessionDead = false;
    try {
      const probe = await fetchRegistration88(currentTerm);
      if (probe?.error && isSessionError(probe.error)) {
        sessionDead = true;
        results.errors.push(probe.error);
      } else if (probe?.courses?.length) {
        results.schedule += probe.courses.length;
        markSyncStatus('live', { phase: 'registration', lastResults: results });
      } else if (probe?.error) {
        results.errors.push(`۸۸: ${probe.error}`);
      }
    } catch (e) {
      results.errors.push(`۸۸: ${e?.message || e}`);
      if (isSessionError(e?.message)) sessionDead = true;
    }

    if (sessionDead) {
      markSyncStatus('error', {
        lastResults: results,
        error: 'نشست بهستان به پایان رسیده. دوباره وارد شو و کلیدهای تازه را بگذار.',
      });
      return { ok: false, reason: 'session-expired', results };
    }

    // ── جامع دانشجو (اگر studentId باشد) ──
    try {
      const totals = await fetchStudentTotals();
      if (totals?.error && isSessionError(totals.error)) {
        markSyncStatus('error', {
          lastResults: results,
          error: totals.error,
        });
        return { ok: false, reason: 'session-expired', results };
      }
      if (totals?.error) {
        results.errors.push(totals.error);
      } else if (totals) {
        results.courses = totals.courses?.length || 0;
        results.finance = Boolean(totals.finance);
        results.profile = Boolean(totals.profile);
        markSyncStatus('live', { phase: 'core', lastResults: results });
      }
    } catch (e) {
      results.errors.push(`F1825: ${e?.message || e}`);
    }

    if (results.courses || results.schedule || results.finance) {
      markSyncStatus('live', { phase: 'ready', lastResults: results });
      // ترم جاری را از دیتای تازه دوباره تشخیص بده
      currentTerm = detectCurrentTermId(getSnapshot()?.courses || []) || currentTerm;
    }

    // ── تاریخچهٔ ترم‌ها: از termId های موجود + چند ترم قبلی (بدون هاردکد تابستان) ──
    const knownTerms = [
      ...new Set(
        (getSnapshot()?.courses || [])
          .map((c) => String(c?.termId || '').trim())
          .filter((t) => /^\d{4}$/.test(t)),
      ),
    ].sort().reverse();

    // ترم‌های محتمل قبلی: کم کردن ۱ از شمارهٔ ترم (1←2 سال قبل، 2←1، 3 و 4 تابستان)
    const extraTerms = [];
    const base = parseInt(currentTerm, 10);
    if (Number.isFinite(base)) {
      for (const delta of [1, 10, 11, 20, 21]) {
        const t = String(base - delta);
        if (/^\d{4}$/.test(t)) extraTerms.push(t);
      }
    }
    const historyTerms = [
      ...new Set([...knownTerms.filter((t) => t !== currentTerm), ...extraTerms]),
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
    notes.slice(0, 8).forEach((n) => addLocalNote(n, { title: 'تغییر پس از همگام‌سازی' }));

    // ── فاز تکمیلی ──
    await delay(150);

    try {
      await fetchPersonal();
    } catch (e) {
      results.errors.push(`F1809: ${e?.message || e}`);
    }

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
      const errText =
        results.errors.find((e) => isSessionError(e)) ||
        results.errors[0] ||
        'پاسخ خالی از بهستان';
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
