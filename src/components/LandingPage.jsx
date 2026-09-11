import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  Calendar,
  GraduationCap,
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  ChevronDown,
  Layers,
  ArrowLeft,
  Moon,
  Sun,
  Palette,
  Terminal,
  Clock,
  Compass,
  FileCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function LandingPage({ onOpenDemo }) {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [previewTab, setPreviewTab] = useState('overview');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-base text-base-content font-sans antialiased overflow-x-hidden selection:bg-primary selection:text-primary-content">
      {/* =========================================================
          Ambient Background Glowing Orbs
          ========================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* =========================================================
          Top Sticky Navigation
          ========================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-base/80 border-b border-base-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-md shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-base-content">سَروستان</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  v1.2
                </span>
              </div>
              <p className="text-[11px] text-neutral hidden sm:block">
                افزونه هوشمند سامانه بهستان دانشگاه صنعتی خواجه نصیر
              </p>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral font-medium">
            <a href="#features" className="hover:text-primary transition-colors">قابلیت‌ها</a>
            <a href="#comparison" className="hover:text-primary transition-colors">مقایسه با بهستان</a>
            <a href="#preview" className="hover:text-primary transition-colors">پیش‌نمایش</a>
            <a href="#install" className="hover:text-primary transition-colors">راهنمای نصب</a>
            <a href="#faq" className="hover:text-primary transition-colors">سوالات متداول</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Selector */}
            <div className="relative group">
              <button
                className="btn btn-sm btn-ghost p-2 rounded-xl text-neutral hover:text-base-content border border-base-500/30"
                title="تغییر تم"
                onClick={() => {
                  const nextTheme = currentTheme.includes('dark') ? 'persian-light' : 'persian-dark';
                  setTheme(nextTheme);
                }}
              >
                {currentTheme.includes('dark') ? (
                  <Moon className="w-4 h-4 text-accent" />
                ) : (
                  <Sun className="w-4 h-4 text-warn" />
                )}
              </button>
            </div>

            {/* GitHub Repo */}
            <a
              href="https://github.com/mjb4khshi/sarvestan"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-ghost p-2 rounded-xl text-neutral hover:text-base-content border border-base-500/30 hidden sm:flex items-center gap-1.5"
              title="مخزن گیت‌هاب"
            >
              <GithubIcon className="w-4 h-4" />
              <span className="text-xs font-mono">GitHub</span>
            </a>

            {/* Live Demo Trigger */}
            <button
              onClick={onOpenDemo}
              className="btn btn-sm btn-outline border-primary/40 text-primary hover:bg-primary hover:text-primary-content rounded-xl font-bold flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>دموی آنلاین</span>
            </button>

            {/* Download Extension ZIP */}
            <a
              href="./sarvestan-extension.zip"
              download
              className="btn btn-sm btn-primary rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">دریافت افزونه</span>
              <span className="sm:hidden">دانلود</span>
            </a>
          </div>
        </div>
      </header>

      {/* =========================================================
          Hero Section
          ========================================================= */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-base-500/15 border border-base-500/30 text-xs sm:text-sm font-medium text-neutral mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>نسل نوین دستیار دانشجویی بر بستر مرورگر • Manifest V3</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-tight mb-6 text-base-content"
          >
            تجربه مدرن، سریع و زیبای بهستان؛{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              بدون فرم‌های خاکستری دهه هشتاد
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-neutral max-w-3xl mx-auto leading-relaxed mb-10"
          >
            <strong className="text-base-content font-bold">سروستان</strong> یک افزونه تحت وب و مرورگر است که به صورت مستقیم روی سامانه بهستان دانشگاه خواجه نصیرالدین طوسی می‌نشیند؛ کارنامه تحلیلی، برنامه هفتگی بصری، مدیریت شفاف مالی و پالت دسترسی سریع را با دیزاین‌سیستم اختصاصی <strong className="text-primary font-bold">سَرو (Sarv UI)</strong> در اختیارتان می‌گذارد.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <a
              href="./sarvestan-extension.zip"
              download
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary text-primary-content font-bold text-base shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
            >
              <Download className="w-5 h-5" />
              <span>دانلود رایگان افزونه کروم / مرورگرها</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-mono">ZIP</span>
            </a>

            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-base-500/15 hover:bg-base-500/25 border border-base-500/30 text-base-content font-bold text-base hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
            >
              <Eye className="w-5 h-5 text-accent" />
              <span>مشاهده پیش‌نمایش زنده (دموی آنلاین)</span>
            </button>
          </motion.div>

          {/* Quick Pillars Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-base-500/20 text-xs sm:text-sm text-neutral"
          >
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-success" />
              <span>پردازش ۱۰۰٪ محلی در مرورگر</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span>بدون قطعی و سرور میانی</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-info" />
              <span>سوییچ امن درگاه شاپرک</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <GithubIcon className="w-4 h-4 text-primary" />
              <span>کاملاً متن‌باز و آزاد (MIT)</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          Interactive Product Showcase (Mockup)
          ========================================================= */}
      <section id="preview" className="py-12 sm:py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-accent px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 mb-3 inline-block shadow-sm">
              پیش‌نمایش تعاملی
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mb-3 text-base-content">
              نگاهی به داخل <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">داشبورد سروستان</span>
            </h2>
            <p className="text-sm sm:text-base text-neutral max-w-2xl mx-auto">
              رابط کاربری مدرن با تم تاریک چشم‌نواز، نمودارهای زنده و دسترسی فوری به تمام بخش‌های دانشگاه
            </p>
          </div>

          {/* Browser Window Frame */}
          <div className="sarv-card overflow-hidden border border-base-500/40 shadow-2xl rounded-2xl bg-base">
            {/* Window Header */}
            <div className="px-4 py-3 bg-base-500/20 border-b border-base-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-danger/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-warn/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-success/80 inline-block" />
              </div>
              <div className="flex-1 max-w-md mx-auto bg-base-500/20 border border-base-500/30 rounded-lg px-3 py-1 text-xs text-neutral font-mono text-center truncate">
                chrome-extension://sarvestan/index.html
              </div>
              <button
                onClick={onOpenDemo}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>ورود به دمو</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Showcase Navigation Bar inside Mockup */}
            <div className="flex border-b border-base-500/30 bg-base-500/10 px-4 py-2 overflow-x-auto gap-2">
              <button
                onClick={() => setPreviewTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  previewTab === 'overview'
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>نمای کلی و معدل</span>
              </button>
              <button
                onClick={() => setPreviewTab('schedule')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  previewTab === 'schedule'
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>برنامه هفتگی ویژوال</span>
              </button>
              <button
                onClick={() => setPreviewTab('grades')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  previewTab === 'grades'
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>کارنامه و ریزنمرات</span>
              </button>
              <button
                onClick={() => setPreviewTab('finance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  previewTab === 'finance'
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>امور مالی و پرداخت شاپرک</span>
              </button>
            </div>

            {/* Preview Window Content */}
            <div className="p-4 sm:p-6 bg-base/50 min-h-[340px]">
              <AnimatePresence mode="wait">
                {previewTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="sarv-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-neutral">معدل کل دانشجو</span>
                        <span className="text-xs font-bold text-success bg-success/15 px-2 py-0.5 rounded-md">رتبه اول</span>
                      </div>
                      <div className="text-3xl font-black text-primary font-mono mb-1">۱۸٫۷۵</div>
                      <p className="text-[11px] text-neutral">روند صعودی در ۴ نیم‌سال گذشته</p>
                    </div>

                    <div className="sarv-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-neutral">واحدهای گذرانده</span>
                        <span className="text-xs text-primary font-mono font-bold">۸۲ / ۱۴۰</span>
                      </div>
                      <div className="w-full bg-base-500/20 rounded-full h-2.5 mb-2 overflow-hidden">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '58%' }} />
                      </div>
                      <p className="text-[11px] text-neutral">۵۸٪ از کل چارت دوره کارشناسی</p>
                    </div>

                    <div className="sarv-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-neutral">وضعیت مالی جاری</span>
                        <span className="text-xs text-info font-bold">بدون بدهی مسدودکننده</span>
                      </div>
                      <div className="text-xl font-bold text-base-content font-mono mb-1">تسویه کامل</div>
                      <p className="text-[11px] text-neutral">آماده برای ثبت‌نام و انتخاب واحد</p>
                    </div>

                    <div className="md:col-span-3 sarv-card p-4 bg-gradient-to-r from-primary/10 via-base to-accent/10">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-base-content">کلاس بعدی: طراحی الگوریتم</div>
                            <div className="text-xs text-neutral">شنبه ۱۰:۳۰ الی ۱۲:۰۰ • کلاس ۳۰۴ دانشکده برق و کامپیوتر</div>
                          </div>
                        </div>
                        <button
                          onClick={onOpenDemo}
                          className="btn btn-sm btn-primary rounded-xl font-bold self-stretch sm:self-auto"
                        >
                          تست تعاملی کامل
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {previewTab === 'schedule' && (
                  <motion.div
                    key="schedule"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral pb-2 border-b border-base-500/20">
                      <span>نمای ماتریس هفتگی دروس ترم جاری (۴۰۴۱)</span>
                      <span className="font-mono text-primary font-bold">۱۸ واحد اخذ شده</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sarv-chip sarv-chip-primary p-3">
                        <div className="text-xs font-bold text-primary">شبکه‌های کامپیوتری</div>
                        <div className="text-[11px] text-neutral mt-1">شنبه و دوشنبه ۰۹:۰۰ - ۱۰:۳۰</div>
                        <div className="text-[10px] text-base-content/60 mt-1">دکتر فراهانی • ۳ واحد</div>
                      </div>
                      <div className="sarv-chip sarv-chip-success p-3">
                        <div className="text-xs font-bold text-success">سیستم‌های عامل</div>
                        <div className="text-[11px] text-neutral mt-1">یکشنبه و سه‌شنبه ۱۰:۳۰ - ۱۲:۰۰</div>
                        <div className="text-[10px] text-base-content/60 mt-1">دکتر احمدی • ۳ واحد</div>
                      </div>
                      <div className="sarv-chip sarv-chip-accent p-3">
                        <div className="text-xs font-bold text-accent">آزمایشگاه پایگاه داده</div>
                        <div className="text-[11px] text-neutral mt-1">چهارشنبه ۱۳:۳۰ - ۱۵:۳۰</div>
                        <div className="text-[10px] text-base-content/60 mt-1">مهندس صالحی • ۱ واحد</div>
                      </div>
                    </div>
                    <div className="text-center pt-2">
                      <button onClick={onOpenDemo} className="text-xs text-primary font-bold hover:underline">
                        مشاهده جدول کامل ساعات و تقویم امتحانات در دمو →
                      </button>
                    </div>
                  </motion.div>
                )}

                {previewTab === 'grades' && (
                  <motion.div
                    key="grades"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-2"
                  >
                    <div className="sarv-card p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold">طراحی الگوریتم</div>
                        <div className="text-[10px] text-neutral">تخصصی • ۳ واحد</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success font-bold">پاس شده</span>
                        <span className="text-sm font-black font-mono text-primary">۱۹٫۵۰</span>
                      </div>
                    </div>
                    <div className="sarv-card p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold">پایگاه داده‌ها</div>
                        <div className="text-[10px] text-neutral">تخصصی • ۳ واحد</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success font-bold">پاس شده</span>
                        <span className="text-sm font-black font-mono text-primary">۱۸٫۰۰</span>
                      </div>
                    </div>
                    <div className="sarv-card p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold">هوش مصنوعی و یادگیری ماشین</div>
                        <div className="text-[10px] text-neutral">اختیاری تخصصی • ۳ واحد</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-warn/15 text-warn font-bold">نمره موقت</span>
                        <span className="text-sm font-black font-mono text-warn">۱۷٫۲۵</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {previewTab === 'finance' && (
                  <motion.div
                    key="finance"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3"
                  >
                    <div className="sarv-card p-4 border border-info/30 bg-info/5">
                      <div className="flex items-center gap-2 text-info text-xs font-bold mb-1">
                        <ShieldCheck className="w-4 h-4" />
                        <span>سوییچ امن و هوشمند به فرم بومی بهستان (۲۷۵۷۰)</span>
                      </div>
                      <p className="text-xs text-neutral leading-relaxed">
                        هنگام پرداخت شهریه، سروستان مستقیماً فرم اصیل شاپرک بانک‌های سامان، تجارت و ملت را فراخوانی می‌کند تا هیچ خطایی در توکن‌های امنیتی رخ ندهد.
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-3 sarv-card">
                      <span className="text-xs text-neutral">مانده شهریه متغیر نیم‌سال:</span>
                      <span className="text-sm font-bold font-mono text-base-content">۰ ریال (تسویه شده)</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          Comparison: Traditional Behestan vs Sarvestan
          ========================================================= */}
      <section id="comparison" className="py-16 sm:py-24 bg-base-500/10 border-y border-base-500/20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-info px-3.5 py-1.5 rounded-full bg-info/10 border border-info/25 mb-3 inline-block shadow-sm">
              بررسی تفاوت‌ها
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mb-4 text-base-content">
              چرا باید از <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">سروستان</span> استفاده کنیم؟
            </h2>
            <p className="text-sm sm:text-base text-neutral max-w-2xl mx-auto">
              مقایسه رو در رو بین تجربه سنتی گلستان/بهستان با افزونه ارگونومیک سروستان
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Old Behestan Box */}
            <div className="sarv-card p-6 sm:p-8 border-danger/30 bg-danger/5 rounded-2xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-danger/20">
                <div className="w-10 h-10 rounded-xl bg-danger/20 text-danger flex items-center justify-center font-bold">
                  ❌
                </div>
                <div>
                  <h3 className="font-black text-lg text-danger">سامانه بهستان سنتی</h3>
                  <p className="text-xs text-neutral">طراحی جدول‌بندی فریم‌های دهه هشتاد</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-neutral">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <span>رابط کاربری غیرریسپانسیو؛ کار با گوشی موبایل و تبلت عملاً غیرممکن است.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <span>رفرش‌های مداوم کل صفحه و انقضای نشست در حساس‌ترین زمان‌ها (مثل انتخاب واحد).</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <span>فقدان تم تاریک؛ نور سفید خیره‌کننده و خستگی مفرط چشم‌ها در بررسی طولانی کارنامه.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <span>منوهای تودرتو و لزوم حفظ کردن کدهای فرم (مانند ۲۷۲، ۱۲۵، ۲۵۶ و...) برای دسترسی.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <span>عدم وجود نمودارهای تحلیلی، پیش‌بینی معدل و بررسی وضعیت چارت تحصیلی.</span>
                </li>
              </ul>
            </div>

            {/* Modern Sarvestan Box */}
            <div className="sarv-card p-6 sm:p-8 border-success/40 bg-success/5 rounded-2xl shadow-xl shadow-success/5">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-success/20">
                <div className="w-10 h-10 rounded-xl bg-success/20 text-success flex items-center justify-center font-bold">
                  ✅
                </div>
                <div>
                  <h3 className="font-black text-lg text-success">افزونه مدرن سروستان</h3>
                  <p className="text-xs text-neutral">دیزاین‌سیستم اختصاصی سَرو (Sarv UI) و فونت آراد</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-base-content">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>طراحی مدرن و کاملاً واکنش‌گرا (Responsive)؛ بهینه‌سازی‌شده برای دسکتاپ و لپ‌تاپ.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>معماری تک‌صفحه‌ای (SPA) بدون رفرش، با بارگذاری آنی اطلاعات از حافظه مرورگر.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>پوسته‌های متنوع ایرانی شامل تم دارک چشم‌نواز با رنگ‌های بهینه‌سازی‌شده ارگونومیک.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>پالت جستجوی فوری (Command Palette با Ctrl + K) برای رفتن به هر فرم یا درس در یک ثانیه.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>چارت‌های آماری، تقویم هفتگی کلاس‌ها و محاسبه آنی وضعیت فارغ‌التحصیلی.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          Key Features Bento Grid
          ========================================================= */}
      <section id="features" className="py-16 sm:py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-primary px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 mb-3 inline-block shadow-sm">
              ویژگی‌های کلیدی
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mt-3 mb-4 text-base-content">
              هر آنچه یک دانشجوی خواجه نصیر <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">نیاز دارد</span>
            </h2>
            <p className="text-sm sm:text-base text-neutral max-w-2xl mx-auto">
              ابزارهای هوشمند توسعه‌یافته بر پایه بررسی رفتار و نیازهای واقعی دانشجویان
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">تحلیل جامع کارنامه و معدل</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                مشاهده کارنامه کلیه ترم‌ها، تفکیک نمرات موقت و قطعی، محاسبه معدل کل و معدل الف به تفکیک دروس اختصاصی، عمومی و پایه.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">برنامه هفتگی ویژوال و تقویم</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                تقویم رنگی هوشمند ساعات کلاسی بدون تداخل، همراه با تاریخ و ساعت امتحانات پایان‌ترم و قابلیت پرینت مستقیم جدول.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-info/15 text-info flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">تسویه‌حساب و پرداخت امن شاپرک</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                تفکیک شفاف بدهی و بستانکاری شهریه با سوییچ هوشمند به فرم امن بومی ۲۷۵۷۰ بهستان برای تضمین عدم ابطال توکن‌های بانکی.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-warn/15 text-warn flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">پالت فرمان سریع (Ctrl + K)</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                دسترسی فوری مانند Raycast و VS Code؛ جستجوی نام اساتید، کد دروس، فرم‌های اداری و عملیات تنها با چند کلید کیبورد.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-success/15 text-success flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">حفظ ۱۰۰٪ امنیت و حریم خصوصی</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                هیچ سرور واسطی وجود ندارد. کلمه عبور شما ذخیره نمی‌شود و تمام محاسبات روی نشست مرورگر شما در لپ‌تاپ خودتان انجام می‌شود.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">دیزاین‌سیستم ایرانی سَرو (Sarv UI)</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                طراحی چشم‌نواز با تایپوگرافی متغیر آراد، حاشیه‌های شیشه‌ای (Glassmorphism)، انیمیشن‌های نرم و هماهنگی کامل با فرهنگ بومی.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          Installation Guide (3 Simple Steps)
          ========================================================= */}
      <section id="install" className="py-16 sm:py-24 bg-base-500/10 border-t border-base-500/20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-success px-3.5 py-1.5 rounded-full bg-success/10 border border-success/25 mb-3 inline-block shadow-sm">
              راهنمای راه‌اندازی
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mt-3 mb-4 text-base-content">
              نصب آسان در <span className="bg-gradient-to-r from-success via-info to-success bg-clip-text text-transparent">کمتر از ۱ دقیقه</span>
            </h2>
            <p className="text-sm sm:text-base text-neutral max-w-xl mx-auto">
              بدون نیاز به تنظیمات پیچیده؛ افزونه با تمام مرورگرهای مبتنی بر Chromium (کروم، اج، بریو و...) سازگار است.
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                ۱
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-base text-base-content">دانلود فایل افزونه و استخراج (Unzip)</h3>
                  <a
                    href="./sarvestan-extension.zip"
                    download
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود مستقیم</span>
                  </a>
                </div>
                <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                  فایل فشرده <code className="bg-base-500/30 px-1.5 py-0.5 rounded text-primary font-mono text-xs">sarvestan-extension.zip</code> را از لینک بالا دانلود کرده و آن را درون یک پوشه مشخص در کامپیوتر خود Extract کنید.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent text-accent-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-accent/20">
                ۲
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1 text-base-content">باز کردن صفحه مدیریت افزونه‌ها در مرورگر</h3>
                <p className="text-xs sm:text-sm text-neutral leading-relaxed mb-2">
                  مرورگر خود (Chrome, Edge, Brave, Opera) را باز کرده و در نوار آدرس عبارت زیر را تایپ و اینتر بزنید:
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-500/20 border border-base-500/30 font-mono text-xs text-base-content">
                  <Terminal className="w-3.5 h-3.5 text-neutral" />
                  <span>chrome://extensions</span>
                </div>
                <p className="text-xs text-neutral mt-2">
                  سپس در گوشه بالا سمت راست، کلید <strong className="text-base-content font-bold">Developer mode</strong> (حالت توسعه‌دهنده) را روشن کنید.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-success text-success-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-success/20">
                ۳
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1 text-base-content">بارگذاری در حالت توسعه (Load unpacked)</h3>
                <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                  روی دکمه <strong className="text-base-content font-bold">Load unpacked</strong> در بالای صفحه افزونه‌ها کلیک کنید و فولدری که در گام اول استخراج کردید را انتخاب کنید. تبریک! افزونه سروستان نصب شد و با ورود به بهستان فعال می‌شود.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <p className="text-xs sm:text-sm text-primary font-medium">
              💡 برای تست و بررسی عملکرد داشبورد قبل از نصب، می‌توانید از دکمه «دموی آنلاین» استفاده نمایید.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ Accordion
          ========================================================= */}
      <section id="faq" className="py-16 sm:py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-warn px-3.5 py-1.5 rounded-full bg-warn/10 border border-warn/25 mb-3 inline-block shadow-sm">
              پرسش و پاسخ
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mb-3 text-base-content">
              پرسش‌های <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">متداول</span>
            </h2>
            <p className="text-sm sm:text-base text-neutral max-w-xl mx-auto">
              پاسخ به سوالات متداول درباره نحوه کار، امنیت و سازگاری سروستان
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'آیا افزونه سروستان رسمی است و زیر نظر مدیریت دانشگاه است؟',
                a: 'خیر، سروستان یک پروژه دانشجویی مستقل، داوطلبانه و متن‌باز (Open Source) است. این افزونه تغییری در داده‌ها یا سرورهای دانشگاه نمی‌دهد و صرفاً نحوه نمایش اطلاعات در مرورگر را مدرن و راحت‌تر می‌کند.'
              },
              {
                q: 'آیا اطلاعات کاربری یا کلمه عبور من در سروری ذخیره می‌شود؟',
                a: 'به هیچ وجه. سروستان هیچ‌گونه سرور بک‌اند، پایگاه داده خارجی یا ترکر ندارد. این افزونه نیازی به وارد کردن کلمه عبور ندارد و مستقیماً از نشست فعال مرورگر شما به صورت لوکال استفاده می‌کند.'
              },
              {
                q: 'آیا پرداخت شهریه از طریق سروستان امن است؟',
                a: 'بله کاملاً. هنگام کلیک بر روی گزینه پرداخت، سیستم فوراً به نمای بومی و اصلی فرم ۲۷۵۷۰ سامانه بهستان سوییچ می‌کند تا توکن شاپرک بانک‌های سامان، تجارت و ملت بدون کوچک‌ترین ریسکی مستقیماً با پروتکل رسمی بانک صادر شود.'
              },
              {
                q: 'سروستان روی چه مرورگرهایی کار می‌کند؟',
                a: 'تمامی مرورگرهای مبتنی بر هسته کرومیوم شامل Google Chrome, Microsoft Edge, Brave Browser, Opera و Vivaldi به صورت کامل پشتیبانی می‌شوند.'
              },
              {
                q: 'آیا این افزونه برای سایر دانشگاه‌هایی که از سیستم گلستان استفاده می‌کنند هم کاربرد دارد؟',
                a: 'معماری هسته سروستان برای پروتکل گلستان طراحی شده است، اما شاخص‌ها و فرم‌ها در نسخه کنونی به صورت اختصاصی برای دانشگاه صنعتی خواجه نصیرالدین طوسی (سامانه بهستان) پیکربندی شده‌اند.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="sarv-card rounded-2xl overflow-hidden border border-base-500/30">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-base-content hover:text-primary hover:bg-base-500/10 transition-colors"
                >
                  <span className="text-base-content font-bold flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral transition-transform duration-200 shrink-0 ${
                      openFaq === idx ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-base-content/85 leading-relaxed border-t border-base-500/20 bg-base-500/5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          Footer
          ========================================================= */}
      <footer className="border-t border-base-500/30 py-12 bg-base-500/10 text-xs text-neutral relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-base-content text-sm">پروژه آزاد سروستان (بهستان ۲٫۰)</div>
              <div>طراحی‌شده با دیزاین‌سیستم <a href="https://github.com/mjb4khshi/sarv-ui" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">سَرو (Sarv UI)</a></div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-neutral">
            <a
              href="https://github.com/mjb4khshi/sarvestan"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <GithubIcon className="w-4 h-4" />
              <span>مخزن گیت‌هاب</span>
            </a>
            <span className="opacity-30">•</span>
            <button
              onClick={onOpenDemo}
              className="hover:text-primary transition-colors"
            >
              دموی آنلاین
            </button>
            <span className="opacity-30">•</span>
            <a
              href="./sarvestan-extension.zip"
              download
              className="hover:text-primary transition-colors"
            >
              دانلود مستقیم (.zip)
            </a>
            <span className="opacity-30">•</span>
            <span>
              توسعه داده شده توسط{' '}
              <a
                href="https://github.com/mjb4khshi"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-bold"
              >
                محمدجواد بخشی ایرج
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
