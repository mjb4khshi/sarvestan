import { toFaDigits } from '../utils/faDigits.js';

/**
 * تبدیل تاریخ به رشته استاندارد YYYY-MM-DD بر اساس زمان محلی (جلوگیری از باگ منطقه زمانی UTC)
 */
export function toLocalDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * تبدیل تاریخ به اجزای تقویم هجری شمسی با Intl
 */
export function getPersianParts(d = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(d);
    const pMap = {};
    for (const p of parts) pMap[p.type] = p.value;
    return {
      year: parseInt(pMap.year) || 1405,
      month: parseInt(pMap.month) || 1,
      day: parseInt(pMap.day) || 1,
    };
  } catch {
    return { year: 1405, month: 1, day: 1 };
  }
}

/**
 * دریافت ماتریس روزهای یک ماه شمسی برای تقویم — کاملاً دقیق بر اساس ساعت ۱۲ ظهر محلی
 */
export function getPersianMonthGrid(refDate = new Date()) {
  const p = getPersianParts(refDate);

  // روز اول ماه شمسی جاری در ساعت ۱۲ ظهر (جلوگیری از خطای مرز نیمه‌شب و DST)
  const firstDay = new Date(
    refDate.getFullYear(),
    refDate.getMonth(),
    refDate.getDate() - (p.day - 1),
    12,
    0,
    0
  );

  // تعداد روزهای ماه شمسی (ماه‌های ۱ تا ۶: ۳۱ روز، ۷ تا ۱۱: ۳۰ روز، ۱۲: ۲۹ یا ۳۰ روز)
  let daysInMonth = 30;
  if (p.month <= 6) {
    daysInMonth = 31;
  } else if (p.month === 12) {
    const test30 = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + 29, 12, 0, 0);
    const testP = getPersianParts(test30);
    daysInMonth = testP.month === 12 ? 30 : 29;
  }

  // روز هفته برای اول ماه (شنبه=۰، یکشنبه=۱، ...، جمعه=۶)
  const startDayOfWeek = (firstDay.getDay() + 1) % 7;

  let monthName = 'ماه';
  try {
    monthName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long' }).format(firstDay);
  } catch {}

  const days = [];
  // خانه‌های خالی پیش از شنبه اول ماه
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // روزهای ماه
  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + (d - 1), 12, 0, 0);
    const isoDate = toLocalDateString(dObj);
    days.push({
      dayNumber: d,
      date: dObj,
      isoDate,
      dayOfWeek: (dObj.getDay() + 1) % 7,
    });
  }

  return {
    year: p.year,
    month: p.month,
    monthName,
    daysInMonth,
    startDayOfWeek,
    days,
    firstDay,
  };
}

/**
 * دریافت ماتریس ۵۲ هفته‌ای هیت‌مپ سالانه (مشابه گیت‌هاب و تیک‌تیک)
 * کاملاً تراز شده با هفته‌های تقویم شمسی (ستون‌ها = هفته از شنبه تا جمعه)
 * هفته آخر قطعاً هفته جاری شامل «امروز» است.
 */
export function getYearlyHeatmapWeeks(totalWeeks = 52) {
  const today = new Date();
  const todayIso = toLocalDateString(today);

  // محاسبه روز هفته امروز (شنبه=۰، یکشنبه=۱، ...، جمعه=۶)
  const todayDayOfWeek = (today.getDay() + 1) % 7;

  // روز شنبه هفته جاری در ساعت ۱۲ ظهر
  const currentWeekSaturday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - todayDayOfWeek,
    12,
    0,
    0
  );

  // شنبه آغازین (۵۱ هفته قبل از هفته جاری)
  const startSaturday = new Date(
    currentWeekSaturday.getFullYear(),
    currentWeekSaturday.getMonth(),
    currentWeekSaturday.getDate() - ((totalWeeks - 1) * 7),
    12,
    0,
    0
  );

  const weeks = [];
  for (let w = 0; w < totalWeeks; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const curDate = new Date(
        startSaturday.getFullYear(),
        startSaturday.getMonth(),
        startSaturday.getDate() + (w * 7 + d),
        12,
        0,
        0
      );
      const isoDate = toLocalDateString(curDate);
      const isToday = isoDate === todayIso;
      const isFuture = curDate.getTime() > today.getTime() && !isToday;

      weekDays.push({
        date: curDate,
        isoDate,
        dayOfWeek: d, // ۰ = شنبه، ...، ۶ = جمعه
        isToday,
        isFuture,
      });
    }
    weeks.push(weekDays);
  }

  return weeks;
}

/**
 * فرمت فارسی روز کامل: «سه‌شنبه، ۱۴ مهر ۱۴۰۵»
 */
export function formatFullPersianDate(d = new Date()) {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString('fa-IR');
  }
}

/**
 * فرمت‌بندی دقایق به ساعت و دقیقه فارسی
 */
export function formatMinutesHuman(totalMinutes = 0) {
  const mins = Math.round(totalMinutes);
  if (!mins || mins <= 0) return '۰ دقیقه';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) {
    return `${toFaDigits(h)} ساعت و ${toFaDigits(m)} دقیقه`;
  }
  if (h > 0) {
    return `${toFaDigits(h)} ساعت`;
  }
  return `${toFaDigits(m)} دقیقه`;
}
