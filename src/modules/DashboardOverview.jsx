import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  MapPin,
  ChevronLeft,
  GraduationCap,
  FileText,
  CreditCard,
  Award,
  BookOpenCheck,
  FileCheck2,
  ShieldCheck,
  ExternalLink,
  Users
} from 'lucide-react';
import SarvButton from '../components/sarv/SarvButton';
import SarvBadge from '../components/sarv/SarvBadge';
import SarvAvatar from '../components/SarvAvatar';
import SarvStatCard from '../components/sarv/SarvStatCard';
import SarvEmptyState from '../components/sarv/SarvEmptyState';
import {
  BEHESTAN_PROFILE,
  BEHESTAN_ANNOUNCEMENTS,
  REAL_FINANCIAL_REPORT_2563,
  AUTHENTIC_STUDENT_TRANSCRIPTS,
  subscribeToData,
  getSchedules
} from '../services/behestanData';
import liveSync from '../services/behestanLiveSync';
import { toFaDigits } from '../utils/faDigits';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};
const itemUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } }
};

export default function DashboardOverview({ onNavigate }) {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const unsub = subscribeToData(() => setTick(t => t + 1));
    const unsubSync = liveSync?.subscribe?.(() => setTick(t => t + 1));
    return () => {
      unsub();
      if (unsubSync) unsubSync();
    };
  }, []);

  // برنامه کلاسی زنده روز جاری (از کش ری‌اکتیو — chrome.storage / postMessage)
  const getTodaySchedule = () => {
    try {
      const schedules = getSchedules() || {};
      const day = new Date().getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
      const dayMap = { 6: 'شنبه', 0: 'یکشنبه', 1: 'دوشنبه', 2: 'سه‌شنبه', 3: 'چهارشنبه' };
      const todayPersian = dayMap[day];
      if (!todayPersian) return []; // پنجشنبه / جمعه

      // جستجو در ترم جاری (4051) یا آخرین ترم موجود
      const termKeys = Object.keys(schedules)
        .filter(k => Array.isArray(schedules[k]) && schedules[k].length > 0)
        .sort()
        .reverse();
      if (!termKeys.length) return [];
      const courses = schedules[termKeys[0]] || [];

      return courses
        .filter(c => Array.isArray(c.days) && c.days.includes(todayPersian))
        .map(c => ({
          id: c.id || c.code,
          title: `${c.name} (گروه ${c.group || ''})`,
          professor: c.professor || '',
          time: c.time || '',
          hall: c.hall || '',
          status: 'upcoming',
          units: c.units || 0
        }));
    } catch {
      return [];
    }
  };

  const todayClasses = getTodaySchedule();

  // Compute GPA and units from transcript data (always available, no login required)
  const computedGpa = (() => {
    if (BEHESTAN_PROFILE.isLoggedIn && BEHESTAN_PROFILE.gpa && BEHESTAN_PROFILE.gpa !== 'ـ') {
      return BEHESTAN_PROFILE.gpa;
    }
    if (AUTHENTIC_STUDENT_TRANSCRIPTS.length === 0) return 'ـ';
    const latest = AUTHENTIC_STUDENT_TRANSCRIPTS[0];
    // Compute cumulative GPA across all terms
    let totalPoints = 0, totalUnits = 0;
    for (const term of AUTHENTIC_STUDENT_TRANSCRIPTS) {
      const gpaNum = parseFloat(term.termGpa.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      if (!isNaN(gpaNum)) {
        totalPoints += gpaNum * term.passedUnits;
        totalUnits += term.passedUnits;
      }
    }
    if (totalUnits === 0) return 'ـ';
    return (totalPoints / totalUnits).toFixed(2);
  })();

  const computedUnitsPassed = (() => {
    if (BEHESTAN_PROFILE.isLoggedIn && BEHESTAN_PROFILE.totalUnitsPassed > 0) {
      return BEHESTAN_PROFILE.totalUnitsPassed;
    }
    if (AUTHENTIC_STUDENT_TRANSCRIPTS.length === 0) return 0;
    return AUTHENTIC_STUDENT_TRANSCRIPTS[0].totalPassedUnits || 0;
  })();

  const computedStanding = (() => {
    if (BEHESTAN_PROFILE.isLoggedIn && BEHESTAN_PROFILE.standing && BEHESTAN_PROFILE.standing !== 'ـ') {
      return BEHESTAN_PROFILE.standing;
    }
    if (AUTHENTIC_STUDENT_TRANSCRIPTS.length > 0 && AUTHENTIC_STUDENT_TRANSCRIPTS[0].standing) {
      return AUTHENTIC_STUDENT_TRANSCRIPTS[0].standing;
    }
    return 'در انتظار دریافت از بهستان';
  })();

  const quickAccessModules = [
    {
      id: 'transcripts',
      title: 'کارنامه و ریز نمرات',
      desc: 'کارنامه رسمی گزارش ۷۹ و سوابق ترم‌ها',
      code: '۷۹',
      icon: Award,
      accent: 'primary'
    },
    {
      id: 'schedule',
      title: 'برنامه هفتگی و آزمون‌ها',
      desc: 'ماتریس کلاس‌ها و کارت ورود به جلسه',
      code: '۷۸ · ۴۲۸',
      icon: Calendar,
      accent: 'info'
    },
    {
      id: 'finance',
      title: 'امور مالی و شهریه',
      desc: 'ریزتراز ۲۵۶۳ و پرداخت شاپرک',
      code: '۲۵۶۳',
      icon: CreditCard,
      accent: 'warn'
    },
    {
      id: 'curriculum',
      title: 'چارت و سرفصل دروس',
      desc: 'وضعیت دروس و پیش‌نیازها',
      code: '۱۱۱۲۶',
      icon: BookOpenCheck,
      accent: 'success'
    }
  ];

  const debtToman = REAL_FINANCIAL_REPORT_2563.totalDebtRial > 0
    ? toFaDigits((REAL_FINANCIAL_REPORT_2563.totalDebtRial / 10).toLocaleString('fa-IR'))
    : '۰';

  const gpaDisplay = computedGpa && computedGpa !== 'ـ' ? toFaDigits(computedGpa) : computedGpa;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      variants={stagger}
      className="space-y-6 text-right"
    >
      {/* Hero */}
      <motion.div variants={itemUp} className="sarv-card p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <SarvAvatar
              fullName={BEHESTAN_PROFILE.fullName}
              photo={BEHESTAN_PROFILE.photo}
              size="xl"
              isLoggedIn={BEHESTAN_PROFILE.isLoggedIn}
            />
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-base-content truncate">
                  {BEHESTAN_PROFILE.fullName}
                </h2>
                {BEHESTAN_PROFILE.isLoggedIn && (
                  <SarvBadge variant="success" size="sm" dot>
                    متصل به بهستان
                  </SarvBadge>
                )}
                {BEHESTAN_PROFILE.standing && BEHESTAN_PROFILE.standing !== 'ـ' && (
                  <SarvBadge variant="primary" soft size="sm">
                    {BEHESTAN_PROFILE.standing}
                  </SarvBadge>
                )}
              </div>
              <div className="text-xs text-neutral flex flex-wrap items-center gap-2">
                <span>{BEHESTAN_PROFILE.major}</span>
                <span className="opacity-40">•</span>
                <span className="font-mono text-base-content/90">{toFaDigits(BEHESTAN_PROFILE.studentId)}</span>
              </div>
            </div>
          </div>

          <SarvButton
            variant="primary"
            styleType="outline"
            size="sm"
            onClick={() => onNavigate('letters')}
          >
            <FileText className="w-4 h-4 ml-1.5" />
            گواهی اشتغال به تحصیل
          </SarvButton>
        </div>
      </motion.div>

      {/* Stat bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemUp}>
          <SarvStatCard
            icon={Award}
            label="معدل کل"
            value={gpaDisplay}
            accent="primary"
            delay={0.05}
            subtitle={
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {computedStanding}
              </span>
            }
            onClick={() => onNavigate('transcripts')}
          />
        </motion.div>

        <motion.div variants={itemUp}>
          <SarvStatCard
            icon={GraduationCap}
            label="واحدهای گذرانده"
            value={toFaDigits(computedUnitsPassed)}
            accent="info"
            delay={0.1}
            progress={Math.min(1, (computedUnitsPassed || 0) / 140)}
            subtitle={`از ${toFaDigits(140)} واحد چارت`}
          />
        </motion.div>

        <motion.div variants={itemUp}>
          <SarvStatCard
            icon={CreditCard}
            label="بدهی شهریه"
            value={
              <>
                {debtToman}
                <span className="text-xs font-normal text-neutral mr-1">تومان</span>
              </>
            }
            accent={REAL_FINANCIAL_REPORT_2563.totalDebtRial > 0 ? 'danger' : 'success'}
            delay={0.15}
            onClick={() => onNavigate('finance')}
            subtitle={
              REAL_FINANCIAL_REPORT_2563.totalDebtRial > 0
                ? 'تسویه آنلاین ←'
                : 'تسویه حساب کامل'
            }
          />
        </motion.div>

        <motion.div variants={itemUp}>
          <SarvStatCard
            icon={Users}
            label="کلاس‌های امروز"
            value={toFaDigits(todayClasses.length)}
            accent="accent"
            delay={0.2}
            onClick={() => onNavigate('schedule')}
            subtitle={
              todayClasses.length > 0
                ? todayClasses[0]?.time || 'در برنامه امروز'
                : 'برنامه‌ای ثبت نشده'
            }
          />
        </motion.div>
      </div>

      {/* Quick access */}
      <motion.div variants={itemUp} className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral px-1">دسترسی سریع</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccessModules.map((m, i) => {
            const Icon = m.icon;
            const accent = `var(--theme-color-${m.accent}, var(--theme-color-primary))`;
            return (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => onNavigate(m.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05, type: 'spring', stiffness: 300, damping: 26 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="sarv-card sarv-card-hover p-5 text-right flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="p-3 rounded-[var(--radius-button,0.75rem)]"
                    style={{
                      background: `color-mix(in oklab, ${accent} 14%, transparent)`,
                      color: accent
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <SarvBadge variant="neutral" outline size="sm" className="font-mono">
                    {m.code}
                  </SarvBadge>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
                    {m.title}
                  </h4>
                  <p className="text-[11px] text-neutral leading-relaxed line-clamp-2">{m.desc}</p>
                </div>
                <div className="text-[11px] text-primary font-semibold flex items-center gap-1 pt-2 border-t border-base-500/40">
                  <span>باز کردن</span>
                  <span>←</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Today + Announcements */}
      <motion.div variants={itemUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 sarv-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-base-500/40 pb-3">
            <h3 className="text-sm font-semibold text-base-content flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              کلاس‌های امروز
            </h3>
            <SarvButton variant="primary" styleType="flat" size="sm" onClick={() => onNavigate('schedule')}>
              کل هفته ←
            </SarvButton>
          </div>

          {todayClasses.length === 0 ? (
            <p className="text-xs text-neutral py-8 text-center">
              امروز کلاسی در برنامه ثبت نشده است (یا هنوز از بهستان همگام نشده).
            </p>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="sarv-chip sarv-chip-info p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-semibold text-base-content truncate">{cls.title}</h4>
                    <div className="text-[11px] text-neutral flex flex-wrap items-center gap-2">
                      {cls.hall && cls.hall !== 'ـ' && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {cls.hall}
                        </span>
                      )}
                      {cls.units > 0 && (
                        <SarvBadge variant="accent" soft size="sm">{cls.units} واحد</SarvBadge>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-primary shrink-0">
                    {cls.time}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="sarv-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-base-500/40 pb-3">
            <h3 className="text-sm font-semibold text-base-content flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              اعلانات
            </h3>
          </div>

          {BEHESTAN_ANNOUNCEMENTS.length === 0 ? (
            <p className="text-xs text-neutral py-8 text-center leading-relaxed">
              اعلان رسمی جدیدی از بهستان دریافت نشده است.
            </p>
          ) : (
            <div className="space-y-3">
              {BEHESTAN_ANNOUNCEMENTS.map((ann) => (
                <div key={ann.id} className="p-3 rounded-[var(--radius-card,1rem)] bg-base-500/20 border border-base-500/40 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-base-content line-clamp-1">{ann.title}</span>
                    {ann.urgent && <SarvBadge variant="warn" soft size="sm">مهم</SarvBadge>}
                  </div>
                  <p className="text-[11px] text-neutral leading-relaxed line-clamp-3">{ann.body}</p>
                  <div className="text-[10px] text-neutral/60 font-mono">{ann.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
