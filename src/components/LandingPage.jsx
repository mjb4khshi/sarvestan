import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  GraduationCap,
  Smartphone,
  X,
  Bell,
  LayoutGrid,
  CheckCircle2,
  Users,
} from 'lucide-react';
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

function LinkedinIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

// لینک دانلود آخرین فایل APK در ریلیزهای گیت‌هاب
const LATEST_APK_URL = 'https://github.com/mjb4khshi/sarvestan/releases/latest/download/sarvestan.apk';
const RELEASES_URL = 'https://github.com/mjb4khshi/sarvestan/releases/latest';

// اعضای شورای هماهنگی سروستان
const COUNCIL_MEMBERS = [
  {
    name: 'سید محمدحسین حائری',
    uni: 'صنعتی خواجه نصیر',
    role: 'هماهنگ‌کننده و پشتیبانی شورا',
  },
  {
    name: 'امیرحسن رضایی',
    uni: 'صنعتی امیرکبیر',
    role: 'نماینده شورا',
  },
  {
    name: 'محمدحسین شفیعی',
    uni: 'دانشگاه تهران',
    role: 'نماینده شورا',
  },
  {
    name: 'محمدسجاد زنگنه',
    uni: 'شهید بهشتی',
    role: 'نماینده شورا',
  },
  {
    name: 'مهدی خسروی',
    uni: 'تربیت دبیر شهید رجایی',
    role: 'نماینده شورا',
  },
  {
    name: 'محمدرضا اسفندیار',
    uni: 'علم و صنعت',
    role: 'نماینده شورا',
  },
];

// دانشگاه‌های تحت پوشش
const UNIVERSITIES = [
  {
    name: 'دانشگاه صنعتی خواجه نصیرالدین طوسی',
    shortName: 'صنعتی خواجه نصیر',
    latin: 'KNTU',
    logo: './kntu-logo.svg',
    status: 'active',
    statusText: 'پشتیبانی کامل',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    description: 'سامانه بهستان و سماد دانشگاه',
  },
  {
    name: 'دانشگاه شهید بهشتی',
    shortName: 'شهید بهشتی',
    latin: 'SBU',
    logo: './sbu-logo.svg',
    status: 'active',
    statusText: 'پشتیبانی کامل',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    description: 'سامانه بهستان دانشگاه',
  },
  {
    name: 'دانشگاه تهران',
    shortName: 'دانشگاه تهران',
    latin: 'UT',
    logo: './ut-logo.svg',
    status: 'active',
    statusText: 'پشتیبانی کامل',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    description: 'سامانه بهستان جامع',
  },
  {
    name: 'دانشگاه صنعتی امیرکبیر',
    shortName: 'صنعتی امیرکبیر',
    latin: 'AUT',
    logo: './aut-logo.png',
    status: 'active',
    statusText: 'پشتیبانی کامل',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    description: 'سامانه بهستان دانشگاه',
  },
  {
    name: 'دانشگاه علم و صنعت ایران',
    shortName: 'علم و صنعت ایران',
    latin: 'IUST',
    logo: './iust-logo.png',
    status: 'upcoming',
    statusText: 'به زودی',
    badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
    description: 'در حال توسعه و یکپارچه‌سازی',
  },
  {
    name: 'دانشگاه تربیت دبیر شهید رجایی',
    shortName: 'تربیت دبیر شهید رجایی',
    latin: 'SRTTU',
    logo: './srttu-logo.png',
    status: 'upcoming',
    statusText: 'به زودی',
    badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
    description: 'در حال توسعه و یکپارچه‌سازی',
  },
];

