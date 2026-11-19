import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ChevronDown,
  Maximize2,
  Minimize2,
  Palette,
  Search,
  X,
} from 'lucide-react';
import {KNTU_CAMPUSES, type CampusId} from './data/kntuCampuses';
import {METRO_LINE_LIST, type MetroLineId} from './data/tehranTransit';
import {
  filterCampuses,
  parseWayfinderParams,
  toPersianDigits,
  type AppView,
  type SarvThemeId,
} from './utils/wayfinder';
import {CampusDetailPanel} from './components/CampusDetailPanel';
import {InterCampusPlanner} from './components/InterCampusPlanner';
import {
  KntuMapView,
  type ActiveMapRoute,
  type LiveRouteSummary,
} from './components/KntuMapView';
import {PosterStudio} from './components/PosterStudio';
import {
  KntuLogo,
  MetroLineShield,
  SarvMark,
  TehranMetroLogo,
} from './components/TransitIcons';

const SARV_THEMES: Array<{id: SarvThemeId; label: string; dark: boolean; swatch: string}> = [
  {id: 'persian-light', label: 'ایرانی روشن', dark: false, swatch: '#0066A4'},
  {id: 'persian-dark', label: 'ایرانی تاریک', dark: true, swatch: '#38BDF8'},
  {id: 'emerald', label: 'زمرد کهنسال', dark: true, swatch: '#10B981'},
  {id: 'tehran', label: 'موچی در ملایر (تهران)', dark: false, swatch: '#C1121F'},
  {id: 'tehran-2', label: 'سیاهکل (تهران ۲)', dark: true, swatch: '#DDA15E'},
  {id: 'nordic', label: 'یخسار نوردیک', dark: false, swatch: '#0284C7'},
  {id: 'matcha', label: 'چای ماچا', dark: false, swatch: '#4D7C0F'},
  {id: 'sunset', label: 'غروب رباط کریم', dark: false, swatch: '#FF5E36'},
  {id: 'cyberpunk', label: 'سایبرپانک نئون', dark: true, swatch: '#00F0FF'},
  {id: 'tokyo-midnight', label: 'کرج نیمه‌شب', dark: true, swatch: '#8B5CF6'},
  {id: 'ocean-abyss', label: 'خلیج فارس', dark: true, swatch: '#06B6D4'},
  {id: 'crimson', label: 'زرشکی و یاقوت', dark: true, swatch: '#E11D48'},
  {id: 'coffee-roast', label: 'اسپرسو و کهربا', dark: true, swatch: '#D97706'},
  {id: 'batman', label: 'شوالیه تاریکی (بتمن)', dark: true, swatch: '#FFE600'},
  {id: 'monochrome', label: 'سیاه و سفید تاریک', dark: true, swatch: '#FFFFFF'},
  {id: 'monochrome-light', label: 'سیاه و سفید روشن', dark: false, swatch: '#111827'},
];

export interface KhajeyabAppProps {
  embedded?: boolean;
  initialView?: AppView;
  defaultCampusId?: CampusId;
  className?: string;
  onExpand?: () => void;
  isExpanded?: boolean;
  hideFooter?: boolean;
  initialTheme?: SarvThemeId;
}

