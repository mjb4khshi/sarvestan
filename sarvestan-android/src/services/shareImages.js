/**
 * تصویر اشتراک‌گذاری استوری سروستان — هماهنگ با هویت بصری Sarv Design و ارقام کاملاً فارسی
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

export function buildPalette(theme) {
  let docStyle = null;
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      docStyle = window.getComputedStyle(document.documentElement);
    } catch {}
  }
  const getVar = (name, fallback) => {
    if (docStyle) {
      const v = docStyle.getPropertyValue(name)?.trim();
      if (v) return v;
    }
    return fallback;
  };

  const isLight =
    theme?.mode === 'light' ||
    (typeof document !== 'undefined' &&
      document.documentElement?.getAttribute('data-theme')?.includes('light'));

  const primary = theme?.primary || getVar('--theme-color-primary', '#0066a4');
  const base = isLight
    ? (theme?.base && theme.base !== '#ffffff' ? theme.base : '#f4f6f8')
    : (theme?.base || getVar('--theme-color-base', '#0b1220'));
  const surface = isLight ? '#ffffff' : getVar('--theme-color-base-500', '#111827');
  const surface2 = isLight ? '#e2e8f0' : getVar('--theme-color-neutral-dark', '#1f2937');
  const content = isLight ? '#0f172a' : getVar('--theme-color-base-content', '#f8fafc');
  const muted = isLight ? '#64748b' : getVar('--theme-color-neutral', '#94a3b8');

  return {
    primary,
    primaryDark: darken(primary, 0.28),
    base,
    surface,
    surface2,
    content,
    muted,
    success: getVar('--theme-color-success', isLight ? '#16a34a' : '#22c55e'),
    info: getVar('--theme-color-info', isLight ? '#0284c7' : '#38bdf8'),
    warn: getVar('--theme-color-warn', isLight ? '#d97706' : '#fbbf24'),
    danger: getVar('--theme-color-danger', isLight ? '#dc2626' : '#ef4444'),
    accent: getVar('--theme-color-accent', isLight ? '#9333ea' : '#c084fc'),
    secondary: getVar('--theme-color-secondary', isLight ? '#4f46e5' : '#818cf8'),
    isLight,
    white: '#ffffff',
  };
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * رسم نشان اختصاصی سرو (برگ و سرو کشیده خواجه نصیر)
 */
export function drawSarvLogo(ctx, cx, cy, size, color = '#ffffff') {
  ctx.save();
  ctx.translate(cx, cy);
  const scale = size / 1080;
  ctx.scale(scale, scale);
  ctx.translate(-540, -540);
  const path = new Path2D('M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z');
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
}

function wrapText(ctx, text, maxWidth, maxLines = 2) {
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
  return lines.slice(0, maxLines);
}

async function ensureFont() {
  try {
    if (typeof document !== 'undefined') {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      if (document.fonts?.load) {
        await Promise.allSettled([
          document.fonts.load('bold 26px Arad'),
          document.fonts.load('bold 18px Arad'),
          document.fonts.load('bold 15px Arad'),
          document.fonts.load('14px Arad'),
          document.fonts.load('13px Arad'),
          document.fonts.load('12px Arad'),
          document.fonts.load('bold 32px Arad'),
        ]);
      }
    }
  } catch {}
}

function newCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function drawHeader(ctx, W, p, title, subtitle) {
  // پس‌زمینه فلت مدرن هماهنگ با اپلیکیشن
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, W, ctx.canvas.height);

  // نوار برند سروستان در بالا
  ctx.fillStyle = p.surface;
  roundRect(ctx, 40, 36, W - 80, 116, 24);
  ctx.fill();
  ctx.strokeStyle = p.surface2;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // باکس آیکون اصیل سرو
  ctx.fillStyle = hexToRgba(p.primary, 0.15);
  roundRect(ctx, 58, 54, 80, 80, 20);
  ctx.fill();
  drawSarvLogo(ctx, 98, 94, 48, p.primary);

  // عنوان و توضیحات هدر
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 30px Arad, "Arad", sans-serif';
  ctx.fillText(title, W - 76, 88);

  ctx.font = '18px Arad, "Arad", sans-serif';
  ctx.fillStyle = p.muted;
  ctx.fillText(subtitle, W - 76, 124);
}

