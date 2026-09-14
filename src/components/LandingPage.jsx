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
  BookOpen,
  Copy,
  Smartphone,
  Monitor,
  Bell,
  User,
  MoreHorizontal,
  Wifi,
  Award,
  TrendingUp,
  CalendarDays,
  LayoutDashboard,
  LayoutGrid,
  ChevronLeft,
  MapPin,
  Megaphone,
  FileCheck2,
  Table2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { toFaDigits } from '../utils/faDigits';


function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

/**
 * Desktop Browser & Extension Mockup (HTML/CSS Vector Sharpness)
 */
function DesktopMockup({ theme }) {
  return (
    <div
      className="sarv-card overflow-hidden shadow-2xl rounded-2xl border transition-all duration-500 w-full"
      style={{
        backgroundColor: theme.base,
        borderColor: theme.cardBorder,
        color: theme.baseContent,
      }}
    >
      {/* Window Top Titlebar */}
      <div
        className="px-3.5 py-2.5 border-b flex items-center justify-between gap-3 text-xs"
        style={{
          backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
          borderColor: theme.cardBorder,
        }}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-danger/80 inline-block" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-warn/80 inline-block" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-success/80 inline-block" />
        </div>
        <div
          className="flex-1 max-w-xs sm:max-w-md mx-auto rounded-lg px-3 py-1 text-[11px] font-mono text-center truncate border flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: theme.mode === 'light' ? '#ffffff' : 'rgba(0,0,0,0.3)',
            borderColor: theme.cardBorder,
            color: theme.neutral,
          }}
        >
          <Lock className="w-3 h-3 text-success inline-block shrink-0" />
          <span className="truncate">chrome-extension://sarvestan/dashboard</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1"
            style={{
              backgroundColor: `${theme.primary}18`,
              borderColor: `${theme.primary}40`,
              color: theme.primary,
            }}
          >
            <span>💻</span>
            <span>افزونه دسکتاپ</span>
          </span>
        </div>
      </div>

      {/* Internal Behestan 2.0 Header */}
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between gap-3 text-xs"
        style={{
          backgroundColor: theme.mode === 'light' ? '#ffffff' : 'rgba(0,0,0,0.15)',
          borderColor: theme.cardBorder,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: theme.primary, color: theme.primaryContent }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm" style={{ color: theme.baseContent }}>سَروستان</span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold border"
              style={{
                backgroundColor: `${theme.primary}15`,
                color: theme.primary,
                borderColor: `${theme.primary}30`,
              }}
            >
              رومیزی
            </span>
          </div>
        </div>

        <div
          className="hidden md:flex items-center gap-2 flex-1 max-w-xs mx-4 px-2.5 py-1 rounded-lg border text-[11px]"
          style={{
            backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
            borderColor: theme.cardBorder,
            color: theme.neutral,
          }}
        >
          <Search className="w-3 h-3 shrink-0" />
          <span className="truncate">جستجوی دروس، گزارش‌ها، اساتید...</span>
          <kbd className="mr-auto text-[9px] px-1 rounded bg-base-500/20 font-mono">⌘K</kbd>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: `${theme.success}15`,
              color: theme.success,
              borderColor: `${theme.success}30`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
            <span className="hidden sm:inline">همگام با بهستان</span>
          </div>
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* 1. Student Hero Profile Card (Generic/Sample Student) */}
        <div
          className="p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shadow-md ring-2 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                color: '#ffffff',
                ringColor: theme.primary,
              }}
            >
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="font-black text-sm" style={{ color: theme.baseContent }}>
                  دانشجوی میهمان / نمونه
                </h4>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    backgroundColor: `${theme.success}18`,
                    color: theme.success,
                    borderColor: `${theme.success}30`,
                  }}
                >
                  متصل به بهستان
                </span>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-medium border hidden sm:inline"
                  style={{
                    backgroundColor: `${theme.primary}15`,
                    color: theme.primary,
                    borderColor: `${theme.primary}30`,
                  }}
                >
                  دانشجوی برتر
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: theme.neutral }}>
                مهندسی کامپیوتر • دانشگاه صنعتی خواجه نصیرالدین طوسی • <span className="font-mono font-bold">۴۰۱۱۲۳۴۵۶</span>
              </p>
            </div>
          </div>

          <div
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 self-end sm:self-auto cursor-pointer shadow-sm shrink-0"
            style={{
              backgroundColor: theme.mode === 'light' ? '#ffffff' : 'rgba(255,255,255,0.06)',
              borderColor: theme.cardBorder,
              color: theme.primary,
            }}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>گواهی اشتغال به تحصیل</span>
          </div>
        </div>

        {/* 2. Four Bento Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Stat 1: GPA */}
          <div
            className="p-2.5 rounded-xl border flex flex-col justify-between"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: theme.neutral }}>
              <span>معدل کل</span>
              <GraduationCap className="w-3.5 h-3.5" style={{ color: theme.primary }} />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono" style={{ color: theme.primary }}>
              ۱۹٫۴۰
            </div>
            <div className="text-[9px] font-bold mt-1 flex items-center gap-1" style={{ color: theme.success }}>
              <Sparkles className="w-2.5 h-2.5" />
              <span>رتبه برتر ترم</span>
            </div>
          </div>

          {/* Stat 2: Units */}
          <div
            className="p-2.5 rounded-xl border flex flex-col justify-between"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: theme.neutral }}>
              <span>واحدهای گذرانده</span>
              <BookOpen className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono" style={{ color: theme.baseContent }}>
              ۸۲
            </div>
            <div className="w-full bg-base-500/30 rounded-full h-1 mt-1 mb-0.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: '58%', backgroundColor: theme.accent }}
              />
            </div>
            <div className="text-[9px]" style={{ color: theme.neutral }}>
              از ۱۴۰ واحد چارت
            </div>
          </div>

          {/* Stat 3: Tuition */}
          <div
            className="p-2.5 rounded-xl border flex flex-col justify-between"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: theme.neutral }}>
              <span>وضعیت شهریه</span>
              <CreditCard className="w-3.5 h-3.5" style={{ color: theme.success }} />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono" style={{ color: theme.success }}>
              ۰ تومان
            </div>
            <div className="text-[9px] font-bold mt-1" style={{ color: theme.success }}>
              تسویه حساب کامل
            </div>
          </div>

          {/* Stat 4: Today's Class */}
          <div
            className="p-2.5 rounded-xl border flex flex-col justify-between"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: theme.neutral }}>
              <span>کلاس‌های امروز</span>
              <Calendar className="w-3.5 h-3.5" style={{ color: theme.warn }} />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono" style={{ color: theme.warn }}>
              ۲ جلسه
            </div>
            <div className="text-[9px] mt-1 truncate" style={{ color: theme.neutral }}>
              ۱۰:۳۰ • کلاس ۳۰۴ برق
            </div>
          </div>
        </div>

        {/* 3. Behestan Fast Actions */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* rep79 */}
            <div
              className="p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primary}18`, color: theme.primary }}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: theme.cardBorder, color: theme.neutral }}>
                  rep79
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold" style={{ color: theme.baseContent }}>کارنامه و ریز نمرات</div>
                <p className="text-[9px] truncate" style={{ color: theme.neutral }}>کارنامه رسمی بهستان</p>
              </div>
            </div>

            {/* rep78 */}
            <div
              className="p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${theme.accent}18`, color: theme.accent }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: theme.cardBorder, color: theme.neutral }}>
                  rep78
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold" style={{ color: theme.baseContent }}>برنامه هفتگی و آزمون</div>
                <p className="text-[9px] truncate" style={{ color: theme.neutral }}>ماتریس ساعات و امتحانات</p>
              </div>
            </div>

            {/* rep2563 */}
            <div
              className="p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${theme.warn}18`, color: theme.warn }}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: theme.cardBorder, color: theme.neutral }}>
                  rep2563
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold" style={{ color: theme.baseContent }}>امور مالی و شهریه</div>
                <p className="text-[9px] truncate" style={{ color: theme.neutral }}>تراز مالی و شاپرک</p>
              </div>
            </div>

            {/* form127 */}
            <div
              className="p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${theme.success}18`, color: theme.success }}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: theme.cardBorder, color: theme.neutral }}>
                  form127
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold" style={{ color: theme.baseContent }}>پیشخوان و فرم‌ها</div>
                <p className="text-[9px] truncate" style={{ color: theme.neutral }}>ثبت و گردش درخواست</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Authentic Android Smartphone Mockup (100% replica of sarvestan-android app)
 */
/**
 * Authentic Android Smartphone Mockup (100% interactive replica of sarvestan-android app)
 */
