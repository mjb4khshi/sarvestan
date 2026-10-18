/**
 * تشخیص محیط افزونه (Chrome / Edge / Firefox) — بدون هیچ وابستگی
 * در محیط افزونه:
 *  - هیچ فرم لاگینی نمایش داده نمی‌شود
 *  - داشبورد هیچ fetch مستقیمی نمی‌زند
 *  - داده‌ها فقط از تب‌های باز سامانه دانشگاه (اینترسپتور ← chrome.storage) خوانده می‌شوند
 */
export function isExtensionRuntime() {
  try {
    const p = window.location.protocol;
    return p === 'chrome-extension:' || p === 'moz-extension:';
  } catch {
    return false;
  }
}
