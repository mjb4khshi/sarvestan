/**
 * ماژول جانشین (Stub) یادآورهای افزونه برای نسخه اندروید (Capacitor)
 * در اندروید یادآورها از طریق پلاگین نیتیو ClassAlarmsPlugin مدیریت می‌شوند.
 */

export function supportsExtensionReminders() {
  return false;
}

export async function ensureNotificationPermission() {
  return false;
}

export async function scheduleExtensionReminders() {
  return { ok: false };
}

export async function cancelExtensionReminders() {
  return { ok: true };
}

export async function showExtensionNotification() {
  return false;
}
