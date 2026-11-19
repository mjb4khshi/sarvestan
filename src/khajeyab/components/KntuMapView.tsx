import {useEffect, useMemo, useRef, useState} from 'react';
import L from 'leaflet';
import {
  AlertCircle,
  Compass,
  Layers,
  Loader2,
  MapPin,
  Navigation,
  Sparkles,
  Type,
} from 'lucide-react';
import {
  CAMPUS_MAP,
  KNTU_CAMPUSES,
  type CampusId,
  type LatLng,
} from '../data/kntuCampuses';
import {TEHRAN_MAP_LABELS} from '../data/tehranMapLabels';
import {TEHRAN_BRT_LINES, TEHRAN_METRO_LINES} from '../data/tehranTransit';
import {fetchOsrmRoute} from '../utils/osrmRouting';
import {
  formatDistanceKm,
  formatDurationMin,
  type SarvThemeId,
} from '../utils/wayfinder';
import {OpenFreeMapAradGridLayer} from './OpenFreeMapAradLayer';
import {
  TEHRAN_METRO_INNER_PATH,
  TEHRAN_METRO_OUTER_PATH,
  TehranBrtLogo,
  TehranMetroLogo,
} from './TransitIcons';

export interface ActiveMapRoute {
  origin: LatLng;
  destination: LatLng;
  originLabel: string;
  destinationLabel: string;
  travelMode: 'DRIVING' | 'WALKING';
  accentColor?: string;
}

export interface LiveRouteSummary {
  distanceMeters: number;
  durationMillis: number;
}

interface KntuMapViewProps {
  selectedCampusId: CampusId;
  onSelectCampus: (id: CampusId) => void;
  activeRoute: ActiveMapRoute | null;
  onRouteComputed?: (summary: LiveRouteSummary | null) => void;
  theme: SarvThemeId;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const TEHRAN_CENTER: [number, number] = [35.7515, 51.468];

const THEME_BADGE_LABEL: Record<SarvThemeId, string> = {
  'persian-light': 'تم پرشین روشن',
  emerald: 'تم زمرد سرو',
  'persian-dark': 'تم پرشین تاریک',
  tehran: 'تم تهران کلاسیک',
};

const METRO_SVG_INLINE = `<svg viewBox="0 0 1000 1000" width="14" height="14" style="flex-shrink:0;border-radius:2px;" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="0" y="0" width="1000" height="1000" rx="110" fill="#0A0A0A"/><rect x="58" y="58" width="884" height="884" rx="52" fill="#FAD116"/><path d="${TEHRAN_METRO_OUTER_PATH}" fill="#0A0A0A"/><path d="${TEHRAN_METRO_INNER_PATH}" fill="#0A0A0A"/></svg>`;

const BRT_ICON_SVG = `<svg viewBox="0 0 28 28" width="13" height="13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="4" y="3.5" width="20" height="18" rx="4" stroke="currentColor" stroke-width="2.2"/><path d="M4.5 13H23.5" stroke="currentColor" stroke-width="2"/><path d="M9 7.5H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="17.2" r="1.4" fill="currentColor"/><circle cx="19" cy="17.2" r="1.4" fill="currentColor"/></svg>`;

/**
 * نقشه تعاملی OpenStreetMap + OpenFreeMap Vector Tiles با تایپوگرافی بومی آراد (Arad)
 * و تم‌های اختصاصی دیزاین‌سیستم سرو — متن‌باز و بدون نیاز به کلید API یا خدمات پولی
 */
export function KntuMapView({
  selectedCampusId,
  onSelectCampus,
  activeRoute,
  onRouteComputed,
  theme,
}: KntuMapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vectorLayerRef = useRef<OpenFreeMapAradGridLayer | null>(null);
  const osmFallbackLayerRef = useRef<L.TileLayer | null>(null);
  const campusLayerRef = useRef<L.LayerGroup | null>(null);
  const metroLayerRef = useRef<L.LayerGroup | null>(null);
  const brtLayerRef = useRef<L.LayerGroup | null>(null);
  const labelsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const onSelectRef = useRef(onSelectCampus);
  const onRouteComputedRef = useRef(onRouteComputed);
  onSelectRef.current = onSelectCampus;
  onRouteComputedRef.current = onRouteComputed;

  const [showMetro, setShowMetro] = useState(true);
  const [showBrt, setShowBrt] = useState(true);
  const [showAradLabels, setShowAradLabels] = useState(true);
  const [useStandardOsmTiles, setUseStandardOsmTiles] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);

  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [liveSummary, setLiveSummary] = useState<LiveRouteSummary | null>(null);