export default function KhajeyabApp({
  embedded = false,
  initialView,
  defaultCampusId,
  className = '',
  onExpand,
  isExpanded = false,
  hideFooter = false,
  initialTheme,
}: KhajeyabAppProps = {}) {
  const initialParams = useMemo(
    () =>
      parseWayfinderParams(
        typeof window !== 'undefined' ? window.location.search : '',
      ),
    [],
  );

  const isEmbedMode = embedded || !!initialParams.embed;
  const [view, setView] = useState<AppView>(initialView ?? initialParams.view ?? 'explore');
  const [theme, setTheme] = useState<SarvThemeId>(
    initialTheme ?? initialParams.theme ?? 'persian-light',
  );

  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme);
    }
  }, [initialTheme]);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>(
    defaultCampusId ?? initialParams.dest ?? 'rezaeinejad',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [metroFilter, setMetroFilter] = useState<MetroLineId | 'all'>('all');

  const [betweenFrom, setBetweenFrom] = useState<CampusId>(
    initialParams.from ?? 'seyyedkhandan',
  );
  const [betweenTo, setBetweenTo] = useState<CampusId>(
    initialParams.to ?? 'vanak',
  );
  const [betweenMode, setBetweenMode] = useState<'DRIVING' | 'WALKING'>('DRIVING');
  const [liveRouteSummary, setLiveRouteSummary] = useState<LiveRouteSummary | null>(
    null,
  );

  const [activeRoute, setActiveRoute] = useState<ActiveMapRoute | null>(null);
  const [posterTarget, setPosterTarget] = useState<CampusId | 'all'>(
    defaultCampusId ?? initialParams.dest ?? 'rezaeinejad',
  );

  // همگام‌سازی تم Sarv UI
  useEffect(() => {
    if (!isEmbedMode) {
      const html = document.documentElement;
      html.setAttribute('data-theme', theme);
      const isDark = theme === 'emerald' || theme === 'persian-dark';
      html.classList.toggle('dark', isDark);
    }
  }, [theme, isEmbedMode]);

  const filteredCampuses = useMemo(
    () => filterCampuses(KNTU_CAMPUSES, searchQuery, metroFilter),
    [searchQuery, metroFilter],
  );

  const selectedCampus = useMemo(
    () =>
      KNTU_CAMPUSES.find((c) => c.id === selectedCampusId) ?? KNTU_CAMPUSES[0],
    [selectedCampusId],
  );

  const handleSelectCampus = useCallback((id: CampusId) => {
    setSelectedCampusId(id);
    setActiveRoute(null);
    if (!isEmbedMode && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('dest', id);
      window.history.replaceState({}, '', url.toString());
    }
  }, [isEmbedMode]);

  const handleSwitchView = (next: AppView) => {
    setView(next);
    if (next === 'explore') {
      setActiveRoute(null);
    }
  };

  const handleOpenPosterFor = (campusId: CampusId) => {
    setPosterTarget(campusId);
    setView('poster');
  };

  const handleOpenBetweenFrom = (campusId: CampusId) => {
    setBetweenFrom(campusId);
    if (betweenTo === campusId) {
      setBetweenTo(campusId === 'vanak' ? 'seyyedkhandan' : 'vanak');
    }
    setView('between');
  };

  const handleSwapBetween = () => {
    setBetweenFrom(betweenTo);
    setBetweenTo(betweenFrom);
  };

  const activeThemeMeta =
    SARV_THEMES.find((t) => t.id === theme) ?? SARV_THEMES[0];

  const isDark = activeThemeMeta.dark;

  return (
    <div
      data-theme={theme}
      className={`flex flex-col bg-[var(--sarv-base)] text-[var(--sarv-text)] transition-colors duration-200 ${isDark ? 'dark ' : ''}${
        isEmbedMode ? 'rounded-2xl sm:rounded-3xl border border-[var(--sarv-border)] shadow-xl overflow-hidden' : 'min-h-screen'
      } ${className}`}
    >
      {/* هدر ۳ ناحیه‌ای هماهنگ با دیزاین‌سیستم سرو */}
      <header className="sticky top-0 z-30 border-b border-[var(--sarv-border)] bg-[var(--sarv-surface)]/95 backdrop-blur">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
          {/* ناحیه ۱: برند یک‌خطی (سروستان + خواجه نصیر) */}
          <button
            type="button"
            onClick={() => handleSwitchView('explore')}
            className="flex items-center gap-2 text-base sm:text-lg font-black tracking-tight text-[var(--sarv-text)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SarvMark className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
            <span>خواجه‌یاب</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              سروستان
            </span>
          </button>

          {/* ناحیه ۲: لینک‌های ناوبری یک‌خطی */}
          <nav
            aria-label="ناوبری اصلی"
            className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-bold min-w-0"
          >
            <button
              type="button"
              onClick={() => handleSwitchView('explore')}
              className={`py-1.5 px-1 sm:px-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'explore'
                  ? 'border-[var(--sarv-primary)] text-[var(--sarv-primary)] font-black'
                  : 'border-transparent text-[var(--sarv-text-muted)] hover:text-[var(--sarv-text)]'
              }`}
            >
              <span className="sm:hidden">پردیس‌ها</span>
              <span className="hidden sm:inline">نقشه پردیس‌ها</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchView('between')}
              className={`py-1.5 px-1 sm:px-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'between'
                  ? 'border-[var(--sarv-primary)] text-[var(--sarv-primary)] font-black'
                  : 'border-transparent text-[var(--sarv-text-muted)] hover:text-[var(--sarv-text)]'
              }`}
            >
              <span className="sm:hidden">بین‌پردیسی</span>
              <span className="hidden sm:inline">مسیر بین‌پردیسی</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchView('poster')}
              className={`py-1.5 px-1 sm:px-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'poster'
                  ? 'border-[var(--sarv-primary)] text-[var(--sarv-primary)] font-black'
                  : 'border-transparent text-[var(--sarv-text-muted)] hover:text-[var(--sarv-text)]'
              }`}
            >
              <span className="sm:hidden">پوستر</span>
              <span className="hidden sm:inline">پوستر و کارت</span>
            </button>
          </nav>

          {/* ناحیه ۳: انتخابگر تم Sarv UI و دکمه تمام‌صفحه */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setThemeMenuOpen((v) => !v)}
                aria-expanded={themeMenuOpen}
                aria-haspopup="menu"
                aria-label="تغییر تم سرو"
                className="sarv-btn-secondary inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-[var(--sarv-primary)]" />
                <span className="hidden sm:inline">{activeThemeMeta.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--sarv-text-subtle)] hidden sm:block" />
              </button>

              {themeMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 mt-2 w-48 max-h-80 overflow-y-auto rounded-xl bg-[var(--sarv-surface)] border border-[var(--sarv-border)] shadow-xl p-1.5 z-40 sarv-custom-scrollbar"
                >
                  {SARV_THEMES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={theme === item.id}
                      onClick={() => {
                        setTheme(item.id);
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        theme === item.id
                          ? 'bg-[var(--sarv-surface-subtle)] text-[var(--sarv-text)]'
                          : 'text-[var(--sarv-text-muted)] hover:bg-[var(--sarv-surface-subtle)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm border border-black/15"
                          style={{backgroundColor: item.swatch}}
                        />
                        <span>{item.label}</span>
                      </span>
                      {theme === item.id && (
                        <span className="text-[var(--sarv-primary)] font-black">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="sarv-btn-secondary p-1.5 sm:p-2 rounded-xl text-xs font-bold cursor-pointer"
                title={isExpanded ? 'خروج از حالت تمام‌صفحه' : 'نمایش تمام‌صفحه'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* محتوای اصلی */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 overflow-x-clip">
        {view === 'poster' ? (
          <PosterStudio initialTarget={posterTarget} defaultTheme={theme} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ستون کناری (جستجو، لیست پردیس‌ها و راهنمای مسیر) */}
            <div className="lg:col-span-5 min-w-0 space-y-4">
              {view === 'explore' ? (
                <>
                  {/* نوار جستجو و فیلتر خطوط رسمی مترو */}
                  <section aria-label="جستجو و انتخاب پردیس" className="sarv-surface p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SarvMark className="w-9 h-9 shrink-0" />
                        <div className="min-w-0">
                          <h1 className="text-sm sm:text-base font-extrabold text-[var(--sarv-text)] truncate">
                            پردیس‌های خواجه نصیر در سروستان
                          </h1>
                          <p className="text-xs text-[var(--sarv-text-subtle)] mt-0.5">
                            اکوسیستم سروستان · {toPersianDigits(KNTU_CAMPUSES.length)} پردیس و مرکز در تهران
                          </p>
                        </div>
                      </div>
                      <TehranMetroLogo className="w-7 h-7 shrink-0 rounded-md shadow-xs" />
                    </div>

                    {/* کارت معرفی و پیوند با سروستان */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 space-y-1.5 text-right">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                        <span className="text-xs font-black text-slate-900 dark:text-emerald-200">
                          یکپارچه با دستیار هوشمند سروستان ۲.۱
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        دسترسی آفلاین به برنامه کلاسی، شماره اتاق و محل تشکیل کلاس‌ها در هر پردیس، تقویم امتحانات بهستان و ویجت‌های زنده هوم‌اسکرین اندروید بدون نیاز به فیلترشکن.
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <a
                          href="./?web=1"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] shadow-xs transition-colors"
                        >
                          ورود به نسخه وب و آیفون
                        </a>
                        <a
                          href="#download"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 font-bold text-[10.5px] transition-colors"
                        >
                          دانلود مستقیم APK اندروید
                        </a>
                      </div>
                    </div>

                    {/* ورودی جستجو */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-[var(--sarv-text-subtle)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجوی دانشکده، پردیس یا ایستگاه (مثلاً هوافضا، برق)..."
                        aria-label="جستجوی دانشکده یا پردیس"
                        className="w-full rounded-[var(--sarv-radius-input)] bg-[var(--sarv-surface-subtle)] border border-[var(--sarv-border)] pr-9 pl-9 py-2 text-xs sm:text-sm text-[var(--sarv-text)] placeholder:text-[var(--sarv-text-subtle)] focus:outline-none focus:border-[var(--sarv-primary)]"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          aria-label="پاک کردن جستجو"
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--sarv-text-subtle)] hover:text-[var(--sarv-text)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* فیلتر خطوط رسمی مترو تهران مرتبط با پردیس‌ها */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                      <button
                        type="button"
                        onClick={() => setMetroFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          metroFilter === 'all'
                            ? 'bg-[var(--sarv-primary)] text-[var(--sarv-primary-content)] border-transparent'
                            : 'bg-[var(--sarv-surface-subtle)] text-[var(--sarv-text-muted)] border-[var(--sarv-border)]'
                        }`}
                      >
                        همه خطوط
                      </button>
                      {METRO_LINE_LIST.filter((l) => [1, 2, 3, 7].includes(l.id)).map((line) => {
                        const active = metroFilter === line.id;
                        return (
                          <button
                            key={line.id}
                            type="button"
                            onClick={() =>
                              setMetroFilter((prev) => (prev === line.id ? 'all' : line.id))
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              active
                                ? 'border-transparent shadow-sm'
                                : 'bg-[var(--sarv-surface-subtle)] text-[var(--sarv-text-muted)] border-[var(--sarv-border)] hover:text-[var(--sarv-text)]'
                            }`}
                            style={
                              active
                                ? {backgroundColor: line.color, color: line.textColor}
                                : undefined
                            }
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-sm shrink-0"
                              style={{
                                backgroundColor: active ? 'currentColor' : line.color,
                              }}
                              aria-hidden="true"
                            />
                            <span>خط {line.code}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* فهرست پردیس‌ها */}
                    {filteredCampuses.length === 0 ? (
                      <div className="rounded-xl bg-[var(--sarv-surface-subtle)] p-5 text-center space-y-2">
                        <p className="text-xs font-semibold text-[var(--sarv-text-muted)]">
                          هیچ پردیس یا دانشکده‌ای با این عبارت پیدا نشد.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setMetroFilter('all');
                          }}
                          className="sarv-btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer"
                        >
                          نمایش همه پردیس‌ها
                        </button>
                      </div>
                    ) : (
                      <div
                        role="listbox"
                        aria-label="فهرست پردیس‌های خواجه نصیر"
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto sarv-scroll p-0.5"
                      >
                        {filteredCampuses.map((campus) => {
                          const isSelected = campus.id === selectedCampusId;
                          const primaryMetro = campus.metroOptions[0];
                          return (
                            <button
                              key={campus.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleSelectCampus(campus.id)}
                              className={`w-full min-w-0 text-right p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                    ? 'bg-[var(--sarv-surface-subtle)] border-[var(--sarv-primary)] shadow-xs'
                                  : 'bg-[var(--sarv-surface)] border-[var(--sarv-border)] hover:border-[var(--sarv-border-strong)]'
                              }`}
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="text-xs sm:text-[13px] font-extrabold text-[var(--sarv-text)] truncate">
                                  {campus.name}
                                </div>
                                <p className="text-[11px] text-[var(--sarv-text-muted)] truncate">
                                  {campus.faculties.join(' · ')}
                                </p>
                              </div>

                              {primaryMetro && (
                                <div className="shrink-0">
                                  <MetroLineShield lineId={primaryMetro.lineId} compact />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* پنل جزئیات پردیس انتخاب‌شده */}
                  <CampusDetailPanel
                    campus={selectedCampus}
                    activeRoute={activeRoute}
                    onShowRouteOnMap={setActiveRoute}
                    onOpenPoster={handleOpenPosterFor}
                    onOpenBetweenFrom={handleOpenBetweenFrom}
                    onJumpToCampus={handleSelectCampus}
                  />
                </>
              ) : (
                <InterCampusPlanner
                  fromId={betweenFrom}
                  toId={betweenTo}
                  travelMode={betweenMode}
                  liveSummary={liveRouteSummary}
                  onChangeFrom={setBetweenFrom}
                  onChangeTo={setBetweenTo}
                  onSwap={handleSwapBetween}
                  onChangeTravelMode={setBetweenMode}
                  onSyncMapRoute={setActiveRoute}
                />
              )}
            </div>

            {/* ستون نقشه تعاملی OpenStreetMap + فونت آراد */}
            <div className={`lg:col-span-7 ${isEmbedMode ? 'h-[480px] sm:h-[580px] lg:h-[620px]' : 'lg:sticky lg:top-20 h-[440px] sm:h-[540px] lg:h-[calc(100vh-7.5rem)]'} min-h-[420px]`}>
              <KntuMapView
                selectedCampusId={selectedCampusId}
                onSelectCampus={(id) => {
                  handleSelectCampus(id);
                  if (view === 'between') {
                    setBetweenTo(id);
                  }
                }}
                activeRoute={activeRoute}
                onRouteComputed={setLiveRouteSummary}
                theme={theme}
              />
            </div>
          </div>
        )}
      </main>

      {/* فوتر خلوت و یکپارچه با سروستان */}
      {!hideFooter && !initialParams.embed && (
        <footer className="border-t border-[var(--sarv-border)] bg-[var(--sarv-surface)] mt-8">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--sarv-text-subtle)]">
            <div className="flex items-center gap-2">
              <SarvMark className="w-4 h-4 shrink-0" />
              <KntuLogo className="w-5 h-5 shrink-0" />
              <span>
                خواجه‌یاب — راهنمای پردیس‌های دانشگاه صنعتی خواجه نصیرالدین طوسی · زیرمجموعه اکوسیستم سروستان
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/mjb4khshi/sarvestan"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--sarv-text-muted)] hover:text-[var(--sarv-primary)] transition-colors"
              >
                مخزن سروستان در GitHub
              </a>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  setPosterTarget('all');
                  setView('poster');
                }}
                className="font-semibold text-[var(--sarv-text-muted)] hover:text-[var(--sarv-primary)] transition-colors cursor-pointer"
              >
                پوستر جامع پردیس‌ها
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
