/**
 * Extension Bridge for Sarvestan 2.0 (Chrome Extension / Overlay)
 * Handles communication between Behestan content script / tabs and the React App
 */
import { notifyStoreChange } from './behestan/store';
import { applyManualSession, clearSession } from './behestan/session';

const STORAGE_KEYS = {
  profile: 'sarvestan_live_profile',
  schedule: 'sarvestan_live_schedule',
  exams: 'sarvestan_live_exams',
  transcripts: 'sarvestan_live_transcripts',
  finance: 'sarvestan_live_finance',
  courses: 'sarvestan_live_courses',
  workflows: 'sarvestan_live_workflows',
  announcements: 'sarvestan_live_announcements',
  curriculumStats: 'sarvestan_live_curriculum_stats',
};

/**
 * بررسی اینکه آیا اپ داخل آی‌فریم بهستان در حال اجراست یا خیر
 */
export function isBehestanOverlay() {
  if (typeof window === 'undefined') return false;
  return (
    window.self !== window.top ||
    window.location.search.includes('mode=overlay') ||
    window.location.hostname.includes('kntu.ac.ir')
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
 * هدایت به تب سامانه بهستان یا باز کردن آن در تب جدید
 */
export function openBehestanPage() {
  const url = 'https://behestan.kntu.ac.ir/';
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    try {
      chrome.tabs.query({ url: ['*://behestan.kntu.ac.ir/*', '*://*.kntu.ac.ir/*'] }, (tabs) => {
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
 * استعلام و همگام‌سازی اطلاعات از تب‌های باز بهستان
 */
export async function checkExtensionSync() {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
    // در محیط وب معمولی، داده‌های لوکال‌استوریج را بررسی کن
    const prof = localStorage.getItem(STORAGE_KEYS.profile);
    return { ok: !!prof, source: 'localStorage' };
  }

  return new Promise((resolve) => {
    chrome.tabs.query({ url: ['*://behestan.kntu.ac.ir/*', '*://*.kntu.ac.ir/*'] }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        resolve({ ok: false, error: 'NO_TABS_FOUND' });
        return;
      }

      let found = false;
      for (const tab of tabs) {
        if (!tab.id) continue;
        await new Promise((resTab) => {
          chrome.tabs.sendMessage(tab.id, { action: 'GET_BEHESTAN_DATA' }, (response) => {
            if (chrome.runtime?.lastError || !response) {
              resTab();
              return;
            }
            if (response.isLoggedIn && response.studentId && response.studentId !== 'ـ') {
              found = true;
              try {
                localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(response));
                applyManualSession({
                  studentId: response.studentId,
                  fullName: response.studentName,
                  university: 'kntu',
                  isLoggedIn: true,
                });
                notifyStoreChange();
              } catch {}
            }
            resTab();
          });
        });
      }

      resolve({ ok: found });
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
    if (params.get('mode') === 'overlay' && params.get('std')) {
      const std = params.get('std');
      if (std && std !== 'ـ') {
        const curProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}');
        const updated = {
          ...curProfile,
          fullName: params.get('name') || curProfile.fullName || 'دانشجو',
          studentId: std,
          gpa: params.get('gpa') || curProfile.gpa || 'ـ',
          totalUnitsPassed: Number(params.get('units')) || curProfile.totalUnitsPassed || 0,
          standing: params.get('standing') || curProfile.standing || 'ـ',
          photo: params.get('photo') || curProfile.photo || null,
          isLoggedIn: params.get('loggedIn') === 'true',
        };
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(updated));
        applyManualSession({
          studentId: std,
          fullName: updated.fullName,
          university: 'kntu',
          isLoggedIn: updated.isLoggedIn,
        });
        notifyStoreChange();
      }
    }
  } catch {}

  // ۲. شنود پیام‌های پست‌شده از طریق contentScript آی‌فریم
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.action === 'INIT_LIVE_BEHESTAN_SESSION') {
      const payload = event.data.payload;
      if (payload) {
        try {
          const prev = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}');
          const merged = { ...prev, ...payload, isLoggedIn: true };
          localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(merged));
          applyManualSession({
            studentId: merged.studentId,
            fullName: merged.fullName || merged.studentName,
            university: 'kntu',
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
          localStorage.setItem(key, JSON.stringify(payload));
          notifyStoreChange();
        } catch {}
      }
    }
  });

  // ۳. بازیابی داده‌ها از chrome.storage.local در صورت در دسترس بودن
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get(null, (all) => {
      if (chrome.runtime?.lastError || !all) return;
      let changed = false;
      Object.keys(STORAGE_KEYS).forEach((k) => {
        const key = STORAGE_KEYS[k];
        if (all[key] && !localStorage.getItem(key)) {
          localStorage.setItem(key, typeof all[key] === 'string' ? all[key] : JSON.stringify(all[key]));
          changed = true;
        }
      });
      if (changed) notifyStoreChange();
    });
  }
}
