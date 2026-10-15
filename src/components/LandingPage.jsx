import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  Calendar,
  GraduationCap,
  Smartphone,
  BookOpen,
  Heart,
  X,
  Bell,
  Clock,
  LayoutGrid,
  TrendingUp,
  VolumeX,
  CheckCircle2,
  ChevronLeft,
  Users,
} from 'lucide-react';
import { useTheme, SARV_THEMES } from '../context/ThemeContext';
import { toFaDigits } from '../utils/faDigits';
import ExtensionArchiveGuide from './ExtensionArchiveGuide';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function TelegramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

const LATEST_APK_URL = 'https://github.com/mjb4khshi/sarvestan/releases/latest/download/sarvestan.apk';

const COUNCIL_MEMBERS = [
  { name: 'محمدجواد بخشی ایرج', role: 'دبیر شورا', uni: 'خواجه نصیر' },
  { name: 'سید محمدحسین حائری', role: 'هماهنگ‌کننده و پشتیبانی شورا', uni: 'خواجه نصیر' },
  { name: 'امیرحسن رضایی', role: 'نماینده شورا', uni: 'امیرکبیر' },
  { name: 'محمدحسین شفیعی', role: 'نماینده شورا', uni: 'تهران' },
  { name: 'محمدسجاد زنگنه', role: 'نماینده شورا', uni: 'شهید بهشتی' },
  { name: 'مهدی خسروی', role: 'نماینده شورا', uni: 'تربیت دبیر شهید رجایی' },
  { name: 'محمدرضا اسفندیار', role: 'نماینده شورا', uni: 'علم و صنعت' },
];

const CONTRIBUTORS = [
  { name: 'سید محمدحسین حائری', role: 'همراه و تستر نسخه بتا' },
  { name: 'اشکان جلالی', role: 'همراه و مشاور نسخه بتا' },
  { name: 'پارسا شکیبایی', role: 'تستر نسخه بتا' },
  { name: 'حسام خانی', role: 'تستر نسخه بتا' },
  { name: 'محمدحسین صفدری', role: 'تستر نسخه بتا' },
  { name: 'امیر صالحی', role: 'تستر نسخه بتا' },
  { name: 'صدرا زینال زاده', role: 'تستر نسخه بتا' },
];

