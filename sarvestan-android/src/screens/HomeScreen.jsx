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
} from 'lucide-react';
import { getViewModel } from '../data/viewModel';
import { useSarvestanData } from '../hooks/useSarvestanData';
import { openLoginModal } from '../services/loginFlow';
import { toFaDigits } from '../utils/faDigits';

export function getGpaStatusBadge(gpaRaw) {
  if (!gpaRaw || gpaRaw === 'ـ' || gpaRaw === '—' || gpaRaw === '-') return null;
  const clean = String(gpaRaw)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/٫/g, '.')
    .replace(/,/g, '.')
    .trim();
  const num = parseFloat(clean);
  if (!Number.isFinite(num)) return null;

  if (num >= 19) {
    return {
      label: 'ممتاز',
      chip: 'bg-warn-soft text-warn font-black',
    };
  }
  if (num >= 17) {
    return {
      label: 'معدل الف',
      chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold',
    };
  }
  if (num < 10) {
    return {
      label: 'مشروط',
      chip: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold',
    };
  }
  return null;
}

const statusMeta = {
  now: { label: 'در حال برگزاری', chip: 'bg-success-soft text-success font-bold' },
  next: { label: 'کلاس بعدی', chip: 'bg-primary-soft text-primary font-bold' },
  later: { label: 'در ادامه امروز', chip: 'bg-secondary-soft text-secondary font-bold' },
  done: { label: 'پایان یافته', chip: 'bg-base-500/30 text-neutral font-normal' },
};

// نحوه نمایش کارت مشخصات: 'row' (عکس مربعی لبه گرد در راست) | 'centered' (مرکزچین دایره‌ای قبلی برای بازگشت آسان)
const PROFILE_CARD_LAYOUT = 'row';

