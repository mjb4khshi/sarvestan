/**
 * Extension Bridge for Sarvestan 2.0 (Chrome Extension / Overlay)
 * Handles communication between Behestan/Golestan content script, background, and the React App
 */
import { notifyStoreChange } from './behestan/store';
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
 */
export async function checkExtensionSync() {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
    // در محیط وب معمولی، داده‌های لوکال‌استوریج را بررسی کن
    const prof = localStorage.getItem(STORAGE_KEYS.profile);
    return { ok: !!prof, source: 'localStorage' };
  }

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
        if (all[key] !== undefined) {
          const val = typeof all[key] === 'string' ? all[key] : JSON.stringify(all[key]);
          localStorage.setItem(key, val);
          changed = true;
        }
      });

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
            const prev = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}');
            const merged = { ...prev, ...payload };
            if (payload.fullName || payload.studentId) merged.isLoggedIn = true;
            localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(merged));
            applyManualSession({
              studentId: merged.studentId,
              fullName: merged.fullName || merged.studentName,
              university: resolveActiveUniversity(merged),
              isLoggedIn: true,
            });
          } else {
            localStorage.setItem(key, JSON.stringify(payload));
          }
          notifyStoreChange();
        } catch {}
      }
    }
  });

  // ۳. شنود تغییرات زنده chrome.storage.onChanged برای تب‌های مستقل افزونه
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      let changed = false;
      for (const [key, change] of Object.entries(changes)) {
        if (key.startsWith('sarvestan_') && change.newValue !== undefined) {
          const val = typeof change.newValue === 'string' ? change.newValue : JSON.stringify(change.newValue);
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
