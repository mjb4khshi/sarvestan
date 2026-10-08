import { useRef, useEffect, useState } from 'react';
import {
  Flame,
  Clock,
  ChevronLeft,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { getYearlyHeatmapWeeks, toLocalDateString } from '../services/calendarHelper';
import { getDailyActivityMap, calculateStudyStats } from '../services/studyPlanner';
import { toFaDigits } from '../utils/faDigits';

/**
 * مؤلفه ماتریس فعالیت و مطالعه سالانه (Heatmap)
 * قابل استفاده هم در داشبورد (HomeScreen) و هم در صفحه مطالعه (StudyScreen)
 */
export default function StudyHeatmap({
  onNavigate,
  showTitle = true,
  showHeaderAction = true,
  className = '',
  selectedDate: propSelectedDate,
  onSelectDate,
}) {
  const [activityMap, setActivityMap] = useState(() => getDailyActivityMap());
  const [stats, setStats] = useState(() => calculateStudyStats());
  const todayIso = toLocalDateString(new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState(todayIso);

  const selectedDate = propSelectedDate !== undefined ? propSelectedDate : internalSelectedDate;
  const setSelectedDate = onSelectDate || setInternalSelectedDate;

  const scrollRef = useRef(null);
  const todayCellRef = useRef(null);

  // به‌روزرسانی زنده داده‌ها با رویداد sarvStudyUpdated
  useEffect(() => {
    const handleUpdate = () => {
      setActivityMap(getDailyActivityMap());
      setStats(calculateStudyStats());
    };
    window.addEventListener('sarvStudyUpdated', handleUpdate);
    return () => window.removeEventListener('sarvStudyUpdated', handleUpdate);
  }, []);

  // ۵۲ هفته ماتریس فعالیت
  const heatmapWeeks = getYearlyHeatmapWeeks(52);

  // اسکرول نرم یا فوری به سلول امروز
  // اسکرول نرم یا فوری برای قرار دادن سلول امروز دقیقاً در مرکز هیت‌مپ
  const scrollToToday = (smooth = false) => {
    if (todayCellRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const cell = todayCellRef.current;
      const containerRect = container.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      const currentScroll = container.scrollLeft;
      const diff = (cellRect.left + cellRect.width / 2) - (containerRect.left + containerRect.width / 2);
      container.scrollTo({
        left: currentScroll + diff,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  };

  useEffect(() => {
    const t1 = setTimeout(() => scrollToToday(false), 60);
    const t2 = setTimeout(() => scrollToToday(false), 240);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const selectedDayActivity = activityMap[selectedDate];
  const selectedDayMins = selectedDayActivity?.totalMinutes || 0;

  return (
    <section className={`sarv-card p-4 space-y-3.5 border border-base-500/35 relative overflow-hidden ${className}`}>
      {/* هدر هیت‌مپ با دکمه دسترسی به پلنر و بج‌های پیوستگی */}
      {showTitle && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-accent-soft text-accent grid place-items-center">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-[13.5px] font-bold text-base-content flex items-center gap-1.5">
                <span>ماتریس فعالیت و مطالعه</span>
                {stats.streak > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-accent-soft text-accent text-[10px] font-bold">
                    <Flame className="w-3 h-3 text-accent fill-accent" />
                    {toFaDigits(stats.streak)} روز
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-neutral mt-0.5">
                ثبت پیوستگی در ۵۲ هفته اخیر · امروز: {toFaDigits(stats.todayHours)} ساعت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(todayIso);
                scrollToToday(true);
              }}
              className="text-[10.5px] text-primary font-bold hover:underline px-2 py-1 rounded-lg bg-primary-soft/40 border border-primary/20 active:scale-95 transition cursor-pointer"
              title="انتقال نمای هیت‌مپ به روز جاری"
            >
              امروز
            </button>

            {showHeaderAction && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('study')}
                className="text-[11px] text-accent font-bold hover:underline flex items-center gap-0.5 px-2 py-1 rounded-lg bg-accent-soft border border-accent/25 active:scale-95 transition cursor-pointer"
                title="مشاهده پلنر و تایمر مطالعه"
              >
                <span>پلنر</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* کانتینر افقی هیت‌مپ با اسکرول نرم */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2 no-scrollbar border border-base-500/25 rounded-2xl p-2.5 bg-base-500/10 flex items-center gap-1.5 direction-ltr"
      >
        {/* برچسب‌های روزهای هفته (شنبه تا جمعه) در کنار ماتریس */}
        <div className="flex flex-col gap-1.5 shrink-0 pr-1 select-none">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayAbbr, dai) => (
            <span
              key={dai}
              className="w-3 h-3.5 text-[9px] font-mono text-neutral/70 flex items-center justify-center leading-none"
            >
              {dayAbbr}
            </span>
          ))}
        </div>

        {/* ماتریس ۵۲ ستونی هفته‌ها */}
        <div className="inline-flex gap-1.5">
          {heatmapWeeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((d) => {
                const act = activityMap[d.isoDate];
                const mins = act?.totalMinutes || 0;
                const isToday = d.isoDate === todayIso;
                const isSelected = d.isoDate === selectedDate;
                const isFuture = d.isFuture;

                let levelClass = 'bg-base-500/25';
                if (mins > 120) levelClass = 'bg-primary shadow-xs';
                else if (mins > 60) levelClass = 'bg-primary/80';
                else if (mins > 30) levelClass = 'bg-primary/55';
                else if (mins > 0) levelClass = 'bg-primary/35';

                if (isFuture) {
                  return (
                    <div
                      key={d.isoDate}
                      className="w-3.5 h-3.5 rounded-[4px] border border-dashed border-base-500/30 opacity-25 pointer-events-none"
                    />
                  );
                }

                return (
                  <button
                    key={d.isoDate}
                    ref={isToday ? todayCellRef : null}
                    type="button"
                    onClick={() => setSelectedDate(d.isoDate)}
                    className={`w-3.5 h-3.5 rounded-[4px] transition-all cursor-pointer relative ${levelClass} ${
                      isSelected
                        ? 'ring-2 ring-accent scale-125 z-20'
                        : isToday
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-base scale-125 z-10 shadow-sm'
                        : 'hover:scale-110'
                    }`}
                    title={`${d.isoDate} ${isToday ? '(امروز)' : ''}: ${toFaDigits(mins)} دقیقه مطالعه`}
                  >
                    {isToday && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-warn shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* راهنمای شدت رنگ و اطلاعات روز انتخابی */}
      <div className="flex items-center justify-between text-[10.5px] text-neutral px-1 pt-0.5 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span>کمتر</span>
          <span className="w-2.5 h-2.5 rounded-[3px] bg-base-500/25 inline-block" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-primary/35 inline-block" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-primary/55 inline-block" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-primary/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-primary inline-block" />
          <span>بیشتر</span>
        </div>

        <div className="flex items-center gap-2">
          {selectedDayMins > 0 ? (
            <span className="text-primary font-bold">
              {selectedDate === todayIso ? 'امروز: ' : ''}
              {toFaDigits(selectedDayMins)} دقیقه
            </span>
          ) : (
            <span>کل مطالعه: <strong className="text-base-content font-bold">{toFaDigits(stats.totalHours)}</strong> س</span>
          )}
        </div>
      </div>
    </section>
  );
}
