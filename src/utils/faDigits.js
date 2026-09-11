/** تبدیل اعداد لاتین به فارسی (شامل نقطه اعشار) */
export function toFaDigits(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
    .replace(/\./g, '٫');
}