function drawFooter(ctx, W, H, p) {
  const footerY = H - 64;
  ctx.fillStyle = p.surface;
  roundRect(ctx, 60, footerY - 22, W - 120, 50, 16);
  ctx.fill();
  ctx.strokeStyle = p.surface2;
  ctx.lineWidth = 1;
  ctx.stroke();

  // لینک و برند سروستان
  const brandText = 'ساخته‌شده با سروستان · mjb4khshi.github.io/sarvestan';
  ctx.font = 'bold 16px Arad, "Arad", sans-serif';
  const textW = ctx.measureText(brandText).width;

  drawSarvLogo(ctx, W / 2 + textW / 2 + 20, footerY + 3, 20, p.primary);

  ctx.fillStyle = p.content;
  ctx.textAlign = 'center';
  ctx.fillText(brandText, W / 2, footerY + 9);
  ctx.textAlign = 'right';
}

function formatRoomTag(room) {
  if (!room || room === 'ـ' || room === '-' || room === 'نامشخص') return '';
  const r = String(room).trim();
  if (/(کلاس|ساختمان|ساختمون|سایت|آزمایشگاه|کارگاه|آمفی|اتاق|مرکز)/.test(r)) {
    return toFaDigits(r);
  }
  return `کلاس ${toFaDigits(r)}`;
}


/**
 * تولید تصویر پوستر افقی برنامه هفتگی — کاملاً فلت، هماهنگ با هویت بصری Sarv Design و کارت‌های متناسب
 */