  const selectedCampus = CAMPUS_MAP[selectedCampusId] ?? KNTU_CAMPUSES[0];
  const isDarkTheme = theme === 'emerald' || theme === 'persian-dark';

  const metroStations = useMemo(() => {
    const seen: Record<string, (typeof KNTU_CAMPUSES)[0]['metroOptions'][0]> = {};
    KNTU_CAMPUSES.forEach((c) => {
      c.metroOptions.forEach((opt) => {
        const key = `${opt.lineId}-${opt.stationName}`;
        if (!seen[key]) seen[key] = opt;
      });
    });
    return Object.values(seen);
  }, []);

  const brtStations = useMemo(() => {
    const seen: Record<string, (typeof KNTU_CAMPUSES)[0]['brtOptions'][0]> = {};
    KNTU_CAMPUSES.forEach((c) => {
      c.brtOptions.forEach((opt) => {
        const key = `${opt.lineId}-${opt.stationName}`;
        if (!seen[key]) seen[key] = opt;
      });
    });
    return Object.values(seen);
  }, []);

  // راه‌اندازی اولیه نقشه Leaflet + کاشی‌های برداری OpenFreeMap با فونت آراد
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [selectedCampus.coords.lat, selectedCampus.coords.lng],
      zoom: 14,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({position: 'bottomleft'}).addTo(map);
    map.attributionControl.setPrefix('خواجه‌یاب');

    const vectorLayer = new OpenFreeMapAradGridLayer(theme);
    vectorLayer.addTo(map);

