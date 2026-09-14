/**
 * تبدیل دادهٔ زندهٔ بهستان به ViewModel مخصوص UI
 * بدون mock — اگر دیتای زنده نباشد، ساختار خالی/ایمن برمی‌گرداند
 */
import {
  hasLiveData,
  getSummary,
  getCurrentTermSchedule,
  getSnapshot,
  getTodayClasses,
  getLocalNotes,
} from '../services/behestan/store';
import { termIdToLabel, detectCurrentTermId } from '../services/behestan/parsers';
import { toFaDigits as faDigits } from '../utils/faDigits';

/** کل واحد مورد نیاز رشتهٔ مهندسی کامپیوتر (بر اساس دیتای کاربر) */
const DEFAULT_TOTAL_CREDITS = 142;

function faNum(n, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 'ـ';
  return x.toLocaleString('fa-IR', { maximumFractionDigits: digits });
}

function todayPersianDay() {
  const day = new Date().getDay();
  const map = { 6: 'شنبه', 0: 'یکشنبه', 1: 'دوشنبه', 2: 'سه‌شنبه', 3: 'چهارشنبه' };
  return map[day] || null;
}

function parseHour(raw) {
  if (!raw) return null;
  const m = String(raw).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
}

const EMPTY_WEEK = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'].map((day) => ({
  day,
  count: 0,
}));

const EMPTY_FINANCE = {
  balanceLabel: 'بدهی جاری',
  balance: '۰',
  currency: 'تومان',
  totalBillRial: 0,
  totalPaidRial: 0,
  debtToman: 0,
  isPaid: true,
  dateLabel: '',
  timeLabel: '',
  items: [],
};

const EMPTY_STUDENT = {
  fullName: '',
  studentId: '',
  college: '',
  major: '',
  level: '',
  term: '',
  greeting: 'سلام',
  photo: null,
};

const EMPTY_SUMMARY = {
  gpa: 'ـ',
  credits: '۰',
  unpaid: '۰',
  nextClassIn: '—',
};

const EMPTY_MATRIX = {
  days: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'],
  slots: [],
  cells: {},
};

function emptyViewModel() {
  return {
    live: false,
    student: EMPTY_STUDENT,
    summary: EMPTY_SUMMARY,
    todayClasses: [],
    week: EMPTY_WEEK,
    weekHours: 0,
    announcements: [],
    grades: [],
    finance: EMPTY_FINANCE,
    scheduleCourses: [],
    profile: null,
    termsData: [],
    curriculum: null,
    exams: [],
    nextClass: null,
    termLabel: '',
  };
}

export function getViewModel() {
  try {
    return buildViewModel();
  } catch (e) {
    console.warn('[viewModel]', e);
    return emptyViewModel();
  }
}

