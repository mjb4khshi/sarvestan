import {useState} from 'react';
import {
  AlertTriangle,
  Car,
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Navigation,
  Route,
} from 'lucide-react';
import type {CampusId, KntuCampus} from '../data/kntuCampuses';
import {TEHRAN_BRT_LINES, TEHRAN_METRO_LINES} from '../data/tehranTransit';
import {
  buildDeepLink,
  buildExternalNavLinks,
  toPersianDigits,
} from '../utils/wayfinder';
import type {ActiveMapRoute} from './KntuMapView';
import {
  BrtLineShield,
  MetroLineShield,
  TehranBrtLogo,
  TehranMetroLogo,
} from './TransitIcons';

type TransportTab = 'metro' | 'brt' | 'car';

interface CampusDetailPanelProps {
  campus: KntuCampus;
  activeRoute: ActiveMapRoute | null;
  onShowRouteOnMap: (route: ActiveMapRoute | null) => void;
  onOpenPoster: (campusId: CampusId) => void;
  onOpenBetweenFrom: (campusId: CampusId) => void;
  onJumpToCampus: (campusId: CampusId) => void;
}

export function CampusDetailPanel({
  campus,
  activeRoute,
  onShowRouteOnMap,
  onOpenPoster,
  onOpenBetweenFrom,
  onJumpToCampus,
}: CampusDetailPanelProps) {
  const [tab, setTab] = useState<TransportTab>('metro');
  const [copied, setCopied] = useState(false);

  const navLinks = buildExternalNavLinks(campus.coords, campus.name);

  const handleCopyDeepLink = async () => {
    const base =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://khajeyab.ir';
    const url = buildDeepLink(base, campus.id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-label={`جزئیات دسترسی به ${campus.name}`}
      className="sarv-surface p-5 space-y-5"
    >
      {/* هدر پردیس بدون پیل اضافه */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-[var(--sarv-text-subtle)]">
              {campus.neighborhood}
            </p>
            <h2 className="text-xl font-extrabold text-[var(--sarv-text)] leading-snug">
              {campus.name}
            </h2>
          </div>
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black shrink-0"
            style={{backgroundColor: campus.accentColor, color: '#ffffff'}}
            aria-hidden="true"
          >
            {campus.code}
          </span>
        </div>

        <p className="text-sm font-medium text-[var(--sarv-primary)] leading-relaxed">
          {campus.faculties.join(' · ')}
        </p>

        <div className="flex items-start gap-2 text-xs text-[var(--sarv-text-muted)] pt-1">
          <MapPin className="w-4 h-4 shrink-0 text-[var(--sarv-text-subtle)] mt-0.5" />
          <span>
            {campus.address} — <strong className="text-[var(--sarv-text)]">{campus.mainGate}</strong>
          </span>
        </div>
      </div>

      {/* یادداشت مهم (مخصوصاً برای پردیس علوم) */}
      {campus.importantNote && (
        <div
          role="note"
          className="rounded-xl p-3.5 text-xs leading-6 border flex items-start gap-2.5"
          style={{
            backgroundColor: 'var(--sarv-warn-soft)',
            borderColor: 'var(--sarv-warn-border)',
            color: 'var(--sarv-warn-text)',
          }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-1" />
          <div className="space-y-1.5">
            <p className="font-medium">{campus.importantNote}</p>
            {campus.id === 'science' && (
              <button
                type="button"
                onClick={() => onJumpToCampus('rezaeinejad')}
                className="underline font-bold cursor-pointer hover:opacity-80"
              >
                مشاهده مسیر پردیس شهید رضایی‌نژاد (خاکسفورد)
              </button>
            )}
          </div>
        </div>
      )}

      {/* دکمه‌های اقدام سریع */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenPoster(campus.id)}
          className="sarv-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>پوستر و کارت این پردیس</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenBetweenFrom(campus.id)}
          className="sarv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
        >
          <Route className="w-3.5 h-3.5 text-[var(--sarv-primary)]" />
          <span>مسیر به پردیس دیگر</span>
        </button>

        <button
          type="button"
          onClick={handleCopyDeepLink}
          className="sarv-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
          aria-label="کپی لینک مستقیم این پردیس"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>لینک کپی شد</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[var(--sarv-text-subtle)]" />
              <span>کپی لینک</span>
            </>
          )}
        </button>
      </div>

      {/* تب‌های روش حمل‌ونقل */}
      <div
        role="tablist"
        aria-label="انتخاب وسیله نقلیه"
        className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--sarv-surface-subtle)] border border-[var(--sarv-border)]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'metro'}
          onClick={() => setTab('metro')}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap min-w-0 cursor-pointer ${
            tab === 'metro'
              ? 'bg-[var(--sarv-surface)] text-[var(--sarv-text)] shadow-sm'
              : 'text-[var(--sarv-text-muted)] hover:text-[var(--sarv-text)]'
          }`}
        >
          <TehranMetroLogo className="w-4 h-4 shrink-0 rounded-[3px]" />
          <span className="truncate">مترو تهران</span>
        </button>

        {campus.brtOptions.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'brt'}
            onClick={() => setTab('brt')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap min-w-0 cursor-pointer ${
              tab === 'brt'
                ? 'bg-[var(--sarv-surface)] text-[var(--sarv-text)] shadow-sm'
                : 'text-[var(--sarv-text-muted)] hover:text-[var(--sarv-text)]'
            }`}
          >
            <TehranBrtLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#0D9488]" />
            <span className="truncate">اتوبوس BRT</span>
          </button>
        )}

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'car'}
          onClick={() => setTab('car')}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap min-w-0 cursor-pointer ${
            tab === 'car'
              ? 'bg-[var(--sarv-surface)] text-[var(--sarv-text)] shadow-sm'
              : 'text-[var(--sarv-text-muted)] hover:text-[var(--sarv-text)]'
          }`}
        >
          <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[var(--sarv-primary)]" />
          <span className="sm:hidden truncate">مسیریاب</span>
          <span className="hidden sm:inline truncate">مسیریاب و اسنپ</span>
        </button>
      </div>

      {/* محتوای تب مترو تهران */}
      {tab === 'metro' && (
        <div className="divide-y divide-[var(--sarv-border)]">
          {campus.metroOptions.map((opt) => {
            const line = TEHRAN_METRO_LINES[opt.lineId];
            const isShowing =
              activeRoute?.originLabel === `مترو ${opt.stationName}` &&
              activeRoute?.destinationLabel === campus.shortName;

            return (
              <div key={opt.id} className="py-4 first:pt-1 last:pb-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MetroLineShield lineId={opt.lineId} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-[var(--sarv-text)]">
                          ایستگاه مترو {opt.stationName}
                        </h3>
                        {opt.recommended && (
                          <span className="text-[11px] font-bold text-[var(--sarv-emerald)]">
                            · پیشنهاد سریع‌تر
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--sarv-text-subtle)] mt-0.5 tabular-nums">
                        {line.name} ({line.routeLabel}) · حدود {toPersianDigits(opt.durationMinutes)} دقیقه تا سردر
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onShowRouteOnMap(
                        isShowing
                          ? null
                          : {
                              origin: opt.stationCoords,
                              destination: campus.coords,
                              originLabel: `مترو ${opt.stationName}`,
                              destinationLabel: campus.shortName,
                              travelMode: opt.connectionType === 'walk' ? 'WALKING' : 'DRIVING',
                              accentColor: line.color,
                            },
                      )
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isShowing
                        ? 'bg-[var(--sarv-primary)] text-[var(--sarv-primary-content)] border-transparent'
                        : 'bg-[var(--sarv-surface-subtle)] text-[var(--sarv-text)] border-[var(--sarv-border)] hover:border-[var(--sarv-primary)]'
                    }`}
                  >
                    {isShowing ? 'حذف خط مسیر' : 'نمایش روی نقشه'}
                  </button>
                </div>

                <p className="text-xs text-[var(--sarv-text-muted)]">
                  <strong className="text-[var(--sarv-text)]">خروجی:</strong> {opt.exitHint} ·{' '}
                  <strong className="text-[var(--sarv-text)]">ادامه مسیر:</strong> {opt.connectionLabel}
                </p>

                <ol className="space-y-1.5 pr-4 list-decimal text-xs text-[var(--sarv-text-muted)] leading-6">
                  {opt.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      )}

      {/* محتوای تب BRT */}
      {tab === 'brt' && (
        <div className="divide-y divide-[var(--sarv-border)]">
          {campus.brtOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--sarv-text-muted)] space-y-1">
              <p className="font-bold text-[var(--sarv-text)]">خط مستقیم BRT برای این پردیس وجود ندارد.</p>
              <p>دسترسی اصلی دانشجویان از طریق ایستگاه‌های مترو و اتوبوس/تاکسی‌های تغذیه‌کننده است.</p>
            </div>
          ) : (
            campus.brtOptions.map((opt) => {
            const brtLine = TEHRAN_BRT_LINES[opt.lineId];
            const isShowing =
              activeRoute?.originLabel === `ایستگاه BRT ${opt.stationName}` &&
              activeRoute?.destinationLabel === campus.shortName;

            return (
              <div key={opt.id} className="py-4 first:pt-1 last:pb-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <BrtLineShield lineId={opt.lineId} />
                      <h3 className="text-sm font-extrabold text-[var(--sarv-text)]">
                        ایستگاه {opt.stationName}
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--sarv-text-subtle)] tabular-nums">
                      {brtLine.routeLabel} · {toPersianDigits(opt.durationMinutes)} دقیقه تا سردر ({opt.connectionType === 'walk' ? 'پیاده' : 'با خطی'})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onShowRouteOnMap(
                        isShowing
                          ? null
                          : {
                              origin: opt.stationCoords,
                              destination: campus.coords,
                              originLabel: `ایستگاه BRT ${opt.stationName}`,
                              destinationLabel: campus.shortName,
                              travelMode: opt.connectionType === 'walk' ? 'WALKING' : 'DRIVING',
                              accentColor: brtLine.color,
                            },
                      )
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isShowing
                        ? 'bg-[var(--sarv-primary)] text-[var(--sarv-primary-content)] border-transparent'
                        : 'bg-[var(--sarv-surface-subtle)] text-[var(--sarv-text)] border-[var(--sarv-border)] hover:border-[var(--sarv-primary)]'
                    }`}
                  >
                    {isShowing ? 'حذف خط مسیر' : 'نمایش روی نقشه'}
                  </button>
                </div>

                <ol className="space-y-1.5 pr-4 list-decimal text-xs text-[var(--sarv-text-muted)] leading-6">
                  {opt.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* محتوای تب مسیریاب و اسنپ */}
      {tab === 'car' && (
        <div className="space-y-4 pt-1">
          <p className="text-xs text-[var(--sarv-text-muted)] leading-6">
            {campus.drivingTip}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href={navLinks.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="sarv-btn-primary flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>

            <a
              href={navLinks.neshan}
              target="_blank"
              rel="noopener noreferrer"
              className="sarv-btn-secondary flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--sarv-primary)]" />
              <span>مسیریاب نشان</span>
            </a>

            <a
              href={navLinks.balad}
              target="_blank"
              rel="noopener noreferrer"
              className="sarv-btn-secondary flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--sarv-emerald)]" />
              <span>مسیریاب بلد</span>
            </a>
          </div>
        </div>
      )}

      {/* نوار سریع مسیریاب‌های بیرونی در پایین پنل */}
      {tab !== 'car' && (
        <div className="pt-3 border-t border-[var(--sarv-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[var(--sarv-text-subtle)] font-medium">
            شروع ناوبری زنده در:
          </span>
          <div className="flex items-center gap-3">
            <a
              href={navLinks.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[var(--sarv-primary)] hover:underline whitespace-nowrap"
            >
              Google Maps
            </a>
            <span className="text-[var(--sarv-border-strong)]" aria-hidden="true">·</span>
            <a
              href={navLinks.neshan}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[var(--sarv-text)] hover:text-[var(--sarv-primary)] hover:underline whitespace-nowrap"
            >
              نشان
            </a>
            <span className="text-[var(--sarv-border-strong)]" aria-hidden="true">·</span>
            <a
              href={navLinks.balad}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[var(--sarv-text)] hover:text-[var(--sarv-primary)] hover:underline whitespace-nowrap"
            >
              بلد
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
