import QRCode from 'qrcode';
import kntuLogoUrl from '../assets/logos/kntu-logo.png';
import sarvestanLogoUrl from '/sarv-logo.png';
import tehranMetroLogoUrl from '../assets/logos/tehran-metro.svg';
import {KNTU_CAMPUSES, type CampusId, type KntuCampus} from '../data/kntuCampuses';
import {TEHRAN_BRT_LINES, TEHRAN_METRO_LINES} from '../data/tehranTransit';
import {renderCampusKorokiToCanvas} from './campusKoroki';
import {buildDeepLink, toPersianDigits, type SarvThemeId} from './wayfinder';

export type PosterFormat = 'a4' | 'story' | 'square';

export interface PosterConfig {
  target: CampusId | 'all';
  format: PosterFormat;
  theme: SarvThemeId;
  baseUrl: string;
  footerTagline?: string;
}

export const POSTER_DIMENSIONS: Record<
  PosterFormat,
  {width: number; height: number; label: string; ratioLabel: string}
> = {
  a4: {width: 1240, height: 1754, label: 'پوستر چاپی A4', ratioLabel: 'عمودی · مناسب چاپ برد'},
  story: {width: 1080, height: 1920, label: 'استوری و کانال', ratioLabel: '۹:۱۶ · تلگرام و اینستاگرام'},
  square: {width: 1080, height: 1080, label: 'کارت اشتراک‌گذاری', ratioLabel: '۱:۱ · ارسال سریع در چت'},
};

interface PosterPalette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  primaryText: string;
  accent: string;
  warnBg: string;
  warnText: string;
}

