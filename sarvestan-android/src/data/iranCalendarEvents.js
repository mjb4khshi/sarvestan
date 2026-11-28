/**
 * داده‌های تقویم رسمی ۱۴۰۵، روز دانشجو (۱۶ آذر) و تولد کاربر
 * نکته: طبق درخواست کاربر، عنوان تعطیلات رسمی نمایش داده نمی‌شود و فقط وضعیت تعطیل بودن روز مشخص می‌شود.
 */
import { getPersianParts } from '../services/calendarHelper';

export const BIRTHDAY_STORAGE_KEY = 'sarvestan_user_birthday';

export const OFFICIAL_HOLIDAYS_1405 = new Set([
  '1405-01-01',
  '1405-01-02',
  '1405-01-03',
  '1405-01-04',
  '1405-01-12',
  '1405-01-13',
  '1405-03-06',
  '1405-03-14',
  '1405-03-15',
  '1405-04-03',
  '1405-04-04',
  '1405-05-13',
  '1405-05-21',
  '1405-05-22',
  '1405-05-30',
  '1405-06-08',
  '1405-08-22',
  '1405-10-02',
  '1405-10-16',
  '1405-11-04',
  '1405-11-22',
  '1405-12-09',
  '1405-12-19',
  '1405-12-20',
  '1405-12-29',
]);

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function parseBirthDateString(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();
  const m = cleaned.match(/(\d{2,4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!m) return null;
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    return { month, day };
  }
  return null;
}

export function getUserBirthday() {
  try {
    const raw = localStorage.getItem(BIRTHDAY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.month >= 1 && parsed.month <= 12 && parsed.day >= 1 && parsed.day <= 31) {
        return { month: Number(parsed.month), day: Number(parsed.day) };
      }
    }
    const profileRaw = localStorage.getItem('sarvestan_live_profile');
    if (profileRaw) {
      const profile = JSON.parse(profileRaw);
      const fromProfile = parseBirthDateString(profile?.birthDate);
      if (fromProfile) return fromProfile;
    }
  } catch {}
  return null;
}

export function setUserBirthday(bday) {
  try {
    if (!bday || !bday.month || !bday.day) {
      localStorage.removeItem(BIRTHDAY_STORAGE_KEY);
    } else {
      localStorage.setItem(
        BIRTHDAY_STORAGE_KEY,
        JSON.stringify({ month: Number(bday.month), day: Number(bday.day) })
      );
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sarvBirthdayUpdated'));
    }
  } catch {}
}

export function getCalendarSpecialDay(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) {
    return {
      isHoliday: false,
      isFriday: false,
      isOfficialHoliday: false,
      isStudentDay: false,
      isBirthday: false,
      specialEvents: [],
    };
  }

  const parts = getPersianParts(dateObj);
  const key = `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
  const isOfficialHoliday = OFFICIAL_HOLIDAYS_1405.has(key);
  const isFriday = dateObj.getDay() === 5;
  const isHoliday = isOfficialHoliday || isFriday;
  const isStudentDay = parts.month === 9 && parts.day === 16;

  const bday = getUserBirthday();
  const isBirthday = Boolean(bday && bday.month === parts.month && bday.day === parts.day);

  const specialEvents = [];
  if (isStudentDay) {
    specialEvents.push({
      type: 'student_day',
      title: 'روز دانشجو',
      icon: '🎓',
    });
  }
  if (isBirthday) {
    specialEvents.push({
      type: 'birthday',
      title: 'تولدت مبارک!',
      icon: '🎂',
    });
  }

  return {
    jalaliYear: parts.year,
    jalaliMonth: parts.month,
    jalaliDay: parts.day,
    isHoliday,
    isFriday,
    isOfficialHoliday,
    isStudentDay,
    isBirthday,
    specialEvents,
  };
}

export function getNextGregorianForJalali(month, day, hour = 9, minute = 0) {
  const now = new Date();
  for (let offset = 0; offset <= 370; offset++) {
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute, 0, 0);
    if (candidate.getTime() <= now.getTime() + 5000) continue;
    const p = getPersianParts(candidate);
    if (p.month === Number(month) && p.day === Number(day)) {
      return candidate;
    }
  }
  return null;
}
