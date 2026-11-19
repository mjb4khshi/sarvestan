import L from 'leaflet';
import {VectorTile, type VectorTileFeature} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
import type {SarvThemeId} from '../utils/wayfinder';

export interface MapThemePalette {
  land: string;
  landuseResidential: string;
  park: string;
  water: string;
  building: string;
  buildingStroke: string;
  roadMinor: string;
  roadMinorCasing: string;
  roadSecondary: string;
  roadSecondaryCasing: string;
  roadPrimary: string;
  roadPrimaryCasing: string;
  roadMotorway: string;
  roadMotorwayCasing: string;
  rail: string;
  labelPlace: string;
  labelRoad: string;
  labelPoi: string;
  labelHalo: string;
}

export const SARV_MAP_PALETTES: Record<SarvThemeId, MapThemePalette> = {
  'persian-light': {
    land: '#F3F6FA',
    landuseResidential: '#ECEFF5',
    park: '#D7EFE2',
    water: '#BFE0F5',
    building: '#E2E8F0',
    buildingStroke: '#CBD5E1',
    roadMinor: '#FFFFFF',
    roadMinorCasing: '#D8E0EB',
    roadSecondary: '#FFFFFF',
    roadSecondaryCasing: '#C4D0DF',
    roadPrimary: '#FDE8B4',
    roadPrimaryCasing: '#DFAD52',
    roadMotorway: '#F6BD68',
    roadMotorwayCasing: '#D28329',
    rail: '#94A3B8',
    labelPlace: '#0F172A',
    labelRoad: '#1E293B',
    labelPoi: '#0066A4',
    labelHalo: 'rgba(255, 255, 255, 0.94)',
  },
  emerald: {
    land: '#05150F',
    landuseResidential: '#081E16',
    park: '#0C3526',
    water: '#072730',
    building: '#0E291F',
    buildingStroke: '#174233',
    roadMinor: '#123327',
    roadMinorCasing: '#091E16',
    roadSecondary: '#174433',
    roadSecondaryCasing: '#0B241B',
    roadPrimary: '#1A5D46',
    roadPrimaryCasing: '#0B3023',
    roadMotorway: '#108960',
    roadMotorwayCasing: '#074530',
    rail: '#286651',
    labelPlace: '#ECFDF5',
    labelRoad: '#A7F3D0',
    labelPoi: '#34D399',
    labelHalo: 'rgba(5, 21, 15, 0.92)',
  },
  'persian-dark': {
    land: '#0A0D14',
    landuseResidential: '#101520',
    park: '#102824',
    water: '#0C1E33',
    building: '#161D2C',
    buildingStroke: '#222D44',
    roadMinor: '#1B2334',
    roadMinorCasing: '#0F141E',
    roadSecondary: '#243047',
    roadSecondaryCasing: '#131A28',
    roadPrimary: '#2D4163',
    roadPrimaryCasing: '#172338',
    roadMotorway: '#2B6E9E',
    roadMotorwayCasing: '#153A57',
    rail: '#3B4A68',
    labelPlace: '#F8FAFC',
    labelRoad: '#CBD5E1',
    labelPoi: '#38BDF8',
    labelHalo: 'rgba(10, 13, 20, 0.94)',
  },
  tehran: {
    land: '#F7EEDC',
    landuseResidential: '#F1E5CD',
    park: '#DAE8C9',
    water: '#BCD8E2',
    building: '#E7D7B9',
    buildingStroke: '#D5C09A',
    roadMinor: '#FFFDF7',
    roadMinorCasing: '#DBC8A4',
    roadSecondary: '#FFF9EC',
    roadSecondaryCasing: '#CCB183',
    roadPrimary: '#F7D399',
    roadPrimaryCasing: '#C28A42',
    roadMotorway: '#E28C6C',
    roadMotorwayCasing: '#A84A2C',
    rail: '#8B7963',
    labelPlace: '#003049',
    labelRoad: '#1F445C',
    labelPoi: '#C1121F',
    labelHalo: 'rgba(255, 253, 248, 0.95)',
  },
  'tehran-2': {
    land: '#17210E',
    landuseResidential: '#1E2B14',
    park: '#293C1C',
    water: '#142526',
    building: '#233216',
    buildingStroke: '#354823',
    roadMinor: '#243317',
    roadMinorCasing: '#141E0D',
    roadSecondary: '#2D3E1E',
    roadSecondaryCasing: '#182410',
    roadPrimary: '#4D6030',
    roadPrimaryCasing: '#263316',
    roadMotorway: '#99733E',
    roadMotorwayCasing: '#5E4420',
    rail: '#4E5A3E',
    labelPlace: '#FEFAE0',
    labelRoad: '#D8DEC4',
    labelPoi: '#DDA15E',
    labelHalo: 'rgba(23, 33, 14, 0.95)',
  },
  nordic: {
    land: '#F1F5F9',
    landuseResidential: '#E8EFF5',
    park: '#D2EBD9',
    water: '#B9DCF5',
    building: '#DEE5EE',
    buildingStroke: '#CAD4DF',
    roadMinor: '#FFFFFF',
    roadMinorCasing: '#D3DEEB',
    roadSecondary: '#FFFFFF',
    roadSecondaryCasing: '#C0D0E2',
    roadPrimary: '#BAE6FD',
    roadPrimaryCasing: '#38BDF8',
    roadMotorway: '#38BDF8',
    roadMotorwayCasing: '#0284C7',
    rail: '#94A3B8',
    labelPlace: '#0F172A',
    labelRoad: '#334155',
    labelPoi: '#0284C7',
    labelHalo: 'rgba(241, 245, 249, 0.95)',
  },
  matcha: {
    land: '#F4F7F0',
    landuseResidential: '#ECF2E6',
    park: '#D3E8C4',
    water: '#C3E0DC',
    building: '#E1E9D7',
    buildingStroke: '#CBD8BE',
    roadMinor: '#FFFFFF',
    roadMinorCasing: '#DCE5D2',
    roadSecondary: '#FFFFFF',
    roadSecondaryCasing: '#CAD7BE',
    roadPrimary: '#E0F0C0',
    roadPrimaryCasing: '#84CC16',
    roadMotorway: '#84CC16',
    roadMotorwayCasing: '#4D7C0F',
    rail: '#8B9B7E',
    labelPlace: '#1A2E05',
    labelRoad: '#365314',
    labelPoi: '#4D7C0F',
    labelHalo: 'rgba(244, 247, 240, 0.95)',
  },
  sunset: {
    land: '#FFF7F2',
    landuseResidential: '#FDEEE5',
    park: '#E0EED4',
    water: '#C8E2EE',
    building: '#F8E3D5',
    buildingStroke: '#ECC8B4',
    roadMinor: '#FFFFFF',
    roadMinorCasing: '#F0D8C8',
    roadSecondary: '#FFFFFF',
    roadSecondaryCasing: '#E6C4B0',
    roadPrimary: '#FFD4C2',
    roadPrimaryCasing: '#FF8866',
    roadMotorway: '#FF5E36',
    roadMotorwayCasing: '#C23616',
    rail: '#A68274',
    labelPlace: '#292524',
    labelRoad: '#57534E',
    labelPoi: '#FF5E36',
    labelHalo: 'rgba(255, 247, 242, 0.95)',
  },
  cyberpunk: {
    land: '#06080E',
    landuseResidential: '#0B0F19',
    park: '#091A1E',
    water: '#071626',
    building: '#111726',
    buildingStroke: '#1E2942',
    roadMinor: '#161D30',
    roadMinorCasing: '#0B0F19',
    roadSecondary: '#1C2742',
    roadSecondaryCasing: '#0F1524',
    roadPrimary: '#1E3B5C',
    roadPrimaryCasing: '#0A2540',
    roadMotorway: '#00F0FF',
    roadMotorwayCasing: '#007799',
    rail: '#4338CA',
    labelPlace: '#E2E8F0',
    labelRoad: '#94A3B8',
    labelPoi: '#00F0FF',
    labelHalo: 'rgba(6, 8, 14, 0.95)',
  },
  'tokyo-midnight': {
    land: '#080914',
    landuseResidential: '#0F1226',
    park: '#121A2B',
    water: '#0B172E',
    building: '#161935',
    buildingStroke: '#272C5B',
    roadMinor: '#1B1F42',
    roadMinorCasing: '#0F1226',
    roadSecondary: '#252B5C',
    roadSecondaryCasing: '#141733',
    roadPrimary: '#3B3678',
    roadPrimaryCasing: '#211E4A',
    roadMotorway: '#8B5CF6',
    roadMotorwayCasing: '#4C1D95',
    rail: '#6D28D9',
    labelPlace: '#F1F5F9',
    labelRoad: '#CBD5E1',
    labelPoi: '#A78BFA',
    labelHalo: 'rgba(8, 9, 20, 0.95)',
  },
  'ocean-abyss': {
    land: '#020710',
    landuseResidential: '#06101E',
    park: '#051E24',
    water: '#08253B',
    building: '#0C1C33',
    buildingStroke: '#153259',
    roadMinor: '#102440',
    roadMinorCasing: '#071324',
    roadSecondary: '#18365E',
    roadSecondaryCasing: '#0B203B',
    roadPrimary: '#1E4C80',
    roadPrimaryCasing: '#0C2A4A',
    roadMotorway: '#06B6D4',
    roadMotorwayCasing: '#0E7490',
    rail: '#1E3A8A',
    labelPlace: '#E0F2FE',
    labelRoad: '#93C5FD',
    labelPoi: '#38BDF8',
    labelHalo: 'rgba(2, 7, 16, 0.95)',
  },
  crimson: {
    land: '#0C0608',
    landuseResidential: '#170B10',
    park: '#1C1014',
    water: '#180B1C',
    building: '#231018',
    buildingStroke: '#3B1828',
    roadMinor: '#26121B',
    roadMinorCasing: '#12080D',
    roadSecondary: '#351825',
    roadSecondaryCasing: '#1C0B13',
    roadPrimary: '#5C1D38',
    roadPrimaryCasing: '#330B1C',
    roadMotorway: '#E11D48',
    roadMotorwayCasing: '#881337',
    rail: '#4C1D2A',
    labelPlace: '#FDF2F4',
    labelRoad: '#F9A8D4',
    labelPoi: '#FB7185',
    labelHalo: 'rgba(12, 6, 8, 0.95)',
  },
  'coffee-roast': {
    land: '#120D0A',
    landuseResidential: '#1C1410',
    park: '#211E15',
    water: '#14181F',
    building: '#291D17',
    buildingStroke: '#422F25',
    roadMinor: '#2C201A',
    roadMinorCasing: '#17100D',
    roadSecondary: '#3C2B22',
    roadSecondaryCasing: '#201611',
    roadPrimary: '#664531',
    roadPrimaryCasing: '#3B2417',
    roadMotorway: '#D97706',
    roadMotorwayCasing: '#78350F',
    rail: '#574136',
    labelPlace: '#F5F5F4',
    labelRoad: '#D6D3D1',
    labelPoi: '#FBBF24',
    labelHalo: 'rgba(18, 13, 10, 0.95)',
  },
  batman: {
    land: '#000000',
    landuseResidential: '#080808',
    park: '#0F120F',
    water: '#090C12',
    building: '#141414',
    buildingStroke: '#262626',
    roadMinor: '#1A1A1A',
    roadMinorCasing: '#0A0A0A',
    roadSecondary: '#242424',
    roadSecondaryCasing: '#121212',
    roadPrimary: '#383838',
    roadPrimaryCasing: '#1F1F1F',
    roadMotorway: '#FFE600',
    roadMotorwayCasing: '#8A7B00',
    rail: '#404040',
    labelPlace: '#FFFFFF',
    labelRoad: '#A3A3A3',
    labelPoi: '#FFE600',
    labelHalo: 'rgba(0, 0, 0, 0.98)',
  },
  monochrome: {
    land: '#050505',
    landuseResidential: '#0D0D0D',
    park: '#141414',
    water: '#101010',
    building: '#1A1A1A',
    buildingStroke: '#2E2E2E',
    roadMinor: '#222222',
    roadMinorCasing: '#0D0D0D',
    roadSecondary: '#2C2C2C',
    roadSecondaryCasing: '#141414',
    roadPrimary: '#454545',
    roadPrimaryCasing: '#242424',
    roadMotorway: '#EEEEEE',
    roadMotorwayCasing: '#666666',
    rail: '#444444',
    labelPlace: '#FFFFFF',
    labelRoad: '#B0B0B0',
    labelPoi: '#FFFFFF',
    labelHalo: 'rgba(5, 5, 5, 0.98)',
  },
  'monochrome-light': {
    land: '#F6F6F6',
    landuseResidential: '#EEEEEE',
    park: '#E0E0E0',
    water: '#D8D8D8',
    building: '#E2E2E2',
    buildingStroke: '#CCCCCC',
    roadMinor: '#FFFFFF',
    roadMinorCasing: '#D6D6D6',
    roadSecondary: '#FFFFFF',
    roadSecondaryCasing: '#C2C2C2',
    roadPrimary: '#DDDDDD',
    roadPrimaryCasing: '#999999',
    roadMotorway: '#333333',
    roadMotorwayCasing: '#000000',
    rail: '#888888',
    labelPlace: '#09090B',
    labelRoad: '#3F3F46',
    labelPoi: '#000000',
    labelHalo: 'rgba(246, 246, 246, 0.95)',
  },
};

