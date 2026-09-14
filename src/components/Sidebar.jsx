import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Award,
  CalendarDays,
  CreditCard,
  BookOpenCheck,
  FileCheck2,
  FileText,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import SarvBadge from './sarv/SarvBadge';
import { BEHESTAN_PROFILE } from '../services/behestanData';
import { toFaDigits } from '../utils/faDigits';

export const NAVIGATION_ITEMS = [
  {
    id: 'overview',
    label: 'میز کار و وضعیت جامع',
    subtitle: 'خلاصه تحصیلی، اعلانات و کارت دانشجو',
    icon: LayoutDashboard,
    formCode: '۱۱۱۴۷',
    badge: null
  },
  {
    id: 'transcripts',
    label: 'کارنامه و ریز نمرات',
    subtitle: 'نمرات ترمی، معدل کل و اعتراض',
    icon: Award,
    formCode: '۷۹',
    badge: null
  },
  {
    id: 'schedule',
    label: 'برنامه هفتگی و آزمون‌ها',
    subtitle: 'برنامه کلاسی و کارت ورود به جلسه',
    icon: CalendarDays,
    formCode: '۴۲۸',
    badge: null
  },
  {
    id: 'finance',
    label: 'امور مالی و پرداخت شهریه',
    subtitle: 'شهریه ثابت، متغیر و پرداخت شتاب',
    icon: CreditCard,
    formCode: '۲۷۵۷۰',
    badge: null
  },
  {
    id: 'curriculum',
    label: 'چارت و وضعیت دروس',
    subtitle: 'دروس پایه، تخصصی، عمومی و پیش‌نیاز',
    icon: BookOpenCheck,
    formCode: '۱۱۱۲۶',
    badge: null
  },
  {
    id: 'requests',
    label: 'پیشخوان خدمت و گردش‌کارها',
    subtitle: 'ارجاع مستقیم به سامانه بهستان',
    icon: FileCheck2,
    formCode: '۲۱۱۲۲',
    badge: 'بهستان ↗'
  },
  {
    id: 'letters',
    label: 'نامه‌ها و گواهی‌های اداری',
    subtitle: 'ارجاع مستقیم به سامانه بهستان',
    icon: FileText,
    formCode: '۱۱۱۲۲',
    badge: 'بهستان ↗'
  }
];

export default function Sidebar({ activeTab, onTabChange, onOpenBehestanReferral }) {
  return (
    <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
      
      {/* Navigation Card */}
      <div className="sarv-card p-3 flex flex-col gap-1.5 shadow-sm">
        <div className="px-3 py-2 text-xs font-bold text-neutral flex items-center justify-between">
          <span>ناوبری خدمات بهستان</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-base-500 text-neutral-dark-content">
            سروستان ۲.۰
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'requests' || item.id === 'letters') {
                    if (onOpenBehestanReferral) {
                      onOpenBehestanReferral(item.id);
                      return;
                    }
                  }
                  onTabChange(item.id);
                }}
                className={`relative flex items-center justify-between p-3 rounded-xl transition-all text-right cursor-pointer group ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-base-content hover:bg-base-500/40 text-neutral-dark-content'
                }`}
              >
                {/* Active Background Pill with Framer Motion layoutId */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute inset-0 bg-primary/15 rounded-xl border border-primary/30 z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-content shadow-sm'
                        : 'bg-base-500/60 text-neutral group-hover:text-base-content group-hover:bg-base-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral leading-tight mt-0.5 line-clamp-1">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {(() => {
                  let bText = null;
                  let bVar = 'primary';
                  if (item.id === 'requests' || item.id === 'letters') {
                    bText = 'بهستان ↗';
                    bVar = 'info';
                  } else if (BEHESTAN_PROFILE.isLoggedIn) {
                    if (item.id === 'finance') { bText = 'بدهی'; bVar = 'warn'; }
                    else if (item.id === 'transcripts') { bText = `معدل ${toFaDigits(BEHESTAN_PROFILE.gpa)}`; bVar = 'success'; }
                  }
                  return bText ? (
                    <div className="relative z-10">
                      <SarvBadge variant={bVar} soft size="sm">
                        {bText}
                      </SarvBadge>
                    </div>
                  ) : null;
                })()}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Student Academic Standing Card */}
      <div className="sarv-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-base-500 pb-3">
          <span className="text-xs font-bold text-neutral">پیشرفت کل فارغ‌التحصیلی</span>
          <span className="text-xs font-mono font-bold text-primary">
            {BEHESTAN_PROFILE.totalUnitsPassed > 0
              ? `${toFaDigits(Math.round((BEHESTAN_PROFILE.totalUnitsPassed / (BEHESTAN_PROFILE.totalUnitsRequired || 140)) * 100))}٪`
              : '۰٪'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral">واحدهای گذرانده:</span>
            <span className="font-bold text-base-content">
              {toFaDigits(BEHESTAN_PROFILE.totalUnitsPassed)} از {toFaDigits(BEHESTAN_PROFILE.totalUnitsRequired || 140)} واحد
            </span>
          </div>

          <div className="w-full h-2.5 bg-base-500/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (BEHESTAN_PROFILE.totalUnitsPassed / (BEHESTAN_PROFILE.totalUnitsRequired || 140)) * 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <div className="flex justify-between text-[11px] text-neutral">
            <span>۰</span>
            <span>{toFaDigits(140)}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary">معدل کل دانشجو:</span>
          </div>
          <span className="text-sm font-bold text-primary font-mono">{toFaDigits(BEHESTAN_PROFILE.gpa)}</span>
        </div>
      </div>

    </aside>
  );
}
