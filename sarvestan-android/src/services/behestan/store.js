/**
 * کش ری‌اکتیو داده‌های بهستان — مثل behestanData دسکتاپ
 * localStorage + listener برای React
 */
import devDataset from '../../data/devDatasetLoader.js';
import devCurriculumReport from '../../data/devCurriculumLoader.js';
import { saveManualSession } from './session.js';
import { isProjectCourse, isInternshipCourse } from './parsers.js';

const KEYS = {
  PROFILE: 'sarvestan_live_profile',
  SCHEDULE: 'sarvestan_live_schedule',
  EXAMS: 'sarvestan_live_exams',
  TRANSCRIPTS: 'sarvestan_live_transcripts',
  FINANCE: 'sarvestan_live_finance',
  COURSES: 'sarvestan_live_courses',
  WORKFLOWS: 'sarvestan_live_workflows',
  ANNOUNCEMENTS: 'sarvestan_live_announcements',
  CURRICULUM: 'sarvestan_live_curriculum_stats',
  CURRICULUM_REPORT: 'sarvestan_live_curriculum_report',
  SYNC_META: 'sarvestan_live_sync_meta',
  LOCAL_NOTES: 'sarvestan_local_notes',
  REG77: 'sarvestan_live_reg77',
  RAW_SCHEDULE: 'sarvestan_raw_behestan_schedule',
  RAW_EXAMS: 'sarvestan_raw_behestan_exams',
  SCHEDULE_CUSTOMIZED: 'sarvestan_schedule_customized',
  DELETED_COURSES: 'sarvestan_schedule_deleted_courses',
  DELETED_EXAMS: 'sarvestan_schedule_deleted_exams',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function sanitizeFinance(fin) {
  if (!fin) return fin;
  let overallDebtRial = fin.totalDebtRial || 0;
  if (Array.isArray(fin.termsSummary)) {
    const terms = fin.termsSummary.map((t) => {
      const bill = Number(t.totalBillRial) || 0;
      const paid = Number(t.totalPaidRial) || 0;
      // اگر پرداختی با کل صورت‌حساب برابر یا بیشتر باشد یا بدهی صفر باشد، قطعاً تسویه کامل است
      const isSettled = (bill > 0 && paid >= bill) || (Number(t.debtRial) || 0) <= 0 || t.status === 'تسویه کامل';
      const debtRial = isSettled ? 0 : (bill > paid ? bill - paid : (Number(t.debtRial) || 0));
      return {
        ...t,
        totalBillRial: bill,
        totalPaidRial: paid,
        debtRial,
        debtToman: Math.floor(debtRial / 10),
        status: isSettled ? 'تسویه کامل' : 'بدهکار',
      };
    });
    const activeDebt = terms.reduce((acc, cur) => Math.max(acc, cur.debtRial), 0);
    if (!overallDebtRial && activeDebt > 0) overallDebtRial = activeDebt;
    return {
      ...fin,
      totalDebtRial: overallDebtRial,
      totalDebtToman: Math.floor(overallDebtRial / 10),
      termsSummary: terms,
    };
  }
  return fin;
}

let cache = {
  profile: read(KEYS.PROFILE, null),
  schedule: read(KEYS.SCHEDULE, {}),
  exams: read(KEYS.EXAMS, {}),
  transcripts: read(KEYS.TRANSCRIPTS, []),
  finance: sanitizeFinance(read(KEYS.FINANCE, null)),
  courses: read(KEYS.COURSES, []),
  workflows: read(KEYS.WORKFLOWS, []),
  announcements: read(KEYS.ANNOUNCEMENTS, []),
  curriculumStats: read(KEYS.CURRICULUM, null),
  curriculumReport: read(KEYS.CURRICULUM_REPORT, null),
  syncMeta: read(KEYS.SYNC_META, { lastSyncAt: null, sources: [], status: 'idle' }),
  localNotes: read(KEYS.LOCAL_NOTES, []),
  reg77: read(KEYS.REG77, null),
};

const listeners = new Set();

/**
 * اسنپ‌شات پایدار برای useSyncExternalStore.
 * باید همان referential identity تا زمان update باشد، وگرنه حلقهٔ رندر بی‌نهایت می‌شود.
 */
let snapshotRef = null;

function rebuildSnapshot() {
  snapshotRef = { ...cache };
  return snapshotRef;
}

rebuildSnapshot();

export function subscribeStore(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  rebuildSnapshot();
  const snap = snapshotRef;
  listeners.forEach((cb) => {
    try {
      cb(snap);
    } catch {}
  });
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getSnapshot() {
  if (!snapshotRef) rebuildSnapshot();
  return snapshotRef;
}

export function hasLiveData() {
  const hasSchedule = Object.values(cache.schedule || {}).some(
    (list) => Array.isArray(list) && list.length > 0,
  );
  const hasCourses = Array.isArray(cache.courses) && cache.courses.length > 0;
  const hasProfile = Boolean(cache.profile?.fullName || cache.profile?.photo || cache.profile?.studentId);
  return hasProfile || hasCourses || hasSchedule;
}

export function updatePart(partial) {
  if (partial.finance !== undefined) {
    partial.finance = sanitizeFinance(partial.finance);
  }
  let changed = false;
  for (const [k, v] of Object.entries(partial)) {
    if (v !== undefined) {
      cache = { ...cache, [k]: v };
      changed = true;
    }
  }
  if (!changed) return;

  if (partial.profile) persist(KEYS.PROFILE, cache.profile);
  if (partial.schedule) persist(KEYS.SCHEDULE, cache.schedule);
  if (partial.exams) persist(KEYS.EXAMS, cache.exams);
  if (partial.transcripts) persist(KEYS.TRANSCRIPTS, cache.transcripts);
  if (partial.finance) persist(KEYS.FINANCE, cache.finance);
  if (partial.courses) persist(KEYS.COURSES, cache.courses);
  if (partial.workflows) persist(KEYS.WORKFLOWS, cache.workflows);
  if (partial.announcements) persist(KEYS.ANNOUNCEMENTS, cache.announcements);
  if (partial.curriculumStats) persist(KEYS.CURRICULUM, cache.curriculumStats);
  if (partial.curriculumReport) persist(KEYS.CURRICULUM_REPORT, cache.curriculumReport);
  if (partial.syncMeta) persist(KEYS.SYNC_META, cache.syncMeta);
  if (partial.localNotes) persist(KEYS.LOCAL_NOTES, cache.localNotes);
  if (partial.reg77) persist(KEYS.REG77, cache.reg77);
  notify();
}

export function normalizeCourseCode(code) {
  if (!code) return '';
  return String(code)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/_\d+$/, '')
    .replace(/[^\d]/g, '')
    .trim();
}

export function normalizeNameForMatch(name) {
  if (!name) return '';
  return String(name)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\s_()\-–]+/g, '')
    .trim();
}

