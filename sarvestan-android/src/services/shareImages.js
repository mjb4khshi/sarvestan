/**
 * تصویر اشتراک‌گذاری سرو — رنگ‌ها از تم hex (SARV_THEMES) نه oklch
 */
import { toFaDigits } from '../utils/faDigits';
import { getScheduleMatrix, getViewModel } from '../data/viewModel';

const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];

function hexToRgba(hex, a = 1) {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function darken(hex, amount = 0.35) {
  let h = String(hex || '#0066a4').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.round(r * (1 - amount));
  g = Math.round(g * (1 - amount));
  b = Math.round(b * (1 - amount));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * @param theme {{primary:string, base:string, mode:string, persianName?:string}} از SARV_THEMES
 */
export function buildPalette(theme) {
  const primary = theme?.primary || '#0066a4';
  const isLight = theme?.mode === 'light';
  const base = isLight ? '#f8fafc' : theme?.base || '#0b1220';
  const surface = isLight ? '#ffffff' : '#111827';
  const surface2 = isLight ? '#e2e8f0' : '#1f2937';
  const content = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  return {
    primary,
    primaryDark: darken(primary, 0.25),
    base,
    surface,
    surface2,
    content,
    muted,
    success: isLight ? '#16a34a' : '#4ade80',
    info: isLight ? '#0284c7' : '#38bdf8',
    warn: isLight ? '#d97706' : '#fbbf24',
    accent: isLight ? '#9333ea' : '#c084fc',
    isLight,
    white: '#ffffff',
  };
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

async function ensureFont() {
  try {
    await document.fonts?.load?.('bold 28px Arad');
    await document.fonts?.load?.('28px Arad');
  } catch {}
}

function newCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function drawHeader(ctx, W, p, title, subtitle) {
  // پس‌زمینه اصلی
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, W, ctx.canvas.height);

  // نوار بالا با گرادیان امن
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, p.primary);
  g.addColorStop(1, p.primaryDark);
  ctx.fillStyle = g;
  roundRect(ctx, 32, 28, W - 64, 100, 28);
  ctx.fill();

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.white;
  ctx.font = 'bold 40px Arad, sans-serif';
  ctx.fillText(title, W - 72, 78);
  ctx.font = '24px Arad, sans-serif';
  ctx.fillStyle = hexToRgba('#ffffff', 0.88);
  ctx.fillText(subtitle, W - 72, 112);

  // بج سرو
  ctx.fillStyle = hexToRgba('#ffffff', 0.2);
  roundRect(ctx, 52, 48, 56, 56, 16);
  ctx.fill();
  ctx.fillStyle = p.white;
  ctx.font = 'bold 28px Arad, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('س', 80, 86);
  ctx.textAlign = 'right';
}

function drawFooter(ctx, W, H, p) {
  ctx.fillStyle = p.muted;
  ctx.font = '20px Arad, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('سروستان · بهستان خواجه نصیر', W / 2, H - 32);
  ctx.textAlign = 'right';
}

/**
 * استوری برنامه هفتگی
 */
export async function renderScheduleImage({ theme } = {}) {
  await ensureFont();
  const p = buildPalette(theme);
  const W = 1080;
  const H = 1920;
  const canvas = newCanvas(W, H);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas در دسترس نیست');

  drawHeader(ctx, W, p, 'برنامه هفتگی', getViewModel()?.termLabel || 'سروستان');

  const vm = getViewModel();
  const student = vm?.student || {};
  ctx.fillStyle = p.content;
  ctx.font = 'bold 36px Arad, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(student.fullName || 'دانشجو', W / 2, 180);
  ctx.fillStyle = p.muted;
  ctx.font = '24px Arad, sans-serif';
  ctx.fillText(student.major || student.college || '', W / 2, 218);
  ctx.textAlign = 'right';

  const { days, slots, cells } = getScheduleMatrix();
  const gridTop = 260;
  const gridLeft = 36;
  const gridW = W - 72;
  const labelW = 100;
  const colW = (gridW - labelW) / days.length;
  const maxRows = Math.min(slots.length, 9);
  const rowH = 130;

  // هدر روزها
  ctx.fillStyle = hexToRgba(p.primary, p.isLight ? 0.12 : 0.2);
  roundRect(ctx, gridLeft, gridTop, gridW, 52, 14);
  ctx.fill();
  ctx.fillStyle = p.primary;
  ctx.font = 'bold 22px Arad, sans-serif';
  ctx.textAlign = 'center';
  days.forEach((d, i) => {
    ctx.fillText(d, gridLeft + labelW + colW * i + colW / 2, gridTop + 34);
  });

  if (!slots.length) {
    ctx.fillStyle = p.muted;
    ctx.font = '30px Arad, sans-serif';
    ctx.fillText('برنامه‌ای ثبت نشده', W / 2, H / 2);
  }

  for (let r = 0; r < maxRows; r++) {
    const y = gridTop + 64 + r * (rowH + 8);
    ctx.fillStyle = p.muted;
    ctx.font = '18px Arad, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slots[r] || '', gridLeft + labelW / 2, y + rowH / 2);

    for (let c = 0; c < days.length; c++) {
      const list = [];
      const base = `${r}-${c}`;
      if (cells[base]) list.push(cells[base]);
      for (let n = 2; n < 10; n++) {
        if (cells[`${base}-${n}`]) list.push(cells[`${base}-${n}`]);
      }
      const x = gridLeft + labelW + colW * c + 3;
      const cw = colW - 6;
      if (!list.length) continue;

      const toneMap = {
        primary: p.primary,
        info: p.info,
        success: p.success,
        warn: p.warn,
        danger: '#ef4444',
        accent: p.accent,
        secondary: '#8b5cf6',
      };

      const cardH = (rowH - (list.length - 1) * 6) / list.length;
      list.forEach((cell, li) => {
        const tone = toneMap[cell.color] || p.primary;
        const cy = y + li * (cardH + 6);
        ctx.fillStyle = hexToRgba(tone, p.isLight ? 0.14 : 0.22);
        roundRect(ctx, x, cy, cw, cardH, 14);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(tone, 0.7);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + cw - 2, cy + 8);
        ctx.lineTo(x + cw - 2, cy + cardH - 8);
        ctx.stroke();

        ctx.fillStyle = p.content;
        ctx.font = 'bold 16px Arad, sans-serif';
        ctx.textAlign = 'right';
        const lines = wrapText(ctx, cell.title || '', cw - 20);
        lines.forEach((ln, lxi) => {
          ctx.fillText(ln, x + cw - 12, cy + 28 + lxi * 20);
        });
        ctx.fillStyle = p.muted;
        ctx.font = '14px Arad, sans-serif';
        if (cell.time) ctx.fillText(cell.time, x + cw - 12, cy + cardH - 12);
      });
    }
  }

  drawFooter(ctx, W, H, p);
  return canvas;
}