export async function renderScheduleImage({ theme } = {}) {
  await ensureFont();
  const p = buildPalette(theme);
  const W = 1920;
  const H = 1080;
  const canvas = newCanvas(W, H);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas در دسترس نیست');

  const vm = getViewModel();
  const student = vm?.student || {};
  const currentTermLabel = vm?.termLabel || 'نیمسال تحصیلی جاری';

  // پس‌زمینه فلت مدرن بدون گرادیان
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, W, H);

  // نوار برند و مشخصات دانشجو در بالای پوستر افقی (دقیقاً هم‌عرض و هم‌تراز با ستون‌های جدول)
  const topX = 36;
  const topY = 24;
  const topW = W - 72; // 1848px
  const topH = 92;

  ctx.fillStyle = p.surface;
  roundRect(ctx, topX, topY, topW, topH, 20);
  ctx.fill();
  if (p.isLight) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.strokeStyle = p.surface2;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // سمت راست: نشان سروستان + عنوان پوستر
  const logoBoxSize = 64;
  const logoX = topX + topW - logoBoxSize - 16;
  const logoY = topY + (topH - logoBoxSize) / 2;
  ctx.fillStyle = p.primary;
  roundRect(ctx, logoX, logoY, logoBoxSize, logoBoxSize, 16);
  ctx.fill();
  drawSarvLogo(ctx, logoX + logoBoxSize / 2, logoY + logoBoxSize / 2, 40, '#ffffff');

  // عنوان و بج‌های سروستان در سمت راست
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 23px Arad, "Arad", sans-serif';
  ctx.fillText('برنامه هفتگی نیمسال', logoX - 16, topY + 38);

  // برچسب‌ها زیر عنوان (بج سروستان همراه + ترم تحصیلی جاری)
  const tagY = topY + 68;
  const badgeText = 'سروستان همراه';
  ctx.font = 'bold 12px Arad, "Arad", sans-serif';
  const badgeW = ctx.measureText(badgeText).width + 16;
  const badgeH = 22;
  const badgeX = logoX - 16 - badgeW;
  const badgeY = tagY - 16;

  ctx.fillStyle = hexToRgba(p.primary, 0.14);
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fill();

  ctx.fillStyle = p.primary;
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 15);

  // برچسب ترم جاری (بلافاصله سمت چپ بج با فاصله متناسب)
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.muted;
  ctx.font = '13px Arad, "Arad", sans-serif';
  ctx.fillText(currentTermLabel, badgeX - 12, tagY);

  // آمار کلی جلسات در وسط نوار بالا
  const { days, slots, cells } = getScheduleMatrix();
  const totalClasses = Object.keys(cells).length;
  const cur = vm?.curriculum || {};
  const enrolledUnits = cur.enrolledCredits ?? 18;

  const statsText = `${toFaDigits(totalClasses)} جلسه کلاس در هفته · ${toFaDigits(enrolledUnits)} واحد اخذشده`;
  ctx.font = 'bold 13.5px Arad, "Arad", sans-serif';
  const statsW = ctx.measureText(statsText).width + 32;
  const statsX = W / 2 - statsW / 2;
  ctx.fillStyle = hexToRgba(p.primary, 0.12);
  roundRect(ctx, statsX, topY + (topH - 34) / 2, statsW, 34, 10);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(p.primary, 0.28);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = p.primary;
  ctx.textAlign = 'center';
  ctx.fillText(statsText, W / 2, topY + topH / 2 + 5);

  // مشخصات دانشجو در سمت چپ (بدون مربع آواتار و بدون کد دانشجویی)
  const profX = topX + 24;
  const profY = topY + 16;

  // متن نام و رشته دانشجو
  ctx.direction = 'rtl';
  ctx.textAlign = 'left';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 21px Arad, "Arad", sans-serif';
  ctx.fillText(student.fullName || 'دانشجوی صنعتی خواجه نصیر', profX, profY + 24);

  ctx.fillStyle = p.muted;
  ctx.font = '13.5px Arad, "Arad", sans-serif';
  const stdInfo = [
    student.major,
    student.college || 'دانشگاه صنعتی خواجه نصیر طوسی',
  ].filter(Boolean).join(' · ');
  ctx.fillText(stdInfo, profX, profY + 50);

  // ── هندسه و ماتریس جدول افقی ──
  // عرض کل محتوا: 1848 پیکسل (از x=36 تا x=1884 دقیقاً هم‌تراز با هدر و فوتر)
  const gridTop = 132;
  const gridLeft = 36;
  const gridW = W - 72; // 1848px
  const headerH = 44;
  const timeColW = 148;
  const gap = 8;
  // 5 ستون روز + 1 ستون زمان = 6 ستون (5 فاصله بینابینی)
  // (1848 - 148 - 5*8) / 5 = (1848 - 148 - 40) / 5 = 1660 / 5 = 332 پیکسل دقیق
  const dayColW = 332;
  const timeX = gridLeft + gridW - timeColW; // 36 + 1848 - 148 = 1736

  // سرستون ستون ساعت (سمت راست جدول در RTL: از 1736 تا 1884)
  ctx.fillStyle = p.surface;
  roundRect(ctx, timeX, gridTop, timeColW, headerH, 14);
  ctx.fill();
  if (p.isLight) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.strokeStyle = p.surface2;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = p.muted;
  ctx.font = 'bold 15px Arad, "Arad", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ساعت کلاس', timeX + timeColW / 2, gridTop + 28);

  // سرستون‌های ۵ روز هفته (شنبه تا چهارشنبه از راست به چپ)
  days.forEach((dayName, di) => {
    const dayX = timeX - (di + 1) * dayColW - (di + 1) * gap;

    const dayClassesCount = Object.keys(cells).filter((k) => {
      const parts = String(k).split('-').map(Number);
      return parts.length >= 2 && parts[1] === di;
    }).length;

    ctx.fillStyle = p.surface;
    roundRect(ctx, dayX, gridTop, dayColW, headerH, 14);
    ctx.fill();
    if (p.isLight) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.strokeStyle = p.surface2;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // نام روز
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = p.content;
    ctx.font = 'bold 16px Arad, "Arad", sans-serif';
    ctx.fillText(dayName, dayX + dayColW - 18, gridTop + 28);

    // بج تعداد درس‌های این روز
    if (dayClassesCount > 0) {
      const badgeStr = `${toFaDigits(dayClassesCount)} درس`;
      ctx.font = 'bold 11px Arad, "Arad", sans-serif';
      const bw = ctx.measureText(badgeStr).width + 14;
      ctx.fillStyle = hexToRgba(p.primary, 0.16);
      roundRect(ctx, dayX + 14, gridTop + 10, bw, 24, 8);
      ctx.fill();
      ctx.fillStyle = p.primary;
      ctx.textAlign = 'center';
      ctx.fillText(badgeStr, dayX + 14 + bw / 2, gridTop + 26);
    }
  });

  // سطرهای زمانی (Time slots) با تفکیک و فاصله مناسب از فوتر
  const footerH = 42;
  const footerMarginBottom = 22;
  const footerY = H - footerMarginBottom - footerH; // 1080 - 22 - 42 = 1016
  const gapAboveFooter = 20; // فاصله مناسب جدول از فوتر
  const rowsTop = gridTop + headerH + gap; // 132 + 44 + 8 = 184
  const availableH = footerY - gapAboveFooter - rowsTop; // 1016 - 20 - 184 = 812
  const maxRows = Math.max(1, Math.min(slots.length, 6));
  const rowH = Math.floor((availableH - (maxRows - 1) * gap) / maxRows); // (812 - 40) / 6 = 128

  if (!slots.length) {
    ctx.fillStyle = p.muted;
    ctx.font = '22px Arad, "Arad", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('در حال حاضر برنامه‌ای در این ترم ثبت نشده است', W / 2, H / 2);
  }

  const toneMap = {
    primary: p.primary,
    info: p.info,
    success: p.success,
    warn: p.warn,
    danger: p.danger,
    accent: p.accent,
    secondary: p.secondary,
  };

  const resolveTone = (colorVal) => {
    if (!colorVal) return p.primary;
    const str = String(colorVal).trim();
    if (str.startsWith('#') || str.startsWith('rgb')) return str;
    return toneMap[str] || p.primary;
  };

  for (let r = 0; r < maxRows; r++) {
    const y = rowsTop + r * (rowH + gap);

    // کادر ساعت در سمت راست (Time cell)
    ctx.fillStyle = p.surface;
    roundRect(ctx, timeX, y, timeColW, rowH, 16);
    ctx.fill();
    if (p.isLight) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.strokeStyle = p.surface2;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = p.content;
    ctx.font = 'bold 18px Arad, "Arad", sans-serif';
    ctx.textAlign = 'center';
    const timeParts = String(slots[r] || '').split(/[-–]/);
    if (timeParts.length >= 2) {
      ctx.fillText(toFaDigits(timeParts[0].trim()), timeX + timeColW / 2, y + rowH / 2 - 13);
      ctx.fillStyle = p.muted;
      ctx.font = '12px Arad, "Arad", sans-serif';
      ctx.fillText('تا', timeX + timeColW / 2, y + rowH / 2 + 5);
      ctx.fillStyle = p.content;
      ctx.font = 'bold 18px Arad, "Arad", sans-serif';
      ctx.fillText(toFaDigits(timeParts[1].trim()), timeX + timeColW / 2, y + rowH / 2 + 25);
    } else {
      ctx.fillText(toFaDigits(slots[r] || ''), timeX + timeColW / 2, y + rowH / 2 + 6);
    }

    // خانه‌های مربوط به روزها
    for (let c = 0; c < days.length; c++) {
      const dayX = timeX - (c + 1) * dayColW - (c + 1) * gap;

      const list = [];
      const base = `${r}-${c}`;
      if (cells[base]) {
        if (Array.isArray(cells[base].items) && cells[base].items.length) {
          list.push(...cells[base].items);
        } else {
          list.push(cells[base]);
        }
      }
      for (let n = 2; n < 8; n++) {
        if (cells[`${base}-${n}`]) {
          if (Array.isArray(cells[`${base}-${n}`].items)) {
            list.push(...cells[`${base}-${n}`].items);
          } else {
            list.push(cells[`${base}-${n}`]);
          }
        }
      }

      // خانه خالی — بدون هیچ خط اضافه و شلوغی (خلوت و مدرن)
      if (!list.length) {
        if (!p.isLight) {
          ctx.fillStyle = hexToRgba(p.surface, 0.25);
          roundRect(ctx, dayX, y, dayColW, rowH, 14);
          ctx.fill();
        } else {
          // در حالت روشن، کادر بسیار محو و بدون خط حاشیه (بدون استروک)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
          roundRect(ctx, dayX, y, dayColW, rowH, 14);
          ctx.fill();
        }
        continue;
      }

      // کارت‌های درس متناسب، هم‌ارتفاع با نگهدارنده سطر (rowH) و بدون نوار کناری
      if (list.length === 1) {
        const cell = list[0];
        const cardX = dayX;
        const cy = y;
        const cardW = dayColW;
        const cardH = rowH;
        const tone = resolveTone(cell.color);

        // پس‌زمینه فلت کارت درس هماهنگ و هم‌اندازه با جایگاه سطر
        ctx.fillStyle = hexToRgba(tone, p.isLight ? 0.10 : 0.16);
        roundRect(ctx, cardX, cy, cardW, cardH, 14);
        ctx.fill();

        // حاشیه ظریف دور کارت
        ctx.strokeStyle = hexToRgba(tone, p.isLight ? 0.22 : 0.45);
        ctx.lineWidth = p.isLight ? 0.8 : 1;
        ctx.stroke();

        // بج «حضوری» در گوشه چپ بالا
        const badgeW = 54;
        const badgeH = 24;
        ctx.fillStyle = hexToRgba(tone, 0.22);
        roundRect(ctx, cardX + 12, cy + 12, badgeW, badgeH, 7);
        ctx.fill();
        ctx.fillStyle = tone;
        ctx.font = 'bold 11px Arad, "Arad", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('حضوری', cardX + 12 + badgeW / 2, cy + 28);

        // عنوان درس با فونت آراد بولد و اندازه متناسب
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        ctx.fillStyle = p.content;
        ctx.font = 'bold 16px Arad, "Arad", sans-serif';
        const lines = wrapText(ctx, cell.title || '', cardW - badgeW - 32, 2);
        lines.forEach((ln, lxi) => {
          ctx.fillText(ln, cardX + cardW - 14, cy + 30 + lxi * 24);
        });

        // ردیف پایین: استاد و شماره کلاس
        const botY = cy + cardH - 16;

        if (cell.professor && cell.professor !== 'ـ') {
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = p.muted;
          ctx.font = '13px Arad, "Arad", sans-serif';
          ctx.fillText(cell.professor, cardX + cardW - 14, botY);
        }

        const roomStr = formatRoomTag(cell.room);
        if (roomStr) {
          ctx.font = 'bold 12px Arad, "Arad", sans-serif';
          const rw = ctx.measureText(roomStr).width + 16;
          ctx.fillStyle = hexToRgba(tone, 0.16);
          roundRect(ctx, cardX + 12, botY - 18, rw, 24, 6);
          ctx.fill();

          ctx.direction = 'rtl';
          ctx.textAlign = 'center';
          ctx.fillStyle = p.content;
          ctx.fillText(roomStr, cardX + 12 + rw / 2, botY - 1);
        }
      } else {
        // چند درس در یک اسلات زمانی (تقسیم ارتفاع سطر میان درس‌ها)
        const gapBetween = 4;
        const cardH = Math.floor((rowH - (list.length - 1) * gapBetween) / list.length);
        list.forEach((cell, li) => {
          const cy = y + li * (cardH + gapBetween);
          const cardX = dayX;
          const cardW = dayColW;
          const tone = resolveTone(cell.color);

          ctx.fillStyle = hexToRgba(tone, p.isLight ? 0.10 : 0.16);
          roundRect(ctx, cardX, cy, cardW, cardH, 10);
          ctx.fill();

          ctx.strokeStyle = hexToRgba(tone, p.isLight ? 0.22 : 0.45);
          ctx.lineWidth = p.isLight ? 0.8 : 1;
          ctx.stroke();

          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillStyle = p.content;
          ctx.font = 'bold 13.5px Arad, "Arad", sans-serif';
          const title = (cell.title || '').slice(0, 26);
          ctx.fillText(title, cardX + cardW - 10, cy + 20);

          const botY = cy + cardH - 10;
          if (cell.professor && cell.professor !== 'ـ') {
            ctx.fillStyle = p.muted;
            ctx.font = '11px Arad, "Arad", sans-serif';
            ctx.fillText(cell.professor, cardX + cardW - 10, botY);
          }
          const roomStr = formatRoomTag(cell.room);
          if (roomStr) {
            ctx.direction = 'rtl';
            ctx.textAlign = 'left';
            ctx.fillStyle = p.content;
            ctx.font = 'bold 11px Arad, "Arad", sans-serif';
            ctx.fillText(roomStr, cardX + 10, botY);
          }
        });
      }
    }
  }

  // ── نوار فوتر مدرن با لینک سایت (هم‌تراز با هدر و جدول در x=36 تا x=1884) ──
  const footerX = 36;
  const footerW = W - 72; // 1848px
  ctx.fillStyle = p.surface;
  roundRect(ctx, footerX, footerY, footerW, footerH, 14);
  ctx.fill();
  if (p.isLight) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.strokeStyle = p.surface2;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // متن وسط فوتر: ساخته‌شده با سروستان · mjb4khshi.github.io/sarvestan
  const footerBrand = 'ساخته‌شده با سروستان · mjb4khshi.github.io/sarvestan';
  ctx.font = 'bold 14px Arad, "Arad", sans-serif';
  const fbW = ctx.measureText(footerBrand).width;

  drawSarvLogo(ctx, W / 2 + fbW / 2 + 18, footerY + footerH / 2, 18, p.primary);

  ctx.fillStyle = p.content;
  ctx.textAlign = 'center';
  ctx.fillText(footerBrand, W / 2, footerY + footerH / 2 + 5);

  // سمت راست فوتر: ترم تحصیلی
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.muted;
  ctx.font = '12px Arad, "Arad", sans-serif';
  ctx.fillText(currentTermLabel, footerX + footerW - 20, footerY + footerH / 2 + 5);

  // سمت چپ فوتر: دانشگاه خواجه نصیر
  ctx.direction = 'rtl';
  ctx.textAlign = 'left';
  ctx.fillText('دانشگاه صنعتی خواجه نصیر طوسی', footerX + 20, footerY + footerH / 2 + 5);

  return canvas;
}

