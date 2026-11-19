import {useEffect, useMemo} from 'react';
import {ArrowLeftRight, Car, Clock, Footprints, Lightbulb, MapPin} from 'lucide-react';
import {
  CAMPUS_MAP,
  KNTU_CAMPUSES,
  type CampusId,
} from '../data/kntuCampuses';
import {
  findInterCampusRoute,
  formatDistanceKm,
  formatDurationMin,
  haversineKm,
} from '../utils/wayfinder';
import type {ActiveMapRoute, LiveRouteSummary} from './KntuMapView';
import {BrtLineShield, MetroLineShield} from './TransitIcons';

interface InterCampusPlannerProps {
  fromId: CampusId;
  toId: CampusId;
  travelMode: 'DRIVING' | 'WALKING';
  liveSummary: LiveRouteSummary | null;
  onChangeFrom: (id: CampusId) => void;
  onChangeTo: (id: CampusId) => void;
  onSwap: () => void;
  onChangeTravelMode: (mode: 'DRIVING' | 'WALKING') => void;
  onSyncMapRoute: (route: ActiveMapRoute | null) => void;
}

const POPULAR_PAIRS: Array<{from: CampusId; to: CampusId; label: string}> = [
  {from: 'seyyedkhandan', to: 'vanak', label: 'سیدخندان ← ونک'},
  {from: 'seyyedkhandan', to: 'rezaeinejad', label: 'سیدخندان ← رضایی‌نژاد'},
  {from: 'science', to: 'rezaeinejad', label: 'پردیس علوم ← رضایی‌نژاد'},
  {from: 'vanak', to: 'mirdamad', label: 'ونک ← میرداماد'},
];

