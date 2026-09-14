import {
  Award,
  CalendarDays,
  CreditCard,
  LayoutGrid,
  LayoutDashboard,
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ناوبری پایین — همه آیتم‌ها (شامل میز کار) یکسان:
 * مستطیل پس‌زمینه + آیکون + نقطه؛ بدون پرش
 */
const TABS_RIGHT = [
  { id: 'schedule', label: 'برنامه هفتگی', Icon: CalendarDays, activeColor: 'text-secondary' },
  { id: 'grades', label: 'کارنامه و ریز نمرات', Icon: Award, activeColor: 'text-info' },
];

const TABS_CENTER = {
  id: 'home',
  label: 'میز کار',
  Icon: LayoutDashboard,
  activeColor: 'text-primary',
};

const TABS_LEFT = [
  { id: 'finance', label: 'امور مالی', Icon: CreditCard, activeColor: 'text-success' },
  { id: 'more', label: 'سایر خدمات و تنظیمات', Icon: LayoutGrid, activeColor: 'text-accent' },
];

function NavTabItem({ id, label, Icon, active, activeColor, onChange }) {
  const isActive = active === id;
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={`relative flex-1 min-w-0 h-12 flex flex-col items-center justify-center rounded-2xl transition-colors duration-200 outline-none select-none active:scale-95 ${
        isActive ? 'font-bold' : 'text-neutral hover:text-base-content'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive && (
        <motion.span
          layoutId="navTabActivePill"
          className="absolute inset-1 rounded-2xl bg-base-500/35 border border-base-500/50 z-0 shadow-sm"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
      <span
        className={`relative z-10 flex flex-col items-center justify-end h-8 transition-colors duration-200 ${
          isActive ? activeColor : ''
        }`}
      >
        <Icon
          className={`w-5 h-5 transition-all duration-200 ${
            isActive ? 'stroke-[2.4] -translate-y-[1px]' : 'stroke-[1.8] translate-y-0'
          }`}
        />
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-current shadow-sm mt-[3px]"
          animate={{
            opacity: isActive ? 1 : 0,
            scale: isActive ? 1 : 0.5,
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        />
      </span>
    </button>
  );
}

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="ناوبری اصلی برنامه"
    >
      <div className="mx-auto max-w-[420px] px-3 pb-2.5 pt-0 pointer-events-auto">
        <div className="relative rounded-[22px] bg-base/95 backdrop-blur-2xl border border-base-500/70 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] px-2 py-1 flex items-center justify-between">
          <div className="flex items-center flex-1 gap-1">
            {TABS_RIGHT.map((t) => (
              <NavTabItem key={t.id} {...t} active={active} onChange={onChange} />
            ))}
          </div>

          {/* میز کار — دقیقاً مثل بقیه آیتم‌ها */}
          <div className="w-[58px] shrink-0 flex justify-center">
            <NavTabItem {...TABS_CENTER} active={active} onChange={onChange} />
          </div>

          <div className="flex items-center flex-1 gap-1">
            {TABS_LEFT.map((t) => (
              <NavTabItem key={t.id} {...t} active={active} onChange={onChange} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
