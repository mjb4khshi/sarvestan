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
import { toFaDigits } from '../utils/faDigits';

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
    const unsub = subscribeStore(() => setStoreVer((v) => v + 1));

    return () => {
      window.removeEventListener('sarvStudyUpdated', handleStudyUpdate);
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
            const dayActivity = activityMap[d.isoDate];
            const hasStudy = dayActivity && dayActivity.totalMinutes > 0;
            const dayClasses = getClassesForDate(d.date);
            const dayExams = getExamsForDate(d.isoDate, monthGrid.year, monthGrid.month, d.dayNumber);
            const hasExam = dayExams.length > 0;

            // جمع‌آوری نقاط رویدادهای چندگانه روز دقیقاً مشابه تقویم پلنر مطالعه
            const dayDots = [];
            const seenCourses = new Set();

            for (const ex of dayExams) {
              const key = `e:${ex.course}`;
              if (!seenCourses.has(key)) {
                seenCourses.add(key);
                dayDots.push({
                  name: `امتحان ${ex.course}`,
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

            if (dayActivity && Array.isArray(dayActivity.sessions)) {
              for (const s of dayActivity.sessions) {
                const key = `s:${s.courseName}`;
                if (!seenCourses.has(key)) {
                  seenCourses.add(key);
                  dayDots.push({
                    name: s.courseName,
                    tone: getCourseColor(s.courseName) || s.color,
                    isUni: false,
                  });
                }
              }
            }

            return (
              <button
                key={d.isoDate}
                type="button"
                onClick={() => setSelectedDate(d.isoDate)}
                className={`h-12 rounded-xl flex flex-col items-center justify-between py-1 transition-all active:scale-95 cursor-pointer relative ${
                  isSelected
                    ? 'bg-primary text-primary-content font-black shadow-sm ring-2 ring-primary/40'
                    : hasExam
                    ? 'bg-danger-soft/25 hover:bg-danger-soft/40 text-base-content font-black border border-danger/40 ring-1 ring-danger/30'
                    : isToday
                    ? 'bg-primary-soft text-primary font-black border border-primary/40'
                    : hasStudy
                    ? 'bg-base-500/25 hover:bg-base-500/40 text-base-content font-bold'
                    : 'bg-base-500/10 hover:bg-base-500/20 text-neutral'
                }`}
              >
                {/* شماره روز و نشانگر امتحان */}
                <div className="w-full flex items-center justify-between px-1">
                  {hasExam ? (
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white text-danger' : 'bg-danger text-white shadow-xs'
                      }`}
                      title={`موعد امتحان: ${dayExams.map((e) => e.course).join('، ')}`}
                    >
                      <GraduationCap className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span className="w-2" />
                  )}
                  <span className="text-[12px] font-mono leading-none">
                    {toFaDigits(d.dayNumber)}
                  </span>
                  <span className="w-2" />
                </div>

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
                            : dotItem.isExam
                            ? 'bg-danger ring-1 ring-danger/60 shadow-xs'
                            : `${cMeta.dot} ring-1 ring-black/20 shadow-xs`
                        }`}
                        title={`${dotItem.name} (${
                          dotItem.isExam ? 'امتحان' : dotItem.isUni ? 'کلاس دانشگاه' : 'مطالعه'
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
    </section>
  );
}
