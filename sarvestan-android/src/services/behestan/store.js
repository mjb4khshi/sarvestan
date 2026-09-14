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
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

let cache = {
  profile: read(KEYS.PROFILE, null),
  schedule: read(KEYS.SCHEDULE, {}),
  exams: read(KEYS.EXAMS, {}),
  transcripts: read(KEYS.TRANSCRIPTS, []),
  finance: read(KEYS.FINANCE, null),
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
  updatePart({ exams: map });
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
      };
    }
  }
  const schedule = cache.schedule || {};
  let changed = false;
  for (const termId of Object.keys(schedule)) {
    const list = schedule[termId];
    if (!Array.isArray(list)) continue;
    for (const course of list) {
      if (!course || !course.code) continue;
      // دروس حذف‌شده / در انتظار را روی برنامهٔ هفتگی نیاور
      if (course.regStatus === 'dropped' || course.regStatus === 'waitlist') continue;
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
  return courses.filter((c) => Array.isArray(c.days) && c.days.includes(persianDay));
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
