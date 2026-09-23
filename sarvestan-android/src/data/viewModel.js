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
} from '../services/behestan/store.js';
import { termIdToLabel, detectCurrentTermId } from '../services/behestan/parsers.js';
import { toFaDigits as faDigits } from '../utils/faDigits.js';

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

const JS_DAY_TO_PERSIAN = {
  6: 'شنبه',
  0: 'یکشنبه',
  1: 'دوشنبه',
  2: 'سه‌شنبه',
  3: 'چهارشنبه',
  4: 'پنجشنبه',
  5: 'جمعه',
};

export function getPersianDayForOffset(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return JS_DAY_TO_PERSIAN[d.getDay()] || null;
}

export const COURSE_TONES = ['primary', 'info', 'success', 'secondary', 'accent', 'warn', 'danger'];

function cleanCourseCode(code) {
  if (!code) return '';
  return String(code)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/_\d+$/, '')
    .replace(/\s+/g, '')
    .trim();
}

function cleanCourseName(name) {
  if (!name) return '';
  return String(name)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧۸۹'.indexOf(d)))
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/‌/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getToneForCourse(courseOrNameOrCode, allCourses = []) {
  if (!courseOrNameOrCode) return COURSE_TONES[0];
  const raw = typeof courseOrNameOrCode === 'object' ? courseOrNameOrCode : { name: courseOrNameOrCode };
  const cCode = cleanCourseCode(raw.code);
  const cName = cleanCourseName(raw.name || raw.course || raw.title || '');

  // تطبیق با ترتیب دروس ترم جاری تا رنگ درس در تمام بخش‌ها (جدول هفتگی، نمای روزانه، امتحانات) کاملاً یکسان باشد
  if (Array.isArray(allCourses) && allCourses.length > 0) {
    const idx = allCourses.findIndex((sc) => {
      const scCode = cleanCourseCode(sc.code);
      const scName = cleanCourseName(sc.name || sc.course || sc.title || '');
      if (cCode && scCode && cCode === scCode) return true;
      if (cName && scName && (cName === scName || cName.includes(scName) || scName.includes(cName))) return true;
      return false;
    });
    if (idx >= 0) {
      return COURSE_TONES[idx % COURSE_TONES.length];
    }
  }

  const s = cCode || cName || String(courseOrNameOrCode);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return COURSE_TONES[Math.abs(hash) % COURSE_TONES.length];
}

export function getCourseTone(nameOrCode, fallbackIndex = 0) {
  return getToneForCourse(nameOrCode);
}

export function parseClassTime(raw) {
  if (!raw) return { startHour: null, endHour: null };
  const s = String(raw)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const matches = [...s.matchAll(/(\d{1,2}):(\d{2})/g)];
  if (!matches.length) return { startHour: null, endHour: null };
  const h1 = parseInt(matches[0][1], 10) + parseInt(matches[0][2], 10) / 60;
  if (matches.length === 1) {
    return { startHour: h1, endHour: h1 + 1.5 };
  }
  const h2 = parseInt(matches[1][1], 10) + parseInt(matches[1][2], 10) / 60;
  return {
    startHour: Math.min(h1, h2),
    endHour: Math.max(h1, h2),
  };
}

function parseHour(raw) {
  if (!raw) return null;
  const s = String(raw)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const m = s.match(/(\d{1,2}):(\d{2})/);
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
    localNotes: [],
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

  // مرتب‌سازی صعودی کلاس‌های امروز بر اساس ساعت شروع (از صبح تا عصر)
  todayCourses.sort((a, b) => {
    const ta = parseClassTime(a.time || a.classTimeRaw).startHour ?? 999;
    const tb = parseClassTime(b.time || b.classTimeRaw).startHour ?? 999;
    return ta - tb;
  });

  let foundUpcoming = false;
  const todayClasses = todayCourses.map((c, i) => {
    const { startHour, endHour } = parseClassTime(c.time || c.classTimeRaw);
    let status = 'later';
    if (startHour != null && endHour != null) {
      if (nowH >= endHour) {
        status = 'done'; // کلاس پایان یافته
      } else if (nowH >= startHour && nowH < endHour) {
        status = 'now'; // کلاس در جریان است
      } else if (nowH < startHour) {
        if (!foundUpcoming) {
          status = 'next'; // اولین کلاس پیش‌روی امروز
          foundUpcoming = true;
        } else {
          status = 'later'; // کلاس‌های بعدی امروز
        }
      }
    }
    return {
      id: c.id || c.code || `c${i}`,
      title: c.name,
      code: c.code ? faDigits(c.code) : '',
      time: c.time || c.classTimeRaw || 'ـ',
      room: c.hall ? faDigits(c.hall) : 'ـ',
      professor: c.professor,
      units: c.units,
      status,
      startHour,
      endHour,
      color: getToneForCourse(c, allCourses),
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

  let nextClass =
    todayClasses.find((c) => c.status === 'now') ||
    todayClasses.find((c) => c.status === 'next') ||
    null;

  // اگر هیچ کلاسی برای ادامه امروز نمانده باشد، روزهای آینده را بررسی می‌کنیم تا واقعاً کلاس بعدی نمایش داده شود
  if (!nextClass) {
    for (let offset = 1; offset <= 7; offset++) {
      const targetDay = getPersianDayForOffset(offset);
      if (!targetDay) continue;
      const upcomingCourses = getTodayClasses(targetDay) || [];
      if (!upcomingCourses.length) continue;

      const sortedUpcoming = [...upcomingCourses].sort((a, b) => {
        const ta = parseClassTime(a.time || a.classTimeRaw).startHour ?? 999;
        const tb = parseClassTime(b.time || b.classTimeRaw).startHour ?? 999;
        return ta - tb;
      });

      const first = sortedUpcoming[0];
      const { startHour, endHour } = parseClassTime(first.time || first.classTimeRaw);
      const dayLabel = offset === 1 ? 'فردا' : (offset === 2 ? 'پس‌فردا' : targetDay);
      nextClass = {
        id: first.id || first.code || `upcoming_${offset}`,
        title: first.name,
        code: first.code ? faDigits(first.code) : '',
        time: first.time || first.classTimeRaw || 'ـ',
        room: first.hall ? faDigits(first.hall) : 'ـ',
        professor: first.professor,
        units: first.units,
        status: 'upcoming',
        startHour,
        endHour,
        color: getToneForCourse(first, allCourses),
        isUpcomingDay: true,
        offsetDays: offset,
        dayLabel,
      };
      break;
    }
  }

  const workflows = snap.workflows || snap.announcements || [];
  const localNotes = getLocalNotes().map((n) => ({
    id: n.id,
    title: n.title || 'گزارش همگام‌سازی',
    body: n.body || '',
    color: n.color === 'warn' ? 'warn' : 'info',
    at: n.at,
    local: true,
  }));
  // اعلانات رسمی آموزشی فقط شامل درخواست‌ها و اطلاعیه‌های دانشگاهی، بدون پیام‌های سیستمی همگام‌سازی
  const announcements = workflows.slice(0, 6).map((w, i) => ({
    id: w.id || `a${i}`,
    title: w.title || 'درخواست آموزشی',
    body: w.body || w.status || '',
    color: i % 2 === 0 ? 'info' : 'warn',
  }));

  // آخرین ترم دارای نمره یا کل دروس نمره‌دار (تا در استوری یا کارت‌ها، ترم خالی جاری نمایش داده نشود)
  const termsWithGrades = (snap.transcripts || []).filter(
    (t) => Array.isArray(t.courses) && t.courses.some((c) => c.grade && c.grade !== 'ـ' && c.grade !== '-'),
  );
  const latestGradedTerm = termsWithGrades.length ? termsWithGrades[termsWithGrades.length - 1] : null;
  const gradeCourses = latestGradedTerm?.courses?.length
    ? latestGradedTerm.courses
    : (snap.courses || []).filter((c) => c.grade && c.grade !== 'ـ' && c.grade !== '-').slice(0, 12);
  const grades = gradeCourses.map((c, i) => {
    const reg = String(c.regStatus || '');
    const isDropped = reg === 'dropped' || /حذف\s*اضطرار|حذف\s*شده/i.test(String(c.status || ''));
    const isWait = reg === 'waitlist' || /انتظار/i.test(String(c.status || ''));
    return {
      course: c.name,
      unit: c.units || 0,
      score: isDropped ? 'حذف' : isWait ? 'انتظار' : c.grade && c.grade !== 'ـ' ? faDigits(c.grade) : '—',
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
      return [...byTerm.values()].slice(0, 6).map((t, i) => {
        const bill = Number(t.totalBillRial) || 0;
        const paid = Number(t.totalPaidRial) || 0;
        // اگر پرداختی با صورت‌حساب برابر یا بیشتر باشد یا بدهی صفر باشد، قطعاً تسویه شده است
        const isSettled = (bill > 0 && paid >= bill) || (Number(t.debtRial) || 0) <= 0 || t.status === 'تسویه کامل';
        const calculatedDebtRial = bill > paid ? bill - paid : 0;
        const debtToman = isSettled
          ? 0
          : Math.floor((calculatedDebtRial > 0 ? calculatedDebtRial : (Number(t.debtRial) || 0)) / 10);
        const termName = termIdToLabel(t.termId);
        return {
          id: t.termId || `f${i}`,
          title: termName ? `${termName} (${faDigits(t.termId)})` : t.termTitle || `ترم ${faDigits(t.termId)}`,
          amount: isSettled ? '۰' : faNum(debtToman),
          status: isSettled ? 'تسویه کامل' : 'پرداخت‌نشده',
          color: isSettled ? 'success' : 'danger',
          breakdown: [
            { label: 'شهریه ثابت', rial: t.fixedTuitionRial || 0 },
            { label: 'شهریه متغیر', rial: t.variableTuitionRial || 0 },
            { label: 'بیمه', rial: t.insuranceRial || 0 },
            { label: 'کل صورتحساب', rial: t.totalBillRial || 0 },
            { label: 'پرداختی', rial: t.totalPaidRial || 0 },
          ].filter((x) => x.rial > 0),
        };
      });
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
      unpaidRial: sum.unpaidRial || 0,
      debtToman: fin?.totalDebtToman ?? (sum.unpaidRial ? Math.floor(sum.unpaidRial / 10) : 0),
      isPaid: (sum.unpaidRial || 0) <= 0 || (fin?.totalDebtRial || 0) <= 0,
      nextClassIn: nextClass?.isUpcomingDay
        ? `${nextClass.dayLabel} ${nextClass.time}`
        : nextClass?.time || '—',
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
    localNotes,
    grades,
    finance,
    scheduleCourses: allCourses,
    profile,
    termsData: buildTermsFromLive(snap),
    curriculum: getCurriculumView(),
    exams: getExamsView(),
    nextClass,
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
  const st = String(c.status || '');
  const gm = String(c.gradeMode || '');
  const rt = String(c.regType || '');
  if (/حذف\s*اضطرار|حذف\s*شده|حذف\s*ايثار|حذف\s*ایثار/i.test(`${st} ${reg} ${gm}`)) return 'dropped';
  if (/انتظار|ليست\s*انتظار|لیست\s*انتظار/i.test(`${st} ${reg} ${rt}`)) return 'waitlist';
  const g = parseNum(c.grade);
  if (g !== null && g >= 10) return 'passed';
  if (/نپذیرفته|مشروط/i.test(st)) return 'failed';
  if (g !== null && g > 0) return 'failed';
  // روی برنامهٔ ثبت‌نام یا برچسب ثبت‌شده → در حال اخذ
  if (c.onSchedule || c.isRegistration || reg === 'registered') return 'enrolled';
  // ترم جاری بدون نمره و بدون وضعیت — enrolled (مثل قبل) مگر فرم ۷۷ یا F1825 چیز دیگری گفته باشد
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

  const calcPassed = categories.reduce((s, c) => s + c.passed, 0);
  const profilePassed = Number(snap.profile?.totalUnitsPassed) || 0;
  // اولویت با واحدهای محاسبه‌شدهٔ کارنامه چارت بدون دروس حذف و انتظار؛ در غیر این صورت مقدار رسمی پروفایل
  const passedCredits = calcPassed > 0 ? calcPassed : profilePassed;

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
  const transMap = new Map((snap.transcripts || []).map((t) => [String(t.termId), t]));
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
    const tr = transMap.get(String(tid));
    const scored = list.filter((c) => {
      const st = courseState(c);
      return st === 'passed' || (c.grade && c.grade !== 'ـ' && c.grade !== '-');
    });
    const gpa =
      tr?.termGpa && tr.termGpa !== 'ـ'
        ? tr.termGpa
        : scored.length > 0
          ? (
              scored.reduce((s, c) => s + (parseNum(c.grade) || 0) * (c.units || 1), 0) /
              scored.reduce((s, c) => s + (c.units || 1), 0)
            ).toFixed(2)
          : 'ـ';

    const passedUnits =
      tr?.passedUnits != null
        ? tr.passedUnits
        : scored.reduce((s, c) => s + (c.units || 0), 0);

    const totalUnits =
      tr?.registeredUnits != null
        ? tr.registeredUnits
        : list
            .filter((c) => courseState(c) !== 'dropped' && courseState(c) !== 'waitlist')
            .reduce((s, c) => s + (c.units || 0), 0);

    return {
      id: tid,
      name: termIdToLabel(tid) || `ترم ${faDigits(tid)}`,
      shortName: termIdToLabel(tid) || `ترم ${faDigits(tid)}`,
      gpa: faDigits(gpa),
      totalUnits,
      passedUnits,
      droppedUnits:
        tr?.droppedUnits != null
          ? tr.droppedUnits
          : list.filter((c) => courseState(c) === 'dropped').reduce((s, c) => s + (c.units || 0), 0),
      status: ti === 0 ? 'در حال ثبت نمرات' : 'تایید نهایی',
      courses: list.map((c, i) => {
        const raw = c.grade && c.grade !== 'ـ' && c.grade !== '-' ? parseNum(c.grade) : null;
        const st = courseState(c);
        let status = 'در حال';
        let displayScore = '—';
        let color = 'warn';

        if (st === 'dropped') {
          status = 'حذف اضطراری';
          displayScore = 'حذف';
          color = 'danger';
        } else if (st === 'waitlist') {
          status = 'در انتظار';
          displayScore = 'انتظار';
          color = 'warn';
        } else if (raw != null) {
          status = 'قطعی';
          displayScore = faDigits(raw.toFixed(2));
          color = raw >= 10 ? 'success' : 'danger';
        } else if (c.status === 'قبول' || st === 'passed') {
          status = 'قطعی';
          displayScore = 'قبول';
          color = 'success';
        } else if (c.status === 'مردود' || st === 'failed') {
          status = 'قطعی';
          displayScore = 'مردود';
          color = 'danger';
        }

        return {
          id: c.code || `c${i}`,
          code: c.code ? faDigits(c.code) : String(i + 1),
          course: c.name,
          unit: c.units || 0,
          score: raw,
          displayScore,
          status,
          color,
          regStatus: st,
        };
      }),
    };
  });
}

function parseRange(raw) {
  const s = String(raw || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const m = s.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const t1 = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const t2 = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
  return {
    start: Math.min(t1, t2),
    end: Math.max(t1, t2),
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
  const snap = getSnapshot();
  const currentTerm = detectCurrentTermId(snap?.courses || []) || '4051';
  const courses = getCurrentTermSchedule(currentTerm);
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
        color: COURSE_TONES[ci % COURSE_TONES.length],
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

export function jalaliToDate(jy, jm, jd) {
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
    const currentTerm = detectCurrentTermId(snap.courses || []) || '4051';
    const allCourses = getCurrentTermSchedule(currentTerm) || [];
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
      .map((e, idx) => {
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
          color: getToneForCourse(e, allCourses),
          isUrgent: daysLeft != null && daysLeft <= 7,
          isCritical: daysLeft != null && daysLeft <= 3,
        };
      })
      .filter((e) => e.course)
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  } catch (e) {
    console.warn('[getExamsView]', e);
    return [];
  }
}