function MobileMockup({ theme, isSolo = false }) {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'schedule' | 'grades' | 'finance' | 'more'
  const [selectedDay, setSelectedDay] = useState('همه');

  return (
    <div
      className="relative mx-auto rounded-[46px] border-[10px] sm:border-[12px] border-slate-900 bg-slate-950 shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col transition-all duration-500 select-none"
      style={{
        width: isSolo ? '380px' : '330px',
        maxWidth: '100%',
        height: isSolo ? '780px' : '680px',
        boxShadow: `0 25px 60px -15px ${theme.primary}35, 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      {/* Outer Phone Bezel Buttons (Volume & Power indicators) */}
      <div className="absolute -left-[14px] top-26 w-[3px] h-11 bg-slate-700 rounded-l" />
      <div className="absolute -left-[14px] top-40 w-[3px] h-11 bg-slate-700 rounded-l" />
      <div className="absolute -right-[14px] top-30 w-[3px] h-14 bg-slate-700 rounded-r" />

      {/* Android Center Punch-Hole Front Camera */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center justify-center">
        <div className="w-3.5 h-3.5 rounded-full bg-[#050810] ring-1 ring-slate-800 shadow-inner flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-blue-900/60" />
        </div>
      </div>

      {/* Screen Body */}
      <div
        className="flex-1 flex flex-col justify-between text-xs overflow-hidden relative"
        style={{
          backgroundColor: theme.base,
          color: theme.baseContent,
        }}
      >
        {/* Android Status Bar */}
        <div
          className="px-5 pt-2 pb-1 flex items-center justify-between text-[10px] font-mono select-none z-20 shrink-0"
          style={{ color: theme.neutral }}
        >
          <span className="font-bold">{toFaDigits('۱۲:۳۴')}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold">5G</span>
            <Wifi className="w-3 h-3" />
            <div className="flex items-center gap-1">
              <span className="text-[8.5px] font-bold">{toFaDigits('۸۸')}٪</span>
              <div className="w-4 h-2 rounded-xs border border-current p-0.5 flex items-center">
                <div className="w-3/4 h-full rounded-xs" style={{ backgroundColor: theme.primary }} />
              </div>
            </div>
          </div>
        </div>

        {/* TopBar (Matches TopBar.jsx in sarvestan-android exactly) */}
        <header
          className="px-3.5 py-2 border-b flex items-center justify-between gap-2 backdrop-blur-xl shrink-0 z-20"
          style={{
            backgroundColor: theme.mode === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(15,17,23,0.88)',
            borderColor: theme.cardBorder,
          }}
        >
          {/* Brand Right */}
          <div className="flex items-center gap-2 min-w-0">
            {activeTab !== 'home' ? (
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                style={{ backgroundColor: `${theme.base500}30`, color: theme.baseContent }}
                title="بازگشت به میز کار"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            ) : (
              <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 1080 1080"
                  className="w-full h-full drop-shadow-sm transition-colors duration-300"
                  style={{ fill: theme.primary }}
                >
                  <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
                </svg>
              </div>
            )}
            <div className="flex flex-col leading-tight min-w-0">
              <div className="text-[13px] font-bold flex items-center gap-1 truncate" style={{ color: theme.baseContent }}>
                <span>
                  {activeTab === 'home'
                    ? 'سروستان'
                    : activeTab === 'schedule'
                    ? 'برنامه هفتگی'
                    : activeTab === 'grades'
                    ? 'کارنامه و ریز نمرات'
                    : activeTab === 'finance'
                    ? 'امور مالی و شهریه'
                    : 'خدمات و تنظیمات'}
                </span>
                {activeTab === 'home' && (
                  <span
                    className="text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border shrink-0"
                    style={{
                      backgroundColor: `${theme.accent}15`,
                      color: theme.accent,
                      borderColor: `${theme.accent}30`,
                    }}
                  >
                    همراه
                  </span>
                )}
              </div>
              <span className="text-[9px] truncate" style={{ color: theme.neutral }}>
                دانشگاه صنعتی خواجه نصیر طوسی
              </span>
            </div>
          </div>

          {/* Tools Left (Theme button + Bell) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="flex items-center gap-1 h-7 px-1.5 rounded-lg border text-[10px]"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
                color: theme.neutral,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: theme.primary }}
              />
              <span className="hidden xs:inline text-[9px] truncate max-w-[48px]">
                {theme.name?.split(' ')[0]}
              </span>
              <Palette className="w-3 h-3" />
            </div>

            <div
              className="relative w-7 h-7 rounded-lg border grid place-items-center"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
                color: theme.neutral,
              }}
            >
              <Bell className="w-3.5 h-3.5" />
              <span
                className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center shadow-sm"
                style={{ backgroundColor: theme.primary }}
              >
                {toFaDigits(2)}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Screen Content (Live, Interactive & Scrollable) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-3 relative text-xs pb-24">
          {/* TAB 1: HOME SCREEN (Replicating sarvestan-android HomeScreen.jsx) */}
          {activeTab === 'home' && (
            <>
              {/* 1. Student Hero Profile Card (Center Avatar + 3-box Bento) */}
              <section
                className="p-4 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                }}
              >
                {/* Center Avatar with Ring and Online Status */}
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl shadow-lg border-3"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                      borderColor: theme.base,
                      color: '#ffffff',
                    }}
                  >
                    م
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2"
                    style={{
                      backgroundColor: theme.success,
                      ringColor: theme.base,
                    }}
                    title="متصل به بهستان"
                  />
                </div>

                {/* Student Name and ID */}
                <h2 className="text-[15px] font-black mt-2.5 leading-tight" style={{ color: theme.baseContent }}>
                  دانشجوی نمونه
                </h2>
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: theme.neutral }}>
                  <span className="font-mono font-bold" style={{ color: theme.baseContent }}>{toFaDigits('401123456')}</span>
                  {' · '}
                  <span>مهندسی کامپیوتر</span>
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: theme.neutral }}>
                  دانشکده مهندسی برق و کامپیوتر
                </p>

                {/* Badges Row (Term + College + GPA status) */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
                  <span
                    className="text-[9.5px] font-black px-2 py-0.5 rounded-lg border"
                    style={{
                      backgroundColor: `${theme.accent}15`,
                      color: theme.accent,
                      borderColor: `${theme.accent}30`,
                    }}
                  >
                    {toFaDigits('نیمسال اول ۱۴۰۴–۱۴۰۵')}
                  </span>
                  <span
                    className="text-[9.5px] font-bold px-2 py-0.5 rounded-lg border"
                    style={{
                      backgroundColor: `${theme.primary}15`,
                      color: theme.primary,
                      borderColor: `${theme.primary}30`,
                    }}
                  >
                    مهندسی کامپیوتر
                  </span>
                  <span
                    className="text-[9.5px] font-black px-2 py-0.5 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                    }}
                  >
                    ممتاز
                  </span>
                </div>

                {/* 3-column Bento Statistics Grid (GPA / Units / Finance) */}
                <div
                  className="mt-3.5 w-full grid grid-cols-3 gap-1.5 pt-2.5 border-t"
                  style={{ borderColor: theme.cardBorder }}
                >
                  {/* Box 1: GPA */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('grades')}
                    className="rounded-xl p-2 text-center border transition-all active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: `${theme.primary}12`,
                      borderColor: `${theme.primary}25`,
                    }}
                    title="مشاهده کارنامه و محاسبه‌گر معدل"
                  >
                    <p className="text-[9.5px] font-bold" style={{ color: theme.primary }}>معدل کل</p>
                    <p className="text-[14px] font-black font-mono mt-0.5" style={{ color: theme.primary }}>
                      {toFaDigits('19.40')}
                    </p>
                  </button>

                  {/* Box 2: Credits */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('more')}
                    className="rounded-xl p-2 text-center border transition-all active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: `${theme.accent}12`,
                      borderColor: `${theme.accent}25`,
                    }}
                    title="مشاهده چارت و سرفصل دروس"
                  >
                    <p className="text-[9.5px] font-bold" style={{ color: theme.accent }}>واحد اخذشده</p>
                    <p className="text-[14px] font-black font-mono mt-0.5" style={{ color: theme.accent }}>
                      {toFaDigits('18')} <span className="text-[8.5px] font-sans">واحد</span>
                    </p>
                  </button>

                  {/* Box 3: Finance */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('finance')}
                    className="rounded-xl p-2 text-center border transition-all active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: `${theme.success}12`,
                      borderColor: `${theme.success}25`,
                    }}
                    title="مشاهده وضعیت مالی و رسید"
                  >
                    <p className="text-[9.5px] font-bold" style={{ color: theme.success }}>وضعیت مالی</p>
                    <p className="text-[12px] font-black font-mono mt-0.5 truncate" style={{ color: theme.success }}>
                      {toFaDigits('0')} <span className="text-[8.5px] font-sans">تومان</span>
                    </p>
                  </button>
                </div>
              </section>

              {/* 2. Next Class Banner Card (Clickable to Schedule) */}
              <section
                onClick={() => setActiveTab('schedule')}
                className="p-3 rounded-2xl flex items-center justify-between gap-2.5 border-r-4 shadow-sm cursor-pointer transition-all active:scale-98"
                style={{
                  backgroundColor: `${theme.primary}10`,
                  borderColor: theme.primary,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl grid place-items-center shrink-0 shadow-sm"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.primaryContent,
                    }}
                  >
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-black" style={{ color: theme.primary }}>
                        کلاس بعدی شما
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded-full font-bold font-mono"
                        style={{
                          backgroundColor: theme.primary,
                          color: theme.primaryContent,
                        }}
                      >
                        {toFaDigits('10:30')}
                      </span>
                    </div>
                    <h4 className="text-[12px] font-bold truncate mt-0.5" style={{ color: theme.baseContent }}>
                      سیستم‌های عامل · کلاس ۳۰۴ برق
                    </h4>
                  </div>
                </div>
                <div
                  className="w-6 h-6 rounded-lg grid place-items-center shrink-0"
                  style={{
                    backgroundColor: `${theme.base500}40`,
                    color: theme.neutral,
                  }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </div>
              </section>

              {/* 3. 4-column Quick Access Grid */}
              <section className="grid grid-cols-4 gap-2">
                {[
                  { label: 'برنامه هفتگی', Icon: CalendarDays, tab: 'schedule', color: theme.primary },
                  { label: 'کارنامه ترم', Icon: TrendingUp, tab: 'grades', color: theme.accent },
                  { label: 'امور مالی', Icon: CreditCard, tab: 'finance', color: theme.success },
                  { label: 'چارت و دروس', Icon: BookOpen, tab: 'more', color: theme.warn || '#f59e0b' },
                ].map(({ label, Icon, tab, color }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className="p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <span
                      className="w-9 h-9 rounded-xl grid place-items-center text-white shadow-xs"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    <span className="text-[9.5px] font-bold truncate w-full" style={{ color: theme.baseContent }}>
                      {label}
                    </span>
                  </button>
                ))}
              </section>

              {/* 4. Today's Classes List (Exact replica of HomeScreen.jsx) */}
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[11.5px] font-bold flex items-center gap-1.5" style={{ color: theme.baseContent }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <span>کلاس‌های امروز ({toFaDigits(2)} درس)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className="text-[10.5px] font-bold hover:underline cursor-pointer"
                    style={{ color: theme.primary }}
                  >
                    برنامه کامل هفته ←
                  </button>
                </div>

                {/* Class 1 */}
                <div
                  className="p-2.5 rounded-xl border flex items-start justify-between gap-2 border-r-4 text-[10px]"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.cardBorder,
                    borderRightColor: theme.primary,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold truncate" style={{ color: theme.baseContent }}>
                        سیستم‌های عامل
                      </h4>
                      <span
                        className="text-[8.5px] px-1.5 py-0.5 rounded font-bold shrink-0"
                        style={{
                          backgroundColor: `${theme.primary}15`,
                          color: theme.primary,
                        }}
                      >
                        کلاس بعدی
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2.5 text-[9px]">
                      <span
                        className="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded font-mono"
                        style={{ backgroundColor: `${theme.primary}12`, color: theme.primary }}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {toFaDigits('10:30 – 12:00')}
                      </span>
                      <span className="inline-flex items-center gap-1" style={{ color: theme.neutral }}>
                        <MapPin className="w-2.5 h-2.5" />
                        <span style={{ color: theme.baseContent }}>کلاس ۳۰۴ برق</span>
                      </span>
                      <span
                        className="font-mono px-1 py-0.2 rounded text-[8px]"
                        style={{ backgroundColor: `${theme.base500}30`, color: theme.neutral }}
                      >
                        {toFaDigits('22-14-101')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Class 2 */}
                <div
                  className="p-2.5 rounded-xl border flex items-start justify-between gap-2 border-r-4 text-[10px]"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.cardBorder,
                    borderRightColor: theme.accent,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold truncate" style={{ color: theme.baseContent }}>
                        شبکه‌های کامپیوتری
                      </h4>
                      <span
                        className="text-[8.5px] px-1.5 py-0.5 rounded font-bold shrink-0"
                        style={{
                          backgroundColor: `${theme.accent}15`,
                          color: theme.accent,
                        }}
                      >
                        در ادامه امروز
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2.5 text-[9px]">
                      <span
                        className="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded font-mono"
                        style={{ backgroundColor: `${theme.accent}12`, color: theme.accent }}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {toFaDigits('13:30 – 15:00')}
                      </span>
                      <span className="inline-flex items-center gap-1" style={{ color: theme.neutral }}>
                        <MapPin className="w-2.5 h-2.5" />
                        <span style={{ color: theme.baseContent }}>تالار خوارزمی</span>
                      </span>
                      <span
                        className="font-mono px-1 py-0.2 rounded text-[8px]"
                        style={{ backgroundColor: `${theme.base500}30`, color: theme.neutral }}
                      >
                        {toFaDigits('22-14-105')}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. Weekly Educational Load Distribution Chart */}
              <section
                className="p-3 rounded-2xl border"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-6 h-6 rounded-lg grid place-items-center text-xs"
                      style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="text-[11px] font-bold" style={{ color: theme.baseContent }}>
                      پراکندگی بار آموزشی هفته
                    </h3>
                  </div>
                  <span
                    className="text-[9.5px] font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: `${theme.base500}40`, color: theme.neutral }}
                  >
                    مجموع: {toFaDigits(16)} ساعت
                  </span>
                </div>

                <div className="flex items-end justify-between gap-1.5 h-20 pt-1">
                  {[
                    { day: 'شنبه', count: 3, h: 65, active: false },
                    { day: 'یکشنبه', count: 4, h: 90, active: true },
                    { day: 'دوشنبه', count: 2, h: 45, active: false },
                    { day: 'سه‌شنبه', count: 3, h: 65, active: false },
                    { day: 'چهارشنبه', count: 0, h: 12, active: false },
                  ].map((item) => (
                    <div key={item.day} className="flex-1 flex flex-col items-center h-full">
                      <span
                        className="text-[9px] font-mono font-bold"
                        style={{ color: item.active ? theme.primary : theme.neutral }}
                      >
                        {toFaDigits(item.count)}
                      </span>
                      <div className="flex-1 w-full flex items-end justify-center py-1">
                        <div
                          className="w-full max-w-[20px] rounded-t-lg rounded-b-xs transition-all duration-300"
                          style={{
                            height: `${item.h}%`,
                            backgroundColor: item.active ? theme.primary : `${theme.primary}60`,
                            boxShadow: item.active ? `0 0 10px ${theme.primary}50` : 'none',
                          }}
                        />
                      </div>
                      <span
                        className="text-[8.5px]"
                        style={{
                          color: item.active ? theme.primary : theme.neutral,
                          fontWeight: item.active ? 'bold' : 'normal',
                        }}
                      >
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 6. Academic Official Announcements */}
              <section className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-0.5">
                  <Megaphone className="w-3.5 h-3.5" style={{ color: theme.warn || '#f59e0b' }} />
                  <span className="text-[11px] font-bold" style={{ color: theme.baseContent }}>
                    اعلانات رسمی آموزشی
                  </span>
                </div>
                <div
                  className="p-2.5 rounded-xl border border-r-4 text-[10px]"
                  style={{
                    backgroundColor: `${theme.warn || '#f59e0b'}10`,
                    borderColor: theme.cardBorder,
                    borderRightColor: theme.warn || '#f59e0b',
                  }}
                >
                  <h4 className="font-bold" style={{ color: theme.baseContent }}>
                    آغاز ارزشیابی اساتید نیمسال جاری
                  </h4>
                  <p className="mt-0.5 leading-relaxed" style={{ color: theme.neutral }}>
                    مهلت ثبت‌نام و تکمیل فرم‌های ارزشیابی کیفیت تدریس اساتید تا پایان هفته تمدید شد.
                  </p>
                </div>
              </section>
            </>
          )}

          {/* TAB 2: SCHEDULE SCREEN */}
          {activeTab === 'schedule' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" style={{ color: theme.primary }} />
                    <h3 className="font-bold text-[12px]" style={{ color: theme.baseContent }}>برنامه آموزشی نیمسال</h3>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>
                    {toFaDigits(18)} واحد اخذشده
                  </span>
                </div>
                {/* Day selector pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                  {['همه', 'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className="px-2 py-1 rounded-lg text-[9.5px] font-bold shrink-0 transition-all cursor-pointer"
                      style={{
                        backgroundColor: selectedDay === d ? theme.primary : `${theme.base500}30`,
                        color: selectedDay === d ? theme.primaryContent : theme.neutral,
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Cards */}
              {[
                { title: 'سیستم‌های عامل', time: '۱۰:۳۰ – ۱۲:۰۰', days: 'یکشنبه، سه‌شنبه', room: 'کلاس ۳۰۴ برق', prof: 'دکتر علوی', units: 3, color: theme.primary },
                { title: 'شبکه‌های کامپیوتری', time: '۱۳:۳۰ – ۱۵:۰۰', days: 'شنبه، دوشنبه', room: 'تالار خوارزمی', prof: 'دکتر پوراحمدی', units: 3, color: theme.accent },
                { title: 'طراحی الگوریتم‌ها', time: '۰۸:۳۰ – ۱۰:۰۰', days: 'یکشنبه، سه‌شنبه', room: 'کلاس ۲۰۱', prof: 'دکتر حسینی', units: 3, color: theme.success },
                { title: 'آزمایشگاه سیستم‌های عامل', time: '۱۰:۳۰ – ۱۲:۳۰', days: 'دوشنبه', room: 'سایت ۲ کامپیوتر', prof: 'مهندس کریمی', units: 1, color: theme.warn || '#f59e0b' },
              ].map((c) => (
                <div
                  key={c.title}
                  className="p-3 rounded-xl border border-r-4 text-[10.5px]"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderRightColor: c.color }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[12px]" style={{ color: theme.baseContent }}>{c.title}</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold" style={{ backgroundColor: `${c.color}15`, color: c.color }}>
                      {toFaDigits(c.units)} واحد
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[9px]" style={{ color: theme.neutral }}>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {toFaDigits(c.time)}
                    </span>
                    <span>{c.days}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] border-t pt-1" style={{ borderColor: `${theme.cardBorder}50` }}>
                    <span className="flex items-center gap-1" style={{ color: theme.neutral }}>
                      <MapPin className="w-2.5 h-2.5" />
                      <span style={{ color: theme.baseContent }}>{c.room}</span>
                    </span>
                    <span style={{ color: theme.neutral }}>{c.prof}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: GRADES SCREEN */}
          {activeTab === 'grades' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[12px]" style={{ color: theme.baseContent }}>کارنامه و خلاصه وضعیت</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}>
                    {toFaDigits('نیمسال اول ۱۴۰۴–۱۴۰۵')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 rounded-xl text-center" style={{ backgroundColor: `${theme.primary}12` }}>
                    <p className="text-[9px] font-bold" style={{ color: theme.primary }}>معدل کل</p>
                    <p className="text-[16px] font-black font-mono mt-0.5" style={{ color: theme.primary }}>{toFaDigits('19.40')}</p>
                  </div>
                  <div className="p-2 rounded-xl text-center" style={{ backgroundColor: `${theme.success}12` }}>
                    <p className="text-[9px] font-bold" style={{ color: theme.success }}>معدل نیمسال</p>
                    <p className="text-[16px] font-black font-mono mt-0.5" style={{ color: theme.success }}>{toFaDigits('19.15')}</p>
                  </div>
                </div>
              </div>

              {/* Course Grades */}
              {[
                { title: 'سیستم‌های عامل', units: 3, grade: '۱۹٫۷۵', status: 'ممتاز', color: theme.success },
                { title: 'طراحی الگوریتم‌ها', units: 3, grade: '۱۹٫۰۰', status: 'ممتاز', color: theme.success },
                { title: 'شبکه‌های کامپیوتری', units: 3, grade: '۱۸٫۵۰', status: 'معدل الف', color: theme.primary },
                { title: 'مهندسی نرم‌افزار', units: 3, grade: '۱۸٫۲۵', status: 'معدل الف', color: theme.primary },
              ].map((g) => (
                <div
                  key={g.title}
                  className="p-2.5 rounded-xl border flex items-center justify-between text-[11px]"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
                >
                  <div>
                    <h4 className="font-bold text-[12px]" style={{ color: theme.baseContent }}>{g.title}</h4>
                    <span className="text-[9.5px]" style={{ color: theme.neutral }}>{toFaDigits(g.units)} واحد تئوری</span>
                  </div>
                  <div className="text-left">
                    <div className="text-[15px] font-black font-mono" style={{ color: g.color }}>{g.grade}</div>
                    <span className="text-[8.5px] px-1.5 py-0.2 rounded font-bold" style={{ backgroundColor: `${g.color}15`, color: g.color }}>
                      {g.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: FINANCE SCREEN */}
          {activeTab === 'finance' && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl border text-center" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}>
                <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-1.5" style={{ backgroundColor: `${theme.success}20`, color: theme.success }}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-bold" style={{ color: theme.neutral }}>مانده بدهی جاری</p>
                <p className="text-[20px] font-black font-mono my-0.5" style={{ color: theme.success }}>
                  {toFaDigits('0')} <span className="text-[11px] font-sans">تومان</span>
                </p>
                <span className="text-[9.5px] font-bold px-2.5 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${theme.success}15`, color: theme.success }}>
                  تسویه حساب کامل نیمسال
                </span>
              </div>

              <div className="p-3 rounded-2xl border space-y-2 text-[10.5px]" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}>
                <h4 className="font-bold text-[11px]" style={{ color: theme.baseContent }}>ریز اقلام شهریه نیمسال</h4>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: `${theme.cardBorder}40` }}>
                  <span style={{ color: theme.neutral }}>شهریه ثابت:</span>
                  <span className="font-mono font-bold" style={{ color: theme.baseContent }}>{toFaDigits('1,250,000')} تومان</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: `${theme.cardBorder}40` }}>
                  <span style={{ color: theme.neutral }}>شهریه متغیر ({toFaDigits(18)} واحد):</span>
                  <span className="font-mono font-bold" style={{ color: theme.baseContent }}>{toFaDigits('3,400,000')} تومان</span>
                </div>
                <div className="flex justify-between py-1">
                  <span style={{ color: theme.neutral }}>خدمات دانشجویی و بیمه:</span>
                  <span className="font-mono font-bold" style={{ color: theme.baseContent }}>{toFaDigits('150,000')} تومان</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MORE SCREEN */}
          {activeTab === 'more' && (
            <div className="space-y-2">
              {[
                { title: 'چارت تحصیلی و سرفصل مصوب', desc: 'مشاهده واحدهای گذرانده و پیش‌نیازها', Icon: BookOpen, color: theme.primary },
                { title: 'پیشخوان خدمت و گردش کارها', desc: 'پیگیری درخواست‌های بهستان', Icon: FileCheck2, color: theme.accent },
                { title: 'نامه‌ها و گواهی‌های اداری', desc: 'ارجاع مستقیم به سامانه بهستان', Icon: FileCheck, color: theme.success },
                { title: 'شخصی‌سازی تم و آیکون سرو', desc: 'انتخاب از بین ۸ پالت رنگی و آیکون‌های متنوع', Icon: Palette, color: theme.warn || '#f59e0b' },
              ].map((m) => (
                <div
                  key={m.title}
                  className="p-3 rounded-xl border flex items-center justify-between gap-2.5 text-[10.5px] cursor-pointer"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                      <m.Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold truncate" style={{ color: theme.baseContent }}>{m.title}</h4>
                      <p className="text-[9px] truncate" style={{ color: theme.neutral }}>{m.desc}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 shrink-0" style={{ color: theme.neutral }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating BottomNav (Matches BottomNav.jsx in sarvestan-android exactly) */}
        <div className="absolute bottom-4 inset-x-3 z-30 pointer-events-auto">
          <div
            className="rounded-[22px] backdrop-blur-2xl border shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] px-2 py-1 flex items-center justify-between"
            style={{
              backgroundColor: theme.mode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(15,17,23,0.92)',
              borderColor: theme.cardBorder,
            }}
          >
            {/* Tab 1: برنامه هفتگی */}
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 outline-none cursor-pointer"
              style={{ color: activeTab === 'schedule' ? theme.primary : theme.neutral }}
              title="برنامه هفتگی"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="text-[7.5px] mt-0.5 font-bold">برنامه</span>
              {activeTab === 'schedule' && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: theme.primary }} />
              )}
            </button>

            {/* Tab 2: کارنامه */}
            <button
              type="button"
              onClick={() => setActiveTab('grades')}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 outline-none cursor-pointer"
              style={{ color: activeTab === 'grades' ? theme.accent : theme.neutral }}
              title="کارنامه و ریز نمرات"
            >
              <Award className="w-4 h-4" />
              <span className="text-[7.5px] mt-0.5 font-bold">نمرات</span>
              {activeTab === 'grades' && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: theme.accent }} />
              )}
            </button>

            {/* Tab 3: میز کار (Active Center) */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 outline-none cursor-pointer"
              style={{
                backgroundColor: activeTab === 'home' ? `${theme.primary}15` : 'transparent',
                color: activeTab === 'home' ? theme.primary : theme.neutral,
              }}
              title="میز کار"
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span className="text-[8px] mt-0.5 font-black">میز کار</span>
              {activeTab === 'home' && (
                <span className="w-1.5 h-1.5 rounded-full mt-0.5 shadow-sm" style={{ backgroundColor: theme.primary }} />
              )}
            </button>

            {/* Tab 4: مالی */}
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 outline-none cursor-pointer"
              style={{ color: activeTab === 'finance' ? theme.success : theme.neutral }}
              title="امور مالی و شهریه"
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[7.5px] mt-0.5 font-bold">مالی</span>
              {activeTab === 'finance' && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: theme.success }} />
              )}
            </button>

            {/* Tab 5: بیشتر */}
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 outline-none cursor-pointer"
              style={{ color: activeTab === 'more' ? (theme.warn || '#f59e0b') : theme.neutral }}
              title="خدمات و تنظیمات"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[7.5px] mt-0.5 font-bold">بیشتر</span>
              {activeTab === 'more' && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: theme.warn || '#f59e0b' }} />
              )}
            </button>
          </div>
        </div>

        {/* Android Bottom Navigation Gesture Bar */}
        <div className="py-1 z-30 shrink-0 select-none pointer-events-none" style={{ backgroundColor: theme.base }}>
          <div className="w-28 h-1 rounded-full bg-slate-500/40 mx-auto" />
        </div>
      </div>
    </div>
  );
}


