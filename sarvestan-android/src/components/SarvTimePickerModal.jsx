import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';

const ITEM_HEIGHT = 44; // پیکسل ارتفاع هر ردیف
const VISIBLE_ITEMS = 5;
const PADDING_COUNT = 2; // ۲ ردیف پدینگ بالا و پایین برای سنتر شدن آیتم وسط

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const PRESETS = [
  { value: '10:00', label: 'صبح' },
  { value: '12:00', label: 'ظهر' },
  { value: '14:00', label: 'بعدازظهر' },
  { value: '18:00', label: 'عصر' },
  { value: '21:00', label: 'شب' },
];

function getTimePeriodLabel(hour) {
  const h = parseInt(hour, 10);
  if (h >= 5 && h < 12) return 'صبح';
  if (h === 12) return 'ظهر';
  if (h > 12 && h < 17) return 'بعدازظهر';
  if (h >= 17 && h < 20) return 'عصر';
  return 'شب';
}

function WheelColumn({ items, selectedValue, onSelect, label }) {
  const scrollRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const selectedIndex = items.indexOf(selectedValue);

  // اسکرول به آیتم انتخاب‌شده هنگام تغییر دستی یا اولیه
  useEffect(() => {
    if (scrollRef.current && selectedIndex >= 0 && !isUserScrollingRef.current) {
      scrollRef.current.scrollTo({
        top: selectedIndex * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
  }, [selectedValue, selectedIndex]);

  const handleScroll = (e) => {
    isUserScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const index = Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      if (items[clamped] !== selectedValue) {
        onSelect(items[clamped]);
      }
      isUserScrollingRef.current = false;
    }, 80);
  };

  const handleStep = (direction) => {
    const nextIndex = selectedIndex + direction;
    if (nextIndex >= 0 && nextIndex < items.length) {
      onSelect(items[nextIndex]);
    }
  };

  return (
    <div className="flex flex-col items-center flex-1">
      {/* برچسب ستون */}
      <span className="text-[12px] font-black text-neutral mb-2">
        {label}
      </span>

      {/* کلید حرکت به بالا */}
      <button
        type="button"
        onClick={() => handleStep(-1)}
        disabled={selectedIndex <= 0}
        className="w-8 h-7 rounded-lg text-neutral hover:text-base-content hover:bg-base-500/20 grid place-items-center transition active:scale-90 disabled:opacity-20"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* ستون اسکرول چرخشی شبیه ساعت موبایل */}
      <div className="relative w-full h-[220px] overflow-hidden my-1 select-none">
        {/* نشانگر ردیف وسط */}
        <div
          className="absolute inset-x-2 rounded-2xl bg-warning/15 border border-warning/30 pointer-events-none z-0"
          style={{
            top: `${PADDING_COUNT * ITEM_HEIGHT}px`,
            height: `${ITEM_HEIGHT}px`,
          }}
        />

        {/* گردینت‌های محو بالا و پایین */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-base via-base/80 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-base via-base/80 to-transparent pointer-events-none z-10" />

        {/* لیست رول شونده با اسنپ اسکرول */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto no-scrollbar scroll-smooth snap-y snap-mandatory relative z-5"
          style={{
            paddingTop: `${PADDING_COUNT * ITEM_HEIGHT}px`,
            paddingBottom: `${PADDING_COUNT * ITEM_HEIGHT}px`,
          }}
        >
          {items.map((val, idx) => {
            const isSelected = val === selectedValue;
            const diff = Math.abs(idx - selectedIndex);
            return (
              <div
                key={val}
                onClick={() => onSelect(val)}
                className={`snap-center h-[44px] flex items-center justify-center font-mono cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'text-[22px] font-black text-warning scale-110'
                    : diff === 1
                      ? 'text-[16px] font-bold text-base-content/60'
                      : 'text-[14px] font-medium text-neutral/40'
                }`}
              >
                {toFaDigits(val)}
              </div>
            );
          })}
        </div>
      </div>

      {/* کلید حرکت به پایین */}
      <button
        type="button"
        onClick={() => handleStep(1)}
        disabled={selectedIndex >= items.length - 1}
        className="w-8 h-7 rounded-lg text-neutral hover:text-base-content hover:bg-base-500/20 grid place-items-center transition active:scale-90 disabled:opacity-20"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SarvTimePickerModal({
  isOpen,
  initialTime = '14:00',
  onClose,
  onConfirm,
}) {
  const [hour, setHour] = useState('14');
  const [minute, setMinute] = useState('00');

  useEffect(() => {
    if (isOpen && initialTime) {
      const parts = initialTime.split(':');
      setHour(parts[0] || '14');
      const m = parts[1] || '00';
      // نزدیک‌ترین دقیقه به لیست ۵ دقیقه‌ای
      const mNum = parseInt(m, 10) || 0;
      const nearest = MINUTES.reduce((prev, curr) =>
        Math.abs(parseInt(curr, 10) - mNum) < Math.abs(parseInt(prev, 10) - mNum) ? curr : prev
      );
      setMinute(nearest);
    }
  }, [isOpen, initialTime]);

  const handleApplyPreset = (presetTime) => {
    const [h, m] = presetTime.split(':');
    setHour(h);
    setMinute(m);
  };

  const handleConfirm = () => {
    onConfirm(`${hour}:${minute}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/40 p-5 shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر مودال */}
            <div className="flex items-center justify-between pb-3 border-b border-base-500/30">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-warning/20 text-warning grid place-items-center shrink-0">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-[14px] font-black text-base-content">
                    تنظیم ساعت یادآوری سماد
                  </h3>
                  <p className="text-[10.5px] text-neutral">
                    ارسال اعلان در روزهای چهارشنبه
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content grid place-items-center transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* کارت نمایش بزرگ زمان انتخاب‌شده */}
            <div className="p-3.5 rounded-2xl bg-base-500/10 border border-base-500/25 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-bold text-neutral">زمان انتخابی:</span>
                <span className="px-2 py-0.5 rounded-lg bg-warning/15 text-warning text-[11px] font-black border border-warning/20">
                  {getTimePeriodLabel(hour)}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[22px] font-black text-warning tracking-wider" dir="ltr">
                <span>{toFaDigits(hour)}</span>
                <span className="animate-pulse">:</span>
                <span>{toFaDigits(minute)}</span>
              </div>
            </div>

            {/* پری‌ست‌های محبوب ساعت */}
            <div>
              <span className="text-[11px] font-bold text-neutral block mb-1.5">
                انتخاب‌های سریع:
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESETS.map((p) => {
                  const isMatch = `${hour}:${minute}` === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleApplyPreset(p.value)}
                      className={`py-1 px-1 rounded-xl text-center border transition-all ${
                        isMatch
                          ? 'bg-warning text-warning-content border-warning font-black shadow-xs'
                          : 'bg-base text-base-content border-base-500/30 hover:border-warning/40'
                      }`}
                    >
                      <span className="block text-[11px] font-mono font-bold" dir="ltr">
                        {toFaDigits(p.value)}
                      </span>
                      <span className="text-[9px] block opacity-80">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* دو ستون چرخشی: ساعت در چپ و دقیقه در راست هماهنگ با فرمت دیجیتال */}
            <div className="flex items-center justify-center gap-4 px-2 py-2 bg-base rounded-2xl border border-base-500/20" dir="ltr">
              {/* ستون ساعت (چپ) */}
              <WheelColumn
                items={HOURS}
                selectedValue={hour}
                onSelect={setHour}
                label="ساعت"
              />

              {/* دونقطه جداکننده */}
              <div className="text-[24px] font-black text-warning/70 pt-6 font-mono select-none">
                :
              </div>

              {/* ستون دقیقه (راست) */}
              <WheelColumn
                items={MINUTES}
                selectedValue={minute}
                onSelect={setMinute}
                label="دقیقه"
              />
            </div>

            {/* دکمه‌های تایید و انصراف */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content text-[12px] font-bold transition active:scale-95"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-content text-[12px] font-bold hover:bg-primary/90 transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                تایید ساعت
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
