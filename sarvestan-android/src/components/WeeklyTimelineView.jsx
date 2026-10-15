import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, CalendarDays } from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import { formatRoomTag } from '../utils/roomUtils';
import { getToneForCourse } from '../data/viewModel';
import { getSelectedUniversity, getUniversityName } from '../services/behestan/session';

const DAY_ORDER = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

function parseTimeMinutes(str) {
  const s = String(str || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const m = s.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (m) {
    const t1 = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    const t2 = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
    return {
      start: Math.min(t1, t2),
      end: Math.max(t1, t2),
    };
  }
  const single = s.match(/(\d{1,2}):(\d{2})/);
  if (single) {
    const t = parseInt(single[1], 10) * 60 + parseInt(single[2], 10);
    return { start: t, end: t + 90 };
  }
  return null;
}

// دقیقاً هماهنگ با جدول ماتریسی برنامه در ScheduleScreen.jsx
const cellTone = {
  primary: 'bg-primary-soft text-primary border-primary-soft',
  success: 'bg-success-soft text-success border-success-soft',
  info: 'bg-info-soft text-info border-info-soft',
  warn: 'bg-warn-soft text-warn border-warn-soft',
  danger: 'bg-danger-soft text-danger border-danger-soft',
  accent: 'bg-accent-soft text-accent border-accent-soft',
  secondary: 'bg-secondary-soft text-secondary border-secondary-soft',
};

const HOUR_HEIGHT = 64; // ارتفاع پیکسلی هر ساعت برای نمایش روان و متناسب کارت‌ها
const START_HOUR = 7;   // شروع از ۰۷:۰۰
const END_HOUR = 19;    // پایان در ۱۹:۰۰

export default function WeeklyTimelineView({ courses = [], onCourseClick }) {
  // استخراج روزهای فعال برنامه
  const { days, daySchedules } = useMemo(() => {
    const activeDaysSet = new Set(['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه']);
    const schedules = {};

    (courses || []).forEach((c) => {
      const slots = Array.isArray(c.daySlots) && c.daySlots.length
        ? c.daySlots
        : Array.isArray(c.days) && c.days.length
        ? c.days.map((d) => ({ day: d, time: c.time || c.classTimeRaw || '', hall: c.hall || 'ـ' }))
        : [];

      const assignedColor = c.color || getToneForCourse(c, courses) || 'primary';

      slots.forEach((s) => {
        if (!s.day) return;
        if (s.day === 'پنجشنبه' || s.day === 'جمعه') {
          activeDaysSet.add(s.day);
        }
        if (!schedules[s.day]) schedules[s.day] = [];

        const range = parseTimeMinutes(s.time || c.time);
        if (range) {
          schedules[s.day].push({
            course: c,
            slot: s,
            range,
            title: c.name || c.title || 'درس',
            professor: c.professor && c.professor !== 'ـ' && c.professor !== '-' ? c.professor : '',
            room: (s.hall && s.hall !== 'ـ' && s.hall !== '-') ? (formatRoomTag(s.hall) || s.hall) : (c.hall && c.hall !== 'ـ' && c.hall !== '-' ? (formatRoomTag(c.hall) || c.hall) : ''),
            units: Number(c.units ?? c.unit) || 0,
            color: assignedColor,
            time: s.time || c.time || '',
          });
        }
      });
    });

    const sortedDays = DAY_ORDER.filter((d) => activeDaysSet.has(d));
    return { days: sortedDays, daySchedules: schedules };
  }, [courses]);

  // ساعات خط‌کش عمودی (۰۷:۰۰ تا ۱۹:۰۰)
  const hours = useMemo(() => {
    const arr = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      arr.push(h);
    }
    return arr;
  }, []);

  // محاسبه موقعیت خط زمان فعلی
  const now = new Date();
  const dayMap = { 6: 'شنبه', 0: 'یکشنبه', 1: 'دوشنبه', 2: 'سه‌شنبه', 3: 'چهارشنبه', 4: 'پنجشنبه', 5: 'جمعه' };
  const todayName = dayMap[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const showCurrentTimeLine = currentMinutes >= START_HOUR * 60 && currentMinutes <= END_HOUR * 60;
  const currentTimeTop = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;

  const totalGridHeight = (hours.length - 1) * HOUR_HEIGHT;

  return (
    <div className="sarv-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="min-w-[660px] select-none">
          {/* ردیف هدر روزهای هفته — کاملاً هماهنگ با جدول سنتی ماتریس */}
          <div
            className="grid bg-base-500/25 border-b border-base-500/40 sticky top-0 z-20"
            style={{ gridTemplateColumns: `74px repeat(${days.length}, minmax(115px, 1fr))` }}
          >
            {/* ستون گوشه سمت راست (ساعت) — شناور و فیکس هنگام اسکرول افقی */}
            <div className="sticky right-0 z-30 bg-base/95 backdrop-blur-md px-2 py-3 text-[11px] font-bold text-neutral w-[74px] border-b border-base-500/40 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.2)] flex items-center justify-center">
              ساعت
            </div>

            {/* ستون‌های نام روزها */}
            {days.map((day) => {
              const count = (daySchedules[day] || []).length;
              const isToday = day === todayName;
              return (
                <div
                  key={day}
                  className={`px-2 py-2.5 text-center transition-colors border-b border-base-500/40 border-l border-base-500/20 ${
                    isToday ? 'bg-primary-soft/30 text-primary font-bold' : 'text-base-content font-bold'
                  }`}
                >
                  <p className="text-[12px]">{day}</p>
                  <p className="text-[9.5px] opacity-75 font-mono mt-0.5">
                    {count > 0 ? `${toFaDigits(count)} درس` : 'بدون کلاس'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* بدنه خط‌کش زمانی و ستون‌های روزانه */}
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `74px repeat(${days.length}, minmax(115px, 1fr))`,
              height: `${totalGridHeight}px`,
            }}
          >
            {/* ستون خط‌کش ساعات در سمت راست (RTL) — شناور و فیکس حین اسکرول افقی */}
            <div className="sticky right-0 z-20 bg-base/95 backdrop-blur-md border-l border-base-500/30 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.2)] select-none">
              {hours.map((h, i) => {
                if (i === hours.length - 1) return null; // خط پایانی
                return (
                  <div
                    key={`time-${h}`}
                    className="absolute right-0 left-0 flex items-center justify-center text-[10.5px] font-mono text-neutral -translate-y-1/2"
                    style={{ top: `${i * HOUR_HEIGHT}px` }}
                  >
                    <span>{toFaDigits(String(h).padStart(2, '0'))}:۰۰</span>
                  </div>
                );
              })}
            </div>

            {/* ستون‌های روزهای هفته */}
            {days.map((day) => {
              const dayCourses = daySchedules[day] || [];
              const isToday = day === todayName;

              return (
                <div
                  key={day}
                  className={`relative border-l border-base-500/20 ${
                    isToday ? 'bg-primary-soft/10' : ''
                  }`}
                >


                  {/* نشانگر خط زمان زنده برای روز جاری */}
                  {isToday && showCurrentTimeLine && (
                    <div
                      className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-danger -mr-1 shadow-xs" />
                      <div className="flex-1 h-[2px] bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </div>
                  )}

                  {/* کارت‌های درسی شناور بر اساس ساعت دقیق شروع و پایان */}
                  {dayCourses.map((item, idx) => {
                    const topPx = ((item.range.start - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                    const durationMins = item.range.end - item.range.start;
                    const heightPx = Math.max(42, (durationMins / 60) * HOUR_HEIGHT - 4);
                    const isVeryShort = heightPx < 54;

                    const isHex = String(item.color || '').startsWith('#') || String(item.color || '').startsWith('rgb');

                    return (
                      <motion.div
                        key={`${item.title}-${item.range.start}-${idx}`}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => onCourseClick?.(item.course)}
                        style={{
                          top: `${topPx + 2}px`,
                          height: `${heightPx}px`,
                          borderColor: isHex ? item.color : undefined,
                          backgroundColor: isHex ? `${item.color}18` : undefined,
                          color: isHex ? item.color : undefined,
                        }}
                        className={`absolute left-1 right-1 rounded-xl border p-2 text-right transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-primary/40 shadow-xs z-10 flex flex-col justify-between overflow-hidden ${
                          isHex ? '' : (cellTone[item.color] || cellTone.primary)
                        }`}
                        title="برای مشاهده و ویرایش درس کلیک کنید"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold leading-tight line-clamp-2">
                            {item.title}
                          </p>
                          {item.time && (
                            <p className="text-[9.5px] font-mono font-medium opacity-90 mt-0.5">
                              {toFaDigits(item.time)}
                            </p>
                          )}
                        </div>

                        {!isVeryShort && (
                          <div className="mt-1 pt-1 border-t border-current/15 flex flex-col gap-0.5 text-[9px]">
                            <div className="flex items-center justify-between gap-1 opacity-85">
                              {item.room ? (
                                <span className="flex items-center gap-1 min-w-0 flex-1 truncate" title={item.room}>
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{item.room}</span>
                                </span>
                              ) : (
                                <span className="text-[8.5px] opacity-80 font-medium">
                                  {item.units ? `${toFaDigits(item.units)} واحد` : 'حضوری'}
                                </span>
                              )}
                              {(item.course?.absences > 0 || item.course?.absenceCount > 0) && (
                                <span
                                  className={`px-1 py-0.2 rounded font-mono text-[8.5px] font-bold shrink-0 ${
                                    (item.course?.absences || item.course?.absenceCount) >= (item.course?.maxAbsences || 3)
                                      ? 'bg-danger text-danger-content'
                                      : 'bg-warn text-warn-content'
                                  }`}
                                >
                                  {toFaDigits(item.course?.absences || item.course?.absenceCount)}/{toFaDigits(item.course?.maxAbsences || 3)}
                                </span>
                              )}
                            </div>
                            {item.professor && (
                              <p className="opacity-75 truncate">
                                {item.professor}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* نوار پایین جدول — دقیقا مشابه جدول سنتی ماتریس */}
      <div className="p-3 flex items-center justify-between text-[11px] text-neutral border-t border-base-500/25 bg-base-500/5">
        <span>ساعت نماز و ناهار: {toFaDigits('۱۲:۳۰')} تا {toFaDigits('۱۳:۳۰')}</span>
        <span className="text-primary font-bold">{getUniversityName(getSelectedUniversity())}</span>
      </div>
    </div>
  );
}
