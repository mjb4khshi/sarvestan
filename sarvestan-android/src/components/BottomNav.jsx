import {
  Award,
  CalendarDays,
  Timer,
  LayoutGrid,
  LayoutDashboard,
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ناوبری پایین — همه آیتم‌ها (شامل میز کار) یکسان:
 * مستطیل پس‌زمینه افقی بدون پرش عمودی + آیکون + نقطه
 */
const ALL_TABS = [
  { id: 'schedule', label: 'برنامه هفتگی', Icon: CalendarDays, activeColor: 'text-secondary' },
  { id: 'grades', label: 'کارنامه و ریز نمرات', Icon: Award, activeColor: 'text-info' },
  { id: 'home', label: 'میزکار', Icon: LayoutDashboard, activeColor: 'text-primary' },
  { id: 'study', label: 'مطالعه و پلنر', Icon: Timer, activeColor: 'text-warn' },
  { id: 'more', label: 'سایر خدمات و تنظیمات', Icon: LayoutGrid, activeColor: 'text-accent' },
];

function NavTabItem({ id, label, Icon, active, activeColor, onChange }) {
  const isActive = active === id;
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={`relative z-10 flex-1 min-w-0 h-12 flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 outline-none select-none active:scale-95 ${
        isActive ? 'font-bold' : 'text-neutral hover:text-base-content'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        className={`relative z-10 flex flex-col items-center justify-end h-8 transition-colors duration-150 ${
          isActive ? activeColor : ''
        }`}
      >
        <Icon
          className={`w-5 h-5 transition-transform duration-150 ${
            isActive ? 'stroke-[2.4] -translate-y-[1px]' : 'stroke-[1.8] translate-y-0'
          }`}
        />
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-current shadow-sm mt-[3px]"
          animate={{
            opacity: isActive ? 1 : 0,
            scale: isActive ? 1 : 0.5,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      </span>
    </button>
  );
}

export default function BottomNav({ active, onChange }) {
  const activeIdx = Math.max(0, ALL_TABS.findIndex((t) => t.id === active));

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="ناوبری اصلی برنامه"
    >
      {/* گرادینت بسیار نرم و محو همرنگ پس‌زمینه برای حذف آلودگی بصری زیر نوبار با حفظ حس شناور بودن */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 pointer-events-none -z-10"
        style={{
          background: `linear-gradient(
            to top,
            var(--theme-color-base, #0a0a0c) 0%,
            color-mix(in oklab, var(--theme-color-base, #0a0a0c) 92%, transparent) 22%,
            color-mix(in oklab, var(--theme-color-base, #0a0a0c) 72%, transparent) 42%,
            color-mix(in oklab, var(--theme-color-base, #0a0a0c) 45%, transparent) 62%,
            color-mix(in oklab, var(--theme-color-base, #0a0a0c) 20%, transparent) 78%,
            color-mix(in oklab, var(--theme-color-base, #0a0a0c) 6%, transparent) 90%,
            transparent 100%
          )`,
        }}
      />

      <div className="relative mx-auto max-w-[420px] px-3 pb-2.5 pt-0 pointer-events-auto">
        <div
          dir="rtl"
          className="relative rounded-[22px] bg-base/95 backdrop-blur-md border border-base-500/70 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.35)] px-2 py-1"
          style={{
            backgroundColor: 'color-mix(in oklab, var(--theme-color-base, #0a0a0c) 95%, transparent)',
            borderColor: 'color-mix(in oklab, var(--theme-color-base-500, #222222) 70%, transparent)',
          }}
        >
          <div className="relative grid grid-cols-5 items-center">
            {/* نشانگر متحرک افقی خالص — هم‌عرض دقیق هر ستون (۲۰٪) بدون پرش عمودی */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-0 p-1 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                width: '20%',
                transform: `translate3d(-${activeIdx * 100}%, 0, 0)`,
              }}
            >
              <div className="w-full h-full rounded-2xl bg-base-500/35 border border-base-500/50 shadow-sm" />
            </div>

            {ALL_TABS.map((t) => (
              <NavTabItem key={t.id} {...t} active={active} onChange={onChange} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