export default function LandingPage() {
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  useEffect(() => {
    document.title = 'سروستان | دستیار هوشمند آموزش دانشگاهی';
    document.documentElement.setAttribute('datatheme', 'persian-light');
    document.documentElement.setAttribute('data-theme', 'persian-light');
    document.documentElement.setAttribute('data-theme-mode', 'light');
    document.documentElement.classList.remove('dark');
    if (document.body) {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#0f172a';
    }
  }, []);

  return (
    <div data-theme="persian-light" className="min-h-screen bg-white text-slate-800 font-sans antialiased selection:bg-[#10b981]/20 selection:text-[#10b981]">
      {/* نوار ناوبری بالا */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="./sarv-logo.png"
              alt="سروستان"
              className="w-8 h-8 object-contain"
            />
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-slate-900">سروستان</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                ۲ تهران
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#universities" className="hover:text-slate-900 transition-colors">دانشگاه‌های تحت پوشش</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">امکانات</a>
            <a href="#council" className="hover:text-slate-900 transition-colors">شورای هماهنگی</a>
            <a href="#download" className="hover:text-slate-900 transition-colors">دانلود</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href="https://t.me/s4rvest4n"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#229ED9]/15 text-slate-600 hover:text-[#229ED9] grid place-items-center transition-all"
              title="کانال تلگرام"
            >
              <TelegramIcon className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/mjb4khshi/sarvestan"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 grid place-items-center transition-all"
              title="مخزن گیت‌هاب"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
            <a
              href={LATEST_APK_URL}
              className="px-3.5 py-1.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#10b981]/25 hover:brightness-105 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود اندروید</span>
            </a>
          </div>
        </div>
      </header>

      {/* بخش هیرو */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 overflow-hidden bg-white">
        {/* گرادینت ملایم در پس‌زمینه لایت */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-xs font-bold text-[#10b981]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>سروستانی به گستره تهران • نگارش رسمی ۲.۰.۰ هم‌اکنون در دسترس است</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight sm:leading-tight tracking-tight">
            سروستان؛ تجربه نو و هوشمند <br className="hidden sm:inline" />
            <span className="text-[#10b981]">
              آموزش دانشگاهی
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
            دسترسی آفلاین به برنامه هفتگی و امتحانات، ویجت‌های زنده هوشمند، تفکیک دروس کهاد و محاسبه‌گر تحصیلی برای دانشجویان دانشگاه‌های کشور
          </p>

          {/* دکمه‌های اقدام اصلی */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={LATEST_APK_URL}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#10b981]/30 hover:brightness-105 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>دانلود مستقیم نسخه اندروید (APK)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-black/20 text-white font-mono font-bold">
                {toFaDigits('5.3')} MB
              </span>
            </a>

            <a
              href="https://t.me/s4rvest4n"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <TelegramIcon className="w-4 h-4 text-[#229ED9]" />
              <span>کانال تلگرام @s4rvest4n</span>
            </a>
          </div>

          {/* مزایای کلیدی زیر دکمه */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
              <span>۱۰۰٪ امن، محلی و بدون سرور واسطه</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
              <span>کارکرد مستقل بدون نیاز به فیلترشکن</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
              <span>سازگار با اندروید ۸ به بالا</span>
            </span>
          </div>
        </div>
      </section>

      {/* دانشگاه‌های تحت پوشش */}
      <section id="universities" className="py-16 sm:py-20 px-4 sm:px-6 relative border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* هدر بخش دانشگاه‌ها */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] text-xs font-bold border border-[#10b981]/30">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>پوشش یکپارچه دانشگاهی • نگارش ۲.۰.۰ تهران</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              سروستانی به گستره تهران
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              پلتفرم هوشمند سروستان با هدف تسهیل فرایندهای آموزشی، دسترسی مستقل به سامانه‌های بهستان و گلستان دانشگاه‌های برتر پایتخت را فراهم ساخته است.
            </p>
          </div>

          {/* کارت‌های دانشگاه‌های تحت پوشش */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                دانشگاه‌های تحت پوشش
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {toFaDigits(4)} دانشگاه فعال • {toFaDigits(2)} دانشگاه به زودی
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {UNIVERSITIES.map((uni, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-[#10b981]/50 transition-all flex items-center justify-between gap-3 text-right group shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <img
                        src={uni.logo}
                        alt={uni.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-[13px] font-black text-slate-900 truncate group-hover:text-[#10b981] transition-colors">
                        {uni.shortName}
                      </h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                        {uni.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] font-bold border shrink-0 ${uni.badgeClass}`}
                  >
                    {uni.status === 'active' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <span>{uni.statusText}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* امکانات کلیدی (چهارضلعی مینیمال) */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 border-t border-slate-200 bg-slate-50/70">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              امکانات کلیدی سروستان
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              طراحی‌شده برای برطرف کردن تمام دغدغه‌های روزمره دانشجویان در کار با سامانه آموزش
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* ۱. آفلاین و ویجت‌ها */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#10b981]/50 shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                کارکرد ۱۰۰٪ آفلاین و ویجت‌های صفحه اصلی
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                برنامه کلاسی و جزئیات دروس به صورت رمزگذاری‌شده روی حافظه دستگاه ذخیره می‌شوند. بدون نیاز به اتصال مجدد به بهستان یا اینترنت، برنامه و نمرات همیشه در دسترس است و ۳ ویجت تعاملی روی هوم‌اسکرین گوشی قرار می‌گیرد.
              </p>
            </div>

            {/* ۲. پشتیبانی کهاد */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#10b981]/50 shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                پشتیبانی کامل از دانشجویان کهاد (دورشته‌ای)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                سروستان تنها پلتفرمی است که دروس رشته اصلی و کهاد را به شکل کاملاً هوشمند تفکیک می‌کند تا دانشجویان دورشته‌ای هیچ تداخلی در ساعات کلاسی، امتحانات و محاسبات کارنامه مشاهده نکنند.
              </p>
            </div>

            {/* ۳. سکوت خودکار و یادآور سماد */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#10b981]/50 shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                سکوت خودکار سر کلاس (DND) و یادآور غذا
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                گوشی شما در ساعات کلاسی به طور خودکار سایلنت می‌شود و پس از پایان کلاس به حالت عادی بازمی‌گردد. همچنین اعلان یادآوری رزرو غذای هفته آینده سامانه سماد هر چهارشنبه ارسال می‌گردد.
              </p>
            </div>

            {/* ۴. چارت تعاملی و معدل‌ساز */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#10b981]/50 shadow-xs transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 grid place-items-center">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                چارت درسی تعاملی و محاسبه‌گر تحصیلی
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                گراف بصری پیش‌نیازی و هم‌نیازی دروس، تفکیک نمرات قطعی و موقت، محاسبه معدل کل، پیش‌بینی معدل ترم و تفکیک دقیق ریز بدهی شهریه با شفافیت کامل در دسترس شماست.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* شورای هماهنگی سروستان */}
      <section id="council" className="py-16 sm:py-20 px-4 sm:px-6 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] text-xs font-bold border border-[#10b981]/30">
              <Users className="w-3.5 h-3.5" />
              <span>همکاری بین‌دانشگاهی دانشجویان کشور</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              شورای هماهنگی سروستان
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              متشکل از دانشجویان دانشگاه‌های خواجه نصیرالدین طوسی، شهید بهشتی، علم و صنعت، تهران، صنعتی امیرکبیر و شهید رجایی جهت ارتقا، همفکری و گسترش زیست‌بوم سروستان
            </p>
          </div>

          {/* کارت برجسته دبیر شورا و توسعه‌دهنده */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200 hover:border-[#10b981]/50 transition-all flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-right shadow-xs">
            <img
              src="./mjb-avatar.png"
              alt="محمدجواد بخشی ایرج"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-emerald-500/50 shadow-md shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      محمدجواد بخشی ایرج
                    </h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#10b981] text-white shadow-xs">
                      دبیر شورا و توسعه‌دهنده
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    دانشگاه صنعتی خواجه نصیرالدین طوسی • مهندسی صنایع
                  </p>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
                  <a
                    href="https://github.com/mjb4khshi"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    title="پروفایل گیت‌هاب"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>گیت‌هاب</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/mjbakhshi/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#0a66c2] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    title="پروفایل لینکدین"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>لینکدین</span>
                  </a>
                </div>
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed max-w-2xl">
                بنیان‌گذار و طراح اکوسیستم سروستان و دیزاین‌سیستم Sarv UI؛ با هدف جایگزینی رابط‌های سنتی با تجربه‌ای مستقل، مدرن و شایسته دانشجویان کشور.
              </p>
            </div>
          </div>

          {/* گرید منظم ۶ عضو دیگر شورا */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-600">اعضای شورا:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COUNCIL_MEMBERS.map((member, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-all flex items-center justify-between gap-3 text-right shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-[13px] font-black text-slate-900 truncate">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {member.role}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-white text-slate-700 shrink-0 border border-slate-200 shadow-xs">
                    {member.uni}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* بخش دانلود اصلی */}
      <section id="download" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-slate-200 bg-slate-50/70">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#10b981] text-white grid place-items-center mx-auto shadow-lg shadow-[#10b981]/30">
            <Download className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            دریافت نسخه ۲ سروستان
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            نسخه پایدار و رسمی ۲.۰.۰ با کد نام تهران را مستقیماً دریافت کنید و از تجربه سریع و مدرن خدمات آموزشی لذت ببرید.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={LATEST_APK_URL}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#10b981]/30 hover:brightness-105 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>دانلود مستقیم sarvestan.apk</span>
            </a>

            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
            >
              <GithubIcon className="w-4 h-4" />
              <span>ریلیزهای گیت‌هاب</span>
            </a>
          </div>
        </div>
      </section>



      {/* فوتر مینیمال و تمیز */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div className="flex items-center gap-2.5">
            <img src="./sarv-logo.png" alt="لوگو" className="w-6 h-6 object-contain" />
            <span className="font-medium text-slate-700">پروژه آزاد سروستان • نگارش ۲ (تهران)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsExtensionModalOpen(true)}
              className="text-[#10b981] hover:underline font-bold cursor-pointer"
            >
              راهنمای آرشیوشده افزونه مرورگر
            </button>
            <span className="opacity-30">•</span>
            <a
              href="https://t.me/s4rvest4n"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              کانال تلگرام
            </a>
            <span className="opacity-30">•</span>
            <a
              href="https://github.com/mjb4khshi/sarvestan"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              گیت‌هاب
            </a>
            <span className="opacity-30">•</span>
            <span>
              طراحی و توسعه: <strong className="text-slate-900 font-mono font-bold">@mjb4khshi</strong>
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-3xl rounded-t-3xl sm:rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col text-right"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 shrink-0">
                <h3 className="text-base font-black text-slate-900">
                  راهنمای نصب افزونه مرورگر دسکتاپ (نسخه آرشیو)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsExtensionModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 grid place-items-center transition-colors cursor-pointer"
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