export function coursesMatch(a, b) {
  if (!a || !b) return false;
  if (a.id && b.id && String(a.id) === String(b.id)) return true;
  const codeA = normalizeCourseCode(a.code || a.id);
  const codeB = normalizeCourseCode(b.code || b.id);
  if (codeA && codeB && codeA.length >= 5 && codeA === codeB) {
    const groupA = String(a.group || '').replace(/\D/g, '');
    const groupB = String(b.group || '').replace(/\D/g, '');
    if (groupA && groupB && groupA !== groupB) {
      return false;
    }
    return true;
  }
  const nameA = normalizeNameForMatch(a.name || a.course || a.title);
  const nameB = normalizeNameForMatch(b.name || b.course || b.title);
  if (nameA && nameB && nameA === nameB) {
    return true;
  }
  return false;
}

export function findKnownProfessor(course, termId) {
  if (!course) return '';
  if (course.professor && course.professor !== 'ـ') return course.professor;

  const targetCode = normalizeCourseCode(course.code || course.id);
  const targetGroup = String(course.group || '').replace(/\D/g, '');
  const targetName = normalizeNameForMatch(course.name || course.title);

  // ۱. بررسی گزارش ۷۷ (byCode یا لیست courses)
  const reg77 = cache.reg77;
  if (reg77?.byCode && targetCode) {
    const item = reg77.byCode[targetCode];
    if (item?.professor && item.professor !== 'ـ') return item.professor;
  }
  if (Array.isArray(reg77?.courses)) {
    const match = reg77.courses.find((c) => coursesMatch(c, course));
    if (match?.professor && match.professor !== 'ـ') return match.professor;
  }

  // ۲. بررسی دیتای موجود برنامه ترم جاری در استور
  const schedule = cache.schedule || {};
  const currentList = schedule[termId] || [];
  for (const c of currentList) {
    if (c?.professor && c.professor !== 'ـ') {
      const cCode = normalizeCourseCode(c.code || c.id);
      const cGroup = String(c.group || '').replace(/\D/g, '');
      if (targetCode && cCode === targetCode && (!targetGroup || !cGroup || targetGroup === cGroup)) {
        return c.professor;
      }
      if (targetName && normalizeNameForMatch(c.name || c.title) === targetName) {
        return c.professor;
      }
    }
  }

  // ۳. بررسی کارت امتحانات همان ترم (گزارش ۴۲۸)
  const exams = cache.exams?.[termId] || [];
  for (const e of exams) {
    if (e?.professor && e.professor !== 'ـ' && coursesMatch(e, course)) {
      return e.professor;
    }
  }

  // ۴. بررسی همه ترم‌های ذخیره‌شده برنامه
  for (const t of Object.keys(schedule)) {
    for (const c of schedule[t] || []) {
      if (c?.professor && c.professor !== 'ـ') {
        const cCode = normalizeCourseCode(c.code || c.id);
        if (targetCode && cCode === targetCode) return c.professor;
        if (targetName && normalizeNameForMatch(c.name || c.title) === targetName) return c.professor;
      }
    }
  }

  // ۵. بررسی امتحانات سایر ترم‌ها
  for (const t of Object.keys(cache.exams || {})) {
    for (const e of cache.exams[t] || []) {
      if (e?.professor && e.professor !== 'ـ' && coursesMatch(e, course)) {
        return e.professor;
      }
    }
  }

  // ۶. نسخه آزمایشی/توسعه devDataset
  try {
    const devSched = devDataset?.schedule || {};
    for (const t of Object.keys(devSched)) {
      for (const c of devSched[t] || []) {
        if (c?.professor && c.professor !== 'ـ' && coursesMatch(c, course)) {
          return c.professor;
        }
      }
    }
    const devExams = devDataset?.exams || {};
    for (const t of Object.keys(devExams)) {
      for (const e of devExams[t] || []) {
        if (e?.professor && e.professor !== 'ـ' && coursesMatch(e, course)) {
          return e.professor;
        }
      }
    }
  } catch {}

  return '';
}

