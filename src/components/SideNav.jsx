import { motion, LayoutGroup } from 'framer-motion';
import { CalendarDays, Award, Timer, LayoutGrid, LayoutDashboard, Leaf } from 'lucide-react';

/**
 * ناوبری کناری دسکتاپ (lg به بالا) — همان زبان طراحی نوبار موبایل:
 * پس‌زمینهٔ پایه، مفấp فعال گرد، آیکون و نقطهٔ رنگی فعال. فقط چینش عمودی.
 */
const NAV_ITEMS = [
  { id: 'home', label: 'میز کار', Icon: LayoutDashboard, activeColor: 'text-primary' },
  { id: 'schedule', label: 'برنامه هفتگی', Icon: CalendarDays, activeColor: 'text-secondary' },
  { id: 'grades', label: 'کارنامه و ریز نمرات', Icon: Award, activeColor: 'text-info' },
  { id: 'study', label: 'مطالعه و پلنر', Icon: Timer, activeColor: 'text-warn' },
  { id: 'more', label: 'سایر خدمات و تنظیمات', Icon: LayoutGrid, activeColor: 'text-accent' },
];

function SideNavItem({ id, label, Icon, active, activeColor, onChange }) {
  const isActive = active === id;
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={`relative w-full h-11 flex items-center gap-3 px-3 rounded-2xl outline-none select-none transition-colors duration-200 ${
        isActive ? 'font-bold' : 'text-neutral hover:text-base-content'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive && (
        <motion.span
          layoutId="sideNavActivePill"
          className="absolute inset-0 rounded-2xl bg-base-500/35 border border-base-500/50 z-0 shadow-sm"
          transition={{ type: 'tween', duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        />
      )}
      <span className={`relative z-10 shrink-0 ${isActive ? activeColor : ''}`}>
        <Icon
          className={`transition-all duration-200 ${
            isActive ? 'w-5 h-5 stroke-[2.4]' : 'w-5 h-5 stroke-[1.8]'
          }`}
        />
      </span>
      <span className="relative z-10 text-[12.5px] truncate text-start">{label}</span>
      <motion.span
        className={`relative z-10 w-1.5 h-1.5 rounded-full bg-current shadow-sm shrink-0 ${
          isActive ? activeColor : ''
        }`}
        animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.5 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      />
    </button>
  );
}

export default function SideNav({ active, onChange }) {
  return (
    <aside
      className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen py-4"
      aria-label="ناوبری اصلی برنامه"
    >
      <LayoutGroup id="sarvSideNavTabs">
        <div className="sarv-card p-2 space-y-1 border border-base-500/70 self-stretch">
          {/* برند */}
          <div className="flex items-center gap-2 px-3 pt-1.5 pb-2.5">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-[13.5px] font-black text-base-content">سروستان</span>
          </div>

          {NAV_ITEMS.map((t) => (
            <SideNavItem key={t.id} {...t} active={active} onChange={onChange} />
          ))}
        </div>
      </LayoutGroup>
    </aside>
  );
}