export default function LandingPage() {
  const { currentTheme, setTheme } = useTheme();
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [previewThemeId, setPreviewThemeId] = useState(currentTheme || 'sarv');

  useEffect(() => {
    if (currentTheme) setPreviewThemeId(currentTheme);
  }, [currentTheme]);

  const previewTheme = SARV_THEMES.find((t) => t.id === previewThemeId) || SARV_THEMES[0];

  return (
    <div className="min-h-screen bg-base text-base-content font-sans antialiased selection:bg-primary/20 selection:text-primary transition-colors duration-300">
      {/* نوار ناوبری بالا */}
      <header className="sticky top-0 z-40 bg-base/80 backdrop-blur-md border-b border-base-500/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="./sarv-logo.png"
              alt="سروستان"
              className="w-8 h-8 object-contain"
            />
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-base-content">سروستان</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/25">
                ۲ تهران
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-neutral">
            <a href="#features" className="hover:text-base-content transition-colors">امکانات</a>
            <a href="#mockup" className="hover:text-base-content transition-colors">پیش‌نمایش</a>
            <a href="#council" className="hover:text-base-content transition-colors">شورای هماهنگی</a>
            <a href="#download" className="hover:text-base-content transition-colors">دانلود</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href="https://t.me/s4rvest4n"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-base-500/20 hover:bg-[#229ED9]/15 text-neutral hover:text-[#229ED9] grid place-items-center transition-all"
              title="کانال تلگرام"
            >
              <TelegramIcon className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/mjb4khshi/sarvestan"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-base-500/20 hover:bg-base-500/40 text-neutral hover:text-base-content grid place-items-center transition-all"
              title="مخزن گیت‌هاب"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
            <a
              href="./sarvestan.apk"
              download
              className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-content text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود اندروید</span>
            </a>
          </div>
        </div>
      </header>

      {/* بخش هیرو */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* گرادینت پس‌زمینه ملایم */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-500/20 border border-base-500/30 text-xs font-bold text-neutral">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>نگارش رسمی ۲.۰.۰ (تهران) هم‌اکنون در دسترس است</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-base-content leading-tight sm:leading-tight tracking-tight">
            سروستان؛ تجربه نو و هوشمند <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent">
              آموزش دانشگاهی
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-neutral leading-relaxed max-w-2xl mx-auto font-medium">
            دسترسی آفلاین به برنامه هفتگی و امتحانات، ویجت‌های زنده هوشمند، تفکیک دروس کهاد و محاسبه‌گر تحصیلی برای دانشجویان دانشگاه‌های کشور
          </p>

          {/* دکمه‌های اقدام اصلی */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="./sarvestan.apk"
              download
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-primary text-primary-content text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:brightness-105 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>دانلود مستقیم نسخه اندروید (APK)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-black/20 font-mono font-bold">
                {toFaDigits('5.3')} MB
              </span>
            </a>

            <a
              href="https://t.me/s4rvest4n"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-base-500/20 hover:bg-base-500/35 border border-base-500/30 text-base-content text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <TelegramIcon className="w-4 h-4 text-[#229ED9]" />
              <span>کانال تلگرام @s4rvest4n</span>
            </a>
          </div>

          {/* مزایای کلیدی زیر دکمه */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>۱۰۰٪ امن، محلی و بدون سرور واسطه</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>کارکرد مستقل بدون نیاز به فیلترشکن</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>سازگار با اندروید ۸ به بالا</span>
            </span>
          </div>
        </div>
      </section>

      {/* موکاپ زنده و تعاملی گوشی هوشمند */}
      <section id="mockup" className="py-12 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* انتخابگر پوسته موکاپ */}
          <div className="mb-6 p-2 rounded-2xl bg-base-500/20 border border-base-500/30 flex items-center gap-1.5 flex-wrap justify-center">
            <span className="text-xs text-neutral px-2 font-bold">انتخاب پوسته زنده:</span>
            {[
              { id: 'sarv', name: 'سَرو امضا', color: '#10b981' },
              { id: 'laboo', name: 'لبویی سفید', color: '#931139' },
              { id: 'persian-dark', name: 'پرشین دارک', color: '#0066a4' },
              { id: 'persian-light', name: 'پرشین لایت', color: '#0284c7' },
            ].map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => {
                  setPreviewThemeId(th.id);
                  setTheme(th.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewThemeId === th.id
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'bg-base-500/20 text-neutral hover:text-base-content'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: th.color }} />
                <span>{th.name}</span>
              </button>
            ))}
          </div>

          {/* فریم موبایل با انیمیشن ظریف */}
          <div className="relative w-full max-w-[340px] sm:max-w-[380px] rounded-[44px] p-3 sm:p-4 bg-gradient-to-b from-neutral/40 via-base-500/30 to-neutral/40 shadow-2xl border-4 border-base-500/50">
            {/* ناچ بالای گوشی */}
            <div className="w-28 h-5 rounded-full bg-black/80 mx-auto mb-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neutral/40" />
              <span className="w-3 h-3 rounded-full bg-neutral/60" />
            </div>

            {/* صفحه نمایش موکاپ */}
            <div
              className="rounded-[32px] overflow-hidden p-4 space-y-3.5 transition-colors duration-500 text-right shadow-inner min-h-[560px]"
              style={{
                backgroundColor: previewTheme.base,
                color: previewTheme.mode === 'light' ? '#0f172a' : '#f8fafc',
              }}
            >
              {/* هدر صفحه اپلیکیشن */}
              <div className="flex items-center justify-between pt-1 pb-2 border-b border-base-500/20">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-primary-soft text-primary grid place-items-center shrink-0">
                    <img src="./sarv-logo.png" alt="لوگو" className="w-5 h-5 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black truncate">دانشگاه خواجه نصیر</p>
                    <p className="text-[10px] text-neutral font-medium">مهندسی صنایع • ورودی ۴۰۴</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-content font-mono">
                  ترم ۴۰۴۱
                </span>
              </div>

              {/* کارت کلاس بعدی */}
              <div className="p-3.5 rounded-2xl bg-base-500/20 border border-base-500/30 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold flex items-center gap-1.5 text-primary">
                    <Clock className="w-3.5 h-3.5" />
                    کلاس در جریان
                  </span>
                  <span className="font-mono text-neutral font-bold">{toFaDigits('13:30 - 15:00')}</span>
                </div>
                <div>
                  <h4 className="text-[13px] font-black">تحقیق در عملیات ۱ (OR)</h4>
                  <p className="text-[11px] text-neutral mt-0.5">استاد: دکتر عباسی • کلاس ۲۰۴ دانشکده</p>
                </div>
                {/* نوار پیشرفت کلاس */}
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-base-500/30 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[65%] rounded-full" />
                  </div>
                  <div className="flex justify-between text-[9.5px] text-neutral font-mono">
                    <span>{toFaDigits('55')} دقیقه سپری‌شده</span>
                    <span>{toFaDigits('35')} دقیقه باقیمانده</span>
                  </div>
                </div>
              </div>

              {/* دسترسی سریع ۴گانه */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { title: 'برنامه', icon: Calendar, color: 'text-primary' },
                  { title: 'کارنامه', icon: GraduationCap, color: 'text-accent' },
                  { title: 'امور مالی', icon: TrendingUp, color: 'text-warn' },
                  { title: 'چارت', icon: LayoutGrid, color: 'text-info' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-base-500/15 border border-base-500/25 flex flex-col items-center gap-1 text-center"
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-[10.5px] font-bold text-base-content">{item.title}</span>
                  </div>
                ))}
              </div>

              {/* کارت خلاصه نمرات و معدل */}
              <div className="p-3.5 rounded-2xl bg-base-500/20 border border-base-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] text-neutral font-bold">وضعیت تحصیلی دانشجو</span>
                  <p className="text-[12.5px] font-black mt-0.5 text-base-content">
                    {toFaDigits('18')} واحد اخذشده • معدل کل {toFaDigits('18.85')}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-success-soft text-success border border-success/30 font-mono">
                  رتبه الف
                </span>
              </div>

              {/* کارت یادآور سایلنت خودکار */}
              <div className="p-3 rounded-2xl bg-primary-soft/40 border border-primary/30 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-primary" />
                  <span className="font-bold text-base-content">سکوت خودکار کلاس (DND)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-content">
                  فعال
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* امکانات کلیدی (چهارضلعی مینیمال) */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 border-t border-base-500/20 bg-base-500/5">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-base-content">
              امکانات کلیدی سروستان
            </h2>
            <p className="text-xs sm:text-sm text-neutral max-w-lg mx-auto">
              طراحی‌شده برای برطرف کردن تمام دغدغه‌های روزمره دانشجویان در کار با سامانه آموزش
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* ۱. آفلاین و ویجت‌ها */}
            <div className="p-6 rounded-3xl bg-base border border-base-500/30 hover:border-primary/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary grid place-items-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-base-content">
                کارکرد ۱۰۰٪ آفلاین و ویجت‌های صفحه اصلی
              </h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                برنامه کلاسی و جزئیات دروس به صورت رمزگذاری‌شده روی حافظه دستگاه ذخیره می‌شوند. بدون نیاز به اتصال مجدد به بهستان یا اینترنت، برنامه و نمرات همیشه در دسترس است و ۳ ویجت تعاملی روی هوم‌اسکرین گوشی قرار می‌گیرد.
              </p>
            </div>

            {/* ۲. پشتیبانی کهاد */}
            <div className="p-6 rounded-3xl bg-base border border-base-500/30 hover:border-primary/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent grid place-items-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-base-content">
                پشتیبانی کامل از دانشجویان کهاد (دورشته‌ای)
              </h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                سروستان تنها پلتفرمی است که دروس رشته اصلی و کهاد را به شکل کاملاً هوشمند تفکیک می‌کند تا دانشجویان دورشته‌ای هیچ تداخلی در ساعات کلاسی، امتحانات و محاسبات کارنامه مشاهده نکنند.
              </p>
            </div>

            {/* ۳. سکوت خودکار و یادآور سماد */}
            <div className="p-6 rounded-3xl bg-base border border-base-500/30 hover:border-primary/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-warn-soft text-warn grid place-items-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-base-content">
                سکوت خودکار سر کلاس (DND) و یادآور غذا
              </h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                گوشی شما در ساعات کلاسی به طور خودکار سایلنت می‌شود و پس از پایان کلاس به حالت عادی بازمی‌گردد. همچنین اعلان یادآوری رزرو غذای هفته آینده سامانه سماد هر چهارشنبه ارسال می‌گردد.
              </p>
            </div>

            {/* ۴. چارت تعاملی و معدل‌ساز */}
            <div className="p-6 rounded-3xl bg-base border border-base-500/30 hover:border-primary/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-info-soft text-info grid place-items-center">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-base-content">
                چارت درسی تعاملی و محاسبه‌گر تحصیلی
              </h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                گراف بصری پیش‌نیازی و هم‌نیازی دروس، تفکیک نمرات قطعی و موقت، محاسبه معدل کل، پیش‌بینی معدل ترم و تفکیک دقیق ریز بدهی شهریه با شفافیت کامل در دسترس شماست.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* شورای هماهنگی سروستان */}
      <section id="council" className="py-16 sm:py-20 px-4 sm:px-6 border-t border-base-500/20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>همکاری بین‌دانشگاهی دانشجویان کشور</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-base-content">
              شورای هماهنگی سروستان
            </h2>
            <p className="text-xs sm:text-sm text-neutral max-w-xl mx-auto leading-relaxed">
              متشکل از دانشجویان دانشگاه‌های خواجه نصیرالدین طوسی، شهید بهشتی، علم و صنعت، تهران، صنعتی امیرکبیر و شهید رجایی جهت ارتقا، همفکری و گسترش زیست‌بوم سروستان
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {COUNCIL_MEMBERS.map((member, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-base-500/15 border border-base-500/25 flex items-center justify-between gap-3 text-right"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-base-content truncate">{member.name}</p>
                  <p className="text-[10.5px] text-neutral mt-0.5 truncate">{member.role}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-base-500/30 text-base-content shrink-0">
                  {member.uni}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* بخش دانلود اصلی */}
      <section id="download" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-base-500/20 bg-base-500/5">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-content grid place-items-center mx-auto shadow-md">
            <Download className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-base-content">
            دریافت نسخه ۲ سروستان
          </h2>

          <p className="text-xs sm:text-sm text-neutral max-w-md mx-auto leading-relaxed">
            نسخه پایدار و رسمی ۲.۰.۰ با کد نام تهران را مستقیماً دریافت کنید و از تجربه سریع و مدرن خدمات آموزشی لذت ببرید.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="./sarvestan.apk"
              download
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-primary text-primary-content text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:brightness-105 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>دانلود مستقیم sarvestan.apk</span>
            </a>

            <a
              href="https://github.com/mjb4khshi/sarvestan/releases/latest"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-base-500/20 hover:bg-base-500/35 border border-base-500/30 text-base-content text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <GithubIcon className="w-4 h-4" />
              <span>ریلیزهای گیت‌هاب</span>
            </a>
          </div>
        </div>
      </section>

      {/* قدردانی از همراهان و تسترها */}
      <section className="py-12 px-4 sm:px-6 border-t border-base-500/20">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-neutral">
            <Heart className="w-4 h-4 text-primary" />
            <span>قدردانی صمیمانه از همراهان، تسترها و حامیان نسخه بتا</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {CONTRIBUTORS.map((c, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-base-500/15 border border-base-500/25 text-xs font-medium text-base-content"
              >
                {c.name}
              </span>
            ))}
          </div>

          <p className="text-[11px] text-neutral leading-relaxed max-w-lg mx-auto">
            با تشکر و قدردانی ویژه از <strong>اشکان جلالی</strong> بابت همراهی و مشاوره‌های فنی در مسیر طراحی و انتشار سروستان.
          </p>
        </div>
      </section>

      {/* فوتر مینیمال و تمیز */}
      <footer className="py-8 px-4 sm:px-6 border-t border-base-500/20 bg-base text-xs text-neutral">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div className="flex items-center gap-2.5">
            <img src="./sarv-logo.png" alt="لوگو" className="w-6 h-6 object-contain" />
            <span>پروژه آزاد سروستان • نگارش ۲ (تهران)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsExtensionModalOpen(true)}
              className="text-primary hover:underline font-bold cursor-pointer"
            >
              راهنمای آرشیوشده افزونه مرورگر
            </button>
            <span className="opacity-30">•</span>
            <a
              href="https://t.me/s4rvest4n"
              target="_blank"
              rel="noreferrer"
              className="hover:text-base-content transition-colors"
            >
              کانال تلگرام
            </a>
            <span className="opacity-30">•</span>
            <a
              href="https://github.com/mjb4khshi/sarvestan"
              target="_blank"
              rel="noreferrer"
              className="hover:text-base-content transition-colors"
            >
              گیت‌هاب
            </a>
            <span className="opacity-30">•</span>
            <span>
              طراحی و توسعه: <strong className="text-base-content font-mono font-bold">@mjb4khshi</strong>
            </span>
          </div>
        </div>
      </footer>

      {/* مودال آرشیو راهنمای افزونه مرورگر */}
      <AnimatePresence>
        {isExtensionModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExtensionModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-3xl rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col text-right"
            >
              <div className="flex items-center justify-between pb-3 border-b border-base-500/30 mb-4 shrink-0">
                <h3 className="text-base font-black text-base-content">
                  راهنمای نصب افزونه مرورگر دسکتاپ (نسخه آرشیو)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsExtensionModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ExtensionArchiveGuide />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
