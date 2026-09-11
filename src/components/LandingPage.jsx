import React, { useState, useRef, useEffect } from 'react';
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
  FileCheck,
  Heart,
  Maximize2,
  Check,
  BookOpen
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
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showcaseThemeIndex, setShowcaseThemeIndex] = useState(0);
  const showcaseRef = useRef(null);

  const showcaseThemes = [
    { id: 'persian-dark', name: 'پرشین دارک (تیره اصیل)', color: '#0066a4', mode: 'dark', icon: '🌙' },
    { id: 'cyberpunk', name: 'سایبرپانک نئون', color: '#00f0ff', mode: 'dark', icon: '⚡' },
    { id: 'sunset', name: 'غروب کویر (روشن)', color: '#ff5e36', mode: 'light', icon: '🌅' },
    { id: 'tokyo-midnight', name: 'توکیو نیمه‌شب', color: '#8b5cf6', mode: 'dark', icon: '🌃' },
    { id: 'emerald', name: 'زمرد کهنسال', color: '#10b981', mode: 'dark', icon: '🌲' },
    { id: 'persian-light', name: 'پرشین لایت (سفید پاکیزه)', color: '#0066a4', mode: 'light', icon: '☀️' },
    { id: 'royal-purple', name: 'ارغوانی سلطنتی', color: '#a855f7', mode: 'dark', icon: '🔮' },
    { id: 'nordic', name: 'یخسار نوردیک', color: '#0284c7', mode: 'light', icon: '❄️' },
  ];

  const currentShowcaseTheme = showcaseThemes[showcaseThemeIndex] || showcaseThemes[0];

  useEffect(() => {
    const handleScroll = () => {
      if (!showcaseRef.current) return;
      const rect = showcaseRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const totalScrollableDistance = rect.height - windowHeight;
      if (totalScrollableDistance <= 0) return;
      
      // Pinning begins when rect.top <= 80
      const scrolledSoFar = 80 - rect.top;
      const progress = Math.max(0, Math.min(1, scrolledSoFar / totalScrollableDistance));
      
      const newIndex = Math.min(showcaseThemes.length - 1, Math.floor(progress * showcaseThemes.length));
      setShowcaseThemeIndex(newIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showcaseThemes.length]);

  const scrollToSection = (e, targetId) => {
    if (e) e.preventDefault();
    const id = targetId.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -75;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

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
                سامانه هوشمند بهستان • در حال توسعه برای تمام دانشگاه‌های مبتنی بر بهستان
              </p>
            </div>
          </div>

          {/* Nav Links (Desktop) with Smooth Scrolling */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral font-medium">
            <a href="#features" onClick={(e) => scrollToSection(e, '#features')} className="hover:text-primary transition-colors cursor-pointer">قابلیت‌ها</a>
            <a href="#comparison" onClick={(e) => scrollToSection(e, '#comparison')} className="hover:text-primary transition-colors cursor-pointer">مقایسه با بهستان</a>
            <a href="#preview" onClick={(e) => scrollToSection(e, '#preview')} className="hover:text-primary transition-colors cursor-pointer">پیش‌نمایش و تم‌ها</a>
            <a href="#install" onClick={(e) => scrollToSection(e, '#install')} className="hover:text-primary transition-colors cursor-pointer">راهنمای نصب</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, '#faq')} className="hover:text-primary transition-colors cursor-pointer">سوالات متداول</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Lead Developer Spotlight Badge */}
            <a
              href="https://github.com/mjb4khshi"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-xs font-bold transition-all shadow-sm group"
              title="پروفایل گیت‌هاب محمدجواد بخشی (توسعه‌دهنده و طراح اصلی)"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-neutral font-normal text-[11px]">توسعه‌دهنده اصلی:</span>
              <span className="text-base-content font-black group-hover:text-primary transition-colors">محمدجواد بخشی</span>
            </a>

            {/* Theme Selector */}
            <div className="relative group">
              <button
                className="btn btn-sm btn-ghost p-2 rounded-xl text-neutral hover:text-base-content border border-base-500/30"
                title="تغییر تم سایت"
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
            <span>نسل نوین دستیار بهستان ۲.۰ • طراحی و توسعه مستقل توسط <strong className="text-base-content font-bold">محمدجواد بخشی ایرج</strong></span>
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
            <strong className="text-base-content font-bold">سروستان</strong> افزونه‌ای مستقل و مدرن است که توسط <a href="https://github.com/mjb4khshi" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">محمدجواد بخشی ایرج</a> مهندسی شده تا مستقیماً روی سامانه بهستان بنشیند؛ کارنامه تحلیلی، برنامه هفتگی بصری، مدیریت شفاف مالی و پالت فرمان سریع را با دیزاین‌سیستم اختصاصی <strong className="text-primary font-bold">سَرو (Sarv UI)</strong> در اختیارتان می‌گذارد.
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

          {/* Real Dashboard Screenshot Window in Hero */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-12 max-w-5xl mx-auto"
          >
            <div className="sarv-card overflow-hidden border border-base-500/40 shadow-2xl rounded-2xl bg-base">
              {/* Window Bar */}
              <div className="px-4 py-3 bg-base-500/20 border-b border-base-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-danger/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-warn/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-success/80 inline-block" />
                </div>
                <div className="flex-1 max-w-md mx-auto bg-base-500/25 border border-base-500/30 rounded-lg px-3 py-1 text-xs text-neutral font-mono text-center truncate flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-success inline-block" />
                  <span>chrome-extension://sarvestan/dashboard • سامانه هوشمند بهستان</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsZoomOpen(true)}
                    className="btn btn-xs btn-ghost text-neutral hover:text-base-content flex items-center gap-1 text-[11px]"
                    title="بزرگ‌نمایی تصویر"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">بزرگ‌نمایی</span>
                  </button>
                  <button
                    onClick={onOpenDemo}
                    className="btn btn-xs btn-primary font-bold flex items-center gap-1 text-[11px]"
                  >
                    <span>ورود به دمو</span>
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Real Dashboard Screenshot Display */}
              <div className="relative group cursor-pointer overflow-hidden bg-base-500/10" onClick={() => setIsZoomOpen(true)}>
                <img
                  src="./dashboard-screenshot.png"
                  alt="محیط واقعی افزونه سروستان در سامانه بهستان دانشگاه صنعتی خواجه نصیر"
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="px-4 py-2 rounded-xl bg-base/90 text-base-content text-xs font-bold shadow-xl border border-base-500/30 flex items-center gap-2 backdrop-blur-md">
                    <Maximize2 className="w-4 h-4 text-primary" />
                    کلیک کنید برای بزرگ‌نمایی با کیفیت اصلی
                  </span>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-base-500/10 border-t border-base-500/20 text-xs text-neutral flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />
                  <span className="font-medium text-base-content/90">تصویر واقعی محیط افزونه بر روی سامانه بهستان دانشگاه خواجه نصیرالدین طوسی</span>
                </div>
                <span className="text-[11px] text-neutral/70">تطبیق خودکار با نشست مرورگر بدون نیاز به رمز عبور</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lightbox Modal for Full Screenshot Zoom */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomOpen(false)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl w-full max-h-[90vh] bg-base rounded-2xl overflow-hidden shadow-2xl border border-base-500/40 flex flex-col"
            >
              <div className="p-4 bg-base-500/20 border-b border-base-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-base-content">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>اسکرین‌شات محیط زنده افزونه سروستان در سامانه بهستان</span>
                </div>
                <button
                  onClick={() => setIsZoomOpen(false)}
                  className="w-8 h-8 rounded-lg bg-base-500/20 hover:bg-danger hover:text-white flex items-center justify-center text-neutral transition-colors font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto p-2 sm:p-4 max-h-[80vh] flex items-center justify-center bg-base-500/5">
                <img
                  src="./dashboard-screenshot.png"
                  alt="محیط واقعی افزونه سروستان"
                  className="max-w-full h-auto rounded-xl shadow-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          Interactive Multi-Theme Product Showcase (Sticky Pinned Scroll)
          ========================================================= */}
      <section id="preview" ref={showcaseRef} className="relative z-10" style={{ minHeight: '260vh' }}>
        <div className="sticky top-20 z-20 py-4 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-accent px-3.5 py-1 rounded-full bg-accent/10 border border-accent/25 mb-2 inline-block shadow-sm">
              پیش‌نمایش زنده چندپوسته (پین‌شده هنگام اسکرول)
            </span>
            <h2 className="text-xl sm:text-3xl font-black mb-1.5 text-base-content">
              تنوع چشم‌نواز با <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">پوسته‌های زنده سَرو (Sarv UI)</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral max-w-xl mx-auto">
              صفحه حین اسکرول ثابت می‌ماند و تم‌ها یکی‌یکی عوض می‌شوند؛ یا مستقیماً روی هر پوسته کلیک کنید
            </p>
          </div>

          {/* Theme Switcher Ribbon with Progress Indicator */}
          <div className="mb-4 p-2.5 sm:p-3 sarv-card rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full animate-ping inline-block" style={{ backgroundColor: currentShowcaseTheme.color }} />
              <span className="text-neutral text-[11px]">پوسته فعال:</span>
              <strong className="text-base-content font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-500/25 border border-base-500/30">
                <span>{currentShowcaseTheme.icon}</span>
                <span>{currentShowcaseTheme.name}</span>
              </strong>
              <span className="text-[10px] text-neutral/70 font-mono hidden sm:inline">
                ({showcaseThemeIndex + 1} از {showcaseThemes.length})
              </span>
            </div>

            {/* Quick theme click pills */}
            <div className="flex flex-wrap items-center justify-center gap-1">
              {showcaseThemes.map((st, idx) => (
                <button
                  key={st.id}
                  onClick={() => setShowcaseThemeIndex(idx)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showcaseThemeIndex === idx
                      ? 'bg-primary text-primary-content shadow-sm scale-105 font-bold'
                      : 'bg-base-500/15 text-neutral hover:text-base-content hover:bg-base-500/25'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: st.color }} />
                  <span>{st.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Browser Window Frame with active scroll theme */}
          <div
            datatheme={currentShowcaseTheme.id}
            data-theme={currentShowcaseTheme.id}
            data-theme-mode={currentShowcaseTheme.mode}
            className="sarv-card overflow-hidden border border-base-500/40 shadow-2xl rounded-2xl transition-all duration-500"
            style={{
              backgroundColor: 'var(--theme-color-base, #0a0a0c)',
              color: 'var(--theme-color-base-content, #ffffff)',
            }}
          >
            {/* Window Header */}
            <div className="px-4 py-2.5 bg-base-500/20 border-b border-base-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-danger/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-warn/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-success/80 inline-block" />
              </div>
              <div className="flex-1 max-w-md mx-auto bg-base-500/20 border border-base-500/30 rounded-lg px-3 py-0.5 text-xs text-neutral font-mono text-center truncate">
                chrome-extension://sarvestan/dashboard?theme={currentShowcaseTheme.id}
              </div>
              <button
                onClick={onOpenDemo}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>ورود به دمو</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Authentic Behestan Dashboard Replica with Theme Support */}
            <div className="p-3 sm:p-4 bg-base/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 text-right font-sans">
                {/* Right Sidebar: Behestan Navigation (lg:col-span-4) */}
                <div className="lg:col-span-4 space-y-2.5 order-last lg:order-first">
                  <div className="sarv-card p-3 border border-base-500/30">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-base-500/20">
                      <span className="text-xs font-bold text-base-content">ناوبری خدمات بهستان</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/25">سروستان ۲.۰</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-primary text-primary-content font-bold shadow-sm">
                        <Compass className="w-4 h-4 shrink-0" />
                        <div className="truncate">
                          <div>میز کار و وضعیت جامع</div>
                          <div className="text-[10px] opacity-80 font-normal">خلاصه تحصیلی، اعلانات و کارت دانشجو</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-xl text-neutral hover:text-base-content hover:bg-base-500/15 transition-colors">
                        <GraduationCap className="w-4 h-4 shrink-0 text-primary" />
                        <div className="truncate">
                          <div className="font-bold text-base-content">کارنامه و ریز نمرات</div>
                          <div className="text-[10px] text-neutral">نمرات نهایی، معدل کل و اعتراض</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-xl text-neutral hover:text-base-content hover:bg-base-500/15 transition-colors">
                        <Calendar className="w-4 h-4 shrink-0 text-accent" />
                        <div className="truncate">
                          <div className="font-bold text-base-content">برنامه هفتگی و آزمون‌ها</div>
                          <div className="text-[10px] text-neutral">برنامه کلاسی و کارت ورود به جلسه</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-xl text-neutral hover:text-base-content hover:bg-base-500/15 transition-colors">
                        <CreditCard className="w-4 h-4 shrink-0 text-info" />
                        <div className="truncate">
                          <div className="font-bold text-base-content">امور مالی و پرداخت شهریه</div>
                          <div className="text-[10px] text-neutral">شهریه ثابت، متغیر و پرداخت شتاب</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-xl text-neutral hover:text-base-content hover:bg-base-500/15 transition-colors">
                        <BookOpen className="w-4 h-4 shrink-0 text-warn" />
                        <div className="truncate">
                          <div className="font-bold text-base-content">چارت و وضعیت دروس</div>
                          <div className="text-[10px] text-neutral">دروس پایه، تخصصی، عمومی و پیش‌نیاز</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Degree Progress Widget inside Sidebar */}
                  <div className="sarv-card p-3 border border-base-500/30">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-base-content">پیشرفت کل فارغ‌التحصیلی</span>
                      <span className="text-[11px] font-mono text-primary font-bold">۸۲ از ۱۴۰ واحد</span>
                    </div>
                    <div className="w-full bg-base-500/30 rounded-full h-2 mb-2 overflow-hidden">
                      <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: '58%' }} />
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-base-500/20 text-xs">
                      <span className="text-neutral">معدل کل دانشجو:</span>
                      <span className="font-mono font-black text-primary text-sm">۱۸٫۷۵</span>
                    </div>
                  </div>
                </div>

                {/* Main Content Area (lg:col-span-8) */}
                <div className="lg:col-span-8 space-y-2.5">
                  {/* Student Profile Card */}
                  <div className="sarv-card p-3.5 border border-base-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary text-primary-content font-black text-lg flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                        س
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm sm:text-base text-base-content">دانشجوی میهمان</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 font-medium">
                            متصل به بهستان
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral mt-0.5">
                          دانشجو • مهندسی کامپیوتر • دانشگاه صنعتی خواجه نصیر
                        </p>
                      </div>
                    </div>
                    <button className="btn btn-xs btn-primary rounded-xl font-bold flex items-center gap-1.5 self-end sm:self-auto">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>گواهی اشتغال به تحصیل</span>
                    </button>
                  </div>

                  {/* 4 Stat Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="sarv-card p-2.5 border border-base-500/30">
                      <div className="flex items-center justify-between text-[11px] text-neutral mb-1">
                        <span>معدل کل</span>
                        <GraduationCap className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="text-lg font-black font-mono text-primary">۱۸٫۷۵</div>
                      <div className="text-[10px] text-success font-medium mt-0.5">رتبه برتر ترم</div>
                    </div>
                    <div className="sarv-card p-2.5 border border-base-500/30">
                      <div className="flex items-center justify-between text-[11px] text-neutral mb-1">
                        <span>واحدهای گذرانده</span>
                        <BookOpen className="w-3.5 h-3.5 text-info" />
                      </div>
                      <div className="text-lg font-black font-mono text-base-content">۸۲</div>
                      <div className="text-[10px] text-neutral mt-0.5">از ۱۴۰ واحد چارت</div>
                    </div>
                    <div className="sarv-card p-2.5 border border-base-500/30">
                      <div className="flex items-center justify-between text-[11px] text-neutral mb-1">
                        <span>بدهی شهریه</span>
                        <CreditCard className="w-3.5 h-3.5 text-success" />
                      </div>
                      <div className="text-lg font-black font-mono text-success">۰ تومان</div>
                      <div className="text-[10px] text-neutral mt-0.5">تسویه کامل</div>
                    </div>
                    <div className="sarv-card p-2.5 border border-base-500/30">
                      <div className="flex items-center justify-between text-[11px] text-neutral mb-1">
                        <span>کلاس‌های امروز</span>
                        <Calendar className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div className="text-lg font-black font-mono text-accent">۲ جلسه</div>
                      <div className="text-[10px] text-neutral mt-0.5">کلاس ۳۰۴ برق</div>
                    </div>
                  </div>

                  {/* 4 Quick Access Cards Grid */}
                  <div>
                    <div className="text-xs font-bold text-neutral mb-1.5">دسترسی سریع به فرآیندهای بهستان:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="sarv-card p-2.5 border border-base-500/30 hover:border-primary/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                            <GraduationCap className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-base-content">کارنامه و ریز نمرات</div>
                            <div className="text-[10px] text-neutral">کارنامه رسمی گزارش ۷۹</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-primary">بازکردن ←</span>
                      </div>

                      <div className="sarv-card p-2.5 border border-base-500/30 hover:border-accent/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-base-content">برنامه هفتگی و آزمون‌ها</div>
                            <div className="text-[10px] text-neutral">ماتریس کلاس‌ها گزارش ۷۸</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-accent">بازکردن ←</span>
                      </div>

                      <div className="sarv-card p-2.5 border border-base-500/30 hover:border-warn/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-warn/15 text-warn flex items-center justify-center">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-base-content">امور مالی و شهریه</div>
                            <div className="text-[10px] text-neutral">ریزتراز فرم ۲۵۶۳ و شاپرک</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-warn">بازکردن ←</span>
                      </div>

                      <div className="sarv-card p-2.5 border border-base-500/30 hover:border-info/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-info/15 text-info flex items-center justify-center">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-base-content">چارت و سرفصل دروس</div>
                            <div className="text-[10px] text-neutral">وضعیت دروس و پیش‌نیازها</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-info">بازکردن ←</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              مقایسه رو در رو بین سامانه سنتی بهستان با افزونه ارگونومیک و مدرن سروستان
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
                q: 'آیا این افزونه برای سایر دانشگاه‌هایی که از سامانه بهستان استفاده می‌کنند هم کاربرد دارد؟',
                a: 'بله؛ معماری هسته سروستان اختصاصاً بر پایه پروتکل و ساختار مدرن سامانه بهستان مهندسی شده است. در نسخه ۱.۲ فرم‌ها و فیلدها با بهستان دانشگاه صنعتی خواجه نصیرالدین طوسی هماهنگ شده‌اند و هم‌اکنون با جدیت در تلاشیم تا با توسعه و نگاشت جامع کدهای فرم، سروستان را برای تمامی دانشگاه‌های سراسر کشور که بر بستر سامانه بهستان فعالیت می‌کنند آماده و فعال کنیم.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`sarv-card rounded-2xl overflow-hidden border transition-all duration-300 ${
                  openFaq === idx ? 'border-primary/40 shadow-lg shadow-primary/5' : 'border-base-500/30 hover:border-base-500/50'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-base-content hover:text-primary hover:bg-base-500/10 transition-colors"
                >
                  <span className="text-base-content font-bold flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full inline-block shrink-0 transition-colors ${openFaq === idx ? 'bg-accent' : 'bg-primary'}`} />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral transition-transform duration-300 shrink-0 ${
                      openFaq === idx ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      key="faq-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-base-content/85 leading-relaxed border-t border-base-500/20 bg-base-500/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          Footer
          ========================================================= */}
      <footer className="border-t border-base-500/30 py-12 bg-base-500/10 text-xs text-neutral relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Lead Creator & Architect Spotlight Card */}
          <div className="sarv-card p-6 sm:p-7 rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-base to-accent/10 mb-10 shadow-xl shadow-primary/5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-right gap-5">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary via-accent to-primary p-0.5 shadow-xl shadow-primary/30">
                    <div className="w-full h-full bg-base rounded-[14px] flex items-center justify-center font-black text-primary text-2xl sm:text-3xl font-mono">
                      MJB
                    </div>
                  </div>
                  <span className="absolute -bottom-1.5 -left-1.5 w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs shadow-md font-bold" title="خالق و سرپرست توسعه">
                    ✓
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-primary text-primary-content shadow-sm">
                      خالق و سرپرست توسعه
                    </span>
                    <span className="text-xs font-medium text-neutral px-2.5 py-0.5 rounded-full bg-base-500/20 border border-base-500/30">
                      دانشگاه صنعتی خواجه نصیرالدین طوسی
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-base-content">
                    محمدجواد بخشی ایرج (Mohammad Javad Bakhshi)
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral mt-1 max-w-xl leading-relaxed">
                    طراح و مهندس دیزاین‌سیستم بومی <strong className="text-primary font-bold">سَرو (Sarv UI)</strong> و خالق اکوسیستم متن‌باز سروستان برای ارتقای تجربه کاربری سامانه بهستان
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://github.com/mjb4khshi"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-primary rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all px-4 py-2"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>گیت‌هاب @mjb4khshi</span>
                </a>
                <a
                  href="https://github.com/mjb4khshi/sarv-ui"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-ghost border border-base-500/30 rounded-xl text-base-content hover:bg-base-500/20 px-4 py-2 font-medium"
                >
                  دیزاین‌سیستم Sarv UI
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-base-content text-sm">پروژه آزاد سروستان (سامانه هوشمند بهستان)</div>
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

          {/* Special Thanks to Ashkan Jalali */}
          <div className="mt-8 pt-6 border-t border-base-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral">
              <Heart className="w-4 h-4 text-accent fill-accent shrink-0 animate-pulse" />
              <span>با تشکر و قدردانی ویژه از</span>
              <a
                href="https://github.com/ashkanjalaliQ"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-base-500/20 hover:bg-primary/20 text-base-content hover:text-primary font-bold border border-base-500/30 transition-all shadow-sm"
              >
                <GithubIcon className="w-3.5 h-3.5 text-primary" />
                <span>اشکان جلالی (Ashkan Jalali)</span>
              </a>
              <span className="text-neutral/80">بابت همراهی، همفکری و حمایت‌های ارزشمند در مسیر خلق و توسعه سروستان</span>
            </div>
            <div className="text-[11px] text-neutral/60 font-mono">
              سروستان • سامانه هوشمند بهستان
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
