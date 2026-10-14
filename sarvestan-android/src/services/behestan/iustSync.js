/**
 * سنک داده‌های گلستان ۱.۰ علم و صنعت
 * بهستان ۲.۰ (.svc) روی این سامانه وجود ندارد؛ همه‌چیز از PostBack وب‌فرم می‌آید.
 */

import {
  fetchStudentInfo,
  fetchFinance,
  runReport,
  tableToCourses,
  tableToExams,
  openForm,
} from './golestan1';
import {
  updatePart,
  setScheduleForTerm,
  setExamsForTerm,
  mergeCourses,
  markSyncStatus,
  getSnapshot,
} from './store';
import { getStudentId, saveManualSession } from './session';
import { detectCurrentTermId } from './parsers';

function mergeProfile(partial) {
  let prev = null;
  try {
    prev = JSON.parse(localStorage.getItem('sarvestan_live_profile') || 'null');
  } catch {}
  const clean = {};
  for (const [k, v] of Object.entries(partial || {})) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v;
  }
  updatePart({ profile: { ...(prev || {}), ...clean, isLoggedIn: true } });
}

function isSessionProblem(msg) {
  return /VIEWSTATE|منقض|نشست|403|End Session|again|مجدد/i.test(String(msg || ''));
}

/** باز کردن منوی میزکار (0;11130) تا وضعیت و بلیط نشست تازه شود */
async function bootstrapTicket() {
  const state = await openForm('0;11130');
  if (state.page.ticket) {
    saveManualSession({ ticket: state.page.ticket, userId: state.page.uid || undefined });
  }
  return state;
}

export async function runIustSync() {
  const results = {
    schedule: 0,
    exams: 0,
    courses: 0,
    finance: false,
    profile: false,
    errors: [],
  };

  markSyncStatus('syncing', { error: undefined });

  try {
    await bootstrapTicket();
  } catch (e) {
    const msg = e?.message || String(e);
    results.errors.push(`menu: ${msg}`);
    if (isSessionProblem(msg)) {
      markSyncStatus('error', {
        lastResults: results,
        error: 'نشست گلستان علم و صنعت معتبر نیست. دوباره وارد شوید.',
      });
      return { ok: false, reason: 'session-expired', results };
    }
  }

  // ── پروفایل (F0546 / 0;10190) ──
  try {
    const info = await fetchStudentInfo();
    if (info?.fullName || info?.faculty || info?.major || info?.studentId) {
      mergeProfile({
        fullName: info.fullName,
        faculty: info.faculty,
        major: info.major,
        level: info.level,
        gpa: info.gpa,
        studentId: info.studentId || getStudentId() || undefined,
        nationalId: info.nationalCode || undefined,
      });
      if (info.studentId) {
        saveManualSession({ studentId: info.studentId });
      }
      results.profile = true;
      markSyncStatus('live', { phase: 'profile', lastResults: results });
    }
  } catch (e) {
    results.errors.push(`info: ${e?.message || e}`);
  }

  // ── گزارش‌های دروس (۸۸ نتیجه ثبت‌نام، ۷۸ برنامه هفتگی) ──
  const snapTerm = detectCurrentTermId(getSnapshot()?.courses || []);
  let currentTerm = snapTerm || '';

  for (const id of ['88', '78']) {
    try {
      const rep = await runReport(id, { term: currentTerm || null });
      const termId = rep.termId || currentTerm || '';
      const courses = tableToCourses(rep.tables, termId);
      if (courses.length) {
        if (id === '78') setScheduleForTerm(termId, courses, 'iust-78');
        else setScheduleForTerm(termId, courses, 'iust-88');
        mergeCourses(courses);
        results.schedule += courses.length;
        results.courses += courses.length;
        currentTerm = termId || currentTerm;
        markSyncStatus('live', { phase: `report-${id}`, lastResults: results });
      }
    } catch (e) {
      results.errors.push(`${id}: ${e?.message || e}`);
    }
  }

  // ── کارت امتحانات (۴۲۸) ──
  try {
    const rep = await runReport('428', { term: currentTerm || null });
    const exams = tableToExams(rep.tables, rep.termId || currentTerm);
    if (exams.length) {
      setExamsForTerm(rep.termId || currentTerm, exams);
      results.exams += exams.length;
    }
  } catch (e) {
    results.errors.push(`428: ${e?.message || e}`);
  }

  // ── مالی (F1312 / 0;15450) ──
  try {
    const fin = await fetchFinance();
    if (fin.finance) {
      updatePart({ finance: fin.finance });
      results.finance = true;
    }
  } catch (e) {
    results.errors.push(`finance: ${e?.message || e}`);
  }

  const anyData = results.schedule || results.courses || results.finance || results.profile;
  if (anyData) {
    markSyncStatus('live', { lastResults: results, error: undefined });
  } else {
    markSyncStatus('idle', {
      lastResults: results,
      error: results.errors[0] || 'پاسخی از گلستان علم و صنعت دریافت نشد',
    });
  }
  return { ok: Boolean(anyData), results };
}
