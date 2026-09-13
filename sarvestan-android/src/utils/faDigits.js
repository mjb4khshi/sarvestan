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
