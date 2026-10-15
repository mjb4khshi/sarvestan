/**
 * نشان و وضعیت معدل بر اساس آیین‌نامه دانشگاه
 */
export function getGpaStatusBadge(gpaRaw) {
  if (!gpaRaw || gpaRaw === 'ـ' || gpaRaw === '—' || gpaRaw === '-') return null;
  const clean = String(gpaRaw)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/٫/g, '.')
    .replace(/,/g, '.')
    .trim();
  const num = parseFloat(clean);
  if (!Number.isFinite(num)) return null;

  if (num >= 19) {
    return {
      label: 'ممتاز',
      chip: 'bg-warn-soft text-warn font-black',
    };
  }
  if (num >= 17) {
    return {
      label: 'معدل الف',
      chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold',
    };
  }
  if (num < 10) {
    return {
      label: 'مشروط',
      chip: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold',
    };
  }
  return null;
}
