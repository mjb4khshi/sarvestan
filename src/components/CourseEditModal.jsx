import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  User,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Calendar,
  Palette,
  Calculator,
  UserX,
  Minus,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import { getSelectedUniversity } from '../services/behestan/session';
import { getToneForCourse } from '../data/viewModel';
import SarvTimePickerModal from './SarvTimePickerModal';
import OdometerNumber from './OdometerNumber';
import NativeCourseSelector from './NativeCourseSelector';

const DAYS_OF_WEEK = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

const THEME_PALETTE = [
  { id: 'primary', label: 'اصلی تم', classBg: 'bg-primary' },
  { id: 'secondary', label: 'ثانویه', classBg: 'bg-secondary' },
  { id: 'accent', label: 'اکسنت', classBg: 'bg-accent' },
  { id: 'info', label: 'اطلاعات', classBg: 'bg-info' },
  { id: 'success', label: 'موفقیت', classBg: 'bg-success' },
  { id: 'warn', label: 'هشدار', classBg: 'bg-warn' },
  { id: 'danger', label: 'سرخ', classBg: 'bg-danger' },
];

function parseStartAndEnd(timeStr) {
  if (!timeStr) return { start: '08:00', end: '10:00' };
  const parts = String(timeStr).split('-');
  const s = (parts[0] || '08:00').trim();
  const e = (parts[1] || '10:00').trim();
  return { start: s, end: e };
}

