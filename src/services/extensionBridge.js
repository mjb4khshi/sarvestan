/**
 * Extension Bridge for Sarvestan 2.0 (Chrome Extension / Overlay)
 * Handles communication between Behestan/Golestan content script, background, and the React App
 */
import {
  notifyStoreChange,
  getSnapshot,
  setScheduleForTerm,
  setExamsForTerm,
  asTermMap,
} from './behestan/store';
import { applyManualSession, getSelectedUniversity, getUniversityOrigin } from './behestan/session';

const STORAGE_KEYS = {
  profile: 'sarvestan_live_profile',
  profile_update: 'sarvestan_live_profile',
  schedule: 'sarvestan_live_schedule',
  exams: 'sarvestan_live_exams',
  transcripts: 'sarvestan_live_transcripts',
  finance: 'sarvestan_live_finance',
  courses: 'sarvestan_live_courses',
  workflows: 'sarvestan_live_workflows',
  announcements: 'sarvestan_live_announcements',
  curriculumStats: 'sarvestan_live_curriculum_stats',
  curriculum_stats: 'sarvestan_live_curriculum_stats',
};

const SUPPORTED_DOMAINS = ['kntu.ac.ir', 'aut.ac.ir', 'sbu.ac.ir', 'ut.ac.ir', 'iust.ac.ir'];
const UNIVERSITY_PATTERNS = [
  '*://*.kntu.ac.ir/*',
  '*://*.aut.ac.ir/*',
  '*://*.sbu.ac.ir/*',
  '*://*.ut.ac.ir/*',
  '*://*.iust.ac.ir/*',
];

function resolveActiveUniversity(p) {
  return (
    p?.university ||
    localStorage.getItem('sarvestan_selected_university') ||
    getSelectedUniversity() ||
    'kntu'
  );
}

/**
 * بررسی اینکه آیا اپ داخل آی‌فریم بهستان/گلستان در حال اجراست یا خیر
 */
export function isBehestanOverlay() {
  if (typeof window === 'undefined') return false;
  const hn = (window.location.hostname || '').toLowerCase();
  return (
    window.self !== window.top ||
    window.location.search.includes('mode=overlay') ||
    SUPPORTED_DOMAINS.some((d) => hn.includes(d))
  );
}

/**
 * بستن لایه تمام‌صفحه بهستان
 */
export function closeBehestanOverlay() {
  if (typeof window !== 'undefined') {
    try {
      window.parent.postMessage({ action: 'CLOSE_SARVESTAN_OVERLAY' }, '*');
    } catch {}
  }
}

/**
 * هدایت به تب سامانه بهستان/گلستان دانشگاه انتخاب شده یا باز کردن آن در تب جدید
 */
export function openBehestanPage(uniId = getSelectedUniversity()) {
  const url = getUniversityOrigin(uniId);
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    try {
      chrome.tabs.query({ url: UNIVERSITY_PATTERNS }, (tabs) => {
        if (tabs && tabs.length > 0 && tabs[0].id) {
          chrome.tabs.update(tabs[0].id, { active: true });
        } else {
          chrome.tabs.create({ url });
        }
      });
      return;
    } catch {}
  }
  window.open(url, '_blank');
}

/**
 * استعلام و همگام‌سازی اطلاعات از تب‌های باز بهستان و گلستان
 *
 * له‌رومهٔ تمیز (throttle): وقتی داده‌ای نمی‌آید، loops رندر می‌توانند این تابع
 * را هر ۴۰۰ms صدا بزنند و هر بار صف کامل FORCE_SYNC روی تب سامانه شروع شود
 * → بار سنگین فزاینده روی مرورگر. حداقل ۱۰ ثانیه بین دو سنک واقعی فاصله می‌گذاریم.
 */
const SYNC_THROTTLE_MS = 10000;
let lastSyncCheckAt = 0;
let lastSyncCheckResult = null;

