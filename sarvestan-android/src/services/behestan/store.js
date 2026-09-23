/**
 * کش ری‌اکتیو داده‌های بهستان — مثل behestanData دسکتاپ
 * localStorage + listener برای React
 */

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
  SYNC_META: 'sarvestan_live_sync_meta',
  LOCAL_NOTES: 'sarvestan_local_notes',
  REG77: 'sarvestan_live_reg77',
  RAW_SCHEDULE: 'sarvestan_raw_behestan_schedule',
  RAW_EXAMS: 'sarvestan_raw_behestan_exams',
  SCHEDULE_CUSTOMIZED: 'sarvestan_schedule_customized',
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
  const hasFinance = Boolean(cache.finance && (cache.finance.totalDebtRial != null || cache.finance.termsSummary));
  const hasProfile = Boolean(cache.profile?.fullName);
  return hasSchedule || hasCourses || hasFinance || hasProfile;
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
  if (partial.syncMeta) persist(KEYS.SYNC_META, cache.syncMeta);
  if (partial.localNotes) persist(KEYS.LOCAL_NOTES, cache.localNotes);
  if (partial.reg77) persist(KEYS.REG77, cache.reg77);
  notify();
}

export function setScheduleForTerm(termId, courses, source = '') {
  const schedule = { ...(cache.schedule || {}) };
  schedule[termId] = courses;

  // اگر نسخه خام بهستان هنوز ست نشده یا سورس سنک رسمی بهستان است، نسخه خام را هم ذخیره کن
  try {
    const rawSched = read(KEYS.RAW_SCHEDULE, null) || {};
    if (!rawSched[termId] || source === 'f1825' || source === 'live' || source === 'sync') {
      rawSched[termId] = JSON.parse(JSON.stringify(courses));
      persist(KEYS.RAW_SCHEDULE, rawSched);
    }
  } catch {}

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
  const map = { ...(cache.exams || {}) };
  map[termId] = exams;

  try {
    const rawExams = read(KEYS.RAW_EXAMS, null) || {};
    if (!rawExams[termId]) {
      rawExams[termId] = JSON.parse(JSON.stringify(exams));
      persist(KEYS.RAW_EXAMS, rawExams);
    }
  } catch {}

  updatePart({ exams: map });
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

  const idx = list.findIndex((c, i) => {
    if (!c) return false;
    if (courseIdentifier && typeof courseIdentifier === 'object') {
      if (courseIdentifier.id && c.id && c.id === courseIdentifier.id) return true;
      if (courseIdentifier.code && c.code && String(c.code) === String(courseIdentifier.code)) {
        if (!courseIdentifier.name || c.name === courseIdentifier.name) return true;
      }
    }
    if (c.id && c.id === courseIdentifier) return true;
    if (c.code && String(c.code) === String(courseIdentifier)) return true;
    if (i === courseIdentifier) return true;
    return false;
  });

  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      ...updatedCourse,
      id: list[idx].id || updatedCourse.id || `course_${Date.now()}`,
    };
    schedule[targetTerm] = list;
    try {
      localStorage.setItem(KEYS.SCHEDULE_CUSTOMIZED, 'true');
    } catch {}
    updatePart({ schedule });
    return true;
  }
  return false;
}

export function addScheduleCourse(termId, newCourse) {
  backupBehestanRawDataIfNeeded();
  const targetTerm = termId || resolveCurrentTermId();
  const schedule = { ...(cache.schedule || {}) };
  const list = [...(schedule[targetTerm] || [])];

  const courseWithId = {
    ...newCourse,
    id: newCourse.id || `custom_c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
  list.push(courseWithId);
  schedule[targetTerm] = list;

  try {
    localStorage.setItem(KEYS.SCHEDULE_CUSTOMIZED, 'true');
  } catch {}
  updatePart({ schedule });
  return courseWithId;
}

export function deleteScheduleCourse(termId, courseIdentifier) {
  backupBehestanRawDataIfNeeded();
  const targetTerm = termId || resolveCurrentTermId();
  const schedule = { ...(cache.schedule || {}) };
  const list = [...(schedule[targetTerm] || [])];

  const filtered = list.filter((c, i) => {
    if (!c) return false;
    if (courseIdentifier && typeof courseIdentifier === 'object') {
      if (courseIdentifier.id && c.id && c.id === courseIdentifier.id) return false;
      if (courseIdentifier.code && c.code && String(c.code) === String(courseIdentifier.code)) {
        if (!courseIdentifier.name || c.name === courseIdentifier.name) return false;
      }
    }
    if (c.id && c.id === courseIdentifier) return false;
    if (c.code && String(c.code) === String(courseIdentifier)) return false;
    if (i === courseIdentifier) return false;
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
    if (examIdentifier && typeof examIdentifier === 'object') {
      if (examIdentifier.id && e.id && e.id === examIdentifier.id) return false;
      if (examIdentifier.code && e.code && String(e.code) === String(examIdentifier.code)) return false;
    }
    if (e.id && e.id === examIdentifier) return false;
    if (e.code && String(e.code) === String(examIdentifier)) return false;
    if (i === examIdentifier) return false;
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
  const byCode = {};
  for (const c of courses) {
    if (c && c.code) {
      byCode[String(c.code)] = {
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
    // حذف قطعی دروس حذف‌شده و در انتظار از برنامه هفتگی
    const filtered = list.filter((course) => {
      if (!course) return false;
      const hit = byCode[String(course.code)];
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
      if (!course || !course.code) continue;
      const hit = byCode[String(course.code)];
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
    .filter((c) => Array.isArray(c.days) && c.days.includes(persianDay))
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