export function findKnownUnits(course, termId) {
  if (!course) return 0;
  if (course.units && Number(course.units) > 0) return Number(course.units);

  const targetCode = normalizeCourseCode(course.code || course.id);

  // ۱. گزارش ۷۷
  const reg77 = cache.reg77;
  if (reg77?.byCode && targetCode && reg77.byCode[targetCode]?.units > 0) {
    return Number(reg77.byCode[targetCode].units);
  }
  if (Array.isArray(reg77?.courses)) {
    const match = reg77.courses.find((c) => coursesMatch(c, course));
    if (match?.units > 0) return Number(match.units);
  }

  // ۲. کش جامع دروس (F1825)
  if (Array.isArray(cache.courses)) {
    const match = cache.courses.find((c) => coursesMatch(c, course));
    if (match?.units > 0) return Number(match.units);
  }

  // ۳. برنامه سایر ترم‌ها
  const schedule = cache.schedule || {};
  for (const t of Object.keys(schedule)) {
    for (const c of schedule[t] || []) {
      if (c?.units > 0 && coursesMatch(c, course)) return Number(c.units);
    }
  }

  // ۴. دیتابیس گزارش ۲۸۴ چارت تحصیلی دانشجو
  const rep = cache.curriculumReport || read(KEYS.CURRICULUM_REPORT, null);
  if (rep?.categories) {
    const targetName = normalizeNameForMatch(course.name || course.title);
    for (const cat of rep.categories) {
      for (const c of cat.courses || []) {
        if (c?.units > 0 && (c.code === targetCode || normalizeNameForMatch(c.name) === targetName)) {
          return Number(c.units);
        }
      }
    }
  }

  // ۵. پیش‌فرض استاندارد دانشگاه برای پروژه‌ها و کارآموزی
  if (isProjectCourse(course.name || course.title)) {
    return 3;
  }
  if (isInternshipCourse(course.name || course.title)) {
    return 2;
  }

  // ۶. devDataset
  try {
    for (const c of devDataset?.courses || []) {
      if (c?.units > 0 && coursesMatch(c, course)) return Number(c.units);
    }
  } catch {}

  return 0;
}

export function findKnownType(course, termId) {
  if (!course) return 'ـ';
  if (course.type && course.type !== 'ـ') return course.type;

  const targetCode = normalizeCourseCode(course.code || course.id);
  const reg77 = cache.reg77;
  if (reg77?.byCode && targetCode && reg77.byCode[targetCode]?.type && reg77.byCode[targetCode].type !== 'ـ') {
    return reg77.byCode[targetCode].type;
  }
  if (Array.isArray(cache.courses)) {
    const match = cache.courses.find((c) => coursesMatch(c, course));
    if (match?.type && match.type !== 'ـ') return match.type;
  }
  return 'ـ';
}

export function enrichScheduleFromReport77(termId, courses77) {
  if (!termId || !Array.isArray(courses77) || !courses77.length) return false;
  const schedule = { ...(cache.schedule || {}) };
  const currentList = Array.isArray(schedule[termId]) ? [...schedule[termId]] : [];
  if (!currentList.length) return false;

  let changed = false;
  const updatedList = currentList.map((c) => {
    const r77 = courses77.find((item) => coursesMatch(item, c));
    if (!r77) return c;
    let prof = c.professor;
    let units = c.units;
    let type = c.type;
    let regStatus = c.regStatus;

    if ((!prof || prof === 'ـ') && r77.professor && r77.professor !== 'ـ') {
      prof = r77.professor;
      changed = true;
    }
    if ((!units || units === 0) && r77.units > 0) {
      units = r77.units;
      changed = true;
    }
    if ((!type || type === 'ـ') && r77.type && r77.type !== 'ـ') {
      type = r77.type;
      changed = true;
    }
    if (r77.regStatus && r77.regStatus !== c.regStatus) {
      regStatus = r77.regStatus;
      changed = true;
    }

    return {
      ...c,
      professor: prof,
      units,
      type,
      regStatus,
    };
  });

  // همچنین دروسی از فرم ۷۷ که در برنامه هفتگی نبودند (مانند پروژه و کارآموزی فاقد ساعت کلاسی) را اضافه کن
  for (const c77 of courses77) {
    if (c77.regStatus === 'dropped' || c77.regStatus === 'waitlist') continue;
    const exists = updatedList.some((item) => coursesMatch(item, c77));
    if (!exists) {
      updatedList.push({
        id: c77.code || c77.name,
        code: c77.code,
        name: c77.name,
        group: c77.group || '۰۱',
        units: c77.units || findKnownUnits(c77, termId) || (isProjectCourse(c77.name) ? 3 : 0),
        type: c77.type || 'ـ',
        professor: c77.professor || 'ـ',
        days: c77.days || [],
        time: c77.time || 'ـ',
        hall: c77.hall || 'ـ',
        examDate: c77.examDate || 'ـ',
        examTime: c77.examTime || 'ـ',
        classTimeRaw: c77.classTimeRaw || '',
        timeSlotsRaw: [],
        daySlots: c77.daySlots || [],
        isLive: true,
        isRegistration: true,
        onSchedule: true,
        regStatus: 'registered',
      });
      changed = true;
    }
  }

  if (changed) {
    schedule[termId] = updatedList;
    updatePart({ schedule });
    return true;
  }
  return false;
}

export function enrichScheduleFromExams(termId, exams) {
  if (!termId || !Array.isArray(exams) || !exams.length) return false;
  const schedule = { ...(cache.schedule || {}) };
  const currentList = Array.isArray(schedule[termId]) ? [...schedule[termId]] : [];
  if (!currentList.length) return false;

  let changed = false;
  const updatedList = currentList.map((c) => {
    if (c.professor && c.professor !== 'ـ') return c;
    const ex = exams.find((e) => coursesMatch(e, c));
    if (ex && ex.professor && ex.professor !== 'ـ') {
      changed = true;
      return { ...c, professor: ex.professor };
    }
    return c;
  });

  if (changed) {
    schedule[termId] = updatedList;
    updatePart({ schedule });
    return true;
  }
  return false;
}

