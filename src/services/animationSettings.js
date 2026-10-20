/**
 * مدیریت حالت انیمیشن و بهینه‌سازی مصرف باتری در سروستان
 * ۳ سطح:
 * ۰: حداقل انیمیشن / صرفه‌جویی حداکثری باتری (سریع‌ترین عملکرد)
 * ۱: متوازن (پیش‌فرض - انیمیشن‌های سبک و روان)
 * ۲: انیمیشن کامل (حداکثر زیبایی بصری و ترنزیشن‌های نرم)
 */

const STORAGE_KEY = 'sarvestan_animation_level';
const EVENT_NAME = 'sarvestanAnimationLevelChanged';

export const ANIMATION_LEVELS = [
  {
    level: 0,
    id: 'minimal',
    title: 'صرفه‌جویی باتری',
    subtitle: 'حداقل انیمیشن و ترنزیشن، سریع‌ترین پاسخ‌دهی و کمترین مصرف پردازنده',
    badge: 'بهینه و سریع',
    badgeColor: 'bg-success-soft text-success',
  },
  {
    level: 1,
    id: 'balanced',
    title: 'متوازن',
    subtitle: 'انیمیشن‌های سبک و استاندارد، تعادل عالی بین سرعت و زیبایی',
    badge: 'پیش‌فرض',
    badgeColor: 'bg-primary-soft text-primary',
  },
  {
    level: 2,
    id: 'full',
    title: 'انیمیشن کامل',
    subtitle: 'تمام افکت‌ها، حرکات نرم، پرش فنری و ترنزیشن‌های کامل Sarv UI',
    badge: 'حداکثر زیبایی',
    badgeColor: 'bg-secondary-soft text-secondary',
  },
];

export function getAnimationLevel() {
  try {
    if (typeof localStorage === 'undefined') return 1;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null && stored !== '') {
      const parsed = parseInt(stored, 10);
      if (parsed === 0 || parsed === 1 || parsed === 2) return parsed;
    }
  } catch {}
  return 1; // پیش‌فرض متوازن
}

export function applyAnimationLevel(level) {
  if (typeof document === 'undefined') return;
  const validLevel = level === 0 || level === 2 ? level : 1;
  document.documentElement.setAttribute('data-anim-level', String(validLevel));
}

export function setAnimationLevel(level) {
  const validLevel = level === 0 || level === 2 ? level : 1;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(validLevel));
    }
  } catch {}

  applyAnimationLevel(validLevel);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { level: validLevel } })
    );
  }
}

// اعمال خودکار روی بارگذاری اولیه اسکریپت
if (typeof document !== 'undefined') {
  applyAnimationLevel(getAnimationLevel());
}
