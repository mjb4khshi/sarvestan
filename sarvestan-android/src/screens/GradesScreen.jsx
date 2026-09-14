import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Calculator,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  TrendingUp,
  Plus,
  Minus,
} from 'lucide-react';
import { getViewModel } from '../data/viewModel';
import { toFaDigits } from '../utils/faDigits';
import OdometerNumber from '../components/OdometerNumber';
import SarvCheckbox from '../components/SarvCheckbox';
import { getGpaStatusBadge } from './HomeScreen';

function scoreColor(scoreVal, status) {
  if (status === 'حذف اضطراری') {
    return 'text-danger bg-danger-soft font-black';
  }
  if (status === 'در انتظار') {
    return 'text-warn bg-warn-soft font-black';
  }
  if (scoreVal === null || scoreVal === undefined || isNaN(scoreVal)) {
    return 'text-neutral bg-base-500/40';
  }
  const num = Number(scoreVal);
  if (num >= 17) return 'text-success bg-success-soft font-black';
  if (num >= 14) return 'text-primary bg-primary-soft font-black';
  if (num >= 12) return 'text-warn bg-warn-soft font-black';
  return 'text-danger bg-danger-soft font-black';
}

export default function GradesScreen({ onNavigate }) {
  const vm = getViewModel();
  const TERMS = vm.termsData?.length ? vm.termsData : [];
  // ترم انتخاب‌شده — پیش‌فرض آخرین ترم جاری
  const [selectedTermId, setSelectedTermId] = useState(TERMS[0]?.id);
  const activeTerm = useMemo(
    () => TERMS.find((t) => t.id === selectedTermId) || TERMS[0],
    [selectedTermId, TERMS],
  );

  // آیا ترم انتخاب‌شده آخرین ترم جاری است؟
  const isLatestTerm = selectedTermId === TERMS[0]?.id;

  // وضعیت باز/بسته بودن محاسبه‌گر معدل
  const [calcOpen, setCalcOpen] = useState(true);

  // وضعیت دروس شبیه‌سازی‌شده فقط برای آخرین ترم
  const [simCourses, setSimCourses] = useState(() => {
    const init = {};
    (TERMS[0]?.courses || []).forEach((c) => {
      init[c.id] = {
        included: c.status !== 'حذف اضطراری' && c.status !== 'در انتظار',
        score: c.score ?? 17.0,
      };
    });
    return init;
  });

  // تاگل حذف/لحاظ کردن یک درس در محاسبه معدل
  const toggleCourseInclusion = (courseId) => {
    setSimCourses((prev) => {
      const current = prev[courseId] || { included: true, score: 17 };
      return {
        ...prev,
        [courseId]: { ...current, included: !current.included },
      };
    });
  };

  // تغییر نمره شبیه‌سازی‌شده درس
  const updateCourseScore = (courseId, newScore) => {
    const clamped = Math.min(20, Math.max(0, parseFloat(newScore) || 0));
    setSimCourses((prev) => {
      const current = prev[courseId] || { included: true, score: 17 };
      return {
        ...prev,
        [courseId]: { ...current, score: Math.round(clamped * 100) / 100 },
      };
    });
  };

  // افزایش یا کاهش پله‌ای نمره با دکمه‌های چپ و راست
  const stepCourseScore = (courseId, delta) => {
    setSimCourses((prev) => {
      const current = prev[courseId] || { included: true, score: 17 };
      const next = Math.min(20, Math.max(0, (current.score ?? 17) + delta));
      return {
        ...prev,
        [courseId]: { ...current, score: Math.round(next * 100) / 100 },
      };
    });
  };

  // ریست کردن شبیه‌ساز به نمرات اولیه آخرین ترم
  const resetSimulator = () => {
    const init = {};
    (TERMS[0]?.courses || []).forEach((c) => {
      init[c.id] = {
        included: true,
        score: c.score ?? 17.0,
      };
    });
    setSimCourses(init);
  };

  // محاسبه زنده معدل ترم جاری با احتساب دروس لحاظ‌شده
  const calculatedTermGPA = useMemo(() => {
    let totalPoints = 0;
    let totalUnits = 0;

    (TERMS[0]?.courses || []).forEach((c) => {
      const sim = simCourses[c.id] || { included: true, score: c.score ?? 17 };
      if (sim.included && sim.score !== null && !isNaN(sim.score)) {
        totalPoints += sim.score * c.unit;
        totalUnits += c.unit;
      }
    });

    if (totalUnits === 0) return '۰٫۰۰';
    return (totalPoints / totalUnits).toFixed(2);
  }, [simCourses]);

  // محاسبه زنده تعداد واحدهای لحاظ‌شده
  const calculatedUnits = useMemo(() => {
    let units = 0;
    (TERMS[0]?.courses || []).forEach((c) => {
      const sim = simCourses[c.id] || { included: true };
      if (sim.included) units += c.unit;
    });
    return units;
  }, [simCourses]);

  // تخمین معدل کل بر اساس میانگین وزنی آخرین ترم شبیه‌سازی‌شده و ترم‌های قطعی گذشته
  const calculatedCumulativeGPA = useMemo(() => {
    let totalPoints = 0;
    let totalUnits = 0;

    // آخرین ترم شبیه‌سازی‌شده
    (TERMS[0]?.courses || []).forEach((c) => {
      const sim = simCourses[c.id] || { included: true, score: c.score ?? 17 };
      if (sim.included && sim.score !== null && !isNaN(sim.score)) {
        totalPoints += sim.score * c.unit;
        totalUnits += c.unit;
      }
    });

    // سایر ترم‌های گذشته (نمرات قطعی)
    for (let i = 1; i < TERMS.length; i++) {
      TERMS[i].courses.forEach((c) => {
        if (c.score !== null && !isNaN(c.score)) {
          totalPoints += c.score * c.unit;
          totalUnits += c.unit;
        }
      });
    }

    if (totalUnits === 0) return vm.summary?.gpa || 'ـ';
    return (totalPoints / totalUnits).toFixed(2);
  }, [simCourses]);

  return (
    <div className="px-4 pt-4 space-y-4 mobile-pad-bottom">
      {TERMS.length === 0 ? (
        <div className="sarv-card p-6 text-center">
          <p className="text-[13px] font-bold text-base-content">کارنامه‌ای موجود نیست</p>
          <p className="text-[12px] text-neutral mt-1">
            بعد از همگام‌سازی با بهستان، نمرات اینجا نمایش داده می‌شود.
          </p>
        </div>
      ) : (
      <>
      {/* انتخابگر تب‌های ترم‌های تحصیلی با انیمیشن جابجایی مستطیل زیرین (layoutId) */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[12px] font-bold text-base-content flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" />
            انتخاب نیمسال تحصیلی
          </span>
          <span className="text-[11px] text-neutral font-bold">
            {toFaDigits(TERMS.length)} نیمسال موجود
          </span>
        </div>

        <div className="sarv-seg relative">
          {TERMS.map((t) => {
            const isSelected = selectedTermId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTermId(t.id)}
                className={`relative py-2 px-2 rounded-xl text-center transition-colors select-none outline-none ${
                  isSelected ? 'text-primary-content font-bold' : 'text-neutral hover:text-base-content'
                }`}
              >
                {/* مستطیل شناور متحرک زیر تب فعال */}
                {isSelected && (
                  <motion.span
                    layoutId="termActivePill"
                    className="absolute inset-0 rounded-xl bg-primary shadow-sm z-0"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 block">
                  <p className="text-[11.5px] leading-tight font-black">{toFaDigits(t.shortName)}</p>
                  <p className="text-[10px] font-mono mt-0.5 opacity-90">معدل: {toFaDigits(t.gpa)}</p>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* هیرو کارت نمرات ترم انتخابی با انیمیشن کیلومترشمار آنالوگ */}
      <motion.section
        key={selectedTermId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="sarv-card p-5 relative overflow-hidden border border-primary-soft"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-primary text-primary-content shadow-sm">
            {toFaDigits(activeTerm.name)}
          </span>
          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-base-500/40 text-neutral">
            {activeTerm.status}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] text-neutral font-bold">معدل کارنامه ترم</p>
            {/* انیمیشن کیلومترشمار آنالوگ مکانیکی برای معدل */}
            <div className="mt-1 flex items-center gap-1">
              <OdometerNumber value={activeTerm.gpa} height={38} className="text-[36px] text-primary" />
            </div>
            <p
              className={`text-[11px] mt-2 flex items-center gap-1 font-bold ${
                getGpaStatusBadge(activeTerm.gpa)?.label === 'مشروط'
                  ? 'text-danger'
                  : getGpaStatusBadge(activeTerm.gpa)?.label === 'ممتاز'
                  ? 'text-amber-600 dark:text-amber-400'
                  : getGpaStatusBadge(activeTerm.gpa)?.label === 'معدل الف'
                  ? 'text-success'
                  : 'text-neutral'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              وضعیت ترم: {getGpaStatusBadge(activeTerm.gpa)?.label || 'عادی'}
            </p>
          </div>

          <div className="text-left space-y-1.5">
            <div className="rounded-2xl p-2.5 bg-info-soft border border-info-soft text-center min-w-[100px]">
              <p className="text-[10.5px] text-info font-bold">واحدهای گذرانده</p>
              <p className="text-[16px] font-black text-info font-mono mt-0.5">
                {toFaDigits(activeTerm.passedUnits)} از {toFaDigits(activeTerm.totalUnits)}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ابزار محاسبه‌گر معدل کل و معدل ترم — فقط برای آخرین ترم تحصیلی */}
      {isLatestTerm ? (
        <section className="sarv-card p-4 border border-accent-soft">
          <div
            onClick={() => setCalcOpen(!calcOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-accent text-accent-content grid place-items-center shadow-sm">
                <Calculator className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-[13.5px] font-black text-base-content flex items-center gap-1.5">
                  محاسبه‌گر معدل ترم و کل
                  <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-accent-soft text-accent">
                    ترم جاری
                  </span>
                </h3>
                <p className="text-[10.5px] text-neutral mt-0.5">
                  امکان حذف دروس و سناریوسازی زنده نمرات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetSimulator();
                }}
                title="بازنشانی نمرات"
                className="w-7 h-7 rounded-lg bg-base-500/30 text-neutral hover:text-base-content grid place-items-center active:scale-90"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <span className="text-neutral">
                {calcOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {calcOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* باکس نتایج محاسبه زنده با انیمیشن کیلومترشمار */}
                <div className="mt-3 pt-3 border-t border-base-500/30 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl p-2 bg-primary-soft border border-primary-soft">
                    <p className="text-[10px] text-primary font-bold">معدل شبیه‌ساز ترم</p>
                    <div className="mt-0.5 flex justify-center">
                      <OdometerNumber value={calculatedTermGPA} height={20} className="text-[17px] text-primary" />
                    </div>
                  </div>
                  <div className="rounded-xl p-2 bg-info-soft border border-info-soft">
                    <p className="text-[10px] text-info font-bold">معدل کل پیش‌بینی</p>
                    <div className="mt-0.5 flex justify-center">
                      <OdometerNumber value={calculatedCumulativeGPA} height={20} className="text-[17px] text-info" />
                    </div>
                  </div>
                  <div className="rounded-xl p-2 bg-secondary-soft border border-secondary-soft">
                    <p className="text-[10px] text-secondary font-bold">واحدهای موثر</p>
                    <div className="mt-0.5 flex justify-center items-center gap-1">
                      <OdometerNumber value={calculatedUnits} height={20} className="text-[17px] text-secondary" />
                      <span className="text-[9.5px] font-sans text-secondary">واحد</span>
                    </div>
                  </div>
                </div>

                {/* فهرست دروس با سوئیچ حذف/لحاظ و تنظیم نمره */}
                <div className="space-y-2 mt-3">
                  {(TERMS[0]?.courses || []).map((c) => {
                    const sim = simCourses[c.id] || {
                      included: true,
                      score: c.score ?? 17.0,
                    };
                    const isIncluded = sim.included;

                    return (
                      <div
                        key={c.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                          isIncluded
                            ? 'bg-base-500/20 border-base-500/40'
                            : 'bg-base-500/5 border-dashed border-base-500/30 opacity-50'
                        }`}
                      >
                        {/* چک‌باکس با کامپوننت رسمی سرو و انیمیشن اصیل Sarv UI */}
                        <div className="flex items-center gap-2.5 text-right min-w-0 flex-1">
                          <SarvCheckbox
                            checked={isIncluded}
                            onChange={() => toggleCourseInclusion(c.id)}
                            variant="primary"
                          />
                          <div
                            onClick={() => toggleCourseInclusion(c.id)}
                            className="min-w-0 cursor-pointer select-none"
                          >
                            <p
                              className={`text-[12.5px] font-bold truncate transition-colors ${
                                isIncluded ? 'text-base-content hover:text-primary' : 'line-through text-neutral'
                              }`}
                            >
                              {c.course}
                            </p>
                            <p className="text-[10px] text-neutral">
                              {toFaDigits(c.unit)} واحد {isIncluded ? '· موثر در معدل' : '· حذف‌شده از محاسبه'}
                            </p>
                          </div>
                        </div>

                        {/* تغییر جذاب نمره با انیمیشن کیلومترشمار، اعداد فارسی و دکمه‌های کم و زیاد در چپ و راست */}
                        {isIncluded ? (
                          <div className="flex items-center gap-1 shrink-0 bg-base border border-base-500/60 rounded-xl p-0.5 shadow-xs">
                            {/* دکمه کاهش نمره (-) */}
                            <button
                              type="button"
                              onClick={() => stepCourseScore(c.id, -0.25)}
                              className="w-7 h-7 rounded-lg bg-base-500/30 hover:bg-base-500/60 text-base-content grid place-items-center active:scale-90 transition-all outline-none"
                              title="کاهش ۰٫۲۵ نمره"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            {/* نمایش نمره با انیمیشن کیلومترشمار آنالوگ و ارقام کاملاً فارسی */}
                            <div className="min-w-[48px] px-1 text-center flex items-center justify-center">
                              <OdometerNumber
                                value={sim.score.toFixed(2)}
                                height={20}
                                className="text-[14px] text-primary"
                              />
                            </div>

                            {/* دکمه افزایش نمره (+) */}
                            <button
                              type="button"
                              onClick={() => stepCourseScore(c.id, 0.25)}
                              className="w-7 h-7 rounded-lg bg-primary text-primary-content grid place-items-center hover:opacity-90 active:scale-90 transition-all outline-none shadow-xs"
                              title="افزایش ۰٫۲۵ نمره"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral font-bold px-2 py-1 rounded-lg bg-base-500/30 shrink-0">
                            حذف‌شده
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      ) : null}

      {/* عناوین دروس و کارنامه رسمی برای ترم انتخابی */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[13.5px] font-bold text-base-content flex items-center gap-1.5">
            <Award className="w-4 h-4 text-primary" />
            نمرات ثبت‌شده ({toFaDigits(activeTerm.shortName)})
          </h3>
          <span className="text-[11px] text-neutral font-mono font-bold">
            {toFaDigits(activeTerm.courses.length)} عنوان درس
          </span>
        </div>

        {activeTerm.courses.map((g, i) => (
          <motion.article
            key={g.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i }}
            className={`sarv-card p-3.5 flex items-center justify-between gap-3 hover:border-primary transition-colors border-r-4 ${
              g.status === 'حذف اضطراری'
                ? 'border-r-danger'
                : g.status === 'در انتظار'
                  ? 'border-r-warn'
                  : g.status === 'قطعی'
                    ? 'border-r-success'
                    : 'border-r-warn'
            }`}
          >
            <div className="min-w-0 flex-1">
              <h4 className="text-[13.5px] font-bold text-base-content truncate">{g.course}</h4>
              <div className="mt-1 flex items-center gap-2 text-[11px]">
                <span className="font-bold text-neutral">{toFaDigits(g.unit)} واحد</span>
                <span className="text-neutral/40">·</span>
                <span
                  className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border ${
                    g.status === 'حذف اضطراری'
                      ? 'bg-danger-soft text-danger border-danger-soft'
                      : g.status === 'در انتظار'
                        ? 'bg-warn-soft text-warn border-warn-soft'
                        : g.status === 'قطعی'
                          ? 'bg-success-soft text-success border-success-soft'
                          : 'bg-warn-soft text-warn border-warn-soft'
                  }`}
                >
                  {g.status}
                </span>
              </div>
            </div>

            {/* جعبه نمره سالید */}
            <div className="text-left shrink-0">
              <div
                className={`min-w-[56px] px-2.5 py-1 rounded-xl border text-center font-mono text-[15px] ${scoreColor(
                  g.score,
                  g.status
                )}`}
              >
                {toFaDigits(g.displayScore)}
              </div>
            </div>
          </motion.article>
        ))}
      </section>
      </>
      )}

      <p className="text-center text-[10.5px] text-neutral pt-1 pb-2">
        اطلاعات مستقیماً از فرم ۷۹ بهستان واکشی شده و کاملاً با توکن‌های سرو هماهنگ است
      </p>
    </div>
  );
}
