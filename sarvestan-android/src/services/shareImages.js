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
  const primary = theme?.primary || '#0066a4';
  const isLight = theme?.mode === 'light';
  const base = isLight ? '#f8fafc' : theme?.base || '#0b1220';
  const surface = isLight ? '#ffffff' : '#111827';
  const surface2 = isLight ? '#e2e8f0' : '#1f2937';
  const content = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  return {
    primary,
    primaryDark: darken(primary, 0.28),
    base,
    surface,
    surface2,
    content,
    muted,
    success: isLight ? '#16a34a' : '#22c55e',
    info: isLight ? '#0284c7' : '#38bdf8',
    warn: isLight ? '#d97706' : '#fbbf24',
    danger: isLight ? '#dc2626' : '#ef4444',
    accent: isLight ? '#9333ea' : '#c084fc',
    secondary: isLight ? '#4f46e5' : '#818cf8',
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

  // نوار برند و مشخصات دانشجو در بالای پوستر افقی (شبیه هدر اپلیکیشن)
  const topX = 36;
  const topY = 22;
  const topW = W - 72;
  const topH = 104;

  ctx.fillStyle = p.surface;
  roundRect(ctx, topX, topY, topW, topH, 22);
  ctx.fill();
  ctx.strokeStyle = p.surface2;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // سمت راست: نشان سروستان + عنوان پوستر
  const logoBoxSize = 72;
  const logoX = topX + topW - logoBoxSize - 16;
  const logoY = topY + (topH - logoBoxSize) / 2;
  ctx.fillStyle = p.primary;
  roundRect(ctx, logoX, logoY, logoBoxSize, logoBoxSize, 18);
  ctx.fill();
  drawSarvLogo(ctx, logoX + logoBoxSize / 2, logoY + logoBoxSize / 2, 44, '#ffffff');

  // عنوان و بج‌های سروستان در سمت راست
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 24px Arad, "Arad", sans-serif';
  ctx.fillText('برنامه هفتگی نیمسال', logoX - 16, topY + 44);

  // برچسب‌ها زیر عنوان
  const tagY = topY + 76;
  // بج «همراه»
  ctx.fillStyle = hexToRgba(p.secondary, 0.18);
  roundRect(ctx, logoX - 16 - 84, tagY - 18, 84, 26, 8);
  ctx.fill();
  ctx.fillStyle = p.secondary;
  ctx.font = 'bold 12.5px Arad, "Arad", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('سروستان همراه', logoX - 16 - 42, tagY);

  // برچسب ترم جاری
  ctx.textAlign = 'right';
  ctx.fillStyle = p.muted;
  ctx.font = '13.5px Arad, "Arad", sans-serif';
  ctx.fillText(currentTermLabel, logoX - 110, tagY);

  // آمار کلی جلسات در وسط نوار بالا
  const { days, slots, cells } = getScheduleMatrix();
  const totalClasses = Object.keys(cells).length;
  const cur = vm?.curriculum || {};
  const enrolledUnits = cur.enrolledCredits ?? 18;

  const statsText = `${toFaDigits(totalClasses)} جلسه کلاس در هفته · ${toFaDigits(enrolledUnits)} واحد اخذشده`;
  ctx.font = 'bold 14px Arad, "Arad", sans-serif';
  const statsW = ctx.measureText(statsText).width + 32;
  const statsX = W / 2 - statsW / 2;
  ctx.fillStyle = hexToRgba(p.primary, 0.12);
  roundRect(ctx, statsX, topY + (topH - 36) / 2, statsW, 36, 12);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(p.primary, 0.28);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = p.primary;
  ctx.textAlign = 'center';
  ctx.fillText(statsText, W / 2, topY + topH / 2 + 5);

  // مشخصات دانشجو در سمت چپ (بدون مربع آواتار و بدون کد دانشجویی)
  const profX = topX + 24;
  const profY = topY + 22;

  // متن نام و رشته دانشجو
  ctx.direction = 'rtl';
  ctx.textAlign = 'left';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 22px Arad, "Arad", sans-serif';
  ctx.fillText(student.fullName || 'دانشجوی صنعتی خواجه نصیر', profX, profY + 24);

  ctx.fillStyle = p.muted;
  ctx.font = '14px Arad, "Arad", sans-serif';
  const stdInfo = [
    student.major,
    student.college || 'دانشگاه صنعتی خواجه نصیر طوسی',
  ].filter(Boolean).join(' · ');
  ctx.fillText(stdInfo, profX, profY + 52);

  // ── هندسه و ماتریس جدول افقی ──
  const gridTop = 138;
  const gridLeft = 36;
  const gridW = W - 72; // 1848px
  const headerH = 46;
  const timeColW = 144;
  const gap = 8;
  const dayColW = 331; // 5 days * 331 = 1655 + 144 + 6*8 = 1847
  const timeX = gridLeft + gridW - timeColW;

  // سرستون ستون ساعت (سمت راست جدول در RTL)
  ctx.fillStyle = p.surface;
  roundRect(ctx, timeX, gridTop, timeColW, headerH, 14);
  ctx.fill();
  ctx.strokeStyle = p.surface2;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = p.muted;
  ctx.font = 'bold 15px Arad, "Arad", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ساعت کلاس', timeX + timeColW / 2, gridTop + 29);

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
    ctx.strokeStyle = p.surface2;
    ctx.lineWidth = 1;
    ctx.stroke();

    // نام روز
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = p.content;
    ctx.font = 'bold 16.5px Arad, "Arad", sans-serif';
    ctx.fillText(dayName, dayX + dayColW - 18, gridTop + 29);

    // بج تعداد درس‌های این روز
    if (dayClassesCount > 0) {
      const badgeStr = `${toFaDigits(dayClassesCount)} درس`;
      ctx.font = 'bold 11px Arad, "Arad", sans-serif';
      const bw = ctx.measureText(badgeStr).width + 14;
      ctx.fillStyle = hexToRgba(p.primary, 0.16);
      roundRect(ctx, dayX + 14, gridTop + 11, bw, 24, 8);
      ctx.fill();
      ctx.fillStyle = p.primary;
      ctx.textAlign = 'center';
      ctx.fillText(badgeStr, dayX + 14 + bw / 2, gridTop + 27);
    }
  });

  // سطرهای زمانی (Time slots)
  const availableH = H - gridTop - headerH - gap - 56;
  const maxRows = Math.max(1, Math.min(slots.length, 6));
  const rowH = Math.floor((availableH - (maxRows - 1) * gap) / maxRows);

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

  for (let r = 0; r < maxRows; r++) {
    const y = gridTop + headerH + gap + r * (rowH + gap);

    // کادر ساعت در سمت راست (Time cell)
    ctx.fillStyle = p.surface;
    roundRect(ctx, timeX, y, timeColW, rowH, 16);
    ctx.fill();
    ctx.strokeStyle = p.surface2;
    ctx.lineWidth = 1;
    ctx.stroke();

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
      if (cells[base]) list.push(cells[base]);
      for (let n = 2; n < 8; n++) {
        if (cells[`${base}-${n}`]) list.push(cells[`${base}-${n}`]);
      }

      // خانه خالی — کادر ملایم با حاشیه ظریف
      if (!list.length) {
        ctx.fillStyle = hexToRgba(p.surface, p.isLight ? 0.25 : 0.35);
        roundRect(ctx, dayX, y, dayColW, rowH, 14);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(p.surface2, 0.4);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        continue;
      }

      // کارت‌های درس متناسب، هم‌ارتفاع با نگهدارنده سطر (rowH) و بدون نوار کناری
      if (list.length === 1) {
        const cell = list[0];
        const cardX = dayX;
        const cy = y;
        const cardW = dayColW;
        const cardH = rowH;
        const tone = toneMap[cell.color] || p.primary;

        // پس‌زمینه فلت کارت درس هماهنگ و هم‌اندازه با جایگاه سطر
        ctx.fillStyle = hexToRgba(tone, p.isLight ? 0.12 : 0.16);
        roundRect(ctx, cardX, cy, cardW, cardH, 14);
        ctx.fill();

        // حاشیه ظریف دور کارت
        ctx.strokeStyle = hexToRgba(tone, p.isLight ? 0.35 : 0.45);
        ctx.lineWidth = 1;
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

        if (cell.room && cell.room !== 'ـ') {
          ctx.direction = 'ltr';
          ctx.textAlign = 'left';
          const roomStr = `کلاس ${toFaDigits(cell.room)}`;
          ctx.font = 'bold 12.5px Arad, "Arad", sans-serif';
          const rw = ctx.measureText(roomStr).width + 16;
          ctx.fillStyle = hexToRgba(tone, 0.16);
          roundRect(ctx, cardX + 12, botY - 18, rw, 24, 6);
          ctx.fill();

          ctx.fillStyle = p.content;
          ctx.fillText(roomStr, cardX + 20, botY - 1);
        }
      } else {
        // چند درس در یک اسلات زمانی (تقسیم ارتفاع سطر میان درس‌ها)
        const gapBetween = 4;
        const cardH = Math.floor((rowH - (list.length - 1) * gapBetween) / list.length);
        list.forEach((cell, li) => {
          const cy = y + li * (cardH + gapBetween);
          const cardX = dayX;
          const cardW = dayColW;
          const tone = toneMap[cell.color] || p.primary;

          ctx.fillStyle = hexToRgba(tone, p.isLight ? 0.12 : 0.16);
          roundRect(ctx, cardX, cy, cardW, cardH, 10);
          ctx.fill();

          ctx.strokeStyle = hexToRgba(tone, p.isLight ? 0.35 : 0.45);
          ctx.lineWidth = 1;
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
          if (cell.room && cell.room !== 'ـ') {
            ctx.direction = 'ltr';
            ctx.textAlign = 'left';
            ctx.fillStyle = p.content;
            ctx.font = 'bold 11px Arad, "Arad", sans-serif';
            ctx.fillText(toFaDigits(cell.room), cardX + 10, botY);
          }
        });
      }
    }
  }

  // ── نوار فوتر مدرن با لینک سایت ──
  const footerY = H - 46;
  ctx.fillStyle = p.surface;
  roundRect(ctx, 36, footerY - 14, W - 72, 42, 14);
  ctx.fill();
  ctx.strokeStyle = p.surface2;
  ctx.lineWidth = 1;
  ctx.stroke();

  // متن وسط فوتر: ساخته‌شده با سروستان · mjb4khshi.github.io/sarvestan
  const footerBrand = 'ساخته‌شده با سروستان · mjb4khshi.github.io/sarvestan';
  ctx.font = 'bold 14.5px Arad, "Arad", sans-serif';
  const fbW = ctx.measureText(footerBrand).width;

  drawSarvLogo(ctx, W / 2 + fbW / 2 + 18, footerY + 7, 18, p.primary);

  ctx.fillStyle = p.content;
  ctx.textAlign = 'center';
  ctx.fillText(footerBrand, W / 2, footerY + 12);

  // سمت راست فوتر: ترم تحصیلی
  ctx.textAlign = 'right';
  ctx.fillStyle = p.muted;
  ctx.font = '12px Arad, "Arad", sans-serif';
  ctx.fillText(currentTermLabel, W - 56, footerY + 12);

  // سمت چپ فوتر: دانشگاه خواجه نصیر
  ctx.textAlign = 'left';
  ctx.fillText('دانشگاه صنعتی خواجه نصیر طوسی', 56, footerY + 12);

  return canvas;
}

