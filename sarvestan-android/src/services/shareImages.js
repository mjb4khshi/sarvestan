/**
 * تصویر اشتراک‌گذاری استوری سروستان — هماهنگ با هویت بصری Sarv Design و ارقام کاملاً فارسی
 */
import { toFaDigits, toPersianCourseName } from '../utils/faDigits.js';
import { formatRoomTag } from '../utils/roomUtils.js';
import { getScheduleMatrix, getViewModel, getToneForCourse } from '../data/viewModel.js';
import { computeTopologicalStages, normName } from './curriculumEngine.js';

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

function roundRect(ctx, x, y, w, h, r = 0) {
  let tl = 0, tr = 0, br = 0, bl = 0;
  if (typeof r === 'number') {
    tl = tr = br = bl = r;
  } else if (r && typeof r === 'object') {
    tl = Number(r.tl) || 0;
    tr = Number(r.tr) || 0;
    br = Number(r.br) || 0;
    bl = Number(r.bl) || 0;
  }
  const maxR = Math.min(Math.abs(w) / 2, Math.abs(h) / 2);
  tl = Math.max(0, Math.min(tl, maxR));
  tr = Math.max(0, Math.min(tr, maxR));
  br = Math.max(0, Math.min(br, maxR));
  bl = Math.max(0, Math.min(bl, maxR));

  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, [tl, tr, br, bl]);
    ctx.closePath();
    return;
  }

  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  if (tr > 0) ctx.arcTo(x + w, y, x + w, y + tr, tr);
  else ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - br);
  if (br > 0) ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  else ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + bl, y + h);
  if (bl > 0) ctx.arcTo(x, y + h, x, y + h - bl, bl);
  else ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + tl);
  if (tl > 0) ctx.arcTo(x, y, x + tl, y, tl);
  else ctx.lineTo(x, y);
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

  // دریافت مستقیم تعداد واحدهای اخذشده از دیتای خود برنامه
  const schedCourses = vm?.scheduleCourses || [];
  const schedUnits = schedCourses.reduce((sum, c) => sum + (Number(c.units ?? c.unit) || 0), 0);
  const appUnitsRaw = vm?.summary?.rawCredits ?? vm?.summary?.credits;
  let enrolledUnits = 0;
  if (typeof appUnitsRaw === 'number' && appUnitsRaw > 0) {
    enrolledUnits = appUnitsRaw;
  } else if (appUnitsRaw) {
    const parsed = parseInt(
      String(appUnitsRaw).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),
      10,
    );
    if (!isNaN(parsed) && parsed > 0) {
      enrolledUnits = parsed;
    }
  }
  enrolledUnits = Math.max(
    enrolledUnits || 0,
    schedUnits || 0,
    Number(vm?.curriculum?.enrolledCredits) || 0,
    Number(vm?.termsData?.[0]?.totalUnits) || 0
  );

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
          let profW = 0;
          if (cell.professor && cell.professor !== 'ـ') {
            ctx.font = '13px Arad, "Arad", sans-serif';
            profW = ctx.measureText(cell.professor).width;
          }
          ctx.font = 'bold 12px Arad, "Arad", sans-serif';

          // جلوگیری قاطع از هم‌پوشانی بج اتاق با نام استاد (حداقل فاصله ایمن ۱۶ پیکسل)
          const maxRw = profW > 0 ? Math.max(30, cardW - 14 - profW - 20) : (cardW - 28);
          let displayRoom = roomStr;
          let rw = ctx.measureText(displayRoom).width + 16;
          if (rw > maxRw && maxRw > 40) {
            while (displayRoom.length > 2 && ctx.measureText(displayRoom + '…').width + 16 > maxRw) {
              displayRoom = displayRoom.slice(0, -1);
            }
            displayRoom = displayRoom.trim() + '…';
            rw = ctx.measureText(displayRoom).width + 16;
          }

          if (rw <= maxRw || profW === 0) {
            ctx.fillStyle = hexToRgba(tone, 0.16);
            roundRect(ctx, cardX + 12, botY - 18, rw, 24, 6);
            ctx.fill();

            ctx.direction = 'rtl';
            ctx.textAlign = 'center';
            ctx.fillStyle = p.content;
            ctx.fillText(displayRoom, cardX + 12 + rw / 2, botY - 1);
          }
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
          let profW = 0;
          if (cell.professor && cell.professor !== 'ـ') {
            ctx.fillStyle = p.muted;
            ctx.font = '11px Arad, "Arad", sans-serif';
            profW = ctx.measureText(cell.professor).width;
            ctx.fillText(cell.professor, cardX + cardW - 10, botY);
          }
          const roomStr = formatRoomTag(cell.room);
          if (roomStr) {
            ctx.direction = 'rtl';
            ctx.textAlign = 'left';
            ctx.fillStyle = p.content;
            ctx.font = 'bold 11px Arad, "Arad", sans-serif';
            const maxRw = profW > 0 ? Math.max(20, cardW - 10 - profW - 16) : (cardW - 20);
            let displayRoom = roomStr;
            if (ctx.measureText(displayRoom).width > maxRw && maxRw > 30) {
              while (displayRoom.length > 2 && ctx.measureText(displayRoom + '…').width > maxRw) {
                displayRoom = displayRoom.slice(0, -1);
              }
              displayRoom = displayRoom.trim() + '…';
            }
            ctx.fillText(displayRoom, cardX + 10, botY);
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

function resolveTone(toneName, pal) {
  if (!pal) return '#0ea5e9';
  const map = {
    primary: pal.primary,
    info: pal.info,
    success: pal.success,
    secondary: pal.secondary,
    accent: pal.accent,
    warn: pal.warn,
    danger: pal.danger,
  };
  return map[toneName] || pal.primary || '#0ea5e9';
}

/**
 * ساخت پوستر شیک استوری مطالعه روزانه — طراحی مینیمال، مدرن و هماهنگ با تم سروستان (بدون گرادیانت و با توازن عمودی کامل)
 */
export async function renderStudyStoryImage({ stats, student, theme }) {
  await ensureFont();
  const pal = buildPalette(theme);

  const W = 1080;
  const H = 1920;
  const canvas = newCanvas(W, H);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas در دسترس نیست');

  const vm = getViewModel();
  const scheduleCourses = vm?.scheduleCourses || [];

  // ۱. پس‌زمینه فلت متناسب با تم
  ctx.fillStyle = pal.base;
  ctx.fillRect(0, 0, W, H);

  // هاله نوری بسیار ملایم در مرکز پوستر
  const radGlow = ctx.createRadialGradient(W / 2, 580, 50, W / 2, 580, 560);
  radGlow.addColorStop(0, hexToRgba(pal.primary, pal.isLight ? 0.12 : 0.22));
  radGlow.addColorStop(1, hexToRgba(pal.base, 0));
  ctx.fillStyle = radGlow;
  ctx.fillRect(0, 0, W, H);

  // ۲. هدر برند سروستان در بالای پوستر
  const headerX = 50;
  const headerY = 56;
  const headerW = W - 100;
  const headerH = 116;

  ctx.fillStyle = pal.surface;
  roundRect(ctx, headerX, headerY, headerW, headerH, 24);
  ctx.fill();
  ctx.strokeStyle = pal.surface2;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // باکس آیکون رسمی سرو
  ctx.fillStyle = hexToRgba(pal.primary, 0.15);
  roundRect(ctx, headerX + 20, headerY + 18, 80, 80, 20);
  ctx.fill();
  drawSarvLogo(ctx, headerX + 60, headerY + 58, 48, pal.primary);

  // عنوان و تاریخ هدر
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = pal.content;
  ctx.font = 'bold 30px Arad, "Arad", sans-serif';
  ctx.fillText('سروستان · گزارش مطالعه و تمرکز', headerX + headerW - 28, headerY + 50);

  const todayFa = new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  ctx.font = '17px Arad, "Arad", sans-serif';
  ctx.fillStyle = pal.muted;
  ctx.fillText(todayFa, headerX + headerW - 28, headerY + 88);

  // مشخصات دانشجو در کپسول شناور
  const studentName = student?.fullName || 'دانشجوی صنعتی خواجه نصیر';
  const majorText = student?.major ? ` · ${student.major}` : '';
  const infoPill = `${studentName}${majorText}`;
  ctx.font = 'bold 20px Arad, "Arad", sans-serif';
  const pillW = Math.min(W - 140, ctx.measureText(infoPill).width + 60);
  const pillH = 46;
  const pillY = 200;

  ctx.fillStyle = hexToRgba(pal.surface, pal.isLight ? 0.85 : 0.5);
  roundRect(ctx, (W - pillW) / 2, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(pal.surface2, 0.65);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = pal.content;
  ctx.fillText(infoPill, W / 2, pillY + 30);

  // ۳. بخش مرکزی: عدد بسیار درشت و چشم‌نواز مطالعه (مشابه استایل پوستر معدل)
  const heroCenterY = 470;

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = pal.muted;
  ctx.font = 'bold 28px Arad, "Arad", sans-serif';
  ctx.fillText('مـیـزان مـطـالـعـه و تـمـرکـز امـروز', W / 2, heroCenterY - 110);

  const todayHrs = toFaDigits(stats?.todayHours || '۰');
  ctx.fillStyle = pal.isLight ? pal.primary : '#ffffff';
  ctx.font = 'bold 155px Arad, "Arad", sans-serif';
  ctx.fillText(todayHrs, W / 2, heroCenterY + 40);

  ctx.fillStyle = pal.muted;
  ctx.font = 'bold 26px Arad, "Arad", sans-serif';
  const todayMins = toFaDigits(stats?.todayMinutes || 0);
  ctx.fillText(`ساعت تمرکز خالص (معادل ${todayMins} دقیقه)`, W / 2, heroCenterY + 95);

  // کپسول وضعیت زیر عدد
  const badgeText = stats?.streak > 1
    ? `★ پیوستگی مطالعه: ${toFaDigits(stats.streak)} روز متوالی در اوج تمرکز ★`
    : '✓ تعهد به انجام تکالیف و آمادگی تحصیلی';
  ctx.font = 'bold 19px Arad, "Arad", sans-serif';
  const bw = ctx.measureText(badgeText).width + 48;
  const by = heroCenterY + 125;

  ctx.fillStyle = hexToRgba(pal.primary, pal.isLight ? 0.12 : 0.2);
  roundRect(ctx, (W - bw) / 2, by, bw, 42, 21);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(pal.primary, 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = pal.primary;
  ctx.fillText(badgeText, W / 2, by + 28);

  // ۴. شبکه ۲×۲ کارت‌های کلیدی عملکرد (پیوستگی، ساعات کل، سشن‌ها، تسک‌ها)
  const gridY = 690;
  const colW = (W - 130) / 2;
  const rowH = 105;
  const gap = 20;

  const metrics = [
    {
      title: 'پیوستگی فعال',
      value: `${toFaDigits(stats?.streak || 1)} روز پیاپی`,
      sub: 'پیوستگی مداوم در مطالعه',
      tone: pal.accent,
      icon: '🔥',
    },
    {
      title: 'مجموع مطالعه کل ترم',
      value: `${toFaDigits(stats?.totalHours || '۰')} ساعت`,
      sub: 'زمان انباشته دانشگاهی',
      tone: pal.info,
      icon: '⏱',
    },
    {
      title: 'تعداد جلسات تمرکز',
      value: `${toFaDigits(stats?.totalSessions || 0)} سشن`,
      sub: 'پومودورو و آزاد',
      tone: pal.primary,
      icon: '🎯',
    },
    {
      title: 'تکالیف تحویل‌شده',
      value: `${toFaDigits(stats?.totalTasksDone || 0)} تکلیف`,
      sub: `از مجموع ${toFaDigits(stats?.totalTasks || 0)} مورد`,
      tone: pal.success,
      icon: '✓',
    },
  ];

  metrics.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = col === 0 ? W - 50 - colW : 50;
    const y = gridY + row * (rowH + gap);

    ctx.fillStyle = pal.surface;
    roundRect(ctx, x, y, colW, rowH, 24);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(m.tone, pal.isLight ? 0.35 : 0.45);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = m.tone;
    ctx.font = 'bold 24px Arad, "Arad", sans-serif';
    ctx.fillText(`${m.icon} ${m.value}`, x + colW - 22, y + 42);

    ctx.fillStyle = pal.content;
    ctx.font = 'bold 16px Arad, "Arad", sans-serif';
    ctx.fillText(m.title, x + colW - 22, y + 70);

    ctx.fillStyle = pal.muted;
    ctx.font = '13px Arad, "Arad", sans-serif';
    ctx.fillText(m.sub, x + colW - 22, y + 92);
  });

  // ۵. بخش تفکیک دروس و تکالیف ترم جاری (پرکننده متوازن نیمه دوم پوستر)
  const coursesStartY = 960;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = pal.content;
  ctx.font = 'bold 28px Arad, "Arad", sans-serif';
  ctx.fillText('دروس و برنامه‌های تحصیلی نیمسال جاری:', W - 55, coursesStartY);

  // آماده‌سازی دروس: اگر سشنی ثبت شده باشد از byCourse، وگرنه از دروس رسمی برنامه بهستان
  let displayCourses = (stats?.byCourse || []).slice(0, 5);
  if (displayCourses.length < 4 && scheduleCourses.length > 0) {
    const existingNames = new Set(displayCourses.map((c) => c.name));
    for (const sc of scheduleCourses) {
      if (!existingNames.has(sc.name)) {
        displayCourses.push({
          name: sc.name,
          color: getToneForCourse(sc),
          totalMinutes: 0,
          sessionsCount: 0,
          professor: sc.professor,
          units: sc.units,
        });
      }
      if (displayCourses.length >= 5) break;
    }
  }

  let cardY = coursesStartY + 30;
  const courseCardH = 110;
  const courseCardGap = 16;

  for (const c of displayCourses.slice(0, 5)) {
    const rowTone = resolveTone(c.color || 'primary', pal);

    ctx.fillStyle = hexToRgba(pal.surface, pal.isLight ? 0.95 : 0.7);
    roundRect(ctx, 50, cardY, W - 100, courseCardH, 22);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(rowTone, pal.isLight ? 0.35 : 0.5);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // نوار رنگی نشان درس
    ctx.fillStyle = rowTone;
    roundRect(ctx, W - 58, cardY + 18, 8, courseCardH - 36, 4);
    ctx.fill();

    // نام درس
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = pal.content;
    ctx.font = 'bold 26px Arad, "Arad", sans-serif';
    ctx.fillText(c.name, W - 85, cardY + 48);

    // استاد و مشخصات
    const subDesc = c.sessionsCount > 0
      ? `${toFaDigits(c.sessionsCount)} جلسه تمرکز ثبت‌شده`
      : c.professor ? `استاد: ${c.professor}${c.units ? ` · ${toFaDigits(c.units)} واحد` : ''}` : 'واحد فعال در برنامه هفتگی';
    ctx.font = '15px Arad, "Arad", sans-serif';
    ctx.fillStyle = pal.muted;
    ctx.fillText(subDesc, W - 85, cardY + 84);

    // مدت زمان یا برچسب
    ctx.textAlign = 'left';
    if (c.totalMinutes > 0) {
      const cHrs = toFaDigits((c.totalMinutes / 60).toFixed(1));
      ctx.fillStyle = rowTone;
      ctx.font = 'bold 26px Arad, "Arad", sans-serif';
      ctx.fillText(`${cHrs} ساعت`, 85, cardY + 62);
    } else {
      ctx.fillStyle = pal.muted;
      ctx.font = 'bold 16px Arad, "Arad", sans-serif';
      ctx.fillText('آماده برای تمرکز', 85, cardY + 62);
    }

    cardY += courseCardH + courseCardGap;
  }

  // ۶. نوار فوتر مدرن با لوگوی رسمی سرو
  const footerX = 50;
  const footerW = W - 100;
  const footerY = 1790;
  const footerH = 68;

  ctx.fillStyle = pal.surface;
  roundRect(ctx, footerX, footerY, footerW, footerH, 20);
  ctx.fill();
  ctx.strokeStyle = pal.surface2;
  ctx.lineWidth = 1;
  ctx.stroke();

  const footerBrand = 'ساخته‌شده با سروستان · mjb4khshi.github.io/sarvestan';
  ctx.font = 'bold 18px Arad, "Arad", sans-serif';
  ctx.fillStyle = pal.content;
  ctx.textAlign = 'center';
  ctx.fillText(footerBrand, W / 2, footerY + 41);

  drawSarvLogo(
    ctx,
    W / 2 + ctx.measureText(footerBrand).width / 2 + 24,
    footerY + footerH / 2,
    22,
    pal.primary
  );

  return canvas;
}

/**
 * پوستر افقی باکیفیت و گرافیکی چارت تحصیلی و نقشه راه دوره (۱۹۲۰×۱۰۸۰ افقی)
 * پشتیبانی کامل از تمامی رشته‌ها با فلوچارت ورک‌فلو و خطوط جریان پیش‌نیازها
 */
export async function renderCurriculumPoster({ theme, curriculumState, student }) {
  await ensureFont();
  const W = 1920;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const pal = buildPalette(theme);

  // ۱. پس‌زمینه فلت متناسب با رنگ تم (دقیقاً هماهنگ با استایل برنامه هفتگی و معدل)
  ctx.fillStyle = pal.base;
  ctx.fillRect(0, 0, W, H);


  const MARGIN = 42;
  const CONTENT_W = W - MARGIN * 2;

  // ۲. نوار هدر برندینگ و اطلاعات دانشجو
  const headerY = 24;
  const headerH = 80;
  ctx.fillStyle = hexToRgba(pal.surface, pal.isLight ? 0.95 : 0.72);
  roundRect(ctx, MARGIN, headerY, CONTENT_W, headerH, 20);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(pal.primary, 0.28);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // راست هدر: لوگوی سروستان و تیتر ورک‌فلو
  drawSarvLogo(ctx, W - MARGIN - 32, headerY + 40, 32, pal.primary);

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = pal.content;
  ctx.font = '900 25px Arad, "Arad", sans-serif';
  ctx.fillText('سروستان', W - MARGIN - 74, headerY + 36);

  ctx.font = 'bold 13px Arad, "Arad", sans-serif';
  ctx.fillStyle = pal.muted;
  ctx.fillText('نقشه راه و گراف جریان تحصیلی (ورک‌فلو) · نسخه آزمایشی', W - MARGIN - 74, headerY + 58);

  // مرکز هدر: هویت دانشجو
  const sName = student?.fullName || curriculumState?.studentName || 'دانشجو';
  const sMajor = student?.major || curriculumState?.degreeTitle || 'مهندسی';
  const sId = student?.studentId || curriculumState?.studentId || '';
  const sGpa = student?.gpa || curriculumState?.gpa || '';

  ctx.textAlign = 'center';
  ctx.fillStyle = pal.content;
  ctx.font = '900 24px Arad, "Arad", sans-serif';
  ctx.fillText(sName, W / 2, headerY + 35);

  ctx.font = 'bold 14px Arad, "Arad", sans-serif';
  ctx.fillStyle = pal.primary;
  const subInfoParts = [
    sMajor,
    sId ? `شماره دانشجویی: ${toFaDigits(sId)}` : null,
    sGpa ? `معدل کل: ${toFaDigits(sGpa)}` : null,
  ].filter(Boolean);
  ctx.fillText(subInfoParts.join('  ·  '), W / 2, headerY + 60);

  // چپ هدر: دانشگاه صنعتی خواجه نصیرالدین طوسی
  ctx.textAlign = 'left';
  ctx.fillStyle = pal.content;
  ctx.font = 'bold 15px Arad, "Arad", sans-serif';
  ctx.fillText('دانشگاه صنعتی خواجه نصیرالدین طوسی', MARGIN + 26, headerY + 36);

  ctx.fillStyle = pal.muted;
  ctx.font = '12px Arad, "Arad", sans-serif';
  ctx.fillText('چارت مصوب دوره کارشناسی پیوسته', MARGIN + 26, headerY + 58);

  // ۳. نوار آمار و پیشرفت تحصیلی (کاملاً پویا بدون هاردکد)
  const statsY = headerY + headerH + 14;
  const statsH = 70;
  ctx.fillStyle = hexToRgba(pal.surface, pal.isLight ? 0.95 : 0.7);
  roundRect(ctx, MARGIN, statsY, CONTENT_W, statsH, 18);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(pal.surface2, 0.85);
  ctx.lineWidth = 1;
  ctx.stroke();

  const totalCredits = curriculumState?.totalCredits || 140;
  const passedCredits = curriculumState?.passedCredits || 0;
  const enrolledCredits = curriculumState?.enrolledCredits || 0;
  const remainingCredits = curriculumState?.remainingCredits || Math.max(0, totalCredits - passedCredits - enrolledCredits);
  const progressPercent = curriculumState?.progressPercent || Math.min(100, Math.round((passedCredits / Math.max(1, totalCredits)) * 100));
  const availableCount = curriculumState?.availableCount || 0;

  // سمت چپ نوار آمار: نوار گرافیکی پیشرفت
  const barW = 260;
  const barH = 10;
  const barX = MARGIN + 24;
  const barY = statsY + 38;

  ctx.textAlign = 'left';
  ctx.font = 'bold 13px Arad, "Arad", sans-serif';
  ctx.fillStyle = pal.content;
  ctx.fillText(`پیشرفت فارغ‌التحصیلی: ${toFaDigits(progressPercent)}٪`, barX, barY - 10);

  ctx.fillStyle = pal.surface2;
  roundRect(ctx, barX, barY, barW, barH, 5);
  ctx.fill();

  const fillW = Math.max(8, Math.min(barW, (barW * progressPercent) / 100));
  ctx.fillStyle = pal.primary;
  roundRect(ctx, barX, barY, fillW, barH, 5);
  ctx.fill();

  // سمت راست نوار آمار: ۵ برچسب شاخص کلیدی
  const statBadges = [
    { label: 'کل واحد مصوب', value: `${toFaDigits(totalCredits)} و`, color: pal.content },
    { label: 'پاس‌شده', value: `${toFaDigits(passedCredits)} و`, color: '#10b981' },
    { label: 'ترم جاری', value: `${toFaDigits(enrolledCredits)} و`, color: pal.accent },
    { label: 'باقیمانده', value: `${toFaDigits(remainingCredits)} و`, color: pal.muted },
    { label: 'مجاز ترم بعد ⭐', value: `${toFaDigits(availableCount)} درس`, color: '#eab308' },
  ];

  const badgesStartX = barX + barW + 40;
  const badgesAreaW = W - MARGIN - badgesStartX - 10;
  const badgeColW = badgesAreaW / statBadges.length;

  statBadges.forEach((sb, idx) => {
    const cx = W - MARGIN - (idx + 0.5) * badgeColW;
    ctx.textAlign = 'center';
    ctx.fillStyle = pal.muted;
    ctx.font = '12px Arad, "Arad", sans-serif';
    ctx.fillText(sb.label, cx, statsY + 28);

    ctx.fillStyle = sb.color;
    ctx.font = '900 19px Arad, "Arad", sans-serif';
    ctx.fillText(sb.value, cx, statsY + 53);
  });

  // ۴. گراف ورک‌فلو ۴ مرحله‌ای (افقی از راست به چپ)
  const graphY = statsY + statsH + 16;
  const COL_GAP = 26;
  const COL_W = (CONTENT_W - 3 * COL_GAP) / 4;

  const allCourses = curriculumState?.allCourses || [];
  const stages = computeTopologicalStages(allCourses);

  // ساخت مپ سریع برای یافتن درس‌ها بر اساس کد و نام نرمال‌شده
  const courseLookup = new Map();
  for (const c of allCourses) {
    if (!c) continue;
    if (c.code) courseLookup.set(String(c.code), c);
    courseLookup.set(normName(c.name || ''), c);
  }

  // ثبت مختصات کارت‌های ترسیم‌شده برای محاسبه اتصال خطوط و فلش‌ها
  const renderedCards = new Map(); // key -> { x, y, w, h, colIdx, course }
  const connections = []; // { fromKey, toKey, fromCard, toCard, status }

  const cardH = 66;
  const cardGap = 8;
  const maxCardsPerStage = 9;

  // ترسیم ۴ ستون مراحل جریان
  for (let sIdx = 0; sIdx < 4; sIdx++) {
    const stg = stages[sIdx] || { title: `مرحله ${toFaDigits(sIdx + 1)}`, courses: [] };
    // در RTL ستون ۰ در راست‌ترین نقطه قرار دارد
    const colX = W - MARGIN - (sIdx + 1) * COL_W - sIdx * COL_GAP;

    // هدر ستون مرحله
    const colHeaderH = 38;
    ctx.fillStyle = hexToRgba(pal.primary, 0.14);
    roundRect(ctx, colX, graphY, COL_W, colHeaderH, 12);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(pal.primary, 0.35);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.font = '900 13.5px Arad, "Arad", sans-serif';
    ctx.fillStyle = pal.content;
    ctx.fillText(stg.title, colX + COL_W - 14, graphY + 24);

    ctx.textAlign = 'left';
    ctx.font = 'bold 11.5px Arad, "Arad", sans-serif';
    ctx.fillStyle = pal.primary;
    ctx.fillText(`${toFaDigits(stg.courses.length)} درس`, colX + 14, graphY + 24);

    // اولویت‌بندی دروس برای نمایش بهینه در پوستر
    const sortedCourses = [...stg.courses].sort((a, b) => {
      const order = { enrolled: 0, available: 1, passed: 2, locked: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    });

    const displayCourses = sortedCourses.slice(0, maxCardsPerStage);
    const hiddenCount = sortedCourses.length - displayCourses.length;

    let currentCardY = graphY + colHeaderH + 10;

    displayCourses.forEach((course) => {
      const cKey = course.code ? String(course.code) : normName(course.name || '');

      // رنگ و ظاهر کارت بر اساس وضعیت واقعی درس
      let cardBg = hexToRgba(pal.surface, 0.85);
      let cardBorder = hexToRgba(pal.surface2, 0.8);
      let statusIcon = '🔒';
      let statusColor = pal.muted;

      if (course.status === 'passed') {
        cardBg = hexToRgba('#10b981', 0.12);
        cardBorder = hexToRgba('#10b981', 0.45);
        statusIcon = '✓';
        statusColor = '#10b981';
      } else if (course.status === 'enrolled') {
        cardBg = hexToRgba(pal.accent, 0.16);
        cardBorder = hexToRgba(pal.accent, 0.55);
        statusIcon = '⏳';
        statusColor = pal.accent;
      } else if (course.status === 'available') {
        cardBg = hexToRgba('#eab308', 0.14);
        cardBorder = hexToRgba('#eab308', 0.5);
        statusIcon = '⭐';
        statusColor = '#eab308';
      }

      // بدنه کارت
      ctx.fillStyle = cardBg;
      roundRect(ctx, colX, currentCardY, COL_W, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1;
      ctx.stroke();

      // آیکون وضعیت در سمت راست
      ctx.textAlign = 'right';
      ctx.font = 'bold 13px Arad, "Arad", sans-serif';
      ctx.fillStyle = statusColor;
      ctx.fillText(statusIcon, colX + COL_W - 14, currentCardY + 25);

      // نام درس
      ctx.font = '900 13px Arad, "Arad", sans-serif';
      ctx.fillStyle = pal.content;
      const cleanName = toPersianCourseName(course.name);
      const nameTrunc = cleanName.length > 25 ? cleanName.slice(0, 24) + '…' : cleanName;
      ctx.fillText(nameTrunc, colX + COL_W - 32, currentCardY + 25);

      // زیرنویس (تعداد واحد + نمره یا دسته‌بندی)
      ctx.font = '11px Arad, "Arad", sans-serif';
      ctx.fillStyle = pal.muted;
      let subTxt = `${toFaDigits(course.units || 3)} واحد`;
      if (course.status === 'passed' && course.gradeDisplay && course.gradeDisplay !== 'قبول') {
        subTxt += ` · نمره: ${toFaDigits(course.gradeDisplay)}`;
      } else if (course.category) {
        subTxt += ` · ${course.category}`;
      }
      ctx.fillText(subTxt, colX + COL_W - 32, currentCardY + 48);

      // نشانگر کوچک واحد/کد درس در سمت چپ کارت
      if (course.code) {
        ctx.textAlign = 'left';
        ctx.font = '10px Arad, "Arad", sans-serif';
        ctx.fillStyle = hexToRgba(pal.muted, 0.7);
        ctx.fillText(toFaDigits(course.code), colX + 12, currentCardY + 48);
      }

      renderedCards.set(cKey, {
        x: colX,
        y: currentCardY,
        w: COL_W,
        h: cardH,
        colIdx: sIdx,
        course,
      });

      currentCardY += cardH + cardGap;
    });

    // اگر دروسی بیش از ظرفیت کارت‌ها در این مرحله مانده، پیل کوچک راهنما
    if (hiddenCount > 0) {
      ctx.fillStyle = hexToRgba(pal.surface2, 0.4);
      roundRect(ctx, colX, currentCardY, COL_W, 28, 8);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.font = 'bold 11px Arad, "Arad", sans-serif';
      ctx.fillStyle = pal.muted;
      ctx.fillText(`+ ${toFaDigits(hiddenCount)} درس دیگر در این مرحله`, colX + COL_W / 2, currentCardY + 18);
    }
  }

  // ۵. ایجاد خطوط جریان و اتصالات Bezier بین مراحل مجاور
  for (const [cKey, card] of renderedCards.entries()) {
    if (card.colIdx === 0) continue; // دروس ورودی پیش‌نیاز قبلی در چارت ندارند

    for (const p of card.course.prerequisites || []) {
      const pKey = p.code ? String(p.code) : normName(p.name || '');
      const parentCard = renderedCards.get(pKey);
      if (parentCard && parentCard.colIdx < card.colIdx) {
        connections.push({
          fromKey: pKey,
          toKey: cKey,
          fromCard: parentCard,
          toCard: card,
          status: card.course.status,
        });
        break; // جهت شفافیت و زیبایی، ۱ اتصال مستقیم تمیز برای هر درس
      }
    }
  }

  // محاسبه پورت‌های خروجی و ورودی برای جلوگیری قطعی از همپوشانی خطوط و فلش‌ها
  const srcUsage = new Map();
  const tgtUsage = new Map();
  connections.forEach((conn) => {
    srcUsage.set(conn.fromKey, (srcUsage.get(conn.fromKey) || 0) + 1);
    tgtUsage.set(conn.toKey, (tgtUsage.get(conn.toKey) || 0) + 1);
  });

  const srcCount = new Map();
  const tgtCount = new Map();

  const getPort = (idx, total) => {
    if (total <= 1) return 0.5;
    if (total === 2) return idx === 0 ? 0.35 : 0.65;
    if (total === 3) return idx === 0 ? 0.25 : idx === 1 ? 0.5 : 0.75;
    return 0.2 + (0.6 * idx) / (total - 1);
  };

  // رسم خطوط منحنی Bezier جریان و سرپیکان‌های فلش
  connections.forEach((conn) => {
    const sTotal = srcUsage.get(conn.fromKey) || 1;
    const sIdx = srcCount.get(conn.fromKey) || 0;
    srcCount.set(conn.fromKey, sIdx + 1);

    const tTotal = tgtUsage.get(conn.toKey) || 1;
    const tIdx = tgtCount.get(conn.toKey) || 0;
    tgtCount.set(conn.toKey, tIdx + 1);

    const sPort = getPort(sIdx, sTotal);
    const tPort = getPort(tIdx, tTotal);

    // مختصات مبدأ (سمت چپ کارت پیش‌نیاز در ستون راست)
    const x1 = conn.fromCard.x;
    const y1 = conn.fromCard.y + conn.fromCard.h * sPort;

    // مختصات مقصد (سمت راست کارت فرزند در ستون چپ)
    const x2 = conn.toCard.x + conn.toCard.w;
    const y2 = conn.toCard.y + conn.toCard.h * tPort;

    // رنگ خط بر اساس وضعیت درس مقصد
    let strokeColor = hexToRgba(pal.content, 0.22);
    let arrowColor = hexToRgba(pal.content, 0.35);
    let lineWidth = 1.5;

    if (conn.status === 'passed') {
      strokeColor = hexToRgba('#10b981', 0.6);
      arrowColor = '#10b981';
      lineWidth = 2;
    } else if (conn.status === 'enrolled') {
      strokeColor = hexToRgba(pal.accent, 0.75);
      arrowColor = pal.accent;
      lineWidth = 2.2;
    } else if (conn.status === 'available') {
      strokeColor = hexToRgba('#eab308', 0.7);
      arrowColor = '#eab308';
      lineWidth = 2;
    }

    const dx = (x1 - x2) * 0.45;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 - dx, y1, x2 + dx, y2, x2, y2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // رسم سرپیکان فلش تمیز به سمت کارت مقصد (جهت چپ)
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + 7, y2 - 4.5);
    ctx.lineTo(x2 + 7, y2 + 4.5);
    ctx.closePath();
    ctx.fillStyle = arrowColor;
    ctx.fill();
  });

  // ۶. نوار راهنمای وضعیت‌ها و فوتر رسمی سروستان
  const footerY = 1010;
  const footerH = 50;
  ctx.fillStyle = pal.surface;
  roundRect(ctx, MARGIN, footerY, CONTENT_W, footerH, 16);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(pal.surface2, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();

  // راست فوتر: راهنمای وضعیت رنگ‌ها
  const legends = [
    { icon: '✓', label: 'گذرانده', color: '#10b981' },
    { icon: '⏳', label: 'در حال اخذ (ترم جاری)', color: pal.accent },
    { icon: '⭐', label: 'مجاز به اخذ ترم بعد', color: '#eab308' },
    { icon: '🔒', label: 'قفل (پیش‌نیاز مانده)', color: pal.muted },
  ];

  let legX = W - MARGIN - 20;
  legends.forEach((lg) => {
    ctx.textAlign = 'right';
    ctx.font = 'bold 12.5px Arad, "Arad", sans-serif';
    ctx.fillStyle = lg.color;
    const txt = `${lg.icon} ${lg.label}`;
    ctx.fillText(txt, legX, footerY + 31);
    legX -= ctx.measureText(txt).width + 36;
  });

  // چپ فوتر: متن برندینگ سروستان
  const footerText = 'تولیدشده با سروستان · دستیار هوشمند دانشگاه صنعتی خواجه نصیرالدین طوسی (نسخه آزمایشی چارت)';
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px Arad, "Arad", sans-serif';
  ctx.fillStyle = pal.content;
  ctx.fillText(footerText, MARGIN + 42, footerY + 31);

  drawSarvLogo(ctx, MARGIN + 24, footerY + footerH / 2, 18, pal.primary);

  return canvas;
}


