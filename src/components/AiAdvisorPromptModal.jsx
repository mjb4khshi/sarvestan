import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Bot,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Calendar,
  BookOpen,
  HelpCircle,
  FileText,
  Layers,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { getViewModel, getExamsView } from '../data/viewModel';
import { getCurrentTermSchedule } from '../services/behestan/store';
import { getSelectedUniversity, getUniversityName } from '../services/behestan/session';
import { toFaDigits } from '../utils/faDigits';
import SarvCheckbox from './SarvCheckbox';

const CONSULTATION_MODES = [
  {
    id: 'exam_prep',
    title: 'برنامه‌ریزی امتحانات',
    desc: 'جدول مرور فرجه‌ها و استراتژی جمع‌بندی',
    icon: Calendar,
    goalPrompt: `لطفاً با توجه به تاریخ‌های امتحانات و روزهای باقیمانده، یک جدول زمان‌بندی فشرده و واقع‌بینانه برای ایام فرجه و امتحانات طراحی کن. مشخص کن به هر درس چند روز اختصاص دهم و روز قبل از هر امتحان چطور جمع‌بندی کنم.`,
  },
  {
    id: 'course_selection',
    title: 'مشاوره انتخاب واحد',
    desc: 'پیشنهاد دروس ترم بعد و زنجیره پیش‌نیازها',
    icon: BookOpen,
    goalPrompt: `با توجه به معدل کل، تعداد واحدهای پاس‌شده و سوابق دروسی که نمره بالا یا پایین گرفته‌ام، برای ترم آینده چه استراتژی‌ای در انتخاب واحد پیشنهاد می‌کنی؟ چه دروسی را در اولویت بردارم و سقف مجاز واحد من چقدر است؟`,
  },
  {
    id: 'gpa_improvement',
    title: 'تحلیل و ارتقای معدل',
    desc: 'شناسایی نقاط ضعف و جبران دروس افتاده',
    icon: GraduationCap,
    goalPrompt: `لطفاً کارنامه و روند معدل‌های من را به دقت تحلیل کن. نقاط ضعف و دروسی که معدلم را پایین کشیده‌اند مشخص کن و بگو چطور می‌توانم در ترم‌های باقیمانده معدل کل خود را به حداکثر برسانم (مثلاً با معرفی به استاد یا ترمیم).`,
  },
  {
    id: 'future_path',
    title: 'ارشد، اپلای و شغل',
    desc: 'ارزیابی پرونده برای پذیرش، کنکور یا کار',
    icon: Layers,
    goalPrompt: `با در نظر گرفتن دانشگاه، رشته تحصیلی، معدل و دروسی که گذرانده‌ام، وضعیت من را برای ادامه تحصیل در مقطع ارشد و اپلای یا ورود به بازار کار تخصصی ارزیابی کن. چه حوزه‌هایی بر اساس سوابقم مناسب‌ترند و چه خلأهایی را باید پر کنم؟`,
  },
  {
    id: 'general',
    title: 'پروفایل جامع (آزاد)',
    desc: 'ارائه کلیه سوابق برای هر سوال دلخواه',
    icon: Bot,
    goalPrompt: `این سوابق و وضعیت تحصیلی کامل من در دانشگاه است. لطفاً پس از مرور آن، آمادگی خود را اعلام کن تا سوالات اختصاصی‌ام را از تو بپرسم.`,
  },
];