/**
 * تولید تصویر استوری معدل و کارنامه
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

  // پس‌زمینه فلت مدرن هماهنگ با اپلیکیشن
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, W, H);

  // ۱. نوار برند و هدر رسمی سروستان در بالا
  const headX = 40;
  const headY = 36;
  const headW = W - 80;
  const headH = 106;

  ctx.fillStyle = p.surface;
  roundRect(ctx, headX, headY, headW, headH, 24);
  ctx.fill();
  ctx.strokeStyle = p.surface2;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // نشان سرو در سمت راست
  const logoBoxSize = 72;
  const logoX = headX + headW - logoBoxSize - 16;
  const logoY = headY + (headH - logoBoxSize) / 2;
  ctx.fillStyle = p.primary;
  roundRect(ctx, logoX, logoY, logoBoxSize, logoBoxSize, 18);
  ctx.fill();
  drawSarvLogo(ctx, logoX + logoBoxSize / 2, logoY + logoBoxSize / 2, 44, '#ffffff');

  // عنوان و توضیحات هدر
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 26px Arad, "Arad", sans-serif';
  ctx.fillText('کارنامه و وضعیت تحصیلی', logoX - 16, headY + 44);

  ctx.fillStyle = p.muted;
  ctx.font = '14.5px Arad, "Arad", sans-serif';
  ctx.fillText('دانشگاه صنعتی خواجه نصیر طوسی · سیستم جامع دانشگاهی', logoX - 16, headY + 76);

  // بج رسمی در سمت چپ هدر
  ctx.direction = 'ltr';
  ctx.textAlign = 'center';
  const verBadge = '✓ رسمی و معتبر';
  ctx.font = 'bold 13px Arad, "Arad", sans-serif';
  const vbw = ctx.measureText(verBadge).width + 24;
  ctx.fillStyle = hexToRgba(p.success, 0.16);
  roundRect(ctx, headX + 16, headY + (headH - 34) / 2, vbw, 34, 10);
  ctx.fill();
  ctx.fillStyle = p.success;
  ctx.fillText(verBadge, headX + 16 + vbw / 2, headY + (headH - 34) / 2 + 22);

  // ۲. هیرو کارت هویت دانشجو
  const profY = 158;
  const profH = 122;
  ctx.fillStyle = p.surface;
  roundRect(ctx, 40, profY, W - 80, profH, 24);
  ctx.fill();
  ctx.strokeStyle = p.surface2;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // آواتار دایره‌ای با نشان اختصاصی دانشجو
  const avSize = 78;
  const avX = W - 40 - 18 - avSize;
  const avY = profY + (profH - avSize) / 2;
  ctx.fillStyle = hexToRgba(p.primary, 0.14);
  roundRect(ctx, avX, avY, avSize, avSize, avSize / 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(p.primary, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const initialLetter = (student.fullName || '؟').trim().slice(0, 1);
  ctx.fillStyle = p.primary;
  ctx.font = 'bold 34px Arad, "Arad", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(initialLetter, avX + avSize / 2, avY + 52);

  // نام و رشته دانشجو
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 27px Arad, "Arad", sans-serif';
  ctx.fillText(student.fullName || 'دانشجوی خواجه نصیر', avX - 18, profY + 44);

  ctx.fillStyle = p.muted;
  ctx.font = '15px Arad, "Arad", sans-serif';
  const stdSub = [
    student.major,
  ].filter(Boolean).join(' · ');
  ctx.fillText(stdSub || student.college || 'دانشکده مهندسی', avX - 18, profY + 74);

  // دو بج سطح تحصیلی و ترم جاری زیر مشخصات
  const tagY = profY + 92;
  const levelText = student.level || 'کارشناسی';
  ctx.font = 'bold 12px Arad, "Arad", sans-serif';
  const ltw = ctx.measureText(levelText).width + 18;
  ctx.fillStyle = hexToRgba(p.secondary, 0.16);
  roundRect(ctx, avX - 18 - ltw, tagY, ltw, 24, 7);
  ctx.fill();
  ctx.fillStyle = p.secondary;
  ctx.textAlign = 'center';
  ctx.fillText(levelText, avX - 18 - ltw / 2, tagY + 16.5);

  const termChipText = currentTermLabel;
  const tctw = ctx.measureText(termChipText).width + 18;
  ctx.fillStyle = hexToRgba(p.primary, 0.14);
  roundRect(ctx, avX - 18 - ltw - 10 - tctw, tagY, tctw, 24, 7);
  ctx.fill();
  ctx.fillStyle = p.primary;
  ctx.fillText(termChipText, avX - 18 - ltw - 10 - tctw / 2, tagY + 16.5);

  // ۳. بخش جذاب نمایش معدل (Dual Showcase: معدل کل + معدل آخرین ترم)
  const terms = vm?.termsData || [];
  const gradedTerms = terms.filter((t) => t.gpa && t.gpa !== 'ـ' && t.gpa !== '-');
  const latestGraded = gradedTerms[0] || terms[0];
  const overallGpa = vm?.summary?.gpa && vm.summary.gpa !== 'ـ' ? vm.summary.gpa : latestGraded?.gpa || '—';
  const latestTermGpa = latestGraded?.gpa && latestGraded.gpa !== 'ـ' ? latestGraded.gpa : overallGpa;

  const numOverallGpa = parseFloat(String(overallGpa).replace(/[^\d.]/g, '')) || 0;
  const isHonor = numOverallGpa >= 17;

  const gpaCardY = 294;
  const gpaCardH = 260;
  const halfW = (W - 80 - 16) / 2; // 492px

  // کارت سمت راست: معدل کل دانشگاهی (Cumulative GPA)
  const rightCardX = 40 + halfW + 16;
  ctx.fillStyle = p.surface;
  roundRect(ctx, rightCardX, gpaCardY, halfW, gpaCardH, 24);
  ctx.fill();
  ctx.strokeStyle = isHonor ? hexToRgba(p.success, 0.4) : p.surface2;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // برچسب بالای کارت معدل کل
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.muted;
  ctx.font = 'bold 15px Arad, "Arad", sans-serif';
  ctx.fillText('معدل کل دانشگاهی', rightCardX + halfW - 20, gpaCardY + 36);

  // عدد بزرگ معدل کل
  ctx.textAlign = 'center';
  ctx.fillStyle = isHonor ? p.success : p.primary;
  ctx.font = 'bold 72px Arad, "Arad", sans-serif';
  ctx.fillText(toFaDigits(overallGpa), rightCardX + halfW / 2, gpaCardY + 130);

  // نشان وضعیت تحصیلی زیر معدل کل
  const honorLabel = isHonor
    ? '★ دانشجوی رتبه الف (ممتاز) ★'
    : numOverallGpa >= 14
      ? '✓ وضعیت تحصیلی: عادی و مطلوب'
      : 'وضعیت تحصیلی: نیازمند ارتقا';
  ctx.font = 'bold 13px Arad, "Arad", sans-serif';
  const hlw = ctx.measureText(honorLabel).width + 26;
  ctx.fillStyle = isHonor
    ? hexToRgba(p.success, 0.16)
    : numOverallGpa >= 14
      ? hexToRgba(p.info, 0.15)
      : hexToRgba(p.warn, 0.15);
  roundRect(ctx, rightCardX + halfW / 2 - hlw / 2, gpaCardY + 180, hlw, 36, 12);
  ctx.fill();
  ctx.fillStyle = isHonor ? p.success : numOverallGpa >= 14 ? p.info : p.warn;
  ctx.fillText(honorLabel, rightCardX + halfW / 2, gpaCardY + 203);

  // زیرنویس پایین کارت
  ctx.fillStyle = p.muted;
  ctx.font = '12px Arad, "Arad", sans-serif';
  ctx.fillText('محاسبه‌شده بر اساس تمام ترم‌ها', rightCardX + halfW / 2, gpaCardY + 238);

  // کارت سمت چپ: معدل آخرین نیمسال (Semester GPA)
  const leftCardX = 40;
  ctx.fillStyle = p.surface;
  roundRect(ctx, leftCardX, gpaCardY, halfW, gpaCardH, 24);
  ctx.fill();
  ctx.strokeStyle = p.surface2;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // برچسب ترم
  const termHead = latestGraded?.name ? `معدل ${latestGraded.name}` : 'معدل نیمسال اخیر';
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.muted;
  ctx.font = 'bold 15px Arad, "Arad", sans-serif';
  ctx.fillText(termHead, leftCardX + halfW - 20, gpaCardY + 36);

  // عدد معدل ترم
  ctx.textAlign = 'center';
  ctx.fillStyle = p.secondary;
  ctx.font = 'bold 72px Arad, "Arad", sans-serif';
  ctx.fillText(toFaDigits(latestTermGpa), leftCardX + halfW / 2, gpaCardY + 130);

  // بج وضعیت ترم
  const termStatusLabel = latestGraded?.status || 'نمرات قطعی و تأییدشده';
  ctx.font = 'bold 13px Arad, "Arad", sans-serif';
  const tslw = ctx.measureText(termStatusLabel).width + 26;
  ctx.fillStyle = hexToRgba(p.secondary, 0.16);
  roundRect(ctx, leftCardX + halfW / 2 - tslw / 2, gpaCardY + 180, tslw, 36, 12);
  ctx.fill();
  ctx.fillStyle = p.secondary;
  ctx.fillText(termStatusLabel, leftCardX + halfW / 2, gpaCardY + 203);

  ctx.fillStyle = p.muted;
  ctx.font = '12px Arad, "Arad", sans-serif';
  ctx.fillText('ثبت‌شده در سامانه یکپارچه آموزش', leftCardX + halfW / 2, gpaCardY + 238);

  // ۴. ویجت پیشرفت تحصیلی و آمار تفکیکی واحدها
  const cur = vm?.curriculum || {};
  const passedUnits = cur.passedCredits ?? (vm?.profile?.totalUnitsPassed || 0);
  const enrolledUnits = cur.enrolledCredits ?? (latestGraded?.courses?.reduce((s, c) => s + (Number(c.unit) || 0), 0) || 18);
  const totalChart = cur.totalCredits || 142;
  const remainingUnits = Math.max(0, totalChart - passedUnits - enrolledUnits);
  const pct = Math.min(100, Math.max(0, Math.round((passedUnits / totalChart) * 100)));

  const progY = 570;
  const progH = 138;
  ctx.fillStyle = p.surface;
  roundRect(ctx, 40, progY, W - 80, progH, 24);
  ctx.fill();
  ctx.strokeStyle = p.surface2;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // سربرگ پیشرفت
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 19px Arad, "Arad", sans-serif';
  ctx.fillText('پیشرفت تحصیلی تا فارغ‌التحصیلی', W - 66, progY + 34);

  ctx.textAlign = 'left';
  ctx.fillStyle = p.primary;
  ctx.font = 'bold 18px Arad, "Arad", sans-serif';
  ctx.fillText(`${toFaDigits(pct)}٪ گذرانده‌شده از ${toFaDigits(totalChart)} واحد کل`, 66, progY + 34);

  // نوار پیشرفت مدرن فلت
  const barW = W - 132;
  ctx.fillStyle = p.surface2;
  roundRect(ctx, 66, progY + 48, barW, 14, 7);
  ctx.fill();

  if (pct > 0) {
    ctx.fillStyle = isHonor ? p.success : p.primary;
    roundRect(ctx, 66, progY + 48, Math.max(14, barW * (pct / 100)), 14, 7);
    ctx.fill();
  }

  // ۳ باکس تفکیک واحدها در پایین ویجت پیشرفت
  const statBoxY = progY + 76;
  const statBoxH = 46;
  const statBoxW = (W - 132 - 16) / 3;

  const statItems = [
    { label: `✓ گذرانده: ${toFaDigits(passedUnits)} واحد`, color: p.success, bg: hexToRgba(p.success, 0.14) },
    { label: `⧗ ترم جاری: ${toFaDigits(enrolledUnits)} واحد`, color: p.info, bg: hexToRgba(p.info, 0.14) },
    { label: `باقیمانده: ${toFaDigits(remainingUnits)} واحد`, color: p.warn, bg: hexToRgba(p.warn, 0.14) },
  ];

  statItems.forEach((st, si) => {
    const sx = 66 + si * (statBoxW + 8);
    ctx.fillStyle = st.bg;
    roundRect(ctx, sx, statBoxY, statBoxW, statBoxH, 12);
    ctx.fill();

    ctx.fillStyle = st.color;
    ctx.font = 'bold 14px Arad, "Arad", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.label, sx + statBoxW / 2, statBoxY + 28);
  });

  // ۵. فهرست نمرات رسمی دروس
  const coursesToRender = latestGraded?.courses?.length ? latestGraded.courses : vm?.grades || [];
  const totalTermCredits = coursesToRender.reduce((s, c) => s + (Number(c.unit) || 0), 0);
  const termTitle = latestGraded?.name ? `نمرات رسمی ${latestGraded.name}` : 'کارنامه رسمی دروس';

  const listHeaderY = 732;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = p.content;
  ctx.font = 'bold 23px Arad, "Arad", sans-serif';
  ctx.fillText(termTitle, W - 46, listHeaderY);

  ctx.textAlign = 'left';
  ctx.fillStyle = p.muted;
  ctx.font = '15.5px Arad, "Arad", sans-serif';
  ctx.fillText(`${toFaDigits(coursesToRender.length)} عنوان درس · مجموعاً ${toFaDigits(totalTermCredits)} واحد`, 46, listHeaderY);

  let curY = 752;
  const maxCourses = Math.min(coursesToRender.length, 9);
  const availableListH = H - 80 - curY; // تا قبل از فوتر
  const rowH = Math.min(90, Math.floor((availableListH - (maxCourses - 1) * 10) / Math.max(1, maxCourses)));

  if (!maxCourses) {
    ctx.fillStyle = p.muted;
    ctx.font = '22px Arad, "Arad", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('هنوز نمره‌ای برای نمایش در این بخش ثبت نشده است', W / 2, curY + 120);
  } else {
    for (let ci = 0; ci < maxCourses; ci++) {
      const c = coursesToRender[ci];
      const cy = curY + ci * (rowH + 10);

      // کادر ردیف درس
      ctx.fillStyle = p.surface;
      roundRect(ctx, 40, cy, W - 80, rowH, 18);
      ctx.fill();
      ctx.strokeStyle = p.surface2;
      ctx.lineWidth = 1;
      ctx.stroke();

      const isDropped = c.status === 'حذف اضطراری' || c.regStatus === 'dropped';
      const isWait = c.status === 'در انتظار' || c.regStatus === 'waitlist';
      const numScore = parseFloat(String(c.displayScore ?? c.score).replace(/[^\d.]/g, ''));
      const hasScore = !isNaN(numScore) && numScore >= 0;

      // سمت راست: عنوان درس
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.fillStyle = p.content;
      ctx.font = 'bold 20px Arad, "Arad", sans-serif';
      const courseName = (c.course || c.name || 'عنوان درس').slice(0, 36);
      ctx.fillText(courseName, W - 64, cy + rowH / 2 - 6);

      // زیرنویس: واحد و وضعیت
      ctx.fillStyle = p.muted;
      ctx.font = '14px Arad, "Arad", sans-serif';
      const statusDesc = isDropped
        ? 'حذف اضطراری طبق آیین‌نامه'
        : isWait
          ? 'در انتظار اعلام نمره نهایی'
          : hasScore && numScore >= 17
            ? 'قبولی با نمره عالی'
            : hasScore && numScore >= 12
              ? 'قبولی قطعی'
              : c.status || 'ثبت در کارنامه';
      ctx.fillText(`${toFaDigits(c.unit)} واحد · ${statusDesc}`, W - 64, cy + rowH / 2 + 20);

      // سمت چپ: بج نمره زیبا و تمایزیافته
      const scoreBoxW = 96;
      const scoreBoxH = Math.min(rowH - 24, 56);
      const scoreBoxX = 58;
      const scoreBoxY = cy + (rowH - scoreBoxH) / 2;

      let scoreBg = hexToRgba(p.surface2, 0.6);
      let scoreColor = p.muted;
      let scoreText = '—';

      if (isDropped) {
        scoreBg = hexToRgba(p.danger, 0.16);
        scoreColor = p.danger;
        scoreText = 'حذف';
      } else if (isWait) {
        scoreBg = hexToRgba(p.warn, 0.16);
        scoreColor = p.warn;
        scoreText = 'انتظار';
      } else if (hasScore) {
        if (numScore >= 17) {
          scoreBg = hexToRgba(p.success, 0.16);
          scoreColor = p.success;
        } else if (numScore >= 14) {
          scoreBg = hexToRgba(p.primary, 0.16);
          scoreColor = p.primary;
        } else if (numScore >= 12) {
          scoreBg = hexToRgba(p.warn, 0.16);
          scoreColor = p.warn;
        } else {
          scoreBg = hexToRgba(p.danger, 0.16);
          scoreColor = p.danger;
        }
        scoreText = toFaDigits(c.displayScore ?? c.score);
      }

      roundRect(ctx, scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 14);
      ctx.fillStyle = scoreBg;
      ctx.fill();

      ctx.fillStyle = scoreColor;
      ctx.font = isDropped || isWait ? 'bold 19px Arad, "Arad", sans-serif' : 'bold 26px Arad, "Arad", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(scoreText, scoreBoxX + scoreBoxW / 2, scoreBoxY + scoreBoxH / 2 + (isDropped || isWait ? 6 : 9));
    }
  }

  // ۶. فوتر برند سروستان
  drawFooter(ctx, W, H, p);
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
