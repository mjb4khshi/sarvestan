import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Timer,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Trash2,
  Check,
  AlertTriangle,
  Hash,
} from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import SarvDatePickerModal from './SarvDatePickerModal';
import SarvTimePickerModal from './SarvTimePickerModal';

function parseExamTime(timeStr) {
  if (!timeStr) return { start: '08:30', end: '10:30' };
  const parts = String(timeStr).split(/[-–]/);
  return {
    start: (parts[0] || '08:30').trim(),
    end: (parts[1] || '10:30').trim(),
  };
}

export default function ExamEditModal({
  isOpen,
  exam = null,
  onClose,
  onSave,
  onDelete,
}) {
  const isEditing = Boolean(exam && (exam.id || exam.course || exam.name || exam.code));

  const [courseName, setCourseName] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [units, setUnits] = useState(3);
  const [examDate, setExamDate] = useState('1404/03/20');
  const [examTime, setExamTime] = useState('08:30-10:30');
  const [room, setRoom] = useState('');
  const [seat, setSeat] = useState('—');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [timePickerState, setTimePickerState] = useState({
    isOpen: false,
    field: 'start',
    currentTime: '08:30',
  });

  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      setErrorMsg('');
      if (exam) {
        setCourseName(exam.course || exam.name || '');
        setCode(exam.code || '');
        setProfessor(exam.instructor || exam.professor || '');
        setUnits(exam.unit || exam.units || 3);
        setExamDate(exam.examDate && exam.examDate !== 'ـ' ? exam.examDate : '1404/03/20');
        setExamTime(exam.examTime && exam.examTime !== 'ـ' ? exam.examTime : '08:30-10:30');
        setRoom(exam.room || exam.hall || '');
        setSeat(exam.seat || '—');
      } else {
        setCourseName('');
        setCode('');
        setProfessor('');
        setUnits(3);
        setExamDate('1404/03/20');
        setExamTime('08:30-10:30');
        setRoom('');
        setSeat('—');
      }
    }
  }, [isOpen, exam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseName.trim()) {
      setErrorMsg('لطفاً نام درس امتحان را وارد کنید.');
      return;
    }
    if (!examDate.trim()) {
      setErrorMsg('لطفاً تاریخ شمسی امتحان را وارد نمایید.');
      return;
    }

    const resultExam = {
      ...(exam || {}),
      id: exam?.id || `custom_exam_${Date.now()}`,
      course: courseName.trim(),
      name: courseName.trim(),
      code: code.trim(),
      professor: professor.trim(),
      instructor: professor.trim(),
      unit: Number(units) || 0,
      units: Number(units) || 0,
      examDate: examDate.trim(),
      examTime: examTime.trim(),
      room: room.trim() || 'ـ',
      hall: room.trim() || 'ـ',
      seat: seat.trim() || '—',
    };

    onSave(resultExam);
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (exam) {
      onDelete(exam.id || exam.code || exam);
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
                  <Timer className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-[14.5px] font-black text-base-content">
                    {isEditing ? 'ویرایش نوبت امتحان' : 'افزودن نوبت امتحان جدید'}
                  </h3>
                  <p className="text-[11px] text-neutral">
                    اصلاح تاریخ شمسی، ساعت و مکان برگزاری آزمون پایان‌ترم
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
                  نام درس امتحان <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="مثال: ریاضی عمومی ۲"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[13px] font-bold focus:border-primary focus:bg-base outline-none transition"
                  required
                />
              </div>

              {/* نام استاد و تعداد واحد */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11.5px] font-bold text-neutral block mb-1">
                    نام استاد / مدرس
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={professor}
                      onChange={(e) => setProfessor(e.target.value)}
                      placeholder="مثال: دکتر رضایی"
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12.5px] font-medium focus:border-primary focus:bg-base outline-none transition"
                    />
                    <User className="w-4 h-4 text-neutral/60 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                      className="w-full px-2 py-2 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12.5px] text-center font-mono font-bold focus:border-primary outline-none transition"
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
                      placeholder="۴۰۱۰۲۶"
                      className="w-full px-2 py-2 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12px] text-center font-mono focus:border-primary outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* تاریخ شمسی امتحان و ساعت امتحان با سلکتورهای نیتیو سرو */}
              <div className="p-3 rounded-2xl bg-base-500/10 border border-base-500/25 space-y-3">
                <span className="text-[12px] font-bold text-primary flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  زمان‌بندی و نوبت برگزاری
                </span>

                <div className="space-y-3">
                  {/* انتخاب تاریخ شمسی */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral block mb-1">
                      تاریخ شمسی امتحان <span className="text-danger">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(true)}
                      className="w-full p-2.5 rounded-xl bg-base border border-base-500/30 hover:border-primary/50 text-right flex items-center justify-between transition active:scale-95 shadow-2xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-[13px] font-bold font-mono text-base-content">
                          {toFaDigits(examDate)}
                        </span>
                      </div>
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition">
                        تقویم سروستان
                      </span>
                    </button>
                  </div>

                  {/* انتخاب بازه ساعتی */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral block mb-1">
                      ساعت برگزاری امتحان
                    </label>
                    {(() => {
                      const { start, end } = parseExamTime(examTime);
                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setTimePickerState({
                                  isOpen: true,
                                  field: 'start',
                                  currentTime: start,
                                })
                              }
                              className="w-full px-2.5 py-2 rounded-xl bg-base border border-base-500/30 hover:border-primary/50 text-[12.5px] font-bold font-mono text-base-content flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                            >
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>از {toFaDigits(start)}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setTimePickerState({
                                  isOpen: true,
                                  field: 'end',
                                  currentTime: end,
                                })
                              }
                              className="w-full px-2.5 py-2 rounded-xl bg-base border border-base-500/30 hover:border-primary/50 text-[12.5px] font-bold font-mono text-base-content flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                            >
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>تا {toFaDigits(end)}</span>
                            </button>
                          </div>

                          {/* چیپ‌های نوبت‌های رایج امتحانات */}
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                            {[
                              { label: 'صبح ۱ (۰۸:۳۰)', val: '08:30-10:30' },
                              { label: 'صبح ۲ (۱۰:۳۰)', val: '10:30-12:30' },
                              { label: 'ظهر (۱۳:۳۰)', val: '13:30-15:30' },
                              { label: 'عصر (۱۵:۳۰)', val: '15:30-17:30' },
                            ].map((slotPreset) => (
                              <button
                                key={slotPreset.val}
                                type="button"
                                onClick={() => setExamTime(slotPreset.val)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition active:scale-95 ${
                                  examTime === slotPreset.val
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-base text-neutral hover:text-base-content border border-base-500/30'
                                }`}
                              >
                                {slotPreset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* محل برگزاری و شماره صندلی */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11.5px] font-bold text-neutral block mb-1">
                    محل برگزاری آزمون (حوزه / کلاس)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="مثال: دانشکده کامپیوتر - سالن همایش"
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12.5px] font-medium focus:border-primary outline-none transition"
                    />
                    <MapPin className="w-4 h-4 text-neutral/60 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-neutral block mb-1">
                    شماره صندلی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={seat}
                      onChange={(e) => setSeat(e.target.value)}
                      placeholder="مثال: ۴۵"
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-base-500/15 border border-base-500/30 text-base-content text-[12.5px] text-center font-mono font-bold focus:border-primary outline-none transition"
                    />
                    <Hash className="w-3.5 h-3.5 text-neutral/60 absolute right-2.5 top-3.5 pointer-events-none" />
                  </div>
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
                    <span>{confirmDelete ? 'مطمئنید؟ حذف' : 'حذف امتحان'}</span>
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
                  <span>{isEditing ? 'ذخیره تغییرات' : 'ثبت نوبت امتحان'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* تقویم نیتیو شمسی سرو برای انتخاب تاریخ امتحان */}
    <SarvDatePickerModal
      isOpen={isDatePickerOpen}
      initialDate={examDate}
      onClose={() => setIsDatePickerOpen(false)}
      onConfirm={(newDate) => {
        setExamDate(newDate);
        setIsDatePickerOpen(false);
      }}
    />

    {/* سلکتور چرخشی برای انتخاب ساعت امتحان */}
    <SarvTimePickerModal
      isOpen={timePickerState.isOpen}
      initialTime={timePickerState.currentTime}
      title={timePickerState.field === 'start' ? 'ساعت شروع امتحان' : 'ساعت پایان امتحان'}
      subtitle="ساعت و دقیقه برگزاری نوبت آزمون را مشخص کنید"
      onClose={() => setTimePickerState((prev) => ({ ...prev, isOpen: false }))}
      onConfirm={(newTime) => {
        const { start, end } = parseExamTime(examTime);
        if (timePickerState.field === 'start') {
          setExamTime(`${newTime}-${end}`);
        } else {
          setExamTime(`${start}-${newTime}`);
        }
        setTimePickerState((prev) => ({ ...prev, isOpen: false }));
      }}
    />
  </>
  );
}