export async function checkExtensionSync({ bypassThrottle = false } = {}) {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
    // در محیط وب معمولی، داده‌های لوکال‌استوریج را بررسی کن
    const prof = localStorage.getItem(STORAGE_KEYS.profile);
    return { ok: !!prof, source: 'localStorage' };
  }

  const now = Date.now();
  if (!bypassThrottle && lastSyncCheckResult && now - lastSyncCheckAt < SYNC_THROTTLE_MS) {
    return lastSyncCheckResult;
  }

  const result = await runCheckExtensionSync();
  lastSyncCheckAt = Date.now();
  lastSyncCheckResult = result;
  return result;
}

async function runCheckExtensionSync() {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: UNIVERSITY_PATTERNS }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        // اگر تبی نبود، حداقل کش موجود chrome.storage.local را بخوان
        syncFromChromeStorage().then((res) => resolve({ ok: res, error: 'NO_TABS_FOUND' }));
        return;
      }

      let found = false;
      let responders = 0;
      let staleTabs = 0;
      for (const tab of tabs) {
        if (!tab.id) continue;
        await new Promise((resTab) => {
          chrome.tabs.sendMessage(tab.id, { action: 'GET_BEHESTAN_DATA' }, (response) => {
            if (chrome.runtime.lastError || !response) {
              // محتوای این تب از نسخه قبلی/نامساز افزونه است — یک بار رفرش سامانه لازم است
              staleTabs++;
            } else if (response.isLoggedIn) {
              responders++;
              found = true;
              if (response.university) {
                localStorage.setItem('sarvestan_selected_university', response.university);
              }
            } else {
              responders++;
            }
            // تحریک فراخوانی سنک فعال گزارش‌ها در تب بهستان
            try {
              chrome.tabs.sendMessage(tab.id, { action: 'SARVESTAN_FORCE_SYNC' }, () => {});
            } catch {}
            resTab();
          });
        });
      }

      // خواندن مجدد تمامی داده‌ها از chrome.storage.local
      const synced = await syncFromChromeStorage();
      resolve({ ok: found || synced, tabs: tabs.length, responders, staleTabs });
    });
  });
}

/**
 * ورود دادهٔ ترم‌محور (schedule/exams) از بستر افزونه با همان منطق اندروید:
 * به‌جای بازنویسی خام، از موتور استور عبور می‌کند تا ویرایش‌های دستی کاربر
 * (درس حذف‌شده، استاد/واحد ویرایش‌شده، درس اضافه‌شدهٔ دستی) روی سنک زنده حفظ شود.
 * خروجی: آیا تغییری اعمال شد؟
 */
function applyTermWise(kind, incoming) {
  if (!incoming) return false;
  const map = asTermMap(typeof incoming === 'string' ? safeParse(incoming) : incoming);
  let changedAny = false;
  const snap = getSnapshot();
  const currentMap = kind === 'schedule' ? (snap?.schedule || {}) : (snap?.exams || {});
  for (const [termId, list] of Object.entries(map)) {
    if (!Array.isArray(list)) continue;
    const cur = Array.isArray(currentMap[termId]) ? currentMap[termId] : [];
    if (JSON.stringify(cur) === JSON.stringify(list)) continue; // بی‌تغییر
    if (kind === 'schedule') setScheduleForTerm(String(termId), list);
    else setExamsForTerm(String(termId), list);
    changedAny = true;
  }
  return changedAny;
}

function safeParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

async function syncFromChromeStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return false;
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (all) => {
      if (chrome.runtime?.lastError || !all) {
        resolve(false);
        return;
      }

      let changed = false;
      let hasValidProfile = false;

      Object.entries(STORAGE_KEYS).forEach(([_, key]) => {
        // schedule/exams با موتور merge استور اعمال می‌شوند (پایین‌تر) — نه بازنویسی خام
        if (key === STORAGE_KEYS.schedule || key === STORAGE_KEYS.exams) return;
        if (all[key] !== undefined) {
          const val = typeof all[key] === 'string' ? all[key] : JSON.stringify(all[key]);
          if (localStorage.getItem(key) === val) return; // بی‌تغییر
          localStorage.setItem(key, val);
          changed = true;
        }
      });

      // برنامه و امتحانات: از مسیر استاندارد استور (حفظ ادیت‌ها مثل اندروید)
      const scheduleVal = all[STORAGE_KEYS.schedule];
      if (scheduleVal !== undefined) {
        if (applyTermWise('schedule', scheduleVal)) changed = true;
      }
      const examsVal = all[STORAGE_KEYS.exams];
      if (examsVal !== undefined) {
        if (applyTermWise('exams', examsVal)) changed = true;
      }

      const prof = all[STORAGE_KEYS.profile];
      if (prof) {
        const p = typeof prof === 'string' ? JSON.parse(prof) : prof;
        if (p && (p.isLoggedIn || (p.studentId && p.studentId !== 'ـ'))) {
          hasValidProfile = true;
          applyManualSession({
            studentId: p.studentId,
            fullName: p.fullName || p.studentName,
            university: resolveActiveUniversity(p),
            isLoggedIn: true,
          });
        }
      }

      if (changed) {
        notifyStoreChange();
      }
      resolve(hasValidProfile);
    });
  });
}

