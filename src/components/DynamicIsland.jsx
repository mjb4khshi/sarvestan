import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPersistedTimerState } from '../services/studyTimerEngine';
import { toFaDigits } from '../utils/faDigits';

export default function DynamicIsland({ currentTab, onNavigate }) {
  const [timerState, setTimerState] = useState(() => getPersistedTimerState());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const checkTimer = () => {
      setTimerState(getPersistedTimerState());
      setNow(Date.now());
    };

    checkTimer();
    const interval = setInterval(checkTimer, 500);

    const onStateChange = (e) => {
      setTimerState(e.detail || getPersistedTimerState());
      setNow(Date.now());
    };

    window.addEventListener('sarvTimerStateChanged', onStateChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sarvTimerStateChanged', onStateChange);
    };
  }, []);

  if (!timerState || !timerState.isRunning) {
    return null;
  }

  // اگر کاربر در صفحه مطالعه است، کپسول در صورت اسکرول یا در تب‌های دیگر کارایی دارد
  // در صفحات میزکار، برنامه هفتگی، نمرات و بیشتر، بالای صفحه شناور می‌ماند
  if (currentTab === 'study' && timerState.mode === 'custom' && !timerState.isStudySubTab) {
    // در صفحه اصلی تایمر مطالعه، المان مرکزی بزرگ فعال است
    return null;
  }

  let formattedTime = '۰۰:۰۰';
  if (timerState.mode === 'custom' && timerState.targetEndTime) {
    const remainingSecs = Math.max(0, Math.ceil((timerState.targetEndTime - now) / 1000));
    const mins = Math.floor(remainingSecs / 60);
    const secs = remainingSecs % 60;
    formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else if (timerState.mode === 'stopwatch') {
    const base = timerState.stopwatchBase || 0;
    const started = timerState.stopwatchStartedAt || now;
    const elapsedSecs = base + Math.floor((now - started) / 1000);
    const mins = Math.floor(elapsedSecs / 60);
    const secs = elapsedSecs % 60;
    formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="نوار اعلان وضعیت زنده مطالعه"
        initial={{ y: -50, scale: 0.85, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -50, scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        onClick={() => onNavigate?.('study')}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[9990] flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-950/95 text-white border border-white/20 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl cursor-pointer select-none active:scale-95 transition-transform"
        dir="rtl"
        title="مشاهده برنامه مطالعه و تایمر"
      >
        {/* نشان رسمی سرو با نقطه چشمک‌زن نئونی */}
        <div className="relative flex items-center justify-center">
          <svg
            className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]"
            viewBox="0 0 1080 1080"
            fill="currentColor"
          >
            <path d="M540,167 C540,167 213,913 540,913 C867,913 540,167 540,167 Z" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>

        {/* عنوان درس یا کار */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11.5px] font-black text-white/95 max-w-[120px] truncate">
            {timerState.courseName || 'مطالعه و تمرکز'}
          </span>
          <span className="text-white/30 text-xs">·</span>
        </div>

        {/* زمان‌سنج دیجیتالی زنده */}
        <span className="text-[12.5px] font-black font-mono text-emerald-400 tracking-wider tabular-nums">
          {toFaDigits(formattedTime)}
        </span>

        {/* برچسب نوع */}
        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white/90">
          {timerState.mode === 'custom' ? 'تایمر' : 'کرنومتر'}
        </span>
      </motion.aside>
    </AnimatePresence>
  );
}