function buildViewModel() {
  if (!hasLiveData()) return emptyViewModel();

  const snap = getSnapshot();
  const sum = getSummary() || {};
  const profile = snap.profile || {};
  const day = todayPersianDay();
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const currentTerm = detectCurrentTermId(snap.courses || []) || '4051';

  const allCourses = getCurrentTermSchedule(currentTerm) || [];
  const todayCourses = day ? getTodayClasses(day) : [];

  const todayClasses = todayCourses.map((c, i) => {
    const start = parseHour(String(c.classTimeRaw || c.time || '').split('-')[0]);
    let status = 'later';
    if (start != null) {
      const endM = String(c.classTimeRaw || c.time || '').match(
        /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/,
      );
      let end = start + 1.5;
      if (endM) {
        const [eh, em] = endM[2].split(':').map(Number);
        end = eh + em / 60;
      }
      if (nowH >= start && nowH < end) status = 'now';
      else if (nowH < start && start - nowH < 1.5) status = 'next';
    }
    const tones = ['primary', 'info', 'secondary', 'success'];
    return {
      id: c.id || c.code || `c${i}`,
      title: c.name,
      code: c.code ? faDigits(c.code) : '',
      time: c.time || c.classTimeRaw || 'ـ',
      room: c.hall || 'ـ',
      professor: c.professor,
      units: c.units,
      status,
      color: tones[i % tones.length],
    };
  });

  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];
  const week = days.map((d) => ({
    day: d,
    count: allCourses.filter((c) => Array.isArray(c.days) && c.days.includes(d)).length,
  }));

  const rangeHours = (raw) => {
    const m = String(raw || '').match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
    if (!m) return 0;
    return (
      parseInt(m[3], 10) +
      parseInt(m[4], 10) / 60 -
      (parseInt(m[1], 10) + parseInt(m[2], 10) / 60)
    );
  };
  const weekHours = Math.round(
    allCourses.reduce((s, c) => {
      const h = rangeHours(c.classTimeRaw || c.time) || 1.5;
      const dayCount = Array.isArray(c.days) && c.days.length ? c.days.length : 1;
      return s + h * dayCount;
    }, 0),
  );

  const nextClass =
    todayClasses.find((c) => c.status === 'now') ||
    todayClasses.find((c) => c.status === 'next') ||
    todayClasses[0] ||
    null;

  const workflows = snap.workflows || snap.announcements || [];
  const localNotes = getLocalNotes().map((n) => ({
    id: n.id,
    title: n.title || 'تغییر جدید',
    body: n.body || '',
    color: n.color === 'warn' ? 'warn' : 'info',
    local: true,
  }));
  const announcements = [
    ...localNotes,
    ...workflows.slice(0, 4).map((w, i) => ({
      id: w.id || `a${i}`,
      title: w.title || 'درخواست آموزشی',
      body: w.body || w.status || '',
      color: i % 2 === 0 ? 'info' : 'warn',
    })),
  ].slice(0, 8);

  const latestT = (snap.transcripts || [])[(snap.transcripts || []).length - 1];
  const gradeCourses = latestT?.courses?.length
    ? latestT.courses
    : (snap.courses || []).filter((c) => c.grade).slice(0, 12);
  const grades = gradeCourses.map((c, i) => {
    const reg = String(c.regStatus || '');
    const isDropped = reg === 'dropped' || /حذف\s*اضطرار|حذف\s*شده/i.test(String(c.status || ''));
    const isWait = reg === 'waitlist' || /انتظار/i.test(String(c.status || ''));
    return {
      course: c.name,
      unit: c.units || 0,
      score: c.grade && c.grade !== 'ـ' ? faDigits(c.grade) : '—',
      status: isDropped ? 'حذف اضطراری' : isWait ? 'در انتظار' : c.grade && c.grade !== 'ـ' ? 'قطعی' : 'در حال',
      regStatus: reg || (isDropped ? 'dropped' : isWait ? 'waitlist' : c.grade ? 'passed' : 'enrolled'),
      color: isDropped
        ? 'danger'
        : isWait
          ? 'warn'
          : ['success', 'primary', 'info', 'warn'][i % 4],
    };
  });

  const fin = snap.finance;
  const termFin =
    fin?.termsSummary?.find((t) => t.termId === currentTerm) || fin?.termsSummary?.[0];
  const finance = {
    balanceLabel: 'بدهی جاری',
    balance: faNum(fin?.totalDebtToman ?? 0),
    currency: 'تومان',
    totalBillRial: termFin?.totalBillRial || 0,
    totalPaidRial: termFin?.totalPaidRial || 0,
    debtToman: fin?.totalDebtToman || 0,
    isPaid: (fin?.totalDebtRial || 0) === 0,
    dateLabel: new Date().toLocaleDateString('fa-IR'),
    timeLabel: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    items: (() => {
      const byTerm = new Map();
      for (const t of fin?.termsSummary || []) {
        const key = t.termId || t.termTitle || 'x';
        if (byTerm.has(key)) {
          const p = byTerm.get(key);
          for (const k of [
            'totalBillRial',
            'totalPaidRial',
            'debtRial',
            'fixedTuitionRial',
            'variableTuitionRial',
            'insuranceRial',
          ]) {
            p[k] = (p[k] || 0) + (t[k] || 0);
          }
          p.debtToman = Math.floor((p.debtRial || 0) / 10);
        } else {
          byTerm.set(key, { ...t });
        }
      }
      return [...byTerm.values()].slice(0, 6).map((t, i) => ({
        id: t.termId || `f${i}`,
        title: t.termTitle || `ترم ${t.termId}`,
        amount: faNum(t.debtToman || 0),
        status: (t.debtRial || 0) > 0 ? 'پرداخت‌نشده' : 'تسویه',
        color: (t.debtRial || 0) > 0 ? 'danger' : 'success',
        breakdown: [
          { label: 'شهریه ثابت', rial: t.fixedTuitionRial || 0 },
          { label: 'شهریه متغیر', rial: t.variableTuitionRial || 0 },
          { label: 'بیمه', rial: t.insuranceRial || 0 },
          { label: 'کل صورتحساب', rial: t.totalBillRial || 0 },
          { label: 'پرداختی', rial: t.totalPaidRial || 0 },
        ].filter((x) => x.rial > 0),
      }));
    })(),
  };

  const fullName = profile.fullName || '';

  // واحد اخذشدهٔ ترم جاری: فقط دروس ثبت‌شده — حذف اضطراری و در انتظار حساب نمی‌شوند
  const currentTermCourses = (snap.courses || []).filter((c) => {
    if (c.termId !== currentTerm && !c.isRegistration) return false;
    const st = courseState(c);
    return st === 'enrolled' || st === 'registered' || st === 'passed';
  });
  const f1825Units = currentTermCourses.reduce((s, c) => s + (parseNum(c.units) || 0), 0);
  const scheduleUnits = allCourses.reduce((s, c) => s + (parseNum(c.units) || 0), 0);
  const enrolledUnits = f1825Units > 0 ? f1825Units : scheduleUnits;

  const droppedCourses = (snap.courses || []).filter(
    (c) => c.termId === currentTerm && courseState(c) === 'dropped',
  );
  const waitlistCourses = (snap.courses || []).filter(
    (c) => c.termId === currentTerm && courseState(c) === 'waitlist',
  );

  return {
    live: true,
    student: {
      fullName,
      studentId: profile.studentId ? faDigits(profile.studentId) : '',
      college: profile.faculty || '',
      major: profile.major || '',
      level: profile.level || '',
      term: profile.term || '',
      greeting: fullName ? `سلام ${fullName.split(' ')[0]}` : 'سلام',
      photo: profile.photo || null,
    },
    summary: {
      gpa: sum.gpa && sum.gpa !== 'ـ' ? faDigits(sum.gpa) : 'ـ',
      credits: faNum(enrolledUnits || 0),
      unpaid: faNum(sum.unpaidRial != null ? sum.unpaid : 0),
      nextClassIn: nextClass?.time || '—',
      droppedCount: droppedCourses.length,
      waitlistCount: waitlistCourses.length,
    },
    droppedCourses: droppedCourses.map((c) => ({
      name: c.name,
      code: c.code,
      units: c.units || 0,
    })),
    waitlistCourses: waitlistCourses.map((c) => ({
      name: c.name,
      code: c.code,
      units: c.units || 0,
    })),
    weekHours,
    termLabel: termIdToLabel(currentTerm) || '',
    currentTerm,
    todayClasses,
    week,
    announcements,
    grades,
    finance,
    scheduleCourses: allCourses,
    profile,
    termsData: buildTermsFromLive(snap),
    curriculum: getCurriculumView(),
    exams: getExamsView(),
    nextClass:
      todayClasses.find((c) => c.status === 'next' || c.status === 'now') ||
      todayClasses[0] ||
      null,
  };
}

