import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  School,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPersianMonthGrid,
  getPersianParts,
  formatFullPersianDate,
  toLocalDateString,
  formatMinutesHuman,
} from '../services/calendarHelper';
import { getDailyActivityMap, getStudyTasks } from '../services/studyPlanner';
import { getViewModel, getToneForCourse, getExamsView } from '../data/viewModel';
import { subscribeStore } from '../services/behestan';
import { getExamCategoryLabel } from '../services/classAlarms';
import { toFaDigits } from '../utils/faDigits';
import { getCalendarSpecialDay } from '../data/iranCalendarEvents';

const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const toneColors = {
  primary: { bg: 'bg-primary-soft', text: 'text-primary', border: 'border-primary/40', dot: 'bg-primary' },
  info: { bg: 'bg-info-soft', text: 'text-info', border: 'border-info/40', dot: 'bg-info' },
  success: { bg: 'bg-success-soft', text: 'text-success', border: 'border-success/40', dot: 'bg-success' },
  secondary: { bg: 'bg-secondary-soft', text: 'text-secondary', border: 'border-secondary/40', dot: 'bg-secondary' },
  accent: { bg: 'bg-accent-soft', text: 'text-accent', border: 'border-accent/40', dot: 'bg-accent' },
  warn: { bg: 'bg-warn-soft', text: 'text-warn', border: 'border-warn/40', dot: 'bg-warn' },
  danger: { bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40', dot: 'bg-danger' },
};

const toneClasses = {
  primary: 'border-r-primary text-primary bg-primary-soft',
  info: 'border-r-info text-info bg-info-soft',
  success: 'border-r-success text-success bg-success-soft',
  secondary: 'border-r-secondary text-secondary bg-secondary-soft',
  accent: 'border-r-accent text-accent bg-accent-soft',
  warn: 'border-r-warn text-warn bg-warn-soft',
  danger: 'border-r-danger text-danger bg-danger-soft',
};

export default function DashboardCalendar({ onNavigate, className = '' }) {
  const [refDate, setRefDate] = useState(() => new Date());
  const todayIso = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [slideDir, setSlideDir] = useState(0);

  const [activityMap, setActivityMap] = useState(() => getDailyActivityMap());
  const [tasks, setTasks] = useState(() => getStudyTasks());
  const [storeVer, setStoreVer] = useState(0);

  // اشتراک به رویدادهای تغییر مطالعه و داده‌های بهستان
  useEffect(() => {
    const handleStudyUpdate = () => {
      setActivityMap(getDailyActivityMap());
      setTasks(getStudyTasks());
    };
    window.addEventListener('sarvStudyUpdated', handleStudyUpdate);
    window.addEventListener('sarvBirthdayUpdated', handleStudyUpdate);
    const unsub = subscribeStore(() => setStoreVer((v) => v + 1));

    return () => {
      window.removeEventListener('sarvStudyUpdated', handleStudyUpdate);
      window.removeEventListener('sarvBirthdayUpdated', handleStudyUpdate);
      unsub();
    };
  }, []);

  // دریافت ویومدل دقیق برنامه هفتگی و امتحانات دقیقاً منطبق با صفحه مطالعه (StudyScreen)
  const vm = useMemo(() => getViewModel(), [storeVer]);
  const coursesList = useMemo(() => vm.scheduleCourses || [], [vm]);
  const examsList = useMemo(() => getExamsView() || vm.exams || [], [vm]);

  const monthGrid = useMemo(() => getPersianMonthGrid(refDate), [refDate]);

  const handlePrevMonth = () => {
    setSlideDir(-1);
    const d = new Date(monthGrid.firstDay);
    d.setDate(d.getDate() - 15);
    setRefDate(d);
  };

  const handleNextMonth = () => {
    setSlideDir(1);
    const d = new Date(monthGrid.firstDay);
    d.setDate(d.getDate() + 35);
    setRefDate(d);
  };

  const handleGoToToday = () => {
    setRefDate(new Date());
    setSelectedDate(todayIso);
  };

  // رنگ اختصاصی هر درس مطابق سیستم یکپارچه سروستان
  const getCourseColor = (courseOrName) => {
    if (!courseOrName) return 'primary';
    if (typeof courseOrName === 'object' && courseOrName.color) return courseOrName.color;
    const name = typeof courseOrName === 'object'
      ? (courseOrName.name || courseOrName.courseName || courseOrName.title)
      : courseOrName;
    const matched = coursesList.find(
      (c) => c.name === name || (c.code && courseOrName?.code && c.code === courseOrName.code)
    );
    if (matched?.color) return matched.color;
    return getToneForCourse(courseOrName, coursesList);
  };

  // استخراج کلاس‌های رسمی دانشگاه از برنامه هفتگی برای هر روز تقویم (دقیقاً مشابه StudyScreen)
  const getClassesForDate = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return [];
    const jsDay = dateObj.getDay();
    const dayName = { 6: 'شنبه', 0: 'یکشنبه', 1: 'دوشنبه', 2: 'سه‌شنبه', 3: 'چهارشنبه', 4: 'پنجشنبه', 5: 'جمعه' }[jsDay];
    if (!dayName) return [];
    return coursesList
      .filter((c) => {
        if (Array.isArray(c.daySlots) && c.daySlots.some((s) => s.day === dayName)) return true;
        if (Array.isArray(c.days) && c.days.includes(dayName)) return true;
        return false;
      })
      .map((c) => {
        let slotTime = c.time || c.classTimeRaw || 'ـ';
        if (Array.isArray(c.daySlots)) {
          const match = c.daySlots.find((s) => s.day === dayName);
          if (match?.time) slotTime = match.time;
        }
        return {
          id: c.id || c.code || c.name,
          name: c.name,
          code: c.code,
          professor: c.professor,
          room: c.hall || c.room,
          units: c.units,
          time: toFaDigits(slotTime),
          color: getCourseColor(c),
        };
      });
  };

  // استخراج امتحانات برای هر تاریخ (دقیقاً مشابه StudyScreen)
  const getExamsForDate = (isoDate, pYear, pMonth, pDay) => {
    if (!examsList?.length) return [];
    let py = pYear;
    let pm = pMonth;
    let pd = pDay;
    if ((!py || !pm || !pd) && isoDate) {
      try {
        const parts = getPersianParts(new Date(isoDate));
        py = parts.year;
        pm = parts.month;
        pd = parts.day;
      } catch {}
    }
    return examsList.filter((ex) => {
      if (isoDate && ex.isoDate && ex.isoDate === isoDate) return true;
      if (ex.jalaliParts && py && pm && pd) {
        return (
          ex.jalaliParts.year === py &&
          ex.jalaliParts.month === pm &&
          ex.jalaliParts.day === pd
        );
      }
      return false;
    });
  };

  // داده‌های روز انتخاب‌شده
  const selectedDateObj = useMemo(() => new Date(selectedDate), [selectedDate]);
  const selectedDayParts = useMemo(() => getPersianParts(selectedDateObj), [selectedDateObj]);
  const selectedDayActivity = activityMap[selectedDate];
  const selectedDaySessions = selectedDayActivity?.sessions || [];
  const selectedDayClasses = useMemo(() => getClassesForDate(selectedDateObj), [selectedDateObj, coursesList]);
  const selectedDayExams = useMemo(
    () => getExamsForDate(selectedDate, selectedDayParts?.year, selectedDayParts?.month, selectedDayParts?.day),
    [selectedDate, selectedDayParts, examsList]
  );
  const selectedDayTasks = useMemo(
    () => tasks.filter((t) => (t.dateStr || toLocalDateString(new Date(t.createdAt || Date.now()))) === selectedDate),
    [selectedDate, tasks]
  );

  return (
    <section className={`sarv-card p-4 space-y-3.5 border border-base-500/35 relative overflow-hidden ${className}`}>
      {/* هدر تقویم با عنوان و سوئیچ ماه */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-primary-soft text-primary grid place-items-center shadow-xs">
            <Calendar className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-[13.5px] font-bold text-base-content flex items-center gap-1.5">
              <span>تقویم و برنامه ماهانه</span>
              {selectedDate === todayIso && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-primary-soft text-primary">
                  امروز
                </span>
              )}
            </h3>
            <p className="text-[10.5px] text-neutral mt-0.5 font-medium">
              {monthGrid.monthName} {toFaDigits(monthGrid.year)}
            </p>
          </div>
        </div>

        {/* کلیدهای ناوبری ماه */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-2 py-1 rounded-xl text-[10.5px] font-bold text-primary hover:bg-primary-soft transition cursor-pointer"
            title="رفتن به ماه جاری"
          >
            امروز
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content transition cursor-pointer"
            title="ماه بعد"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content transition cursor-pointer"
            title="ماه قبل"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* سرستون روزهای هفته (شنبه در راست تا جمعه در چپ) */}
      <div className="grid grid-cols-7 gap-1 text-center select-none pt-1">
        {WEEKDAYS.map((w, idx) => (
          <span
            key={idx}
            className={`text-[11px] font-bold py-1 ${idx === 6 ? 'text-danger/80' : 'text-neutral'}`}
          >
            {w}
          </span>
        ))}
      </div>

      {/* ماتریس شبکه‌ای روزهای ماه با تفکیک دقیق رویدادها */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${monthGrid.year}-${monthGrid.month}`}
          initial={{ opacity: 0, x: slideDir * 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -slideDir * 15 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-7 gap-1.5"
        >
          {monthGrid.days.map((d, index) => {
            if (!d) {
              return <div key={`empty-${index}`} className="h-12 rounded-xl bg-transparent" />;
            }

            const isToday = d.isoDate === todayIso;
            const isSelected = d.isoDate === selectedDate;
            const special = getCalendarSpecialDay(d.date);
            const dayActivity = activityMap[d.isoDate];
            const hasStudy = dayActivity && dayActivity.totalMinutes > 0;
            const dayClasses = getClassesForDate(d.date);
            const dayExams = getExamsForDate(d.isoDate, monthGrid.year, monthGrid.month, d.dayNumber);
            const hasExam = dayExams.length > 0;
            const examTone = hasExam ? (getCourseColor(dayExams[0].course) || dayExams[0].color || 'primary') : 'primary';
            const isExamHex = String(examTone).startsWith('#') || String(examTone).startsWith('rgb');
            const examToneMeta = toneColors[examTone] || toneColors.primary;
            const dayTasks = tasks.filter((t) => (t.dateStr || t.scheduledDateStr) === d.isoDate);
            const hasDayTasks = dayTasks.length > 0;
            const urgentTask = dayTasks.find((t) => t.status !== 'done') || dayTasks[0];
            const taskTone = urgentTask ? (getCourseColor(urgentTask.courseName) || urgentTask.color || 'primary') : 'primary';

            // جمع‌آوری نقاط رویدادهای دانشگاه فقط برای کلاس‌ها و امتحانات
            const dayDots = [];
            const seenCourses = new Set();

            for (const ex of dayExams) {
              const catLabel = getExamCategoryLabel(ex.category || ex.examType);
              const key = `e:${ex.id || `${ex.category || 'final'}:${ex.course}`}`;
              if (!seenCourses.has(key)) {
                seenCourses.add(key);
                dayDots.push({
                  name: `${catLabel} ${ex.course}`,
                  categoryLabel: catLabel,
                  tone: getCourseColor(ex.course) || ex.color || 'danger',
                  isExam: true,
                });
              }
            }

            for (const uc of dayClasses) {
              const key = `u:${uc.name}`;
              if (!seenCourses.has(key)) {
                seenCourses.add(key);
                dayDots.push({
                  name: uc.name,
                  tone: uc.color || getCourseColor(uc),
                  isUni: true,
                });
              }
            }

            return (
              <button
                key={d.isoDate}
                type="button"
                onClick={() => setSelectedDate(d.isoDate)}
                style={!isSelected && hasExam && isExamHex ? { borderColor: examTone, backgroundColor: `${examTone}22` } : undefined}
                className={`h-12 rounded-xl flex flex-col items-center justify-between py-1 transition-all active:scale-95 cursor-pointer relative ${
                  isSelected
                    ? 'bg-primary text-primary-content font-black shadow-sm ring-2 ring-primary/40'
                    : hasExam
                    ? `${isExamHex ? '' : `${examToneMeta.bg} ${examToneMeta.border}`} text-base-content font-black border`
                    : special.isStudentDay || special.isBirthday
                    ? 'bg-accent-soft/40 hover:bg-accent-soft/60 text-accent font-black border border-accent/40'
                    : isToday
                    ? 'bg-primary-soft text-primary font-black border border-primary/40'
                    : special.isHoliday
                    ? 'bg-danger-soft/20 hover:bg-danger-soft/35 text-danger font-black border border-danger/25'
                    : hasStudy
                    ? 'bg-base-500/25 hover:bg-base-500/40 text-base-content font-bold'
                    : 'bg-base-500/10 hover:bg-base-500/20 text-neutral'
                }`}
                title={
                  special.specialEvents.length > 0
                    ? special.specialEvents.map((ev) => ev.title).join(' · ')
                    : special.isHoliday
                    ? 'تعطیل'
                    : undefined
                }
              >
                {/* شماره روز و نشانگر امتحان / مناسبت */}
                <div className="w-full flex items-center justify-between px-1">
                  {hasExam ? (
                    <div
                      className="flex items-center -space-x-1 space-x-reverse shrink-0"
                      title={`موعد آزمون: ${dayExams
                        .map((e) => `${getExamCategoryLabel(e.category || e.examType)} ${e.course}`)
                        .join('، ')}`}
                    >
                      {dayExams.slice(0, 2).map((ex, ei) => {
                        const exTone = getCourseColor(ex.course) || ex.color || 'primary';
                        const isExHex = String(exTone).startsWith('#') || String(exTone).startsWith('rgb');
                        const exMeta = toneColors[exTone] || toneColors.primary;
                        return (
                          <span
                            key={ex.id || ei}
                            style={!isSelected && isExHex ? { backgroundColor: exTone } : undefined}
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ring-1 ring-base ${
                              isSelected
                                ? `bg-white ${exMeta.text}`
                                : isExHex
                                ? 'text-white shadow-xs'
                                : `${exMeta.dot} text-white shadow-xs`
                            }`}
                          >
                            <GraduationCap className="w-2.5 h-2.5" />
                          </span>
                        );
                      })}
                    </div>
                  ) : special.isBirthday || special.isStudentDay ? (
                    <span className="text-[10px] leading-none shrink-0">
                      {special.isBirthday ? '🎂' : '🎓'}
                    </span>
                  ) : (
                    <span className="w-2" />
                  )}
                  <span
                    className={`text-[12px] font-mono leading-none ${
                      special.isOfficialHoliday && !isSelected ? 'underline decoration-danger/60 decoration-2 underline-offset-4' : ''
                    }`}
                  >
                    {toFaDigits(d.dayNumber)}
                  </span>
                  <span className="w-2" />
                </div>

                {/* لایه وسط: امضای بصری سررسید و تکالیف (کپسول‌های چندرنگ تفکیک‌شده و جمع‌وجور) */}
                {hasDayTasks ? (
                  <div
                    className="flex items-center justify-center gap-1 my-0.5 max-w-[70%] w-full mx-auto"
                    title={`${toFaDigits(dayTasks.length)} کار/سررسید: ${dayTasks.map((t) => t.title).join('، ')}`}
                  >
                    {dayTasks.slice(0, 3).map((t, ti) => {
                      const tone = getCourseColor(t.courseName) || t.color || 'primary';
                      const dotBg = isSelected ? 'bg-white' : (toneColors[tone]?.dot || 'bg-primary');
                      return (
                        <span
                          key={t.id || ti}
                          className={`h-1 flex-1 min-w-[5px] max-w-[12px] rounded-full ${dotBg} opacity-90 shadow-2xs`}
                        />
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-base-content/60'} shrink-0`} />
                    )}
                  </div>
                ) : (
                  <div className="h-1 my-0.5" />
                )}

                {/* نقاط رویدادهای روز با رنگ‌های هماهنگ با دروس */}
                <div className="flex items-center justify-center gap-0.5 mt-0.5 min-h-[8px] max-w-full px-0.5 overflow-hidden">
                  {dayDots.slice(0, 4).map((dotItem, di) => {
                    const cMeta = toneColors[dotItem.tone] || toneColors.primary;
                    return (
                      <span
                        key={di}
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isSelected
                            ? 'bg-white shadow-xs'
                            : `${cMeta.dot} ring-1 ring-black/20 shadow-xs`
                        }`}
                        title={`${dotItem.name} (${
                          dotItem.isExam ? (dotItem.categoryLabel || 'امتحان') : dotItem.isUni ? 'کلاس دانشگاه' : 'مطالعه'
                        })`}
                      />
                    );
                  })}
                  {dayDots.length > 4 && (
                    <span
                      className={`text-[8px] font-black leading-none shrink-0 ${
                        isSelected ? 'text-white' : 'text-neutral'
                      }`}
                    >
                      +{toFaDigits(dayDots.length - 4)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {(() => {
        const selSpecial = getCalendarSpecialDay(selectedDateObj);
        if (!selSpecial.isHoliday && selSpecial.specialEvents.length === 0) return null;
        return (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-base-500/25">
            {selSpecial.isHoliday && (
              <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-danger-soft text-danger border border-danger/25">
                تعطیل
              </span>
            )}
            {selSpecial.specialEvents.map((ev) => (
              <span
                key={ev.type}
                className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/25"
              >
                {ev.icon} {ev.title}
              </span>
            ))}
          </div>
        );
      })()}
    </section>
  );
}
