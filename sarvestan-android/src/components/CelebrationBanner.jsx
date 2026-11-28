import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, X, PartyPopper } from 'lucide-react';
import { getCalendarSpecialDay } from '../data/iranCalendarEvents';
import { getAnimationLevel } from '../services/animationSettings';
import { getSnapshot } from '../services/behestan/store';

export default function CelebrationBanner() {
  const [celebration, setCelebration] = useState(null);

  const fireConfetti = useCallback(() => {
    if (getAnimationLevel() === 'off') return;
    try {
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
        });
      }, 240);
    } catch {}
  }, []);

  useEffect(() => {
    const check = () => {
      const info = getCalendarSpecialDay(new Date());
      const snap = getSnapshot();
      const firstName = String(snap?.profile?.fullName || '').trim().split(/\s+/)[0] || 'دوست عزیز';

      const items = [];
      if (info.isBirthday) {
        const key = `sarvestan_celebrated_${info.jalaliYear}_birthday`;
        if (!localStorage.getItem(key)) {
          items.push({
            key,
            type: 'birthday',
            title: `تولدت مبارک ${firstName}!`,
            subtitle: 'امیدواریم سالی پر از موفقیت، سلامتی و نمره‌های عالی در پیش داشته باشی.',
          });
        }
      }
      if (info.isStudentDay) {
        const key = `sarvestan_celebrated_${info.jalaliYear}_student_day`;
        if (!localStorage.getItem(key)) {
          items.push({
            key,
            type: 'student_day',
            title: `روز دانشجو مبارک ${firstName}!`,
            subtitle: '۱۶ آذر، روز دانشجو گرامی باد. موفق و پیروز باشی!',
          });
        }
      }

      if (items.length > 0) {
        setCelebration(items[0]);
        try {
          localStorage.setItem(items[0].key, '1');
        } catch {}
        fireConfetti();
      }
    };

    check();
    window.addEventListener('sarvBirthdayUpdated', check);
    return () => window.removeEventListener('sarvBirthdayUpdated', check);
  }, [fireConfetti]);

  if (!celebration) return null;

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          className="sarv-card max-w-sm w-full p-5 bg-base border border-primary/40 shadow-2xl text-center space-y-3 relative"
        >
          <button
            type="button"
            onClick={() => setCelebration(null)}
            className="absolute top-3 left-3 w-7 h-7 rounded-full bg-base-500/25 text-neutral hover:text-base-content grid place-items-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-soft text-primary grid place-items-center">
            <PartyPopper className="w-7 h-7" />
          </div>

          <h3 className="text-base font-black text-base-content">{celebration.title}</h3>
          <p className="text-xs text-neutral leading-relaxed">{celebration.subtitle}</p>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={fireConfetti}
              className="btn btn-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              پخش دوباره کاغذ رنگی
            </button>
            <button
              type="button"
              onClick={() => setCelebration(null)}
              className="btn bg-base-500/20 hover:bg-base-500/35 text-base-content !py-2 !px-4 text-xs font-bold cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}