/**
 * مقداردهی اولیه لیسنرهای افزونه
 */
export function initExtensionBridge() {
  if (typeof window === 'undefined') return;

  // ۱. پارس پارامترهای اولیه URL در صورت باز شدن توسط contentScript
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'overlay') {
      const std = params.get('std');
      const name = params.get('name');
      const uni = params.get('uni');
      const loggedInParam = params.get('loggedIn') === 'true';
      const hasIdentity = Boolean(std && std !== 'ـ') || Boolean(name && name !== 'دانشجوی میهمان');
      const isLoggedIn = loggedInParam || hasIdentity;

      const curProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}');
      const updated = {
        ...curProfile,
        fullName: (name && name !== 'دانشجوی میهمان' && name !== 'دانشجو') ? name : (curProfile.fullName || 'دانشجو'),
        studentId: (std && std !== 'ـ') ? std : (curProfile.studentId || 'ـ'),
        gpa: (params.get('gpa') && params.get('gpa') !== 'ـ') ? params.get('gpa') : (curProfile.gpa || 'ـ'),
        totalUnitsPassed: (Number(params.get('units')) > 0) ? Number(params.get('units')) : (curProfile.totalUnitsPassed || 0),
        standing: (params.get('standing') && params.get('standing') !== 'ـ') ? params.get('standing') : (curProfile.standing || 'ـ'),
        photo: params.get('photo') || curProfile.photo || null,
        university: uni || curProfile.university || resolveActiveUniversity(curProfile),
        isLoggedIn: isLoggedIn || curProfile.isLoggedIn || false,
      };

      if (updated.fullName || updated.studentId !== 'ـ' || updated.isLoggedIn) {
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(updated));
        if (updated.university) {
          localStorage.setItem('sarvestan_selected_university', updated.university);
        }
        applyManualSession({
          studentId: updated.studentId,
          fullName: updated.fullName,
          university: updated.university,
          isLoggedIn: updated.isLoggedIn,
        });
        notifyStoreChange();
      }
    }
  } catch {}

  // ۲. شنود پیام‌های پست‌شده از طریق contentScript آی‌فریم (postMessage)
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.action === 'INIT_LIVE_BEHESTAN_SESSION') {
      const payload = event.data.payload;
      if (payload) {
        try {
          const prev = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}');
          const merged = {
            ...prev,
            ...payload,
            fullName: (payload.fullName && payload.fullName !== 'دانشجو' && payload.fullName !== 'دانشجوی میهمان')
              ? payload.fullName
              : (payload.studentName && payload.studentName !== 'دانشجو' && payload.studentName !== 'دانشجوی میهمان')
              ? payload.studentName
              : (prev.fullName || 'دانشجو'),
            studentId: (payload.studentId && payload.studentId !== 'ـ') ? payload.studentId : (prev.studentId || 'ـ'),
            gpa: (payload.gpa && payload.gpa !== 'ـ') ? payload.gpa : (prev.gpa || 'ـ'),
            totalUnitsPassed: (payload.totalUnitsPassed && Number(payload.totalUnitsPassed) > 0) ? payload.totalUnitsPassed : (prev.totalUnitsPassed || 0),
            standing: (payload.standing && payload.standing !== 'ـ') ? payload.standing : (prev.standing || 'ـ'),
            photo: payload.photo || prev.photo || null,
            isLoggedIn: true,
          };
          localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(merged));
          applyManualSession({
            studentId: merged.studentId,
            fullName: merged.fullName,
            university: resolveActiveUniversity(merged),
            isLoggedIn: true,
          });
          notifyStoreChange();
        } catch {}
      }
    }

    if (event.data.action === 'SARVESTAN_DATA_UPDATE') {
      const { dataType, payload } = event.data;
      if (dataType && payload) {
        const key = STORAGE_KEYS[dataType] || `sarvestan_live_${dataType}`;
        try {
          if (dataType === 'profile_update' || dataType === 'profile') {
            const prevRaw = localStorage.getItem(STORAGE_KEYS.profile) || '{}';
            const prev = JSON.parse(prevRaw);
            const merged = { ...prev, ...payload };
            if (payload.fullName || payload.studentId) merged.isLoggedIn = true;
            const mergedJson = JSON.stringify(merged);
            if (mergedJson === prevRaw) return; // بی‌تغییر — بدون ریرندر
            localStorage.setItem(STORAGE_KEYS.profile, mergedJson);
            applyManualSession({
              studentId: merged.studentId,
              fullName: merged.fullName || merged.studentName,
              university: resolveActiveUniversity(merged),
              isLoggedIn: true,
            });
          } else if (dataType === 'schedule' || dataType === 'schedule_enrich') {
            // از موتور merge استور — حفظ ادیت‌ها مثل اندروید
            // شکل ۱: { termId, courses } — شکل ۲: MAP { termId: [...] }
            const termShape = payload?.termId ? { [payload.termId]: payload.courses || [] } : null;
            const mapShape = (!termShape && payload && typeof payload === 'object' && !Array.isArray(payload.courses))
              ? payload
              : null;
            if (termShape || mapShape) applyTermWise('schedule', termShape || mapShape);
          } else if (dataType === 'exams') {
            const termShape = payload?.termId ? { [payload.termId]: payload.exams || [] } : null;
            const mapShape = (!termShape && payload && typeof payload === 'object' && !Array.isArray(payload.exams))
              ? payload
              : null;
            if (termShape || mapShape) applyTermWise('exams', termShape || mapShape);
          } else {
            const json = JSON.stringify(payload);
            if (localStorage.getItem(key) === json) return; // بی‌تغییر — بدون ریرندر
            localStorage.setItem(key, json);
          }
          notifyStoreChange();
        } catch {}
      }
    }
  });

  // ۳. شنود تغییرات زنده chrome.storage.onChanged برای تب‌های مستقل افزونه
  // مهم: هر رخداد → اگر مقدار واقعاً عوض نشده، نادیده گرفته می‌شود؛
  // وگرنه هر نوشتن تکراریِ چند تب = ریرندر کامل داشبورد = کندی شدید
  // schedule/exams از موتور merge استور عبور می‌کنند — حفظ ادیت‌ها مثل اندروید
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      let changed = false;
      for (const [key, change] of Object.entries(changes)) {
        if (key.startsWith('sarvestan_') && change.newValue !== undefined) {
          if (key === STORAGE_KEYS.schedule) {
            if (applyTermWise('schedule', change.newValue)) changed = true;
            continue;
          }
          if (key === STORAGE_KEYS.exams) {
            if (applyTermWise('exams', change.newValue)) changed = true;
            continue;
          }
          const val = typeof change.newValue === 'string' ? change.newValue : JSON.stringify(change.newValue);
          if (localStorage.getItem(key) === val) continue; // بی‌تغییر — هیچ اقدامی
          localStorage.setItem(key, val);
          changed = true;
          if (key === STORAGE_KEYS.profile) {
            const p = change.newValue;
            if (p && (p.isLoggedIn || p.studentId)) {
              applyManualSession({
                studentId: p.studentId,
                fullName: p.fullName || p.studentName,
                university: resolveActiveUniversity(p),
                isLoggedIn: true,
              });
            }
          }
        }
      }
      if (changed) {
        notifyStoreChange();
      }
    });
  }

  // ۴. خواندن اولیه از chrome.storage.local
  syncFromChromeStorage();
}

