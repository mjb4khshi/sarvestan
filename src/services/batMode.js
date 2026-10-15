/**
 * سرویس مدیریت ایستر اگ «حالت بتمن» (Bat-Mode) و اعلان شبانه گاتهام
 * با نگه داشتن ۵ ثانیه روی تم بتمن فعال می‌شود:
 * ۱. تغییر آیکون برنامه به آیکون اختصاصی بتمن
 * ۲. فعال‌سازی پس‌زمینه خفاشی و بتمنی
 * ۳. امکان فعال‌سازی اعلان شبانه ساعت ۱۱ شب («احتیاج شهر به بتمن»)
 */

import { useState, useEffect } from 'react';
import { setAppIcon } from './appIcon';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  openNotificationSettings,
} from './classAlarms';

const STORAGE_KEY = 'sarvestan_bat_mode';
const BAT_NOTIF_KEY = 'sarvestan_bat_notif_enabled';
const BAT_SCHEDULED_IDS_KEY = 'sarvestan_bat_scheduled_ids';
const BAT_CHANGE_EVENT = 'sarvestan-bat-mode-change';
const BAT_NOTIF_EVENT = 'sarvestan-bat-notif-change';
const BAT_NOTIF_BASE_ID = 95000;

export function isBatModeActive() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function isBatNotifEnabled() {
  try {
    return localStorage.getItem(BAT_NOTIF_KEY) === 'true';
  } catch {
    return false;
  }
}

export async function enableBatMode() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
    // فعال‌سازی آیکون بتمن برای اپلیکیشن
    await setAppIcon('batman');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BAT_CHANGE_EVENT, { detail: { active: true } }));
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
    return true;
  } catch (err) {
    console.warn('[batMode] activate error:', err);
    return false;
  }
}

export async function disableBatMode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    // بازگرداندن آیکون برنامه به حالت پیش‌فرض
    try {
      await setAppIcon('default');
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BAT_CHANGE_EVENT, { detail: { active: false } }));
    }
    return true;
  } catch {
    return false;
  }
}

export async function toggleBatMode() {
  if (isBatModeActive()) {
    await disableBatMode();
    return false;
  } else {
    await enableBatMode();
    return true;
  }
}

/**
 * ایجاد آیتم‌های اعلان شبانه رأس ساعت ۱۱ شب (۲۳:۰۰) برای ۴۵ روز آینده
 */
function buildBatNotificationItems(daysCount = 45) {
  const items = [];
  const now = new Date();
  for (let i = 0; i < daysCount; i++) {
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 23, 0, 0, 0);
    const triggerAtMs = target.getTime();
    if (triggerAtMs > now.getTime() + 15000) {
      items.push({
        id: BAT_NOTIF_BASE_ID + i,
        triggerAtMs,
        title: 'احتیاج شهر به بتمن',
        body: 'ساعت ۱۱ شب شد؛ گاتهام در تاریکی فرو رفته و شهر به بتمن نیاز دارد.',
        url: null,
      });
    }
  }
  return items;
}

/**
 * زمان‌بندی اعلان‌های شبانه ۲۳:۰۰ در AlarmManager اندروید
 */
export async function scheduleBatNightNotification() {
  if (!isBatNotifEnabled()) return { ok: false };
  const items = buildBatNotificationItems(45);
  if (!items.length) return { ok: true, scheduled: 0 };

  // لغو شناسه‌های قبلی
  await cancelBatNightNotification();

  if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.ClassAlarms) {
    try {
      const p = window.Capacitor.Plugins.ClassAlarms;
      if (p.scheduleReminders) {
        const payload = items.map((x) => ({
          id: x.id,
          triggerAtMs: x.triggerAtMs,
          title: x.title,
          body: x.body,
          url: null,
          dndMode: null,
        }));
        const res = await p.scheduleReminders({ items: payload });
        localStorage.setItem(BAT_SCHEDULED_IDS_KEY, JSON.stringify(items.map((x) => x.id)));
        return { ok: true, scheduled: res.scheduled ?? items.length };
      }
    } catch (err) {
      console.warn('[batMode] schedule notification error:', err);
    }
  }

  localStorage.setItem(BAT_SCHEDULED_IDS_KEY, JSON.stringify(items.map((x) => x.id)));
  return { ok: true, scheduled: items.length };
}

/**
 * لغو اعلان‌های شبانه بتمن
 */
