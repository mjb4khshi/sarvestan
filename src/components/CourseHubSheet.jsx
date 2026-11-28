import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  MapPin,
  Clock,
  BookOpen,
  Plus,
  Minus,
  Globe,
  ExternalLink,
  CheckCircle2,
  Timer,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import { getStudyTasks, updateTaskStatus } from '../services/studyPlanner';
import { getExamsView } from '../data/viewModel';
import { updateScheduleCourse, resolveCurrentTermId } from '../services/behestan/store';
import { getUniversityLmsUrl } from '../services/behestan/session';
import { getExamCategoryLabel } from '../services/classAlarms';
import { exportScheduleToMehestan } from '../services/mehestanBridge';

export default function CourseHubSheet({
  isOpen,
  course,
  onClose,
  onEditCourse,
  onNavigate,
}) {
  const [absences, setAbsences] = useState(0);
  const [maxAbsences, setMaxAbsences] = useState(3);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!isOpen || !course) return;
    setAbsences(Math.max(0, Number(course.absences) || 0));
    setMaxAbsences(Math.max(1, Number(course.maxAbsences) || 3));
    const allTasks = getStudyTasks() || [];
    const cName = String(course.name || course.title || '').trim();
    const cCode = String(course.code || course.parentCourseCode || '').replace(/\D/g, '');
    setTasks(
      allTasks.filter((t) => {
        if (!t) return false;
        if (cCode && t.courseCode && String(t.courseCode).replace(/\D/g, '') === cCode) return true;
        if (cName && t.courseName && String(t.courseName).includes(cName.replace(/^حل\s*تمرین\s*/, ''))) return true;
        return false;
      })
    );
  }, [isOpen, course]);

  if (!isOpen || !course) return null;

  const isTa = course.classType === 'ta' || course.category === 'ta';
  const courseName = course.name || course.title || 'درس';
  const cCode = String(course.code || course.parentCourseCode || '').replace(/\D/g, '');
  const relatedExams = (getExamsView() || []).filter((ex) => {
    const exCode = String(ex.courseCode || ex.code || '').replace(/\D/g, '');
    if (cCode && exCode && cCode === exCode) return true;
    return ex.course && courseName.includes(ex.course);
  });

  const handleAdjustAbsence = (delta) => {
    const next = Math.max(0, absences + delta);
    setAbsences(next);
    try {
      const term = resolveCurrentTermId();
      updateScheduleCourse(term, course.id || course.name, {
        ...course,
        absences: next,
        maxAbsences,
      });
    } catch {}
  };

  const ratio = Math.min(1, absences / Math.max(1, maxAbsences));
  const meterColor =
    ratio >= 0.85 ? 'bg-danger' : ratio >= 0.5 ? 'bg-warn' : 'bg-success';
  const meterTextColor =
    ratio >= 0.85 ? 'text-danger' : ratio >= 0.5 ? 'text-warn' : 'text-success';

  const slotsText = Array.isArray(course.daySlots) && course.daySlots.length
    ? course.daySlots.map((s) => `${s.day} ${toFaDigits(s.time)}`).join(' · ')
    : [course.day, course.time ? toFaDigits(course.time) : ''].filter(Boolean).join(' · ');

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: '100%', opacity: 0.6 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.6 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/40 p-5 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
        >
          {/* هدر شیت جامع درس */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-base-500/30 shrink-0">
            <div className="min-w-0 text-right">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[15.5px] font-black text-base-content truncate">{courseName}</h3>
                {isTa && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-secondary-soft text-secondary">
                    حل تمرین
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral mt-0.5">
                {course.code ? `کد ${toFaDigits(course.code)} · ` : ''}
                {toFaDigits(course.units ?? 0)} واحد
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onEditCourse && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditCourse(course);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-[11px] font-bold text-base-content flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-base-500/20 hover:bg-base-500/35 text-neutral grid place-items-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto py-3.5 space-y-4 flex-1 text-right">
            {/* مشخصات کلاس */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
              <div className="p-2.5 rounded-xl bg-base-500/15 border border-base-500/25 flex items-center gap-2">
                <User className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate text-base-content font-medium">
                  {course.professor && course.professor !== 'ـ' ? course.professor : 'استاد نامشخص'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-base-500/15 border border-base-500/25 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span className="truncate text-base-content font-medium">
                  {course.hall && course.hall !== 'ـ' ? toFaDigits(course.hall) : (course.room && course.room !== 'ـ' ? toFaDigits(course.room) : 'مکان نامشخص')}
                </span>
              </div>
              {slotsText && (
                <div className="sm:col-span-2 p-2.5 rounded-xl bg-base-500/15 border border-base-500/25 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-info shrink-0" />
                  <span className="text-base-content font-medium">{slotsText}</span>
                </div>
              )}
            </div>

            {/* ثبت غیبت یک‌ضرب + نوار ایمنی غیبت */}
            <div className="p-3.5 rounded-2xl bg-base-500/15 border border-base-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[12.5px] font-bold text-base-content block">مدیریت غیبت‌ها</span>
                  <span className={`text-[11px] font-bold ${meterTextColor}`}>
                    {toFaDigits(absences)} از {toFaDigits(maxAbsences)} جلسه مجاز
                    {ratio >= 0.85 ? ' — هشدار سقف غیبت!' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAdjustAbsence(-1)}
                    disabled={absences <= 0}
                    className="w-8 h-8 rounded-xl bg-base-500/25 hover:bg-base-500/40 disabled:opacity-40 grid place-items-center text-base-content cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustAbsence(1)}
                    className="px-3 h-8 rounded-xl bg-danger-soft text-danger hover:bg-danger hover:text-danger-content font-bold text-[11.5px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+۱ غیبت</span>
                  </button>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-base-500/30 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${meterColor}`}
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
            </div>

            {/* امتحانات و کوییزهای درس */}
            <div className="space-y-1.5">
              <h4 className="text-[12px] font-bold text-neutral flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-warn" />
                امتحانات و کوییزهای مرتبط ({toFaDigits(relatedExams.length)})
              </h4>
              {relatedExams.length > 0 ? (
                relatedExams.map((ex) => (
                  <div
                    key={ex.id || ex.course}
                    className="p-2.5 rounded-xl bg-base-500/15 border border-base-500/25 flex items-center justify-between text-[11.5px]"
                  >
                    <span className="font-bold text-base-content">
                      {getExamCategoryLabel(ex.category)} · {toFaDigits(ex.examDate)}
                    </span>
                    <span className="text-neutral font-mono">{toFaDigits(ex.examTime || '—')}</span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-neutral/80 px-1">امتحان یا کوییزی ثبت نشده است.</p>
              )}
            </div>

            {/* تسک‌های مرتبط */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[12px] font-bold text-neutral flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  کارها و تکالیف درس ({toFaDigits(tasks.length)})
                </h4>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('study');
                    }}
                    className="text-[11px] font-bold text-primary cursor-pointer"
                  >
                    باز کردن پلنر ←
                  </button>
                )}
              </div>
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const next = t.status === 'done' ? 'todo' : 'done';
                      updateTaskStatus(t.id, next);
                      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
                    }}
                    className="w-full p-2.5 rounded-xl bg-base-500/15 border border-base-500/25 flex items-center justify-between text-right text-[11.5px] cursor-pointer hover:border-primary/40"
                  >
                    <span className={t.status === 'done' ? 'line-through text-neutral' : 'text-base-content font-medium'}>
                      {t.title}
                    </span>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${t.status === 'done' ? 'text-success' : 'text-neutral/50'}`} />
                  </button>
                ))
              ) : (
                <p className="text-[11px] text-neutral/80 px-1">تکلیفی برای این درس ثبت نشده است.</p>
              )}
            </div>
          </div>

          {/* میانبرهای پایین شیت: LMS و مهستان */}
          <div className="shrink-0 pt-3 border-t border-base-500/30 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => window.open(course.virtualUrl || getUniversityLmsUrl(), '_blank')}
              className="py-2.5 px-3 rounded-xl bg-primary text-primary-content text-[11.5px] font-bold flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>ورود به کلاس / LMS</span>
            </button>
            <button
              type="button"
              onClick={() => {
                exportScheduleToMehestan();
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl bg-secondary-soft text-secondary border border-secondary/30 text-[11.5px] font-bold flex items-center justify-center gap-1.5 hover:bg-secondary/20 active:scale-95 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>باز کردن در مهستان</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}
