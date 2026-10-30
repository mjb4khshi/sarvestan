import { useState, useMemo } from 'react';
import {
  Smartphone,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Columns,
  Sliders,
  Sparkles,
  Wifi,
  BatteryCharging,
  Signal,
  CheckSquare,
  ListTodo,
  Timer,
  Flame,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Clock,
  MapPin,
  AlertCircle,
  FileText,
  CheckCircle2,
  ChevronLeft,
  Check,
  TrendingUp,
  Play,
  Zap,
} from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import { getViewModel } from '../data/viewModel';
import { hasLiveData } from '../services/behestan/store';

// سناریوهای آزمایشی داده برای بررسی حالت‌های مختلف ویجت‌ها
const SCENARIOS = {
  active: {
    name: 'حالت عادی و فعال (کلاس، تسک‌های امروز، مطالعه و امتحان)',
    nextTitle: 'طراحی الگوریتم‌ها',
    nextTime: '۱۳:۳۰ تا ۱۵:۰۰',
    nextRoom: 'کلاس ۴۰۱ کامپیوتر',
    nextProf: 'دکتر علوی',
    examTitle: 'هوش مصنوعی و سیستم‌های خبره',
    examDays: 3,
    examDate: '۱۴۰۴/۱۰/۱۸ ساعت ۱۰:۰۰',
    examRoom: 'سالن امتحانات شماره ۲',
    secondExamTitle: 'شبکه‌های کامپیوتری',
    secondExamDays: 7,
    gpa: '۱۸.۴۵',
    statusText: 'دانشجوی ممتاز رتبه اول',
    unitsPassed: '۸۴',
    totalUnits: '۱۴۰',
    termGpa: '۱۸.۸۰',
    tasksDoneCount: 3,
    tasksTotalCount: 5,
    topTaskTitle: 'حل تمرین سری سوم الگوریتم',
    topTaskPriority: 'فوری',
    secondTaskTitle: 'مطالعه فصل ۴ هوش مصنوعی',
    todayStudyMinutes: 165,
    targetStudyMinutes: 240,
    studyStreak: 6,
    currentStudySubject: 'مبانی مهندسی برق',
    isTimerRunning: true,
  },
  examSeason: {
    name: 'فرجه امتحانات (امتحان فردا + مطالعه فشرده)',
    nextTitle: 'برنامه کلاس‌ها به پایان رسیده',
    nextTime: '',
    nextRoom: '',
    nextProf: '',
    examTitle: 'معماری کامپیوتر و ریزپردازنده',
    examDays: 1,
    examDate: 'فردا ساعت ۱۴:۰۰',
    examRoom: 'دانشکده مهندسی، تالار ۴',
    secondExamTitle: 'سیستم‌های عامل',
    secondExamDays: 4,
    gpa: '۱۷.۶۰',
    statusText: 'وضعیت تحصیلی: ممتاز و مجاز',
    unitsPassed: '۹۲',
    totalUnits: '۱۴۰',
    termGpa: '۱۷.۱۵',
    tasksDoneCount: 5,
    tasksTotalCount: 6,
    topTaskTitle: 'مرور نمونه سوالات امتحانی',
    topTaskPriority: 'مهم',
    secondTaskTitle: 'جمع‌بندی نکات خط لوله',
    todayStudyMinutes: 310,
    targetStudyMinutes: 300,
    studyStreak: 12,
    currentStudySubject: 'مرور مبحث خط لوله و کش',
    isTimerRunning: true,
  },
  weekend: {
    name: 'آخر هفته و برنامه‌ریزی (بدون کلاس، مطالعه آزاد)',
    nextTitle: 'امروز کلاسی ثبت نشده است',
    nextTime: '',
    nextRoom: '',
    nextProf: '',
    examTitle: 'امتحانی در هفته جاری نیست',
    examDays: -1,
    examDate: '',
    examRoom: '',
    secondExamTitle: '',
    secondExamDays: -1,
    gpa: '۱۹.۱۰',
    statusText: 'دانشجوی رتبه برتر الف',
    unitsPassed: '۵۶',
    totalUnits: '۱۴۰',
    termGpa: '۱۹.۳۰',
    tasksDoneCount: 2,
    tasksTotalCount: 3,
    topTaskTitle: 'پروژه پایانی سیستم‌های عامل',
    topTaskPriority: 'عادی',
    secondTaskTitle: 'خلاصه نویسی یادداشت‌های کلاسی',
    todayStudyMinutes: 90,
    targetStudyMinutes: 180,
    studyStreak: 7,
    currentStudySubject: 'تمرین حل الگوریتم حریصانه',
    isTimerRunning: false,
  },
};