export default function LandingPage() {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [previewTab, setPreviewTab] = useState('overview');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showcaseThemeIndex, setShowcaseThemeIndex] = useState(0);
  const [showcaseProgress, setShowcaseProgress] = useState(0);
  const [mockupViewMode, setMockupViewMode] = useState('dual'); // 'dual' | 'desktop' | 'mobile'
  const [installTab, setInstallTab] = useState('android'); // 'android' | 'desktop'
  const [copiedBrowser, setCopiedBrowser] = useState(null);
  const showcaseRef = useRef(null);


  const handleCopyUrl = (url, id) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url);
      }
      setCopiedBrowser(id);
      setTimeout(() => setCopiedBrowser(null), 2200);
    } catch (e) {
      console.warn(e);
    }
  };

  const showcaseThemes = [
    {
      id: 'persian-dark',
      name: 'پرشین دارک (تیره اصیل)',
      color: '#0066a4',
      mode: 'dark',
      icon: '🌙',
      primary: '#0066a4',
      primaryContent: '#ffffff',
      accent: '#06b6d4',
      success: '#10b981',
      warn: '#f59e0b',
      base: '#000000',
      base500: '#18181b',
      cardBg: 'rgba(24, 27, 36, 0.85)',
      cardBorder: 'rgba(255, 255, 255, 0.1)',
      baseContent: '#ffffff',
      neutral: '#a1a1aa',
      neutralLight: '#e4e4e7',
    },
    {
      id: 'cyberpunk',
      name: 'سایبرپانک نئون',
      color: '#00f0ff',
      mode: 'dark',
      icon: '⚡',
      primary: '#00f0ff',
      primaryContent: '#000000',
      accent: '#ffe600',
      success: '#00ff66',
      warn: '#ffaa00',
      base: '#08090d',
      base500: '#1a1d28',
      cardBg: 'rgba(22, 26, 38, 0.85)',
      cardBorder: 'rgba(0, 240, 255, 0.25)',
      baseContent: '#f8fafc',
      neutral: '#94a3b8',
      neutralLight: '#e2e8f0',
    },
    {
      id: 'sunset',
      name: 'غروب کویر (روشن)',
      color: '#ff5e36',
      mode: 'light',
      icon: '🌅',
      primary: '#ff5e36',
      primaryContent: '#ffffff',
      accent: '#d97706',
      success: '#16a34a',
      warn: '#ea580c',
      base: '#fffbf7',
      base500: '#f1e6dc',
      cardBg: '#ffffff',
      cardBorder: 'rgba(234, 88, 12, 0.18)',
      baseContent: '#1c1917',
      neutral: '#57534e',
      neutralLight: '#78716c',
    },
    {
      id: 'tokyo-midnight',
      name: 'توکیو نیمه‌شب',
      color: '#8b5cf6',
      mode: 'dark',
      icon: '🌃',
      primary: '#8b5cf6',
      primaryContent: '#ffffff',
      accent: '#ec4899',
      success: '#10b981',
      warn: '#f59e0b',
      base: '#090a16',
      base500: '#181b33',
      cardBg: 'rgba(24, 27, 51, 0.85)',
      cardBorder: 'rgba(139, 92, 246, 0.25)',
      baseContent: '#f8fafc',
      neutral: '#a5b4fc',
      neutralLight: '#e0e7ff',
    },
    {
      id: 'emerald',
      name: 'زمرد کهنسال',
      color: '#10b981',
      mode: 'dark',
      icon: '🌲',
      primary: '#10b981',
      primaryContent: '#06130b',
      accent: '#14b8a6',
      success: '#34d399',
      warn: '#f59e0b',
      base: '#06130b',
      base500: '#0e2617',
      cardBg: 'rgba(14, 38, 23, 0.85)',
      cardBorder: 'rgba(16, 185, 129, 0.25)',
      baseContent: '#f0fdf4',
      neutral: '#86efac',
      neutralLight: '#bbf7d0',
    },
    {
      id: 'persian-light',
      name: 'پرشین لایت (سفید پاکیزه)',
      color: '#0066a4',
      mode: 'light',
      icon: '☀️',
      primary: '#0066a4',
      primaryContent: '#ffffff',
      accent: '#0284c7',
      success: '#15803d',
      warn: '#d97706',
      base: '#ffffff',
      base500: '#e2e8f0',
      cardBg: '#f8fafc',
      cardBorder: 'rgba(0, 102, 164, 0.18)',
      baseContent: '#0f172a',
      neutral: '#475569',
      neutralLight: '#64748b',
    },
    {
      id: 'royal-purple',
      name: 'ارغوانی سلطنتی',
      color: '#a855f7',
      mode: 'dark',
      icon: '🔮',
      primary: '#a855f7',
      primaryContent: '#ffffff',
      accent: '#d946ef',
      success: '#10b981',
      warn: '#f59e0b',
      base: '#0d0718',
      base500: '#231240',
      cardBg: 'rgba(35, 18, 64, 0.85)',
      cardBorder: 'rgba(168, 85, 247, 0.28)',
      baseContent: '#faf5ff',
      neutral: '#d8b4fe',
      neutralLight: '#f3e8ff',
    },
    {
      id: 'nordic',
      name: 'یخسار نوردیک',
      color: '#0284c7',
      mode: 'light',
      icon: '❄️',
      primary: '#0284c7',
      primaryContent: '#ffffff',
      accent: '#06b6d4',
      success: '#16a34a',
      warn: '#d97706',
      base: '#f8fafc',
      base500: '#e2e8f0',
      cardBg: '#ffffff',
      cardBorder: 'rgba(2, 132, 199, 0.2)',
      baseContent: '#0f172a',
      neutral: '#334155',
      neutralLight: '#64748b',
    },
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
      setShowcaseProgress(progress);
      
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
    <div className="min-h-screen bg-base text-base-content font-sans antialiased overflow-x-clip selection:bg-primary selection:text-primary-content" style={{ overflowX: 'clip' }}>
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
      <header className="sticky top-0 z-40 backdrop-blur-md bg-base/80 border-b border-base-500/20 w-full">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img
              src="./sarv-logo.png"
              alt="لوگوی سرو"
              className="w-7 h-7 sm:w-9 sm:h-9 object-contain shrink-0"
            />
            <div className="whitespace-nowrap">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-xl tracking-tight text-base-content">سَروستان</span>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-neutral hidden sm:block whitespace-nowrap">
                سامانه هوشمند بهستان
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
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Theme Selector */}
            <button
              className="btn btn-sm btn-ghost p-1.5 sm:p-2 rounded-xl text-neutral hover:text-base-content border border-base-500/30 shrink-0"
              title="تغییر تم سایت"
              onClick={() => {
                const nextTheme = currentTheme.includes('dark') ? 'persian-light' : 'persian-dark';
                setTheme(nextTheme);
              }}
            >
              {currentTheme.includes('dark') ? (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
              ) : (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warn" />
              )}
            </button>

            {/* GitHub Repo */}
            <a
              href="https://github.com/mjb4khshi/sarvestan"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-ghost p-2 rounded-xl text-neutral hover:text-base-content border border-base-500/30 hidden md:flex items-center gap-1.5 shrink-0"
              title="مخزن گیت‌هاب"
            >
              <GithubIcon className="w-4 h-4" />
              <span className="text-xs font-mono">GitHub</span>
            </a>

            {/* Download Android APK */}
            <a
              href="./sarvestan.apk"
              download
              className="btn btn-sm btn-outline border-primary/40 text-primary hover:bg-primary hover:text-primary-content rounded-xl font-bold flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all"
              title="دانلود فایل نصبی اپلیکیشن اندروید"
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">اپ اندروید (APK)</span>
              <span className="sm:hidden whitespace-nowrap">اندروید</span>
            </a>

            {/* Download Extension ZIP */}
            <a
              href="./sarvestan-extension.zip"
              download
              className="btn btn-sm btn-primary rounded-xl font-bold flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">دریافت افزونه</span>
              <span className="sm:hidden whitespace-nowrap">دانلود</span>
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
            <span>نسل نوین دستیار هوشمند بهستان ۲.۰ • سریع، مستقل و مدرن</span>
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
            <strong className="text-base-content font-bold">سروستان</strong> اکوسیستم هوشمند و مستقل بهستان ۲.۰ است که در دو نسخهٔ <strong className="text-primary font-bold">افزونه مرورگر دسکتاپ</strong> و <strong className="text-accent font-bold">اپلیکیشن اختصاصی اندروید</strong> ارائه شده؛ کارنامه تحلیلی، برنامه هفتگی بصری، مدیریت شفاف شهریه، ویجت‌های هوشمند هوم‌اسکرین و پالت فرمان سریع را با دیزاین‌سیستم اختصاصی <strong className="text-primary font-bold">سَرو (Sarv UI)</strong> در اختیارتان می‌گذارد.
          </motion.p>


          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5"
          >
            <a
              href="./sarvestan-extension.zip"
              download
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-primary text-primary-content font-bold text-base shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
            >
              <Download className="w-5 h-5" />
              <span>دانلود افزونه دسکتاپ (ZIP)</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-mono">Chrome / Edge</span>
            </a>

            <a
              href="./sarvestan.apk"
              download
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-base-500/15 hover:bg-base-500/25 border border-base-500/30 text-base-content font-bold text-base hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-lg"
            >
              <Smartphone className="w-5 h-5 text-accent" />
              <span>دانلود اپلیکیشن اندروید (APK)</span>
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-md font-mono font-bold">v1.0</span>
            </a>
          </motion.div>

          {/* Desktop & Mobile Platform Notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-neutral mb-12"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-base-500/20 border border-base-500/30 text-base-content font-medium shadow-sm">
              <span>💻</span>
              <span>افزونه مرورگر دسکتاپ: بدون نیاز به VPN، هماهنگ با کروم، اج، بریو و اوپرا</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>📱</span>
              <span>اپلیکیشن اختصاصی اندروید: فایل APK مستقیم، ویجت‌های هوشمند و ورود خودکار</span>
            </span>
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

          {/* Live Interactive Dual HTML/CSS Mockup in Hero */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-12 max-w-6xl mx-auto"
          >
            <div className="relative flex flex-col lg:flex-row items-center justify-center gap-5 lg:gap-6">
              {/* Desktop Browser Mockup */}
              <div className="w-full lg:w-[68%] xl:w-[70%]">
                <DesktopMockup theme={currentShowcaseTheme} />
              </div>

              {/* Mobile Phone Mockup */}
              <div className="w-full sm:w-auto lg:w-[32%] xl:w-[30%] flex justify-center">
                <MobileMockup theme={currentShowcaseTheme} />
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-neutral flex flex-wrap items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success inline-block" />
              <span>پیش‌نمایش زنده و تمام‌وکتور محیط افزونه دسکتاپ و اپلیکیشن موبایل سروستان</span>
              <span className="opacity-40 hidden sm:inline">•</span>
              <a
                href="#preview"
                onClick={(e) => scrollToSection(e, '#preview')}
                className="text-primary hover:underline font-bold inline-flex items-center gap-1"
              >
                <span>تغییر رنگ‌ها، پوسته‌ها و زوایای پیش‌نمایش در بخش پایین</span>
                <span>↓</span>
              </a>
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
                ({showcaseThemeIndex + 1} از {showcaseThemes.length} • {Math.round(showcaseProgress * 100)}% اسکرول)
              </span>
            </div>

            {/* Live scroll progress bar */}
            <div className="w-full md:w-32 bg-base-500/30 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-100 rounded-full"
                style={{ width: `${Math.round(showcaseProgress * 100)}%` }}
              />
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

          {/* View Mode Toggle */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-4">
            <button
              onClick={() => setMockupViewMode('dual')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mockupViewMode === 'dual'
                  ? 'bg-primary text-primary-content shadow-md shadow-primary/20 scale-105'
                  : 'bg-base-500/20 text-neutral hover:text-base-content hover:bg-base-500/30'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>نمایش همزمان (دسکتاپ + موبایل)</span>
            </button>
            <button
              onClick={() => setMockupViewMode('desktop')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mockupViewMode === 'desktop'
                  ? 'bg-primary text-primary-content shadow-md shadow-primary/20 scale-105'
                  : 'bg-base-500/20 text-neutral hover:text-base-content hover:bg-base-500/30'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>فقط افزونه دسکتاپ</span>
            </button>
            <button
              onClick={() => setMockupViewMode('mobile')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mockupViewMode === 'mobile'
                  ? 'bg-primary text-primary-content shadow-md shadow-primary/20 scale-105'
                  : 'bg-base-500/20 text-neutral hover:text-base-content hover:bg-base-500/30'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>فقط اپلیکیشن موبایل</span>
            </button>
          </div>

          {/* The Multi-Theme Mockup Display Container */}
          <div
            datatheme={currentShowcaseTheme.id}
            data-theme={currentShowcaseTheme.id}
            data-theme-mode={currentShowcaseTheme.mode}
            className="sarv-showcase-frame transition-all duration-500"
            style={{
              '--theme-color-base': currentShowcaseTheme.base,
              '--theme-color-base-500': currentShowcaseTheme.base500,
              '--theme-color-base-content': currentShowcaseTheme.baseContent,
              '--theme-color-neutral': currentShowcaseTheme.neutral,
              '--theme-color-primary': currentShowcaseTheme.primary,
              '--theme-color-primary-content': currentShowcaseTheme.primaryContent,
              '--theme-color-accent': currentShowcaseTheme.accent,
              '--theme-color-success': currentShowcaseTheme.success,
              '--theme-color-warn': currentShowcaseTheme.warn,
              '--theme-card-bg': currentShowcaseTheme.cardBg,
              '--theme-card-border': currentShowcaseTheme.cardBorder,
            }}
          >
            {mockupViewMode === 'dual' && (
              <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
                {/* Desktop Extension Window */}
                <div className="w-full lg:w-[68%] xl:w-[70%]">
                  <DesktopMockup theme={currentShowcaseTheme} />
                </div>

                {/* Android Mobile Phone Mockup */}
                <div className="w-full sm:w-auto lg:w-[32%] xl:w-[30%] flex justify-center">
                  <MobileMockup theme={currentShowcaseTheme} />
                </div>
              </div>
            )}

            {mockupViewMode === 'desktop' && (
              <div className="max-w-5xl mx-auto">
                <DesktopMockup theme={currentShowcaseTheme} />
              </div>
            )}

            {mockupViewMode === 'mobile' && (
              <div className="flex justify-center py-2">
                <MobileMockup theme={currentShowcaseTheme} isSolo={true} />
              </div>
            )}

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
              مقایسه رو در رو بین سامانه سنتی بهستان با اکوسیستم مدرن سروستان (افزونه دسکتاپ + اپلیکیشن موبایل)
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
                  <span>رابط کاربری غیرریسپانسیو؛ کار با گوشی موبایل و تبلت عملاً طاقت‌فرسا و ناقص است.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <span>عدم وجود اپلیکیشن یا ویجت؛ برای دیدن ساعت هر کلاس باید وارد بهستان شوید.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <span>فقدان تم تاریک؛ نور سفید خیره‌کننده و خستگی مفرط چشم‌ها در محیط‌های کم‌نور.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <span>منوهای تودرتو و لزوم حفظ کردن کدهای فرم (مانند ۲۷۲، ۱۲۵، ۲۵۶ و...) برای دسترسی.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <span>عدم امکان کارکرد آفلاین؛ با کوچک‌ترین اختلال اینترنت کل دسترسی شما قطع می‌شود.</span>
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
                  <h3 className="font-black text-lg text-success">اکوسیستم سروستان (دسکتاپ + اندروید)</h3>
                  <p className="text-xs text-neutral">دیزاین‌سیستم اختصاصی سَرو (Sarv UI) و فونت آراد</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-base-content">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>اپلیکیشن اختصاصی اندروید همراه با ویجت‌های تعاملی هوم‌اسکرین و دسترسی آفلاین.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>افزونه دسکتاپ مدرن بدون رفرش (SPA) با پالت جستجوی فوری (Ctrl + K) روی مرورگر.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>۱۲ آیکون لانچر متنوع و ۸ پالت رنگی چشم‌نواز با تم‌های تاریک و روشن استاندارد.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>محاسبه‌گر معدل، نمودار بار هفتگی، تحلیل چارت تحصیلی و تفکیک شفاف شهریه.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>حفظ ۱۰۰٪ حریم خصوصی بدون سرور واسط، با امنیت تاییدشده و سوییچ درگاه رسمی شاپرک.</span>
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

            {/* Feature 2: Android App & Widgets */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl border-accent/30 bg-accent/5">
              <div className="w-12 h-12 rounded-xl bg-accent/20 text-accent flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-base text-base-content">اپلیکیشن اندروید و ویجت‌های زنده</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent font-mono">v1.0</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                دسترسی سریع و آفلاین به برنامه کلاسی، ۳ نوع ویجت هوشمند هوم‌اسکرین (کلاس بعدی، معدل کل و کارت ترکیبی) و ۱۲ آیکون لانچر متنوع.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-info/15 text-info flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">برنامه هفتگی ویژوال و تقویم</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                تقویم رنگی هوشمند ساعات کلاسی بدون تداخل، همراه با تاریخ و ساعت امتحانات پایان‌ترم و قابلیت پرینت مستقیم جدول.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-warn/15 text-warn flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">پالت فرمان سریع (Ctrl + K)</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                دسترسی فوری مانند Raycast و VS Code؛ جستجوی نام اساتید، کد دروس، فرم‌های اداری و عملیات تنها با چند کلید کیبورد در نسخه دسکتاپ.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-success/15 text-success flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">تسویه‌حساب و امنیت ۱۰۰٪ شاپرک</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                تفکیک شفاف بدهی و بستانکاری شهریه با سوییچ هوشمند به فرم امن ۲۷۵۷۰ بهستان و عدم ذخیره کلمه عبور؛ پردازش کاملاً امن و محلی.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="sarv-card sarv-card-hover p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mb-4">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-2 text-base-content">دیزاین‌سیستم بومی سَرو (Sarv UI)</h3>
              <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                طراحی چشم‌نواز با تایپوگرافی متغیر آراد، حاشیه‌های شیشه‌ای (Glassmorphism)، ۸ پالت رنگی داینامیک و هماهنگی کامل با فرهنگ بومی.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          Installation Guide (Dual Tab: Android APK & Desktop Extension)
          ========================================================= */}
      <section id="install" className="py-16 sm:py-24 bg-base-500/10 border-t border-base-500/20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-success px-3.5 py-1.5 rounded-full bg-success/10 border border-success/25 mb-3 inline-block shadow-sm">
              راهنمای راه‌اندازی
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mt-3 mb-4 text-base-content">
              نصب آسان در <span className="bg-gradient-to-r from-success via-info to-success bg-clip-text text-transparent">کمتر از ۱ دقیقه</span>
            </h2>
            <p className="text-sm sm:text-base text-neutral max-w-xl mx-auto">
              راهنمای گام‌به‌گام نصب اپلیکیشن اندروید یا افزونه مرورگر دسکتاپ بدون نیاز به VPN
            </p>
          </div>

          {/* Platform Tab Switcher */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            <button
              type="button"
              onClick={() => setInstallTab('android')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                installTab === 'android'
                  ? 'bg-primary text-primary-content shadow-primary/25 scale-105'
                  : 'bg-base-500/20 text-neutral hover:text-base-content hover:bg-base-500/30'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>نصب اپلیکیشن اندروید (APK مستقیم)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 font-mono">v1.0</span>
            </button>
            <button
              type="button"
              onClick={() => setInstallTab('desktop')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                installTab === 'desktop'
                  ? 'bg-primary text-primary-content shadow-primary/25 scale-105'
                  : 'bg-base-500/20 text-neutral hover:text-base-content hover:bg-base-500/30'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>نصب افزونه دسکتاپ (کروم / اج)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 font-mono">ZIP</span>
            </button>
          </div>

          {/* TAB 1: ANDROID APK INSTALLATION GUIDE */}
          {installTab === 'android' && (
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4 border-primary/30">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                  ۱
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-base text-base-content">دانلود مستقیم فایل نصبی sarvestan.apk</h3>
                    <a
                      href="./sarvestan.apk"
                      download
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-content text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود sarvestan.apk (۵٫۴ مگابایت)</span>
                    </a>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                    فایل APK نسخه ۱.۰ را از دکمه بالا مستقیماً دریافت کنید. این اپلیکیشن نیتیو بوده و روی تمام گوشی‌های هوشمند اندروید (اندروید نسخه ۸ به بالا) بدون نیاز به گوگل‌پلی یا VPN به راحتی کار می‌کند.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent text-accent-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-accent/20">
                  ۲
                </div>
                <div className="flex-1 w-full">
                  <h3 className="font-bold text-base mb-2 text-base-content">
                    تایید مجوز نصب برنامه‌ها (Install Unknown Apps)
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral leading-relaxed mb-3">
                    پس از لمس فایل دانلود شده در گوشی، در صورت مشاهده هشدار امنیتی استاندارد اندروید:
                  </p>
                  <div className="p-3.5 rounded-xl bg-base-500/15 border border-base-500/30 mb-3 text-xs text-neutral">
                    روی گزینه <strong className="text-primary font-bold">Settings (تنظیمات)</strong> بزنید و کلید <strong className="text-success font-bold">Allow from this source (مجاز بودن این منبع)</strong> را روشن کنید تا فرآیند نصب انجام شود.
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral/80">
                    <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                    <span>فایل با امضای رسمی توسعه‌دهنده کامپایل شده و فاقد هرگونه ترکر تبلیغاتی یا دسترسی‌های غیرضروری است.</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-success text-success-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-success/20">
                  ۳
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-1 text-base-content">ورود امن و لذت از ویجت‌های زنده هوم‌اسکرین</h3>
                  <p className="text-xs sm:text-sm text-neutral leading-relaxed">
                    اپلیکیشن سروستان را باز کنید و با اطلاعات دانشجویی خود یا کد SSO بهستان متصل شوید. برنامه کلاسی شما ذخیره شده و به صورت کاملاً آفلاین در دسترس خواهد بود. با لمس طولانی صفحه اصلی گوشی نیز می‌توانید ویجت‌های کلاسی و معدل سروستان را بیفزایید!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESKTOP CHROMIUM EXTENSION GUIDE */}
          {installTab === 'desktop' && (
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="sarv-card p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-4 border-primary/30">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-content font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                  ۱
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-base text-base-content">دانلود فایل افزونه و استخراج (Unzip)</h3>
                    <a
                      href="./sarvestan-extension.zip"
                      download
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-content text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود sarvestan-extension.zip</span>
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
                <div className="flex-1 w-full">
                  <h3 className="font-bold text-base mb-2 text-base-content">
                    باز کردن بخش مدیریت افزونه‌ها (Manage Extensions)
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral leading-relaxed mb-3">
                    برای ورود به صفحه افزونه‌ها در مرورگر خود، از یکی از دو روش زیر استفاده کنید:
                  </p>

                  {/* روش اول: از طریق ظاهر و منوی مرورگر */}
                  <div className="p-3.5 rounded-xl bg-base-500/15 border border-base-500/30 mb-3">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-base-content mb-2">
                      <span className="text-base">🧩</span>
                      <span>روش اول (آسان‌تر — بدون نیاز به تایپ، از منوی مرورگر):</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-500/25 border border-base-500/40 text-base-content font-medium">
                        <span>۱. کلیک روی آیکون پازل</span>
                        <strong className="text-primary font-bold">🧩 Extensions</strong>
                      </span>
                      <span className="text-neutral/60">⬅️</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-500/25 border border-base-500/40 text-base-content font-medium">
                        <span>۲. انتخاب گزینه</span>
                        <strong className="text-accent font-bold">Manage extensions</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral/70 mt-2">
                      💡 همچنین می‌توانید از منوی سه‌نقطه بالای مرورگر (<strong>⋮</strong> یا <strong>⋯</strong>) گزینه <strong>Extensions</strong> و سپس <strong>Manage extensions</strong> را انتخاب نمایید.
                    </p>
                  </div>

                  {/* روش دوم: آدرس مستقیم نوار مرورگر برای هر مرورگر */}
                  <div className="p-3.5 rounded-xl bg-base-500/15 border border-base-500/30 mb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-base-content">
                        <Terminal className="w-4 h-4 text-primary" />
                        <span>روش دوم (ورود آدرس اختصاصی هر مرورگر در نوار آدرس):</span>
                      </div>
                      <span className="text-[11px] text-neutral hidden sm:inline">جهت کپی روی آدرس کلیک کنید</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: 'chrome', name: 'Google Chrome', url: 'chrome://extensions', icon: '🌐' },
                        { id: 'edge', name: 'Microsoft Edge', url: 'edge://extensions', icon: '🌀' },
                        { id: 'brave', name: 'Brave Browser', url: 'brave://extensions', icon: '🦁' },
                        { id: 'opera', name: 'Opera / GX', url: 'opera://extensions', icon: '🔴' }
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleCopyUrl(b.url, b.id)}
                          className="flex items-center justify-between p-2 rounded-lg bg-base-500/20 hover:bg-base-500/35 border border-base-500/30 transition-all text-right group cursor-pointer"
                          title="برای کپی آدرس کلیک کنید"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">{b.icon}</span>
                            <span className="text-xs font-medium text-neutral group-hover:text-base-content transition-colors">
                              {b.name}:
                            </span>
                            <code className="text-xs font-mono font-bold text-primary dir-ltr">
                              {b.url}
                            </code>
                          </div>
                          <span className="text-[10px] text-neutral/80 group-hover:text-primary transition-colors flex items-center gap-1 shrink-0 mr-2">
                            {copiedBrowser === b.id ? (
                              <>
                                <Check className="w-3 h-3 text-success" />
                                <span className="text-success font-bold">کپی شد</span>
                              </>
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* فعال‌سازی Developer mode */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-warn/10 border border-warn/25 text-xs text-neutral">
                    <span className="text-warn text-base shrink-0">⚡</span>
                    <div className="leading-relaxed">
                      <strong className="text-base-content font-bold">مرحله نهایی گام ۲:</strong> در گوشه بالا سمت راست (یا بالا چپ بسته به زبان مرورگر)، کلید <strong className="text-warn font-bold">Developer mode</strong> (حالت توسعه‌دهنده) را <span className="text-success font-bold">روشن</span> کنید تا دکمه Load unpacked در مرحله بعد نمایان شود.
                    </div>
                  </div>
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
          )}

          {/* Quick Notice */}
          <div className="mt-10 p-4 rounded-xl bg-primary/10 border border-primary/20 text-center flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-primary font-medium text-right">
              💡 سروستان یک پروژه کاملاً متن‌باز، رایگان و مستقل برای رفاه دانشجویان است.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <a href="./sarvestan.apk" download className="btn btn-xs btn-primary rounded-xl font-bold flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                <span>دانلود APK اندروید</span>
              </a>
              <a href="./sarvestan-extension.zip" download className="btn btn-xs btn-outline border-primary/40 rounded-xl font-bold flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>دانلود ZIP افزونه</span>
              </a>
            </div>
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
                q: 'آیا افزونه و اپلیکیشن سروستان رسمی است و زیر نظر مدیریت دانشگاه است؟',
                a: 'خیر، سروستان یک پروژه دانشجویی مستقل، داوطلبانه و متن‌باز (Open Source) است. این برنامه تغییری در داده‌ها یا سرورهای دانشگاه نمی‌دهد و صرفاً نحوه نمایش اطلاعات را مدرن، سریع، زیبا و کارآمد می‌کند.'
              },
              {
                q: 'آیا اطلاعات کاربری یا کلمه عبور من در سروری ذخیره می‌شود؟',
                a: 'به هیچ وجه. سروستان هیچ‌گونه سرور بک‌اند، پایگاه داده خارجی یا ترکر ندارد. این سامانه نیازی به ذخیره کلمه عبور شما ندارد و تمامی اطلاعات به صورت محلی و رمزنگاری‌شده روی دستگاه خودتان (مرورگر دسکتاپ یا حافظه گوشی) نگهداری می‌شوند.'
              },
              {
                q: 'آیا پرداخت شهریه از طریق سروستان امن است؟',
                a: 'بله کاملاً. هنگام کلیک بر روی گزینه پرداخت، سیستم فوراً به نمای بومی و اصلی فرم ۲۷۵۷۰ سامانه بهستان سوییچ می‌کند تا توکن شاپرک بانک‌های سامان، تجارت و ملت بدون کوچک‌ترین ریسکی مستقیماً با پروتکل رسمی بانک صادر شود.'
              },
              {
                q: 'سروستان روی چه مرورگرهایی کار می‌کند؟',
                a: 'تمامی مرورگرهای دسکتاپ مبتنی بر هسته کرومیوم شامل Google Chrome, Microsoft Edge, Brave Browser, Opera و Vivaldi در سیستم‌عامل‌های ویندوز، مک و لینوکس به صورت کامل پشتیبانی می‌شوند.'
              },
              {
                q: 'آیا سروستان روی گوشی موبایل هم کار می‌کند؟',
                a: 'بله! نسخه رسمی ۱.۰ اپلیکیشن اندروید سروستان منتشر شده و فایل APK مستقیم آن در دسترس است. نسخه اندروید دارای قابلیت کارکرد کاملاً آفلاین برای برنامه کلاسی، ورود امن، ویجت‌های تعاملی صفحه اصلی گوشی (کلاس بعدی، معدل کل و کارت ترکیبی) و ۱۲ پالت رنگی آیکون لانچر اختصاصی است.'
              },
              {
                q: 'آیا این سامانه برای سایر دانشگاه‌هایی که از سامانه بهستان استفاده می‌کنند هم کاربرد دارد؟',
                a: 'بله؛ معماری هسته سروستان اختصاصاً بر پایه پروتکل و ساختار مدرن سامانه بهستان مهندسی شده است. در نسخه ۱.۰ فرم‌ها و فیلدها با بهستان دانشگاه صنعتی خواجه نصیرالدین طوسی هماهنگ شده‌اند و در حال گسترش آن برای تمامی دانشگاه‌های دارای سامانه بهستان هستیم.'
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
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary via-accent to-primary p-0.5 shadow-xl shadow-primary/30 overflow-hidden">
                    <img
                      src="./mjb-avatar.png"
                      alt="محمدجواد بخشی"
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  </div>
                  <span className="absolute -bottom-1.5 -left-1.5 w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs shadow-md font-bold ring-2 ring-base" title="خالق و سرپرست توسعه">
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
                    محمدجواد بخشی (Mohammad Javad Bakhshi)
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
                  href="https://mjb4khshi.github.io/KNTU/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-accent rounded-xl text-accent-content font-bold flex items-center gap-2 shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all px-4 py-2"
                  title="هاب جزوات و یادداشت‌های آموزشی دانشگاه خواجه نصیر"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>یادداشت‌های خواجه‌نصیر (KNTU)</span>
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
              <img
                src="./sarv-logo.png"
                alt="لوگوی سرو"
                className="w-8 h-8 object-contain shrink-0"
              />
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
              <a
                href="./sarvestan.apk"
                download
                className="hover:text-primary transition-colors"
              >
                دانلود نسخه اندروید (APK)
              </a>
              <span className="opacity-30">•</span>
              <a
                href="./sarvestan-extension.zip"
                download
                className="hover:text-primary transition-colors"
              >
                دانلود مستقیم افزونه (.zip)
              </a>
              <span className="opacity-30">•</span>
              <a
                href="https://mjb4khshi.github.io/KNTU/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span>یادداشت‌های KNTU</span>
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
                  محمدجواد بخشی
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