/**
 * انبارداتا تشخیصی: چه چیزی واقعاً در chrome.storage هست؟
 * برای جداسازی «دریافت از سامانه» از «نمایش در داشبورد»
 */
function parseJsonSafe(v) {
  try {
    return typeof v === 'string' ? JSON.parse(v) : v;
  } catch {
    return null;
  }
}

export async function getStorageInventory() {
  const src = (typeof chrome !== 'undefined' && chrome.storage?.local)
    ? await new Promise((resolve) => chrome.storage.local.get(null, (all) => resolve(all)))
    : (typeof localStorage !== 'undefined' ? { ...localStorage } : null);
  if (!src) return [];

  const rows = [];
  const prof = parseJsonSafe(src.sarvestan_live_profile);
  const profOk = Boolean(prof && (prof.isLoggedIn || (prof.studentId && prof.studentId !== 'ـ')));
  rows.push({
    id: 'profile',
    label: 'پروفایل',
    ok: profOk,
    detail: profOk ? `${prof.fullName || '—'} · ${prof.studentId || '—'}` : 'خالی',
  });

  const termMapOk = (raw) => {
    const m = parseJsonSafe(raw);
    if (!m || typeof m !== 'object') return { ok: false, count: 0, terms: 0 };
    const entries = Object.entries(m).filter(([, v]) => Array.isArray(v) && v.length);
    return {
      ok: entries.length > 0,
      count: entries.reduce((a, [, v]) => a + v.length, 0),
      terms: entries.length,
    };
  };

  const sched = termMapOk(src.sarvestan_live_schedule);
  rows.push({
    id: 'schedule',
    label: 'برنامه هفتگی',
    ok: sched.ok,
    detail: sched.ok ? `${sched.count} درس · ${sched.terms} ترم` : 'خالی',
  });

  const exams = termMapOk(src.sarvestan_live_exams);
  rows.push({
    id: 'exams',
    label: 'برنامه امتحانات',
    ok: exams.ok,
    detail: exams.ok ? `${exams.count} امتحان · ${exams.terms} ترم` : 'خالی',
  });

  const trans = Array.isArray(parseJsonSafe(src.sarvestan_live_transcripts)) ? parseJsonSafe(src.sarvestan_live_transcripts) : [];
  rows.push({
    id: 'transcripts',
    label: 'کارنامه',
    ok: trans.length > 0,
    detail: trans.length ? `${trans.length} ترم` : 'خالی',
  });

  const courses = Array.isArray(parseJsonSafe(src.sarvestan_live_courses)) ? parseJsonSafe(src.sarvestan_live_courses) : [];
  rows.push({
    id: 'courses',
    label: 'دوس (کارت‌ها)',
    ok: courses.length > 0,
    detail: courses.length ? `${courses.length} درس` : 'خالی',
  });

  const fin = parseJsonSafe(src.sarvestan_live_finance);
  rows.push({
    id: 'finance',
    label: 'مالی',
    ok: Boolean(fin && typeof fin === 'object'),
    detail: fin && typeof fin === 'object' ? (fin.totalDebtToman != null ? `${Number(fin.totalDebtToman).toLocaleString('fa-IR')} تومان` : 'دارد') : 'خالی',
  });

  const extraRows = [
    ['sarvestan_live_workflows', 'گردش‌کارها', (v) => (Array.isArray(v) ? `${v.length} مورد` : null)],
    ['sarvestan_live_curriculum_stats', 'چارت درسی', () => 'دارد'],
    ['sarvestan_live_announcements', 'اطلاعیه‌ها', (v) => (Array.isArray(v) ? `${v.length} مورد` : null)],
    ['sarvestan_live_reg77', 'گزارش ۷۷', () => 'دارد'],
  ];
  for (const [key, label, detailFn] of extraRows) {
    const v = parseJsonSafe(src[key]);
    const ok = Boolean(v && (!Array.isArray(v) || v.length));
    rows.push({ id: key, label, ok, detail: ok ? detailFn(v) : 'خالی' });
  }

  return rows;
}
