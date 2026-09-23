import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Table2,
  Clock,
  MapPin,
  User,
  Sparkles,
  BookOpen,
  Info,
  CalendarCheck,
  ChevronLeft,
  GraduationCap,
  Timer,
  AlertCircle,
  Hash,
  BellRing,
  CalendarPlus,
  Loader2,
  CheckCircle2,
  Plus,
  Pencil,
  Edit3,
} from 'lucide-react';
import { isNativeAlarms, hasClassAlarmPlugin, exportExamToCalendar } from '../services/classAlarms';
import { getScheduleMatrix, getExamsView, parseClassTime, getToneForCourse } from '../data/viewModel';
import { toFaDigits } from '../utils/faDigits';
import ClassAlarmModal from '../components/ClassAlarmModal';
import CourseEditModal from '../components/CourseEditModal';
import ExamEditModal from '../components/ExamEditModal';
import {
  getCurrentTermSchedule,
  updateScheduleCourse,
  addScheduleCourse,
  deleteScheduleCourse,
  updateExamInStore,
  addExamToStore,
  deleteExamFromStore,
  resolveCurrentTermId,
} from '../services/behestan';

const edge = {
  primary: 'border-r-primary bg-primary-soft text-primary',
  success: 'border-r-success bg-success-soft text-success',
  info: 'border-r-info bg-info-soft text-info',
  warn: 'border-r-warn bg-warn-soft text-warn',
  danger: 'border-r-danger bg-danger-soft text-danger',
  accent: 'border-r-accent bg-accent-soft text-accent',
  secondary: 'border-r-secondary bg-secondary-soft text-secondary',
};

const borderEdge = {
  primary: 'border-r-primary',
  success: 'border-r-success',
  info: 'border-r-info',
  warn: 'border-r-warn',
  danger: 'border-r-danger',
  accent: 'border-r-accent',
  secondary: 'border-r-secondary',
};

const cellTone = {
  primary: 'bg-primary-soft text-primary border-primary-soft',
  success: 'bg-success-soft text-success border-success-soft',
  info: 'bg-info-soft text-info border-info-soft',
  warn: 'bg-warn-soft text-warn border-warn-soft',
  danger: 'bg-danger-soft text-danger border-danger-soft',
  accent: 'bg-accent-soft text-accent border-accent-soft',
  secondary: 'bg-secondary-soft text-secondary border-secondary-soft',
};

