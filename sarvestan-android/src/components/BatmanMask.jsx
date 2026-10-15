import React from 'react';
import { motion } from 'framer-motion';
import { useBatMode } from '../services/batMode';

/**
 * ماسک اختصاصی شوالیه تاریکی (بتمن) بر روی تصویر دانشجو
 * طراحی دقیق کلاه‌خود بتمن (گوش‌های خفاشی، محافظ شقیقه، تیغه بینی و حفره‌های چشمی)
 */
export default function BatmanMask({ className = '', style = {} }) {
  const { isBatMode } = useBatMode();

  if (!isBatMode) return null;

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, y: -6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-visible select-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)]"
      >
        <defs>
          {/* گرادینت مشکی-کربنی کلاه‌خود */}
          <linearGradient id="batCowlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e2229" />
            <stop offset="50%" stopColor="#111317" />
            <stop offset="100%" stopColor="#07080a" />
          </linearGradient>

          {/* نور طلایی لبه‌های کلاه‌خود */}
          <linearGradient id="batRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f7dd30" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f7dd30" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f7dd30" stopOpacity="0.7" />
          </linearGradient>

          {/* ماسک برای ایجاد برش شفاف حفره چشم‌ها تا چشم واقعی فرد دیده شود */}
          <mask id="batEyeCutoutMask">
            {/* همه جا سفید (قابل مشاهده) */}
            <rect x="-20" y="-30" width="140" height="160" fill="#ffffff" />
            {/* حفره چشم چپ (سیاه = سوراخ برش خورده) */}
            <path
              d="M 28,45 C 32,41 38,40 43,44 C 41,49 35,50 28,47 Z"
              fill="#000000"
            />
            {/* حفره چشم راست (سیاه = سوراخ برش خورده) */}
            <path
              d="M 72,45 C 68,41 62,40 57,44 C 59,49 65,50 72,47 Z"
              fill="#000000"
            />
          </mask>
        </defs>

        {/* بدنه اصلی کلاه‌خود بتمن با برش چشم‌ها */}
        <g mask="url(#batEyeCutoutMask)">
          {/* کلاه‌خود: گوش چپ تیز (18,-14)، پیشانی، گوش راست تیز (82,-14)، محافظ گونه‌ها و تیغه بینی (50,67) */}
          <path
            d="
              M 20,-12
              C 22,5 18,22 13,38
              C 10,50 14,64 24,70
              C 31,73 37,64 43,58
              L 50,67
              L 57,58
              C 63,64 69,73 76,70
              C 86,64 90,50 87,38
              C 82,22 78,5 80,-12
              C 74,-2 68,14 62,17
              C 56,19 44,19 38,17
              C 32,14 26,-2 20,-12
              Z
            "
            fill="url(#batCowlGrad)"
            stroke="url(#batRimGrad)"
            strokeWidth="0.8"
          />

          {/* خط برجستگی ابروها و بینی (Cowl Brow Ridge) */}
          <path
            d="M 27,39 C 34,35 44,38 50,44 C 56,38 66,35 73,39"
            fill="none"
            stroke="#f7dd30"
            strokeOpacity="0.45"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M 50,44 L 50,64"
            fill="none"
            stroke="#374151"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* شیارهای آیرودینامیک شقیقه‌ها */}
          <path
            d="M 18,34 C 23,37 25,44 24,52"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.12"
            strokeWidth="0.8"
          />
          <path
            d="M 82,34 C 77,37 75,44 76,52"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.12"
            strokeWidth="0.8"
          />
        </g>

        {/* خط دور حفره‌های چشم با رنگ طلایی ملایم */}
        <path
          d="M 28,45 C 32,41 38,40 43,44 C 41,49 35,50 28,47 Z"
          fill="none"
          stroke="#f7dd30"
          strokeOpacity="0.4"
          strokeWidth="0.7"
        />
        <path
          d="M 72,45 C 68,41 62,40 57,44 C 59,49 65,50 72,47 Z"
          fill="none"
          stroke="#f7dd30"
          strokeOpacity="0.4"
          strokeWidth="0.7"
        />

        {/* نشان کوچک خفاش در مرکز پیشانی */}
        <g transform="translate(45, 23) scale(0.08)">
          <path
            fill="#f7dd30"
            d="M121.06,35c0,18.71-26.86,33.88-60,33.88S1.06,53.66,1.06,35s26.87-33.89,60-33.89,60,15.17,60,33.89Z"
          />
          <path
            fill="#000000"
            d="M51.72,24.46c-14.49,5.37-21.86-8-14.49-15.74-11.75,3-30.86,11.49-30.86,25.63,0,12.83,12.49,20.09,21.49,23.22-8.68-10.74,3.25-19.16,13.7-7.41C49.69,35.73,59.28,56.44,61,59.58h0c1.71-3.14,11.31-23.85,19.44-9.42,10.45-11.75,22.38-3.33,13.7,7.41,9-3.13,21.49-10.39,21.49-23.22,0-14.14-19.11-22.63-30.86-25.63,7.37,7.74,0,21.11-14.49,15.74-1.67-2-2.75-6.11-2.75-18.24-1.94,1.26-3.33,5.71-3.45,6a12,12,0,0,0-6.15,0c-.12-.32-1.51-4.77-3.45-6,0,12.13-1.08,16.25-2.75,18.24ZM122.13,35c0,9.76-6.93,18.56-18.12,24.88-11,6.22-26.2,10.06-42.95,10.06S29.13,66.05,18.12,59.83C6.92,53.51,0,44.71,0,35S6.92,16.39,18.12,10.07C29.13,3.85,44.32,0,61.06,0S93,3.85,104,10.07C115.2,16.39,122.13,25.18,122.13,35ZM103,58c10.52-5.94,17-14.09,17-23s-6.51-17.1-17-23c-10.7-6-25.52-9.78-41.91-9.78s-31.2,3.74-41.9,9.78C8.64,17.85,2.13,26,2.13,35S8.64,52,19.16,58c10.7,6.05,25.52,9.79,41.9,9.79S92.27,64,103,58Z"
          />
        </g>
      </svg>
    </motion.div>
  );
}