export default function CourseEditModal({
  isOpen,
  course = null,
  existingCourses = [],
  defaultDay = 'شنبه',
  onClose,
  onSave,
  onDelete,
}) {
  const isEditing = Boolean(course && (course.id || course.name || course.code));
  const isUt = getSelectedUniversity() === 'ut';

  const [classType, setClassType] = useState('lecture'); // 'lecture' | 'ta'
  const [classTypeDropdownOpen, setClassTypeDropdownOpen] = useState(false);
  const [parentCourseName, setParentCourseName] = useState('');
  const [notes, setNotes] = useState('');
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [hall, setHall] = useState('');
  const [units, setUnits] = useState(3);
  const [code, setCode] = useState('');
  const [group, setGroup] = useState('01');
  const [slots, setSlots] = useState([
    { day: 'شنبه', start: '13:30', end: '15:00', hall: '' },
  ]);
  const [includeInGpa, setIncludeInGpa] = useState(true);
  const [color, setColor] = useState('primary');
  const [absences, setAbsences] = useState(0);
  const [maxAbsences, setMaxAbsences] = useState(3);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timePickerState, setTimePickerState] = useState({
    isOpen: false,
    slotIndex: 0,
    field: 'start',
    currentTime: '13:30',
  });

  useEffect(() => {
    if (isOpen) {
      setDeleteConfirmModalOpen(false);
      setClassTypeDropdownOpen(false);
      setParentCourseName('');
      setErrorMsg('');
      if (course) {
        const detectedType =
          course.classType ||
          course.category ||
          (String(course.name || course.title || '').includes('حل تمرین') ? 'ta' : 'lecture');
        setClassType(detectedType);
        setNotes(course.notes || '');
        setName(course.name || course.title || '');
        setProfessor(course.professor || '');
        setHall(course.hall || course.room || course.daySlots?.[0]?.hall || '');
        setUnits(course.units != null ? course.units : 3);
        setCode(course.code || '');
        setGroup(course.group || '01');
        setIncludeInGpa(course.includeInGpa !== false);
        setColor(course.color || 'primary');
        setAbsences(Number(course.absences) || 0);
        setMaxAbsences(course.maxAbsences != null ? Number(course.maxAbsences) : 3);

        if (Array.isArray(course.daySlots) && course.daySlots.length > 0) {
          setSlots(
            course.daySlots.map((s) => {
              const { start, end } = parseStartAndEnd(s.time);
              return {
                day: s.day || 'شنبه',
                start,
                end,
                hall: s.hall || '',
              };
            })
          );
        } else if (Array.isArray(course.days) && course.days.length > 0) {
          const { start, end } = parseStartAndEnd(course.time || course.classTimeRaw);
          setSlots(
            course.days.map((d) => ({
              day: d,
              start,
              end,
              hall: course.hall || '',
            }))
          );
        } else {
          const { start, end } = parseStartAndEnd(course.time || course.classTimeRaw);
          setSlots([
            {
              day: course.day || 'شنبه',
              start,
              end,
              hall: course.hall || '',
            },
          ]);
        }
      } else {
        setClassType('lecture');
        setNotes('');
        setName('');
        setProfessor('');
        setHall('');
        setUnits(3);
        setCode('');
        setGroup('01');
        setIncludeInGpa(true);
        setColor('primary');
        setSlots([{ day: 'شنبه', start: '13:30', end: '15:00', hall: '' }]);
      }
    }
  }, [isOpen, course, defaultDay]);

  const handleSelectParentCourse = (selectedName, selectedCourse) => {
    if (!selectedName) return;
    setParentCourseName(selectedName);
    const parent =
      selectedCourse ||
      existingCourses.find((c) => (c.name || c.title) === selectedName);
    const cleanBaseName = selectedName.replace(/^حل\s*تمرین\s*/, '');
    setName(`حل تمرین ${cleanBaseName}`);
    if (parent) {
      const parentTone =
        parent.color || getToneForCourse(parent, existingCourses) || 'secondary';
      setColor(parentTone);
      if (parent.code) setCode(parent.code);
      setUnits(0);
      setIncludeInGpa(false);
      if (parent.professor && !professor) {
        setProfessor('دستیار آموزشی / TA');
      }
    }
  };

  const handleAddSlot = () => {
    const last = slots[slots.length - 1];
    setSlots([
      ...slots,
      {
        day: 'شنبه',
        start: last?.start || '13:30',
        end: last?.end || '15:00',
        hall: last?.hall || hall || '',
      },
    ]);
  };

  const handleRemoveSlot = (index) => {
    if (slots.length <= 1) return;
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (index, field, value) => {
    const next = [...slots];
    next[index] = { ...next[index], [field]: value };
    setSlots(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('لطفاً نام درس را وارد کنید.');
      return;
    }

    const normName = (str) =>
      String(str || '')
        .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
        .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
        .replace(/[يی]/g, 'ی')
        .replace(/[كک]/g, 'ک')
        .replace(/[\u200c\s]+/g, ' ')
        .trim()
        .toLowerCase();

    const normalizedInputName = normName(trimmedName);

    // بررسی نام تکراری در میان دروس موجود
    if (Array.isArray(existingCourses) && existingCourses.length > 0) {
      const isDuplicate = existingCourses.some((c) => {
        if (!c) return false;
        // اگر در حال ویرایش همین درس هستیم، خودش را مستثنی کن
        if (isEditing) {
          if (course?.id && c?.id && String(course.id) === String(c.id)) return false;
          if (course?.code && c?.code && String(course.code) === String(c.code)) return false;
          if (normName(course?.name || course?.title) === normName(c?.name || c?.title)) return false;
        }
        return normName(c?.name || c?.title) === normalizedInputName;
      });

      if (isDuplicate) {
        setErrorMsg('درسی با این نام قبلاً ایجاد شده است.');
        return;
      }
    }

    if (!slots.length) {
      setErrorMsg('حداقل یک جلسه برای این درس تعیین کنید.');
      return;
    }

    const firstSlot = slots[0];
    const combinedDays = [...new Set(slots.map((s) => s.day))];
    const timeFormatted = `${firstSlot.start}-${firstSlot.end}`;
    const userHall = hall.trim();

    const formattedDaySlots = slots.map((s) => ({
      day: s.day,
      time: `${s.start}-${s.end}`,
      hall: userHall || 'ـ',
    }));

    const resultCourse = {
      ...(course || {}),
      name: name.trim(),
      title: name.trim(),
      professor: professor.trim(),
      hall: userHall || 'ـ',
      room: userHall || 'ـ',
      units: Number(units) || 0,
      code: code.trim(),
      group: group.trim(),
      days: combinedDays,
      day: combinedDays[0] || 'شنبه',
      time: timeFormatted,
      classTimeRaw: timeFormatted,
      daySlots: formattedDaySlots,
      includeInGpa: Boolean(includeInGpa),
      color: color || 'primary',
      absences: Math.max(0, Number(absences) || 0),
      maxAbsences: Math.max(1, Number(maxAbsences) || 3),
      classType,
      category: classType,
      notes: notes.trim(),
    };

    onSave(resultCourse);
    onClose();
  };

  const handleDelete = () => {
    setDeleteConfirmModalOpen(true);
  };

  const handleConfirmActualDelete = () => {
    if (course) {
      onDelete(course);
    }
    setDeleteConfirmModalOpen(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/40 p-5 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر مودال */}
            <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-primary/15 text-primary grid place-items-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-[14.5px] font-black text-base-content">
                    {isEditing ? 'ویرایش اطلاعات درس' : 'افزودن درس جدید به برنامه'}
                  </h3>
                  <p className="text-[11px] text-neutral">
                    تغییرات در برنامه هفتگی، کارت‌ها و صفحه اصلی اعمال می‌شود
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content grid place-items-center transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* بدنه اسکرول‌پذیر فرم با فوتر شناور ثابت */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto py-3 space-y-3.5 flex-1 pr-0.5">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-danger-soft text-danger text-[11.5px] font-bold border border-danger/30 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {isEditing && isUt && (
                  <div className="p-2.5 rounded-xl bg-primary-soft/40 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-[11.5px] font-bold text-base-content">
                        کلاس مجازی دانشگاه تهران
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(course?.virtualUrl || 'https://elearning.ut.ac.ir/', '_blank')}
                      className="px-2.5 py-1 rounded-lg bg-primary text-primary-content text-[11px] font-bold hover:brightness-110 active:scale-95 transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Globe className="w-3 h-3" />
                      <span>ورود به کلاس</span>
                    </button>
                  </div>
                )}

                {/* انتخاب نوع کلاس: سلکتور مدرن با منوی اختصاصی بدون تب */}
                <div className="relative">
                  <label className="text-[11.5px] font-bold text-neutral block mb-1">
                    نوع کلاس:
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setClassTypeDropdownOpen((v) => !v)}
                      className="w-full p-2.5 rounded-xl bg-base-500/15 hover:bg-base-500/25 border border-base-500/30 text-right flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            classType === 'ta' ? 'bg-secondary' : 'bg-primary'
                          }`}
                        />
                        <span className="text-xs font-bold text-base-content">
                          {classType === 'ta'
                            ? 'حل تمرین و دستیار آموزشی (TA)'
                            : 'کلاس اصلی استاد'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral transition-transform ${
                          classTypeDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {classTypeDropdownOpen && (
                      <div className="absolute top-full mt-1.5 right-0 left-0 z-30 p-1.5 rounded-2xl bg-base border border-base-500/40 shadow-xl space-y-1">
                        {[
                          {
                            id: 'lecture',
                            label: 'کلاس اصلی استاد',
                            desc: 'کلاس‌های رسمی طبق چارت و برنامه آموزشی',
                            dot: 'bg-primary',
                          },
                          {
                            id: 'ta',
                            label: 'حل تمرین و دستیار آموزشی (TA)',
                            desc: 'کلاس‌های رفع اشکال و تمرین دانشجویی',
                            dot: 'bg-secondary',
                          },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setClassType(opt.id);
                              setClassTypeDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between transition-all cursor-pointer ${
                              classType === opt.id
                                ? 'bg-primary-soft text-primary font-bold'
                                : 'hover:bg-base-500/20 text-base-content'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                              <div>
                                <p className="text-xs font-bold">{opt.label}</p>
                                <p className="text-[10px] text-neutral">{opt.desc}</p>
                              </div>
                            </div>
                            {classType === opt.id && (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* در حالت حل تمرین: انتخاب نیتیو درس مبنا */}
                {classType === 'ta' && Array.isArray(existingCourses) && existingCourses.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-neutral block">
                      انتخاب درس مبنا برای حل تمرین:
                    </label>
                    <NativeCourseSelector
                      value={parentCourseName}
                      onChange={handleSelectParentCourse}
                      courses={existingCourses}
                      modalTitle="انتخاب درس اصلی برای حل تمرین"
                      subLabel="نام، رنگ و کد درس خودکار هماهنگ می‌شود"
                      placeholder="انتخاب درس برای حل تمرین..."
                    />
                  </div>
                )}

              {/* نام درس */}
              <div>
                <label className="text-[11.5px] font-bold text-neutral block mb-1">
                  نام درس <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: طراحی الگوریتم"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[13px] font-bold focus:border-primary focus:bg-base outline-none transition"
                  required
                />
              </div>

              {/* نام استاد و محل تشکیل */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11.5px] font-bold text-neutral block mb-1">
                    نام استاد
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={professor}
                      onChange={(e) => setProfessor(e.target.value)}
                      placeholder="مثال: دکتر حسینی"
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12.5px] font-medium focus:border-primary focus:bg-base outline-none transition"
                    />
                    <User className="w-4 h-4 text-neutral/60 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-neutral block mb-1">
                    شماره کلاس یا مکان
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={hall}
                      onChange={(e) => setHall(e.target.value)}
                      placeholder="مثال: کلاس ۱۰۴ - دانشکده برق"
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12.5px] font-medium focus:border-primary focus:bg-base outline-none transition"
                    />
                    <MapPin className="w-4 h-4 text-neutral/60 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* تعداد واحد، کد درس و گروه */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-neutral block mb-1">
                    تعداد واحد
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12.5px] text-center font-bold font-mono focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral block mb-1">
                    کد درس
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="۴۰۱۰۲۵"
                    className="w-full px-2.5 py-2 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12px] text-center font-mono focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral block mb-1">
                    گروه
                  </label>
                  <input
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    placeholder="۰۱"
                    className="w-full px-2.5 py-2 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12px] text-center font-mono focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              {/* انتخاب رنگ درس از پالت تم */}
              <div className="p-3 rounded-2xl bg-base-500/10 border border-base-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11.5px] font-bold text-base-content flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    رنگ درس از پالت تم
                  </label>
                  <span className="text-[10px] text-neutral font-medium">
                    برای کارت و بج مکان
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  {THEME_PALETTE.map((pal) => {
                    const isSelected = color === pal.id;
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => setColor(pal.id)}
                        className={`relative flex-1 py-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                          isSelected
                            ? 'border-primary shadow-xs ring-2 ring-primary/30 bg-base'
                            : 'border-transparent hover:bg-base-500/15'
                        }`}
                        title={pal.label}
                      >
                        <span className={`w-5 h-5 rounded-full ${pal.classBg} shadow-xs grid place-items-center`}>
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </span>
                        <span className={`text-[9.5px] font-bold ${isSelected ? 'text-primary' : 'text-neutral'}`}>
                          {pal.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* یادداشت اختصاصی کلاس (بارم‌بندی، حضور غیاب، اختیاری بودن و...) */}
              <div>
                <label className="text-[11.5px] font-bold text-neutral block mb-1">
                  یادداشت اختصاصی کلاس:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="مثال: حضور غیاب اختیاری است، ۲ نمره کوییز کلاسی، پروژه پایان‌ترم و..."
                  className="w-full px-3.5 py-2 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12px] font-medium focus:border-primary focus:bg-base outline-none transition resize-none"
                />
              </div>

              {/* تیک اضافه کردن درس به شبیه‌ساز معدل */}
              <div
                onClick={() => setIncludeInGpa((prev) => !prev)}
                className="p-3 rounded-2xl bg-base-500/10 border border-base-500/20 flex items-center justify-between gap-3 cursor-pointer hover:bg-base-500/15 transition select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-xl grid place-items-center shrink-0 transition-colors ${
                      includeInGpa ? 'bg-primary/15 text-primary' : 'bg-base-500/30 text-neutral'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[12px] font-bold text-base-content block">
                      محاسبه در شبیه‌ساز معدل
                    </span>
                    <span className="text-[10.5px] text-neutral block">
                      این درس در بخش محاسبه و شبیه‌ساز معدل ترم لحاظ شود
                    </span>
                  </div>
                </div>

                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 flex items-center shadow-inner ${
                    includeInGpa ? 'bg-primary justify-end' : 'bg-base-500/40 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block transition-all" />
                </div>
              </div>

              {/* شمارنده و تنظیم غیبت‌های مجاز درس */}
              <div className="p-3.5 rounded-2xl bg-base-500/10 border border-base-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-warn-soft text-warn grid place-items-center shrink-0">
                      <UserX className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[12px] font-bold text-base-content block">
                        وضعیت حضور و غیاب
                      </span>
                      <span className="text-[10px] text-neutral block">
                        قانون ۳/۱۶ یا سقف مجاز جلسات غیبت
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg font-mono ${
                      absences >= maxAbsences
                        ? 'bg-danger text-danger-content'
                        : absences === maxAbsences - 1
                        ? 'bg-warn text-warn-content'
                        : 'bg-success-soft text-success'
                    }`}
                  >
                    {absences >= maxAbsences
                      ? 'خطر حذف درس'
                      : absences === maxAbsences - 1
                      ? 'فقط ۱ غیبت مانده'
                      : 'وضعیت امن'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* تعداد جلسات غیبت ثبت‌شده */}
                  <div className="p-2.5 rounded-xl bg-base border border-base-500/25 space-y-1.5">
                    <label className="text-[10.5px] text-neutral font-bold block text-center">
                      غیبت‌های انجام‌شده
                    </label>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setAbsences((a) => Math.max(0, a - 1))}
                        className="w-7 h-7 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-base-content grid place-items-center active:scale-90 transition cursor-pointer"
                        title="کاهش غیبت"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <OdometerNumber
                        value={absences}
                        height={24}
                        className="text-[17px] font-black text-base-content"
                      />
                      <button
                        type="button"
                        onClick={() => setAbsences((a) => a + 1)}
                        className="w-7 h-7 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-base-content grid place-items-center active:scale-90 transition cursor-pointer"
                        title="افزایش غیبت"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* سقف مجاز غیبت */}
                  <div className="p-2.5 rounded-xl bg-base border border-base-500/25 space-y-1.5">
                    <label className="text-[10.5px] text-neutral font-bold block text-center">
                      سقف غیبت مجاز
                    </label>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setMaxAbsences((m) => Math.max(1, m - 1))}
                        className="w-7 h-7 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-base-content grid place-items-center active:scale-90 transition cursor-pointer"
                        title="کاهش سقف مجاز"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <OdometerNumber
                        value={maxAbsences}
                        height={24}
                        className="text-[17px] font-black text-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setMaxAbsences((m) => m + 1)}
                        className="w-7 h-7 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-base-content grid place-items-center active:scale-90 transition cursor-pointer"
                        title="افزایش سقف مجاز"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* جلسات و ساعات هفتگی */}
              <div className="pt-1 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-base-content flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    جلسات و ساعات برگزاری در هفته:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن جلسه</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {slots.map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-2xl bg-base-500/10 border border-base-500/25 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary">
                          جلسه {toFaDigits(sIdx + 1)}:
                        </span>
                        {slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(sIdx)}
                            className="p-1 rounded-lg text-danger hover:bg-danger/10 transition"
                            title="حذف این جلسه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* انتخاب روز هفته با چیپ‌ها */}
                      <div className="flex flex-wrap gap-1">
                        {DAYS_OF_WEEK.map((d) => {
                          const isSel = slot.day === d;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleUpdateSlot(sIdx, 'day', d)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                isSel
                                  ? 'bg-primary text-primary-content shadow-xs'
                                  : 'bg-base text-base-content/80 border border-base-500/30 hover:border-primary/40'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>

                      {/* بازه ساعتی شروع و پایان با سلکتور حرفه‌ای چرخشی */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="text-[10px] text-neutral font-medium block mb-1">
                            ساعت شروع:
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setTimePickerState({
                                isOpen: true,
                                slotIndex: sIdx,
                                field: 'start',
                                currentTime: slot.start || '13:30',
                              })
                            }
                            className="w-full px-2.5 py-2 rounded-xl bg-base border border-base-500/30 hover:border-primary/50 text-[12.5px] font-bold font-mono text-base-content flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                          >
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{toFaDigits(slot.start || '۱۳:۳۰')}</span>
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral font-medium block mb-1">
                            ساعت پایان:
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setTimePickerState({
                                isOpen: true,
                                slotIndex: sIdx,
                                field: 'end',
                                currentTime: slot.end || '15:00',
                              })
                            }
                            className="w-full px-2.5 py-2 rounded-xl bg-base border border-base-500/30 hover:border-primary/50 text-[12.5px] font-bold font-mono text-base-content flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                          >
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{toFaDigits(slot.end || '۱۵:۰۰')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

              {/* اکشن‌های پایین فرم — به صورت شناور و چسبیده در پایین مودال */}
              <div className="shrink-0 pt-3 border-t border-base-500/30 flex items-center gap-2 bg-base">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-2.5 rounded-xl text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer bg-danger-soft text-danger hover:bg-danger/20 border border-danger/20"
                    title="حذف درس از برنامه سروستان"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف درس</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content text-[12px] font-bold transition active:scale-95 cursor-pointer"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-content text-[12px] font-bold hover:brightness-110 transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'ذخیره تغییرات' : 'افزودن به برنامه'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* مودال چرخشی انتخاب زمان */}
    <SarvTimePickerModal
      isOpen={timePickerState.isOpen}
      initialTime={timePickerState.currentTime}
      title={timePickerState.field === 'start' ? 'ساعت شروع کلاس' : 'ساعت پایان کلاس'}
      subtitle="ساعت و دقیقه برگزاری کلاس را مشخص کنید"
      onClose={() => setTimePickerState((prev) => ({ ...prev, isOpen: false }))}
      onConfirm={(newTime) => {
        handleUpdateSlot(timePickerState.slotIndex, timePickerState.field, newTime);
        setTimePickerState((prev) => ({ ...prev, isOpen: false }));
      }}
    />

    {/* مودال تایید اختصاصی حذف درس از سروستان */}
    {typeof document !== 'undefined' &&
      createPortal(
        <AnimatePresence>
          {deleteConfirmModalOpen && (
            <div
              className="fixed inset-0 z-[100060] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
              onClick={() => setDeleteConfirmModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 12 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm sarv-card p-5 space-y-4 border border-danger/30 shadow-2xl text-center select-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-danger-soft text-danger mx-auto grid place-items-center shadow-xs">
                  <Trash2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-[14px] font-black text-base-content">
                    حذف درس از سروستان
                  </h3>
                  <p className="text-xs font-bold text-primary truncate px-2">
                    «{name || course?.name || 'این درس'}»
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-right space-y-2 text-[11px] leading-relaxed">
                  <div className="flex items-center gap-1.5 text-danger font-bold text-[11.5px]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>توجه بسیار مهم:</span>
                  </div>
                  <p className="text-base-content/85 text-[10.5px]">
                    حذف این درس فقط در <strong>سروستان</strong> اعمال می‌شود و برنامه‌ریزی داخلی شما را به‌روز می‌کند.
                  </p>
                  <p className="text-neutral text-[10px]">
                    ⚠️ این عملیات به‌هیچ‌وجه درس را در سامانه بهستان یا پرتال آموزش دانشگاه حذف نمی‌کند. برای حذف آموزشی یا حذف اضطراری، حتماً باید از پرتال رسمی دانشگاه اقدام فرمایید.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmActualDelete}
                    className="flex-1 py-2.5 rounded-xl bg-danger text-danger-content text-xs font-bold hover:brightness-110 transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تایید و حذف</span>
                  </button>
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
