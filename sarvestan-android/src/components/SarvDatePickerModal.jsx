import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import { jalaliToDate } from '../data/viewModel';

const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const WEEKDAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const FULL_WEEKDAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
];

function isJalaliLeapYear(year) {
  const a = year - 474;
  const b = (a % 2820) + 474;
  return ((b * 682) % 2816) < 682;
}

function getDaysInMonth(year, month) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
}

function parseJalaliString(str) {
  if (!str) return null;
  const s = String(str)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const m = s.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  return {
    year: parseInt(m[1], 10),
    month: Math.max(1, Math.min(12, parseInt(m[2], 10))),
    day: Math.max(1, Math.min(31, parseInt(m[3], 10))),
  };
}

function getTodayJalali() {
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Asia/Tehran',
    });
    const parts = fmt.formatToParts(new Date());
    const get = (k) => Number(parts.find((x) => x.type === k)?.value || 0);
    return {
      year: get('year') || 1404,
      month: get('month') || 3,
      day: get('day') || 1,
    };
  } catch {
    return { year: 1404, month: 3, day: 25 };
  }
}

export default function SarvDatePickerModal({
  isOpen,
  initialDate = '',
  onClose,
  onConfirm,
}) {
  const today = useMemo(() => getTodayJalali(), []);

  const [viewYear, setViewYear] = useState(1404);
  const [viewMonth, setViewMonth] = useState(3);
  const [selectedYear, setSelectedYear] = useState(1404);
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseJalaliString(initialDate);
      if (parsed) {
        setSelectedYear(parsed.year);
        setSelectedMonth(parsed.month);
        setSelectedDay(parsed.day);
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
      } else {
        setSelectedYear(today.year);
        setSelectedMonth(today.month);
        setSelectedDay(today.day);
        setViewYear(today.year);
        setViewMonth(today.month);
      }
    }
  }, [isOpen, initialDate, today]);

  const daysInCurrentMonth = useMemo(
    () => getDaysInMonth(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const startCol = useMemo(() => {
    try {
      const d = jalaliToDate(viewYear, viewMonth, 1);
      if (!d || isNaN(d)) return 0;
      // JS day: 0=Sun, 1=Mon, ..., 6=Sat.
      // Persian week: 0=Sat, 1=Sun, ..., 6=Fri
      return (d.getDay() + 1) % 7;
    } catch {
      return 0;
    }
  }, [viewYear, viewMonth]);

  const selectedWeekdayName = useMemo(() => {
    try {
      const d = jalaliToDate(selectedYear, selectedMonth, selectedDay);
      if (!d || isNaN(d)) return '';
      const pIdx = (d.getDay() + 1) % 7;
      return FULL_WEEKDAY_NAMES[pIdx] || '';
    } catch {
      return '';
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day) => {
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
    setSelectedDay(day);
  };

  const handleConfirm = () => {
    const mm = String(selectedMonth).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    const formatted = `${selectedYear}/${mm}/${dd}`;
    onConfirm(toFaDigits(formatted));
    onClose();
  };

  const handleJumpTo = (y, m, d) => {
    setViewYear(y);
    setViewMonth(m);
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d || 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm sarv-card p-5 space-y-4 border border-base-500/30 shadow-2xl overflow-hidden select-none"
          >
            {/* سربرگ مودال */}
            <div className="flex items-center justify-between border-b border-base-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-primary/15 text-primary grid place-items-center">
                  <CalendarDays className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-bold text-base-content">
                    انتخاب تاریخ امتحان
                  </h3>
                  <p className="text-[10px] text-neutral">
                    تقویم رسمی شمسی سروستان
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg text-neutral hover:text-base-content hover:bg-base-500/20 grid place-items-center transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* نوار جابجایی ماه و سال */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-base-500/20 text-base-content active:scale-90 transition"
                title="ماه قبل"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-base-content">
                  {JALALI_MONTHS[viewMonth - 1]}
                </span>
                <span className="text-[13px] font-bold text-primary font-mono">
                  {toFaDigits(viewYear)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-base-500/20 text-base-content active:scale-90 transition"
                title="ماه بعد"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* سطر نام روزهای هفته */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_NAMES.map((name, i) => (
                <div
                  key={name}
                  className={`text-[11px] font-black py-1 ${
                    i === 6 ? 'text-danger/80' : 'text-neutral'
                  }`}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* شبکه تقویم روزها */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: startCol }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9" />
              ))}

              {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                const isSelected =
                  selectedYear === viewYear &&
                  selectedMonth === viewMonth &&
                  selectedDay === day;

                const isToday =
                  today.year === viewYear &&
                  today.month === viewMonth &&
                  today.day === day;

                const dayIndex = (startCol + day - 1) % 7;
                const isFriday = dayIndex === 6;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-9 rounded-xl text-[12px] font-mono font-bold transition-all relative grid place-items-center active:scale-90 ${
                      isSelected
                        ? 'bg-primary text-primary-content shadow-md scale-105 z-10'
                        : isToday
                        ? 'bg-primary-soft/60 text-primary border border-primary/30 font-black'
                        : isFriday
                        ? 'text-danger/80 hover:bg-danger-soft/20'
                        : 'text-base-content hover:bg-base-500/20'
                    }`}
                  >
                    <span>{toFaDigits(day)}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* دکمه‌های پرش سریع به دوره‌های مهم */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5">
              <button
                type="button"
                onClick={() => handleJumpTo(today.year, today.month, today.day)}
                className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-base-500/15 hover:bg-base-500/25 text-neutral hover:text-base-content whitespace-nowrap transition active:scale-95"
              >
                امروز
              </button>
              <button
                type="button"
                onClick={() => handleJumpTo(1404, 3, 20)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition active:scale-95 ${
                  viewMonth === 3 ? 'bg-primary/20 text-primary' : 'bg-base-500/15 hover:bg-base-500/25 text-neutral'
                }`}
              >
                امتحانات خرداد
              </button>
              <button
                type="button"
                onClick={() => handleJumpTo(1404, 4, 1)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition active:scale-95 ${
                  viewMonth === 4 ? 'bg-primary/20 text-primary' : 'bg-base-500/15 hover:bg-base-500/25 text-neutral'
                }`}
              >
                امتحانات تیر
              </button>
              <button
                type="button"
                onClick={() => handleJumpTo(1404, 10, 15)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition active:scale-95 ${
                  viewMonth === 10 ? 'bg-primary/20 text-primary' : 'bg-base-500/15 hover:bg-base-500/25 text-neutral'
                }`}
              >
                امتحانات دی
              </button>
            </div>

            {/* کارت پیش‌نمایش تاریخ انتخاب شده */}
            <div className="p-2.5 rounded-xl bg-base-500/15 border border-base-500/20 text-center flex items-center justify-center gap-2">
              <span className="text-[11px] text-neutral">تاریخ انتخابی:</span>
              <span className="text-[12px] font-bold text-base-content">
                {selectedWeekdayName ? `${selectedWeekdayName}، ` : ''}
                {toFaDigits(selectedDay)} {JALALI_MONTHS[selectedMonth - 1]} {toFaDigits(selectedYear)}
              </span>
            </div>

            {/* دکمه‌های تایید و لغو */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content text-[12px] font-bold transition active:scale-95"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-content text-[12px] font-bold hover:brightness-110 transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>تایید تاریخ</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
