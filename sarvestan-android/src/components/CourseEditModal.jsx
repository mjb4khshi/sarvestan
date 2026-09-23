import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import SarvTimePickerModal from './SarvTimePickerModal';

const DAYS_OF_WEEK = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

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
  onClose,
  onSave,
  onDelete,
}) {
  const isEditing = Boolean(course && (course.id || course.name || course.code));

  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [hall, setHall] = useState('');
  const [units, setUnits] = useState(3);
  const [code, setCode] = useState('');
  const [group, setGroup] = useState('01');
  const [slots, setSlots] = useState([
    { day: 'شنبه', start: '13:30', end: '15:00', hall: '' },
  ]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timePickerState, setTimePickerState] = useState({
    isOpen: false,
    slotIndex: 0,
    field: 'start',
    currentTime: '13:30',
  });

  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      setErrorMsg('');
      if (course) {
        setName(course.name || course.title || '');
        setProfessor(course.professor || '');
        setHall(course.hall || course.room || '');
        setUnits(course.units != null ? course.units : 3);
        setCode(course.code || '');
        setGroup(course.group || '01');

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
        setName('');
        setProfessor('');
        setHall('');
        setUnits(3);
        setCode('');
        setGroup('01');
        setSlots([{ day: 'شنبه', start: '13:30', end: '15:00', hall: '' }]);
      }
    }
  }, [isOpen, course]);

  const handleAddSlot = () => {
    const last = slots[slots.length - 1];
    setSlots([
      ...slots,
      {
        day: 'دوشنبه',
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
    if (!name.trim()) {
      setErrorMsg('لطفاً نام درس را وارد کنید.');
      return;
    }
    if (!slots.length) {
      setErrorMsg('حداقل یک جلسه برای این درس تعیین کنید.');
      return;
    }

    const firstSlot = slots[0];
    const combinedDays = [...new Set(slots.map((s) => s.day))];
    const timeFormatted = `${firstSlot.start}-${firstSlot.end}`;

    const formattedDaySlots = slots.map((s) => ({
      day: s.day,
      time: `${s.start}-${s.end}`,
      hall: s.hall?.trim() || hall.trim(),
    }));

    const resultCourse = {
      ...(course || {}),
      name: name.trim(),
      title: name.trim(),
      professor: professor.trim(),
      hall: hall.trim(),
      room: hall.trim(),
      units: Number(units) || 0,
      code: code.trim(),
      group: group.trim(),
      days: combinedDays,
      day: combinedDays[0] || 'شنبه',
      time: timeFormatted,
      classTimeRaw: timeFormatted,
      daySlots: formattedDaySlots,
    };

    onSave(resultCourse);
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (course) {
      onDelete(course.id || course.code || course);
    }
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

            {/* بدنه اسکرول‌پذیر فرم */}
            <form onSubmit={handleSubmit} className="overflow-y-auto py-3 space-y-3.5 flex-1 pr-0.5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-danger-soft text-danger text-[11.5px] font-bold border border-danger/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
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

              {/* اکشن‌های پایین فرم */}
              <div className="pt-3 border-t border-base-500/30 flex items-center gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`px-3 py-2.5 rounded-xl text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                      confirmDelete
                        ? 'bg-danger text-danger-content font-black shadow-sm'
                        : 'bg-danger-soft text-danger hover:bg-danger/20 border border-danger/20'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{confirmDelete ? 'مطمئنید؟ حذف' : 'حذف درس'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content text-[12px] font-bold transition active:scale-95"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-content text-[12px] font-bold hover:brightness-110 transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
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
      onClose={() => setTimePickerState((prev) => ({ ...prev, isOpen: false }))}
      onConfirm={(newTime) => {
        handleUpdateSlot(timePickerState.slotIndex, timePickerState.field, newTime);
        setTimePickerState((prev) => ({ ...prev, isOpen: false }));
      }}
    />
  </>
  );
}