export const POSTER_PALETTES: Record<SarvThemeId, PosterPalette> = {
  'persian-light': {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#CBD5E1',
    text: '#0F172A',
    muted: '#334155',
    primary: '#0066A4',
    primaryText: '#FFFFFF',
    accent: '#FE28A2',
    warnBg: '#FEF3C7',
    warnText: '#92400E',
  },
  'persian-dark': {
    bg: '#070A11',
    surface: '#0F172A',
    surfaceAlt: '#1E293B',
    border: '#334155',
    text: '#F8FAFC',
    muted: '#CBD5E1',
    primary: '#38BDF8',
    primaryText: '#082F49',
    accent: '#FE28A2',
    warnBg: '#451A03',
    warnText: '#FDE68A',
  },
  emerald: {
    bg: '#04130C',
    surface: '#092218',
    surfaceAlt: '#103627',
    border: '#1F523E',
    text: '#ECFDF5',
    muted: '#A7F3D0',
    primary: '#10B981',
    primaryText: '#031A11',
    accent: '#34D399',
    warnBg: '#382606',
    warnText: '#FDE68A',
  },
  tehran: {
    bg: '#FAF4E8',
    surface: '#FFFDF8',
    surfaceAlt: '#F2E5CC',
    border: '#D5BE95',
    text: '#003049',
    muted: '#1D445D',
    primary: '#C1121F',
    primaryText: '#FFFFFF',
    accent: '#669BBC',
    warnBg: '#FEF3C7',
    warnText: '#78350F',
  },
  'tehran-2': {
    bg: '#141C0C',
    surface: '#1F2B14',
    surfaceAlt: '#2A3A1C',
    border: '#43582E',
    text: '#FEFAE0',
    muted: '#D8DEC4',
    primary: '#DDA15E',
    primaryText: '#1B2610',
    accent: '#BC6C25',
    warnBg: '#382810',
    warnText: '#FDE68A',
  },
  nordic: {
    bg: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceAlt: '#E2E8F0',
    border: '#CBD5E1',
    text: '#0F172A',
    muted: '#334155',
    primary: '#0284C7',
    primaryText: '#FFFFFF',
    accent: '#0EA5E9',
    warnBg: '#FEF3C7',
    warnText: '#78350F',
  },
  matcha: {
    bg: '#F4F7F0',
    surface: '#FFFFFF',
    surfaceAlt: '#E8EFE1',
    border: '#CBD8BF',
    text: '#1A2E05',
    muted: '#365314',
    primary: '#4D7C0F',
    primaryText: '#FFFFFF',
    accent: '#65A30D',
    warnBg: '#FEF3C7',
    warnText: '#78350F',
  },
  sunset: {
    bg: '#FFF8F3',
    surface: '#FFFFFF',
    surfaceAlt: '#FAECE1',
    border: '#F3D2BC',
    text: '#292524',
    muted: '#57534E',
    primary: '#FF5E36',
    primaryText: '#FFFFFF',
    accent: '#E11D48',
    warnBg: '#FEF3C7',
    warnText: '#78350F',
  },
  cyberpunk: {
    bg: '#05060A',
    surface: '#0E111B',
    surfaceAlt: '#161B2B',
    border: '#27324B',
    text: '#E2E8F0',
    muted: '#94A3B8',
    primary: '#00F0FF',
    primaryText: '#05060A',
    accent: '#FF007F',
    warnBg: '#3B2805',
    warnText: '#FFE600',
  },
  'tokyo-midnight': {
    bg: '#070812',
    surface: '#101224',
    surfaceAlt: '#181C38',
    border: '#2B315A',
    text: '#F1F5F9',
    muted: '#CBD5E1',
    primary: '#8B5CF6',
    primaryText: '#FFFFFF',
    accent: '#F43F5E',
    warnBg: '#382008',
    warnText: '#FDE68A',
  },
  'ocean-abyss': {
    bg: '#020710',
    surface: '#081424',
    surfaceAlt: '#0E2038',
    border: '#1A375C',
    text: '#E0F2FE',
    muted: '#93C5FD',
    primary: '#06B6D4',
    primaryText: '#020710',
    accent: '#38BDF8',
    warnBg: '#332205',
    warnText: '#FDE68A',
  },
  crimson: {
    bg: '#0A0608',
    surface: '#170D12',
    surfaceAlt: '#25141D',
    border: '#452033',
    text: '#FDF2F4',
    muted: '#F9A8D4',
    primary: '#E11D48',
    primaryText: '#FFFFFF',
    accent: '#FB7185',
    warnBg: '#3D1B06',
    warnText: '#FDE68A',
  },
  'coffee-roast': {
    bg: '#110B08',
    surface: '#1E140E',
    surfaceAlt: '#2D1E16',
    border: '#4B3326',
    text: '#F5F5F4',
    muted: '#D6D3D1',
    primary: '#D97706',
    primaryText: '#FFFFFF',
    accent: '#FBBF24',
    warnBg: '#3B2306',
    warnText: '#FDE68A',
  },
  batman: {
    bg: '#000000',
    surface: '#111111',
    surfaceAlt: '#1A1A1A',
    border: '#333333',
    text: '#FFFFFF',
    muted: '#A3A3A3',
    primary: '#FFE600',
    primaryText: '#000000',
    accent: '#EF4444',
    warnBg: '#292100',
    warnText: '#FFE600',
  },
  monochrome: {
    bg: '#000000',
    surface: '#121212',
    surfaceAlt: '#1E1E1E',
    border: '#383838',
    text: '#FFFFFF',
    muted: '#B0B0B0',
    primary: '#FFFFFF',
    primaryText: '#000000',
    accent: '#A1A1AA',
    warnBg: '#262626',
    warnText: '#FFFFFF',
  },
  'monochrome-light': {
    bg: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceAlt: '#E8E8E8',
    border: '#CCCCCC',
    text: '#09090B',
    muted: '#3F3F46',
    primary: '#000000',
    primaryText: '#FFFFFF',
    accent: '#52525B',
    warnBg: '#E4E4E7',
    warnText: '#18181B',
  },
};


function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapRtlLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = testLine;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * رندر باکیفیت پوستر یا کارت راهنما روی Canvas برای دانلود مستقیم PNG
 * شامل لوگوی رسمی سروستان، لوگوی دانشگاه خواجه نصیر، لوگوی برداری متروی تهران و کروکی محلی پردیس
 */
