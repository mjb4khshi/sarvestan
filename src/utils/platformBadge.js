/**
 * برچسب پلتفرم سروستان بر اساس بافت اجرا:
 * - نسخه اندروید (نیتیو): همراه
 * - نسخه افزونه مرورگر (اکستنشن): رومیزی
 * - نسخه وب و PWA (سافاری / کروم وب): تارنما
 */
export function getAppPlatformBadge() {
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    return 'همراه';
  }
  if (typeof window !== 'undefined' && (Boolean(window.chrome?.runtime?.id) || window.__SARVESTAN_EXTENSION__)) {
    return 'رومیزی';
  }
  return 'تارنما';
}
