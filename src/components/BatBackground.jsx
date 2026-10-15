import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBatMode } from '../services/batMode';

const BATMAN_YELLOW_PATH =
  'M121.06,35c0,18.71-26.86,33.88-60,33.88S1.06,53.66,1.06,35s26.87-33.89,60-33.89,60,15.17,60,33.89Z';

const BATMAN_BLACK_PATH =
  'M51.72,24.46c-14.49,5.37-21.86-8-14.49-15.74-11.75,3-30.86,11.49-30.86,25.63,0,12.83,12.49,20.09,21.49,23.22-8.68-10.74,3.25-19.16,13.7-7.41C49.69,35.73,59.28,56.44,61,59.58h0c1.71-3.14,11.31-23.85,19.44-9.42,10.45-11.75,22.38-3.33,13.7,7.41,9-3.13,21.49-10.39,21.49-23.22,0-14.14-19.11-22.63-30.86-25.63,7.37,7.74,0,21.11-14.49,15.74-1.67-2-2.75-6.11-2.75-18.24-1.94,1.26-3.33,5.71-3.45,6a12,12,0,0,0-6.15,0c-.12-.32-1.51-4.77-3.45-6,0,12.13-1.08,16.25-2.75,18.24ZM122.13,35c0,9.76-6.93,18.56-18.12,24.88-11,6.22-26.2,10.06-42.95,10.06S29.13,66.05,18.12,59.83C6.92,53.51,0,44.71,0,35S6.92,16.39,18.12,10.07C29.13,3.85,44.32,0,61.06,0S93,3.85,104,10.07C115.2,16.39,122.13,25.18,122.13,35ZM103,58c10.52-5.94,17-14.09,17-23s-6.51-17.1-17-23c-10.7-6-25.52-9.78-41.91-9.78s-31.2,3.74-41.9,9.78C8.64,17.85,2.13,26,2.13,35S8.64,52,19.16,58c10.7,6.05,25.52,9.79,41.9,9.79S92.27,64,103,58Z';

export default function BatBackground() {
  const { isBatMode } = useBatMode();
  const [showActivationCelebration, setShowActivationCelebration] = useState(false);

  useEffect(() => {
    const onActivate = (e) => {
      if (e?.detail?.celebrate) {
        setShowActivationCelebration(true);
        setTimeout(() => setShowActivationCelebration(false), 5500);
      }
    };
    window.addEventListener('sarvestan-bat-celebrate', onActivate);
    return () => window.removeEventListener('sarvestan-bat-celebrate', onActivate);
  }, []);

  if (!isBatMode && !showActivationCelebration) return null;

  return (
    <>
      {/* واترمارک و بک‌گراند ثابت خفاشی و بتمنی */}
      {isBatMode && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center select-none"
        >
          {/* نور ملایم بت‌سیگنال در پس‌زمینه */}
          <div className="absolute w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-radial from-amber-400/8 via-amber-500/2 to-transparent blur-3xl" />

          {/* نشان بزرگ لوگوی بتمن در پس‌زمینه با افکت تیره / شفاف */}
          <svg
            viewBox="0 0 122.13 69.89"
            className="w-[300px] sm:w-[420px] opacity-[0.08] dark:opacity-[0.14] transition-opacity duration-700"
          >
            <path d={BATMAN_YELLOW_PATH} fill="#f7dd30" opacity="0.35" />
            <path d={BATMAN_BLACK_PATH} fill="currentColor" className="text-base-content" />
          </svg>

          {/* چند لوگوی خفاش کوچک در زوایای مختلف پس‌زمینه */}
          <div className="absolute top-16 right-6 opacity-[0.06] dark:opacity-[0.1] rotate-[-16deg]">
            <svg viewBox="0 0 122.13 69.89" className="w-20">
              <path d={BATMAN_YELLOW_PATH} fill="#f7dd30" opacity="0.3" />
              <path d={BATMAN_BLACK_PATH} fill="currentColor" className="text-base-content" />
            </svg>
          </div>
          <div className="absolute bottom-32 left-8 opacity-[0.06] dark:opacity-[0.1] rotate-[18deg]">
            <svg viewBox="0 0 122.13 69.89" className="w-24">
              <path d={BATMAN_YELLOW_PATH} fill="#f7dd30" opacity="0.3" />
              <path d={BATMAN_BLACK_PATH} fill="currentColor" className="text-base-content" />
            </svg>
          </div>
          <div className="absolute top-1/3 left-8 opacity-[0.05] dark:opacity-[0.08] rotate-[-10deg]">
            <svg viewBox="0 0 122.13 69.89" className="w-16">
              <path d={BATMAN_YELLOW_PATH} fill="#f7dd30" opacity="0.3" />
              <path d={BATMAN_BLACK_PATH} fill="currentColor" className="text-base-content" />
            </svg>
          </div>
        </div>
      )}

      {/* انیمیشن رژه خفاش‌ها و اعلان پیروزی هنگام فعال‌سازی ایستر اگ */}
      <AnimatePresence>
        {showActivationCelebration && (
          <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden flex flex-col items-center justify-center p-4">
            {/* لوگوهای در حال پرواز */}
            {[...Array(9)].map((_, i) => {
              const startX = Math.random() * 80 - 40;
              const startY = 120 + i * 40;
              const endX = (i % 2 === 0 ? 1 : -1) * (180 + Math.random() * 200);
              const endY = -300 - Math.random() * 250;
              const scale = 0.45 + Math.random() * 0.55;
              const delay = i * 0.14;

              return (
                <motion.div
                  key={`bat-particle-${i}`}
                  initial={{ x: `${startX}vw`, y: `${startY}vh`, scale: 0, opacity: 0 }}
                  animate={{
                    x: `${endX}vw`,
                    y: `${endY}vh`,
                    scale: [0, scale, scale * 1.2, scale * 0.8],
                    opacity: [0, 1, 1, 0],
                    rotate: [(i % 2 === 0 ? -25 : 25), 0, (i % 2 === 0 ? 30 : -30)],
                  }}
                  transition={{ duration: 2.2, delay, ease: 'easeInOut' }}
                  className="absolute"
                >
                  <svg viewBox="0 0 122.13 69.89" className="w-28 drop-shadow-xl">
                    <path d={BATMAN_YELLOW_PATH} fill="#f7dd30" />
                    <path d={BATMAN_BLACK_PATH} fill="#000000" />
                  </svg>
                </motion.div>
              );
            })}

            {/* کارت اعلان بیداری بتمن گاتهام */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="p-4 rounded-3xl bg-black/95 text-white border-2 border-amber-400/80 shadow-[0_0_35px_rgba(255,230,0,0.35)] max-w-sm text-center space-y-2 backdrop-blur-xl"
            >
              <div className="w-20 h-12 mx-auto rounded-2xl bg-amber-400/15 border border-amber-400/40 p-2 grid place-items-center">
                <svg viewBox="0 0 122.13 69.89" className="w-full h-full">
                  <path d={BATMAN_YELLOW_PATH} fill="#f7dd30" />
                  <path d={BATMAN_BLACK_PATH} fill="#000000" />
                </svg>
              </div>
              <h3 className="text-[16px] font-black text-amber-400">
                🦇 حالت شوالیه تاریکی فعال شد!
              </h3>
              <p className="text-[12px] text-neutral-300 leading-relaxed font-medium">
                بک‌گراند خفاشی گاتهام و آیکون اختصاصی بتمن برای اپلیکیشن تنظیم گردید.
              </p>
              <div className="pt-1">
                <span className="text-[10.5px] font-mono px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  Bat-Mode Activated ⚡
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
