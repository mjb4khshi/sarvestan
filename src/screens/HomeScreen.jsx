import { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  TrendingUp,
  CalendarDays,
  CreditCard,
  FileCheck2,
  Megaphone,
  ChevronLeft,
  Calendar,
  BookOpen,
  Sparkles,
  LogIn,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { getViewModel } from '../data/viewModel';
import { useSarvestanData } from '../hooks/useSarvestanData';
import { openLoginModal } from '../services/loginFlow';
import { toFaDigits } from '../utils/faDigits';
import { getSelectedUniversity } from '../services/behestan/session';
import { isBehestanOverlay } from '../services/extensionBridge';
import OdometerNumber from '../components/OdometerNumber';
import StudyHeatmap from '../components/StudyHeatmap';
import DashboardCalendar from '../components/DashboardCalendar';
import DashboardCustomizeModal from '../components/DashboardCustomizeModal';
import { getDashboardWidgetsConfig } from '../services/dashboardWidgets';
import BatmanMask from '../components/BatmanMask';
import { motion } from 'framer-motion';
import FeedModal from '../components/FeedModal';
import ChannelSubscribeModal from '../components/ChannelSubscribeModal';
import { fetchFeed, getFeedState, subscribeFeed, markPostAsRead } from '../services/feedService';

import { getGpaStatusBadge } from '../utils/gpaBadge';
export { getGpaStatusBadge };

const statusMeta = {
  now: { label: 'در حال برگزاری', chip: 'bg-success-soft text-success font-bold' },
  next: { label: 'کلاس بعدی', chip: 'bg-primary-soft text-primary font-bold' },
  later: { label: 'در ادامه امروز', chip: 'bg-secondary-soft text-secondary font-bold' },
  done: { label: 'پایان یافته', chip: 'bg-base-500/30 text-neutral font-normal' },
};

// نحوه نمایش کارت مشخصات: 'row' (عکس مربعی لبه گرد در راست) | 'centered' (مرکزچین دایره‌ای قبلی برای بازگشت آسان)
const PROFILE_CARD_LAYOUT = 'row';

export default function HomeScreen({ onNavigate }) {
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [widgetsConfig, setWidgetsConfig] = useState(getDashboardWidgetsConfig);
  const [feedState, setFeedState] = useState(getFeedState);
  const [selectedFeedPost, setSelectedFeedPost] = useState(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all');

  useEffect(() => {
    fetchFeed();
    return subscribeFeed(() => setFeedState(getFeedState()));
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setWidgetsConfig(getDashboardWidgetsConfig());
    };
    window.addEventListener('sarvDashboardWidgetsUpdated', handleUpdate);
    return () => window.removeEventListener('sarvDashboardWidgetsUpdated', handleUpdate);
  }, []);
  const { data, live, isSessionAlive, syncing, sync, session } = useSarvestanData();
  const isUt = (session?.university || getSelectedUniversity()) === 'ut';
  const vm = getViewModel();
  const STUDENT = vm.student;
  const SUMMARY = vm.summary;
  const displayName = STUDENT.fullName || session?.studentName || data?.profile?.fullName || (isSessionAlive ? 'دانشجو' : '');

  const handleSyncClick = () => {
    if (isBehestanOverlay()) {
      try {
        window.parent.postMessage({ action: 'SARVESTAN_FORCE_SYNC_CMD' }, '*');
        window.parent.postMessage({ action: 'SARVESTAN_REFRESH_SCHEDULE' }, '*');
      } catch (_) {}
    }
    sync(true);
  };
  const TODAY_CLASSES = vm.todayClasses;
  const WEEK = vm.week;
  const ANNOUNCEMENTS = vm.announcements;
  const NEXT = vm.nextClass;
  const WEEK_HOURS = vm.weekHours ?? 13;
  const TERM_LABEL = vm.termLabel || STUDENT.term || 'نیمسال اول ۱۴۰۴–۱۴۰۵';
  const dayNameMap = { 6: 'شنبه', 0: 'یکشنبه', 1: 'دوشنبه', 2: 'سه‌شنبه', 3: 'چهارشنبه', 4: 'پنجشنبه', 5: 'جمعه' };
  const todayIdx = Math.max(0, WEEK.findIndex((d) => d.day === dayNameMap[new Date().getDay()]));
  const gpaStatus = getGpaStatusBadge(SUMMARY.gpa || STUDENT.gpa || vm.grades?.cumulativeGpa);

  // وضعیت بدهکاری شهریه: در صورت بدهی رنگ اخطار (warn)، در صورت تسویه یا بستانکاری رنگ سبز (success)
  const isDebtor =
    (SUMMARY.debtToman > 0) ||
    (SUMMARY.unpaidRial > 0) ||
    (SUMMARY.unpaid && SUMMARY.unpaid !== '۰' && SUMMARY.unpaid !== '0');

  const tuitionTone = isDebtor
    ? {
        card: 'bg-warn-soft border-warn-soft hover:border-warn',
        text: 'text-warn',
      }
    : {
        card: 'bg-success-soft border-success-soft hover:border-success',
        text: 'text-success',
      };

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'profile':
        return (
          <div key="profile" className="space-y-3.5">
            {/* هیرو کارت هویت دانشجو */}
            <section className="sarv-card p-4 sm:p-5 border border-base-500 relative overflow-hidden">
              {PROFILE_CARD_LAYOUT === 'row' ? (
                /* دیزاین جدید: عکس مربعی لبه‌گرد در سمت راست + مشخصات در ادامه سمت چپ */
                <div className="w-full flex items-stretch gap-3.5">
                  {/* تصویر آواتار مربعی با گوشه‌های گرد */}
                  <div className="relative shrink-0 w-[90px] h-[90px] sm:w-[96px] sm:h-[96px]">
                    {STUDENT.photo ? (
                      <img
                        src={STUDENT.photo}
                        alt=""
                        className="w-full h-full rounded-2xl object-cover shadow-md border-2 border-base"
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-primary text-primary-content font-black text-2xl grid place-items-center shadow-md border-2 border-base">
                        {STUDENT.fullName ? STUDENT.fullName.slice(0, 1) : 'س'}
                      </div>
                    )}
                    {/* ماسک شوالیه تاریکی (بتمن) */}
                    <BatmanMask />
                    {/* نشانگر آنلاین / فعال بودن */}
                    <span
                      className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full ring-2 ring-base ${
                        live ? 'bg-success' : 'bg-neutral'
                      }`}
                      title={live ? 'متصل به بهستان' : 'حالت نمونه'}
                    />
                  </div>

                  {/* مشخصات: نام هم‌تراز با بالای تصویر و بج‌ها هم‌تراز با پایین تصویر */}
                  <div className="flex-1 min-w-0 text-right flex flex-col justify-between py-0.5">
                    <div>
                      {displayName ? (
                        <h2 className="text-[17px] font-black text-base-content leading-snug truncate">
                          {displayName}
                        </h2>
                      ) : syncing ? (
                        <div className="flex items-center gap-2 text-primary font-bold text-[13.5px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                          در حال دریافت و همگام‌سازی…
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <h2 className="text-[13.5px] font-bold text-neutral leading-snug">
                            {isSessionAlive ? 'نشست ثبت شده — در انتظار بارگذاری' : 'عدم اتصال به بهستان'}
                          </h2>
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {isSessionAlive ? (
                              <button
                                type="button"
                                onClick={handleSyncClick}
                                disabled={syncing}
                                className="btn btn-primary !py-1 !px-2.5 text-[11px] font-bold shadow-sm inline-flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                {syncing ? 'در حال دریافت…' : 'دریافت اطلاعات زنده'}
                              </button>
                            ) : null}
                            {!isBehestanOverlay() && (
                              <button
                                type="button"
                                onClick={() => openLoginModal()}
                                className={`btn ${isSessionAlive ? 'btn-ghost' : 'btn-primary'} !py-1 !px-2.5 text-[11px] font-bold shadow-sm inline-flex items-center gap-1`}
                              >
                                <LogIn className="w-3 h-3" />
                                {isSessionAlive ? 'ورود مجدد / تغییر دانشگاه' : 'ورود به بهستان'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {STUDENT.studentId ? (
                        <p className="text-[11.5px] font-medium mt-0.5 truncate">
                          <span className="font-mono text-base-content font-bold">{toFaDigits(STUDENT.studentId)}</span>
                        </p>
                      ) : null}
                      {STUDENT.major ? (
                        <p className="text-[11.5px] text-neutral font-medium mt-0.5 truncate">{STUDENT.major}</p>
                      ) : null}
                      {STUDENT.college ? (
                        <p className="text-[10.5px] text-neutral/80 mt-0.5 truncate">{STUDENT.college}</p>
                      ) : null}
                    </div>

                    {/* بج‌های اطلاعاتی — هم‌تراز با لبهٔ پایینی تصویر */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-secondary-soft text-secondary">
                        {toFaDigits(TERM_LABEL)}
                      </span>
                      {STUDENT.level && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary-soft text-primary">
                          {STUDENT.level}
                        </span>
                      )}
                      {gpaStatus && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg ${gpaStatus.chip}`}>
                          {gpaStatus.label}
                        </span>
                      )}
                      {(SUMMARY.droppedCount > 0 || SUMMARY.waitlistCount > 0) && (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-lg bg-warn-soft text-warn">
                          {SUMMARY.droppedCount > 0 ? `حذف: ${toFaDigits(SUMMARY.droppedCount)}` : ''}
                          {SUMMARY.droppedCount > 0 && SUMMARY.waitlistCount > 0 ? ' · ' : ''}
                          {SUMMARY.waitlistCount > 0 ? `انتظار: ${toFaDigits(SUMMARY.waitlistCount)}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* دیزاین قبلی: عکس دایره‌ای مرکزچین */
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {STUDENT.photo ? (
                      <img
                        src={STUDENT.photo}
                        alt=""
                        className="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-base"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary text-primary-content font-black text-3xl grid place-items-center shadow-lg border-4 border-base">
                        {STUDENT.fullName.slice(0, 1)}
                      </div>
                    )}
                    {/* ماسک شوالیه تاریکی (بتمن) */}
                    <BatmanMask />
                    <span
                      className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-base ${
                        live ? 'bg-success' : 'bg-neutral'
                      }`}
                      title={live ? 'متصل به بهستان' : 'حالت نمونه'}
                    />
                  </div>

                  {displayName ? (
                    <h2 className="text-[19px] font-black text-base-content mt-3 leading-tight">
                      {displayName}
                    </h2>
                  ) : syncing ? (
                    <h2 className="text-[17px] font-black text-primary mt-3 leading-tight flex items-center justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                      در حال دریافت اطلاعات…
                    </h2>
                  ) : (
                    <div className="mt-3 space-y-1.5 flex flex-col items-center">
                      <h2 className="text-[15px] font-bold text-neutral leading-tight">
                        {isSessionAlive ? 'نشست ثبت شده — در انتظار بارگذاری' : 'عدم اتصال به بهستان'}
                      </h2>
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {isSessionAlive ? (
                          <button
                            type="button"
                            onClick={handleSyncClick}
                            disabled={syncing}
                            className="btn btn-primary !py-1 !px-2.5 text-[11px] font-bold shadow-sm inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            {syncing ? 'در حال دریافت…' : 'دریافت اطلاعات زنده'}
                          </button>
                        ) : null}
                        {!isBehestanOverlay() && (
                          <button
                            type="button"
                            onClick={() => openLoginModal()}
                            className="btn btn-primary !py-1 !px-2.5 text-[11px] font-bold shadow-sm inline-flex items-center gap-1"
                          >
                            <LogIn className="w-3 h-3" />
                            ورود به بهستان
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {STUDENT.studentId ? (
                    <p className="text-[12px] font-medium mt-0.5">
                      <span className="font-mono text-base-content font-bold">{STUDENT.studentId}</span>
                    </p>
                  ) : null}
                  {STUDENT.major ? (
                    <p className="text-[12px] text-neutral font-medium mt-0.5">{STUDENT.major}</p>
                  ) : null}
                  {STUDENT.college ? (
                    <p className="text-[11px] text-neutral mt-0.5">{STUDENT.college}</p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-[10.5px] font-black px-2.5 py-1 rounded-xl bg-secondary-soft text-secondary">
                      {toFaDigits(TERM_LABEL)}
                    </span>
                    {STUDENT.level && (
                      <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-xl bg-primary-soft text-primary">
                        {STUDENT.level}
                      </span>
                    )}
                    {gpaStatus && (
                      <span className={`text-[10.5px] px-2.5 py-1 rounded-xl ${gpaStatus.chip}`}>
                        {gpaStatus.label}
                      </span>
                    )}
                    {(SUMMARY.droppedCount > 0 || SUMMARY.waitlistCount > 0) && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-warn-soft text-warn">
                        {SUMMARY.droppedCount > 0 ? `حذف اضطراری: ${toFaDigits(SUMMARY.droppedCount)}` : ''}
                        {SUMMARY.droppedCount > 0 && SUMMARY.waitlistCount > 0 ? ' · ' : ''}
                        {SUMMARY.waitlistCount > 0 ? `در انتظار: ${toFaDigits(SUMMARY.waitlistCount)}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ردیف آمار سه‌گانه بنتو تعاملی */}
              <div className="mt-3.5 w-full grid grid-cols-3 gap-2 pt-3 border-t border-base-500/40">
                <button
                  type="button"
                  onClick={() => onNavigate('grades')}
                  className="rounded-2xl p-2.5 text-center bg-primary-soft border border-primary-soft hover:border-primary active:scale-95 transition-all outline-none cursor-pointer flex flex-col items-center justify-center"
                  title="مشاهده کارنامه و محاسبه‌گر معدل"
                >
                  <p className="text-[10.5px] text-primary font-bold">معدل کل</p>
                  <div className="mt-0.5 flex items-center justify-center">
                    <span className="text-[17px] text-primary font-black leading-tight">
                      {toFaDigits(SUMMARY.gpa)}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('chart')}
                  className="rounded-2xl p-2.5 text-center bg-accent-soft border border-accent-soft hover:border-accent active:scale-95 transition-all outline-none cursor-pointer flex flex-col items-center justify-center"
                  title="مشاهده چارت و سرفصل دروس"
                >
                  <p className="text-[10.5px] text-accent font-bold">واحد اخذشده</p>
                  <div className="mt-0.5 flex items-center justify-center gap-1">
                    <span className="text-[17px] text-accent font-black leading-tight">
                      {toFaDigits(SUMMARY.credits)}
                    </span>
                    <span className="text-[10px] text-accent font-bold">واحد</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('finance')}
                  className={`rounded-2xl p-2.5 text-center ${tuitionTone.card} border active:scale-95 transition-all outline-none cursor-pointer flex flex-col items-center justify-center`}
                  title="مشاهده وضعیت شهریه و امور مالی"
                >
                  <p className={`text-[10.5px] ${tuitionTone.text} font-bold`}>شهریه</p>
                  <div className="mt-0.5 flex items-center justify-center gap-1 max-w-full">
                    <span className={`text-[13.5px] ${tuitionTone.text} font-black leading-tight`}>
                      {toFaDigits(SUMMARY.unpaid)}
                    </span>
                    <span className={`text-[9.5px] ${tuitionTone.text} font-bold`}>ت</span>
                  </div>
                </button>
              </div>
            </section>

            {!live && (
              <button
                type="button"
                onClick={() => {
                  if (isSessionAlive) {
                    sync(true);
                  } else {
                    openLoginModal();
                  }
                }}
                disabled={syncing}
                className="w-full sarv-card p-3.5 flex items-center justify-center gap-2 border border-primary/30 bg-primary-soft text-primary font-bold text-[13px] active:scale-[0.98] transition-all"
              >
                {syncing ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full bg-primary animate-ping" />
                    در حال دریافت و همگام‌سازی اطلاعات بهستان…
                  </>
                ) : isSessionAlive ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    دریافت و بارگذاری اطلاعات زنده بهستان
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    ورود زندهٔ بهستان
                  </>
                )}
              </button>
            )}
          </div>
        );

      case 'nextClass':
        return (
          <section
            key="nextClass"
            onClick={() => onNavigate('schedule')}
            className="sarv-card p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-primary active:scale-[0.98] transition-all border-r-4 border-r-primary bg-primary-soft"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-primary text-primary-content grid place-items-center shrink-0 shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-primary">
                    {NEXT?.status === 'now'
                      ? 'کلاس در جریان'
                      : NEXT?.isUpcomingDay
                      ? `کلاس بعدی (${NEXT.dayLabel})`
                      : NEXT
                      ? 'کلاس بعدی شما'
                      : TODAY_CLASSES.length > 0
                      ? 'کلاس‌های امروز'
                      : 'برنامه آموزشی'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-content font-bold font-mono">
                    {toFaDigits(
                      NEXT?.isUpcomingDay
                        ? `${NEXT.dayLabel} ${NEXT.time}`
                        : NEXT?.time ||
                          (TODAY_CLASSES.length > 0 && !NEXT
                            ? 'پایان کلاس‌ها'
                            : SUMMARY.nextClassIn || '—'),
                    )}
                  </span>
                </div>
                <h4 className="text-[14px] font-bold text-base-content truncate mt-0.5">
                  {vm.nextClass
                    ? `${vm.nextClass.title}${vm.nextClass.room && vm.nextClass.room !== 'ـ' ? ` · ${toFaDigits(vm.nextClass.room)}` : ''}`
                    : TODAY_CLASSES.length > 0
                    ? 'تمام کلاس‌های امروز برگزار شده‌اند'
                    : 'امروز کلاسی ثبت نشده'}
                </h4>
              </div>
            </div>
            <div className="w-7 h-7 rounded-xl bg-base-500/50 text-neutral grid place-items-center shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </div>
          </section>
        );

      case 'quickShortcuts':
        return (
          <section key="quickShortcuts" className="grid grid-cols-4 gap-2">
            {[
              {
                label: 'برنامه هفتگی',
                Icon: CalendarDays,
                tab: 'schedule',
                btnColor: 'bg-primary text-primary-content',
                textColor: 'text-primary',
              },
              {
                label: 'کارنامه ترم',
                Icon: TrendingUp,
                tab: 'grades',
                btnColor: 'bg-info text-info-content',
                textColor: 'text-info',
              },
              {
                label: 'امور مالی',
                Icon: CreditCard,
                tab: 'finance',
                btnColor: 'bg-success text-success-content',
                textColor: 'text-success',
              },
              {
                label: 'چارت و دروس',
                Icon: BookOpen,
                tab: 'chart',
                btnColor: 'bg-accent text-accent-content',
                textColor: 'text-accent',
              },
            ].map(({ label, Icon, tab, btnColor, textColor }) => (
              <button
                key={label}
                type="button"
                onClick={() => onNavigate(tab)}
                className="sarv-card p-3 flex flex-col items-center gap-2 active:scale-95 transition-all text-center hover:border-base-500 cursor-pointer"
              >
                <span className={`w-11 h-11 rounded-2xl grid place-items-center shadow-sm ${btnColor}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className={`text-[11px] font-bold leading-tight ${textColor}`}>{label}</span>
              </button>
            ))}
          </section>
        );

      case 'todayClasses':
        return (
          <section key="todayClasses" className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[14px] font-bold text-base-content flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                کلاس‌های امروز ({toFaDigits(TODAY_CLASSES.length)} درس)
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('schedule')}
                className="text-[11.5px] text-primary font-bold hover:underline cursor-pointer"
              >
                برنامه کامل هفته
              </button>
            </div>

            <div className="space-y-2">
              {TODAY_CLASSES.map((cls) => {
                const meta = statusMeta[cls.status] || statusMeta.later;
                const borderColMap = {
                  primary: 'border-r-primary',
                  success: 'border-r-success',
                  info: 'border-r-info',
                  warn: 'border-r-warn',
                  danger: 'border-r-danger',
                  accent: 'border-r-accent',
                  secondary: 'border-r-secondary',
                };
                const isHex = String(cls.color || '').startsWith('#') || String(cls.color || '').startsWith('rgb');
                const borderCol = isHex ? '' : (borderColMap[cls.color] || 'border-r-primary');

                return (
                  <article
                    key={cls.id}
                    style={isHex ? { borderRightColor: cls.color } : undefined}
                    className={`sarv-card p-3.5 flex items-start gap-3 border-r-4 ${borderCol}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[14px] font-bold text-base-content truncate">{cls.title}</h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {cls.absences > 0 && (
                            <span
                              className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 ${
                                cls.absences >= cls.maxAbsences
                                  ? 'bg-danger text-danger-content'
                                  : 'bg-warn text-warn-content'
                              }`}
                              title={`تعداد غیبت: ${toFaDigits(cls.absences)} از ${toFaDigits(cls.maxAbsences)}`}
                            >
                              <OdometerNumber value={cls.absences} height={14} className="text-[9.5px]" />
                              <span className="opacity-70">/</span>
                              <OdometerNumber value={cls.maxAbsences} height={14} className="text-[9.5px]" />
                              <span className="mr-0.5 font-sans">غیبت</span>
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${meta.chip}`}>
                            {cls.status === 'now' && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                              </span>
                            )}
                            <span>{meta.label}</span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-[11.5px] flex-wrap">
                        <span className="inline-flex items-center gap-1 font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-lg font-mono">
                          <Clock className="w-3 h-3 text-primary" />
                          {toFaDigits(cls.time)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-neutral">
                          <MapPin className="w-3.5 h-3.5 text-neutral" />
                          <span className="text-base-content font-medium">{toFaDigits(cls.room)}</span>
                        </span>
                        <span className="text-[10.5px] font-mono text-neutral bg-base-500/50 px-1.5 py-0.5 rounded">
                          {toFaDigits(cls.code)}
                        </span>
                        {isUt && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(cls.virtualUrl || cls.course?.virtualUrl || 'https://elearning.ut.ac.ir/', '_blank');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-primary-soft text-primary hover:bg-primary/20 transition active:scale-95 cursor-pointer shrink-0 border border-primary/20 mr-auto"
                            title="ورود به سامانه یادگیری الکترونیکی و کلاس مجازی دانشگاه تهران (elearning.ut.ac.ir)"
                          >
                            <Globe className="w-3 h-3" />
                            <span>کلاس مجازی</span>
                          </button>
                        )}
                      </div>

                      {/* نوار پیشرفت زنده کلاس در حال برگزاری */}
                      {cls.status === 'now' && cls.startHour != null && cls.endHour != null && (() => {
                        const nowH = new Date().getHours() + new Date().getMinutes() / 60;
                        const totalDuration = (cls.endHour - cls.startHour) * 60;
                        const elapsed = Math.max(0, (nowH - cls.startHour) * 60);
                        const remainingMinutes = Math.max(1, Math.round((cls.endHour - nowH) * 60));
                        const progressPct = Math.min(100, Math.max(4, Math.round((elapsed / Math.max(totalDuration, 1)) * 100)));

                        return (
                          <div className="mt-2.5 pt-2 border-t border-base-500/30 space-y-1">
                            <div className="flex items-center justify-between text-[10.5px]">
                              <span className="text-success font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                                {toFaDigits(remainingMinutes)} دقیقه تا پایان کلاس
                              </span>
                              <span className="font-mono text-neutral text-[10px]">
                                {toFaDigits(progressPct)}٪
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-base-500/40 overflow-hidden">
                              <div
                                className="h-full bg-success rounded-full transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );

      case 'weeklyLoad':
        return (
          <section key="weeklyLoad" className="sarv-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary-soft text-primary grid place-items-center">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="text-[13px] font-bold text-base-content">پراکندگی بار آموزشی هفته</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-base-500/50 text-neutral">
                مجموع: {toFaDigits(WEEK_HOURS)} ساعت
              </span>
            </div>

            {(() => {
              const maxHours = Math.max(...WEEK.map((d) => (typeof d.hours === 'number' ? d.hours : (d.count || 0))), 1);
              return (
                <div className="flex items-end justify-between gap-2 h-28 pt-2">
                  {WEEK.map((d, idx) => {
                    const hours = typeof d.hours === 'number' ? d.hours : (d.count || 0);
                    const isToday = idx === todayIdx;
                    const barBgTokens = ['bg-info', 'bg-primary', 'bg-secondary', 'bg-accent', 'bg-success'];
                    const heightPct = hours > 0
                      ? Math.max(14, Math.min(96, Math.round((hours / Math.max(maxHours, 4.5)) * 96)))
                      : 6;

                    const displayHours = Number.isInteger(hours) ? hours : hours.toFixed(1);

                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center h-full" title={`${toFaDigits(displayHours)} ساعت کلاس`}>
                        <div className="h-5 flex items-center justify-center">
                          <motion.span
                            initial={{ opacity: 0, y: 3 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.35,
                              delay: 0.22 + idx * 0.06,
                              ease: 'easeOut',
                            }}
                            className={`text-[10.5px] font-bold ${isToday ? 'text-primary font-black' : 'text-neutral'}`}
                          >
                            {toFaDigits(displayHours)}
                          </motion.span>
                        </div>

                        <div className="flex-1 w-full flex items-end justify-center py-1">
                          <motion.div
                            initial={{ height: 0, opacity: 0.25 }}
                            animate={{ height: `${heightPct}%`, opacity: isToday ? 1 : 0.85 }}
                            transition={{
                              duration: 0.6,
                              delay: 0.1 + idx * 0.06,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className={`w-full max-w-[28px] rounded-t-xl rounded-b-md ${barBgTokens[idx % barBgTokens.length]} ${
                              isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-base scale-105' : 'hover:opacity-100'
                            }`}
                          />
                        </div>

                        <div className="h-5 flex items-center justify-center">
                          <span
                            className={`text-[10.5px] ${
                              isToday ? 'text-primary font-black' : 'text-neutral font-medium'
                            }`}
                          >
                            {d.day}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        );

      case 'calendar':
        return (
          <div key="calendar">
            <DashboardCalendar onNavigate={onNavigate} />
          </div>
        );

      case 'studyHeatmap':
        return (
          <div key="studyHeatmap">
            <StudyHeatmap onNavigate={onNavigate} />
          </div>
        );

      case 'announcements': {
        const livePosts = feedState.posts || [];
        const channels = feedState.channels || [];
        const hasAnnouncements = livePosts.length > 0 || ANNOUNCEMENTS.length > 0;
        const displayedPosts = feedFilter === 'all'
          ? livePosts
          : livePosts.filter((p) => p.channelId === feedFilter);

        return (
          <section key="announcements" className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[13px] font-bold text-base-content flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-warn" />
                خبرنامه و اعلانات سروستان
              </h3>
              <div className="flex items-center gap-1.5">
                {feedState.unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-content">
                    {toFaDigits(feedState.unreadCount)} جدید
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="مدیریت اشتراک کانال‌ها"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                  <span>اشتراک‌ها</span>
                </button>
              </div>
            </div>

            {/* تب‌های فیلتر کانال‌ها: همه، سرونامه، شعرنامه */}
            {channels.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFeedFilter('all')}
                  className={`px-3 py-1 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    feedFilter === 'all'
                      ? 'bg-primary text-primary-content shadow-xs'
                      : 'bg-base-500/15 text-neutral hover:text-base-content hover:bg-base-500/25'
                  }`}
                >
                  همه ({toFaDigits(livePosts.length)})
                </button>
                {channels.map((ch) => {
                  const count = livePosts.filter((p) => p.channelId === ch.id).length;
                  const isActive = feedFilter === ch.id;
                  const pillColor = ch.id === 'shernameh'
                    ? 'bg-secondary text-secondary-content'
                    : ch.id === 'announcements'
                    ? 'bg-warn text-warn-content'
                    : 'bg-primary text-primary-content';

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setFeedFilter(ch.id)}
                      className={`px-3 py-1 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                        isActive
                          ? `${pillColor} shadow-xs`
                          : 'bg-base-500/15 text-neutral hover:text-base-content hover:bg-base-500/25'
                      }`}
                    >
                      <span>{ch.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">({toFaDigits(count)})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!hasAnnouncements && (
              <p className="text-[12px] text-neutral text-center py-3">اعلانی ثبت نشده</p>
            )}

            {/* پست‌های زنده خبرنامه از Sarvestan_feed */}
            {displayedPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => {
                  setSelectedFeedPost(post);
                  markPostAsRead(post.id);
                }}
                className={`sarv-card p-3.5 border-r-4 cursor-pointer hover:border-primary active:scale-[0.99] transition-all relative ${
                  post.color === 'accent'
                    ? 'border-r-accent bg-accent-soft'
                    : post.color === 'secondary'
                    ? 'border-r-secondary bg-secondary-soft'
                    : post.color === 'warn'
                    ? 'border-r-warn bg-warn-soft'
                    : 'border-r-primary bg-primary-soft'
                }`}
              >
                {!post.isRead && (
                  <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.badge && (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-base text-base-content border border-base-500/30">
                        {post.badge}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-base-500/20 text-neutral">
                      {post.channelId === 'shernameh' ? 'شعرنامه' : post.channelId === 'announcements' ? 'اطلاعیه‌ها' : 'سرونامه'}
                    </span>
                    <h4 className="text-[13px] font-bold text-base-content">{post.title}</h4>
                  </div>
                  <span className="text-[10px] text-neutral font-mono shrink-0">{toFaDigits(post.date)}</span>
                </div>
                <p className="text-[11.5px] text-neutral mt-1 leading-relaxed font-medium line-clamp-2">
                  {post.summary || post.content}
                </p>
              </article>
            ))}

            {/* اعلانات و گردش کارهای بهستان */}
            {(feedFilter === 'all' || feedFilter === 'announcements') && ANNOUNCEMENTS.map((a) => (
              <article
                key={a.id}
                className={`sarv-card p-3.5 border-r-4 ${
                  a.color === 'warn'
                    ? 'border-r-warn bg-warn-soft'
                    : 'border-r-secondary bg-secondary-soft'
                }`}
              >
                <h4 className="text-[13px] font-bold text-base-content">{a.title}</h4>
                <p className="text-[11.5px] text-neutral mt-1 leading-relaxed font-medium">{a.body}</p>
              </article>
            ))}
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="px-4 pt-3.5 space-y-3.5 mobile-pad-bottom">
      {widgetsConfig
        .filter((w) => w.enabled !== false)
        .map((w) => renderWidget(w.id))}

      {/* دکمه شخصی‌سازی چیدمان داشبورد */}
      <button
        type="button"
        onClick={() => setIsCustomizeOpen(true)}
        className="w-full sarv-card p-3 flex items-center justify-center gap-2 border border-base-500/40 bg-base-200/40 text-neutral hover:text-base-content hover:border-primary/50 text-[12.5px] font-bold active:scale-[0.98] transition-all cursor-pointer shadow-sm"
      >
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        <span>شخصی‌سازی و چیدمان داشبورد</span>
      </button>

      <DashboardCustomizeModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
      />

      <FeedModal
        post={selectedFeedPost}
        isOpen={!!selectedFeedPost}
        onClose={() => setSelectedFeedPost(null)}
      />

      <ChannelSubscribeModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        channels={feedState.channels}
        subscribedIds={feedState.subscribedChannelIds}
      />
    </div>
  );
}