    const osmStandard = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        className: 'sarv-map-tiles',
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      },
    );

    const labelsLayer = L.layerGroup().addTo(map);
    const brtLayer = L.layerGroup().addTo(map);
    const metroLayer = L.layerGroup().addTo(map);
    const routeLayer = L.layerGroup().addTo(map);
    const campusLayer = L.layerGroup().addTo(map);

    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };
    map.on('zoomend', handleZoom);

    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        vectorLayer.redraw();
      });
    }

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    mapRef.current = map;
    vectorLayerRef.current = vectorLayer;
    osmFallbackLayerRef.current = osmStandard;
    labelsLayerRef.current = labelsLayer;
    brtLayerRef.current = brtLayer;
    metroLayerRef.current = metroLayer;
    routeLayerRef.current = routeLayer;
    campusLayerRef.current = campusLayer;

    return () => {
      window.clearTimeout(resizeTimer);
      map.off('zoomend', handleZoom);
      map.remove();
      mapRef.current = null;
      vectorLayerRef.current = null;
      osmFallbackLayerRef.current = null;
      labelsLayerRef.current = null;
      brtLayerRef.current = null;
      metroLayerRef.current = null;
      routeLayerRef.current = null;
      campusLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // همگام‌سازی تم Sarv UI با لایه نقشه
  useEffect(() => {
    const map = mapRef.current;
    const vectorLayer = vectorLayerRef.current;
    const osmLayer = osmFallbackLayerRef.current;
    if (!map || !vectorLayer || !osmLayer) return;

    vectorLayer.setTheme(theme);

    if (useStandardOsmTiles) {
      if (map.hasLayer(vectorLayer)) map.removeLayer(vectorLayer);
      if (!map.hasLayer(osmLayer)) osmLayer.addTo(map);
    } else {
      if (map.hasLayer(osmLayer)) map.removeLayer(osmLayer);
      if (!map.hasLayer(vectorLayer)) vectorLayer.addTo(map);
    }
  }, [theme, useStandardOsmTiles]);

  // حرکت نرم دوربین هنگام انتخاب پردیس جدید
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeRoute) return;
    const targetZoom = Math.max(map.getZoom(), 14);
    map.flyTo([selectedCampus.coords.lat, selectedCampus.coords.lng], targetZoom, {
      duration: 0.55,
    });
  }, [selectedCampus, activeRoute]);

  // رندر پین‌های پردیس‌های خواجه نصیر با فونت آراد
  useEffect(() => {
    const group = campusLayerRef.current;
    if (!group) return;
    group.clearLayers();

    KNTU_CAMPUSES.forEach((campus) => {
      const isSelected = campus.id === selectedCampusId;
      const bg = isSelected ? campus.accentColor : 'var(--sarv-surface)';
      const fg = isSelected ? '#ffffff' : 'var(--sarv-text)';
      const border = isSelected ? '#ffffff' : campus.accentColor;

      const html = `
        <button
          type="button"
          aria-label="${escapeHtml(campus.name)}"
          style="
            font-family: var(--font-sarv);
            font-variation-settings: 'DSTY' 2;
            background-color: ${bg};
            color: ${fg};
            border: 2px solid ${border};
            transform: translate(-50%, -50%) scale(${isSelected ? 1.07 : 1});
          "
          class="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-extrabold shadow-md transition-transform whitespace-nowrap cursor-pointer"
        >
          <span
            style="
              background-color: ${isSelected ? 'rgba(255,255,255,0.22)' : campus.accentColor};
              color: #ffffff;
            "
            class="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black"
          >${escapeHtml(campus.code)}</span>
          <span>${escapeHtml(campus.shortName)}</span>
        </button>
      `;

      const icon = L.divIcon({
        className: 'bg-transparent border-0',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([campus.coords.lat, campus.coords.lng], {
        icon,
        zIndexOffset: isSelected ? 600 : 300,
      });

      marker.on('click', () => {
        onSelectRef.current(campus.id);
      });
      marker.addTo(group);
    });
  }, [selectedCampusId, theme]);

  // رندر ایستگاه‌های متروی تهران با لوگوی رسمی برداری مترو و فونت آراد
  useEffect(() => {
    const group = metroLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showMetro) return;

    const showNames = currentZoom >= 13;

    metroStations.forEach((station) => {
      const line = TEHRAN_METRO_LINES[station.lineId];
      const html = showNames
        ? `
        <div
          title="مترو ${escapeHtml(station.stationName)} (${escapeHtml(line.name)})"
          style="
            font-family: var(--font-sarv);
            font-variation-settings: 'DSTY' 2;
            background-color: var(--sarv-surface);
            color: var(--sarv-text);
            border: 1.5px solid ${line.color};
            transform: translate(-50%, -50%);
          "
          class="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-[11px] font-bold shadow-sm whitespace-nowrap"
        >
          ${METRO_SVG_INLINE}
          <span
            style="background-color:${line.color};color:${line.textColor};"
            class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-black tabular-nums"
          >${escapeHtml(line.code)}</span>
          <span>${escapeHtml(station.stationName)}</span>
        </div>
      `
        : `
        <div
          title="مترو ${escapeHtml(station.stationName)} (${escapeHtml(line.name)})"
          style="
            font-family: var(--font-sarv);
            background-color: ${line.color};
            color: ${line.textColor};
            transform: translate(-50%, -50%);
          "
          class="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black shadow border border-white/90"
        >${escapeHtml(line.code)}</div>
      `;

      const icon = L.divIcon({
        className: 'bg-transparent border-0',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      L.marker([station.stationCoords.lat, station.stationCoords.lng], {
        icon,
        interactive: false,
        zIndexOffset: 160,
      }).addTo(group);
    });
  }, [showMetro, metroStations, currentZoom, theme]);

  // رندر ایستگاه‌های BRT با فونت آراد
  useEffect(() => {
    const group = brtLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showBrt) return;

    const showNames = currentZoom >= 13;

    brtStations.forEach((station) => {
      const line = TEHRAN_BRT_LINES[station.lineId];
      const html = showNames
        ? `
        <div
          title="BRT خط ${escapeHtml(line.code)} — ${escapeHtml(station.stationName)}"
          style="
            font-family: var(--font-sarv);
            font-variation-settings: 'DSTY' 2;
            background-color: ${line.color};
            color: ${line.textColor};
            transform: translate(-50%, -50%);
          "
          class="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-bold shadow border border-white/80 whitespace-nowrap"
        >
          ${BRT_ICON_SVG}
          <span class="tabular-nums">BRT ${escapeHtml(line.code)}</span>
        </div>
      `
        : `
        <div
          title="BRT خط ${escapeHtml(line.code)} — ${escapeHtml(station.stationName)}"
          style="
            background-color: ${line.color};
            transform: translate(-50%, -50%);
          "
          class="w-3 h-3 rounded-sm shadow border border-white/90"
        ></div>
      `;

      const icon = L.divIcon({
        className: 'bg-transparent border-0',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      L.marker([station.stationCoords.lat, station.stationCoords.lng], {
        icon,
        interactive: false,
        zIndexOffset: 120,
      }).addTo(group);
    });
  }, [showBrt, brtStations, currentZoom]);

  // برچسب‌های تکمیلی محله‌ها و بزرگراه‌های کلیدی خواجه نصیر با فونت آراد
  useEffect(() => {
    const group = labelsLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showAradLabels || useStandardOsmTiles) return;

    TEHRAN_MAP_LABELS.filter((lbl) => currentZoom >= lbl.minZoom).forEach((lbl) => {
      const isStreet = lbl.kind === 'street' || lbl.kind === 'highway';
      const html = isStreet
        ? `<div class="sarv-map-street-label px-2 py-0.5 rounded-md text-[10px] font-bold" style="transform:translate(-50%,-50%);">${escapeHtml(lbl.label)}</div>`
        : `<div class="sarv-map-place-label text-xs font-extrabold" style="transform:translate(-50%,-50%);">${escapeHtml(lbl.label)}</div>`;

      const icon = L.divIcon({
        className: 'bg-transparent border-0 pointer-events-none',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      L.marker([lbl.coords.lat, lbl.coords.lng], {
        icon,
        interactive: false,
        zIndexOffset: 40,
      }).addTo(group);
    });
  }, [showAradLabels, useStandardOsmTiles, currentZoom, theme]);

  // محاسبه و رسم مسیر زنده روی نقشه با OSRM (رایگان و مبتنی بر OpenStreetMap)
  useEffect(() => {
    const map = mapRef.current;
    const routeGroup = routeLayerRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();
    setRouteError(null);

    if (!activeRoute) {
      setRouteLoading(false);
      setLiveSummary(null);
      onRouteComputedRef.current?.(null);
      return;
    }

    const controller = new AbortController();
    setRouteLoading(true);

    fetchOsrmRoute(
      activeRoute.origin,
      activeRoute.destination,
      activeRoute.travelMode,
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setRouteLoading(false);

        const color =
          activeRoute.accentColor ?? (isDarkTheme ? '#38BDF8' : '#0066A4');

        L.polyline(res.coordinates, {
          color: isDarkTheme ? '#020617' : '#ffffff',
          weight: 9,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeGroup);

        const mainLine = L.polyline(res.coordinates, {
          color,
          weight: 5,
          opacity: 0.96,
          dashArray:
            res.isFallback || activeRoute.travelMode === 'WALKING'
              ? '7 7'
              : undefined,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeGroup);

        const originIcon = L.divIcon({
          className: 'bg-transparent border-0',
          html: `<div style="width:14px;height:14px;border-radius:999px;background:#10b981;border:2.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);transform:translate(-50%,-50%);"></div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([activeRoute.origin.lat, activeRoute.origin.lng], {
          icon: originIcon,
          interactive: false,
          zIndexOffset: 500,
        }).addTo(routeGroup);

        map.fitBounds(mainLine.getBounds(), {padding: [56, 56], maxZoom: 16});

        if (res.isFallback) {
          setRouteError('مسیر مستقیم راهنما نمایش داده شد.');
          setLiveSummary(null);
          onRouteComputedRef.current?.(null);
        } else {
          const summary: LiveRouteSummary = {
            distanceMeters: res.distanceMeters,
            durationMillis: res.durationMillis,
          };
          setLiveSummary(summary);
          onRouteComputedRef.current?.(summary);
        }
      })
      .catch((err: unknown) => {
        if ((err as {name?: string})?.name === 'AbortError') return;
        setRouteLoading(false);
        setRouteError('امکان دریافت مسیر جاده‌ای نبود.');
        setLiveSummary(null);
        onRouteComputedRef.current?.(null);
      });

    return () => {
      controller.abort();
    };
  }, [activeRoute, isDarkTheme]);

  const handleFitAllCampuses = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = L.latLngBounds(
      KNTU_CAMPUSES.map((c) => [c.coords.lat, c.coords.lng] as [number, number]),
    );
    map.fitBounds(bounds, {padding: [48, 48], maxZoom: 13});
  };

  return (
    <div
      className="sarv-surface relative h-full w-full min-h-[420px] overflow-hidden bg-[var(--sarv-map-bg)] flex flex-col"
      data-testid="kntu-map-container"
    >
      {/* بوم نقشه با stacking context مستقل z-0 تا نوار ابزار شناور روی آن قرار بگیرد */}
      <div
        ref={containerRef}
        dir="ltr"
        data-center={`${TEHRAN_CENTER[0]},${TEHRAN_CENTER[1]}`}
        className="sarv-leaflet-container relative z-0 flex-1 w-full min-h-[420px]"
        aria-label="نقشه تعاملی OpenStreetMap پردیس‌های دانشگاه صنعتی خواجه نصیر"
      />

      {/* نوار شناور کنترل لایه‌ها و نمای نقشه */}
      <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--sarv-surface)]/95 backdrop-blur border border-[var(--sarv-border)] shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[var(--sarv-primary)] shrink-0" />
          <span className="text-xs font-extrabold text-[var(--sarv-text)]">
            {selectedCampus.shortName}
          </span>
          <span className="hidden sm:inline text-[11px] text-[var(--sarv-text-subtle)] border-r border-[var(--sarv-border)] pr-2">
            {THEME_BADGE_LABEL[theme]}
          </span>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowMetro((v) => !v)}
            aria-pressed={showMetro}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-colors shadow-sm backdrop-blur whitespace-nowrap cursor-pointer ${
              showMetro
                ? 'bg-[var(--sarv-surface)]/95 text-[var(--sarv-text)] border-[var(--sarv-primary)]'
                : 'bg-[var(--sarv-surface)]/85 text-[var(--sarv-text-muted)] border-[var(--sarv-border)] opacity-75'
            }`}
          >
            <TehranMetroLogo className="w-4 h-4 shrink-0" />
            <span>مترو</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBrt((v) => !v)}
            aria-pressed={showBrt}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-colors shadow-sm backdrop-blur whitespace-nowrap cursor-pointer ${
              showBrt
                ? 'bg-[#0D9488] text-white border-[#0D9488]'
                : 'bg-[var(--sarv-surface)]/90 text-[var(--sarv-text-muted)] border-[var(--sarv-border)]'
            }`}
          >
            <TehranBrtLogo className="w-3.5 h-3.5" />
            <span>BRT</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAradLabels((v) => !v)}
            aria-pressed={showAradLabels}
            title="نمایش یا مخفی کردن برچسب‌های راهنمای محله‌ها و بزرگراه‌ها"
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-colors shadow-sm backdrop-blur whitespace-nowrap cursor-pointer ${
              showAradLabels && !useStandardOsmTiles
                ? 'bg-[var(--sarv-surface)]/95 text-[var(--sarv-text)] border-[var(--sarv-primary)]'
                : 'bg-[var(--sarv-surface)]/90 text-[var(--sarv-text-muted)] border-[var(--sarv-border)]'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-[var(--sarv-primary)]" />
            <span className="hidden md:inline">محله‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setUseStandardOsmTiles((v) => !v)}
            aria-pressed={useStandardOsmTiles}
            className="inline-flex items-center gap-1 rounded-xl bg-[var(--sarv-surface)]/95 border border-[var(--sarv-border)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--sarv-text)] hover:border-[var(--sarv-primary)] transition-colors shadow-sm backdrop-blur whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--sarv-primary)]" />
            <span>{useStandardOsmTiles ? 'نقشه آراد' : 'OSM کلاسیک'}</span>
          </button>

          <button
            type="button"
            onClick={handleFitAllCampuses}
            className="inline-flex items-center gap-1 rounded-xl bg-[var(--sarv-surface)]/95 border border-[var(--sarv-border)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--sarv-text)] hover:border-[var(--sarv-primary)] transition-colors shadow-sm backdrop-blur whitespace-nowrap cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[var(--sarv-emerald)]" />
            <span>همه پردیس‌ها</span>
          </button>
        </div>
      </div>

      {/* وضعیت بارگذاری یا خطای مسیر */}
      {(routeLoading || routeError) && (
        <div className="absolute bottom-4 right-4 z-20 max-w-xs rounded-xl bg-[var(--sarv-surface)]/95 border border-[var(--sarv-border)] px-3 py-2 text-xs text-[var(--sarv-text)] shadow-sm backdrop-blur">
          {routeLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--sarv-primary)]" />
              در حال دریافت مسیر روی نقشه...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-[var(--sarv-text-muted)]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              {routeError}
            </span>
          )}
        </div>
      )}

      {/* کارت خلاصه مسیر فعال روی نقشه */}
      {activeRoute && liveSummary && (
        <div className="absolute bottom-4 right-4 z-20 rounded-xl bg-[var(--sarv-surface)]/95 border border-[var(--sarv-border)] px-3.5 py-2.5 shadow-md backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--sarv-text)]">
            <Navigation className="w-3.5 h-3.5 text-[var(--sarv-primary)]" />
            <span>
              {activeRoute.originLabel} ← {activeRoute.destinationLabel}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--sarv-text-muted)] tabular-nums">
            <span>{formatDistanceKm(liveSummary.distanceMeters)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {formatDurationMin(Math.max(1, Math.round(liveSummary.durationMillis / 60000)))}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activeRoute.travelMode === 'WALKING' ? 'پیاده' : 'خودرو'}</span>
          </div>
        </div>
      )}

      {!activeRoute && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--sarv-surface)]/90 backdrop-blur border border-[var(--sarv-border)] text-[10.5px] font-semibold text-[var(--sarv-text-muted)]">
          <Layers className="w-3 h-3 text-[var(--sarv-primary)]" />
          <span>OpenStreetMap · بدون محدودیت دامنه</span>
        </div>
      )}
    </div>
  );
}
