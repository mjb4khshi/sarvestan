import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Award,
  CalendarDays,
  CreditCard,
  BookOpenCheck,
  FileCheck2,
  FileText
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'میز کار', Icon: LayoutDashboard },
  { id: 'schedule', label: 'برنامه', Icon: CalendarDays },
  { id: 'transcripts', label: 'کارنامه', Icon: Award },
  { id: 'finance', label: 'مالی', Icon: CreditCard },
  { id: 'curriculum', label: 'چارت', Icon: BookOpenCheck },
  { id: 'requests', label: 'درخواست', Icon: FileCheck2 },
  { id: 'letters', label: 'نامه', Icon: FileText }
];

/** نوار پایین موبایل — همیشه در دسترس بدون اسکرول به بالا */
export default function MobileNav({ activeTab, onTabChange }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-base-500/40 bg-base/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="ناوبری موبایل"
    >
      <div className="flex items-stretch justify-between px-1 pt-1 max-w-lg mx-auto">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-colors outline-none ${
                isActive ? 'text-primary font-semibold' : 'text-neutral'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="mobileNavPill"
                  className="absolute inset-x-0 top-0 bottom-1 rounded-lg bg-primary/12 border border-primary/25 z-0"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                <Icon className="w-4 h-4" />
              </span>
              <span className="relative z-10 text-[9px] leading-tight truncate max-w-full px-0.5">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