export async function renderPosterToPngDataUrl(config: PosterConfig): Promise<string> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }

  const {width, height} = POSTER_DIMENSIONS[config.format];
  const palette = POSTER_PALETTES[config.theme] ?? POSTER_PALETTES['persian-light'];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable');
  }

  const [sarvImg, kntuImg, metroImg] = await Promise.all([
    loadImage(sarvestanLogoUrl),
    loadImage(kntuLogoUrl),
    loadImage(tehranMetroLogoUrl),
  ]);

  const fontFamily = "'Arad', 'Vazirmatn', system-ui, sans-serif";
  const pad = config.format === 'square' ? 48 : 68;
  const contentW = width - pad * 2;
  const rightX = width - pad;

  // پس‌زمینه اصلی پوستر (بدون نوار رنگی بالای پوستر)
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  // هدر رسمی: لوگوی سروستان (راست) و لوگوی دانشگاه خواجه نصیر (چپ)
  let cursorY = pad;
  const headerLogoSize = config.format === 'square' ? 48 : 58;

  if (sarvImg) {
    ctx.drawImage(sarvImg, rightX - headerLogoSize, cursorY, headerLogoSize, headerLogoSize);
  }

  ctx.direction = 'rtl';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.fillStyle = palette.primary;
  ctx.font = `900 ${config.format === 'square' ? 28 : 34}px ${fontFamily}`;
  ctx.fillText(
    'خواجه‌یاب  |  سروستان',
    rightX - (sarvImg ? headerLogoSize + 16 : 0),
    cursorY + headerLogoSize / 2,
  );

  // لوگوی دانشگاه صنعتی خواجه نصیر در سمت چپ هدر
  if (kntuImg) {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, pad, cursorY, headerLogoSize, headerLogoSize, 12);
    ctx.fill();
    ctx.stroke();
    ctx.drawImage(
      kntuImg,
      pad + 5,
      cursorY + 5,
      headerLogoSize - 10,
      headerLogoSize - 10,
    );
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = palette.muted;
  ctx.font = `600 ${config.format === 'square' ? 19 : 23}px ${fontFamily}`;
  ctx.fillText(
    'دانشگاه صنعتی خواجه نصیرالدین طوسی',
    pad + (kntuImg ? headerLogoSize + 14 : 0),
    cursorY + headerLogoSize / 2,
  );

  cursorY += headerLogoSize + 20;

  // خط جداکننده هدر
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, cursorY);
  ctx.lineTo(rightX, cursorY);
  ctx.stroke();

  cursorY += config.format === 'square' ? 24 : 32;

  const deepLink = buildDeepLink(config.baseUrl, config.target);
  const qrDataUrl = await QRCode.toDataURL(deepLink, {
    width: 340,
    margin: 1,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });
  const qrImg = await loadImage(qrDataUrl);

  const footerHeight = config.format === 'square' ? 186 : 248;
  const footerY = height - pad - footerHeight;

  ctx.textBaseline = 'top';

  if (config.target === 'all') {
    // پوستر جامع تمام پردیس‌های خواجه نصیر
    ctx.textAlign = 'right';
    ctx.fillStyle = palette.text;
    ctx.font = `900 ${config.format === 'square' ? 38 : 50}px ${fontFamily}`;
    ctx.fillText('راهنمای جامع پردیس‌های خواجه نصیر', rightX, cursorY);
    cursorY += config.format === 'square' ? 54 : 70;

    ctx.fillStyle = palette.muted;
    ctx.font = `500 ${config.format === 'square' ? 21 : 26}px ${fontFamily}`;
    ctx.fillText('دسترسی سریع با مترو و BRT تهران برای دانشجویان', rightX, cursorY);
    cursorY += config.format === 'square' ? 40 : 54;

    const availableH = footerY - cursorY - 24;
    const cols = config.format === 'square' ? 2 : 1;
    const rows = Math.ceil(KNTU_CAMPUSES.length / cols);
    const gap = 16;
    const cardW = (contentW - gap * (cols - 1)) / cols;
    const cardH = Math.min(
      config.format === 'square' ? 172 : 182,
      (availableH - gap * (rows - 1)) / rows,
    );

    KNTU_CAMPUSES.forEach((campus, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = cols === 2 ? (col === 0 ? pad + cardW + gap : pad) : pad;
      const y = cursorY + row * (cardH + gap);

      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      drawRoundRect(ctx, x, y, cardW, cardH, 20);
      ctx.fill();
      ctx.stroke();

      const innerRight = x + cardW - 22;
      const innerLeft = x + 22;

      ctx.textAlign = 'right';
      ctx.fillStyle = palette.text;
      ctx.font = `800 ${config.format === 'square' ? 22 : 28}px ${fontFamily}`;
      ctx.fillText(campus.name, innerRight, y + 18);

      ctx.fillStyle = palette.muted;
      ctx.font = `500 ${config.format === 'square' ? 16 : 20}px ${fontFamily}`;
      const facText = campus.faculties.slice(0, 3).join(' · ');
      const facLines = wrapRtlLines(ctx, facText, cardW - 44);
      ctx.fillText(
        facLines[0] ?? '',
        innerRight,
        y + (config.format === 'square' ? 52 : 56),
      );

      ctx.fillStyle = palette.muted;
      ctx.font = `500 ${config.format === 'square' ? 13.5 : 16.5}px ${fontFamily}`;
      const addrAll = `نشانی: ${campus.address}`;
      const addrAllLines = wrapRtlLines(ctx, addrAll, cardW - 44);
      ctx.fillText(
        addrAllLines[0] ?? '',
        innerRight,
        y + (config.format === 'square' ? 74 : 84),
      );

      const primaryMetro = campus.metroOptions[0];
      const primaryBrt = campus.brtOptions[0];
      const badgeY = y + cardH - (config.format === 'square' ? 52 : 58);

      if (primaryMetro) {
        if (metroImg) {
          ctx.drawImage(metroImg, innerRight - 34, badgeY + 1, 34, 34);
        }
        const badgeOffset = metroImg ? 42 : 0;
        const line = TEHRAN_METRO_LINES[primaryMetro.lineId];
        ctx.fillStyle = line.color;
        drawRoundRect(ctx, innerRight - badgeOffset - 36, badgeY, 36, 36, 9);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = line.textColor;
        ctx.font = `800 20px ${fontFamily}`;
        ctx.fillText(line.code, innerRight - badgeOffset - 18, badgeY + 7);

        ctx.textAlign = 'right';
        ctx.fillStyle = palette.text;
        ctx.font = `700 ${config.format === 'square' ? 17 : 22}px ${fontFamily}`;
        ctx.fillText(
          `مترو ${primaryMetro.stationName}`,
          innerRight - badgeOffset - 46,
          badgeY + 6,
        );
      }

      if (primaryBrt && config.format !== 'square') {
        const brt = TEHRAN_BRT_LINES[primaryBrt.lineId];
        ctx.textAlign = 'left';
        ctx.fillStyle = palette.muted;
        ctx.font = `600 19px ${fontFamily}`;
        ctx.fillText(
          `BRT خط ${brt.code}: ${primaryBrt.stationName}`,
          innerLeft,
          badgeY + 8,
        );
      }
    });
  } else {
    // پوستر اختصاصی یک پردیس همراه با کروکی محلی
    const campus: KntuCampus =
      KNTU_CAMPUSES.find((c) => c.id === config.target) ?? KNTU_CAMPUSES[0];

    ctx.textAlign = 'right';
    ctx.fillStyle = palette.muted;
    ctx.font = `600 ${config.format === 'square' ? 20 : 25}px ${fontFamily}`;
    ctx.fillText(campus.neighborhood, rightX, cursorY);
    cursorY += config.format === 'square' ? 32 : 40;

    ctx.fillStyle = palette.text;
    ctx.font = `900 ${config.format === 'square' ? 40 : 54}px ${fontFamily}`;
    const titleLines = wrapRtlLines(ctx, campus.name, contentW);
    titleLines.forEach((line) => {
      ctx.fillText(line, rightX, cursorY);
      cursorY += config.format === 'square' ? 50 : 68;
    });

    ctx.fillStyle = palette.primary;
    ctx.font = `700 ${config.format === 'square' ? 21 : 26}px ${fontFamily}`;
    const facLines = wrapRtlLines(ctx, campus.faculties.join('  ·  '), contentW);
    facLines.forEach((line) => {
      ctx.fillText(line, rightX, cursorY);
      cursorY += config.format === 'square' ? 30 : 38;
    });

    cursorY += 10;

    if (campus.importantNote) {
      const noteLines = wrapRtlLines(ctx, campus.importantNote, contentW - 44);
      const lineStep = config.format === 'square' ? 24 : 30;
      const noteH = noteLines.length * lineStep + 26;
      ctx.fillStyle = palette.warnBg;
      drawRoundRect(ctx, pad, cursorY, contentW, noteH, 16);
      ctx.fill();

      ctx.fillStyle = palette.warnText;
      ctx.font = `600 ${config.format === 'square' ? 17 : 21}px ${fontFamily}`;
      noteLines.forEach((line, idx) => {
        ctx.fillText(line, rightX - 22, cursorY + 13 + idx * lineStep);
      });
      cursorY += noteH + 16;
    }

    if (config.format === 'square') {
      // چیدمان دو ستونه برای کارت مربع ۱:۱: کروکی سمت چپ + مترو و BRT سمت راست
      const splitGap = 20;
      const colH = footerY - cursorY - 18;
      const infoW = Math.round(contentW * 0.54);
      const korokiW = contentW - infoW - splitGap;
      const infoX = pad + korokiW + splitGap;
      const infoRight = infoX + infoW;

      // رندر کروکی سمت چپ
      const korokiCanvas = document.createElement('canvas');
      await renderCampusKorokiToCanvas(korokiCanvas, campus, config.theme, korokiW, colH, 1);

      ctx.save();
      drawRoundRect(ctx, pad, cursorY, korokiW, colH, 22);
      ctx.clip();
      ctx.drawImage(korokiCanvas, pad, cursorY, korokiW, colH);
      ctx.restore();

      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      drawRoundRect(ctx, pad, cursorY, korokiW, colH, 22);
      ctx.stroke();

      // جعبه مترو سمت راست
      const shownMetro = campus.metroOptions.slice(0, 2);
      const metroBoxH = Math.min(colH - 132, 68 + shownMetro.length * 92);

      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      drawRoundRect(ctx, infoX, cursorY, infoW, metroBoxH, 22);
      ctx.fill();
      ctx.stroke();

      if (metroImg) {
        ctx.drawImage(metroImg, infoRight - 52, cursorY + 18, 32, 32);
      }
      ctx.textAlign = 'right';
      ctx.fillStyle = palette.text;
      ctx.font = `800 22px ${fontFamily}`;
      ctx.fillText('دسترسی با متروی تهران', infoRight - (metroImg ? 62 : 20), cursorY + 21);

      let rowY = cursorY + 64;
      shownMetro.forEach((opt) => {
        const line = TEHRAN_METRO_LINES[opt.lineId];
        ctx.fillStyle = line.color;
        drawRoundRect(ctx, infoRight - 54, rowY + 2, 34, 34, 9);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = line.textColor;
        ctx.font = `800 19px ${fontFamily}`;
        ctx.fillText(line.code, infoRight - 37, rowY + 8);

        ctx.textAlign = 'right';
        ctx.fillStyle = palette.text;
        ctx.font = `800 19px ${fontFamily}`;
        ctx.fillText(`ایستگاه ${opt.stationName}`, infoRight - 66, rowY + 3);

        ctx.fillStyle = palette.muted;
        ctx.font = `500 15.5px ${fontFamily}`;
        const desc = `${opt.connectionLabel} · ${toPersianDigits(opt.durationMinutes)} دقیقه`;
        ctx.fillText(desc, infoRight - 66, rowY + 34);

        rowY += 86;
      });

      // جعبه BRT و نشانی پایین مترو (همواره و بدون قید شرط چاپ می‌شود)
      const brtY = cursorY + metroBoxH + 12;
      const brtH = Math.max(92, colH - metroBoxH - 12);
      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      drawRoundRect(ctx, infoX, brtY, infoW, brtH, 22);
      ctx.fill();
      ctx.stroke();

      const brt = campus.brtOptions[0];
      let innerY = brtY + 14;
      if (brt) {
        const brtLine = TEHRAN_BRT_LINES[brt.lineId];
        ctx.fillStyle = brtLine.color;
        drawRoundRect(ctx, infoRight - 96, innerY, 76, 30, 8);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.fillStyle = brtLine.textColor;
        ctx.font = `800 16px ${fontFamily}`;
        ctx.fillText(`BRT ${brtLine.code}`, infoRight - 58, innerY + 6);

        ctx.textAlign = 'right';
        ctx.fillStyle = palette.text;
        ctx.font = `700 17px ${fontFamily}`;
        ctx.fillText(brt.stationName, infoRight - 108, innerY + 5);
        innerY += 38;
      }
      ctx.textAlign = 'right';
      ctx.fillStyle = palette.text;
      ctx.font = `800 15px ${fontFamily}`;
      ctx.fillText('نشانی و سردر اصلی:', infoRight - 16, innerY);

      ctx.fillStyle = palette.muted;
      ctx.font = `500 14px ${fontFamily}`;
      const addrLines = wrapRtlLines(ctx, `${campus.address} — ${campus.mainGate}`, infoW - 32);
      addrLines.slice(0, 2).forEach((l, i) => {
        ctx.fillText(l, infoRight - 16, innerY + 22 + i * 20);
      });
    } else {
      // چیدمان عمودی A4 و استوری: کروکی عریض + باکس مترو + BRT و نشانی رسمی پردیس
      const totalAvailable = footerY - cursorY;
      const spacing = 16;
      const addressBoxH = campus.brtOptions[0] ? 142 : 110;
      const contentForMapAndMetro = totalAvailable - addressBoxH - spacing * 2;

      const korokiH = Math.round(
        config.format === 'story'
          ? Math.min(380, contentForMapAndMetro * 0.44)
          : Math.min(300, contentForMapAndMetro * 0.42),
      );

      const metroBoxH = contentForMapAndMetro - korokiH;

      const korokiCanvas = document.createElement('canvas');
      await renderCampusKorokiToCanvas(
        korokiCanvas,
        campus,
        config.theme,
        contentW,
        korokiH,
        1,
      );

      ctx.save();
      drawRoundRect(ctx, pad, cursorY, contentW, korokiH, 24);
      ctx.clip();
      ctx.drawImage(korokiCanvas, pad, cursorY, contentW, korokiH);
      ctx.restore();

      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      drawRoundRect(ctx, pad, cursorY, contentW, korokiH, 24);
      ctx.stroke();

      cursorY += korokiH + spacing;

      // باکس دسترسی با مترو تهران
      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      drawRoundRect(ctx, pad, cursorY, contentW, metroBoxH, 24);
      ctx.fill();
      ctx.stroke();

      if (metroImg) {
        ctx.drawImage(metroImg, rightX - 60, cursorY + 18, 36, 36);
      }
      ctx.textAlign = 'right';
      ctx.fillStyle = palette.text;
      ctx.font = `800 28px ${fontFamily}`;
      ctx.fillText(
        'دسترسی با متروی تهران',
        rightX - (metroImg ? 74 : 24),
        cursorY + 20,
      );

      const metroRowH = 86;
      const maxMetro = Math.max(1, Math.floor((metroBoxH - 68) / metroRowH));
      const shownMetro = campus.metroOptions.slice(0, maxMetro);

      let rowY = cursorY + 68;
      shownMetro.forEach((opt) => {
        const line = TEHRAN_METRO_LINES[opt.lineId];
        ctx.fillStyle = line.color;
        drawRoundRect(ctx, rightX - 64, rowY + 4, 42, 42, 10);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = line.textColor;
        ctx.font = `800 23px ${fontFamily}`;
        ctx.fillText(line.code, rightX - 43, rowY + 12);

        ctx.textAlign = 'right';
        ctx.fillStyle = palette.text;
        ctx.font = `800 24px ${fontFamily}`;
        ctx.fillText(
          `ایستگاه ${opt.stationName}  (${line.name})`,
          rightX - 78,
          rowY + 4,
        );

        ctx.fillStyle = palette.muted;
        ctx.font = `500 19px ${fontFamily}`;
        const desc = `${opt.connectionLabel} · حدود ${toPersianDigits(opt.durationMinutes)} دقیقه · ${opt.exitHint}`;
        const descLines = wrapRtlLines(ctx, desc, contentW - 108);
        ctx.fillText(descLines[0] ?? '', rightX - 78, rowY + 40);

        rowY += metroRowH;
      });

      cursorY += metroBoxH + spacing;

      // باکس BRT + نشانی و سردر رسمی پردیس (همواره و بدون قید شرط چاپ می‌شود)
      const brt = campus.brtOptions[0];
      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      drawRoundRect(ctx, pad, cursorY, contentW, addressBoxH, 24);
      ctx.fill();
      ctx.stroke();

      let innerY = cursorY + 18;
      if (brt) {
        const brtLine = TEHRAN_BRT_LINES[brt.lineId];
        ctx.fillStyle = brtLine.color;
        drawRoundRect(ctx, rightX - 108, innerY, 84, 34, 9);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.fillStyle = brtLine.textColor;
        ctx.font = `800 18px ${fontFamily}`;
        ctx.fillText(`BRT ${brtLine.code}`, rightX - 66, innerY + 7);

        ctx.textAlign = 'right';
        ctx.fillStyle = palette.text;
        ctx.font = `800 23px ${fontFamily}`;
        ctx.fillText(
          `ایستگاه ${brt.stationName} (${toPersianDigits(brt.durationMinutes)} دقیقه تا سردر)`,
          rightX - 122,
          innerY + 4,
        );
        innerY += 46;
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = palette.text;
      ctx.font = `800 21px ${fontFamily}`;
      ctx.fillText('نشانی و سردر اصلی:', rightX - 24, innerY);

      ctx.fillStyle = palette.muted;
      ctx.font = `600 19px ${fontFamily}`;
      const addrFull = `${campus.address} — ${campus.mainGate}`;
      const addrLines = wrapRtlLines(ctx, addrFull, contentW - 220);
      addrLines.slice(0, 2).forEach((line, idx) => {
        ctx.fillText(line, rightX - 200, innerY + idx * 28);
      });
    }
  }

  // فوتر با QR Code واقعی و برندینگ سروستان + خواجه نصیر
  ctx.fillStyle = palette.surfaceAlt;
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 2;
  drawRoundRect(ctx, pad, footerY, contentW, footerHeight, 24);
  ctx.fill();
  ctx.stroke();

  const qrSize = config.format === 'square' ? 128 : 178;
  const qrX = pad + 24;
  const qrY = footerY + (footerHeight - qrSize) / 2;

  if (qrImg) {
    ctx.fillStyle = '#FFFFFF';
    drawRoundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  }

  const textRight = rightX - 28;
  const textMaxW = contentW - qrSize - 80;
  ctx.textAlign = 'right';

  // نشان / بج رسمی اکوسیستم سروستان
  ctx.fillStyle = palette.primary;
  ctx.font = `800 ${config.format === 'square' ? 16 : 21}px ${fontFamily}`;
  ctx.fillText(
    '🌿 اکوسیستم دانشجویی سروستان (خواجه نصیر طوسی)',
    textRight,
    footerY + (config.format === 'square' ? 22 : 28),
  );

  // تیتر اصلی معرفی سروستان
  ctx.fillStyle = palette.text;
  ctx.font = `900 ${config.format === 'square' ? 21 : 27}px ${fontFamily}`;
  ctx.fillText(
    'دستیار هوشمند آموزش دانشگاهی و بهستان بدون فیلترشکن',
    textRight,
    footerY + (config.format === 'square' ? 50 : 66),
  );

  // امکانات کلیدی سروستان
  ctx.fillStyle = palette.muted;
  ctx.font = `600 ${config.format === 'square' ? 15 : 19.5}px ${fontFamily}`;
  ctx.fillText(
    'برنامه هفتگی آفلاین · شماره کلاس‌ها · کارنامه و نمرات · تقویم امتحانات · نقشه تعاملی',
    textRight,
    footerY + (config.format === 'square' ? 82 : 108),
  );

  // راهنمای اسکن بارکد
  ctx.fillStyle = palette.muted;
  ctx.font = `500 ${config.format === 'square' ? 14 : 18}px ${fontFamily}`;
  ctx.fillText(
    'اسکن بارکد با دوربین گوشی جهت ورود به سامانه و مسیریاب زنده پردیس‌ها',
    textRight,
    footerY + (config.format === 'square' ? 112 : 144),
  );

  // آدرس مستقیم گیت‌هاب پیجز سروستان
  ctx.fillStyle = palette.primary;
  ctx.font = `800 ${config.format === 'square' ? 15.5 : 20}px ${fontFamily}`;
  const directUrl = `🌐 ${deepLink.replace(/^https?:\/\//, '')}`;
  ctx.fillText(
    directUrl,
    textRight,
    footerY + footerHeight - (config.format === 'square' ? 26 : 34),
    textMaxW,
  );

  return canvas.toDataURL('image/png');
}
