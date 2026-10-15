import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Palette,
  ChevronLeft,
  Check,
  X,
  Megaphone,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSarvestanData } from '../hooks/useSarvestanData';
import { toFaDigits } from '../utils/faDigits';
import { getLocalNotes, clearLocalNotes } from '../services/behestan/store';
import { useAppIcon } from '../services/appIcon';
import { enableBatMode, useBatMode } from '../services/batMode';
import { getSelectedUniversity, getUniversityName } from '../services/behestan/session';
import { isBehestanOverlay, closeBehestanOverlay } from '../services/extensionBridge';

export default function TopBar({ title, onBack }) {
  const { currentTheme, setTheme, themes, activeThemeMeta } = useTheme();
  const { workflows, live, session } = useSarvestanData();
  const { currentIcon } = useAppIcon();
  const { isBatMode } = useBatMode();
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [notifySheetOpen, setNotifySheetOpen] = useState(false);
  const [batmanHoldProgress, setBatmanHoldProgress] = useState(0);
  const batmanTimerRef = useRef(null);
  const batmanIntervalRef = useRef(null);
  const batmanTriggeredRef = useRef(false);

  const startBatmanHold = (e) => {
    batmanTriggeredRef.current = false;
    const startTime = Date.now();
    const duration = 5000;

    clearInterval(batmanIntervalRef.current);
    clearTimeout(batmanTimerRef.current);

    batmanIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setBatmanHoldProgress(pct);
    }, 50);

    batmanTimerRef.current = setTimeout(async () => {
      batmanTriggeredRef.current = true;
      clearInterval(batmanIntervalRef.current);
      setBatmanHoldProgress(0);

      // فعال‌سازی حالت بتمن (آیکون و بک‌گراند) بدون تغییر تم جاری
      await enableBatMode();

      // ارسال رویداد رژه خفاش‌ها
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sarvestan-bat-celebrate', { detail: { celebrate: true } }));
      }

      // بستن شیت انتخاب تم
      setThemeSheetOpen(false);
    }, duration);
  };

  const cancelBatmanHold = () => {
    clearTimeout(batmanTimerRef.current);
    clearInterval(batmanIntervalRef.current);
    setBatmanHoldProgress(0);
  };

  const localNotes = getLocalNotes();
  const allNotifications = [
    ...localNotes.map((n) => ({
      id: n.id,
      title: n.title || 'گزارش همگام‌سازی',
      body: n.body || '',
      color: n.color || 'info',
      isSync: true,
      time: n.at
        ? new Date(n.at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        : '',
    })),
    ...(workflows || []).map((w, i) => ({
      id: w.id || `w${i}`,
      title: w.title || 'درخواست آموزشی',
      body: w.body || w.status || '',
      color: i % 2 === 0 ? 'info' : 'warn',
      isSync: false,
    })),
  ];
  const unread = Math.min(9, allNotifications.length);

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full backdrop-blur-md bg-base/92 border-b border-base-500/40 transition-colors will-change-transform"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          transform: 'translateZ(0)',
        }}
      >
        <div className="mx-auto max-w-[430px] h-14 flex items-center justify-between gap-2 px-3">
          {/* سمت راست: هویت ثابت سروستان و دکمه بازگشت بدون پرش هدر */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-8 h-8 rounded-xl grid place-items-center text-neutral hover:text-base-content bg-base-500/20 hover:bg-base-500/40 active:scale-95 transition-all outline-none"
                  aria-label="بازگشت به میز کار"
                >
                  <ChevronLeft className="w-4.5 h-4.5 rotate-180" />
                </button>
              ) : isBatMode ? (
                <div className="w-8 h-7 flex items-center justify-center">
                  <svg
                    viewBox="0 0 122.13 69.89"
                    className="w-7.5 h-auto drop-shadow-sm transition-transform hover:scale-110 active:scale-95"
                    aria-label="شوالیه تاریکی"
                    title="حالت بتمن فعال است"
                  >
                    <path
                      fill="#f7dd30"
                      d="M121.06,35c0,18.71-26.86,33.88-60,33.88S1.06,53.66,1.06,35s26.87-33.89,60-33.89,60,15.17,60,33.89Z"
                    />
                    <path
                      fill="#000000"
                      d="M51.72,24.46c-14.49,5.37-21.86-8-14.49-15.74-11.75,3-30.86,11.49-30.86,25.63,0,12.83,12.49,20.09,21.49,23.22-8.68-10.74,3.25-19.16,13.7-7.41C49.69,35.73,59.28,56.44,61,59.58h0c1.71-3.14,11.31-23.85,19.44-9.42,10.45-11.75,22.38-3.33,13.7,7.41,9-3.13,21.49-10.39,21.49-23.22,0-14.14-19.11-22.63-30.86-25.63,7.37,7.74,0,21.11-14.49,15.74-1.67-2-2.75-6.11-2.75-18.24-1.94,1.26-3.33,5.71-3.45,6a12,12,0,0,0-6.15,0c-.12-.32-1.51-4.77-3.45-6,0,12.13-1.08,16.25-2.75,18.24ZM122.13,35c0,9.76-6.93,18.56-18.12,24.88-11,6.22-26.2,10.06-42.95,10.06S29.13,66.05,18.12,59.83C6.92,53.51,0,44.71,0,35S6.92,16.39,18.12,10.07C29.13,3.85,44.32,0,61.06,0S93,3.85,104,10.07C115.2,16.39,122.13,25.18,122.13,35ZM103,58c10.52-5.94,17-14.09,17-23s-6.51-17.1-17-23c-10.7-6-25.52-9.78-41.91-9.78s-31.2,3.74-41.9,9.78C8.64,17.85,2.13,26,2.13,35S8.64,52,19.16,58c10.7,6.05,25.52,9.79,41.9,9.79S92.27,64,103,58Z"
                    />
                  </svg>
                </div>
              ) : (
                <svg
                  viewBox="0 0 1080 1080"
                  className="w-7 h-7 drop-shadow-sm transition-colors duration-300"
                  style={{ fill: currentIcon?.leaf || 'var(--color-primary, #0066a4)' }}
                  aria-label="سروستان"
                >
                  <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
                </svg>
              )}
            </div>

            <div className="flex flex-col leading-tight min-w-0">
              <h1 className="text-[14px] font-bold text-base-content flex items-center gap-1 truncate">
                {title || (
                  <>
                    سروستان
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-secondary-soft text-secondary">
                      همراه
                    </span>
                  </>
                )}
              </h1>
              <span className="text-[10px] text-neutral truncate">
                {title
                  ? 'سامانه هوشمند دانشجویی'
                  : getUniversityName(session?.university || getSelectedUniversity())}
              </span>
            </div>
          </div>

          {/* سمت چپ: ابزارهای سریع (تم و اعلانات) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* دکمه بازگشت به نمای اصلی بهستان در صورت اجرای اورلی */}
            {isBehestanOverlay() && (
              <button
                type="button"
                onClick={closeBehestanOverlay}
                className="flex items-center gap-1 h-8 px-2.5 rounded-xl bg-danger-soft hover:bg-danger/20 text-danger border border-danger/30 text-[11px] font-bold active:scale-95 transition-all outline-none cursor-pointer"
                title="بستن پنجره سروستان و بازگشت به بهستان"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">بازگشت به بهستان</span>
              </button>
            )}

            {/* انتخابگر تم مدرن سرو */}
            <button
              type="button"
              onClick={() => setThemeSheetOpen(true)}
              className="flex items-center gap-1.5 h-8 px-2 rounded-xl bg-base-500/30 hover:bg-base-500/50 border border-base-500/40 text-neutral hover:text-base-content active:scale-95 transition-all outline-none"
              title={`تغییر تم (تم فعلی: ${activeThemeMeta?.persianName || 'تم'})`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-black/20"
                style={{ backgroundColor: activeThemeMeta?.primary || '#0066a4' }}
              />
              <span className="text-[11px] font-medium hidden xs:inline max-w-[65px] truncate">
                {activeThemeMeta?.persianName?.split(' ')[0] || 'تم'}
              </span>
              <Palette className="w-3.5 h-3.5 text-neutral" />
            </button>

            {/* زنگوله اعلانات */}
            <button
              type="button"
              onClick={() => setNotifySheetOpen(true)}
              className="relative w-8 h-8 rounded-xl bg-base-500/30 hover:bg-base-500/50 border border-base-500/40 grid place-items-center text-neutral hover:text-base-content active:scale-95 transition-all outline-none"
              title="اعلانات و پیام‌ها"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-content text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {toFaDigits(unread)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* مودال شیت انتخاب تم سروستان — پورتال‌شده به document.body با بالاترین اولویت z-index */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {themeSheetOpen && (
              <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setThemeSheetOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Sheet Panel */}
                <motion.div
                  initial={{ y: '100%', opacity: 0.5 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0.5 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="relative z-10 w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-5 shadow-2xl max-h-[85vh] flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-base-500/30">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary grid place-items-center">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-base-content">پالت‌های رنگی سرو</h3>
                        <p className="text-[11px] text-neutral">تم ظاهر برنامه را به سلیقه خود انتخاب کنید</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setThemeSheetOpen(false)}
                      className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="overflow-y-auto py-3 pb-24 space-y-1.5 flex-1 pr-1">
                    {themes.map((theme) => {
                      const isSelected = currentTheme === theme.id;
                      const isLimited = Boolean(theme.isLimited || theme.badge);
                      const isBatman = theme.id === 'batman';
                      const isCharging = isBatman && batmanHoldProgress > 0;

                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={(e) => {
                            if (isBatman && batmanTriggeredRef.current) {
                              batmanTriggeredRef.current = false;
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            setTheme(theme.id);
                            setThemeSheetOpen(false);
                          }}
                          onPointerDown={isBatman ? startBatmanHold : undefined}
                          onPointerUp={isBatman ? cancelBatmanHold : undefined}
                          onPointerLeave={isBatman ? cancelBatmanHold : undefined}
                          onPointerCancel={isBatman ? cancelBatmanHold : undefined}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-right border relative overflow-hidden select-none cursor-pointer ${
                            isCharging
                              ? 'bg-black text-[#ffe600] border-[#ffe600] shadow-[0_0_25px_rgba(255,230,0,0.4)] scale-[0.99]'
                              : isSelected
                              ? 'bg-primary/12 border-primary/50 text-primary font-bold shadow-sm'
                              : isLimited
                              ? 'bg-gradient-to-l from-[#931139]/10 via-base-500/20 to-[#931139]/5 border-[#931139]/35 text-base-content hover:border-[#931139]/60 shadow-xs'
                              : 'bg-base-500/15 border-base-500/30 text-base-content hover:bg-base-500/30'
                          }`}
                        >
                          {/* نوار شارژ ۵ ثانیه‌ای فعال‌سازی ایستر اگ بتمن */}
                          {isCharging && (
                            <div
                              className="absolute inset-0 bg-[#ffe600]/25 pointer-events-none transition-all duration-75"
                              style={{ width: `${batmanHoldProgress}%` }}
                            />
                          )}

                          <div className="flex items-center gap-3 relative z-10">
                            {/* پیش‌نمایش ۳ رنگ شاخص پالت */}
                            <div className={`flex items-center gap-1.5 p-1 rounded-xl bg-base-500/20 border ${isLimited ? 'border-[#931139]/40 shadow-xs shadow-[#931139]/15' : 'border-base-500/35'} shrink-0 shadow-2xs`}>
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-2xs shrink-0"
                                style={{ backgroundColor: theme.primary }}
                                title="رنگ اصلی"
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-2xs shrink-0"
                                style={{ backgroundColor: theme.accent || theme.primary }}
                                title="رنگ مکمل"
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-2xs shrink-0"
                                style={{ backgroundColor: theme.base }}
                                title="رنگ زمینه"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-[13px] font-bold leading-tight">
                                  {theme.icon} {theme.persianName}
                                </p>
                                {theme.badge && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-[#931139] text-white shadow-xs tracking-tight animate-pulse">
                                    {theme.badge}
                                  </span>
                                )}
                              </div>
                              {isCharging ? (
                                <p className="text-[10px] text-[#ffe600] font-black mt-0.5 animate-pulse">
                                  در حال احضار خفاش شب... {toFaDigits(Math.max(1, Math.ceil((5000 - (batmanHoldProgress / 100) * 5000) / 1000)))} ثانیه نگه دارید
                                </p>
                              ) : (
                                <p className="text-[10px] text-neutral mt-0.5">
                                  {theme.mode === 'dark' ? 'حالت تاریک' : 'حالت روشن'} · {theme.name}
                                </p>
                              )}
                            </div>
                          </div>
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-primary text-primary-content grid place-items-center shrink-0 relative z-10">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <span className={`text-[11px] font-mono relative z-10 ${isCharging ? 'text-[#ffe600] font-black' : isLimited ? 'text-[#931139] font-bold' : 'text-neutral/60'}`}>
                              {isCharging ? 'در حال احضار...' : isLimited ? 'ویژه' : 'انتخاب'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* مودال شیت اعلانات — پورتال‌شده به document.body با بالاترین اولویت z-index و پدینگ کامل پایین */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {notifySheetOpen && (
              <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setNotifySheetOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ y: '100%', opacity: 0.5 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0.5 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="relative z-10 w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-5 shadow-2xl max-h-[85vh] flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-base-500/30">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary grid place-items-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-base-content">اعلانات و پیام‌ها</h3>
                        <p className="text-[11px] text-neutral">گزارش همگام‌سازی و اطلاعیه‌های بهستان</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {localNotes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => clearLocalNotes()}
                          className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-base-500/30 hover:bg-base-500/50 text-neutral hover:text-base-content transition-all"
                          title="پاک کردن گزارش‌های همگام‌سازی"
                        >
                          پاک‌سازی گزارش‌ها
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotifySheetOpen(false)}
                        className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto py-3 pb-24 space-y-2.5 flex-1 pr-1">
                    {allNotifications.length === 0 && (
                      <div className="text-center py-8 space-y-1.5">
                        <p className="text-[13px] font-bold text-base-content">پیام یا اعلانی نیست</p>
                        <p className="text-[11.5px] text-neutral">همه اطلاعات آموزشی و همگام‌سازی به‌روز هستند</p>
                      </div>
                    )}
                    {allNotifications.map((a) => (
                      <article
                        key={a.id}
                        className={`sarv-card p-3.5 border-r-4 ${
                          a.isSync
                            ? 'border-r-primary bg-primary-soft/25'
                            : a.color === 'warn'
                            ? 'border-r-warn bg-warn-soft/40'
                            : 'border-r-info bg-info-soft/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-8 h-8 rounded-xl grid place-items-center shrink-0 ${
                              a.isSync
                                ? 'bg-primary-soft text-primary'
                                : a.color === 'warn'
                                ? 'bg-warn-soft text-warn'
                                : 'bg-info-soft text-info'
                            }`}
                          >
                            {a.isSync ? <RefreshCw className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-[13px] font-bold text-base-content">{a.title}</h4>
                              {a.isSync ? (
                                <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-primary-soft text-primary font-bold">
                                  {a.time ? `همگام‌سازی · ${toFaDigits(a.time)}` : 'همگام‌سازی'}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[12px] text-neutral mt-1 leading-relaxed whitespace-pre-line font-medium">
                              {toFaDigits(a.body || a.status || '')}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