export function hydrateAndHealScheduleProfessors() {
  const schedule = cache.schedule || {};
  let anyChanged = false;
  const newSchedule = { ...schedule };

  for (const termId of Object.keys(newSchedule)) {
    const list = newSchedule[termId];
    if (!Array.isArray(list) || !list.length) continue;
    let termChanged = false;

    const healedList = list.map((c) => {
      let prof = c.professor;
      let units = c.units;
      let type = c.type;

      if (!prof || prof === 'ـ') {
        const found = findKnownProfessor(c, termId);
        if (found) {
          prof = found;
          termChanged = true;
        }
      }
      if (!units || units === 0) {
        const foundU = findKnownUnits(c, termId);
        if (foundU) {
          units = foundU;
          termChanged = true;
        }
      }
      if (!type || type === 'ـ') {
        const foundT = findKnownType(c, termId);
        if (foundT) {
          type = foundT;
          termChanged = true;
        }
      }

      return {
        ...c,
        professor: prof,
        units,
        type,
      };
    });

    if (termChanged) {
      newSchedule[termId] = healedList;
      anyChanged = true;
    }
  }

  if (anyChanged) {
    cache.schedule = newSchedule;
    persist(KEYS.SCHEDULE, cache.schedule);
    rebuildSnapshot();
  }
}

// اجرای ترمیم خودکار کش روی بارگذاری اولیه
hydrateAndHealScheduleProfessors();

export function setScheduleForTerm(termId, courses, source = '') {
  // همیشه نسخه خام سنک شده از بهستان را ذخیره کن
  try {
    const rawSched = read(KEYS.RAW_SCHEDULE, null) || {};
    rawSched[termId] = JSON.parse(JSON.stringify(courses));
    persist(KEYS.RAW_SCHEDULE, rawSched);
  } catch {}

  // غنی‌سازی خودکار درس‌ها با نام استاد، واحد و نوع در صورت فقدان (مثلاً در گزارش ۷۸)
  const enrichedCourses = (courses || []).map((c) => {
    let prof = c.professor;
    if (!prof || prof === 'ـ') {
      prof = findKnownProfessor(c, termId) || 'ـ';
    }
    let units = c.units;
    if (!units || units === 0) {
      units = findKnownUnits(c, termId) || 0;
    }
    let type = c.type;
    if (!type || type === 'ـ') {
      type = findKnownType(c, termId) || 'ـ';
    }
    return {
      ...c,
      professor: prof,
      units,
      type,
    };
  });

  // اگر منبع سنک گزارش ۷۸ است (برنامه هفتگی که فقط شامل دروس دارای روز/ساعت است)،
  // دروسی از ثبت‌نام قبلی (مانند پروژه و کارآموزی فاقد اسلات روز در برنامه هفتگی) نباید حذف شوند
  const existingTermCourses = Array.isArray(cache.schedule?.[termId]) ? cache.schedule[termId] : [];
  const unscheduledPreserved = existingTermCourses.filter((ec) => {
    if (!ec) return false;
    if (enrichedCourses.some((nc) => coursesMatch(nc, ec))) return false;
    if (ec.regStatus === 'dropped' || ec.regStatus === 'waitlist') return false;
    const hasSlots = (Array.isArray(ec.daySlots) && ec.daySlots.length > 0) || (Array.isArray(ec.days) && ec.days.length > 0);
    const isSpecial = isProjectCourse(ec.name || ec.title) || isInternshipCourse(ec.name || ec.title);
    return !hasSlots || isSpecial || ec.isRegistration;
  });

  if (unscheduledPreserved.length > 0) {
    enrichedCourses.push(...unscheduledPreserved);
  }

  let finalCourses = enrichedCourses;

  // اگر کاربر ویرایش‌های دستی داشته، درس‌های ویرایش‌شده و اضافه‌شده دستی را روی دیتای جدید بهستان نگه دار
  if (hasScheduleCustomizations()) {
    const currentList = Array.isArray(cache.schedule?.[termId]) ? cache.schedule[termId] : [];
    const deletedList = read(KEYS.DELETED_COURSES, []) || [];

    const isDeleted = (c) => {
      if (!c) return false;
      return deletedList.some((d) => {
        if (c.id && d.id && c.id === d.id) return true;
        if (c.code && d.code && String(c.code) === String(d.code)) return true;
        if (c.name && d.name && c.name === d.name) return true;
        return false;
      });
    };

    const mergedFromBehestan = enrichedCourses
      .filter((c) => !isDeleted(c))
      .map((bc) => {
        const userEdited = currentList.find(
          (uc) =>
            uc &&
            uc.customEdited &&
            ((uc.id && bc.id && uc.id === bc.id) ||
              (uc.code && bc.code && String(uc.code) === String(bc.code)) ||
              (uc.name && bc.name && uc.name === bc.name))
        );
        return userEdited ? { ...bc, ...userEdited } : bc;
      });

    const customAddedCourses = currentList.filter(
      (c) => c && (c.customAdded || String(c.id || '').startsWith('custom_c_'))
    );

    finalCourses = [...mergedFromBehestan, ...customAddedCourses];
  }

  const schedule = { ...(cache.schedule || {}) };
  schedule[termId] = finalCourses;

  updatePart({
    schedule,
    syncMeta: {
      ...cache.syncMeta,
      lastSyncAt: Date.now(),
      sources: [...new Set([...(cache.syncMeta?.sources || []), source].filter(Boolean))],
      status: 'live',
    },
  });
}

export function setExamsForTerm(termId, exams) {
  try {
    const rawExams = read(KEYS.RAW_EXAMS, null) || {};
    rawExams[termId] = JSON.parse(JSON.stringify(exams));
    persist(KEYS.RAW_EXAMS, rawExams);
  } catch {}

  let finalExams = exams;

  if (hasScheduleCustomizations()) {
    const currentList = Array.isArray(cache.exams?.[termId]) ? cache.exams[termId] : [];
    const deletedList = read(KEYS.DELETED_EXAMS, []) || [];

    const isDeleted = (e) => {
      if (!e) return false;
      return deletedList.some((d) => {
        if (e.id && d.id && e.id === d.id) return true;
        if (e.code && d.code && String(e.code) === String(d.code)) return true;
        if ((e.name || e.course) && (d.name || d.course) && (e.name || e.course) === (d.name || d.course)) return true;
        return false;
      });
    };

    const mergedFromBehestan = exams
      .filter((e) => !isDeleted(e))
      .map((be) => {
        const userEdited = currentList.find(
          (ue) =>
            ue &&
            ue.customEdited &&
            ((ue.id && be.id && ue.id === be.id) ||
              (ue.code && be.code && String(ue.code) === String(be.code)) ||
              ((ue.name || ue.course) && (be.name || be.course) && (ue.name || ue.course) === (be.name || be.course)))
        );
        return userEdited ? { ...be, ...userEdited } : be;
      });

    const customAddedExams = currentList.filter(
      (e) => e && (e.customAdded || String(e.id || '').startsWith('custom_ex_'))
    );

    finalExams = [...mergedFromBehestan, ...customAddedExams];
  }

  const map = { ...(cache.exams || {}) };
  map[termId] = finalExams;

  updatePart({ exams: map });
  enrichScheduleFromExams(termId, finalExams);
}