export async function cancelBatNightNotification() {
  try {
    const raw = localStorage.getItem(BAT_SCHEDULED_IDS_KEY);
    if (raw) {
      const ids = JSON.parse(raw);
      if (Array.isArray(ids) && ids.length) {
        if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.ClassAlarms) {
          const p = window.Capacitor.Plugins.ClassAlarms;
          if (p.cancelReminders) {
            await p.cancelReminders({ ids });
          }
        }
      }
      localStorage.removeItem(BAT_SCHEDULED_IDS_KEY);
    }
  } catch {}
}

/**
 * ارسال اعلان تستی فوری برای راستی‌آزمایی صدا و مجوز
 */
export async function testBatNotification() {
  const title = 'احتیاج شهر به بتمن';
  const body = 'ساعت ۱۱ شب شد؛ گاتهام در تاریکی فرو رفته و شهر به بتمن نیاز دارد.';

  // ۱. اولویت با پلاگین نیتیو اندروید
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.ClassAlarms) {
    const p = window.Capacitor.Plugins.ClassAlarms;
    if (p.testNotification) {
      try {
        const res = await p.testNotification({ title, body });
        return { ok: true, ...res };
      } catch (err) {
        console.warn('[batMode] native testNotification failed:', err);
      }
    }
  }

  // ۲. فال‌بک مرورگر و PWA
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission !== 'granted') {
        const res = await Notification.requestPermission();
        if (res !== 'granted') {
          return { ok: false, error: 'مجوز اعلان توسط کاربر تأیید نشد' };
        }
      }
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }
  }

  return { ok: false, error: 'اعلان در این بستر در دسترس نیست' };
}

// تایمر زنده محیط وب برای اعلان رأس ساعت ۱۱ شب در صورت باز بودن اپلیکیشن
let batWebTimer = null;
export function initBatWebTimer() {
  if (typeof window === 'undefined') return;
  if (batWebTimer) clearTimeout(batWebTimer);
  if (!isBatNotifEnabled()) return;

  const now = new Date();
  const next23 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0, 0);
  if (now.getTime() >= next23.getTime()) {
    next23.setDate(next23.getDate() + 1);
  }
  const delay = Math.max(1000, next23.getTime() - now.getTime());

  batWebTimer = setTimeout(() => {
    if (isBatNotifEnabled()) {
      testBatNotification();
      // زمان‌بندی روز بعد
      initBatWebTimer();
    }
  }, delay);
}

/**
 * فعال یا غیرفعال کردن اعلان شبانه با درخواست دسترسی لازم
 */
export async function setBatNotifEnabled(enabled) {
  if (enabled) {
    // ۱. بررسی و درخواست مجوز اعلان
    const perm = await requestNotificationPermission();
    if (!perm?.granted && perm?.blockedInSettings) {
      return {
        ok: false,
        blockedInSettings: true,
        error: 'دسترسی اعلان‌ها در تنظیمات گوشی غیرفعال است. لطفاً آن را فعال کنید.',
      };
    }
    if (!perm?.granted) {
      return {
        ok: false,
        error: 'دسترسی ارسال اعلان داده نشد.',
      };
    }

    localStorage.setItem(BAT_NOTIF_KEY, 'true');
    await scheduleBatNightNotification();
    initBatWebTimer();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BAT_NOTIF_EVENT, { detail: { enabled: true } }));
    }
    return { ok: true };
  } else {
    localStorage.removeItem(BAT_NOTIF_KEY);
    await cancelBatNightNotification();
    if (batWebTimer) {
      clearTimeout(batWebTimer);
      batWebTimer = null;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BAT_NOTIF_EVENT, { detail: { enabled: false } }));
    }
    return { ok: true };
  }
}

export function useBatMode() {
  const [active, setActive] = useState(isBatModeActive);
  const [notifEnabled, setNotifEnabled] = useState(isBatNotifEnabled);

  useEffect(() => {
    const handler = (e) => {
      setActive(Boolean(e.detail?.active));
    };
    const notifHandler = (e) => {
      setNotifEnabled(Boolean(e.detail?.enabled));
    };
    window.addEventListener(BAT_CHANGE_EVENT, handler);
    window.addEventListener(BAT_NOTIF_EVENT, notifHandler);
    return () => {
      window.removeEventListener(BAT_CHANGE_EVENT, handler);
      window.removeEventListener(BAT_NOTIF_EVENT, notifHandler);
    };
  }, []);

  return {
    isBatMode: active,
    enableBatMode,
    disableBatMode,
    toggleBatMode,
    isBatNotifEnabled: notifEnabled,
    setBatNotifEnabled,
    testBatNotification,
    checkNotificationPermission,
    requestNotificationPermission,
    openNotificationSettings,
  };
}