export default function AiAdvisorPromptModal({ isOpen, onClose }) {
  const [selectedMode, setSelectedMode] = useState('exam_prep');
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [hidePrivacyInfo, setHidePrivacyInfo] = useState(false);
  const [includeFullTranscript, setIncludeFullTranscript] = useState(true);
  const [includeExams, setIncludeExams] = useState(true);
  const [includeSchedule, setIncludeSchedule] = useState(true);
  const [customQuestion, setCustomQuestion] = useState('');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToMessage] = useState('');

  const vm = useMemo(() => getViewModel(), [isOpen]);
  const exams = useMemo(() => getExamsView(), [isOpen]);
  const currentSchedule = useMemo(() => getCurrentTermSchedule() || [], [isOpen]);

  const showToast = (msg) => {
    setToMessage(msg);
    setTimeout(() => setToMessage(''), 3000);
  };

  // تولید پرامپت منسجم، کاملاً دقیق و بدون نقص برای هوش مصنوعی
  const generatedPrompt = useMemo(() => {
    if (!isOpen) return '';

    const student = vm.student || {};
    const uniName = getUniversityName(getSelectedUniversity());
    const termsData = vm.termsData || [];

    // معدل کل تجمعی دقیق
    const gpa =
      vm.summary?.gpa && vm.summary.gpa !== 'ـ' && vm.summary.gpa !== '—'
        ? vm.summary.gpa
        : vm.profile?.gpa || student.gpa || 'ـ';

    // کل واحدهای گذرانده‌شده تا این ترم
    let totalPassedCredits = 0;
    if (vm.curriculum?.passedCredits && Number(vm.curriculum.passedCredits) > 0) {
      totalPassedCredits = Number(vm.curriculum.passedCredits);
    } else if (vm.profile?.totalUnitsPassed && Number(vm.profile.totalUnitsPassed) > 0) {
      totalPassedCredits = Number(vm.profile.totalUnitsPassed);
    } else {
      totalPassedCredits = termsData.reduce((acc, t) => {
        if (t.status === 'در حال ثبت نمرات') return acc;
        return acc + (Number(t.passedUnits) || 0);
      }, 0);
    }

    // استخراج دروس ترم جاری بدون تکرار
    const currentTermCourses = [];
    const seenCodes = new Set();
    (currentSchedule || []).forEach((c) => {
      const title = c.name || c.title || c.course || '';
      const code = c.code ? String(c.code).replace(/\D/g, '') : title;
      if (!title) return;
      const key = code ? `${code}-${title}` : title;
      if (seenCodes.has(key)) return;
      seenCodes.add(key);

      const u = Number(c.units ?? c.unit) || (c.isProject ? 3 : 0);
      const prof = c.professor && c.professor !== 'ـ' ? c.professor : 'نامشخص';
      const timeStr = c.time || c.classTimeRaw ? `${toFaDigits(c.time || c.classTimeRaw)}` : '';
      const roomStr = c.hall && c.hall !== 'ـ' ? ` (مکان: ${c.hall})` : '';

      currentTermCourses.push({
        title,
        units: u,
        prof,
        timeStr,
        roomStr,
      });
    });

    const currentTermUnits =
      currentTermCourses.reduce((sum, c) => sum + (c.units || 0), 0) ||
      Number(vm.summary?.rawCredits) ||
      Number(vm.summary?.credits) ||
      0;

    const modeObj = CONSULTATION_MODES.find((m) => m.id === selectedMode) || CONSULTATION_MODES[0];

    let p = `نقش شما: یک مشاور و منتور ارشد تحصیلی دانشگاهی با تجربه بالا است.
هدف: تحلیل دقیق سوابق تحصیلی این دانشجو و ارائه راهکارهای عملی، برنامه‌ریزی واقع‌بینانه و توصیه‌های تخصصی.

---

### ۱. مشخصات دانشجو و مقطع
- دانشگاه: ${uniName}
- دانشکده / گروه: ${student.college || vm.profile?.faculty || 'مشخص‌نشده'}
- رشته تحصیلی: ${student.major || vm.profile?.major || 'مشخص‌نشده'}
- مقطع تحصیلی: ${student.level || vm.profile?.level || 'کارشناسی'}
${student.term ? `- نیمسال / ترم جاری: ترم ${toFaDigits(student.term)}` : ''}
${hidePrivacyInfo ? '- هویت: دانشجو (نام و شماره دانشجویی به منظور حفظ حریم خصوصی پنهان شده است)' : `- نام دانشجو: ${student.fullName || 'ـ'}\n- شماره دانشجویی: ${student.studentId || 'ـ'}`}
- وضعیت تحصیلی: دانشجوی فعال

---

### ۲. خلاصه وضعیت تحصیلی و معدل
- معدل کل تجمعی: ${toFaDigits(gpa)} از ۲۰
- کل واحدهای گذرانده‌شده تا این ترم: ${toFaDigits(totalPassedCredits)} واحد
- واحدهای در حال اخذ در ترم جاری: ${toFaDigits(currentTermUnits)} واحد
- تعداد کل نیمسال‌های تحصیلی ثبت‌شده: ${toFaDigits(termsData.length)} ترم
`;

    // دروس ترم جاری
    if (includeSchedule && currentTermCourses.length > 0) {
      p += `\n---

### ۳. دروس ترم جاری (${vm.termLabel || 'نیمسال جاری'})
مجموع واحدهای اخذشده: ${toFaDigits(currentTermUnits)} واحد\n`;
      currentTermCourses.forEach((c, idx) => {
        const scheduleInfo = c.timeStr ? ` | ساعت کلاس: ${c.timeStr}` : '';
        p += `${toFaDigits(idx + 1)}. ${c.title} (${toFaDigits(c.units)} واحد) - استاد: ${c.prof}${scheduleInfo}${c.roomStr}\n`;
      });
    }

    // تقویم امتحانات پایان‌ترم
    if (includeExams && exams.length > 0) {
      p += `\n---

### ۴. تقویم امتحانات پایان‌ترم (به ترتیب برگزاری)
`;
      exams.forEach((ex, idx) => {
        const dLeft =
          ex.daysLeft > 0
            ? `${toFaDigits(ex.daysLeft)} روز باقیمانده`
            : ex.daysLeft === 0
            ? 'امروز'
            : 'برگزار شده';
        const timeStr = ex.examTime && ex.examTime !== 'ـ' ? ` ساعت ${toFaDigits(ex.examTime)}` : '';
        const dateStr = ex.examDate && ex.examDate !== 'ـ' ? toFaDigits(ex.examDate) : 'تاریخ نامشخص';
        const dayStr = ex.day ? ` (${ex.day})` : '';
        const profStr = ex.instructor && ex.instructor !== 'ـ' ? ` | استاد: ${ex.instructor}` : '';
        p += `${toFaDigits(idx + 1)}. امتحان ${ex.course} (${toFaDigits(ex.unit || 0)} واحد): ${dateStr}${dayStr}${timeStr} [${dLeft}]${profStr}\n`;
      });
    }

    // کارنامه و ریز نمرات ترم‌ها
    if (includeFullTranscript && termsData.length > 0) {
      p += `\n---

### ۵. کارنامه و سوابق نمرات به تفکیک نیمسال‌ها\n`;

      termsData.forEach((term, idx) => {
        const termTitle = term.name || term.shortName || `ترم ${termsData.length - idx}`;
        const isCurrent =
          term.status === 'در حال ثبت نمرات' ||
          (idx === 0 && !term.courses?.some((c) => c.score !== null && c.score !== undefined));
        const gpaStr = term.gpa && term.gpa !== 'ـ' ? `معدل ترم: ${toFaDigits(term.gpa)}` : (isCurrent ? 'ترم جاری (در حال ثبت)' : 'معدل نامشخص');
        const unitsStr = term.passedUnits != null ? ` | واحدهای پاس‌شده: ${toFaDigits(term.passedUnits)} واحد` : '';

        p += `\n#### 📌 ${termTitle} (${gpaStr}${unitsStr})\n`;
        if (Array.isArray(term.courses) && term.courses.length > 0) {
          term.courses.forEach((c) => {
            const courseTitle = c.course || c.name || c.title || 'درس';
            const unitCount = c.unit != null ? toFaDigits(c.unit) : '؟';
            let finalScore = c.displayScore;
            let isScoreDetermined = true;
            if (!finalScore || finalScore === '—') {
              if (c.score !== null && c.score !== undefined && !isNaN(c.score)) {
                finalScore = toFaDigits(c.score);
              } else {
                finalScore = (c.status && c.status !== 'در حال') ? c.status : 'در حال برگزاری (نمره هنوز ثبت نشده)';
                isScoreDetermined = false;
              }
            } else {
              finalScore = toFaDigits(finalScore);
            }
            p += `- ${courseTitle} (${unitCount} واحد): ${isScoreDetermined ? `نمره ${finalScore}` : finalScore}\n`;
          });
        } else {
          p += `- اطلاعات ریزدروس ثبت نشده است.\n`;
        }
      });

      // تفکیک دقیق دروس: افتاده، نیازمند توجه، ممتاز، و دروس در حال گذراندن (بدون نمره)
      const failedGrades = [];
      const borderlineGrades = [];
      const highGrades = [];

      termsData.forEach((t) => {
        (t.courses || []).forEach((c) => {
          const cName = c.course || c.name || c.title || '';
          if (!cName) return;

          const hasNumericScore =
            c.score !== null &&
            c.score !== undefined &&
            c.score !== '' &&
            !isNaN(Number(c.score));
          const numScore = hasNumericScore ? Number(c.score) : null;

          const isExplicitFailed = c.status === 'مردود' || c.regStatus === 'failed';
          const isExplicitPassed = c.status === 'قبول' || c.regStatus === 'passed';
          const isDropped = c.status === 'حذف اضطراری' || c.regStatus === 'dropped';
          const isPending =
            !hasNumericScore &&
            !isExplicitFailed &&
            !isExplicitPassed &&
            !isDropped;

          // درس‌های جاری یا بدون نمره ثبت‌شده به هیچ‌وجه مردود حساب نمی‌شوند
          if (isPending || c.status === 'در حال' || c.status === 'در حال ثبت نمرات' || c.displayScore === '—') {
            return;
          } else if (isExplicitFailed || (hasNumericScore && numScore < 10 && !isExplicitPassed)) {
            const scoreLabel = hasNumericScore ? `نمره ${toFaDigits(c.displayScore || numScore)}` : 'مردود';
            failedGrades.push(`${cName} (${toFaDigits(c.unit || 0)} واحد - ${scoreLabel})`);
          } else if (isDropped) {
            failedGrades.push(`${cName} (${toFaDigits(c.unit || 0)} واحد - حذف اضطراری)`);
          } else if (hasNumericScore && numScore >= 10 && numScore < 12) {
            borderlineGrades.push(`${cName} (${toFaDigits(c.unit || 0)} واحد - نمره ${toFaDigits(c.displayScore || numScore)})`);
          } else if (isExplicitPassed || (hasNumericScore && numScore >= 17)) {
            const scoreLabel = hasNumericScore ? `نمره ${toFaDigits(c.displayScore || numScore)}` : 'قبول';
            highGrades.push(`${cName} (${toFaDigits(c.unit || 0)} واحد - ${scoreLabel})`);
          }
        });
      });

      if (failedGrades.length > 0) {
        p += `\n⚠️ دروس افتاده یا حذف‌شده (نیازمند اخذ مجدد یا ترمیم):\n`;
        failedGrades.forEach((fg) => {
          p += `- ${fg}\n`;
        });
      }

      if (borderlineGrades.length > 0) {
        p += `\n⚡ دروس گذرانده‌شده با نمره لب‌مرزی (۱۰ تا ۱۲):\n`;
        borderlineGrades.forEach((bg) => {
          p += `- ${bg}\n`;
        });
      }

      if (highGrades.length > 0) {
        p += `\n⭐ دروسی که عملکرد ممتاز (نمره ۱۷ به بالا) داشته‌ام:\n`;
        highGrades.slice(0, 8).forEach((hg) => {
          p += `- ${hg}\n`;
        });
      }
    }

    // درخواست و سوال دانشجو از هوش مصنوعی
    p += `\n---

### ۶. هدف و سوال دانشجو از شما:
${modeObj.goalPrompt}
`;

    if (customQuestion.trim()) {
      p += `\nنکته یا سوال خاص دانشجو:\n«${customQuestion.trim()}»\n`;
    }

    p += `\nلطفاً پاسخ را به زبان فارسی روان، دقیق، همدلانه و به شکل گام‌های اجرایی و ساختاریافته (همراه با تیتر و بولت‌پوینت) بنویس.`;

    return p;
  }, [
    isOpen,
    vm,
    exams,
    currentSchedule,
    selectedMode,
    hidePrivacyInfo,
    includeFullTranscript,
    includeExams,
    includeSchedule,
    customQuestion,
  ]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      showToast('متن پرامپت در حافظه کپی شد ✓');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('خطا در کپی؛ لطفاً متن را دستی انتخاب کنید.');
    }
  };

  const handleOpenAiService = async (url) => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      showToast('متن کپی شد! در صفحه هوش مصنوعی Paste کنید.');
    } catch (_) {}
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center p-0 sm:p-4"
        dir="rtl"
      >
        {/* لایه تیره پس‌زمینه هماهنگ با مودال‌های سروستان */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* بدنه شیت مودال با گوشه‌های گرد و پدینگ سرو */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-[500px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-4 sm:p-5 shadow-2xl max-h-[88vh] flex flex-col"
        >
          {/* دستگیره موبایل */}
          <div className="w-12 h-1.5 rounded-full bg-base-500/60 mx-auto mb-3 sm:hidden" />

          {/* هدر مودال هماهنگ با سرو یوآی */}
          <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-2xl bg-primary-soft text-primary grid place-items-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-black text-base-content truncate">
                    پرامپت هوش مصنوعی
                  </h3>
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary shrink-0 whitespace-nowrap">
                    مشاور تحصیلی
                  </span>
                </div>
                <p className="text-[10.5px] text-neutral truncate mt-0.5">
                  ارسال کارنامه و برنامه برای ChatGPT، Claude، Gemini و DeepSeek
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* محتوای داخلی با اسکرول نرم */}
          <div className="overflow-y-auto flex-1 no-scrollbar py-3 space-y-3.5 pr-0.5">
            {/* انتخاب کشویی هدف مشاوره تحصیلی */}
            <div className="space-y-1.5 relative">
              <span className="text-[11.5px] font-bold text-base-content flex items-center gap-1.5 px-0.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>هدف مشاوره را انتخاب کنید:</span>
              </span>

              {(() => {
                const curMode = CONSULTATION_MODES.find((m) => m.id === selectedMode) || CONSULTATION_MODES[0];
                const CurIcon = curMode.icon;
                return (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsModeDropdownOpen((prev) => !prev)}
                      className="w-full p-2.5 rounded-2xl bg-base-500/15 border border-base-500/30 hover:bg-base-500/25 transition-all text-right flex items-center justify-between gap-2.5 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                          <CurIcon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold text-base-content truncate">
                            {curMode.title}
                          </p>
                          <p className="text-[10px] text-neutral truncate">
                            {curMode.desc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-neutral group-hover:text-base-content">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isModeDropdownOpen ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isModeDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="mt-1.5 p-1 rounded-2xl bg-base border border-base-500/35 shadow-xl space-y-0.5 z-30 overflow-hidden"
                        >
                          {CONSULTATION_MODES.map((m) => {
                            const Icon = m.icon;
                            const isSelected = selectedMode === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMode(m.id);
                                  setIsModeDropdownOpen(false);
                                }}
                                className={`w-full p-2 rounded-xl text-right transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-primary-soft text-primary font-bold'
                                    : 'hover:bg-base-500/20 text-base-content'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${
                                      isSelected
                                        ? 'bg-primary text-primary-content'
                                        : 'bg-base-500/30 text-neutral'
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[12px] truncate">{m.title}</p>
                                    <p className="text-[9.5px] text-neutral font-normal truncate">{m.desc}</p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}
            </div>

            {/* کارت گزینه‌های داده و حریم خصوصی با چک‌باکس‌های رسمی سرو */}
            <div className="sarv-card p-3 rounded-2xl bg-base-500/15 border border-base-500/30 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-base-500/20">
                <span className="text-[11px] font-bold text-base-content flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>داده‌های ارسالی به هوش مصنوعی:</span>
                </span>
                <span className="text-[9.5px] text-neutral font-mono">
                  {toFaDigits(generatedPrompt.length)} نویسه
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SarvCheckbox
                  checked={hidePrivacyInfo}
                  onChange={(val) => setHidePrivacyInfo(val)}
                  label="مخفی‌سازی نام و شناسه"
                  className="text-[11px]"
                />

                <SarvCheckbox
                  checked={includeFullTranscript}
                  onChange={(val) => setIncludeFullTranscript(val)}
                  label="ریزنمرات و کارنامه ترم‌ها"
                  className="text-[11px]"
                />

                <SarvCheckbox
                  checked={includeSchedule}
                  onChange={(val) => setIncludeSchedule(val)}
                  label="دروس ثبت‌نامی ترم جاری"
                  className="text-[11px]"
                />

                <SarvCheckbox
                  checked={includeExams}
                  onChange={(val) => setIncludeExams(val)}
                  label="تقویم امتحانات پایان‌ترم"
                  className="text-[11px]"
                />
              </div>
            </div>

            {/* سوال اختیاری دانشجو */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-base-content flex items-center gap-1 px-0.5">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>سوال یا دغدغه خاص شما (اختیاری):</span>
              </label>
              <textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="مثلاً: برای کنکور ارشد هم می‌خوام بخونم... یا بین دو درس X و Y شک دارم..."
                rows={2}
                className="w-full p-2.5 rounded-2xl bg-base-500/15 border border-base-500/30 text-[11.5px] text-base-content placeholder:text-neutral/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>

            {/* پیش‌نمایش پرامپت تولید شده */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold text-base-content flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>پیش‌نمایش متن:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="text-[10.5px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
                </button>
              </div>

              <pre className="w-full max-h-36 overflow-y-auto p-3 rounded-2xl bg-base-500/20 border border-base-500/30 text-[10.5px] font-mono text-base-content/85 whitespace-pre-wrap leading-relaxed select-all no-scrollbar">
                {generatedPrompt}
              </pre>
            </div>
          </div>

          {/* تست فیدبک اعلان */}
          {toastMessage && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-success-soft text-success text-[11px] font-bold flex items-center justify-between border border-success-soft">
              <span>{toastMessage}</span>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            </div>
          )}

          {/* فوتر: دکمه کپی و بازکردن مستقیم در چت‌بات‌ها */}
          <div className="pt-3 border-t border-base-500/30 shrink-0 space-y-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="w-full py-2.5 rounded-2xl bg-primary text-primary-content text-[12.5px] font-bold shadow-sm hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'متن در حافظه کپی شد!' : 'کپی متن پرامپت'}</span>
            </button>

            <div className="flex items-center justify-between gap-1 text-[10.5px]">
              <span className="text-neutral font-medium shrink-0">باز کردن مستقیم:</span>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {[
                  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
                  { name: 'Claude', url: 'https://claude.ai/' },
                  { name: 'Gemini', url: 'https://gemini.google.com/' },
                  { name: 'DeepSeek', url: 'https://chat.deepseek.com/' },
                ].map((bot) => (
                  <button
                    key={bot.name}
                    type="button"
                    onClick={() => handleOpenAiService(bot.url)}
                    className="px-2 py-1 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-base-content text-[10px] font-bold border border-base-500/30 flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <span>{bot.name}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-neutral" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