function parseNum(v) {
  if (typeof v === 'number') return v;
  const s = String(v || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeType(t) {
  const s = String(t || '').trim();
  if (!s || s === 'ـ') return 'سایر';
  if (/پایه|مقدماتی/i.test(s)) return 'پایه';
  if (/تخصصی الزامی/i.test(s)) return 'تخصصی الزامی';
  if (/تخصصی اختیاری|تخصصی انتخابی/i.test(s)) return 'تخصصی اختیاری';
  if (/تخصصی/i.test(s)) return 'تخصصی';
  if (/اصلی/i.test(s)) return 'اصلی';
  if (/عمومی/i.test(s)) return 'عمومی';
  if (/اختیاری/i.test(s)) return 'اختیاری';
  if (/کارورزی|کارآموزی|پروژه/i.test(s)) return 'پروژه';
  return s;
}

function courseState(c) {
  const reg = String(c.regStatus || '');
  if (reg === 'dropped') return 'dropped';
  if (reg === 'waitlist') return 'waitlist';
  const g = parseNum(c.grade);
  const st = String(c.status || '');
  if (g !== null && g >= 10) return 'passed';
  if (/حذف\s*اضطرار|حذف\s*شده|حذف\s*ايثار|حذف\s*ایثار/i.test(st)) return 'dropped';
  if (/انتظار|ليست\s*انتظار|لیست\s*انتظار/i.test(st)) return 'waitlist';
  if (/نپذیرفته|مشروط/i.test(st)) return 'failed';
  if (g !== null && g > 0) return 'failed';
  // روی برنامهٔ ثبت‌نام یا برچسب ثبت‌شده → در حال اخذ
  if (c.onSchedule || c.isRegistration || reg === 'registered') return 'enrolled';
  // ترم جاری بدون نمره و بدون وضعیت — enrolled (مثل قبل) مگر فرم ۷۷ چیز دیگری گفته باشد
  if (!c.grade && c.termId && (c.termId === '4051' || c.isRegistration)) return 'enrolled';
  return 'unknown';
}

/**
 * چارت و وضعیت دروس
 * - total: F1814 یا totalUnitsRequired یا حداقل max(known, 142)
 * - هرگز total از passed کمتر نمی‌شود
 */
export function getCurriculumView() {
  if (!hasLiveData()) return null;
  const snap = getSnapshot();
  const all = snap.courses || [];
  if (!all.length) return null;

  const byCode = new Map();
  for (const c of all) {
    if (!c?.code) continue;
    const prev = byCode.get(String(c.code));
    if (!prev || String(c.termId || '') >= String(prev.termId || '')) {
      byCode.set(String(c.code), {
        ...c,
        type: normalizeType(c.type),
        units: parseNum(c.units) || 0,
      });
    }
  }
  const list = [...byCode.values()];

  const colors = ['accent', 'primary', 'info', 'secondary', 'success', 'warn'];
  const groups = new Map();
  for (const c of list) {
    if (!groups.has(c.type)) groups.set(c.type, []);
    groups.get(c.type).push(c);
  }

  const categories = [...groups.entries()].map(([title, cs], i) => {
    const courses = cs.map((c) => ({
      name: c.name,
      unit: c.units,
      status: courseState(c),
      grade:
        courseState(c) === 'passed' && c.grade && c.grade !== 'ـ'
          ? faDigits(String(c.grade))
          : 'جاری',
    }));
    return {
      id: `t${i}`,
      title,
      color: colors[i % colors.length],
      passed: courses
        .filter((x) => x.status === 'passed')
        .reduce((s, x) => s + (x.unit || 0), 0),
      // واحد چارت: دروس حذف/انتظار را در «کل» نیاور — فقط ثبت‌شده + پاس‌شده + مانده از قبل
      total: cs
        .filter((c) => {
          const st = courseState(c);
          return st !== 'dropped' && st !== 'waitlist';
        })
        .reduce((s, c) => s + (c.units || 0), 0),
      courses: courses.map((x, xi) => ({
        ...x,
        badge:
          x.status === 'dropped'
            ? 'حذف اضطراری'
            : x.status === 'waitlist'
              ? 'در انتظار'
              : x.status === 'enrolled'
                ? 'در حال اخذ'
                : x.status === 'passed'
                  ? 'پاس شده'
                  : x.status === 'failed'
                    ? 'مردود'
                    : '',
      })),
    };
  });

  const passedCredits =
    Number(snap.profile?.totalUnitsPassed) ||
    categories.reduce((s, c) => s + c.passed, 0);

  const currentTerm = detectCurrentTermId(all) || '4051';

  // واحد اخذشدهٔ ترم جاری: فقط enrolled — حذف و انتظار حساب نمی‌شوند
  const enrolledCredits = list
    .filter((c) => {
      if (c.termId !== currentTerm && !c.isRegistration) return false;
      const st = courseState(c);
      return st === 'enrolled';
    })
    .reduce((s, c) => s + (c.units || 0), 0);

  // F1814 byType ممکن است فقط واحدهای «اخذشده» باشد (≈passed) نه کل چارت
  // پس statsTotal کوچک را به‌عنوان کل چارت قبول نکن
  const statsTotal = (snap.curriculumStats?.byType || []).reduce(
    (s, x) => s + (Number(x.units) || parseNum(x.units) || 0),
    0,
  );
  const knownTotal = categories.reduce((s, c) => s + c.total, 0);
  const required = Number(snap.profile?.totalUnitsRequired) || 0;

  // کل چارت: حداقل ۱۴۲ (مهندسی کامپیوتر) یا required/F1814 اگر واقعاً کل هستند
  const CHART_MIN = DEFAULT_TOTAL_CREDITS; // 142
  let totalCredits = Math.max(CHART_MIN, passedCredits + enrolledCredits, knownTotal);
  if (required >= CHART_MIN && required >= passedCredits) {
    totalCredits = required;
  } else if (statsTotal >= CHART_MIN && statsTotal >= passedCredits) {
    totalCredits = statsTotal;
  }

  // هرگز total از passed+enrolled کمتر نشود
  if (totalCredits < passedCredits + enrolledCredits) {
    totalCredits = Math.max(CHART_MIN, passedCredits + enrolledCredits);
  }

  const remainingCredits = Math.max(0, totalCredits - passedCredits - enrolledCredits);

  return {
    passedCredits,
    enrolledCredits,
    totalCredits,
    remainingCredits,
    categories,
  };
}

function buildTermsFromLive(snap) {
  const courses = snap.courses || [];
  const byTerm = new Map();
  for (const c of courses) {
    const tid = c.termId || 'unknown';
    if (!byTerm.has(tid)) byTerm.set(tid, []);
    byTerm.get(tid).push(c);
  }
  const termIds = [...byTerm.keys()].sort().reverse();
  if (!termIds.length) return [];

  return termIds.map((tid, ti) => {
    const list = byTerm.get(tid);
    const scored = list.filter((c) => c.grade && c.grade !== 'ـ');
    const gpa =
      scored.length > 0
        ? (
            scored.reduce((s, c) => s + (parseNum(c.grade) || 0) * (c.units || 1), 0) /
            scored.reduce((s, c) => s + (c.units || 1), 0)
          ).toFixed(2)
        : 'ـ';
    return {
      id: tid,
      name: termIdToLabel(tid) || `ترم ${faDigits(tid)}`,
      shortName: termIdToLabel(tid) || `ترم ${faDigits(tid)}`,
      gpa: faDigits(gpa),
      totalUnits: list.reduce((s, c) => s + (c.units || 0), 0),
      passedUnits: scored.reduce((s, c) => s + (c.units || 0), 0),
      status: ti === 0 ? 'در حال ثبت نمرات' : 'تایید نهایی',
      courses: list.map((c, i) => {
        const raw = c.grade && c.grade !== 'ـ' ? parseNum(c.grade) : null;
        return {
          id: c.code || `c${i}`,
          code: c.code ? faDigits(c.code) : String(i + 1),
          course: c.name,
          unit: c.units || 0,
          score: raw,
          displayScore: raw != null ? faDigits(raw.toFixed(2)) : '—',
          status: c.grade && c.grade !== 'ـ' ? 'قطعی' : 'در حال',
          color: ['success', 'primary', 'info', 'warn'][i % 4],
        };
      }),
    };
  });
}

function parseRange(raw) {
  const m = String(raw || '').match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return {
    start: parseInt(m[1], 10) * 60 + parseInt(m[2], 10),
    end: parseInt(m[3], 10) * 60 + parseInt(m[4], 10),
  };
}

function fmtSlot(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

function courseSlots(c) {
  if (Array.isArray(c.daySlots) && c.daySlots.length) return c.daySlots;
  if (Array.isArray(c.days) && c.days.length) {
    return c.days.map((d) => ({
      day: d,
      time: c.time || c.classTimeRaw || '',
      hall: c.hall || 'ـ',
    }));
  }
  return [];
}

export function getScheduleMatrix() {
  if (!hasLiveData()) return EMPTY_MATRIX;
  const courses = getCurrentTermSchedule('4051');
  if (!courses.length) return EMPTY_MATRIX;

  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];
  const tones = ['primary', 'info', 'success', 'secondary', 'accent', 'warn', 'danger'];

  const ranges = [];
  for (const c of courses) {
    for (const s of courseSlots(c)) {
      const r = parseRange(s.time);
      if (!r) continue;
      const near = ranges.find((x) => Math.abs(x.start - r.start) <= 15);
      if (near) near.end = Math.max(near.end, r.end);
      else ranges.push({ start: r.start, end: r.end });
    }
  }
  if (!ranges.length) return EMPTY_MATRIX;
  ranges.sort((a, b) => a.start - b.start);
  const slots = ranges.map((r) => `${fmtSlot(r.start)}–${fmtSlot(r.end)}`);

  const cells = {};
  courses.forEach((c, ci) => {
    for (const s of courseSlots(c)) {
      const di = days.indexOf(s.day);
      if (di < 0) continue;
      const r = parseRange(s.time);
      let si = ranges.findIndex((x) => r && r.start >= x.start - 1 && r.start < x.end - 1);
      if (si < 0) si = 0;
      const key = `${si}-${di}`;
      const cell = {
        title: c.name,
        room: s.hall || 'ـ',
        professor: c.professor || 'ـ',
        time: s.time,
        color: tones[ci % tones.length],
      };
      if (cells[key] && cells[key].title !== cell.title) {
        cells[key] = { ...cell, title: `${cells[key].title} · ${cell.title}` };
      } else {
        cells[key] = cell;
      }
    }
  });

  return { days, slots, cells };
}

let _persianFmt = null;
function persianFmt() {
  if (!_persianFmt) {
    try {
      _persianFmt = new Intl.DateTimeFormat('en-u-ca-persian', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'Asia/Tehran',
      });
    } catch {
      _persianFmt = null;
    }
  }
  return _persianFmt;
}

function gregToPersianParts(gy, gm, gd) {
  const fmt = persianFmt();
  if (!fmt) return null;
  try {
    const p = fmt.formatToParts(new Date(Date.UTC(gy, gm - 1, gd, 12)));
    const get = (k) => Number(p.find((x) => x.type === k)?.value || 0);
    if (!get('year')) return null;
    return [get('year'), get('month'), get('day')];
  } catch {
    return null;
  }
}

function jalaliToDate(jy, jm, jd) {
  const gyBase = jy + (jm >= 7 ? 622 : 621);
  const probe = (dayOfYear) => {
    const t = new Date(Date.UTC(gyBase, 0, 1, 12) + (dayOfYear - 1) * 86400000);
    return gregToPersianParts(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  };
  const cmpParts = (a, b) =>
    a[0] !== b[0] ? a[0] - b[0] : a[1] !== b[1] ? a[1] - b[1] : a[2] - b[2];
  let lo = 1;
  let hi = 370;
  let iter = 0;
  while (lo <= hi && iter < 24) {
    iter++;
    const mid = (lo + hi) >> 1;
    const parts = probe(mid);
    if (!parts) return null;
    const cmp = cmpParts(parts, [jy, jm, jd]);
    if (cmp > 0) hi = mid - 1;
    else if (cmp < 0) lo = mid + 1;
    else {
      const t = new Date(Date.UTC(gyBase, 0, 1, 12) + (mid - 1) * 86400000);
      return new Date(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
    }
  }
  return null;
}

function toLatinDigits(s) {
  return String(s || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function getExamsView() {
  try {
    if (!hasLiveData()) return [];
    const snap = getSnapshot();
    const examsMap = snap.exams || {};
    const list =
      (Array.isArray(examsMap['4051']) && examsMap['4051'].length ? examsMap['4051'] : null) ||
      (Array.isArray(examsMap['4042']) && examsMap['4042'].length ? examsMap['4042'] : null) ||
      Object.values(examsMap)
        .filter((x) => Array.isArray(x))
        .flat();
    if (!Array.isArray(list) || !list.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return list
      .filter((e) => e && typeof e === 'object')
      .map((e) => {
        const latin = toLatinDigits(e.examDate || '');
        const dm = latin.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
        let daysLeft = null;
        if (dm) {
          const d = jalaliToDate(parseInt(dm[1], 10), parseInt(dm[2], 10), parseInt(dm[3], 10));
          if (d && !isNaN(d)) daysLeft = Math.round((d - today) / 86400000);
        }
        return {
          id: e.id || e.code || Math.random(),
          course: e.name || e.course || '',
          code: e.code ? faDigits(e.code) : '',
          unit: e.units || e.unit || 0,
          instructor: e.professor || e.instructor || 'ـ',
          day: e.day || '',
          examDate: e.examDate || 'ـ',
          examTime: e.examTime || 'ـ',
          room: e.hall || e.room || 'ـ',
          seat: '—',
          daysLeft: daysLeft ?? 0,
          color:
            daysLeft != null && daysLeft <= 3
              ? 'danger'
              : daysLeft != null && daysLeft <= 7
                ? 'warn'
                : 'primary',
        };
      })
      .filter((e) => e.course)
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  } catch (e) {
    console.warn('[getExamsView]', e);
    return [];
  }
}
