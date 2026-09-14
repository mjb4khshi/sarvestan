/**
 * تبدیل اعداد انگلیسی به فارسی به همراه جداکننده اعشار و کاما
 */
export function toFaDigits(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
    .replace(/\./g, '٫');
}

/**
 * فرمت‌بندی اعداد پولی و ۳ رقم ۳ رقم به فارسی
 */
export function toFaPrice(num) {
  if (num === null || num === undefined) return '۰';
  const val = Number(String(num).replace(/[^\d]/g, '') || 0);
  return toFaDigits(val.toLocaleString('fa-IR'));
}

/**
 * فرمت‌بندی زمان آخرین همگام‌سازی به صورت فارسی و با اعداد فارسی
 * مثال: «امروز، ساعت ۱۷:۱۴» یا «۲۴ شهریور، ساعت ۱۰:۳۰»
 */
export function formatLastSync(timestamp) {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return null;

  const now = new Date();

  // زمان ۲۴ ساعته با دو رقم و تبدیل به اعداد فارسی
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = toFaDigits(`${hours}:${minutes}`);

  // مقایسه روز تقویمی با امروز
  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return `امروز، ساعت ${timeStr}`;
  }

  // مقایسه روز با دیروز
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `دیروز، ساعت ${timeStr}`;
  }

  // فرمت تقویم فارسی (شمسی)
  const isSameYear = d.getFullYear() === now.getFullYear();
  let dateStr = '';
  try {
    dateStr = d.toLocaleDateString('fa-IR', {
      day: 'numeric',
      month: 'long',
      ...(isSameYear ? {} : { year: 'numeric' }),
    });
  } catch {
    dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return `${toFaDigits(dateStr)}، ساعت ${timeStr}`;
}

/**
 * استخراج زمان آخرین همگام‌سازی از متا یا ذخیره‌سازی محلی
 */
export function getLastSyncTimestamp(syncMeta) {
  if (syncMeta?.lastSyncAt) return syncMeta.lastSyncAt;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('sarvestan_live_sync_meta') : null;
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.lastSyncAt) return p.lastSyncAt;
    }
    const notes = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('sarvestan_local_notes') || '[]') : [];
    if (notes?.[0]?.at) return notes[0].at;
  } catch {}
  return null;
}
