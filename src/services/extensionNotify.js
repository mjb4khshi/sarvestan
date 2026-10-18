/**
 * اعلان و یادآور برای نسخهٔ افزونه — جایگزین پلاگین اندروید ClassAlarms
 * مجوز + نمایش از chrome.notifications و زمان‌بندی آینده از chrome.alarms
 * (در سرویس وورکر background.js) — هر دو فقط در محیط افزونه فعال است.
 */
import { isExtensionRuntime } from './extensionRuntime';

export function supportsExtensionReminders() {
  return (
    isExtensionRuntime() &&
    typeof chrome !== 'undefined' &&
    Boolean(chrome.runtime?.sendMessage) &&
    Boolean(chrome.notifications)
  );
}

/**
 * درخواست/اطمینان مجوز اعلان (DOM Notification در صفحهٔ افزونه کافی است
 * و مستقیم به chrome.notifications می‌رسد)
 */
export async function ensureNotificationPermission() {
  if (typeof Notification === 'undefined') return false;
  try {
    if (Notification.permission === 'granted') return true;
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

/**
 * زمان‌بندی یادآورها از طریق سرویس وورکر افزونه (chrome.alarms)
 * ورودی: آیتم‌های { id, triggerAtMs, title, body, url }
 */
const MAX_SCHEDULE_ITEMS = 120;

export async function scheduleExtensionReminders(items = []) {
  if (!supportsExtensionReminders()) {
    return { ok: false, error: 'بستر افزونه در دسترس نیست' };
  }
  const now = Date.now();
  const future = (items || [])
    .filter((i) => i && i.triggerAtMs > now && (i.title || i.body))
    .sort((a, b) => a.triggerAtMs - b.triggerAtMs)
    .slice(0, MAX_SCHEDULE_ITEMS);

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        {
          action: 'SARVESTAN_SCHEDULE_NOTIFS',
          items: future.map((i) => ({
            id: String(i.id),
            triggerAtMs: i.triggerAtMs,
            title: i.title,
            body: i.body || '',
          })),
        },
        (res) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(res || { ok: false, error: 'بدون پاسخ سرویس وورکر' });
        }
      );
    } catch (e) {
      resolve({ ok: false, error: String(e?.message || e) });
    }
  });
}

/** لغو یادآورها — ids = null یعنی همهٔ یادآورهای سروستان */
export async function cancelExtensionReminders(ids = null) {
  if (!supportsExtensionReminders()) return { ok: false };
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ action: 'SARVESTAN_CANCEL_NOTIFS', ids }, (res) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(res || { ok: true });
      });
    } catch (e) {
      resolve({ ok: false, error: String(e?.message || e) });
    }
  });
}

/** اعلان زندهٔ فوری از صفحهٔ افزونه (برای تست / یادآورهای درون‌برنامه‌ای) */
export async function showExtensionNotification(title, body = '') {
  if (!supportsExtensionReminders()) {
    return { ok: false, error: 'بستر افزونه در دسترس نیست' };
  }
  try {
    chrome.notifications.create(`sarv-live-${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: String(title || 'سروستان'),
      message: String(body || ''),
      priority: 2,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}
