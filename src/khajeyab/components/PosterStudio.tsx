import {useEffect, useMemo, useRef, useState} from 'react';
import QRCode from 'qrcode';
import {Check, Download, Globe, Loader2, Printer, Sparkles} from 'lucide-react';
import {KNTU_CAMPUSES, type CampusId, type KntuCampus} from '../data/kntuCampuses';
import {TEHRAN_BRT_LINES, TEHRAN_METRO_LINES} from '../data/tehranTransit';
import {renderCampusKorokiToCanvas} from '../utils/campusKoroki';
import {
  POSTER_DIMENSIONS,
  POSTER_PALETTES,
  renderPosterToPngDataUrl,
  type PosterFormat,
} from '../utils/posterCanvas';
import {buildDeepLink, toPersianDigits, type SarvThemeId} from '../utils/wayfinder';
import {
  BrtLineShield,
  KntuLogo,
  MetroLineShield,
  SarvMark,
  TehranMetroLogo,
} from './TransitIcons';

interface PosterStudioProps {
  initialTarget: CampusId | 'all';
  defaultTheme: SarvThemeId;
}

const POSTER_THEMES: Array<{id: SarvThemeId; label: string; dot: string}> = [
  {id: 'persian-light', label: 'ایرانی روشن', dot: '#0066A4'},
  {id: 'persian-dark', label: 'ایرانی تاریک', dot: '#38BDF8'},
  {id: 'emerald', label: 'زمرد کهنسال', dot: '#10B981'},
  {id: 'tehran', label: 'موچی در ملایر (تهران)', dot: '#C1121F'},
  {id: 'tehran-2', label: 'سیاهکل (تهران ۲)', dot: '#DDA15E'},
  {id: 'nordic', label: 'یخسار نوردیک', dot: '#0284C7'},
  {id: 'matcha', label: 'چای ماچا', dot: '#4D7C0F'},
  {id: 'sunset', label: 'غروب رباط کریم', dot: '#FF5E36'},
  {id: 'cyberpunk', label: 'سایبرپانک نئون', dot: '#00F0FF'},
  {id: 'tokyo-midnight', label: 'کرج نیمه‌شب', dot: '#8B5CF6'},
  {id: 'ocean-abyss', label: 'خلیج فارس', dot: '#06B6D4'},
  {id: 'crimson', label: 'زرشکی و یاقوت', dot: '#E11D48'},
  {id: 'coffee-roast', label: 'اسپرسو و کهربا', dot: '#D97706'},
  {id: 'batman', label: 'شوالیه تاریکی (بتمن)', dot: '#FFE600'},
  {id: 'monochrome', label: 'سیاه و سفید تاریک', dot: '#FFFFFF'},
  {id: 'monochrome-light', label: 'سیاه و سفید روشن', dot: '#111827'},
];

