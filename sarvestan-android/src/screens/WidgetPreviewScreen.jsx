import { useState, useMemo } from 'react';
import {
  Smartphone,
  Layers,
  Palette,
  ArrowRight,
  Sun,
  Moon,
  Columns,
  Sliders,
  Sparkles,
  Wifi,
  BatteryCharging,
  Signal,
  Check,
} from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import { useTheme } from '../context/ThemeContext';
import { getViewModel } from '../data/viewModel';
import { hasLiveData } from '../services/behestan/store';

// سناریوهای پیش‌فرض دیتا برای بررسی رفتارهای گوناگون ویجت‌ها
const SCENARIOS = {
  active: {
    name: 'حالت عادی (کلاس فعال + امتحان نزدیک)',
    nextTitle: 'طراحی الگوریتم‌ها',
    nextTime: '۱۳:۳۰ تا ۱۵:۰۰',
    nextRoom: 'کلاس ۴۰۱ کامپیوتر',
    examTitle: 'هوش مصنوعی و سیستم‌های خبره',
    examDays: 3,
    examDate: '۱۴۰۴/۱۰/۱۸',
    gpa: '۱۸.۴۵',
    statusText: '★ دانشجوی رتبه ممتاز (الف) ★',
    unitsPassed: '۸۴',
    termGpa: '۱۸.۸۰',
  },
  noClass: {
    name: 'روز بدون کلاس (تعطیل / خارج از ساعت)',
    nextTitle: 'امروز کلاسی ثبت نشده',
    nextTime: '',
    nextRoom: '',
    examTitle: 'شبکه‌های کامپیوتری',
    examDays: 1,
    examDate: '۱۴۰۴/۱۰/۱۴',
    gpa: '۱۷.۶۰',
    statusText: '★ دانشجوی رتبه ممتاز (الف) ★',
    unitsPassed: '۹۱',
    termGpa: '۱۷.۱۵',
  },
  examSeason: {
    name: 'فرجه امتحانات (امتحان فردا)',
    nextTitle: 'برنامه کلاس‌ها به پایان رسیده',
    nextTime: '',
    nextRoom: '',
    examTitle: 'معماری کامپیوتر و ریزپردازنده',
    examDays: 0,
    examDate: 'امروز ۱۴:۰۰',
    gpa: '۱۶.۲۵',
    statusText: '✓ وضعیت تحصیلی: عادی و مطلوب',
    unitsPassed: '۷۰',
    termGpa: '۱۶.۵۰',
  },
  noExams: {
    name: 'اوایل ترم (امتحانی نزدیک نیست)',
    nextTitle: 'سیستم‌های عامل',
    nextTime: '۰۸:۰۰ تا ۱۰:۰۰',
    nextRoom: 'آمفی‌تئاتر خوارزمی',
    examTitle: 'امتحانی نزدیک نیست',
    examDays: -1,
    examDate: '',
    gpa: '۱۹.۱۰',
    statusText: '★ دانشجوی رتبه ممتاز (الف) ★',
    unitsPassed: '۵۲',
    termGpa: '۱۹.۳۰',
  },
};