/**
 * تولید تصویر استوری معدل (طراحی مینیمال، مدرن و هماهنگ با تم)
 * فقط یک صفحه زیبا و خلوت با رنگ تم، فونت بسیار درشت معدل کل، و نشان سرو به همراه تبلیغ سروستان
 */
export async function renderGpaStoryImage({ theme } = {}) {
  await ensureFont();
  const p = buildPalette(theme);
  const W = 1080;
  const H = 1920;
  const canvas = newCanvas(W, H);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas در دسترس نیست');

  const vm = getViewModel();
  const student = vm?.student || {};
  const currentTermLabel = vm?.termLabel || 'نیمسال تحصیلی جاری';

  // ۱. پس‌زمینه فلت متناسب با رنگ تم
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, W, H);

  // هاله نوری بسیار ملایم در پشت عدد معدل در مرکز صفحه
  const radGlow = ctx.createRadialGradient(W / 2, H / 2 - 140, 50, W / 2, H / 2 - 140, 580);
  radGlow.addColorStop(0, hexToRgba(p.primary, p.isLight ? 0.12 : 0.24));
  radGlow.addColorStop(1, hexToRgba(p.base, 0));
  ctx.fillStyle = radGlow;
  ctx.fillRect(0, 0, W, H);

  // مشخصات دانشجو در بالای صفحه به صورت یک کپسول شناور شیک
  const studentTitle = student.fullName || 'دانشجوی صنعتی خواجه نصیر';
  const subText = [student.major, currentTermLabel].filter(Boolean).join(' · ');
  const pillText = subText ? `${studentTitle} · ${subText}` : studentTitle;

  ctx.font = 'bold 22px Arad, "Arad", sans-serif';
  const pillW = Math.min(W - 120, ctx.measureText(pillText).width + 56);
  const pillH = 54;
  const pillY = 160;

  ctx.fillStyle = hexToRgba(p.surface, p.isLight ? 0.8 : 0.5);
  roundRect(ctx, (W - pillW) / 2, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(p.surface2, 0.7);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = p.content;
  ctx.fillText(pillText, W / 2, pillY + 35);

  // ۲. بخش مرکزی: عنوان و عدد فوق‌العاده درشت معدل کل
  const terms = vm?.termsData || [];
  const gradedTerms = terms.filter((t) => t.gpa && t.gpa !== 'ـ' && t.gpa !== '-');
  const latestGraded = gradedTerms[0] || terms[0];
  const overallGpa = vm?.summary?.gpa && vm.summary.gpa !== 'ـ' && vm.summary.gpa !== '-'
    ? vm.summary.gpa
    : latestGraded?.gpa || '۱۸.۴۵';

  const numOverallGpa = parseFloat(String(overallGpa).replace(/[^\d.]/g, '')) || 0;
  const isHonor = numOverallGpa >= 17;

  const gpaCenterY = H / 2 - 100;

  // عنوان «مـعـدل کـل»
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = p.muted;
  ctx.font = 'bold 36px Arad, "Arad", sans-serif';
  ctx.fillText('مـعـدل کـل', W / 2, gpaCenterY - 140);

  // عدد بسیار درشت و چشم‌نواز معدل
  ctx.save();
  ctx.shadowColor = hexToRgba(p.primary, 0.45);
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 12;

  ctx.fillStyle = p.isLight ? p.primary : '#ffffff';
  ctx.font = 'bold 180px Arad, "Arad", sans-serif';
  ctx.fillText(toFaDigits(overallGpa), W / 2, gpaCenterY + 40);
  ctx.restore();

  // بج وضعیت تحصیلی زیر عدد معدل
  const badgeLabel = isHonor
    ? '★ دانشجوی رتبه الف (ممتاز) ★'
    : numOverallGpa >= 14
      ? '✓ وضعیت تحصیلی: عادی و مطلوب'
      : 'ثبت در سامانه جامع آموزشی دانشگاه';
  ctx.font = 'bold 20px Arad, "Arad", sans-serif';
  const bw = ctx.measureText(badgeLabel).width + 48;
  const bh = 54;
  const badgeY = gpaCenterY + 90;

  ctx.fillStyle = isHonor
    ? hexToRgba(p.success, 0.18)
    : hexToRgba(p.primary, 0.15);
  roundRect(ctx, (W - bw) / 2, badgeY, bw, bh, bh / 2);
  ctx.fill();
  ctx.strokeStyle = isHonor
    ? hexToRgba(p.success, 0.4)
    : hexToRgba(p.primary, 0.35);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = isHonor ? p.success : p.primary;
  ctx.fillText(badgeLabel, W / 2, badgeY + 35);

  // ۳. بخش پایینی: نشان سرو و تبلیغ سروستان («و زیرشم سرو و تبلیغ سروستان»)
  const brandSectionY = H - 440;

  // نشان اختصاصی سرو در کادر شکیل با گوشه‌های نرم
  const logoBoxSize = 96;
  const logoBoxX = (W - logoBoxSize) / 2;
  const logoBoxY = brandSectionY;

  ctx.fillStyle = hexToRgba(p.primary, 0.15);
  roundRect(ctx, logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 28);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(p.primary, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawSarvLogo(ctx, W / 2, logoBoxY + logoBoxSize / 2, 54, p.primary);

  // نام برند سروستان با فونت چشم‌نواز
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 38px Arad, "Arad", sans-serif';
  ctx.fillText('سـروستـان', W / 2, logoBoxY + logoBoxSize + 56);

  // شعار تبلیغاتی سروستان
  ctx.fillStyle = p.muted;
  ctx.font = '20px Arad, "Arad", sans-serif';
  ctx.fillText('دستیار هوشمند و مدرن دانشجویان صنعتی خواجه نصیر', W / 2, logoBoxY + logoBoxSize + 96);

  // کپسول آدرس سایت سروستان برای تبلیغ و دسترسی
  const promoUrl = 'mjb4khshi.github.io/sarvestan';
  ctx.font = 'bold 20px Arad, monospace';
  const urlWidth = ctx.measureText(promoUrl).width + 52;
  const urlBoxY = logoBoxY + logoBoxSize + 128;
  const urlBoxH = 48;

  ctx.fillStyle = hexToRgba(p.primary, 0.12);
  roundRect(ctx, (W - urlWidth) / 2, urlBoxY, urlWidth, urlBoxH, urlBoxH / 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(p.primary, 0.35);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.direction = 'ltr';
  ctx.textAlign = 'center';
  ctx.fillStyle = p.primary;
  ctx.fillText(promoUrl, W / 2, urlBoxY + 31);

  return canvas;
}

function getSharePlugin() {
  try {
    return globalThis.Capacitor?.Plugins?.SarvestanShare || null;
  } catch {
    return null;
  }
}

/**
 * ذخیره مستقیم بوم در گالری (در اندروید) یا دانلود در وب
 */
export async function saveCanvasImage(canvas, filename = 'sarvestan.png') {
  const p = getSharePlugin();
  if (p?.saveToGallery && canvas) {
    try {
      const base64 = canvas.toDataURL('image/png', 0.95);
      const res = await p.saveToGallery({ base64, filename });
      return res;
    } catch (e) {
      console.warn('[saveCanvasImage native]', e);
    }
  }

  const blob = await new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
    } catch {
      resolve(null);
    }
  });
  if (!blob) throw new Error('امکان آماده‌سازی باینری تصویر وجود ندارد');
  return downloadBlob(blob, filename);
}

