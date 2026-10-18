import { motion, LayoutGroup } from 'framer-motion';
import { CalendarDays, Award, Timer, LayoutGrid, LayoutDashboard, Palette, Bell, X } from 'lucide-react';
import { useSarvestanData } from '../hooks/useSarvestanData';
import { getLocalNotes } from '../services/behestan/store';
import { toFaDigits } from '../utils/faDigits';
import { getSelectedUniversity, getUniversityName } from '../services/behestan/session';
import { isBehestanOverlay, closeBehestanOverlay } from '../services/extensionBridge';
import { useAppIcon } from '../services/appIcon';

/**
 * ناوبری کناری دسکتاپ (lg به بالا) — همان زبان طراحی نوبار موبایل:
 * پس‌زمینهٔ پایه، قرص فعال گرد، آیکون و نقطهٔ رنگی فعال. فقط چینش عمودی.
 * برند و ابزارهای سریع (تم/اعلانات) هم — همان هدر موبایل — اینجا می‌نشینند؛
 * شیت‌ها خودِ TopBar دارند و با رویداد سراسری باز می‌شوند (نمونهٔ واحد).
 */
const NAV_ITEMS = [
  { id: 'home', label: 'میز کار', Icon: LayoutDashboard, activeColor: 'text-primary' },
  { id: 'schedule', label: 'برنامه هفتگی', Icon: CalendarDays, activeColor: 'text-secondary' },
  { id: 'grades', label: 'کارنامه', Icon: Award, activeColor: 'text-info' },
  { id: 'study', label: 'مطالعه و پلنر', Icon: Timer, activeColor: 'text-warn' },
  { id: 'more', label: 'سایر خدمات', Icon: LayoutGrid, activeColor: 'text-accent' },
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
  const { workflows } = useSarvestanData();
  const { currentIcon } = useAppIcon();
  const unread = Math.min(9, (workflows || []).length + getLocalNotes().length);
  const overlayOpen = isBehestanOverlay();

  return (
    <aside
      className="hidden lg:flex flex-col w-60 flex-none shrink-0 sticky top-0 h-screen py-4"
      aria-label="ناوبری اصلی برنامه"
    >
      <LayoutGroup id="sarvSideNavTabs">
        <div className="sarv-card p-2 space-y-1 border border-base-500/70 self-stretch flex flex-col min-h-0">
          {/* برند — همان هویت هدر موبایل */}
          <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-2.5">
            <svg
              viewBox="0 0 1080 1080"
              className="w-7 h-7 shrink-0 drop-shadow-sm transition-colors duration-300"
              style={{ fill: currentIcon?.leaf || 'var(--color-primary, #0066a4)' }}
              aria-label="سروستان"
            >
              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
            </svg>
            <div className="flex flex-col leading-tight min-w-0">
              <div className="text-[14px] font-bold text-base-content flex items-center gap-1 truncate">
                سروستان
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-secondary-soft text-secondary shrink-0">
                  همراه
                </span>
              </div>
              <span className="text-[10px] text-neutral truncate">
                {getUniversityName(
                  /* session از استور خوانده نمی‌شود اینجا — انتخاب ذخیره‌شده کافی است */
                  getSelectedUniversity(),
                ) || 'سامانه هوشمند دانشجویی'}
              </span>
            </div>
          </div>

          {NAV_ITEMS.map((t) => (
            <SideNavItem key={t.id} {...t} active={active} onChange={onChange} />
          ))}

          {/* ابزارهای سریع — همان دکمه‌های هدر */}
          <div className="mt-auto pt-2 border-t border-base-500/30 flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('sarvestan-sidebar-theme'))}
              className="flex items-center gap-1.5 h-8 px-2 rounded-xl bg-base-500/30 hover:bg-base-500/50 border border-base-500/40 text-neutral hover:text-base-content active:scale-95 transition-all outline-none"
              title="تغییر تم"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">تم</span>
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('sarvestan-sidebar-notify'))}
              className="relative w-8 h-8 rounded-xl bg-base-500/30 hover:bg-base-500/50 border border-base-500/40 grid place-items-center text-neutral hover:text-base-content active:scale-95 transition-all outline-none"
              title="اعلانات و پیام‌ها"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-content text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {toFaDigits(unread)}
                </span>
              )}
            </button>

            {overlayOpen && (
              <button
                type="button"
                onClick={closeBehestanOverlay}
                className="flex items-center gap-1 h-8 px-2 rounded-xl bg-danger-soft hover:bg-danger/20 text-danger border border-danger/30 text-[11px] font-bold active:scale-95 transition-all outline-none cursor-pointer"
                title="بستن پنجره سروستان و بازگشت به بهستان"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </LayoutGroup>
    </aside>
  );
}