export default function ScheduleScreen({ initialView = 'cards', onViewChange }) {
  const [activeTab, setActiveTab] = useState(initialView);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null); // null = همه روزها
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [exportingExamId, setExportingExamId] = useState(null);
  const [calendarFeedback, setCalendarFeedback] = useState('');

  // وضعیت‌های مربوط به ویرایش دروس و امتحانات
  const [editingCourse, setEditingCourse] = useState(null);
  const [defaultDayForModal, setDefaultDayForModal] = useState('شنبه');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  const { days, slots, cells } = getScheduleMatrix();
  const EXAMS_DATA = getExamsView();

  const handleTabChange = (view) => {
    setActiveTab(view);
    if (onViewChange) onViewChange(view);
  };

  const showToast = (msg) => {
    setCalendarFeedback(msg);
    setTimeout(() => setCalendarFeedback(''), 4000);
  };

  const handleExportExam = async (exam) => {
    try {
      setExportingExamId(exam.id);
      const res = await exportExamToCalendar(exam);
      if (res?.ok) {
        showToast(`امتحان «${exam.course}» در تقویم باز شد.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExportingExamId(null);
    }
  };

  // مدیریت باز کردن ویرایش و افزودن درس
  const handleOpenAddCourse = (day = null) => {
    setEditingCourse(null);
    const chosenDay =
      day || (selectedDayIndex !== null && days[selectedDayIndex] ? days[selectedDayIndex] : 'شنبه');
    setDefaultDayForModal(chosenDay);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (cardCourse) => {
    if (!cardCourse) return;
    const fullList = getCurrentTermSchedule() || [];

    const targetId = cardCourse.id ? String(cardCourse.id).trim() : null;
    const targetCode = cardCourse.code ? String(cardCourse.code).trim() : null;
    const targetName = (cardCourse.name || cardCourse.title || '').trim();

    // تطابق دقیق با لیست دروس فقط بر اساس شناسه‌ها و مقادیر معتبر و غیرخالی
    const hit = fullList.find((item) => {
      if (!item) return false;
      const itemId = item.id ? String(item.id).trim() : null;
      const itemCode = item.code ? String(item.code).trim() : null;
      const itemName = (item.name || item.title || '').trim();

      // ۱. تطابق با کد درس
      if (targetCode && itemCode && targetCode === itemCode) return true;
      // ۲. تطابق با شناسه
      if (targetId && itemId && targetId === itemId) return true;
      // ۳. تطابق با نام درس
      if (targetName && itemName && targetName === itemName) return true;

      return false;
    });

    if (hit) {
      setEditingCourse(hit);
    } else if (cardCourse.daySlots || cardCourse.days) {
      setEditingCourse(cardCourse);
    } else {
      setEditingCourse({
        id: targetId || `temp_${Date.now()}`,
        name: targetName,
        code: targetCode || '',
        professor: cardCourse.professor || '',
        hall: cardCourse.room || cardCourse.hall || '',
        time: cardCourse.time || cardCourse.slot || '',
        days: cardCourse.day ? [cardCourse.day] : [],
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (courseData) => {
    const currentTerm = resolveCurrentTermId();
    if (editingCourse && (editingCourse.id || editingCourse.code)) {
      updateScheduleCourse(currentTerm, editingCourse.id || editingCourse.code, courseData);
      showToast(`اطلاعات درس «${courseData.name}» به‌روزرسانی شد.`);
    } else {
      addScheduleCourse(currentTerm, courseData);
      showToast(`درس «${courseData.name}» به برنامه اضافه شد.`);
    }
  };

  const handleDeleteCourse = (identifier) => {
    const currentTerm = resolveCurrentTermId();
    deleteScheduleCourse(currentTerm, identifier);
    showToast('درس با موفقیت از برنامه حذف شد.');
  };

  // مدیریت باز کردن ویرایش و افزودن امتحان
  const handleOpenAddExam = () => {
    setEditingExam(null);
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam) => {
    setEditingExam(exam);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (examData) => {
    const currentTerm = resolveCurrentTermId();
    if (editingExam && (editingExam.id || editingExam.code)) {
      updateExamInStore(currentTerm, editingExam.id || editingExam.code, examData);
      showToast(`نوبت امتحان «${examData.course}» اصلاح شد.`);
    } else {
      addExamToStore(currentTerm, examData);
      showToast(`نوبت امتحان «${examData.course}» به لیست اضافه شد.`);
    }
  };

  const handleDeleteExam = (identifier) => {
    const currentTerm = resolveCurrentTermId();
    deleteExamFromStore(currentTerm, identifier);
    showToast('نوبت امتحان با موفقیت حذف شد.');
  };

  // محاسبه آمار برنامه
  const totalClasses = Object.keys(cells).length;
  const canAlarms = isNativeAlarms() && hasClassAlarmPlugin();

  return (
    <div className="px-4 pt-4 space-y-4 mobile-pad-bottom">
      {/* هدر بالایی با کنترل تب قطعه‌ای سرو (sarv-seg) */}
      <div className="sarv-card p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14px] font-bold text-base-content truncate">
                {activeTab === 'exams' ? 'برنامه امتحانات پایان‌ترم' : 'برنامه آموزشی نیمسال'}
              </h2>
              <p className="text-[11px] text-neutral truncate">
                {activeTab === 'exams'
                  ? `${toFaDigits(EXAMS_DATA.length)} نوبت امتحان نهایی ثبت‌شده`
                  : `${toFaDigits(totalClasses)} جلسه کلاس در طول هفته`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={activeTab === 'exams' ? handleOpenAddExam : handleOpenAddCourse}
              className="px-2.5 py-1.5 rounded-xl bg-primary text-primary-content text-[11px] font-bold flex items-center gap-1 shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{activeTab === 'exams' ? 'افزودن امتحان' : 'افزودن درس'}</span>
            </button>

            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 font-mono whitespace-nowrap shrink-0">
              {activeTab === 'exams' ? 'گزارش ۴۲۸' : 'گزارش ۷۸'}
            </span>
          </div>
        </div>

        {/* پیام تایید و فیدبک عملیات */}
        <AnimatePresence>
          {calendarFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-2.5 rounded-xl bg-success-soft text-success text-[11.5px] font-bold border border-success/30 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{calendarFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* سوییچر ۳گانه بین روزانه، ماتریس هفتگی و امتحانات */}
        <div className="sarv-seg w-full">
          <button
            type="button"
            onClick={() => handleTabChange('cards')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] rounded-xl transition-colors outline-none ${
              activeTab === 'cards'
                ? 'text-primary-content font-bold z-10'
                : 'text-neutral hover:text-base-content font-medium z-10'
            }`}
          >
            {activeTab === 'cards' && (
              <motion.span
                layoutId="scheduleViewPill"
                className="absolute inset-0 bg-primary rounded-xl z-0 shadow-sm"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              نمای روزانه
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('matrix')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] rounded-xl transition-colors outline-none ${
              activeTab === 'matrix'
                ? 'text-primary-content font-bold z-10'
                : 'text-neutral hover:text-base-content font-medium z-10'
            }`}
          >
            {activeTab === 'matrix' && (
              <motion.span
                layoutId="scheduleViewPill"
                className="absolute inset-0 bg-primary rounded-xl z-0 shadow-sm"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <Table2 className="w-3.5 h-3.5" />
              جدول هفتگی
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('exams')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] rounded-xl transition-colors outline-none ${
              activeTab === 'exams'
                ? 'text-primary-content font-bold z-10'
                : 'text-neutral hover:text-base-content font-medium z-10'
            }`}
          >
            {activeTab === 'exams' && (
              <motion.span
                layoutId="scheduleViewPill"
                className="absolute inset-0 bg-primary rounded-xl z-0 shadow-sm"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" />
              امتحانات
            </span>
          </button>
        </div>

        {/* نوار دسترسی ویژه به یادآور و آلارم کلاس‌ها و سماد */}
        {activeTab !== 'exams' && canAlarms && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-primary-soft/60 border border-primary/25 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0 pr-0.5">
              <span className="w-8 h-8 rounded-xl bg-primary text-primary-content grid place-items-center shrink-0 shadow-xs">
                <BellRing className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-base-content truncate">
                  یادآور هوشمند کلاس‌ها و سامانه سماد
                </p>
                <p className="text-[10px] text-neutral truncate">
                  اعلان شروع کلاس، آلارم ساعت گوشی و رزرو غذای سماد
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAlarmModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-content text-[11.5px] font-bold shrink-0 shadow-xs hover:bg-primary/90 active:scale-95 transition"
            >
              تنظیمات
            </button>
          </div>
        )}
      </div>

      {/* محتوای نمای کارتی (روزانه) */}
      {activeTab === 'cards' && (
        <motion.div
          key="cards-view"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* نوار فیلتر روزهای هفته با انیمیشن حرکت مستطیل فعال */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar relative">
            <button
              type="button"
              onClick={() => setSelectedDayIndex(null)}
              className={`relative px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors select-none ${
                selectedDayIndex === null
                  ? 'text-primary-content'
                  : 'bg-base-500/20 text-neutral hover:bg-base-500/40'
              }`}
            >
              {selectedDayIndex === null && (
                <motion.span
                  layoutId="dayActivePill"
                  className="absolute inset-0 bg-primary rounded-xl z-0 shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10">همه روزها</span>
            </button>

            {days.map((day, idx) => {
              const allSched = getCurrentTermSchedule() || [];
              const dayClassesCount = allSched.filter((c) => {
                const sList = c.daySlots || [];
                if (sList.length) return sList.some((s) => s.day === day);
                return Array.isArray(c.days) && c.days.includes(day);
              }).length;
              const isSelected = selectedDayIndex === idx;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDayIndex(isSelected ? null : idx)}
                  className={`relative px-3 py-1.5 rounded-xl text-[11px] whitespace-nowrap flex items-center gap-1.5 transition-colors select-none cursor-pointer ${
                    isSelected
                      ? 'text-primary-content font-bold'
                      : 'bg-base-500/20 text-neutral hover:bg-base-500/40 font-medium'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="dayActivePill"
                      className="absolute inset-0 bg-primary rounded-xl z-0 shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{day}</span>
                  {dayClassesCount > 0 && (
                    <span
                      className={`relative z-10 w-4 h-4 rounded-full text-[9px] grid place-items-center font-mono ${
                        isSelected ? 'bg-black/25 text-white' : 'bg-base-500/50 text-neutral'
                      }`}
                    >
                      {toFaDigits(dayClassesCount)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* لیست روزها و کارت‌های کلاس */}
          <div className="space-y-4">
            {days.map((day, di) => {
              if (selectedDayIndex !== null && selectedDayIndex !== di) return null;

              const allSched = getCurrentTermSchedule() || [];
              const dayCourses = allSched
                .filter((c) => {
                  const sList = c.daySlots || [];
                  if (sList.length) return sList.some((s) => s.day === day);
                  return Array.isArray(c.days) && c.days.includes(day);
                })
                .map((c) => {
                  const specificSlot = (c.daySlots || []).find((s) => s.day === day);
                  const time = specificSlot?.time || c.time || c.classTimeRaw || '';
                  const room =
                    specificSlot?.hall && specificSlot.hall !== 'ـ'
                      ? specificSlot.hall
                      : c.hall || 'ـ';
                  return {
                    id: c.id || c.code,
                    code: c.code,
                    title: c.name || c.title || 'درس',
                    professor: c.professor || 'ـ',
                    time,
                    room,
                    color: getToneForCourse(c, allSched),
                    course: c,
                  };
                })
                .sort((a, b) => {
                  const ta = parseClassTime(a.time).startHour ?? 999;
                  const tb = parseClassTime(b.time).startHour ?? 999;
                  return ta - tb;
                });

              if (!dayCourses.length) {
                if (selectedDayIndex === di) {
                  return (
                    <div key={day} className="sarv-card p-6 text-center space-y-3">
                      <p className="text-[13.5px] font-bold text-base-content">
                        هیچ کلاسی در روز {day} ثبت نشده است.
                      </p>
                      <p className="text-[11.5px] text-neutral max-w-xs mx-auto">
                        می‌توانید کلاس جبرانی یا درس دلخواه خود را برای روز {day} اضافه کنید.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenAddCourse(day)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-content text-[12px] font-bold shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>افزودن درس به {day}</span>
                      </button>
                    </div>
                  );
                }
                return null;
              }

              return (
                <section key={day} className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[13px] font-bold text-primary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {day}
                    </h3>
                    <span className="text-[11px] text-neutral">
                      {toFaDigits(dayCourses.length)} درس
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {dayCourses.map((c, ci) => (
                      <motion.article
                        key={`${day}-${c.title}-${c.id || ci}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ci * 0.04 }}
                        className={`sarv-card p-4 hover:border-primary/40 transition-colors border-r-4 ${
                          borderEdge[c.color] || 'border-r-primary'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[14px] font-bold text-base-content truncate">
                              {c.title}
                            </h4>
                            <div className="mt-1 flex items-center gap-2 text-[11.5px] text-neutral">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-primary/70" />
                                {c.professor}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCourse(c.course || c)}
                              className="p-1.5 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content transition active:scale-90 cursor-pointer"
                              title="ویرایش این درس"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                cellTone[c.color] || cellTone.primary
                              }`}
                            >
                              حضوری
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-base-500/30 flex items-center justify-between text-[11.5px] text-base-content/90">
                          <div className="flex items-center gap-1.5 text-neutral font-medium">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span className="font-mono text-base-content font-bold">
                              {toFaDigits(c.time || '—')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-neutral">
                            <MapPin className="w-3.5 h-3.5 text-neutral" />
                            <span>{toFaDigits(c.room || '—')}</span>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* محتوای جدول ماتریسی (گزارش ۷۸) */}
      {activeTab === 'matrix' && (
        <motion.div
          key="matrix-view"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* راهنمای اسکرول افقی */}
          <div className="sarv-card px-3.5 py-2.5 flex items-center justify-between text-[11px] text-neutral">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              ماتریس کامل ساعات و روزها
            </span>
            <span className="text-primary font-medium">👈 اسکرول افقی به چپ</span>
          </div>

          {/* محفظه اسکرول جدول */}
          <div className="sarv-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-center border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-base-500/25 border-b border-base-500/40">
                    <th className="sticky right-0 z-20 bg-base/95 backdrop-blur-md px-2.5 py-3 text-[11px] font-bold text-neutral min-w-[78px] border-b border-base-500/40 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.2)]">
                      ساعت
                    </th>
                    {days.map((d) => (
                      <th
                        key={d}
                        className="px-2 py-3 text-[12px] font-bold text-base-content min-w-[115px]"
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot, si) => (
                    <tr
                      key={slot}
                      className={`border-b border-base-500/20 ${si % 2 === 1 ? 'bg-base-500/10' : ''}`}
                    >
                      <td className="sticky right-0 z-10 bg-base/95 backdrop-blur-md px-2 py-2.5 text-[10.5px] text-neutral font-mono whitespace-nowrap shadow-[2px_0_6px_-2px_rgba(0,0,0,0.2)]">
                        {toFaDigits(slot)}
                      </td>
                      {days.map((_, di) => {
                        const cell = cells[`${si}-${di}`];
                        if (!cell) {
                          return (
                            <td key={di} className="p-1 align-top">
                              <div className="h-12 rounded-xl bg-transparent" />
                            </td>
                          );
                        }

                        const items = Array.isArray(cell.items) && cell.items.length ? cell.items : [cell];
                        const hasConflict = items.length > 1;

                        return (
                          <td key={di} className="p-1 align-top min-w-[110px]">
                            {hasConflict && (
                              <div className="mb-1.5 px-2 py-0.5 rounded-lg bg-danger/15 border border-danger/30 text-[9.5px] font-bold text-danger flex items-center justify-between">
                                <span>⚠️ تداخل ({toFaDigits(items.length)})</span>
                              </div>
                            )}
                            <div className="space-y-1.5">
                              {items.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  onClick={() => handleOpenEditCourse(item.course || item)}
                                  className={`rounded-xl border p-2 text-right transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-primary/40 shadow-xs ${
                                    cellTone[item.color] || cellTone.primary
                                  }`}
                                  title="برای مشاهده و ویرایش درس کلیک کنید"
                                >
                                  <p className="text-[11px] font-bold leading-tight line-clamp-2">
                                    {item.title}
                                  </p>
                                  <p className="text-[10px] opacity-80 mt-1 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{toFaDigits(item.room)}</span>
                                  </p>
                                  <p className="text-[9px] opacity-75 truncate mt-0.5">
                                    {item.professor}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sarv-card p-3 flex items-center justify-between text-[11px] text-neutral">
            <span>ساعت نماز و ناهار: {toFaDigits('۱۲:۳۰')} تا {toFaDigits('۱۳:۳۰')}</span>
            <span className="text-primary font-bold">دانشگاه صنعتی خواجه نصیر</span>
          </div>
        </motion.div>
      )}

      {/* محتوای تب سوم: برنامه و روزشمار امتحانات پایان‌ترم (گزارش ۴۲۸) */}
      {activeTab === 'exams' && (
        <motion.div
          key="exams-view"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-3.5"
        >
          {/* کارت وضعیت کلی امتحانات — فقط اگر دیتا باشد */}
          {EXAMS_DATA.length > 0 && EXAMS_DATA[0] && (
          <div className="sarv-card p-4 border border-primary-soft bg-primary-soft/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-primary text-primary-content grid place-items-center shadow-sm">
                  <Timer className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-bold text-base-content">روزشمار امتحانات پایان‌ترم</h3>
                  <p className="text-[11px] text-neutral">
                    اولین امتحان: {EXAMS_DATA[0].course || '—'} ({toFaDigits(EXAMS_DATA[0].daysLeft ?? 0)} روز دیگر)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-primary text-primary-content font-mono shadow-sm">
                {toFaDigits(EXAMS_DATA[0].daysLeft ?? 0)} روز مانده
              </span>
            </div>
          </div>
          )}

          {EXAMS_DATA.length === 0 && (
            <div className="sarv-card p-6 text-center">
              <p className="text-[13px] font-bold text-base-content">امتحانی ثبت نشده</p>
              <p className="text-[12px] text-neutral mt-1">
                بعد از همگام‌سازی، روزشمار امتحانات اینجا می‌آید.
              </p>
            </div>
          )}

          {/* لیست کارت‌های امتحانات با روزشمار */}
          <div className="space-y-3">
            {EXAMS_DATA.map((exam, idx) => {
              const borderCls = borderEdge[exam.color] || 'border-r-primary';
              const toneCls = cellTone[exam.color] || cellTone.primary;
              return (
                <motion.article
                  key={exam.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`sarv-card p-4 hover:border-primary/40 transition-all border-r-4 ${borderCls}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[14px] font-bold text-base-content truncate">
                          {exam.course}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral bg-base-500/40 px-1.5 py-0.5 rounded">
                          کد {toFaDigits(exam.code)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-[11.5px] text-neutral">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-neutral/70" />
                          {exam.instructor}
                        </span>
                        <span className="text-neutral/40">·</span>
                        <span className="font-bold text-base-content/80">
                          {toFaDigits(exam.unit)} واحد
                        </span>
                      </div>
                    </div>

                    {/* بج روزشمار و دکمه ویرایش */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditExam(exam)}
                        className="p-1.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content transition active:scale-90"
                        title="ویرایش نوبت امتحان"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={`text-[10.5px] font-black px-2.5 py-1 rounded-xl font-mono flex items-center gap-1 shadow-xs ${
                          exam.isCritical
                            ? 'bg-danger-soft text-danger border border-danger/25'
                            : exam.isUrgent
                            ? 'bg-warn-soft text-warn border border-warn/25'
                            : `${toneCls} border`
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {toFaDigits(exam.daysLeft)} روز مانده
                      </span>
                    </div>
                  </div>

                  {/* نوار اطلاعات تاریخ، ساعت و حوزه امتحانی */}
                  <div className="mt-3.5 pt-3 border-t border-base-500/30 grid grid-cols-2 gap-2 text-[11.5px]">
                    <div className="flex items-center gap-1.5 text-neutral font-medium">
                      <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>تاریخ:</span>
                      <span className="font-mono font-bold text-base-content">{toFaDigits(exam.examDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral font-medium">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>ساعت:</span>
                      <span className="font-mono font-bold text-base-content">{toFaDigits(exam.examTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral font-medium col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                      <span>محل آزمون:</span>
                      <span className="text-base-content font-bold">{exam.room}</span>
                      <span className="text-neutral/40">·</span>
                      <span className="text-primary font-mono font-bold">شماره صندلی: {toFaDigits(exam.seat)}</span>
                    </div>
                  </div>

                  {/* دکمه افزودن این امتحان به تقویم رسمی گوشی */}
                  <div className="mt-3 pt-2.5 border-t border-base-500/25 flex items-center justify-between">
                    <span className="text-[11px] text-neutral">
                      ثبت موعد این آزمون در تقویم رسمی دستگاه
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExportExam(exam)}
                      disabled={exportingExamId === exam.id}
                      className="px-2.5 py-1.5 rounded-xl bg-primary-soft hover:bg-primary/20 text-primary text-[11px] font-bold border border-primary/25 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                      title="افزودن به تقویم گوشی"
                    >
                      {exportingExamId === exam.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CalendarPlus className="w-3.5 h-3.5" />
                      )}
                      <span>افزودن به تقویم</span>
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="sarv-card p-3 flex items-center justify-between text-[11px] text-neutral">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-warn" />
              همراه داشتن کارت ورود به جلسه (گزارش ۴۲۸) الزامی است.
            </span>
            <span className="text-primary font-bold">آموزش کل</span>
          </div>
        </motion.div>
      )}

      {/* مودال یادآور و آلارم کلاس‌ها */}
      <ClassAlarmModal
        isOpen={isAlarmModalOpen}
        onClose={() => setIsAlarmModalOpen(false)}
      />

      {/* مودال ویرایش و افزودن درس به برنامه هفتگی */}
      <CourseEditModal
        isOpen={isCourseModalOpen}
        course={editingCourse}
        defaultDay={defaultDayForModal}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
      />

      {/* مودال ویرایش و افزودن نوبت امتحان */}
      <ExamEditModal
        isOpen={isExamModalOpen}
        exam={editingExam}
        onClose={() => {
          setIsExamModalOpen(false);
          setEditingExam(null);
        }}
        onSave={handleSaveExam}
        onDelete={handleDeleteExam}
      />
    </div>
  );
}