export function hasScheduleCustomizations() {
  try {
    return localStorage.getItem(KEYS.SCHEDULE_CUSTOMIZED) === 'true';
  } catch {
    return false;
  }
}

export function backupBehestanRawDataIfNeeded() {
  try {
    const rawSched = read(KEYS.RAW_SCHEDULE, null);
    if (!rawSched && cache.schedule && Object.keys(cache.schedule).length) {
      persist(KEYS.RAW_SCHEDULE, JSON.parse(JSON.stringify(cache.schedule)));
    }
    const rawEx = read(KEYS.RAW_EXAMS, null);
    if (!rawEx && cache.exams && Object.keys(cache.exams).length) {
      persist(KEYS.RAW_EXAMS, JSON.parse(JSON.stringify(cache.exams)));
    }
  } catch {}
}

export function resolveCurrentTermId() {
  const s = cache.schedule || {};
  const sKeys = Object.keys(s).filter((k) => Array.isArray(s[k]) && s[k].length);
  if (sKeys.length) return sKeys.sort().reverse()[0];
  const courses = cache.courses || [];
  const cKeys = [...new Set(courses.map((c) => String(c?.termId || '').trim()).filter(Boolean))].sort();
  if (cKeys.length) return cKeys[cKeys.length - 1];
  return '4051';
}

export function updateScheduleCourse(termId, courseIdentifier, updatedCourse) {
  backupBehestanRawDataIfNeeded();
  const targetTerm = termId || resolveCurrentTermId();
  const schedule = { ...(cache.schedule || {}) };
  const list = [...(schedule[targetTerm] || [])];

  const norm = (v) =>
    String(v || '')
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[يی]/g, 'ی')
      .replace(/[كک]/g, 'ک')
      .replace(/[\u200c\s]+/g, ' ')
      .trim();

  const idTarget =
    courseIdentifier && typeof courseIdentifier === 'object' ? courseIdentifier.id : courseIdentifier;
  const codeTarget =
    courseIdentifier && typeof courseIdentifier === 'object'
      ? courseIdentifier.code
      : (courseIdentifier || updatedCourse?.code);
  const nameTarget =
    courseIdentifier && typeof courseIdentifier === 'object'
      ? (courseIdentifier.name || courseIdentifier.title)
      : updatedCourse?.name;

  let idx = list.findIndex((c) => {
    if (!c) return false;
    if (idTarget && c.id && String(c.id) === String(idTarget)) return true;
    if (codeTarget && c.code && norm(c.code) === norm(codeTarget)) return true;
    if (nameTarget && (c.name || c.title) && norm(c.name || c.title) === norm(nameTarget)) return true;
    return false;
  });

  const merged = {
    ...(idx >= 0 ? list[idx] : {}),
    ...updatedCourse,
    id: (idx >= 0 ? list[idx].id : null) || updatedCourse.id || `course_${Date.now()}`,
    customEdited: true,
  };

  if (idx >= 0) {
    list[idx] = merged;
  } else {
    list.push(merged);
  }

  schedule[targetTerm] = list;
  try {
    localStorage.setItem(KEYS.SCHEDULE_CUSTOMIZED, 'true');
  } catch {}

  // همگام‌سازی با کش courses برای دسترسی بدون معطلی شبیه‌ساز معدل
  if (Array.isArray(cache.courses)) {
    const cIdx = cache.courses.findIndex((cc) => {
      if (!cc) return false;
      if (idTarget && cc.id && String(cc.id) === String(idTarget)) return true;
      if (codeTarget && cc.code && norm(cc.code) === norm(codeTarget)) return true;
      if (nameTarget && (cc.name || cc.title) && norm(cc.name || cc.title) === norm(nameTarget)) return true;
      return false;
    });
    if (cIdx >= 0) {
      cache.courses[cIdx] = {
        ...cache.courses[cIdx],
        ...updatedCourse,
        includeInGpa: updatedCourse.includeInGpa !== false,
        color: updatedCourse.color || cache.courses[cIdx].color,
      };
    }
  }

  updatePart({ schedule, courses: cache.courses });
  return true;
}