export function getMapPalette(themeId: SarvThemeId): MapThemePalette {
  return SARV_MAP_PALETTES[themeId] || SARV_MAP_PALETTES['persian-light'];
}


const DEFAULT_OPENFREEMAP_TEMPLATE =
  'https://tiles.openfreemap.org/planet/20261115_080022_pt/{z}/{x}/{y}.pbf';

let cachedTemplatePromise: Promise<string> | null = null;

export function resolveOpenFreeMapTemplate(): Promise<string> {
  if (!cachedTemplatePromise) {
    cachedTemplatePromise = fetch('https://tiles.openfreemap.org/planet')
      .then((res) => (res.ok ? res.json() : null))
      .then((json: {tiles?: string[]} | null) => {
        const first = json?.tiles?.[0];
        return typeof first === 'string' && first.includes('{z}')
          ? first
          : DEFAULT_OPENFREEMAP_TEMPLATE;
      })
      .catch(() => DEFAULT_OPENFREEMAP_TEMPLATE);
  }
  return cachedTemplatePromise;
}

const tileCache = new Map<string, VectorTile | null>();
const MAX_CACHE_SIZE = 120;

function setCachedTile(key: string, tile: VectorTile | null) {
  if (tileCache.size >= MAX_CACHE_SIZE) {
    const oldest = tileCache.keys().next().value;
    if (oldest !== undefined) tileCache.delete(oldest);
  }
  tileCache.set(key, tile);
}