/**
 * استوری معدل و نمرات
 */
export async function renderGpaStoryImage({ theme } = {}) {
  await ensureFont();
  const p = buildPalette(theme);
  const W = 1080;
  const H = 1920;
  const canvas = newCanvas(W, H);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas در دسترس نیست');

  drawHeader(ctx, W, p, 'کارنامه من', getViewModel()?.termLabel || 'سروستان');

  const vm = getViewModel();
  const student = vm?.student || {};
  const summary = vm?.summary || {};
  const gpaRaw = String(summary.gpa || '').replace(/[ـ—-]/g, '').trim();
  const grades = (vm?.grades || [])
    .filter((g) => g.status === 'قطعی' || (g.score && g.score !== '—'))
    .slice(0, 7);

  ctx.fillStyle = p.content;
  ctx.font = 'bold 38px Arad, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(student.fullName || 'دانشجو', W / 2, 185);
  ctx.fillStyle = p.muted;
  ctx.font = '24px Arad, sans-serif';
  ctx.fillText(student.major || student.college || '', W / 2, 222);

  // کارت معدل
  const cardY = 270;
  ctx.fillStyle = hexToRgba(p.primary, p.isLight ? 0.1 : 0.18);
  roundRect(ctx, 56, cardY, W - 112, 300, 36);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(p.primary, 0.45);
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = p.muted;
  ctx.font = '28px Arad, sans-serif';
  ctx.fillText('معدل کل', W / 2, cardY + 64);
  ctx.fillStyle = p.primary;
  ctx.font = 'bold 130px Arad, sans-serif';
  ctx.fillText(gpaRaw || '—', W / 2, cardY + 190);
  ctx.fillStyle = p.muted;
  ctx.font = '26px Arad, sans-serif';
  const credits = summary.credits || '۰';
  ctx.fillText(`واحد اخذشده: ${toFaDigits(credits)}`, W / 2, cardY + 250);

  // نوار پیشرفت تقریبی
  const barY = cardY + 340;
  const num = Number(String(credits).replace(/[^\d]/g, '')) || 0;
  const pct = Math.max(4, Math.min(100, (num / 142) * 100));
  ctx.fillStyle = p.surface2;
  roundRect(ctx, 72, barY, W - 144, 22, 11);
  ctx.fill();
  ctx.fillStyle = p.primary;
  roundRect(ctx, 72, barY, (W - 144) * (pct / 100), 22, 11);
  ctx.fill();
  ctx.fillStyle = p.muted;
  ctx.font = '20px Arad, sans-serif';
  ctx.fillText('پیشرفت تحصیلی (تقریبی)', W / 2, barY + 52);

  // نمرات
  let y = barY + 100;
  ctx.fillStyle = p.content;
  ctx.font = 'bold 32px Arad, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('نمرات اخیر', W - 64, y);

  if (!grades.length) {
    ctx.fillStyle = p.muted;
    ctx.font = '26px Arad, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('هنوز نمره‌ای ثبت نشده', W / 2, y + 90);
  } else {
    for (const g of grades) {
      y += 18;
      ctx.fillStyle = p.surface;
      roundRect(ctx, 56, y, W - 112, 84, 20);
      ctx.fill();
      ctx.strokeStyle = p.surface2;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = p.content;
      ctx.font = 'bold 26px Arad, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(g.course || '', W - 96, y + 36);
      ctx.fillStyle = p.muted;
      ctx.font = '20px Arad, sans-serif';
      ctx.fillText(`${toFaDigits(g.unit)} واحد`, W - 96, y + 64);

      ctx.fillStyle = p.success;
      ctx.font = 'bold 34px Arad, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.score || '—', 150, y + 52);
      ctx.textAlign = 'right';
      y += 96;
    }
  }

  drawFooter(ctx, W, H, p);
  return canvas;
}

export async function shareCanvas(canvas, { filename = 'sarvestan.png', title = 'سروستان' } = {}) {
  const blob = await new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
    } catch {
      resolve(null);
    }
  });
  if (!blob) throw new Error('ساخت تصویر ناموفق بود');

  const file = new File([blob], filename, { type: 'image/png' });
  try {
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text: title });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return 'downloaded';
}

export function canvasToDataUrl(canvas) {
  try {
    return canvas.toDataURL('image/png', 0.92);
  } catch {
    return '';
  }
}