export function addScheduleCourse(termId, newCourse) {
  backupBehestanRawDataIfNeeded();
  const targetTerm = termId || resolveCurrentTermId();
  const schedule = { ...(cache.schedule || {}) };
  const list = [...(schedule[targetTerm] || [])];

  const courseWithId = {
    ...newCourse,
    id: newCourse.id || `custom_c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    customAdded: true,
  };
  list.push(courseWithId);
  schedule[targetTerm] = list;

  // افزودن به کش courses برای دیده‌شدن در شبیه‌ساز معدل
  if (Array.isArray(cache.courses)) {
    cache.courses.push({
      id: courseWithId.id,
      code: courseWithId.code || '',
      name: courseWithId.name || '',
      units: courseWithId.units || 3,
      termId: targetTerm,
      color: courseWithId.color || 'primary',
      includeInGpa: courseWithId.includeInGpa !== false,
      grade: null,
      status: 'در حال',
    });
  }

  try {
    localStorage.setItem(KEYS.SCHEDULE_CUSTOMIZED, 'true');
  } catch {}
  updatePart({ schedule, courses: cache.courses });
  return courseWithId;
}

export function deleteScheduleCourse(termId, courseIdentifier) {
  backupBehestanRawDataIfNeeded();
  const targetTerm = termId || resolveCurrentTermId();
  const schedule = { ...(cache.schedule || {}) };
  const list = [...(schedule[targetTerm] || [])];

  const filtered = list.filter((c, i) => {
    if (!c) return false;
    let match = false;
    if (courseIdentifier && typeof courseIdentifier === 'object') {
      if (courseIdentifier.id && c.id && c.id === courseIdentifier.id) match = true;
      if (courseIdentifier.code && c.code && String(c.code) === String(courseIdentifier.code)) {
        if (!courseIdentifier.name || c.name === courseIdentifier.name) match = true;
      }
    }
    if (c.id && c.id === courseIdentifier) match = true;
    if (c.code && String(c.code) === String(courseIdentifier)) match = true;
    if (i === courseIdentifier) match = true;

    if (match) {
      try {
        const deleted = read(KEYS.DELETED_COURSES, []) || [];
        deleted.push({ id: c.id, code: c.code, name: c.name || c.title });
        persist(KEYS.DELETED_COURSES, deleted);
      } catch {}
      return false;
    }
    return true;
  });

  schedule[targetTerm] = filtered;
  try {
    localStorage.setItem(KEYS.SCHEDULE_CUSTOMIZED, 'true');
  } catch {}
  updatePart({ schedule });
  return true;
}

export function updateExamInStore(termId, examIdentifier, updatedExam) {
  backupBehestanRawDataIfNeeded();
  const targetTerm = termId || resolveCurrentTermId();
  const examsMap = { ...(cache.exams || {}) };
  const list = [...(examsMap[targetTerm] || [])];

  const idx = list.findIndex((e, i) => {
    if (!e) return false;
    if (examIdentifier && typeof examIdentifier === 'object') {
      if (examIdentifier.id && e.id && e.id === examIdentifier.id) return true;
      if (examIdentifier.code && e.code && String(e.code) === String(examIdentifier.code)) return true;
    }
    if (e.id && e.id === examIdentifier) return true;
    if (e.code && String(e.code) === String(examIdentifier)) return true;
    if (i === examIdentifier) return true;
    return false;
  });

  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      ...updatedExam,
      id: list[idx].id || updatedExam.id || `exam_${Date.now()}`,
      customEdited: true,
    };
    examsMap[targetTerm] = list;
    try {
      localStorage.setItem(KEYS.SCHEDULE_CUSTOMIZED, 'true');
    } catch {}
    updatePart({ exams: examsMap });
    return true;
  }
  return false;
}

export function addExamToStore(termId, newExam) {
  backupBehestanRawDataIfNeeded();
  const targetTerm = termId || resolveCurrentTermId();
  const examsMap = { ...(cache.exams || {}) };
  const list = [...(examsMap[targetTerm] || [])];

  const examWithId = {
    ...newExam,
    id: newExam.id || `custom_ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    customAdded: true,
  };
  list.push(examWithId);
  examsMap[targetTerm] = list;

  try {
    localStorage.setItem(KEYS.SCHEDULE_CUSTOMIZED, 'true');
  } catch {}
  updatePart({ exams: examsMap });
  return examWithId;
}

export function deleteExamFromStore(termId, examIdentifier) {
  backupBehestanRawDataIfNeeded();
  const targetTerm = termId || resolveCurrentTermId();
  const examsMap = { ...(cache.exams || {}) };
  const list = [...(examsMap[targetTerm] || [])];

  const filtered = list.filter((e, i) => {
    if (!e) return false;
    let match = false;
    if (examIdentifier && typeof examIdentifier === 'object') {
      if (examIdentifier.id && e.id && e.id === examIdentifier.id) match = true;
      if (examIdentifier.code && e.code && String(e.code) === String(examIdentifier.code)) match = true;
    }
    if (e.id && e.id === examIdentifier) match = true;
    if (e.code && String(e.code) === String(examIdentifier)) match = true;
    if (i === examIdentifier) match = true;

    if (match) {
      try {
        const deleted = read(KEYS.DELETED_EXAMS, []) || [];
        deleted.push({ id: e.id, code: e.code, name: e.name || e.course });
        persist(KEYS.DELETED_EXAMS, deleted);
      } catch {}
      return false;
    }
    return true;
  });

  examsMap[targetTerm] = filtered;
  try {
    localStorage.setItem(KEYS.SCHEDULE_CUSTOMIZED, 'true');
  } catch {}
  updatePart({ exams: examsMap });
  return true;
}

export function resetScheduleAndExamsToBehestan() {
  const rawSched = read(KEYS.RAW_SCHEDULE, null);
  const rawEx = read(KEYS.RAW_EXAMS, null);

  const updates = {};
  if (rawSched) updates.schedule = JSON.parse(JSON.stringify(rawSched));
  if (rawEx) updates.exams = JSON.parse(JSON.stringify(rawEx));

  try {
    localStorage.removeItem(KEYS.SCHEDULE_CUSTOMIZED);
    localStorage.removeItem(KEYS.DELETED_COURSES);
    localStorage.removeItem(KEYS.DELETED_EXAMS);
  } catch {}

  if (Object.keys(updates).length) {
    updatePart(updates);
  }
  return true;
}

export function mergeCourses(courses) {
  const byKey = new Map();
  for (const c of cache.courses || []) {
    byKey.set(`${c.termId}|${c.code}|${c.group}`, c);
  }
  for (const c of courses || []) {
    byKey.set(`${c.termId}|${c.code}|${c.group}`, {
      ...byKey.get(`${c.termId}|${c.code}|${c.group}`),
      ...c,
    });
  }
  let list = [...byKey.values()];
  list = applyReg77Status(list);
  updatePart({ courses: list });
  enrichScheduleFromCourses(list);
}

