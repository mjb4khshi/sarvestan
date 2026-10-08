/**
 * ابزار خلاصه‌سازی و یکپارچه‌سازی نام محل و کلاس‌ها در سامانه‌های دانشگاهی (بهستان)
 */
import { toFaDigits } from './faDigits.js';

function normalizePersian(str) {
  if (!str) return '';
  return String(str)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ساده‌سازی و خلاصه‌سازی نام مکان‌های طویل گزارش‌های بهستان
 * مثال‌ها:
 *  - «دانشکده مهندسی مکانیک-مکانیک-کلاس» -> «کلاس (مکانیک)»
 *  - «ساختمان آموزشی صنایع-ساختمان آموزشی صنایع» -> «ساختمان صنایع»
 *  - «ساختمان آموزشی مکانیک 1-کلاس نقشه کشی( طبقه 2-)» -> «نقشه کشی (مکانیک ۱)»
 *  - «طبقه سوم-کلاس 305» -> «کلاس ۳۰۵»
 *  - «دانشکده مهندسی برق-کلاس 302» -> «کلاس ۳۰۲ (برق)»
 */
export function simplifyRoomName(raw) {
  if (!raw || raw === 'ـ' || raw === '-' || raw === 'نامشخص' || raw === '—') return '';
  let str = normalizePersian(raw);

  // پاک‌کردن پیشوندهای متنی سامانه
  str = str.replace(/^(?:محل\s*:\s*|کلاس\s*:\s*|ساختمان\s*:\s*)/, '');
  str = str.replace(/\s*امتحان\s*:\s*.*$/, '');
  str = str.replace(/\s*امتحان\s*\(.*$/, '');

  // تفکیک بخش‌ها
  let parts = str.split(/\s*[-–]\s*/).map((p) => p.trim()).filter(Boolean);

  if (!parts.length) return '';

  const cleanFacultyOrBuilding = (p) => {
    return p
      .replace(/^دانشکده\s+(?:مهندسی\s+)?/, '')
      .replace(/^ساختمان\s+(?:آموزشی\s+)?/, '')
      .replace(/^آموزشی\s+/, '')
      .trim();
  };

  if (parts.length >= 2) {
    const building = parts[0];
    const room = parts.slice(1).join(' - ');

    const bCore = cleanFacultyOrBuilding(building);
    const rCore = cleanFacultyOrBuilding(room);

    // تکرار عین ساختمان در هر دو بخش
    if (bCore && bCore === rCore) {
      return `ساختمان ${bCore}`;
    }

    // اگر بخش اول فقط طبقه است (مثلاً طبقه سوم - کلاس ۳۰۵)
    if (/^طبقه\s+/.test(building)) {
      const rm = room.replace(/^کلاس\s*/, 'کلاس ');
      return rm.startsWith('کلاس') ? rm : `کلاس ${rm}`;
    }

    // بررسی وجود شماره کلاس
    const numM = room.match(/(?:کلاس\s*)?(\d{2,4}[a-zA-Z]?)/);
    if (numM && numM[1]) {
      const num = numM[1];
      if (bCore) {
        return `کلاس ${num} (${bCore})`;
      }
      return `کلاس ${num}`;
    }

    // کارگاه‌ها یا کلاس‌های خاص
    if (/نقشه\s*کشی/.test(room)) {
      return `نقشه کشی (${bCore || building})`;
    }

    if (/کلاس/.test(room) && !/\d/.test(room)) {
      return bCore ? `کلاس (${bCore})` : 'کلاس';
    }

    // سایت یا آزمایشگاه
    if (/(?:سایت|آزمایشگاه|کارگاه|آمفی)/.test(room)) {
      const rmClean = room.replace(new RegExp(`^${bCore}\\s*[-–]?\\s*`), '').trim();
      return bCore ? `${rmClean} (${bCore})` : rmClean;
    }

    const sCore = room.replace(/^کلاس\s*/, '').replace(new RegExp(`^${bCore}\\s*`), '').trim();
    if (sCore && bCore && sCore !== bCore) {
      return `${sCore} (${bCore})`;
    }
    return bCore || building;
  }

  // تک بخشی
  const single = parts[0];
  if (/^\d{2,4}[a-zA-Z]?$/.test(single)) {
    return `کلاس ${single}`;
  }
  if (/^ساختمان\s+آموزشی\s+/.test(single)) {
    return single.replace(/^ساختمان\s+آموزشی\s+/, 'ساختمان ');
  }
  if (/^دانشکده\s+(?:مهندسی\s+)?/.test(single)) {
    return single.replace(/^دانشکده\s+(?:مهندسی\s+)?/, 'دانشکده ');
  }

  return single;
}

/**
 * فرمت‌بندی تگ اتاق با تبدیل اعداد به فارسی و افزودن برچسب کلاس در صورت نیاز
 */
export function formatRoomTag(raw) {
  if (!raw || raw === 'ـ' || raw === '-' || raw === 'نامشخص' || raw === '—') return '';
  const simplified = simplifyRoomName(raw);
  if (!simplified) return '';

  let res = toFaDigits(simplified);
  if (
    !/(کلاس|ساختمان|سایت|آزمایشگاه|کارگاه|آمفی|اتاق|مرکز|دانشکده|سوله)/.test(res) &&
    /\d/.test(res)
  ) {
    res = `کلاس ${res}`;
  }
  return res;
}