function getLabelText(props: Record<string, unknown>): string {
  const fa = props['name:fa'];
  if (typeof fa === 'string' && fa.trim()) return fa.trim();
  const nonlatin = props['name:nonlatin'];
  if (typeof nonlatin === 'string' && nonlatin.trim()) return nonlatin.trim();
  const name = props.name;
  if (typeof name === 'string' && name.trim()) return name.trim();
  return '';
}

function tracePolygonRings(
  ctx: CanvasRenderingContext2D,
  rings: Array<Array<{x: number; y: number}>>,
  scale: number,
) {
  ctx.beginPath();
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const px = ring[i].x * scale;
      const py = ring[i].y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
}

function traceLineStrings(
  ctx: CanvasRenderingContext2D,
  lines: Array<Array<{x: number; y: number}>>,
  scale: number,
) {
  ctx.beginPath();
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const px = line[i].x * scale;
      const py = line[i].y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }
}

interface LabelBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function collides(boxes: LabelBox[], cand: LabelBox): boolean {
  for (const b of boxes) {
    if (cand.x1 < b.x2 && cand.x2 > b.x1 && cand.y1 < b.y2 && cand.y2 > b.y1) {
      return true;
    }
  }
  return false;
}

function drawAradLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontWeight: number,
  fillColor: string,
  haloColor: string,
  boxes: LabelBox[],
  angleRad = 0,
) {
  if (!text || x < 18 || x > 238 || y < 14 || y > 242) return;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px 'Arad', 'Vazirmatn', system-ui, sans-serif`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const w = Math.min(metrics.width + 10, 170);
  const h = fontSize + 6;
  const cand: LabelBox = {
    x1: x - w / 2,
    y1: y - h / 2,
    x2: x + w / 2,
    y2: y + h / 2,
  };

  if (cand.x1 < 2 || cand.x2 > 254 || cand.y1 < 2 || cand.y2 > 254 || collides(boxes, cand)) {
    ctx.restore();
    return;
  }

  boxes.push(cand);
  ctx.translate(x, y);
  if (angleRad !== 0) {
    let adjusted = angleRad;
    if (adjusted > Math.PI / 2) adjusted -= Math.PI;
    if (adjusted < -Math.PI / 2) adjusted += Math.PI;
    ctx.rotate(adjusted);
  }

  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = haloColor;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function renderVectorTileToCanvas(
  canvas: HTMLCanvasElement,
  tile: VectorTile,
  zoom: number,
  palette: MapThemePalette,
  dpr: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = palette.land;
  ctx.fillRect(0, 0, 256, 256);

  // 1. کاربری زمین و فضاهای سبز
  const landuseLayer = tile.layers.landuse;
  if (landuseLayer) {
    const scale = 256 / landuseLayer.extent;
    for (let i = 0; i < landuseLayer.length; i++) {
      const f = landuseLayer.feature(i);
      if (f.type !== 3) continue;
      const cls = String(f.properties.class ?? '');
      if (cls === 'park' || cls === 'grass' || cls === 'cemetery') {
        ctx.fillStyle = palette.park;
      } else if (cls === 'residential' || cls === 'commercial' || cls === 'school' || cls === 'university') {
        ctx.fillStyle = palette.landuseResidential;
      } else {
        continue;
      }
      tracePolygonRings(ctx, f.loadGeometry(), scale);
      ctx.fill('evenodd');
    }
  }

  const parkLayer = tile.layers.park;
  if (parkLayer) {
    const scale = 256 / parkLayer.extent;
    ctx.fillStyle = palette.park;
    for (let i = 0; i < parkLayer.length; i++) {
      const f = parkLayer.feature(i);
      if (f.type !== 3) continue;
      tracePolygonRings(ctx, f.loadGeometry(), scale);
      ctx.fill('evenodd');
    }
  }

  // 2. آب و مسیل‌ها
  const waterLayer = tile.layers.water;
  if (waterLayer) {
    const scale = 256 / waterLayer.extent;
    ctx.fillStyle = palette.water;
    for (let i = 0; i < waterLayer.length; i++) {
      const f = waterLayer.feature(i);
      if (f.type !== 3) continue;
      tracePolygonRings(ctx, f.loadGeometry(), scale);
      ctx.fill('evenodd');
    }
  }

  const waterwayLayer = tile.layers.waterway;
  if (waterwayLayer) {
    const scale = 256 / waterwayLayer.extent;
    ctx.strokeStyle = palette.water;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < waterwayLayer.length; i++) {
      const f = waterwayLayer.feature(i);
      if (f.type !== 2) continue;
      traceLineStrings(ctx, f.loadGeometry(), scale);
      ctx.stroke();
    }
  }

  // 3. ساختمان‌ها (در زوم‌های نزدیک)
  const buildingLayer = tile.layers.building;
  if (buildingLayer && zoom >= 14) {
    const scale = 256 / buildingLayer.extent;
    ctx.fillStyle = palette.building;
    ctx.strokeStyle = palette.buildingStroke;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < buildingLayer.length; i++) {
      const f = buildingLayer.feature(i);
      if (f.type !== 3) continue;
      tracePolygonRings(ctx, f.loadGeometry(), scale);
      ctx.fill('evenodd');
      if (zoom >= 15) ctx.stroke();
    }
  }

  // 4. شبکه راه‌ها (ابتدا حاشیه راه‌ها، سپس بدنه راه‌ها بر اساس سلسله‌مراتب)
  const roadLayer = tile.layers.transportation;
  if (roadLayer) {
    const scale = 256 / roadLayer.extent;
    const buckets: Record<string, VectorTileFeature[]> = {
      minor: [],
      secondary: [],
      primary: [],
      motorway: [],
      rail: [],
    };

    for (let i = 0; i < roadLayer.length; i++) {
      const f = roadLayer.feature(i);
      if (f.type !== 2) continue;
      const cls = String(f.properties.class ?? '');
      if (cls === 'motorway' || cls === 'trunk') buckets.motorway.push(f);
      else if (cls === 'primary') buckets.primary.push(f);
      else if (cls === 'secondary' || cls === 'tertiary') buckets.secondary.push(f);
      else if (cls === 'rail' || cls === 'transit' || cls === 'subway') buckets.rail.push(f);
      else if (zoom >= 13 && (cls === 'minor' || cls === 'service' || cls === 'street')) {
        buckets.minor.push(f);
      }
    }

    const zoomBoost = zoom >= 15 ? 1.45 : zoom >= 14 ? 1.18 : zoom >= 13 ? 0.95 : 0.72;
    const drawRoads = (
      features: VectorTileFeature[],
      width: number,
      casingWidth: number,
      fill: string,
      casing: string,
    ) => {
      if (features.length === 0) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = casing;
      ctx.lineWidth = (width + casingWidth) * zoomBoost;
      for (const f of features) {
        traceLineStrings(ctx, f.loadGeometry(), scale);
        ctx.stroke();
      }
      ctx.strokeStyle = fill;
      ctx.lineWidth = width * zoomBoost;
      for (const f of features) {
        traceLineStrings(ctx, f.loadGeometry(), scale);
        ctx.stroke();
      }
    };

    drawRoads(buckets.minor, 2.2, 1.0, palette.roadMinor, palette.roadMinorCasing);
    drawRoads(buckets.secondary, 3.6, 1.4, palette.roadSecondary, palette.roadSecondaryCasing);
    drawRoads(buckets.primary, 4.6, 1.6, palette.roadPrimary, palette.roadPrimaryCasing);
    drawRoads(buckets.motorway, 5.8, 2.0, palette.roadMotorway, palette.roadMotorwayCasing);

    if (buckets.rail.length > 0 && zoom >= 12) {
      ctx.save();
      ctx.strokeStyle = palette.rail;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      for (const f of buckets.rail) {
        traceLineStrings(ctx, f.loadGeometry(), scale);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 5. برچسب‌های متنی بومی با فونت رسمی آراد (Arad)
  const placedBoxes: LabelBox[] = [];

  // اولویت ۱: محله‌ها و مناطق شهری
  const placeLayer = tile.layers.place;
  if (placeLayer) {
    const scale = 256 / placeLayer.extent;
    for (let i = 0; i < placeLayer.length; i++) {
      const f = placeLayer.feature(i);
      const cls = String(f.properties.class ?? '');
      if (cls === 'country' || cls === 'state') continue;
      const text = getLabelText(f.properties);
      const pt = f.loadGeometry()[0]?.[0];
      if (!pt || !text) continue;
      const isMajor = cls === 'city' || cls === 'town' || cls === 'suburb';
      drawAradLabel(
        ctx,
        text,
        pt.x * scale,
        pt.y * scale,
        isMajor ? 12.5 : 11,
        800,
        palette.labelPlace,
        palette.labelHalo,
        placedBoxes,
      );
    }
  }

  // اولویت ۲: نام بزرگراه‌ها و خیابان‌ها از OpenStreetMap با فونت آراد
  const roadNameLayer = tile.layers.transportation_name;
  if (roadNameLayer && zoom >= 12) {
    const scale = 256 / roadNameLayer.extent;
    for (let i = 0; i < roadNameLayer.length; i++) {
      const f = roadNameLayer.feature(i);
      const cls = String(f.properties.class ?? '');
      const isMajorRoad = cls === 'motorway' || cls === 'trunk' || cls === 'primary';
      if (!isMajorRoad && zoom < 14) continue;
      const text = getLabelText(f.properties);
      if (!text) continue;

      const geom = f.loadGeometry()[0];
      if (!geom || geom.length < 2) continue;
      const midIdx = Math.floor(geom.length / 2);
      const p1 = geom[Math.max(0, midIdx - 1)];
      const p2 = geom[Math.min(geom.length - 1, midIdx)];
      const mx = ((p1.x + p2.x) / 2) * scale;
      const my = ((p1.y + p2.y) / 2) * scale;
      const dx = (p2.x - p1.x) * scale;
      const dy = (p2.y - p1.y) * scale;
      const segLen = Math.hypot(dx, dy);
      if (segLen < 12) continue;
      const angle = Math.atan2(dy, dx);

      drawAradLabel(
        ctx,
        text,
        mx,
        my,
        isMajorRoad ? 10.5 : 9.5,
        isMajorRoad ? 700 : 600,
        palette.labelRoad,
        palette.labelHalo,
        placedBoxes,
        angle,
      );
    }
  }

  // اولویت ۳: اماکن مهم شهری (POI) در زوم‌های نزدیک
  const poiLayer = tile.layers.poi;
  if (poiLayer && zoom >= 14) {
    const scale = 256 / poiLayer.extent;
    for (let i = 0; i < poiLayer.length; i++) {
      const f = poiLayer.feature(i);
      const rank = Number(f.properties.rank ?? 99);
      if (rank > 5 && zoom < 16) continue;
      const text = getLabelText(f.properties);
      const pt = f.loadGeometry()[0]?.[0];
      if (!pt || !text) continue;

      drawAradLabel(
        ctx,
        text,
        pt.x * scale,
        pt.y * scale,
        9.5,
        600,
        palette.labelPoi,
        palette.labelHalo,
        placedBoxes,
      );
    }
  }
}

export class OpenFreeMapAradGridLayer extends L.GridLayer {
  private themeId: SarvThemeId;

  constructor(themeId: SarvThemeId, options?: L.GridLayerOptions) {
    super({
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> · <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>',
      ...options,
    });
    this.themeId = themeId;
  }

  setTheme(themeId: SarvThemeId) {
    if (this.themeId === themeId) return;
    this.themeId = themeId;
    this.redraw();
  }

  override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 256 * dpr;
    canvas.height = 256 * dpr;
    canvas.style.width = '256px';
    canvas.style.height = '256px';

    const palette = getMapPalette(this.themeId);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = palette.land;
      ctx.fillRect(0, 0, 256, 256);
    }

    const cacheKey = `${coords.z}/${coords.x}/${coords.y}`;
    const cached = tileCache.get(cacheKey);
    if (cached !== undefined) {
      if (cached) {
        renderVectorTileToCanvas(canvas, cached, coords.z, palette, dpr);
      }
      queueMicrotask(() => done(undefined, canvas));
      return canvas;
    }

    resolveOpenFreeMapTemplate()
      .then(async (template) => {
        const url = template
          .replace('{z}', String(coords.z))
          .replace('{x}', String(coords.x))
          .replace('{y}', String(coords.y));
        const res = await fetch(url);
        if (!res.ok) {
          setCachedTile(cacheKey, null);
          done(undefined, canvas);
          return;
        }
        const buf = await res.arrayBuffer();
        const parsed = new VectorTile(new PbfReader(new Uint8Array(buf)));
        setCachedTile(cacheKey, parsed);

        if ('fonts' in document) {
          await document.fonts.ready;
        }
        renderVectorTileToCanvas(
          canvas,
          parsed,
          coords.z,
          getMapPalette(this.themeId),
          dpr,
        );
        done(undefined, canvas);
      })
      .catch(() => {
        done(undefined, canvas);
      });

    return canvas;
  }
}
