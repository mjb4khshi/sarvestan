import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Palette,
  ChevronLeft,
  Check,
  X,
  Megaphone,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSarvestanData } from '../hooks/useSarvestanData';

export default function TopBar({ title, onBack }) {
  const { currentTheme, setTheme, themes, activeThemeMeta } = useTheme();
  const { workflows, live } = useSarvestanData();
  const announcements = (workflows || []).slice(0, 5);
  const unread = live ? Math.min(5, announcements.length) : 0;
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [notifySheetOpen, setNotifySheetOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-base/88 border-b border-base-500/40 transition-colors"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="mx-auto max-w-[430px] h-14 flex items-center justify-between gap-2 px-3">
          {/* سمت راست: عنوان یا دکمه بازگشت */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="w-9 h-9 rounded-xl grid place-items-center text-neutral hover:text-base-content bg-base-500/20 hover:bg-base-500/40 active:scale-95 transition-all outline-none"
                aria-label="بازگشت به میز کار"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <svg
                      viewBox="0 0 1080 1080"
                      className="w-full h-full drop-shadow-sm transition-colors duration-300"
                      style={{ fill: 'var(--color-primary, #0066a4)' }}
                      aria-label="سروستان"
                    >
                      <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
                    </svg>
                  </div>
                <div className="flex flex-col leading-tight min-w-0">
                  <h1 className="text-[14px] font-bold text-base-content flex items-center gap-1">
                    سروستان
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/25">
                      موبایل
                    </span>
                  </h1>
                  <span className="text-[10px] text-neutral truncate">
                    دانشگاه صنعتی خواجه نصیر طوسی
                  </span>
                </div>
              </div>
            )}

            {onBack && title && (
              <div className="flex flex-col leading-tight min-w-0">
                <h1 className="text-[14px] font-bold text-base-content truncate">{title}</h1>
                <span className="text-[10px] text-neutral truncate">سامانه هوشمند دانشجویی</span>
              </div>
            )}
          </div>

          {/* سمت چپ: ابزارهای سریع (تم و اعلانات) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* انتخابگر تم مدرن سرو */}
            <button
              type="button"
              onClick={() => setThemeSheetOpen(true)}
              className="flex items-center gap-1.5 h-8 px-2 rounded-xl bg-base-500/30 hover:bg-base-500/50 border border-base-500/40 text-neutral hover:text-base-content active:scale-95 transition-all outline-none"
              title="تغییر تم و رنگ سرو"
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
                  {unread}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* مودال شیت انتخاب تم سروستان */}
      <AnimatePresence>
        {themeSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
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

              <div className="overflow-y-auto py-3 space-y-1.5 flex-1 pr-1">
                {themes.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setTheme(theme.id);
                        setThemeSheetOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-right border ${
                        isSelected
                          ? 'bg-primary/12 border-primary/40 text-primary font-bold shadow-sm'
                          : 'bg-base-500/15 border-base-500/30 text-base-content hover:bg-base-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-5 h-5 rounded-full ring-2 ring-base shadow-sm shrink-0"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold leading-tight">
                            {theme.icon} {theme.persianName}
                          </p>
                          <p className="text-[10px] text-neutral mt-0.5">
                            {theme.mode === 'dark' ? 'حالت تاریک' : 'حالت روشن'} · {theme.name}
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-content grid place-items-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral/60 font-mono">انتخاب</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال شیت اعلانات — با لایه بالاتر از نوار ناوبری و پدینگ کامل پایین */}
      <AnimatePresence>
        {notifySheetOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
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
                    <h3 className="text-[15px] font-bold text-base-content">اعلانات بهستان</h3>
                    <p className="text-[11px] text-neutral">اطلاعیه‌های آموزشی دانشگاه خواجه نصیر</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifySheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto py-3 pb-24 space-y-2.5 flex-1 pr-1">
                {announcements.length === 0 && (
                  <p className="text-[12px] text-neutral text-center py-6">اعلانی ثبت نشده</p>
                )}
                {announcements.map((a) => (
                  <article
                    key={a.id}
                    className={`sarv-card p-3.5 border-r-4 ${
                      a.color === 'warn' ? 'border-r-warn' : 'border-r-info'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-8 h-8 rounded-xl grid place-items-center shrink-0 ${
                          a.color === 'warn'
                            ? 'bg-warn-soft text-warn'
                            : 'bg-info-soft text-info'
                        }`}
                      >
                        <Megaphone className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-base-content">{a.title}</h4>
                        <p className="text-[12px] text-neutral mt-0.5 leading-relaxed">
                          {a.body || a.status || ''}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