export default function WidgetPreviewScreen({ onBack }) {
  const [selectedScenario, setSelectedScenario] = useState('active');
  const [themeMode, setThemeMode] = useState('both');
  const [viewMode, setViewMode] = useState('both');
  const [activeCategory, setActiveCategory] = useState('all');

  const data = useMemo(() => {
    if (selectedScenario === 'live' && hasLiveData()) {
      const vm = getViewModel();
      const next = vm?.nextClass;
      const exam = (vm?.exams || [])[0];
      const secondExam = (vm?.exams || [])[1];
      const gpaNum = parseFloat(String(vm?.summary?.gpa || '').replace(/[^\d.]/g, '')) || 0;
      return {
        ...SCENARIOS.active,
        name: 'داده‌های واقعی سامانه بهستان',
        nextTitle: next?.title || 'امروز کلاسی ثبت نشده',
        nextTime: next?.time || '',
        nextRoom: next?.room ? `کلاس ${toFaDigits(next.room)}` : '',
        nextProf: next?.instructor || '',
        examTitle: exam?.course || 'امتحانی نزدیک نیست',
        examDays: exam?.daysLeft ?? -1,
        examDate: exam?.examDate || '',
        secondExamTitle: secondExam?.course || '',
        secondExamDays: secondExam?.daysLeft ?? -1,
        gpa: vm?.summary?.gpa || '—',
        statusText: gpaNum >= 17 ? 'دانشجوی ممتاز (الف)' : 'وضعیت تحصیلی: مطلوب',
        unitsPassed: String(vm?.curriculum?.passedCredits ?? vm?.profile?.totalUnitsPassed ?? '—'),
        termGpa: vm?.termsData?.[0]?.gpa || '—',
      };
    }
    return SCENARIOS[selectedScenario] || SCENARIOS.active;
  }, [selectedScenario]);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans" dir="rtl">
      {/* سربرگ کنترل */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="بازگشت به برنامه"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 grid place-items-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2">
                پیش‌نمایش نسل جدید ویجت‌های سروستان
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Sarv Design System 2.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                بررسی نسخه‌های بزرگ (۴×۲)، متوسط (۲×۲)، نواری فشرده (۴×۱) و مینی جمع‌وجور (۱×۱)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 text-xs">
              <button
                onClick={() => setThemeMode('both')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  themeMode === 'both' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                مقایسه دوگانه
              </button>
              <button
                onClick={() => setThemeMode('light')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  themeMode === 'light' ? 'bg-amber-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                نسخه روشن
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  themeMode === 'dark' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                نسخه تاریک
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="active" className="bg-slate-800">حالت فعال و عادی</option>
                <option value="examSeason" className="bg-slate-800">فصل امتحانات</option>
                <option value="weekend" className="bg-slate-800">تعطیل / آخر هفته</option>
                {hasLiveData() && <option value="live" className="bg-slate-800">داده‌های زنده بهستان</option>}
              </select>
            </div>

            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                onClick={() => setViewMode('both')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'both' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                هردو نما
              </button>
              <button
                onClick={() => setViewMode('phone')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'phone' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                روی گوشی
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                کارت‌ها
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* محتوا */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">

        {/* بخش ۱: شبیه‌ساز گوشی */}
        {(viewMode === 'both' || viewMode === 'phone') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  شبیه‌ساز هوم‌اسکرین موبایل با پالت‌های ابعاد مختلف
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                چیدمان متنوع: ویجت جامع + ویجت‌های نواری باریک + ویجت‌های مینی ۱×۱
              </span>
            </div>

            <div className={`grid gap-8 place-items-center ${themeMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* شبیه‌ساز لایت */}
              {(themeMode === 'both' || themeMode === 'light') && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Sun className="w-4 h-4" />
                    <span>لانچر روشن (Light Mode)</span>
                  </div>

                  <div className="w-full max-w-[390px] rounded-[50px] p-3.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-2xl border-4 border-slate-300 relative overflow-hidden">
                    <div className="rounded-[40px] p-4 min-h-[790px] flex flex-col justify-between select-none relative bg-gradient-to-b from-[#eef4fb] via-[#f6f8fb] to-[#ffffff] text-slate-900 transition-all">
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold px-2 pt-1 pb-2">
                        <span className="font-mono">۱۲:۴۲</span>
                        <div className="flex items-center gap-1.5 opacity-85">
                          <Signal className="w-3.5 h-3.5 text-slate-800" />
                          <Wifi className="w-3.5 h-3.5 text-slate-800" />
                          <div className="flex items-center gap-0.5">
                            <span className="text-[9px] text-slate-800">۸۹٪</span>
                            <BatteryCharging className="w-4 h-4 text-emerald-600" />
                          </div>
                        </div>
                      </div>

                      <div className="text-center py-2 space-y-0.5">
                        <div className="text-4xl font-black text-slate-800 tracking-tight font-mono">
                          ۱۲:۴۲
                        </div>
                        <div className="text-[12px] text-slate-600 font-medium">
                          دوشنبه · ۲۴ شهریور ۱۴۰۵
                        </div>
                      </div>

                      <div className="space-y-2.5 my-auto">
                        {/* ویجت جامع ۴×۲ */}
                        <DailyHubWidget data={data} mode="light" />

                        {/* ویجت‌های نواری باریک جمع‌وجور ۴×۱ */}
                        <SlimClassWidget data={data} mode="light" />
                        <SlimStudyWidget data={data} mode="light" />

                        {/* ردیف ویجت‌های مینی بندانگشتی ۱×۱ */}
                        <div className="grid grid-cols-4 gap-2">
                          <MicroGpaWidget data={data} mode="light" />
                          <MicroStreakWidget data={data} mode="light" />
                          <MicroExamWidget data={data} mode="light" />
                          <MicroClassWidget data={data} mode="light" />
                        </div>
                      </div>

                      {/* داک */}
                      <div className="pt-3 pb-1">
                        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-2.5 flex items-center justify-around border border-slate-200/90 shadow-md">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white grid place-items-center shadow-md">
                            <svg viewBox="0 0 1080 1080" className="w-6 h-6 fill-white">
                              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
                            </svg>
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white grid place-items-center text-xs font-bold shadow-sm">تماس</div>
                          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white grid place-items-center text-xs font-bold shadow-sm">پیام</div>
                          <div className="w-11 h-11 rounded-2xl bg-slate-600 text-white grid place-items-center text-xs font-bold shadow-sm">تنظیمات</div>
                        </div>
                        <div className="w-32 h-1 bg-slate-400/60 rounded-full mx-auto mt-3" />
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* شبیه‌ساز دارک */}
              {(themeMode === 'both' || themeMode === 'dark') && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <Moon className="w-4 h-4" />
                    <span>لانچر تاریک (Dark Mode)</span>
                  </div>

                  <div className="w-full max-w-[390px] rounded-[50px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-850 to-slate-900 shadow-2xl border-4 border-slate-700/80 relative overflow-hidden">
                    <div className="rounded-[40px] p-4 min-h-[790px] flex flex-col justify-between select-none relative bg-gradient-to-br from-[#0c1424] via-[#080d18] to-[#04060b] text-slate-100 transition-all">
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold px-2 pt-1 pb-2">
                        <span className="font-mono">۱۲:۴۲</span>
                        <div className="flex items-center gap-1.5 opacity-85">
                          <Signal className="w-3.5 h-3.5" />
                          <Wifi className="w-3.5 h-3.5" />
                          <div className="flex items-center gap-0.5">
                            <span className="text-[9px]">۸۹٪</span>
                            <BatteryCharging className="w-4 h-4 text-emerald-400" />
                          </div>
                        </div>
                      </div>

                      <div className="text-center py-2 space-y-0.5">
                        <div className="text-4xl font-black text-white/95 tracking-tight font-mono">
                          ۱۲:۴۲
                        </div>
                        <div className="text-[12px] text-slate-400 font-medium">
                          دوشنبه · ۲۴ شهریور ۱۴۰۵
                        </div>
                      </div>

                      <div className="space-y-2.5 my-auto">
                        <DailyHubWidget data={data} mode="dark" />

                        <SlimClassWidget data={data} mode="dark" />
                        <SlimStudyWidget data={data} mode="dark" />

                        <div className="grid grid-cols-4 gap-2">
                          <MicroGpaWidget data={data} mode="dark" />
                          <MicroStreakWidget data={data} mode="dark" />
                          <MicroExamWidget data={data} mode="dark" />
                          <MicroClassWidget data={data} mode="dark" />
                        </div>
                      </div>

                      <div className="pt-3 pb-1">
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-2.5 flex items-center justify-around border border-white/10 shadow-lg">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white grid place-items-center shadow-lg shadow-emerald-500/25">
                            <svg viewBox="0 0 1080 1080" className="w-6 h-6 fill-white">
                              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 Z" />
                            </svg>
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-blue-600/80 text-white grid place-items-center text-xs font-bold">تماس</div>
                          <div className="w-11 h-11 rounded-2xl bg-amber-600/80 text-white grid place-items-center text-xs font-bold">پیام</div>
                          <div className="w-11 h-11 rounded-2xl bg-slate-700/80 text-white grid place-items-center text-xs font-bold">تنظیمات</div>
                        </div>
                        <div className="w-32 h-1 bg-slate-400/40 rounded-full mx-auto mt-3" />
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* بخش ۲: بازرسی تفکیکی کارت‌ها */}
        {(viewMode === 'both' || viewMode === 'cards') && (
          <section className="space-y-6 pt-6 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  بررسی مجزا و مقایسه تفکیکی تمامی ویجت‌ها
                </h2>
                <p className="text-xs text-slate-400">
                  شامل سایزهای استاندارد و خانواده جدید ویجت‌های فشرده (Slim & Micro)
                </p>
              </div>

              <div className="flex flex-wrap items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 text-xs gap-1">
                {[
                  { id: 'all', label: 'همه ویجت‌ها' },
                  { id: 'compact', label: 'جم و جور (۴×۱ و ۱×۱)' },
                  { id: 'hub', label: '۱. داشبورد روز (۴×۲)' },
                  { id: 'tasks', label: '۲. تسک‌ها و کارها' },
                  { id: 'study', label: '۳. مطالعه و تایمر' },
                  { id: 'exam', label: '۴. روزشمار امتحانات' },
                  { id: 'class', label: '۵. کلاس بعدی' },
                  { id: 'gpa', label: '۶. معدل و کارنامه' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      activeCategory === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">

              {/* ۰. دسته ویجت‌های جمع‌وجور و فشرده (Slim & Micro) */}
              {(activeCategory === 'all' || activeCategory === 'compact') && (
                <>
                  <WidgetCardRow
                    title="ویجت‌های نواری و باریک جمع‌وجور (Slim Bar - ۴×۱)"
                    description="نوار تک‌خطی بسیار ظریف برای هوم‌اسکرین خلوت: کلاس بعدی، مطالعه، روزشمار امتحان و کارهای امروز"
                    badge="فوق‌العاده مینیمال"
                    badgeColor="emerald"
                    lightComponent={
                      <div className="space-y-2 w-full">
                        <SlimClassWidget data={data} mode="light" />
                        <SlimStudyWidget data={data} mode="light" />
                        <SlimExamWidget data={data} mode="light" />
                        <SlimTasksWidget data={data} mode="light" />
                      </div>
                    }
                    darkComponent={
                      <div className="space-y-2 w-full">
                        <SlimClassWidget data={data} mode="dark" />
                        <SlimStudyWidget data={data} mode="dark" />
                        <SlimExamWidget data={data} mode="dark" />
                        <SlimTasksWidget data={data} mode="dark" />
                      </div>
                    }
                    widthClass="w-full max-w-[390px]"
                  />

                  <WidgetCardRow
                    title="ویجت‌های بندانگشتی و تک‌خانه‌ای (Micro Square - ۱×۱)"
                    description="ویجت‌های بسیار کوچک اندازه یک آیکون برنامه جهت چینش در کنار سایر اپ‌ها"
                    badge="کوچک و سریع"
                    badgeColor="sky"
                    lightComponent={
                      <div className="grid grid-cols-4 gap-2 w-full">
                        <MicroGpaWidget data={data} mode="light" />
                        <MicroStreakWidget data={data} mode="light" />
                        <MicroExamWidget data={data} mode="light" />
                        <MicroClassWidget data={data} mode="light" />
                      </div>
                    }
                    darkComponent={
                      <div className="grid grid-cols-4 gap-2 w-full">
                        <MicroGpaWidget data={data} mode="dark" />
                        <MicroStreakWidget data={data} mode="dark" />
                        <MicroExamWidget data={data} mode="dark" />
                        <MicroClassWidget data={data} mode="dark" />
                      </div>
                    }
                    widthClass="w-full max-w-[390px]"
                  />
                </>
              )}

              {/* ۱. ویجت هوشمند روز */}
              {(activeCategory === 'all' || activeCategory === 'hub') && (
                <WidgetCardRow
                  title="۱. ویجت هوشمند روز سروستان (Daily Hub Widget - ۴×۲)"
                  description="کارت یکپارچه روزانه: کلاس بعدی همراه با زمان، اولویت تسک‌های کاری امروز یا روزشمار امتحان نزدیک"
                  badge="جدید و پرچمدار"
                  badgeColor="emerald"
                  lightComponent={<DailyHubWidget data={data} mode="light" />}
                  darkComponent={<DailyHubWidget data={data} mode="dark" />}
                  widthClass="w-full max-w-[390px]"
                />
              )}

              {/* ۲. تسک‌ها */}
              {(activeCategory === 'all' || activeCategory === 'tasks') && (
                <>
                  <WidgetCardRow
                    title="۲. ویجت کارهای امروز و چک‌لیست (Daily Tasks Widget - ۲×۲)"
                    description="شمارش کارهای انجام شده، تسک با اولویت بالا و دسترسی سریع به کارهای روز"
                    badge="جدید"
                    badgeColor="amber"
                    lightComponent={<TasksWidget data={data} mode="light" />}
                    darkComponent={<TasksWidget data={data} mode="dark" />}
                    widthClass="w-[200px]"
                  />

                  <WidgetCardRow
                    title="۲.۲. ویجت تسک‌های کاری و اهداف روزانه (Tasks Full Widget - ۴×۲)"
                    description="لیست اولویت‌های کاری روز، نوار پیشرفت تسک‌ها و دسترسی به چک‌لیست مطالعه"
                    badge="جدید افقی"
                    badgeColor="amber"
                    lightComponent={<TasksFullWidget data={data} mode="light" />}
                    darkComponent={<TasksFullWidget data={data} mode="dark" />}
                    widthClass="w-full max-w-[390px]"
                  />
                </>
              )}

              {/* ۳. مطالعه */}
              {(activeCategory === 'all' || activeCategory === 'study') && (
                <>
                  <WidgetCardRow
                    title="۳. ویجت تایمر مطالعه و پومودورو (Study Tracker - ۲×۲)"
                    description="میزان مطالعه امروز به دقیقه، زنجیره استریک روزانه، درس در حال خواندن و وضعیت فعال تایمر"
                    badge="جدید"
                    badgeColor="violet"
                    lightComponent={<StudyWidget data={data} mode="light" />}
                    darkComponent={<StudyWidget data={data} mode="dark" />}
                    widthClass="w-[200px]"
                  />

                  <WidgetCardRow
                    title="۳.۲. ویجت پیشرفت مطالعه و استریک هفتگی (Study Progress Widget - ۴×۲)"
                    description="نوار پیشرفت هدف روزانه، آمار مطالعه، استریک متوالی بدون وقفه و کلید دسترسی سریع به پلنر"
                    badge="جدید افقی"
                    badgeColor="violet"
                    lightComponent={<StudyFullWidget data={data} mode="light" />}
                    darkComponent={<StudyFullWidget data={data} mode="dark" />}
                    widthClass="w-full max-w-[390px]"
                  />
                </>
              )}

              {/* ۴. روزشمار امتحانات */}
              {(activeCategory === 'all' || activeCategory === 'exam') && (
                <WidgetCardRow
                  title="۴. ویجت روزشمار و برنامه امتحانات (Exam Tracker - ۴×۲)"
                  description="کارت هوشمند امتحانات ترم با شمارش معکوس روزها، تاریخ، ساعت، محل برگزاری و امتحان بعدی"
                  badge="بازطراحی هوشمند"
                  badgeColor="rose"
                  lightComponent={<ExamTrackerWidget data={data} mode="light" />}
                  darkComponent={<ExamTrackerWidget data={data} mode="dark" />}
                  widthClass="w-full max-w-[390px]"
                />
              )}

              {/* ۵. کلاس بعدی */}
              {(activeCategory === 'all' || activeCategory === 'class') && (
                <WidgetCardRow
                  title="۵. ویجت کلاس بعدی و برنامه هفتگی (Next Class - ۲×۲)"
                  description="نام درس، استاد، ساعت تشکیل و موقعیت کلاس بر اساس ساعت جاری سیستم"
                  badge="بازطراحی شده"
                  badgeColor="sky"
                  lightComponent={<NextClassWidget data={data} mode="light" />}
                  darkComponent={<NextClassWidget data={data} mode="dark" />}
                  widthClass="w-[200px]"
                />
              )}

              {/* ۶. معدل و کارنامه */}
              {(activeCategory === 'all' || activeCategory === 'gpa') && (
                <WidgetCardRow
                  title="۶. ویجت کارنامه و معدل کل (GPA & Standing - ۲×۲)"
                  description="معدل درشت رسمی، نشان دانشجوی رتبه الف و نسبت واحدهای گذرانده به کل دوره تحصیلی"
                  badge="بازطراحی شده"
                  badgeColor="emerald"
                  lightComponent={<GpaStandingWidget data={data} mode="light" />}
                  darkComponent={<GpaStandingWidget data={data} mode="dark" />}
                  widthClass="w-[200px]"
                />
              )}

            </div>
          </section>
        )}

      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// کامپوننت کمکی ردیف مقایسه
// ─────────────────────────────────────────────────────────────

function WidgetCardRow({ title, description, badge, badgeColor, lightComponent, darkComponent, widthClass }) {
  const badgeClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    sky: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  }[badgeColor] || 'bg-slate-700 text-slate-300 border-slate-600';

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            {title}
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
                {badge}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-100/10 border border-slate-700/50 flex flex-col items-center space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 self-start">
            <Sun className="w-4 h-4" />
            <span>نسخه روشن (Light)</span>
          </div>
          <div className={widthClass}>
            {lightComponent}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 self-start">
            <Moon className="w-4 h-4" />
            <span>نسخه تاریک (Dark)</span>
          </div>
          <div className={widthClass}>
            {darkComponent}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ویجت‌های نواری و باریک جمع‌وجور (Slim Bar - ۴×۱ / ۲×۱)
// ─────────────────────────────────────────────────────────────

function SlimClassWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full rounded-[20px] px-3 py-2 border shadow-sm flex items-center justify-between gap-2 select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_4px_16px_rgb(0,0,0,0.04)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_4px_16px_rgb(0,0,0,0.3)] text-slate-100'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-500 grid place-items-center shrink-0">
          <Clock className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11.5px] font-black truncate leading-tight">
            {data.nextTitle}
          </div>
          <div className="text-[9.5px] text-slate-400 truncate">
            {data.nextRoom ? toFaDigits(data.nextRoom) : 'کلاس حضوری'}
          </div>
        </div>
      </div>

      <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
        {data.nextTime ? toFaDigits(data.nextTime) : '—'}
      </span>
    </div>
  );
}

function SlimStudyWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';
  const hours = Math.floor(data.todayStudyMinutes / 60);
  const mins = data.todayStudyMinutes % 60;
  const timeStr = hours > 0 ? `${toFaDigits(hours)}س و ${toFaDigits(mins)}د` : `${toFaDigits(mins)} دقیقه`;

  return (
    <div
      className={`w-full rounded-[20px] px-3 py-2 border shadow-sm flex items-center justify-between gap-2 select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_4px_16px_rgb(0,0,0,0.04)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_4px_16px_rgb(0,0,0,0.3)] text-slate-100'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-500 grid place-items-center shrink-0">
          <Timer className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11.5px] font-black truncate leading-tight">
            مطالعه امروز: {timeStr}
          </div>
          <div className="text-[9.5px] text-slate-400 truncate">
            {data.currentStudySubject}
          </div>
        </div>
      </div>

      <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
        {toFaDigits(data.studyStreak)} روز
      </span>
    </div>
  );
}

function SlimExamWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full rounded-[20px] px-3 py-2 border shadow-sm flex items-center justify-between gap-2 select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_4px_16px_rgb(0,0,0,0.04)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_4px_16px_rgb(0,0,0,0.3)] text-slate-100'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-500 grid place-items-center shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11.5px] font-black truncate leading-tight">
            {data.examTitle}
          </div>
          <div className="text-[9.5px] text-slate-400 truncate">
            {data.examDate ? toFaDigits(data.examDate) : 'روزشمار امتحانات'}
          </div>
        </div>
      </div>

      <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
        {data.examDays === 0 ? 'امروز' : data.examDays === 1 ? 'فردا' : `${toFaDigits(data.examDays)} روز`}
      </span>
    </div>
  );
}

function SlimTasksWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full rounded-[20px] px-3 py-2 border shadow-sm flex items-center justify-between gap-2 select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_4px_16px_rgb(0,0,0,0.04)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_4px_16px_rgb(0,0,0,0.3)] text-slate-100'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-500 grid place-items-center shrink-0">
          <CheckSquare className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11.5px] font-black truncate leading-tight">
            {data.topTaskTitle || 'کاری برای امروز در انتظار نیست'}
          </div>
          <div className="text-[9.5px] text-slate-400 truncate">
            {data.tasksTotalCount ? 'تسک دارای اولویت امروز' : 'پلنر هوشمند و برنامه‌ریزی'}
          </div>
        </div>
      </div>

      <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
        {data.tasksTotalCount ? `${toFaDigits(data.tasksDoneCount)} از ${toFaDigits(data.tasksTotalCount)} کار` : 'پلنر فعال'}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ویجت‌های بندانگشتی و تک‌خانه‌ای (Micro Square - ۱×۱)