/**
 * فقط وضعیت دروس ترم جاری را از فرم ۷۷ روی F1825 می‌گذارد
 * — دست به schedule (برنامهٔ هفتگی) نمی‌زند
 */
export function applyReg77Status(courses) {
  const reg77 = cache.reg77 || null;
  const byCode = reg77?.byCode || {};
  if (!Object.keys(byCode).length) return courses || [];

  const currentTerm = reg77.termId || null;
  return (courses || []).map((c) => {
    const code = String(c?.code || '').trim();
    const from77 = byCode[code];
    if (!from77) return c;
    // فقط ترم جاری / بدون نمره قطعی
    if (currentTerm && c.termId && c.termId !== currentTerm) return c;
    const hasGrade = Boolean(c.grade && c.grade !== 'ـ' && c.grade !== '-');
    if (hasGrade && from77.regStatus !== 'dropped' && from77.regStatus !== 'waitlist') {
      return c;
    }
    const regStatus = from77.regStatus || c.regStatus;
    let status = c.status;
    if (regStatus === 'dropped') status = 'حذف اضطراری';
    else if (regStatus === 'waitlist') status = 'در انتظار';
    else if (regStatus === 'registered') status = c.status || 'ثبت شده';
    return { ...c, regStatus, status };
  });
}

/** واحد و نام استاندارد F1825 را روی برنامهٔ هفتگی اعمال کن */
export function enrichScheduleFromCourses(courses) {
  if (!Array.isArray(courses) || !courses.length) return;
  const byTermAndCode = {};
  for (const c of courses) {
    if (c && c.code) {
      const termKey = c.termId ? String(c.termId).trim() : '';
      const key = `${termKey}|${String(c.code).trim()}`;
      byTermAndCode[key] = {
        termId: c.termId || null,
        units: c.units > 0 ? c.units : 0,
        name: c.name || null,
        type: c.type || null,
        regStatus: c.regStatus || null,
        status: c.status || null,
      };
    }
  }
  const schedule = cache.schedule || {};
  let changed = false;
  for (const termId of Object.keys(schedule)) {
    const list = schedule[termId];
    if (!Array.isArray(list)) continue;
    const currentTermKey = String(termId).trim();
    // حذف قطعی دروس حذف‌شده و در انتظار از برنامه هفتگی — فقط برای همان ترم جاری
    const filtered = list.filter((course) => {
      if (!course) return false;
      const key = `${currentTermKey}|${String(course.code).trim()}`;
      const hit = byTermAndCode[key];
      const reg = hit?.regStatus || course.regStatus;
      const st = hit?.status || course.status;
      if (reg === 'dropped' || reg === 'waitlist') return false;
      if (/حذف\s*اضطرار|حذف\s*شده|حذف\s*ايثار|حذف\s*ایثار|انتظار/i.test(String(st || ''))) return false;
      return true;
    });

    if (filtered.length !== list.length) {
      schedule[termId] = filtered;
      changed = true;
    }

    for (const course of schedule[termId]) {
      if (!course || !course.code || course.customEdited) continue;
      const key = `${currentTermKey}|${String(course.code).trim()}`;
      const hit = byTermAndCode[key];
      if (!hit) continue;
      if (hit.units > 0 && course.units !== hit.units) {
        course.units = hit.units;
        changed = true;
      }
      if (hit.name && course.name !== hit.name) {
        course.name = hit.name;
        changed = true;
      }
    }
  }
  if (changed) {
    updatePart({ schedule });
  }
}

export function markSyncStatus(status, extra = {}) {
  updatePart({
    syncMeta: {
      ...cache.syncMeta,
      status,
      lastSyncAt: status === 'live' ? Date.now() : cache.syncMeta?.lastSyncAt,
      ...extra,
    },
  });
}

/** یادداشت محلی (تغییرات سنک) — در اعلانات نمایش داده می‌شود */
export function addLocalNote(text, { color = 'info', title = 'تغییر جدید' } = {}) {
  if (!text) return;
  const notes = Array.isArray(cache.localNotes) ? cache.localNotes : [];
  const item = {
    id: `n${Date.now()}`,
    title,
    body: String(text),
    color,
    at: Date.now(),
  };
  // جلوگیری از تکرار پیاپی همان متن
  if (notes[0]?.body === item.body) return;
  updatePart({ localNotes: [item, ...notes].slice(0, 20) });
}

export function getLocalNotes() {
  return Array.isArray(cache.localNotes) ? cache.localNotes : [];
}

export function clearLocalNotes() {
  updatePart({ localNotes: [] });
}

export function clearLiveData() {
  cache = {
    profile: null,
    schedule: {},
    exams: {},
    transcripts: [],
    finance: null,
    courses: [],
    workflows: [],
    announcements: [],
    curriculumStats: null,
    curriculumReport: null,
    syncMeta: { lastSyncAt: null, sources: [], status: 'idle' },
    localNotes: [],
    reg77: null,
  };
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
  notify();
}

/** بارگذاری دیتاست نمونه/واقعی استخراج‌شده از HAR بهستان (برای حالت آفلاین و توسعه) */
export function loadDevDataset() {
  try {
    if (devDataset.profile?.studentId) {
      saveManualSession({ studentId: devDataset.profile.studentId });
    }
  } catch {}
  updatePart({
    profile: devDataset.profile,
    courses: devDataset.courses,
    schedule: devDataset.schedule,
    exams: devDataset.exams,
    transcripts: devDataset.transcripts,
    finance: devDataset.finance,
    curriculumStats: devDataset.curriculumStats,
    curriculumReport: devCurriculumReport,
    syncMeta: {
      lastSyncAt: Date.now(),
      sources: ['dataset'],
      status: 'live',
    },
  });
}