export default function WidgetPreviewScreen({ onBack }) {
  const [selectedScenario, setSelectedScenario] = useState('active');
  const [themeMode, setThemeMode] = useState('both'); // 'light' | 'dark' | 'both'
  const [viewMode, setViewMode] = useState('both'); // 'phone' | 'cards' | 'both'
  const [wallpaper, setWallpaper] = useState('default'); // 'default' | 'vibrant' | 'minimal'
  const [activeWidgetTab, setActiveWidgetTab] = useState('all'); // 'all' | 'combo' | 'gpa' | 'class'

  // استخراج داده بر اساس سناریو یا دیتای زنده
  const data = useMemo(() => {
    if (selectedScenario === 'live' && hasLiveData()) {
      const vm = getViewModel();
      const next = vm?.nextClass;
      const exam = (vm?.exams || [])[0];
      const gpaNum = parseFloat(String(vm?.summary?.gpa || '').replace(/[^\d.]/g, '')) || 0;
      return {
        name: 'دیتای زندهٔ جاری بهستان',
        nextTitle: next?.title || 'امروز کلاسی ثبت نشده',
        nextTime: next?.time || '',
        nextRoom: next?.room ? `کلاس ${toFaDigits(next.room)}` : '',
        examTitle: exam?.course || 'امتحانی نزدیک نیست',
        examDays: exam?.daysLeft ?? -1,
        examDate: exam?.examDate || '',
        gpa: vm?.summary?.gpa || '—',
        statusText: gpaNum >= 17 ? '★ دانشجوی رتبه ممتاز (الف) ★' : '✓ وضعیت تحصیلی: عادی',
        unitsPassed: String(vm?.curriculum?.passedCredits ?? vm?.profile?.totalUnitsPassed ?? '—'),
        termGpa: vm?.termsData?.[0]?.gpa || '—',
      };
    }
    return SCENARIOS[selectedScenario] || SCENARIOS.active;
  }, [selectedScenario]);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans" dir="rtl">
      {/* هدر کنترل میز کار */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="بازگشت به اپ"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 grid place-items-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2">
                میز کار مقایسه نسخه‌های لایت و دارک ویجت‌ها
                <span className="text-[10px] bg-sky-500/20 text-sky-400 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                  Light & Dark Modes
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                بررسی و اصلاحیه نسخه‌های روشن و تاریک ویجت‌های اندروید سروستان
              </p>
            </div>
          </div>

          {/* ابزارها و فیلترها */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* انتخاب تم ویجت: لایت / دارک / مقایسه دوتایی */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 text-xs">
              <button
                onClick={() => setThemeMode('both')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  themeMode === 'both' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="مقایسه نسخه روشن و تاریک کنار هم"
              >
                <Columns className="w-3.5 h-3.5" />
                مقایسه دوگانه
              </button>
              <button
                onClick={() => setThemeMode('light')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  themeMode === 'light' ? 'bg-amber-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="نمایش نسخه لایت (روشن)"
              >
                <Sun className="w-3.5 h-3.5" />
                نسخه روشن (Light)
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  themeMode === 'dark' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="نمایش نسخه دارک (تاریک)"
              >
                <Moon className="w-3.5 h-3.5" />
                نسخه تاریک (Dark)
              </button>
            </div>

            {/* سناریوی دیتا */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="active" className="bg-slate-800">کلاس فعال + امتحان نزدیک</option>
                <option value="noClass" className="bg-slate-800">روز بدون کلاس</option>
                <option value="examSeason" className="bg-slate-800">فرجه امتحانات (فردا)</option>
                <option value="noExams" className="bg-slate-800">اوایل ترم (بدون امتحان)</option>
                {hasLiveData() && <option value="live" className="bg-slate-800">دیتای زنده بهستان</option>}
              </select>
            </div>

            {/* حالت نمایش */}
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
                روی لانچر گوشی
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                کارت‌های بزرگ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* محتوا */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">

        {/* بخش ۱: شبیه‌ساز صفحه اصلی موبایل */}
        {(viewMode === 'both' || viewMode === 'phone') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  شبیه‌ساز صفحه اصلی اندروید {themeMode === 'both' ? '(مقایسه نسخه روشن و تاریک)' : themeMode === 'light' ? '(نسخه روشن - Light)' : '(نسخه تاریک - Dark)'}
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                بررسی هماهنگی ویجت با والپیپر و تم سیستم‌عامل
              </span>
            </div>

            <div className={`grid gap-8 place-items-center ${themeMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* گوشی شماره ۱: نسخه روشن (Light Mode) */}
              {(themeMode === 'both' || themeMode === 'light') && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Sun className="w-4 h-4" />
                    <span>لانچر در حالت روشن (Light Mode)</span>
                  </div>

                  <div className="w-full max-w-[380px] rounded-[48px] p-3.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-2xl border-4 border-slate-300 relative overflow-hidden">
                    {/* صفحه نمایش با والپیپر روشن */}
                    <div className="rounded-[38px] p-4 min-h-[720px] flex flex-col justify-between select-none relative bg-gradient-to-b from-[#e8f0fe] via-[#f1f5f9] to-[#ffffff] text-slate-900 transition-all">
                      
                      {/* استاتوس‌بار لایت */}
                      <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold px-2 pt-1 pb-3">
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

                      {/* ساعت و تاریخ لایت */}
                      <div className="text-center py-2 space-y-0.5">
                        <div className="text-4xl font-black text-slate-800 tracking-tight font-mono">
                          ۱۲:۴۲
                        </div>
                        <div className="text-[12px] text-slate-600 font-medium">
                          دوشنبه · ۲۴ شهریور ۱۴۰۵
                        </div>
                      </div>

                      {/* ویجت‌های لایت */}
                      <div className="space-y-3.5 my-auto">
                        {/* ویجت جامع لایت */}
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold px-1 mb-1 flex items-center justify-between">
                            <span>ویجت جامع روشن (۴×۲)</span>
                            <span className="text-[9px] text-emerald-700 font-bold">Light Version</span>
                          </div>
                          <ComboWidget data={data} mode="light" />
                        </div>

                        {/* دو ویجت مربعی لایت */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold px-1 mb-1">
                              <span>معدل و کارنامه (۲×۲)</span>
                            </div>
                            <GpaWidget data={data} mode="light" />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold px-1 mb-1">
                              <span>کلاس بعدی (۲×۲)</span>
                            </div>
                            <ClassWidget data={data} mode="light" />
                          </div>
                        </div>
                      </div>

                      {/* داک لایت */}
                      <div className="pt-4 pb-1">
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-2.5 flex items-center justify-around border border-slate-200/80 shadow-md">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white grid place-items-center shadow-md">
                            <svg viewBox="0 0 1080 1080" className="w-6 h-6 fill-white">
                              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
                            </svg>
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white grid place-items-center text-xs font-bold shadow-sm">
                            تلفن
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white grid place-items-center text-xs font-bold shadow-sm">
                            پیام
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-slate-600 text-white grid place-items-center text-xs font-bold shadow-sm">
                            تنظیمات
                          </div>
                        </div>
                        <div className="w-32 h-1 bg-slate-400/60 rounded-full mx-auto mt-3" />
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* گوشی شماره ۲: نسخه تاریک (Dark Mode) */}
              {(themeMode === 'both' || themeMode === 'dark') && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <Moon className="w-4 h-4" />
                    <span>لانچر در حالت تاریک (Dark Mode)</span>
                  </div>

                  <div className="w-full max-w-[380px] rounded-[48px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-850 to-slate-900 shadow-2xl border-4 border-slate-700/80 relative overflow-hidden">
                    {/* صفحه نمایش با والپیپر تیره */}
                    <div className="rounded-[38px] p-4 min-h-[720px] flex flex-col justify-between select-none relative bg-gradient-to-br from-[#0e1626] via-[#090d16] to-[#04060a] text-slate-100 transition-all">
                      
                      {/* استاتوس‌بار دارک */}
                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold px-2 pt-1 pb-3">
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

                      {/* ساعت و تاریخ دارک */}
                      <div className="text-center py-2 space-y-0.5">
                        <div className="text-4xl font-black text-white/90 tracking-tight font-mono">
                          ۱۲:۴۲
                        </div>
                        <div className="text-[12px] text-slate-400 font-medium">
                          دوشنبه · ۲۴ شهریور ۱۴۰۵
                        </div>
                      </div>

                      {/* ویجت‌های دارک */}
                      <div className="space-y-3.5 my-auto">
                        {/* ویجت جامع دارک */}
                        <div>
                          <div className="text-[10px] text-emerald-400/80 font-bold px-1 mb-1 flex items-center justify-between">
                            <span>ویجت جامع تاریک (۴×۲)</span>
                            <span className="text-[9px] text-slate-500 font-mono">Dark Version</span>
                          </div>
                          <ComboWidget data={data} mode="dark" />
                        </div>

                        {/* دو ویجت مربعی دارک */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <div className="text-[10px] text-purple-400/80 font-bold px-1 mb-1">
                              <span>معدل و کارنامه (۲×۲)</span>
                            </div>
                            <GpaWidget data={data} mode="dark" />
                          </div>
                          <div>
                            <div className="text-[10px] text-sky-400/80 font-bold px-1 mb-1">
                              <span>کلاس بعدی (۲×۲)</span>
                            </div>
                            <ClassWidget data={data} mode="dark" />
                          </div>
                        </div>
                      </div>

                      {/* داک دارک */}
                      <div className="pt-4 pb-1">
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-2.5 flex items-center justify-around border border-white/10">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white grid place-items-center shadow-lg shadow-emerald-500/25">
                            <svg viewBox="0 0 1080 1080" className="w-6 h-6 fill-white">
                              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
                            </svg>
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-blue-600/80 text-white grid place-items-center text-xs font-bold">
                            تلفن
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-amber-600/80 text-white grid place-items-center text-xs font-bold">
                            پیام
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-slate-700/80 text-white grid place-items-center text-xs font-bold">
                            تنظیمات
                          </div>
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

        {/* بخش ۲: بازرسی دقیق و بزرگ‌نمایی تفکیکی */}
        {(viewMode === 'both' || viewMode === 'cards') && (
          <section className="space-y-6 pt-6 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  بررسی مجزا و مقایسه تفکیکی نسخه لایت و دارک
                </h2>
                <p className="text-xs text-slate-400">
                  جهت بررسی جزئیات کادرها، کنتراست متن‌ها، فونت آراد و پالت رنگی هر دو تم
                </p>
              </div>

              {/* تب انتخاب ویجت */}
              <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 text-xs">
                <button
                  onClick={() => setActiveWidgetTab('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    activeWidgetTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  همه ویجت‌ها
                </button>
                <button
                  onClick={() => setActiveWidgetTab('combo')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    activeWidgetTab === 'combo' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ۱. ویجت جامع ۴×۲
                </button>
                <button
                  onClick={() => setActiveWidgetTab('gpa')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    activeWidgetTab === 'gpa' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ۲. ویجت معدل ۲×۲
                </button>
                <button
                  onClick={() => setActiveWidgetTab('class')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    activeWidgetTab === 'class' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ۳. ویجت کلاس ۲×۲
                </button>
              </div>
            </div>

            <div className="space-y-8">
              
              {/* ۱. مقایسه ویجت جامع */}
              {(activeWidgetTab === 'all' || activeWidgetTab === 'combo') && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      ۱. ویجت جامع سروستان (Combo Widget - ۴×۲)
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        کلاس بعدی + روزشمار امتحان + معدل
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* نسخه روشن */}
                    <div className="p-5 rounded-2xl bg-slate-100/10 border border-slate-700/50 flex flex-col items-center space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 self-start">
                        <Sun className="w-4 h-4" />
                        <span>نسخه لایت (روشن) - پالت سفید و کرم با کادر Slate</span>
                      </div>
                      <div className="w-full max-w-[360px]">
                        <ComboWidget data={data} mode="light" />
                      </div>
                    </div>

                    {/* نسخه تاریک */}
                    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 self-start">
                        <Moon className="w-4 h-4" />
                        <span>نسخه دارک (تاریک) - گرادیان مشکی سرمه‌ای</span>
                      </div>
                      <div className="w-full max-w-[360px]">
                        <ComboWidget data={data} mode="dark" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ۲. مقایسه ویجت معدل */}
              {(activeWidgetTab === 'all' || activeWidgetTab === 'gpa') && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      ۲. ویجت کارنامه و معدل (GPA Widget - ۲×۲)
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                        عدد درشت معدل + رتبه ممتاز + واحدها
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* نسخه روشن */}
                    <div className="p-5 rounded-2xl bg-slate-100/10 border border-slate-700/50 flex flex-col items-center space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 self-start">
                        <Sun className="w-4 h-4" />
                        <span>نسخه لایت (روشن)</span>
                      </div>
                      <div className="w-[190px]">
                        <GpaWidget data={data} mode="light" />
                      </div>
                    </div>

                    {/* نسخه تاریک */}
                    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 self-start">
                        <Moon className="w-4 h-4" />
                        <span>نسخه دارک (تاریک)</span>
                      </div>
                      <div className="w-[190px]">
                        <GpaWidget data={data} mode="dark" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ۳. مقایسه ویجت کلاس بعدی */}
              {(activeWidgetTab === 'all' || activeWidgetTab === 'class') && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      ۳. ویجت کلاس بعدی (Next Class Widget - ۲×۲)
                      <span className="text-[10px] bg-sky-500/20 text-sky-400 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                        عنوان درس + ساعت + موقعیت کلاس
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* نسخه روشن */}
                    <div className="p-5 rounded-2xl bg-slate-100/10 border border-slate-700/50 flex flex-col items-center space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 self-start">
                        <Sun className="w-4 h-4" />
                        <span>نسخه لایت (روشن)</span>
                      </div>
                      <div className="w-[190px]">
                        <ClassWidget data={data} mode="light" />
                      </div>
                    </div>

                    {/* نسخه تاریک */}
                    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 self-start">
                        <Moon className="w-4 h-4" />
                        <span>نسخه دارک (تاریک)</span>
                      </div>
                      <div className="w-[190px]">
                        <ClassWidget data={data} mode="dark" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// کامپوننت‌های رندر ویجت با پشتیبانی کامل از Light و Dark
// ─────────────────────────────────────────────────────────────

/**
 * ۱. ویجت جامع ۴×۲ (Combo Widget)
 */
function ComboWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  const examDaysStr =
    data.examDays === 0
      ? 'امروز'
      : data.examDays === 1
        ? 'فردا'
        : data.examDays > 1
          ? `${toFaDigits(data.examDays)} روز`
          : '—';

  return (
    <div
      className={`w-full rounded-[24px] p-3.5 border shadow-xl relative overflow-hidden text-right select-none transition-all ${
        isLight
          ? 'bg-gradient-to-br from-[#FFFFFF] to-[#F8FAFC] border-slate-200 shadow-slate-300/40 text-slate-900'
          : 'border-[#24344D] text-slate-100'
      }`}
      style={
        !isLight
          ? {
              background: 'linear-gradient(135deg, #141D2E 0%, #0B101D 100%)',
            }
          : {}
      }
    >
      {/* سربرگ ویجت */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-4 h-4 rounded-md grid place-items-center ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            <svg
              viewBox="0 0 1080 1080"
              className={`w-2.5 h-2.5 ${isLight ? 'fill-emerald-700' : 'fill-emerald-400'}`}
            >
              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
            </svg>
          </div>
          <span
            className={`text-[13px] font-black ${
              isLight ? 'text-emerald-700' : 'text-[#34D399]'
            }`}
          >
            سروستان
          </span>
        </div>

        {data.gpa && data.gpa !== 'ـ' && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
              isLight
                ? 'bg-slate-100 text-slate-800 border-slate-200/80'
                : 'text-[#F1F5F9] bg-white/5 border-white/10'
            }`}
          >
            معدل {toFaDigits(data.gpa)}
          </span>
        )}
      </div>

      {/* کارت اول: کلاس بعدی */}
      <div
        className={`rounded-[16px] p-2.5 mb-1.5 border transition-all ${
          isLight
            ? 'bg-[#F1F5F9] border-slate-200/90 shadow-sm'
            : 'border-[#2A3C58]'
        }`}
        style={!isLight ? { background: '#1A2438' } : {}}
      >
        <div
          className={`text-[10px] font-bold mb-0.5 ${
            isLight ? 'text-sky-700' : 'text-[#38BDF8]'
          }`}
        >
          کلاس بعدی
        </div>
        <div
          className={`text-[13px] font-black truncate ${
            isLight ? 'text-slate-900' : 'text-[#F8FAFC]'
          }`}
        >
          {data.nextTitle}
        </div>
        <div
          className={`text-[10.5px] font-medium mt-0.5 truncate ${
            isLight ? 'text-slate-600' : 'text-[#94A3B8]'
          }`}
        >
          {data.nextTime
            ? `${toFaDigits(data.nextTime)} ${data.nextRoom ? `· ${toFaDigits(data.nextRoom)}` : ''}`
            : 'برنامه هفتگی خالی است'}
        </div>
      </div>

      {/* کارت دوم: روزشمار امتحان */}
      <div
        className={`rounded-[16px] p-2.5 border flex items-center justify-between gap-2 transition-all ${
          isLight
            ? 'bg-[#F1F5F9] border-slate-200/90 shadow-sm'
            : 'border-[#2A3C58]'
        }`}
        style={!isLight ? { background: '#1A2438' } : {}}
      >
        <div className="flex-1 min-w-0">
          <div
            className={`text-[12px] font-black truncate ${
              isLight ? 'text-slate-900' : 'text-[#F8FAFC]'
            }`}
          >
            {data.examTitle}
          </div>
          <div
            className={`text-[10px] font-medium mt-0.5 truncate ${
              isLight ? 'text-slate-600' : 'text-[#94A3B8]'
            }`}
          >
            {data.examDate ? toFaDigits(data.examDate) : 'روزشمار خالی'}
          </div>
        </div>

        {/* بج روزشمار */}
        <div
          className={`px-2.5 py-1 rounded-xl border text-[11px] font-black shrink-0 ${
            isLight
              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
              : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {examDaysStr}
        </div>
      </div>
    </div>
  );
}

/**
 * ۲. ویجت کارنامه و معدل ۲×۲ (GPA Widget)
 */
function GpaWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';
  const numGpa = parseFloat(String(data.gpa || '').replace(/[^\d.]/g, '')) || 0;

  return (
    <div
      className={`w-full h-full rounded-[24px] p-3 border shadow-xl flex flex-col justify-between text-right select-none aspect-square transition-all ${
        isLight
          ? 'bg-gradient-to-br from-[#FFFFFF] to-[#F8FAFC] border-slate-200 shadow-slate-300/40 text-slate-900'
          : 'border-[#24344D] text-slate-100'
      }`}
      style={
        !isLight
          ? {
              background: 'linear-gradient(135deg, #141D2E 0%, #0B101D 100%)',
            }
          : {}
      }
    >
      {/* سربرگ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div
            className={`w-3.5 h-3.5 rounded-md grid place-items-center ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            <svg
              viewBox="0 0 1080 1080"
              className={`w-2.5 h-2.5 ${isLight ? 'fill-emerald-700' : 'fill-emerald-400'}`}
            >
              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
            </svg>
          </div>
          <span
            className={`text-[11px] font-black ${
              isLight ? 'text-emerald-700' : 'text-[#34D399]'
            }`}
          >
            کارنامه
          </span>
        </div>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
            isLight
              ? 'bg-sky-100 text-sky-800 border-sky-200'
              : 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20'
          }`}
        >
          رسمی
        </span>
      </div>

      {/* بخش وسط: عدد معدل و وضعیت */}
      <div className="text-center my-auto py-1">
        <div
          className={`text-[32px] font-black leading-none tracking-tight ${
            isLight
              ? numGpa >= 17
                ? 'text-emerald-700'
                : 'text-slate-900'
              : 'text-white'
          }`}
        >
          {toFaDigits(data.gpa || '—')}
        </div>
        <div
          className={`text-[10px] font-bold mt-1.5 truncate px-1 ${
            isLight
              ? numGpa >= 17
                ? 'text-emerald-700'
                : 'text-sky-700'
              : 'text-[#34D399]'
          }`}
        >
          {data.statusText || 'وضعیت تحصیلی'}
        </div>
      </div>

      {/* نوار پایین: واحدهای گذرانده */}
      <div
        className={`rounded-[14px] px-2 py-1.5 border flex items-center justify-between text-[9.5px] transition-all ${
          isLight
            ? 'bg-[#F1F5F9] border-slate-200/90 text-slate-700'
            : 'border-[#2A3C58]'
        }`}
        style={!isLight ? { background: '#1A2438' } : {}}
      >
        <span className={isLight ? 'text-slate-700 font-bold truncate' : 'text-[#CBD5E1] truncate'}>
          پاس‌شده: {toFaDigits(data.unitsPassed)}
        </span>
        <span className={isLight ? 'text-slate-500 font-bold shrink-0' : 'text-[#94A3B8] font-bold shrink-0'}>
          ترم: {toFaDigits(data.termGpa)}
        </span>
      </div>
    </div>
  );
}

/**
 * ۳. ویجت کلاس بعدی ۲×۲ (Next Class Widget)
 */
function ClassWidget({ data, mode = 'dark' }) {
  const isLight = mode === 'light';

  return (
    <div
      className={`w-full h-full rounded-[24px] p-3 border shadow-xl flex flex-col justify-between text-right select-none aspect-square transition-all ${
        isLight
          ? 'bg-gradient-to-br from-[#FFFFFF] to-[#F8FAFC] border-slate-200 shadow-slate-300/40 text-slate-900'
          : 'border-[#24344D] text-slate-100'
      }`}
      style={
        !isLight
          ? {
              background: 'linear-gradient(135deg, #141D2E 0%, #0B101D 100%)',
            }
          : {}
      }
    >
      {/* سربرگ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div
            className={`w-3.5 h-3.5 rounded-md grid place-items-center ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            <svg
              viewBox="0 0 1080 1080"
              className={`w-2.5 h-2.5 ${isLight ? 'fill-emerald-700' : 'fill-emerald-400'}`}
            >
              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
            </svg>
          </div>
          <span
            className={`text-[11px] font-black ${
              isLight ? 'text-emerald-700' : 'text-[#34D399]'
            }`}
          >
            برنامه روز
          </span>
        </div>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
            isLight
              ? 'bg-sky-100 text-sky-800 border-sky-200'
              : 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20'
          }`}
        >
          کلاس بعدی
        </span>
      </div>

      {/* کارت داخلی کلاس */}
      <div
        className={`rounded-[16px] p-2.5 my-auto border flex flex-col justify-center transition-all ${
          isLight
            ? 'bg-[#F1F5F9] border-slate-200/90 shadow-sm'
            : 'border-[#2A3C58]'
        }`}
        style={!isLight ? { background: '#1A2438' } : {}}
      >
        <div
          className={`text-[13px] font-black leading-tight line-clamp-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          {data.nextTitle}
        </div>

        <div className="flex items-center justify-between gap-1 mt-2 text-[10px]">
          <span
            className={`font-bold shrink-0 ${
              isLight ? 'text-sky-700' : 'text-[#38BDF8]'
            }`}
          >
            {data.nextTime ? toFaDigits(data.nextTime) : '—'}
          </span>
          <span
            className={`truncate ${
              isLight ? 'text-slate-600 font-medium' : 'text-[#94A3B8]'
            }`}
          >
            {data.nextRoom ? toFaDigits(data.nextRoom) : 'کلاس حضوری'}
          </span>
        </div>
      </div>
    </div>
  );
}