export function InterCampusPlanner({
  fromId,
  toId,
  travelMode,
  liveSummary,
  onChangeFrom,
  onChangeTo,
  onSwap,
  onChangeTravelMode,
  onSyncMapRoute,
}: InterCampusPlannerProps) {
  const fromCampus = CAMPUS_MAP[fromId];
  const toCampus = CAMPUS_MAP[toId];
  const routeGuide = useMemo(() => findInterCampusRoute(fromId, toId), [fromId, toId]);

  const directKm = useMemo(
    () => haversineKm(fromCampus.coords, toCampus.coords),
    [fromCampus, toCampus],
  );

  // همگام‌سازی خودکار مسیر روی نقشه با OSRM
  useEffect(() => {
    if (fromId === toId) {
      onSyncMapRoute(null);
      return;
    }
    onSyncMapRoute({
      origin: fromCampus.coords,
      destination: toCampus.coords,
      originLabel: fromCampus.shortName,
      destinationLabel: toCampus.shortName,
      travelMode,
      accentColor: '#0066A4',
    });
  }, [fromId, toId, fromCampus, toCampus, travelMode, onSyncMapRoute]);

  return (
    <section aria-label="مسیریاب بین‌پردیسی خواجه نصیر" className="sarv-surface p-5 space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-extrabold text-[var(--sarv-text)]">
          مسیریابی بین دو پردیس خواجه نصیر
        </h2>
        <p className="text-xs text-[var(--sarv-text-muted)] leading-5">
          برای روزهایی که دو کلاس پشت‌سرهم در دو پردیس مختلف دارید؛ مسیر پیشنهادی حمل‌ونقل عمومی + مسیر زنده نقشه.
        </p>
      </div>

      {/* انتخاب مبدأ و مقصد */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-2.5">
        <div className="space-y-1.5">
          <label
            htmlFor="inter-from-select"
            className="block text-xs font-bold text-[var(--sarv-text-muted)]"
          >
            پردیس مبدأ
          </label>
          <select
            id="inter-from-select"
            value={fromId}
            onChange={(e) => onChangeFrom(e.target.value as CampusId)}
            className="w-full rounded-[var(--sarv-radius-input)] bg-[var(--sarv-surface-subtle)] border border-[var(--sarv-border)] px-3 py-2.5 text-sm font-semibold text-[var(--sarv-text)] focus:outline-none focus:border-[var(--sarv-primary)]"
          >
            {KNTU_CAMPUSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onSwap}
          aria-label="جابه‌جایی مبدأ و مقصد"
          className="sarv-btn-secondary h-10 w-full sm:w-10 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeftRight className="w-4 h-4 text-[var(--sarv-primary)]" />
        </button>

        <div className="space-y-1.5">
          <label
            htmlFor="inter-to-select"
            className="block text-xs font-bold text-[var(--sarv-text-muted)]"
          >
            پردیس مقصد
          </label>
          <select
            id="inter-to-select"
            value={toId}
            onChange={(e) => onChangeTo(e.target.value as CampusId)}
            className="w-full rounded-[var(--sarv-radius-input)] bg-[var(--sarv-surface-subtle)] border border-[var(--sarv-border)] px-3 py-2.5 text-sm font-semibold text-[var(--sarv-text)] focus:outline-none focus:border-[var(--sarv-primary)]"
          >
            {KNTU_CAMPUSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* مسیرهای پرتکرار دانشجویی */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-[var(--sarv-text-subtle)] ml-1">مسیرهای پرتکرار:</span>
        {POPULAR_PAIRS.map((pair) => {
          const isActive = pair.from === fromId && pair.to === toId;
          return (
            <button
              key={pair.label}
              type="button"
              onClick={() => {
                onChangeFrom(pair.from);
                onChangeTo(pair.to);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[var(--sarv-primary)] text-[var(--sarv-primary-content)] border-transparent'
                  : 'bg-[var(--sarv-surface-subtle)] text-[var(--sarv-text-muted)] border-[var(--sarv-border)] hover:text-[var(--sarv-text)]'
              }`}
            >
              {pair.label}
            </button>
          );
        })}
      </div>

      {/* انتخاب حالت محاسبه مسیر زنده نقشه */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--sarv-border)]">
        <span className="text-xs font-semibold text-[var(--sarv-text-muted)]">
          رسم مسیر روی نقشه:
        </span>
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--sarv-surface-subtle)] border border-[var(--sarv-border)]">
          <button
            type="button"
            onClick={() => onChangeTravelMode('DRIVING')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              travelMode === 'DRIVING'
                ? 'bg-[var(--sarv-surface)] text-[var(--sarv-text)] shadow-sm'
                : 'text-[var(--sarv-text-muted)]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>خودرو / تاکسی</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeTravelMode('WALKING')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              travelMode === 'WALKING'
                ? 'bg-[var(--sarv-surface)] text-[var(--sarv-text)] shadow-sm'
                : 'text-[var(--sarv-text-muted)]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>پیاده‌روی</span>
          </button>
        </div>
      </div>

      {/* نمایش نتیجه مسیر */}
      {!routeGuide ? (
        <div className="rounded-xl bg-[var(--sarv-surface-subtle)] p-4 text-xs text-[var(--sarv-text-muted)] text-center">
          مبدأ و مقصد یکسان انتخاب شده‌اند؛ لطفاً دو پردیس متفاوت انتخاب کنید.
        </div>
      ) : (
        <div className="space-y-4">
          {/* خلاصه زمان و فاصله */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--sarv-surface-subtle)] border border-[var(--sarv-border)] p-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--sarv-text-subtle)]">
                <Clock className="w-3.5 h-3.5 text-[var(--sarv-primary)]" />
                <span>زمان تقریبی حمل‌ونقل عمومی</span>
              </div>
              <p className="mt-1 text-base font-extrabold text-[var(--sarv-text)] tabular-nums">
                {formatDurationMin(routeGuide.estimatedMinutes)}
              </p>
            </div>

            <div className="rounded-xl bg-[var(--sarv-surface-subtle)] border border-[var(--sarv-border)] p-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--sarv-text-subtle)]">
                <MapPin className="w-3.5 h-3.5 text-[var(--sarv-emerald)]" />
                <span>{liveSummary ? 'مسافت مسیر زنده نقشه' : 'فاصله هوایی دو پردیس'}</span>
              </div>
              <p className="mt-1 text-base font-extrabold text-[var(--sarv-text)] tabular-nums">
                {liveSummary
                  ? `${formatDistanceKm(liveSummary.distanceMeters)} · ${formatDurationMin(
                      Math.max(1, Math.round(liveSummary.durationMillis / 60000)),
                    )}`
                  : formatDistanceKm(directKm * 1000)}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-[var(--sarv-text)]">
                {routeGuide.headline}
              </h3>
              {routeGuide.metroLines?.map((lineId) => (
                <MetroLineShield key={lineId} lineId={lineId} compact />
              ))}
              {routeGuide.brtLines?.map((brtId) => (
                <BrtLineShield key={brtId} lineId={brtId} />
              ))}
            </div>

            <ol className="space-y-2 pr-4 list-decimal text-xs text-[var(--sarv-text-muted)] leading-6">
              {routeGuide.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl bg-[var(--sarv-surface-subtle)] border border-[var(--sarv-border)] p-3.5 flex items-start gap-2.5 text-xs text-[var(--sarv-text-muted)] leading-6">
            <Lightbulb className="w-4 h-4 shrink-0 text-[var(--sarv-secondary)] mt-0.5" />
            <p>
              <strong className="text-[var(--sarv-text)]">نکته دانشجویی:</strong>{' '}
              {routeGuide.studentTip}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
