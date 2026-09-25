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
  // همیشه نسخه خام سنک شده از بهستان را ذخیره کن
  try {
    const rawSched = read(KEYS.RAW_SCHEDULE, null) || {};
    rawSched[termId] = JSON.parse(JSON.stringify(courses));
    persist(KEYS.RAW_SCHEDULE, rawSched);
  } catch {}

  let finalCourses = courses;

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

    const mergedFromBehestan = courses
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
      if (!course || !course.code || course.customEdited) continue;
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