// ─────────────────────────────────────────────────────────────

function MicroGpaWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full aspect-square rounded-[18px] p-2 border shadow-sm flex flex-col justify-between text-center select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 text-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-500 grid place-items-center">
          <GraduationCap className="w-2.5 h-2.5" />
        </div>
        <span className="text-[8px] font-bold text-emerald-500">معدل</span>
      </div>

      <div className="text-[17px] font-black font-mono leading-none my-auto">
        {toFaDigits(data.gpa || '—')}
      </div>

      <div className="text-[8.5px] font-bold text-slate-400 truncate">
        رتبه ممتاز
      </div>
    </div>
  );
}

function MicroStreakWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full aspect-square rounded-[18px] p-2 border shadow-sm flex flex-col justify-between text-center select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 text-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="w-4 h-4 rounded-md bg-amber-500/20 text-amber-500 grid place-items-center">
          <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
        </div>
        <span className="text-[8px] font-bold text-amber-500">استریک</span>
      </div>

      <div className="text-[17px] font-black font-mono leading-none my-auto text-amber-500">
        {toFaDigits(data.studyStreak)}
      </div>

      <div className="text-[8.5px] font-bold text-slate-400 truncate">
        روز متوالی
      </div>
    </div>
  );
}

function MicroExamWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full aspect-square rounded-[18px] p-2 border shadow-sm flex flex-col justify-between text-center select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 text-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="w-4 h-4 rounded-md bg-rose-500/20 text-rose-500 grid place-items-center">
          <AlertCircle className="w-2.5 h-2.5" />
        </div>
        <span className="text-[8px] font-bold text-rose-500">امتحان</span>
      </div>

      <div className="text-[15px] font-black leading-none my-auto text-rose-500">
        {data.examDays === 0 ? 'امروز' : data.examDays === 1 ? 'فردا' : `${toFaDigits(data.examDays)} روز`}
      </div>

      <div className="text-[8.5px] font-bold text-slate-400 truncate">
        {data.examTitle ? data.examTitle.split(' ')[0] : 'آزمون'}
      </div>
    </div>
  );
}

function MicroClassWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full aspect-square rounded-[18px] p-2 border shadow-sm flex flex-col justify-between text-center select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 text-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="w-4 h-4 rounded-md bg-sky-500/20 text-sky-500 grid place-items-center">
          <Clock className="w-2.5 h-2.5" />
        </div>
        <span className="text-[8px] font-bold text-sky-500">کلاس</span>
      </div>

      <div className="text-[11px] font-black font-mono leading-none my-auto text-sky-600 dark:text-sky-300">
        {data.nextTime ? toFaDigits(data.nextTime.split(' ')[0]) : '—'}
      </div>

      <div className="text-[8.5px] font-bold text-slate-400 truncate">
        {data.nextTitle ? data.nextTitle.split(' ')[0] : 'برنامه'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ویجت‌های استاندارد قبلی (Daily Hub, Tasks, Study, Exam, Class, GPA)
// ─────────────────────────────────────────────────────────────

function DailyHubWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full rounded-[26px] p-3.5 border shadow-xl relative overflow-hidden select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-6 h-6 rounded-xl grid place-items-center shadow-xs ${
              isLight ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
            }`}
          >
            <svg viewBox="0 0 1080 1080" className="w-3.5 h-3.5 fill-white">
              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
            </svg>
          </div>
          <div>
            <div className={`text-[12px] font-black leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              سروستان
            </div>
            <div className={`text-[9.5px] font-medium leading-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              داشبورد هوشمند روز
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {data.gpa && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              معدل {toFaDigits(data.gpa)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className={`rounded-2xl p-2.5 border transition-all ${
            isLight ? 'bg-[#f8fafc] border-slate-200/80' : 'bg-white/[0.04] border-white/5'
          }`}
        >
          <div className="flex items-center gap-1 text-[9.5px] font-bold text-sky-600 dark:text-sky-400 mb-1">
            <Clock className="w-3 h-3" />
            <span>کلاس بعدی</span>
          </div>
          <div className="text-[12px] font-black truncate leading-tight">
            {data.nextTitle}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
            {data.nextTime ? (
              <>
                <span>{toFaDigits(data.nextTime)}</span>
                {data.nextRoom && <span>· {toFaDigits(data.nextRoom)}</span>}
              </>
            ) : (
              <span>کلاسی برای امروز نیست</span>
            )}
          </div>
        </div>

        <div
          className={`rounded-2xl p-2.5 border transition-all ${
            isLight ? 'bg-[#f8fafc] border-slate-200/80' : 'bg-white/[0.04] border-white/5'
          }`}
        >
          {data.examDays >= 0 && data.examDays <= 2 ? (
            <>
              <div className="flex items-center justify-between text-[9.5px] font-bold text-rose-600 dark:text-rose-400 mb-1">
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>امتحان نزدیک</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-300 font-black">
                  {data.examDays === 0 ? 'امروز' : data.examDays === 1 ? 'فردا' : `${toFaDigits(data.examDays)} روز`}
                </span>
              </div>
              <div className="text-[12px] font-black truncate leading-tight">
                {data.examTitle}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
                {data.examDate ? toFaDigits(data.examDate) : 'روزشمار امتحانات'}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-[9.5px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                <span className="flex items-center gap-1">
                  <ListTodo className="w-3 h-3" />
                  <span>کارهای امروز</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 font-black">
                  {toFaDigits(data.tasksDoneCount)} از {toFaDigits(data.tasksTotalCount)}
                </span>
              </div>
              <div className="text-[12px] font-black truncate leading-tight">
                {data.topTaskTitle}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                <span className="truncate">{data.secondTaskTitle}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {data.topTaskPriority}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TasksWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full h-full rounded-[26px] p-3.5 border shadow-xl flex flex-col justify-between aspect-square select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-500 grid place-items-center">
            <ListTodo className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">
            کارهای امروز
          </span>
        </div>
        <span
          className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md border ${
            data.tasksDoneCount === data.tasksTotalCount
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}
        >
          {toFaDigits(data.tasksDoneCount)}/{toFaDigits(data.tasksTotalCount)}
        </span>
      </div>

      <div className="my-auto py-1">
        <div className="text-[9.5px] font-bold text-slate-400 mb-0.5">تسک در اولویت</div>
        <div className="text-[12.5px] font-black leading-snug line-clamp-2">
          {data.topTaskTitle}
        </div>
        <div className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
          بعدی: {data.secondTaskTitle}
        </div>
      </div>

      <div
        className={`rounded-xl px-2 py-1.5 border flex items-center justify-between text-[10px] ${
          isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.04] border-white/5'
        }`}
      >
        <span className="text-slate-500 dark:text-slate-400 font-medium">وضعیت چک‌لیست:</span>
        <span className="font-bold text-amber-600 dark:text-amber-400">
          {toFaDigits(Math.round((data.tasksDoneCount / data.tasksTotalCount) * 100))}٪ انجام شد
        </span>
      </div>
    </div>
  );
}

function TasksFullWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full rounded-[26px] p-3.5 border shadow-xl select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-500 grid place-items-center">
            <ListTodo className="w-3 h-3" />
          </div>
          <span className="text-[12px] font-black text-amber-600 dark:text-amber-400">
            برنامه کاری و چک‌لیست روز
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            {toFaDigits(data.tasksDoneCount)} از {toFaDigits(data.tasksTotalCount)} کار تکمیل شد
          </span>
        </div>
      </div>

      <div className="space-y-1.5 mt-2">
        <div
          className={`rounded-2xl p-2 px-3 border flex items-center justify-between gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.04] border-white/5'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-4 h-4 rounded-md border border-amber-500 grid place-items-center text-amber-500">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-[12px] font-black truncate">{data.topTaskTitle}</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
            {data.topTaskPriority}
          </span>
        </div>

        <div
          className={`rounded-2xl p-2 px-3 border flex items-center justify-between gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.04] border-white/5'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-4 h-4 rounded-md border border-slate-400 dark:border-slate-600" />
            <span className="text-[12px] font-bold text-slate-400 truncate">{data.secondTaskTitle}</span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">عادی</span>
        </div>
      </div>
    </div>
  );
}

function StudyWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';
  const hours = Math.floor(data.todayStudyMinutes / 60);
  const mins = data.todayStudyMinutes % 60;
  const timeStr = hours > 0 ? `${toFaDigits(hours)}س و ${toFaDigits(mins)}د` : `${toFaDigits(mins)} دقیقه`;

  return (
    <div
      className={`w-full h-full rounded-[26px] p-3.5 border shadow-xl flex flex-col justify-between aspect-square select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-violet-500/20 text-violet-500 grid place-items-center">
            <Timer className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-black text-violet-600 dark:text-violet-400">
            مطالعه امروز
          </span>
        </div>
        <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-black">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{toFaDigits(data.studyStreak)}</span>
        </div>
      </div>

      <div className="my-auto py-1 text-center">
        <div className="text-[26px] font-black leading-none font-mono tracking-tight">
          {timeStr}
        </div>
        <div className="text-[10px] font-bold text-slate-400 mt-1 truncate px-1">
          {data.currentStudySubject}
        </div>
      </div>

      <div
        className={`rounded-xl p-1.5 border flex items-center justify-between text-[9.5px] ${
          isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.04] border-white/5'
        }`}
      >
        <span className="text-slate-500 dark:text-slate-400 font-medium">هدف: ۴ ساعت</span>
        <span className="font-bold text-violet-600 dark:text-violet-400">
          {toFaDigits(Math.min(100, Math.round((data.todayStudyMinutes / data.targetStudyMinutes) * 100)))}٪ تکمیل
        </span>
      </div>
    </div>
  );
}

function StudyFullWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';
  const hours = Math.floor(data.todayStudyMinutes / 60);
  const mins = data.todayStudyMinutes % 60;
  const pct = Math.min(100, Math.round((data.todayStudyMinutes / data.targetStudyMinutes) * 100));

  return (
    <div
      className={`w-full rounded-[26px] p-3.5 border shadow-xl select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-violet-500/20 text-violet-500 grid place-items-center">
            <Timer className="w-3 h-3" />
          </div>
          <div>
            <div className="text-[12px] font-black text-violet-600 dark:text-violet-400">
              پلنر و پومودورو مطالعه
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
            استریک {toFaDigits(data.studyStreak)} روزه
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span>مجموع امروز: {toFaDigits(hours)} ساعت و {toFaDigits(mins)} دقیقه</span>
            <span className="text-violet-600 dark:text-violet-400">{toFaDigits(pct)}٪</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            در حال مطالعه: {data.currentStudySubject}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamTrackerWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  const daysBadge =
    data.examDays === 0
      ? 'امروز'
      : data.examDays === 1
        ? 'فردا'
        : data.examDays > 1
          ? `${toFaDigits(data.examDays)} روز مانده`
          : 'پایان امتحانات';

  const isUrgent = data.examDays >= 0 && data.examDays <= 2;

  return (
    <div
      className={`w-full rounded-[26px] p-3.5 border shadow-xl select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-rose-500/20 text-rose-500 grid place-items-center">
            <AlertCircle className="w-3 h-3" />
          </div>
          <span className="text-[12px] font-black text-rose-600 dark:text-rose-400">
            روزشمار امتحانات پایان‌ترم
          </span>
        </div>
        <span
          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
            isUrgent
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          }`}
        >
          {daysBadge}
        </span>
      </div>

      <div
        className={`rounded-2xl p-2.5 border ${
          isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.04] border-white/5'
        }`}
      >
        <div className="text-[13px] font-black truncate">{data.examTitle}</div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
          <span>{data.examDate ? toFaDigits(data.examDate) : 'روزشمار خالی'}</span>
          <span>{data.examRoom ? toFaDigits(data.examRoom) : ''}</span>
        </div>
      </div>

      {data.secondExamTitle && (
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 px-1">
          <span className="truncate">امتحان بعدی: {data.secondExamTitle}</span>
          <span className="shrink-0 font-bold text-slate-400">
            {toFaDigits(data.secondExamDays)} روز بعد
          </span>
        </div>
      )}
    </div>
  );
}

function NextClassWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full h-full rounded-[26px] p-3.5 border shadow-xl flex flex-col justify-between aspect-square select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-500 grid place-items-center">
            <Clock className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-black text-sky-600 dark:text-sky-400">
            کلاس بعدی
          </span>
        </div>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
            isLight
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
          }`}
        >
          امروز
        </span>
      </div>

      <div className="my-auto py-1">
        <div className="text-[13px] font-black leading-snug line-clamp-2">
          {data.nextTitle}
        </div>
        {data.nextProf && (
          <div className="text-[10px] font-medium text-slate-400 mt-1 truncate">
            استاد: {data.nextProf}
          </div>
        )}
      </div>

      <div
        className={`rounded-xl px-2 py-1.5 border flex items-center justify-between text-[10px] ${
          isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.04] border-white/5'
        }`}
      >
        <span className="font-bold text-sky-600 dark:text-sky-400">
          {data.nextTime ? toFaDigits(data.nextTime) : '—'}
        </span>
        <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
          {data.nextRoom ? toFaDigits(data.nextRoom) : 'کلاس حضوری'}
        </span>
      </div>
    </div>
  );
}

function GpaStandingWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';
  const numGpa = parseFloat(String(data.gpa || '').replace(/[^\d.]/g, '')) || 0;

  return (
    <div
      className={`w-full h-full rounded-[26px] p-3.5 border shadow-xl flex flex-col justify-between aspect-square select-none transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-slate-900'
          : 'bg-[#0f172a]/95 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-500 grid place-items-center">
            <GraduationCap className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
            کارنامه رسمی
          </span>
        </div>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
            isLight
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}
        >
          رسمی
        </span>
      </div>

      <div className="text-center my-auto py-1">
        <div className="text-[34px] font-black leading-none font-mono tracking-tight">
          {toFaDigits(data.gpa || '—')}
        </div>
        <div
          className={`text-[10px] font-bold mt-1.5 truncate px-1 ${
            numGpa >= 17
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-sky-600 dark:text-sky-400'
          }`}
        >
          {data.statusText || 'وضعیت تحصیلی'}
        </div>
      </div>

      <div
        className={`rounded-xl px-2 py-1.5 border flex items-center justify-between text-[10px] ${
          isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.04] border-white/5'
        }`}
      >
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          پاس: {toFaDigits(data.unitsPassed)} واحد
        </span>
        <span className="font-bold text-slate-400">
          ترم: {toFaDigits(data.termGpa)}
        </span>
      </div>
    </div>
  );
}
