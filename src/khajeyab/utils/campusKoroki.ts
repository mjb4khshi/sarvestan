import {VectorTile, type VectorTileFeature} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
import {
  getMapPalette,
  resolveOpenFreeMapTemplate,
  SARV_MAP_PALETTES,
} from '../components/OpenFreeMapAradLayer';
import type {KntuCampus, LatLng} from '../data/kntuCampuses';
import {TEHRAN_MAP_LABELS} from '../data/tehranMapLabels';
import {TEHRAN_BRT_LINES, TEHRAN_METRO_LINES} from '../data/tehranTransit';
import type {SarvThemeId} from './wayfinder';

const korokiTileCache = new Map<string, VectorTile | null>();

function lngToWorldX(lng: number, z: number): number {
  return ((lng + 180) / 360) * 256 * Math.pow(2, z);
}

function latToWorldY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    256 *
    Math.pow(2, z)
  );
}

async function fetchVectorTileCached(
  template: string,
  z: number,
  x: number,
  y: number,
): Promise<VectorTile | null> {
  const key = `${z}/${x}/${y}`;
  if (korokiTileCache.has(key)) {
    return korokiTileCache.get(key) ?? null;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const url = template
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y));
    const res = await fetch(url, {signal: controller.signal});
    clearTimeout(timer);
    if (!res.ok) {
      korokiTileCache.set(key, null);
      return null;
    }
    const buf = await res.arrayBuffer();
    const parsed = new VectorTile(new PbfReader(new Uint8Array(buf)));
    korokiTileCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function drawRoundedRect(
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

interface LabelRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function overlaps(boxes: LabelRect[], cand: LabelRect): boolean {
  for (const b of boxes) {
    if (cand.x1 < b.x2 && cand.x2 > b.x1 && cand.y1 < b.y2 && cand.y2 > b.y1) {
      return true;
    }
  }
  return false;
}

/**
 * رندر کروکی اختصاصی اطراف پردیس (خیابان‌ها، بزرگراه‌ها، ایستگاه‌های مترو/BRT و مسیر دسترسی)
 * با استفاده از داده‌های آزاد OpenFreeMap / OpenStreetMap و فونت رسمی آراد
 */
export async function renderCampusKorokiToCanvas(
  canvas: HTMLCanvasElement,
  campus: KntuCampus,
  theme: SarvThemeId,
  width: number,
  height: number,
  dpr = 1,
): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const palette = getMapPalette(theme);
  const fontFamily = "'Arad', 'Vazirmatn', system-ui, sans-serif";
  const tileZ = 14;

  // نقاط کلیدی کروکی: پردیس + نزدیک‌ترین ایستگاه‌های مترو (حداکثر ۲ ایستگاه محلی) + نزدیک‌ترین BRT
  const primaryMetro = campus.metroOptions[0];
  const distSq = (a: LatLng, b: LatLng) =>
    (a.lat - b.lat) * (a.lat - b.lat) + (a.lng - b.lng) * (a.lng - b.lng);
  const secondaryMetro = campus.metroOptions
    .slice(1)
    .sort((a, b) => distSq(a.stationCoords, campus.coords) - distSq(b.stationCoords, campus.coords))[0];
  const featuredMetros = [
    ...(primaryMetro ? [primaryMetro] : []),
    ...(secondaryMetro ? [secondaryMetro] : []),
  ];
  const featuredBrt = campus.brtOptions[0];
  const keyCoords: LatLng[] = [
    campus.coords,
    ...featuredMetros.map((m) => m.stationCoords),
    ...(featuredBrt ? [featuredBrt.stationCoords] : []),
  ];

  const worldPts = keyCoords.map((c) => ({
    x: lngToWorldX(c.lng, tileZ),
    y: latToWorldY(c.lat, tileZ),
  }));

  const minX = Math.min(...worldPts.map((p) => p.x));
  const maxX = Math.max(...worldPts.map((p) => p.x));
  const minY = Math.min(...worldPts.map((p) => p.y));
  const maxY = Math.max(...worldPts.map((p) => p.y));

  // حاشیه امن پیکسلی تا پین پردیس و برچسب ایستگاه‌ها هرگز از کادر بیرون نزنند
  const safeLeft = Math.max(76, Math.round(width * 0.14));
  const safeRight = width - Math.max(76, Math.round(width * 0.14));
  const safeTop = Math.max(58, Math.round(height * 0.25));
  const safeBottom = height - Math.max(26, Math.round(height * 0.11));
  const safeW = Math.max(100, safeRight - safeLeft);
  const safeH = Math.max(70, safeBottom - safeTop);
  const screenCenterX = (safeLeft + safeRight) / 2;
  const screenCenterY = (safeTop + safeBottom) / 2;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const spanX = Math.max(maxX - minX, 38);
  const spanY = Math.max(maxY - minY, 24);

  const viewScale = Math.min(
    2.1,
    Math.max(0.22, Math.min(safeW / spanX, safeH / spanY)),
  );

  const toScreen = (lng: number, lat: number): [number, number] => {
    const wx = lngToWorldX(lng, tileZ);
    const wy = latToWorldY(lat, tileZ);
    return [
      screenCenterX + (wx - centerX) * viewScale,
      screenCenterY + (wy - centerY) * viewScale,
    ];
  };

  // محدوده کاشی‌های مورد نیاز برای پوشش کامل بوم کروکی
  const minTileX = Math.floor((centerX - screenCenterX / viewScale) / 256);
  const maxTileX = Math.floor((centerX + (width - screenCenterX) / viewScale) / 256);
  const minTileY = Math.floor((centerY - screenCenterY / viewScale) / 256);
  const maxTileY = Math.floor((centerY + (height - screenCenterY) / viewScale) / 256);

  const tileCoords: Array<{tx: number; ty: number; d: number}> = [];
  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let ty = minTileY; ty <= maxTileY; ty++) {
      const tcx = (tx + 0.5) * 256;
      const tcy = (ty + 0.5) * 256;
      const d = (tcx - centerX) * (tcx - centerX) + (tcy - centerY) * (tcy - centerY);
      tileCoords.push({tx, ty, d});
    }
  }
  tileCoords.sort((a, b) => a.d - b.d);

  // پس‌زمینه پایه کروکی
  ctx.fillStyle = palette.land;
  ctx.fillRect(0, 0, width, height);

  // دریافت همزمان کاشی‌های برداری OpenFreeMap
  let loadedTiles: Array<{tx: number; ty: number; tile: VectorTile | null}> = [];
  try {
    const template = await resolveOpenFreeMapTemplate();
    loadedTiles = await Promise.all(
      tileCoords.slice(0, 36).map(async ({tx, ty}) => ({
        tx,
        ty,
        tile: await fetchVectorTileCached(template, tileZ, tx, ty),
      })),
    );
  } catch {
    loadedTiles = [];
  }

  const anyTileLoaded = loadedTiles.some((t) => t.tile !== null);

  if (anyTileLoaded) {
    // 1. فضاهای سبز و زمین‌های شهری
    for (const {tx, ty, tile} of loadedTiles) {
      if (!tile) continue;
      const toSx = (fx: number, extent: number) =>
        screenCenterX + ((tx + fx / extent) * 256 - centerX) * viewScale;
      const toSy = (fy: number, extent: number) =>
        screenCenterY + ((ty + fy / extent) * 256 - centerY) * viewScale;

      const landuse = tile.layers.landuse;
      if (landuse) {
        for (let i = 0; i < landuse.length; i++) {
          const f = landuse.feature(i);
          if (f.type !== 3) continue;
          const cls = String(f.properties.class ?? '');
          if (cls === 'park' || cls === 'grass') ctx.fillStyle = palette.park;
          else if (cls === 'residential' || cls === 'university' || cls === 'school')
            ctx.fillStyle = palette.landuseResidential;
          else continue;
          ctx.beginPath();
          for (const ring of f.loadGeometry()) {
            ring.forEach((p, idx) => {
              const sx = toSx(p.x, landuse.extent);
              const sy = toSy(p.y, landuse.extent);
              if (idx === 0) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            });
            ctx.closePath();
          }
          ctx.fill('evenodd');
        }
      }

      const park = tile.layers.park;
      if (park) {
        ctx.fillStyle = palette.park;
        for (let i = 0; i < park.length; i++) {
          const f = park.feature(i);
          if (f.type !== 3) continue;
          ctx.beginPath();
          for (const ring of f.loadGeometry()) {
            ring.forEach((p, idx) => {
              const sx = toSx(p.x, park.extent);
              const sy = toSy(p.y, park.extent);
              if (idx === 0) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            });
            ctx.closePath();
          }
          ctx.fill('evenodd');
        }
      }
    }

    // 2. شبکه خیابان‌ها و بزرگراه‌ها
    const roadBuckets: Array<{
      tx: number;
      ty: number;
      extent: number;
      minor: VectorTileFeature[];
      secondary: VectorTileFeature[];
      primary: VectorTileFeature[];
      motorway: VectorTileFeature[];
    }> = [];

    for (const {tx, ty, tile} of loadedTiles) {
      if (!tile?.layers.transportation) continue;
      const roadLayer = tile.layers.transportation;
      const bucket = {
        tx,
        ty,
        extent: roadLayer.extent,
        minor: [] as VectorTileFeature[],
        secondary: [] as VectorTileFeature[],
        primary: [] as VectorTileFeature[],
        motorway: [] as VectorTileFeature[],
      };
      for (let i = 0; i < roadLayer.length; i++) {
        const f = roadLayer.feature(i);
        if (f.type !== 2) continue;
        const cls = String(f.properties.class ?? '');
        if (cls === 'motorway' || cls === 'trunk') bucket.motorway.push(f);
        else if (cls === 'primary') bucket.primary.push(f);
        else if (cls === 'secondary' || cls === 'tertiary') bucket.secondary.push(f);
        else if (cls === 'minor' || cls === 'street') bucket.minor.push(f);
      }
      roadBuckets.push(bucket);
    }

    const strokeRoadTier = (
      tier: 'minor' | 'secondary' | 'primary' | 'motorway',
      lineW: number,
      casingW: number,
      fill: string,
      casing: string,
    ) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const pass = (color: string, w: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        for (const b of roadBuckets) {
          for (const f of b[tier]) {
            ctx.beginPath();
            for (const line of f.loadGeometry()) {
              line.forEach((p, idx) => {
                const sx =
                  screenCenterX + ((b.tx + p.x / b.extent) * 256 - centerX) * viewScale;
                const sy =
                  screenCenterY + ((b.ty + p.y / b.extent) * 256 - centerY) * viewScale;
                if (idx === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
              });
            }
            ctx.stroke();
          }
        }
      };

      pass(casing, lineW + casingW);
      pass(fill, lineW);
    };

    const boost = Math.max(0.85, Math.min(1.5, width / 560));
    strokeRoadTier('minor', 2.0 * boost, 1.0 * boost, palette.roadMinor, palette.roadMinorCasing);
    strokeRoadTier('secondary', 3.4 * boost, 1.4 * boost, palette.roadSecondary, palette.roadSecondaryCasing);
    strokeRoadTier('primary', 4.6 * boost, 1.6 * boost, palette.roadPrimary, palette.roadPrimaryCasing);
    strokeRoadTier('motorway', 5.8 * boost, 2.0 * boost, palette.roadMotorway, palette.roadMotorwayCasing);
  } else {
    // شبکه جایگزین گرافیکی در صورت قطع دسترسی به اینترنت
    ctx.strokeStyle = palette.roadMinorCasing;
    ctx.lineWidth = 1;
    const step = Math.max(36, Math.round(width / 14));
    for (let gx = step; gx < width; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = step; gy < height; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }
  }

  // 3. خطوط نقطه‌چین مسیر دسترسی از مترو و BRT به سردر پردیس
  const [campusX, campusY] = toScreen(campus.coords.lng, campus.coords.lat);

  featuredMetros.forEach((opt, idx) => {
    const line = TEHRAN_METRO_LINES[opt.lineId];
    const [sx, sy] = toScreen(opt.stationCoords.lng, opt.stationCoords.lat);
    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = idx === 0 ? Math.max(2.6, width / 220) : Math.max(1.8, width / 300);
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(campusX, campusY);
    ctx.stroke();
    ctx.restore();
  });

  if (featuredBrt) {
    const brtLine = TEHRAN_BRT_LINES[featuredBrt.lineId];
    const [bx, by] = toScreen(featuredBrt.stationCoords.lng, featuredBrt.stationCoords.lat);
    ctx.save();
    ctx.strokeStyle = brtLine.color;
    ctx.lineWidth = Math.max(1.8, width / 300);
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(campusX, campusY);
    ctx.stroke();
    ctx.restore();
  }

  // 4. برچسب بزرگراه‌ها و محله‌های اطراف با فونت آراد (بدون هم‌پوشانی با پین‌ها)
  const placedLabels: LabelRect[] = [
    {x1: campusX - 75, y1: campusY - 36, x2: campusX + 75, y2: campusY + 24},
    {x1: 0, y1: 0, x2: 110, y2: 46}, // محل قطب‌نما
    {x1: width - 250, y1: 0, x2: width, y2: 46}, // محل عنوان کروکی
  ];

  featuredMetros.forEach((opt) => {
    const [mx, my] = toScreen(opt.stationCoords.lng, opt.stationCoords.lat);
    placedLabels.push({x1: mx - 68, y1: my - 22, x2: mx + 68, y2: my + 22});
  });

  const labelFontSize = Math.max(10, Math.round(width / 54));
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const lbl of TEHRAN_MAP_LABELS) {
    const [lx, ly] = toScreen(lbl.coords.lng, lbl.coords.lat);
    if (ly < 46 || ly > height - 18) continue;
    ctx.font = `700 ${labelFontSize}px ${fontFamily}`;
    const mw = ctx.measureText(lbl.label).width + 14;
    const mh = labelFontSize + 8;
    if (lx - mw / 2 < 10 || lx + mw / 2 > width - 10) continue;
    const rect: LabelRect = {
      x1: lx - mw / 2,
      y1: ly - mh / 2,
      x2: lx + mw / 2,
      y2: ly + mh / 2,
    };
    if (overlaps(placedLabels, rect)) continue;
    placedLabels.push(rect);

    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = palette.labelHalo;
    ctx.strokeText(lbl.label, lx, ly);
    ctx.fillStyle = lbl.kind === 'highway' || lbl.kind === 'street' ? palette.labelRoad : palette.labelPlace;
    ctx.fillText(lbl.label, lx, ly);
  }

  // 5. نشانگر ایستگاه BRT و ایستگاه‌های مترو (با مهار حاشیه جهت جلوگیری از بریدگی)
  if (featuredBrt) {
    const brtLine = TEHRAN_BRT_LINES[featuredBrt.lineId];
    const [bx, by] = toScreen(featuredBrt.stationCoords.lng, featuredBrt.stationCoords.lat);
    const pillFont = Math.max(9.5, Math.round(width / 58));
    ctx.font = `700 ${pillFont}px ${fontFamily}`;
    const label = `BRT ${brtLine.code} · ${featuredBrt.stationName}`;
    const pw = Math.min(ctx.measureText(label).width + 18, width - 20);
    const ph = pillFont + 10;
    const boxX = Math.max(8, Math.min(width - pw - 8, bx - pw / 2));
    const boxY = Math.max(42, Math.min(height - ph - 8, by - ph / 2));

    ctx.fillStyle = brtLine.color;
    drawRoundedRect(ctx, boxX, boxY, pw, ph, 7);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = brtLine.textColor;
    ctx.fillText(label, boxX + pw / 2, boxY + ph / 2 + 0.5);
  }

  featuredMetros.forEach((opt) => {
    const line = TEHRAN_METRO_LINES[opt.lineId];
    const [mx, my] = toScreen(opt.stationCoords.lng, opt.stationCoords.lat);
    const pillFont = Math.max(10, Math.round(width / 52));
    ctx.font = `800 ${pillFont}px ${fontFamily}`;
    const label = `مترو ${opt.stationName} (${line.code})`;
    const pw = Math.min(ctx.measureText(label).width + 20, width - 20);
    const ph = pillFont + 12;
    const boxX = Math.max(8, Math.min(width - pw - 8, mx - pw / 2));
    const boxY = Math.max(42, Math.min(height - ph - 8, my - ph / 2));

    ctx.fillStyle = line.color;
    drawRoundedRect(ctx, boxX, boxY, pw, ph, 8);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = line.textColor;
    ctx.fillText(label, boxX + pw / 2, boxY + ph / 2 + 0.5);
  });

  // 6. پین شاخص سردر پردیس خواجه نصیر
  ctx.beginPath();
  ctx.arc(campusX, campusY, Math.max(16, width / 38), 0, Math.PI * 2);
  ctx.fillStyle = `${campus.accentColor}30`;
  ctx.fill();

  const pinFont = Math.max(11, Math.round(width / 46));
  ctx.font = `800 ${pinFont}px ${fontFamily}`;
  const campusLabel = `${campus.code} · ${campus.shortName}`;
  const cw = ctx.measureText(campusLabel).width + 24;
  const ch = pinFont + 14;
  const campusBoxX = Math.max(8, Math.min(width - cw - 8, campusX - cw / 2));
  const campusBoxY = Math.max(44, Math.min(height - ch - 12, campusY - ch - 8));

  ctx.fillStyle = campus.accentColor;
  drawRoundedRect(ctx, campusBoxX, campusBoxY, cw, ch, 10);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(campusLabel, campusBoxX + cw / 2, campusBoxY + ch / 2 + 0.5);

  ctx.beginPath();
  ctx.arc(campusX, campusY, Math.max(5.5, width / 110), 0, Math.PI * 2);
  ctx.fillStyle = campus.accentColor;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 7. برچسب عنوان کروکی و نشانگر شمال
  const badgeFont = Math.max(10, Math.round(width / 54));
  ctx.font = `700 ${badgeFont}px ${fontFamily}`;
  const titleText = `کروکی دسترسی · ${campus.neighborhood}`;
  const tw = ctx.measureText(titleText).width + 20;
  const th = badgeFont + 12;

  ctx.fillStyle = palette.labelHalo;
  drawRoundedRect(ctx, width - tw - 10, 10, tw, th, 8);
  ctx.fill();
  ctx.strokeStyle = palette.roadPrimaryCasing;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = palette.labelPlace;
  ctx.fillText(titleText, width - 20, 10 + th / 2);

  // نشانگر شمال ↑ (چپ بالا)
  const northW = badgeFont * 4.4;
  ctx.fillStyle = palette.labelHalo;
  drawRoundedRect(ctx, 10, 10, northW, th, 8);
  ctx.fill();
  ctx.strokeStyle = palette.roadPrimaryCasing;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = palette.labelPlace;
  ctx.fillText('شمال ↑', 10 + northW / 2, 10 + th / 2);

  ctx.restore();
}