/**
 * دانلود مستقیم باینری بومی (با پشتیبانی از ذخیره بومی در اندروید)
 */
export function downloadBlob(blob, filename = 'sarvestan.png') {
  const p = getSharePlugin();
  if (p?.saveToGallery && blob) {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        p.saveToGallery({ base64: reader.result, filename }).catch((e) => {
          console.warn('[downloadBlob native]', e);
        });
      };
      reader.readAsDataURL(blob);
      return;
    } catch (e) {
      console.warn('[downloadBlob native]', e);
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * کپی مستقیم در کلیپ‌بورد سیستم‌عامل (با پشتیبانی از افزونه نیتیو در اندروید)
 */
export async function copyCanvasToClipboard(canvas) {
  const p = getSharePlugin();
  if (p?.copyToClipboard && canvas) {
    try {
      const base64 = canvas.toDataURL('image/png', 0.95);
      await p.copyToClipboard({ base64, filename: 'sarvestan_clip.png' });
      return true;
    } catch (e) {
      console.warn('[copyCanvasToClipboard native]', e);
    }
  }

  const blob = await new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
    } catch {
      resolve(null);
    }
  });
  if (!blob) throw new Error('امکان آماده‌سازی باینری تصویر وجود ندارد');

  if (typeof navigator !== 'undefined' && navigator.clipboard?.write) {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  }
  throw new Error('کلیپ‌بورد توسط مرورگر پشتیبانی نمی‌شود');
}

/**
 * اشتراک‌گذاری از طریق نیتیو اندروید یا Web Share API با فال‌بک خودکار به دانلود/ذخیره
 */
export async function shareCanvas(canvas, { filename = 'sarvestan.png', title = 'سروستان' } = {}) {
  const p = getSharePlugin();
  if (p?.share && canvas) {
    try {
      const base64 = canvas.toDataURL('image/png', 0.95);
      await p.share({ base64, filename, title });
      return 'shared';
    } catch (e) {
      console.warn('[shareCanvas native]', e);
    }
  }

  const blob = await new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
    } catch {
      resolve(null);
    }
  });
  if (!blob) throw new Error('ساخت باینری تصویر ناموفق بود');

  const file = new File([blob], filename, { type: 'image/png' });
  try {
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text: title });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }

  // فال‌بک به ذخیره / دانلود
  await downloadBlob(blob, filename);
  return 'downloaded';
}

export function canvasToDataUrl(canvas) {
  try {
    return canvas.toDataURL('image/png', 0.94);
  } catch {
    return '';
  }
}