function CampusKorokiPreview({
  campus,
  theme,
  width,
  height,
  borderColor,
}: {
  campus: KntuCampus;
  theme: SarvThemeId;
  width: number;
  height: number;
  borderColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderCampusKorokiToCanvas(canvas, campus, theme, width, height, dpr).catch(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [campus, theme, width, height]);

  return (
    <div
      className="w-full overflow-hidden rounded-xl border"
      style={{borderColor}}
    >
      <canvas
        ref={canvasRef}
        aria-label={`کروکی دسترسی محلی ${campus.name}`}
        className="block w-full h-auto"
        style={{aspectRatio: `${width} / ${height}`}}
      />
    </div>
  );
}

export function PosterStudio({initialTarget, defaultTheme}: PosterStudioProps) {
  const [target, setTarget] = useState<CampusId | 'all'>(initialTarget);
  const [format, setFormat] = useState<PosterFormat>('a4');
  const [theme, setTheme] = useState<SarvThemeId>(defaultTheme);
  const baseUrl = 'https://mjb4khshi.github.io/sarvestan';
    const [qrUrl, setQrUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [downloadedNotice, setDownloadedNotice] = useState(false);

  useEffect(() => {
    setTarget(initialTarget);
  }, [initialTarget]);

  // اعمال فوری و زنده تم انتخابی بر روی پوستر
  useEffect(() => {
    if (defaultTheme) {
      setTheme(defaultTheme);
    }
  }, [defaultTheme]);

  const deepLink = useMemo(() => buildDeepLink(baseUrl, target), [baseUrl, target]);
  const palette = POSTER_PALETTES[theme] ?? POSTER_PALETTES['persian-light'];
  const selectedCampus = useMemo(
    () =>
      target === 'all'
        ? null
        : KNTU_CAMPUSES.find((c) => c.id === target) ?? KNTU_CAMPUSES[0],
    [target],
  );

  // تولید زنده QR Code واقعی برای پیش‌نمایش
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(deepLink, {
      width: 240,
      margin: 1,
      color: {dark: '#0F172A', light: '#FFFFFF'},
    })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch(() => {
        if (active) setQrUrl('');
      });
    return () => {
      active = false;
    };
  }, [deepLink]);

  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      const dataUrl = await renderPosterToPngDataUrl({
        target,
        format,
        theme,
        baseUrl,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `khajeyab-${target}-${format}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDownloadedNotice(true);
      setTimeout(() => setDownloadedNotice(false), 2500);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const aspectClass =
    format === 'a4'
      ? 'aspect-[1/1.414] max-w-[540px]'
      : format === 'story'
        ? 'aspect-[9/16] max-w-[420px]'
        : 'aspect-square max-w-[540px]';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ستون تنظیمات پوستر */}
      <aside className="lg:col-span-5 sarv-surface p-5 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-[var(--sarv-text)]">
            استودیوی ساخت پوستر و کارت راهنما
          </h2>
          <p className="text-xs text-[var(--sarv-text-muted)] leading-5">
            بدون نیاز به طراحی جداگانه؛ پوستر چاپی همراه با کروکی پردیس، استوری کانال ورودی‌ها یا کارت مربع را با QR Code اختصاصی دانلود کن.
          </p>
        </div>

        {/* انتخاب محتوای پوستر */}
        <div className="space-y-1.5">
          <label
            htmlFor="poster-target-select"
            className="block text-xs font-bold text-[var(--sarv-text-muted)]"
          >
            موضوع پوستر
          </label>
          <select
            id="poster-target-select"
            value={target}
            onChange={(e) => setTarget(e.target.value as CampusId | 'all')}
            className="w-full rounded-[var(--sarv-radius-input)] bg-[var(--sarv-surface-subtle)] border border-[var(--sarv-border)] px-3 py-2.5 text-sm font-semibold text-[var(--sarv-text)] focus:outline-none focus:border-[var(--sarv-primary)]"
          >
            <option value="all">راهنمای جامع همه پردیس‌های خواجه نصیر</option>
            {KNTU_CAMPUSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* انتخاب فرمت خروجی */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-[var(--sarv-text-muted)]">
            قالب و ابعاد خروجی
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['a4', 'story', 'square'] as PosterFormat[]).map((fmt) => {
              const meta = POSTER_DIMENSIONS[fmt];
              const active = format === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`p-3 rounded-xl border text-right transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--sarv-primary)] text-[var(--sarv-primary-content)] border-transparent'
                      : 'bg-[var(--sarv-surface-subtle)] text-[var(--sarv-text)] border-[var(--sarv-border)] hover:border-[var(--sarv-primary)]'
                  }`}
                >
                  <div className="text-xs font-extrabold">{meta.label}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      active ? 'opacity-85' : 'text-[var(--sarv-text-subtle)]'
                    }`}
                  >
                    {meta.ratioLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* انتخاب تم Sarv UI برای پوستر */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-[var(--sarv-text-muted)]">
            تم رنگی سرو (Sarv UI)
          </span>
          <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-1 rounded-xl border border-[var(--sarv-border)] bg-[var(--sarv-surface-subtle)]/40 sarv-custom-scrollbar">
            {POSTER_THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'border-[var(--sarv-primary)] bg-[var(--sarv-surface)] text-[var(--sarv-text)] shadow-sm'
                      : 'border-transparent text-[var(--sarv-text-muted)] hover:bg-[var(--sarv-surface)] hover:text-[var(--sarv-text)]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/20 shadow-xs"
                    style={{backgroundColor: t.dot}}
                    aria-hidden="true"
                  />
                  <span className="truncate text-[11px]">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        



        {/* دکمه‌های دانلود و پرینت */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloading}
            className="sarv-btn-primary flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-extrabold whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadedNotice ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloadedNotice ? 'فایل PNG ذخیره شد' : 'دانلود PNG باکیفیت'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="sarv-btn-secondary flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[var(--sarv-primary)]" />
            <span>چاپ / ذخیره PDF</span>
          </button>
        </div>
      </aside>

      {/* ستون پیش‌نمایش زنده پوستر */}
      <div className="lg:col-span-7 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--sarv-text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--sarv-primary)]" />
            <span>پیش‌نمایش زنده خروجی ({POSTER_DIMENSIONS[format].label})</span>
          </div>
          <span className="text-xs text-[var(--sarv-text-subtle)] tabular-nums font-mono" dir="ltr">
            {POSTER_DIMENSIONS[format].width} × {POSTER_DIMENSIONS[format].height} px
          </span>
        </div>

        <div
          id="khajeyab-print-poster"
          data-testid="poster-preview"
          className={`w-full ${aspectClass} rounded-2xl overflow-hidden border shadow-lg flex flex-col justify-between transition-colors`}
          style={{
            backgroundColor: palette.bg,
            borderColor: palette.border,
            color: palette.text,
          }}
        >
          <div className={`flex-1 ${!selectedCampus ? 'p-4 sm:p-5 gap-2' : 'p-5 sm:p-6 gap-3'} flex flex-col justify-between overflow-hidden`}>
            {/* هدر رسمی با لوگوی واقعی سروستان و لوگوی دانشگاه خواجه نصیر */}
            <div className={!selectedCampus ? 'space-y-2' : 'space-y-3'}>
              <div
                className={`flex items-center justify-between gap-2 ${!selectedCampus ? 'pb-2' : 'pb-3'} border-b`}
                style={{borderColor: palette.border}}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <SarvMark className="w-6 h-6 shrink-0" />
                  <span className="text-xs sm:text-sm font-black truncate" style={{color: palette.primary}}>
                    خواجه‌یاب | سروستان
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] sm:text-[11px] font-semibold" style={{color: palette.muted}}>
                    دانشگاه صنعتی خواجه نصیر
                  </span>
                  <KntuLogo className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>

              {/* بدنه: حالت کل پردیس‌ها یا تک‌پردیس */}
              {!selectedCampus ? (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-black leading-tight">
                      راهنمای جامع پردیس‌های خواجه نصیر
                    </h3>
                    <p className="text-[10.5px] mt-0.5" style={{color: palette.muted}}>
                      دسترسی سریع با خطوط رسمی مترو و BRT تهران
                    </p>
                  </div>

                  <div
                    className={`grid ${
                      format === 'square' ? 'grid-cols-2 gap-1.5' : 'grid-cols-1 gap-1.5'
                    }`}
                  >
                    {KNTU_CAMPUSES.map((c) => {
                      const m = c.metroOptions[0];
                      const b = c.brtOptions[0];
                      return (
                        <div
                          key={c.id}
                          className="rounded-lg px-2.5 py-1.5 border space-y-0.5"
                          style={{
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                          }}
                        >
                          <div className="text-[11px] font-extrabold truncate">{c.name}</div>
                          <div
                            className="text-[9.5px] truncate"
                            style={{color: palette.muted}}
                          >
                            {c.faculties.slice(0, 3).join(' · ')}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            {m && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold">
                                <TehranMetroLogo className="w-3.5 h-3.5 rounded-[2px] shrink-0" />
                                <MetroLineShield lineId={m.lineId} compact />
                                <span>مترو {m.stationName}</span>
                              </span>
                            )}
                            {b && format !== 'square' && (
                              <span className="text-[9.5px] font-medium truncate" style={{color: palette.muted}}>
                                BRT {TEHRAN_BRT_LINES[b.lineId].code}: {b.stationName}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10.5px] font-semibold" style={{color: palette.muted}}>
                      {selectedCampus.neighborhood}
                    </p>
                    <h3 className="text-lg sm:text-xl font-black leading-tight mt-0.5">
                      {selectedCampus.name}
                    </h3>
                    <p className="text-[11px] font-bold mt-0.5" style={{color: palette.primary}}>
                      {selectedCampus.faculties.join(' · ')}
                    </p>
                  </div>

                  {selectedCampus.importantNote && (
                    <div
                      className="rounded-xl px-3 py-1.5 text-[9.5px] leading-4 font-semibold"
                      style={{backgroundColor: palette.warnBg, color: palette.warnText}}
                    >
                      {selectedCampus.importantNote}
                    </div>
                  )}

                  {format === 'square' ? (
                    /* چیدمان دوتایی برای کارت مربع ۱:۱ */
                    <div className="grid grid-cols-12 gap-2.5 items-stretch">
                      <div className="col-span-7 space-y-2 flex flex-col justify-between">
                        <div
                          className="rounded-xl p-2.5 border space-y-1.5"
                          style={{
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                          }}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold">
                            <TehranMetroLogo className="w-4 h-4 rounded-[3px] shrink-0" />
                            <span>دسترسی با متروی تهران</span>
                          </div>
                          <div className="space-y-1.5">
                            {selectedCampus.metroOptions.slice(0, 2).map((opt) => (
                              <div key={opt.id} className="flex items-start gap-1.5">
                                <MetroLineShield lineId={opt.lineId} compact />
                                <div className="min-w-0">
                                  <div className="text-[10.5px] font-bold truncate">
                                    ایستگاه {opt.stationName}
                                  </div>
                                  <div
                                    className="text-[9.5px] leading-3.5 truncate"
                                    style={{color: palette.muted}}
                                  >
                                    {opt.connectionLabel} · {toPersianDigits(opt.durationMinutes)} دقیقه
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div
                          className="rounded-xl p-2.5 border space-y-1"
                          style={{
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                          }}
                        >
                          {selectedCampus.brtOptions[0] && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <BrtLineShield lineId={selectedCampus.brtOptions[0].lineId} />
                              <span className="text-[10px] font-bold">
                                {selectedCampus.brtOptions[0].stationName}
                              </span>
                            </div>
                          )}
                          <p className="text-[9.5px] leading-3.5 line-clamp-2" style={{color: palette.muted}}>
                            نشانی: {selectedCampus.address}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-5 flex items-stretch">
                        <CampusKorokiPreview
                          campus={selectedCampus}
                          theme={theme}
                          width={340}
                          height={370}
                          borderColor={palette.border}
                        />
                      </div>
                    </div>
                  ) : (
                    /* چیدمان عمودی A4 و استوری شامل کروکی عریض + مترو + BRT */
                    <>
                      <CampusKorokiPreview
                        campus={selectedCampus}
                        theme={theme}
                        width={600}
                        height={format === 'story' ? 260 : 210}
                        borderColor={palette.border}
                      />

                      <div
                        className="rounded-xl p-3 border space-y-2"
                        style={{
                          backgroundColor: palette.surface,
                          borderColor: palette.border,
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-extrabold">
                          <TehranMetroLogo className="w-4 h-4 rounded-[3px] shrink-0" />
                          <span>دسترسی با متروی تهران</span>
                        </div>
                        <div className="space-y-1.5">
                          {selectedCampus.metroOptions.slice(0, 3).map((opt) => (
                            <div key={opt.id} className="flex items-start gap-2">
                              <MetroLineShield lineId={opt.lineId} compact />
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold">
                                  ایستگاه {opt.stationName}{' '}
                                  <span className="font-normal opacity-75">
                                    ({TEHRAN_METRO_LINES[opt.lineId].name})
                                  </span>
                                </div>
                                <div
                                  className="text-[9.5px] leading-4"
                                  style={{color: palette.muted}}
                                >
                                  {opt.connectionLabel} · {toPersianDigits(opt.durationMinutes)} دقیقه
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        className="rounded-xl p-2.5 border space-y-1"
                        style={{
                          backgroundColor: palette.surface,
                          borderColor: palette.border,
                        }}
                      >
                        {selectedCampus.brtOptions[0] && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <BrtLineShield lineId={selectedCampus.brtOptions[0].lineId} />
                            <span className="text-[11px] font-bold">
                              ایستگاه {selectedCampus.brtOptions[0].stationName} (
                              {toPersianDigits(selectedCampus.brtOptions[0].durationMinutes)} دقیقه)
                            </span>
                          </div>
                        )}
                        <p className="text-[9.5px] leading-4" style={{color: palette.muted}}>
                          نشانی: {selectedCampus.address} — {selectedCampus.mainGate}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* فوتر QR Code و معرفی جامع سروستان */}
            <div
              className="rounded-xl p-2.5 sm:p-3 border flex items-center justify-between gap-3 shrink-0"
              style={{
                backgroundColor: palette.surfaceAlt,
                borderColor: palette.border,
              }}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[9.5px] font-black px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: palette.primary,
                      color: palette.primaryText,
                    }}
                  >
                    🌿 اکوسیستم سروستان
                  </span>
                  <span className="text-[11px] font-black truncate">
                    دستیار هوشمند آموزش و بهستان بدون فیلترشکن
                  </span>
                </div>
                <p className="text-[9.5px] leading-4" style={{color: palette.muted}}>
                  برنامه کلاسی آفلاین · شماره کلاس‌ها · کارنامه و تقویم امتحانات · نقشه و مسیریاب پردیس‌ها
                </p>
                <p
                  className="text-[9.5px] font-bold truncate dir-ltr text-right"
                  style={{color: palette.primary}}
                >
                  🌐 {deepLink.replace(/^https?:\/\//, '')}
                </p>
              </div>
              <div className="bg-white p-1.5 rounded-lg shrink-0 shadow-sm text-center">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="QR Code لینک مستقیم خواجه‌یاب"
                    className="w-14 h-14 sm:w-16 sm:h-16 block"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded" />
                )}
                <span className="text-[7.5px] font-extrabold text-slate-800 block mt-0.5">اسکن با دوربین</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