// ابزارهای selector برای UI
export function getCurrentTermSchedule(termId = '4051') {
  const s = cache.schedule || {};
  if (Array.isArray(s[termId]) && s[termId].length) return s[termId];
  const keys = Object.keys(s).filter((k) => Array.isArray(s[k]) && s[k].length);
  if (!keys.length) return [];
  const sorted = keys.sort().reverse();
  return s[sorted[0]] || [];
}

/** برای دیباگ — وضعیت خام کش */
export function debugDump() {
  const schedule = cache.schedule || {};
  const schedKeys = Object.keys(schedule);
  return {
    live: hasLiveData(),
    coursesCount: (cache.courses || []).length,
    scheduleTerms: schedKeys,
    scheduleCounts: Object.fromEntries(
      schedKeys.map((k) => [k, Array.isArray(schedule[k]) ? schedule[k].length : 0]),
    ),
    sampleSchedule: (getCurrentTermSchedule() || []).slice(0, 3).map((c) => ({
      name: c.name,
      code: c.code,
      units: c.units,
      days: c.days,
      time: c.time,
      hall: c.hall,
    })),
    sampleCourses: (cache.courses || []).slice(0, 5).map((c) => ({
      name: c.name,
      code: c.code,
      units: c.units,
      grade: c.grade,
      termId: c.termId,
    })),
    gpa: cache.profile?.gpa,
    finance: cache.finance
      ? {
          totalDebtToman: cache.finance.totalDebtToman,
          terms: (cache.finance.termsSummary || []).map((t) => ({
            termId: t.termId,
            debtToman: t.debtToman,
            bill: t.totalBillRial,
            paid: t.totalPaidRial,
          })),
        }
      : null,
    transcripts: (cache.transcripts || []).map((t) => ({
      termId: t.termId,
      gpa: t.cumulativeGpa || t.termGpa,
      units: t.totalPassedUnits,
    })),
  };
}

export function getTodayClasses(persianDay) {
  const courses = getCurrentTermSchedule();
  return courses
    .filter((c) => {
      const hasInDays = Array.isArray(c.days) && c.days.includes(persianDay);
      const hasInSlots = Array.isArray(c.daySlots) && c.daySlots.some((s) => s.day === persianDay);
      return hasInDays || hasInSlots;
    })
    .map((c) => {
      // اگر daySlots دارد، ساعت و مکان مختص همین روز را ست کن
      if (Array.isArray(c.daySlots) && c.daySlots.length) {
        const slot = c.daySlots.find((s) => s.day === persianDay);
        if (slot) {
          return {
            ...c,
            time: slot.time || c.time,
            classTimeRaw: slot.time || c.classTimeRaw,
            hall: slot.hall && slot.hall !== 'ـ' ? slot.hall : c.hall,
          };
        }
      }
      return c;
    });
}

export function getSummary() {
  const profile = cache.profile;
  const finance = cache.finance;
  const transcripts = cache.transcripts || [];
  const latest = transcripts.length ? transcripts[transcripts.length - 1] : null;
  const courses = cache.courses || [];
  // ترم جاری را از دیتا پیدا کن — نه هاردکد
  const termIds = [
    ...new Set(courses.map((c) => String(c?.termId || '').trim()).filter(Boolean)),
  ].sort();
  const currentTerm = termIds.length ? termIds[termIds.length - 1] : '4051';
  const scheduleCourses = getCurrentTermSchedule(currentTerm);
  const scheduleUnits = scheduleCourses.reduce((s, c) => s + (c.units || 0), 0);
  const currentCourses = courses.filter((c) => {
    if (c.termId !== currentTerm && !c.isRegistration) return false;
    const reg = String(c.regStatus || '');
    if (reg === 'dropped' || reg === 'waitlist') return false;
    const st = String(c.status || '');
    if (/حذف\s*اضطرار|حذف\s*شده|انتظار/i.test(st)) return false;
    return true;
  });
  const currentUnits = currentCourses.reduce((s, c) => s + (c.units || 0), 0);

  // معدل: اول profile، بعد آخرین ترانسکریپت، بعد میانگین دروس نمره‌دار
  let gpa = profile?.gpa || latest?.cumulativeGpa || '';
  if (!gpa || gpa === 'ـ') {
    const scored = courses.filter((c) => c.grade && c.grade !== 'ـ' && c.grade !== '-');
    if (scored.length) {
      let pts = 0;
      let units = 0;
      for (const c of scored) {
        const g = parseFloat(String(c.grade).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))));
        if (Number.isFinite(g)) {
          pts += g * (c.units || 1);
          units += c.units || 1;
        }
      }
      if (units > 0) gpa = (pts / units).toFixed(2);
    }
  }

  return {
    gpa: gpa || 'ـ',
    credits: String(currentUnits || scheduleUnits || 0),
    unpaid: finance?.totalDebtToman != null ? String(finance.totalDebtToman) : '۰',
    unpaidRial: finance?.totalDebtRial || 0,
    isPaid: (finance?.totalDebtRial || 0) === 0,
    currentTerm,
    billRial:
      finance?.termsSummary?.find((t) => t.termId === currentTerm)?.totalBillRial ||
      finance?.termsSummary?.[0]?.totalBillRial ||
      0,
    paidRial:
      finance?.termsSummary?.find((t) => t.termId === '4051')?.totalPaidRial ||
      finance?.termsSummary?.[0]?.totalPaidRial ||
      0,
  };
}

/** بارگذاری کامل داده‌های آماده (تست لوکال از HAR) */
export function loadSnapshotData(data) {
  if (!data) return;
  updatePart({
    profile: data.profile || cache.profile,
    courses: data.courses || cache.courses,
    schedule: data.schedule || cache.schedule,
    exams: data.exams || cache.exams,
    finance: data.finance || cache.finance,
    transcripts: data.transcripts || cache.transcripts,
    syncMeta: {
      status: 'live',
      lastSyncAt: Date.now(),
      sources: ['har-seed'],
    },
  });
}