export default function HomeScreen({ onNavigate }) {
  const { live, isSessionAlive } = useSarvestanData();
  const vm = getViewModel();
  const STUDENT = vm.student;
  const SUMMARY = vm.summary;
  const TODAY_CLASSES = vm.todayClasses;
  const WEEK = vm.week;
  const ANNOUNCEMENTS = vm.announcements;
  const NEXT = vm.nextClass;
  const WEEK_HOURS = vm.weekHours ?? 13;
  const TERM_LABEL = vm.termLabel || STUDENT.term || 'نیمسال اول ۱۴۰۴–۱۴۰۵';
  const dayNameMap = { 6: 'شنبه', 0: 'یکشنبه', 1: 'دوشنبه', 2: 'سه‌شنبه', 3: 'چهارشنبه' };
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

  return (
    <div className="px-4 pt-3.5 space-y-3.5 mobile-pad-bottom">
      
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
                {STUDENT.fullName ? (
                  <h2 className="text-[17px] font-black text-base-content leading-snug truncate">
                    {STUDENT.fullName}
                  </h2>
                ) : (
                  <h2 className="text-[17px] font-black text-neutral leading-snug">
                    {live ? 'در حال دریافت اطلاعات…' : 'بدون اتصال'}
                  </h2>
                )}
                <p className="text-[11.5px] text-neutral font-medium mt-0.5 truncate">
                  {STUDENT.studentId ? (
                    <>
                      <span className="font-mono text-base-content font-bold">{toFaDigits(STUDENT.studentId)}</span>
                      {STUDENT.major ? ' · ' : ''}
                    </>
                  ) : null}
                  {STUDENT.major ? <span>{STUDENT.major}</span> : null}
                </p>
                {STUDENT.college && STUDENT.college !== STUDENT.major ? (
                  <p className="text-[10.5px] text-neutral/80 mt-0.5 truncate">{STUDENT.college}</p>
                ) : null}
              </div>

              {/* بج‌های اطلاعاتی — هم‌تراز با لبهٔ پایینی تصویر */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-secondary-soft text-secondary">
                  {toFaDigits(TERM_LABEL)}
                </span>
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
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-base ${
                  live ? 'bg-success' : 'bg-neutral'
                }`}
                title={live ? 'متصل به بهستان' : 'حالت نمونه'}
              />
            </div>

            {STUDENT.fullName ? (
              <h2 className="text-[19px] font-black text-base-content mt-3 leading-tight">
                {STUDENT.fullName}
              </h2>
            ) : (
              <h2 className="text-[19px] font-black text-base-content mt-3 leading-tight text-neutral">
                {live ? 'در حال دریافت اطلاعات…' : 'بدون اتصال'}
              </h2>
            )}
            <p className="text-[12px] text-neutral font-medium mt-0.5">
              {STUDENT.studentId ? (
                <>
                  <span className="font-mono text-base-content font-bold">{STUDENT.studentId}</span>
                  {STUDENT.major ? ' · ' : ''}
                </>
              ) : null}
              {STUDENT.major ? <span>{STUDENT.major}</span> : null}
            </p>
            {STUDENT.college ? (
              <p className="text-[11px] text-neutral mt-0.5">{STUDENT.college}</p>
            ) : null}

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[10.5px] font-black px-2.5 py-1 rounded-xl bg-secondary-soft text-secondary">
                {toFaDigits(TERM_LABEL)}
              </span>
              <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-xl bg-primary-soft text-primary">
                {STUDENT.major || STUDENT.college}
              </span>
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
            className="rounded-2xl p-2.5 text-center bg-primary-soft border border-primary-soft hover:border-primary active:scale-95 transition-all outline-none cursor-pointer"
            title="مشاهده کارنامه و محاسبه‌گر معدل"
          >
            <p className="text-[10.5px] text-primary font-bold">معدل کل</p>
            <p className="text-[16px] font-black text-primary mt-0.5 font-mono">
              {toFaDigits(SUMMARY.gpa)}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('chart')}
            className="rounded-2xl p-2.5 text-center bg-accent-soft border border-accent-soft hover:border-accent active:scale-95 transition-all outline-none cursor-pointer"
            title="مشاهده چارت و سرفصل دروس"
          >
            <p className="text-[10.5px] text-accent font-bold">واحد اخذشده</p>
            <p className="text-[16px] font-black text-accent mt-0.5 font-mono">
              {toFaDigits(SUMMARY.credits)} <span className="text-[10px] font-sans">واحد</span>
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('finance')}
            className={`rounded-2xl p-2.5 text-center ${tuitionTone.card} border active:scale-95 transition-all outline-none cursor-pointer`}
            title="مشاهده وضعیت شهریه و امور مالی"
          >
            <p className={`text-[10.5px] ${tuitionTone.text} font-bold`}>شهریه</p>
            <p className={`text-[13px] font-black ${tuitionTone.text} mt-0.5 truncate font-mono`}>
              {toFaDigits(SUMMARY.unpaid)} <span className="text-[9.5px] font-sans">ت</span>
            </p>
          </button>
        </div>
      </section>

      {!live && (
        <button
          type="button"
          onClick={() => {
            openLoginModal();
          }}
          className="w-full sarv-card p-3.5 flex items-center justify-center gap-2 border border-primary/30 bg-primary-soft text-primary font-bold text-[13px] active:scale-[0.98] transition-all"
        >
          <LogIn className="w-4 h-4" />
          ورود زندهٔ بهستان
        </button>
      )}

      {/* بنر وضعیت کلاس بعدی */}
      <section
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

      {/* شورتکات‌های دسترسی سریع ۴گانه با توکن‌های پویا:
          - برنامه هفتگی: primary (آبی)
          - کارنامه: info (فیروزه‌ای/آبی)
          - امور مالی: success (سبز)
          - چارت و دروس: accent (بنفش)
      */}
      <section className="grid grid-cols-4 gap-2">
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
            tab: 'more',
            btnColor: 'bg-accent text-accent-content',
            textColor: 'text-accent',
          },
        ].map(({ label, Icon, tab, btnColor, textColor }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(tab)}
            className="sarv-card p-3 flex flex-col items-center gap-2 active:scale-95 transition-all text-center hover:border-base-500"
          >
            <span className={`w-11 h-11 rounded-2xl grid place-items-center shadow-sm ${btnColor}`}>
              <Icon className="w-5 h-5" />
            </span>
            <span className={`text-[11px] font-bold leading-tight ${textColor}`}>{label}</span>
          </button>
        ))}
      </section>

      {/* کلاس‌های امروز — با توکن‌های رسمی سرو */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[14px] font-bold text-base-content flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            کلاس‌های امروز ({toFaDigits(TODAY_CLASSES.length)} درس)
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('schedule')}
            className="text-[11.5px] text-primary font-bold hover:underline"
          >
            برنامه کامل هفته
          </button>
        </div>

        <div className="space-y-2">
          {TODAY_CLASSES.map((cls) => {
            const meta = statusMeta[cls.status] || statusMeta.later;
            const borderCol =
              cls.color === 'primary'
                ? 'border-r-primary'
                : cls.color === 'info'
                ? 'border-r-info'
                : 'border-r-secondary';

            return (
              <article
                key={cls.id}
                className={`sarv-card p-3.5 flex items-start gap-3 border-r-4 ${borderCol}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[14px] font-bold text-base-content truncate">{cls.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.chip}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[11.5px]">
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
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* بار هفتگی کلاس‌ها با توکن‌های پویا */}
      <section className="sarv-card p-4">
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

        {/* نمودار میله‌ای با مقیاس‌بندی پویا و جلوگیری از تداخل با متن بالا */}
        {(() => {
          const maxCount = Math.max(...WEEK.map((d) => d.count || 0), 1);
          return (
            <div className="flex items-end justify-between gap-2 h-28 pt-2">
              {WEEK.map((d, idx) => {
                const count = d.count || 0;
                const isToday = idx === todayIdx;
                const barBgTokens = ['bg-info', 'bg-primary', 'bg-secondary', 'bg-accent', 'bg-success'];
                // مقیاس‌بندی متناسب بر اساس حداکثر کلاس‌ها در هفته
                const heightPct = count > 0
                  ? Math.max(14, Math.min(96, Math.round((count / Math.max(maxCount, 4)) * 96)))
                  : 6;

                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center h-full">
                    {/* شمارنده ستون — محافظت‌شده که هرگز با هدر بالا تداخل نمی‌کند */}
                    <div className="h-5 flex items-center justify-center">
                      <span className={`text-[10.5px] font-mono font-bold ${isToday ? 'text-primary font-black' : 'text-neutral'}`}>
                        {toFaDigits(count)}
                      </span>
                    </div>

                    {/* فضای میله — مقیاس‌بندی داخل کادر */}
                    <div className="flex-1 w-full flex items-end justify-center py-1">
                      <div
                        className={`w-full max-w-[28px] rounded-t-xl rounded-b-md transition-all duration-300 ${barBgTokens[idx % barBgTokens.length]} ${
                          isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-base scale-105' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    {/* نام روز */}
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

      {/* اعلانات با توکن‌های رسمی سرو */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[13px] font-bold text-base-content flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-warn" />
            اعلانات رسمی آموزشی
          </h3>
        </div>
        {ANNOUNCEMENTS.length === 0 && (
          <p className="text-[12px] text-neutral text-center py-3">اعلانی ثبت نشده</p>
        )}
        {ANNOUNCEMENTS.map((a) => (
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
    </div>
  );
}
