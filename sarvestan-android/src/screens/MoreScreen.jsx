import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  FileText,
  ChevronLeft,
  BookOpenCheck,
  RefreshCw,
  ExternalLink,
  Info,
  Share2,
  Globe,
  Download,
  CheckCircle2,
  Clock,
  CircleDashed,
  X,
  Copy,
  Check,
  Heart,
  Sparkles,
  Image as ImageIcon,
  CalendarDays,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { getViewModel } from '../data/viewModel';
import { useSarvestanData } from '../hooks/useSarvestanData';
import { useTheme } from '../context/ThemeContext';
import SessionPanel from '../components/SessionPanel';
import { toFaDigits, formatLastSync, getLastSyncTimestamp } from '../utils/faDigits';
import { getGpaStatusBadge } from './HomeScreen';
import {
  renderScheduleImage,
  renderGpaStoryImage,
  shareCanvas,
  canvasToDataUrl,
  downloadBlob,
  saveCanvasImage,
  copyCanvasToClipboard,
} from '../services/shareImages';
import { useAppIcon, SarvIconSvg } from '../services/appIcon';

export default function MoreScreen({ onNavigate, initialChartOpen = false }) {
  const vm = getViewModel();
  const { workflows, sync, syncMeta } = useSarvestanData();
  const { activeThemeMeta } = useTheme();
  const lastSyncTime = getLastSyncTimestamp(syncMeta);
  const lastSyncFormatted = formatLastSync(lastSyncTime);
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [iconToast, setIconToast] = useState('');
  const { currentIconId, currentIcon, setAppIcon, icons: appIcons } = useAppIcon();
  // چارت: فقط از دیتای زنده — بدون mock
  const CURRICULUM = vm.curriculum;
  const STUDENT = vm.student || {
    fullName: '',
    studentId: '',
    college: '',
    major: '',
  };
  const gpaStatus = getGpaStatusBadge(vm.summary?.gpa || STUDENT?.gpa || vm.grades?.cumulativeGpa);
  // درخواست‌ها: فقط از دیتای زنده
  const REQUESTS_LIVE = (workflows || []).map((w, i) => ({
    id: w.id || `r${i}`,
    title: w.title || 'درخواست آموزشی',
    date: w.date || '',
    status: w.status || 'در جریان',
    color: i % 2 === 0 ? 'info' : 'warn',
  }));
  const [cacheCleared, setCacheCleared] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(initialChartOpen);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [shareBusy, setShareBusy] = useState('');
  const [sharePreview, setSharePreview] = useState(null); // { url, kind, canvas, filename, title }
  const [shareMsg, setShareMsg] = useState('');
  const [copiedPreview, setCopiedPreview] = useState(false);

  const handleShareSchedule = async () => {
    if (shareBusy) return;
    setShareBusy('schedule');
    setShareMsg('');
    try {
      const canvas = await renderScheduleImage({ theme: activeThemeMeta });
      setSharePreview({
        url: canvasToDataUrl(canvas),
        kind: 'schedule',
        canvas,
        title: 'برنامه هفتگی من | سروستان',
        filename: 'sarvestan-schedule.png',
      });
      setShareMsg('پیش‌نمایش آماده شد — گزینهٔ اشتراک‌گذاری یا ذخیره را انتخاب کنید');
    } catch (e) {
      console.error('[share schedule]', e);
      setShareMsg('خطا در ساخت تصویر: ' + String(e?.message || e));
    } finally {
      setShareBusy('');
    }
  };

  const handleShareGpa = async () => {
    if (shareBusy) return;
    setShareBusy('gpa');
    setShareMsg('');
    try {
      const canvas = await renderGpaStoryImage({ theme: activeThemeMeta });
      setSharePreview({
        url: canvasToDataUrl(canvas),
        kind: 'gpa',
        canvas,
        title: 'کارنامه و معدل من | سروستان',
        filename: 'sarvestan-gpa.png',
      });
      setShareMsg('پیش‌نمایش آماده شد — گزینهٔ اشتراک‌گذاری یا ذخیره را انتخاب کنید');
    } catch (e) {
      console.error('[share gpa]', e);
      setShareMsg('خطا در ساخت تصویر: ' + String(e?.message || e));
    } finally {
      setShareBusy('');
    }
  };

  const handleDownloadPreview = async () => {
    if (!sharePreview?.canvas) return;
    try {
      await saveCanvasImage(sharePreview.canvas, sharePreview.filename || 'sarvestan.png');
      setShareMsg('تصویر با موفقیت در گالری ذخیره شد');
    } catch (e) {
      console.error('[download preview]', e);
      setShareMsg('خطا در ذخیره تصویر');
    }
  };

  const handleShareNative = async () => {
    if (!sharePreview?.canvas) return;
    try {
      const r = await shareCanvas(sharePreview.canvas, {
        filename: sharePreview.filename || 'sarvestan.png',
        title: sharePreview.title || 'سروستان',
      });
      if (r === 'shared') setShareMsg('تصویر با موفقیت به اشتراک گذاشته شد');
      if (r === 'downloaded') setShareMsg('تصویر ذخیره شد — آمادهٔ قرار دادن در استوری');
    } catch (e) {
      console.error('[share native]', e);
      setShareMsg('خطا در اشتراک‌گذاری');
    }
  };

  const handleCopyPreview = async () => {
    if (!sharePreview?.canvas) return;
    try {
      await copyCanvasToClipboard(sharePreview.canvas);
      setCopiedPreview(true);
      setShareMsg('تصویر در حافظه کپی شد (آمادهٔ الصاق در استوری یا چت)');
      setTimeout(() => setCopiedPreview(false), 3000);
    } catch (e) {
      console.warn('[copy preview]', e);
      await handleDownloadPreview();
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('sarvestan_live_schedule');
      localStorage.removeItem('sarvestan_live_courses');
      localStorage.removeItem('sarvestan_live_reg77');
    } catch {}
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
    // همگام‌سازی مجدد
    setTimeout(() => {
      sync(true).catch(() => {});
    }, 400);
  };

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(
      'سلام! 👋\nاز بهستان خسته شدی؟ سروستان رو امتحان کن 👇\n⚡ برنامه هفتگی، کارنامه، معدل و شهریه — همه توی یه اپ مدرن\n🔒 داده‌ها فقط روی گوشی خودت می‌مونه\n🎨 قابلیت تغییر تم و ظاهر سفارشی\n\n📱 نصب: https://mjb4khshi.github.io/sarvestan\nبزن ببین چه خبره!'
    );
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  // فیلتر کردن دروس چارت — اگر چارت خالی باشد، لیست خالی
  const filteredCategories =
    !CURRICULUM || !Array.isArray(CURRICULUM.categories)
      ? []
      : activeCategory === 'all'
        ? CURRICULUM.categories
        : CURRICULUM.categories.filter((c) => c.id === activeCategory);

  return (
    <div className="px-4 pt-4 space-y-4 mobile-pad-bottom">
      {/* ۱. کارت مشخصات دانشجو */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sarv-card p-4 flex items-center gap-3.5"
      >
        {STUDENT.photo ? (
          <img
            src={STUDENT.photo}
            alt=""
            className="w-13 h-13 rounded-2xl object-cover shadow-sm border border-base-500/40 shrink-0"
          />
        ) : (
          <div className="w-13 h-13 rounded-2xl bg-primary text-primary-content font-black text-xl grid place-items-center shrink-0 shadow-sm">
            {(STUDENT.fullName || '؟').slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-bold text-base-content truncate">
              {STUDENT.fullName || '—'}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {gpaStatus && (
                <span className={`text-[10px] px-2 py-0.5 rounded-lg ${gpaStatus.chip}`}>
                  {gpaStatus.label}
                </span>
              )}
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-primary-soft text-primary">
                دانشجوی فعال
              </span>
            </div>
          </div>
          <p className="text-[11px] text-neutral mt-0.5">
            شماره دانشجویی:{' '}
            <span className="font-mono text-base-content font-bold">
              {STUDENT.studentId || '—'}
            </span>
          </p>
          <p className="text-[10.5px] text-neutral truncate mt-0.5">
            {[STUDENT.college, STUDENT.major].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      </motion.section>

      {/* اتصال دیتاخوان */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
      >
        <SessionPanel />
      </motion.section>

      {/* ۲.۵ اشتراک‌گذاری تصویری با تم سرو */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[12.5px] font-bold text-neutral">استوری و اشتراک‌گذاری</h3>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleShareSchedule}
            disabled={!!shareBusy}
            className="sarv-card p-3.5 text-right border border-primary/35 bg-primary-soft/70 hover:bg-primary-soft active:scale-[0.98] transition-all disabled:opacity-60 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-10 h-10 rounded-2xl bg-primary text-primary-content grid place-items-center shadow-sm group-hover:scale-105 transition-transform">
                {shareBusy === 'schedule' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CalendarDays className="w-5 h-5" />
                )}
              </span>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                طرح استوری
              </span>
            </div>
            <p className="text-[13.5px] font-black text-base-content">برنامه هفتگی</p>
            <p className="text-[10.5px] text-neutral mt-0.5">پوستر تم هفتگی با ساعات و اساتید</p>
          </button>

          <button
            type="button"
            onClick={handleShareGpa}
            disabled={!!shareBusy}
            className="sarv-card p-3.5 text-right border border-success/35 bg-success-soft/70 hover:bg-success-soft active:scale-[0.98] transition-all disabled:opacity-60 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-10 h-10 rounded-2xl bg-success text-success-content grid place-items-center shadow-sm group-hover:scale-105 transition-transform">
                {shareBusy === 'gpa' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
              </span>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
                کارت معدل
              </span>
            </div>
            <p className="text-[13.5px] font-black text-base-content">معدل و نمرات</p>
            <p className="text-[10.5px] text-neutral mt-0.5">کارت استوری کارنامه و میانگین کل</p>
          </button>
        </div>
        {shareMsg && !sharePreview && (
          <p className="text-[11px] text-base-content bg-base-500/25 border border-base-500/40 rounded-xl px-3 py-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            {shareMsg}
          </p>
        )}
      </motion.section>

      {/* ۲. دکمه ویژه: معرفی به دیگران (دعوت از دوستان) */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <button
          type="button"
          onClick={() => setReferralModalOpen(true)}
          className="w-full sarv-card p-3.5 flex items-center justify-between gap-3 border border-accent/40 bg-accent-soft text-right active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-accent text-accent-content grid place-items-center shrink-0 shadow-sm">
              <Share2 className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[13.5px] font-black text-base-content">معرفی به دیگران</p>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-accent text-accent-content">
                  پیشنهاد ویژه
                </span>
              </div>
              <p className="text-[11px] text-neutral mt-0.5">
                سروستان را به هم‌دانشگاهی‌ها معرفی کنید
              </p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-accent shrink-0" />
        </button>
      </motion.section>

      {/* ۳. منوی خدمات دانشگاهی */}
      <section className="space-y-1.5">
        <h3 className="text-[12.5px] font-bold text-neutral px-1">خدمات و وضعیت آموزشی</h3>
        <div className="sarv-card overflow-hidden divide-y divide-base-500/30">
          {/* چارت و وضعیت دروس */}
          <button
            type="button"
            onClick={() => setChartModalOpen(true)}
            className="w-full flex items-center justify-between gap-3 p-3.5 text-right hover:bg-base-500/25 active:bg-base-500/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 bg-accent-soft text-accent border border-accent-soft">
                <BookOpenCheck className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13.5px] font-bold text-base-content truncate">چارت و وضعیت دروس</p>
                  <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-accent-soft text-accent">
                    {toFaDigits(CURRICULUM?.passedCredits ?? 0)} از{' '}
                    {toFaDigits(CURRICULUM?.totalCredits ?? 142)} واحد
                  </span>
                </div>
                <p className="text-[10.5px] text-neutral mt-0.5">پیش‌نیازها، سرفصل و دروس باقیمانده</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-neutral shrink-0" />
          </button>

          {/* نامه‌ها و گواهی‌ها */}
          <button
            type="button"
            onClick={() => window.open('https://behestan.kntu.ac.ir/', '_blank')}
            className="w-full flex items-center justify-between gap-3 p-3.5 text-right hover:bg-base-500/25 active:bg-base-500/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 bg-info-soft text-info border border-info-soft">
                <FileText className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[13.5px] font-bold text-base-content truncate">نامه‌ها و گواهی‌ها</p>
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-warn-soft/80 text-warn border border-warn-soft inline-flex items-center gap-1 shrink-0">
                    <ExternalLink className="w-2.5 h-2.5" />
                    ارجاع به بهستان
                  </span>
                </div>
                <p className="text-[10.5px] text-neutral mt-0.5">اشتغال به تحصیل، معرفی‌نامه و مدارک رسمی</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-neutral/70 shrink-0" />
          </button>

          {/* درخواست‌های آموزشی */}
          <button
            type="button"
            onClick={() => window.open('https://behestan.kntu.ac.ir/', '_blank')}
            className="w-full flex items-center justify-between gap-3 p-3.5 text-right hover:bg-base-500/25 active:bg-base-500/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 bg-primary-soft text-primary border border-primary-soft">
                <FileCheck2 className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[13.5px] font-bold text-base-content truncate">پیشخوان خدمت و درخواست‌ها</p>
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-warn-soft/80 text-warn border border-warn-soft inline-flex items-center gap-1 shrink-0">
                    <ExternalLink className="w-2.5 h-2.5" />
                    ارجاع به بهستان
                  </span>
                </div>
                <p className="text-[10.5px] text-neutral mt-0.5">فرم‌های ۲۱۱۲۲، حذف تک‌درس و مصوبات آموزشی</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-neutral/70 shrink-0" />
          </button>
        </div>
      </section>

      {/* ۴. لینک‌های سروستان و دسترسی به وب و دسکتاپ */}
      <section className="space-y-1.5">
        <h3 className="text-[12.5px] font-bold text-neutral px-1">سروستان در بستر وب و افزونه</h3>
        <div className="sarv-card overflow-hidden divide-y divide-base-500/30">
          {/* سایت سروستان */}
          <button
            type="button"
            onClick={() => window.open('https://mjb4khshi.github.io/sarvestan', '_blank')}
            className="w-full flex items-center justify-between gap-3 p-3.5 text-right hover:bg-base-500/25 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                <Globe className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-base-content">وب‌سایت رسمی سروستان</p>
                <p className="text-[10.5px] text-neutral mt-0.5">mjb4khshi.github.io/sarvestan · معرفی و امکانات</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-neutral shrink-0" />
          </button>

          {/* کانال تلگرام سروستان */}
          <button
            type="button"
            onClick={() => window.open('https://t.me/s4rvest4n', '_blank')}
            className="w-full flex items-center justify-between gap-3 p-3.5 text-right hover:bg-base-500/25 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-500 grid place-items-center shrink-0">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-base-content flex items-center gap-1.5">
                  <span>کانال تلگرام سروستان</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-sky-500/15 text-sky-500 font-bold">@s4rvest4n</span>
                </p>
                <p className="text-[10.5px] text-neutral mt-0.5">t.me/s4rvest4n · اخبار آپدیت‌ها و اطلاعیه‌ها</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-neutral shrink-0" />
          </button>

          {/* دانلود افزونه دسکتاپ */}
          <button
            type="button"
            onClick={() => window.open('https://github.com/mjb4khshi/sarvestan/releases', '_blank')}
            className="w-full flex items-center justify-between gap-3 p-3.5 text-right hover:bg-base-500/25 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-success-soft text-success grid place-items-center shrink-0">
                <Download className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-base-content">دانلود افزونه دسکتاپ سروستان</p>
                <p className="text-[10.5px] text-neutral mt-0.5">قابل نصب روی کروم، اج و فایرفاکس</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-neutral shrink-0" />
          </button>

          {/* درباره ما */}
          <button
            type="button"
            onClick={() => setAboutModalOpen(true)}
            className="w-full flex items-center justify-between gap-3 p-3.5 text-right hover:bg-base-500/25 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-secondary-soft text-secondary grid place-items-center shrink-0">
                <Info className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-base-content">درباره سروستان و تیم توسعه</p>
                <p className="text-[10.5px] text-neutral mt-0.5">داستان پروژه و سیستم طراحی Sarv UI</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-neutral shrink-0" />
          </button>
        </div>
      </section>

      {/* شخصی‌سازی ظاهر و آیکون اپلیکیشن */}
      <section className="space-y-1.5">
        <h3 className="text-[12.5px] font-bold text-neutral px-1">شخصی‌سازی ظاهر</h3>
        <div className="sarv-card overflow-hidden divide-y divide-base-500/30">
          <button
            type="button"
            onClick={() => setIconModalOpen(true)}
            className="w-full flex items-center justify-between gap-3 p-3.5 text-right hover:bg-base-500/25 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 transition-transform group-hover:scale-105">
                <SarvIconSvg iconId={currentIconId} size={38} shadow={false} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-bold text-base-content">آیکون اپلیکیشن</p>
                  <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-primary-soft text-primary">
                    ۱۲ طرح
                  </span>
                </div>
                <p className="text-[10.5px] text-neutral mt-0.5">
                  طرح فعال: <span className="font-semibold text-base-content">{currentIcon.name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-primary">تغییر</span>
              <ChevronLeft className="w-4 h-4 text-neutral" />
            </div>
          </button>
        </div>
      </section>

      {/* ۵. ابزارها و تازه‌سازی حافظه */}
      <section className="space-y-1.5">
        <h3 className="text-[12.5px] font-bold text-neutral px-1">تنظیمات داده</h3>
        <div className="sarv-card overflow-hidden divide-y divide-base-500/30">
          <button
            type="button"
            onClick={handleClearCache}
            className="w-full flex items-center justify-between gap-3 p-3.5 text-right hover:bg-base-500/25 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-warn-soft text-warn grid place-items-center shrink-0">
                <RefreshCw className={`w-4.5 h-4.5 ${cacheCleared ? 'animate-spin' : ''}`} />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-base-content">همگام‌سازی و تازه‌سازی حافظه</p>
                <p className="text-[10.5px] text-neutral mt-0.5">
                  {cacheCleared
                    ? 'حافظه موقت تازه شد ✓'
                    : lastSyncFormatted
                      ? `آخرین همگام‌سازی: ${lastSyncFormatted}`
                      : 'پاک‌کردن کش محلی اطلاعات بهستان'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-md bg-primary-soft">
              اجرا
            </span>
          </button>
        </div>
      </section>

      {/* ۶. آخرین وضعیت درخواست‌ها */}
      <section className="sarv-card p-4">
        <h3 className="text-[13px] font-bold text-base-content mb-3">آخرین وضعیت درخواست‌ها</h3>
        <div className="space-y-2.5">
          {REQUESTS_LIVE.length === 0 && (
            <p className="text-[12px] text-neutral text-center py-3">درخواستی ثبت نشده</p>
          )}
          {REQUESTS_LIVE.map((req) => (
            <div key={req.id} className="flex items-center justify-between gap-3 text-[12px]">
              <div className="min-w-0">
                <p className="font-semibold text-base-content truncate">{req.title}</p>
                <p className="text-[10.5px] text-neutral">{req.date}</p>
              </div>
              <span
                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                  req.color === 'success'
                    ? 'bg-success-soft text-success border-success-soft'
                    : req.color === 'info'
                    ? 'bg-info-soft text-info border-info-soft'
                    : 'bg-base-500/30 text-neutral border-base-500/40'
                }`}
              >
                {req.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* دکمه خروج — حذف شد (اضافی بود) */}

      <div className="text-center space-y-1.5 pb-3 pt-1">
        <p className="text-[11px] text-neutral font-medium">
          طراحی و توسعه توسط <span className="font-mono font-bold text-base-content">@mjb4khshi</span> با چای و حوصله بسیار ☕
        </p>
        <p className="text-[10px] text-neutral/60 font-mono">
          نسخه ۱.۰ سروستان همراه · Sarv UI
        </p>
      </div>

      {/* مودال تمام‌صفحه: چارت و وضعیت دروس */}
      <AnimatePresence>
        {chartModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChartModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-5 shadow-2xl h-[88vh] flex flex-col"
            >
              {/* هدر مودال - کاملاً ثابت */}
              <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent text-accent-content grid place-items-center shadow-sm">
                    <BookOpenCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-base-content">چارت و سرفصل دروس</h3>
                    <p className="text-[11px] text-neutral">
                      {(STUDENT.major || STUDENT.college || 'دانشجو')} · فرم ۱۱۱۲۶ بهستان
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChartModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* نوار فیلتر دسته‌بندی دروس - ثابت در بالای محتوا تا با اسکرول یا تغییر لیست تکان نخورد */}
              <div className="pt-3 pb-2 shrink-0">
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar relative">
                  {[
                    { id: 'all', label: 'همه دسته‌ها' },
                    ...(CURRICULUM?.categories || []).map((c) => ({ id: c.id, label: c.title })),
                  ].map((cat) => {
                    const isSelected = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`relative px-3.5 py-1.5 rounded-xl text-[11.5px] whitespace-nowrap transition-colors select-none outline-none ${
                          isSelected
                            ? 'text-primary-content font-black'
                            : 'bg-base-500/20 text-neutral hover:bg-base-500/40 font-medium'
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="curriculumCatPill"
                            className="absolute inset-0 bg-primary rounded-xl z-0 shadow-sm"
                            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* محتوای اسکرول‌پذیر چارت */}
              <div className="overflow-y-auto py-2 pb-16 space-y-3 flex-1 pr-1">
                {/* کارت آمار پیشرفت فارغ‌التحصیلی — فقط از دیتای واقعی */}
                {CURRICULUM ? (
                <div className="sarv-card p-3.5 bg-accent-soft border-accent-soft shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-accent">پیشرفت فارغ‌التحصیلی</span>
                    <span className="text-[13px] font-black text-accent font-mono">
                      {(() => {
                        const total = Number(CURRICULUM.totalCredits) || 0;
                        const passed = Number(CURRICULUM.passedCredits) || 0;
                        if (!total || total <= 0) return '—';
                        const pct = Math.min(100, Math.round((passed / total) * 100));
                        return toFaDigits(pct) + '٪';
                      })()}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-base-500/40 overflow-hidden">
                    {(() => {
                      const total = Number(CURRICULUM.totalCredits) || 0;
                      const passed = Number(CURRICULUM.passedCredits) || 0;
                      const pct = total > 0 ? Math.min(100, Math.max(0, (passed / total) * 100)) : 0;
                      return (
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      );
                    })()}
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[11px]">
                    <div className="rounded-xl p-2 bg-base/50 border border-base-500/20">
                      <span className="text-neutral block text-[10px] font-medium mb-0.5">پاس‌شده</span>
                      <p className="text-success text-[13px] font-black">
                        {toFaDigits(CURRICULUM.passedCredits ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl p-2 bg-base/50 border border-base-500/20">
                      <span className="text-neutral block text-[10px] font-medium mb-0.5">ترم جاری</span>
                      <p className="text-info text-[13px] font-black">
                        {toFaDigits(CURRICULUM.enrolledCredits ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl p-2 bg-base/50 border border-base-500/20">
                      <span className="text-neutral block text-[10px] font-medium mb-0.5">باقیمانده</span>
                      <p className="text-warn text-[13px] font-black">
                        {toFaDigits(CURRICULUM.remainingCredits ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl p-2 bg-base/50 border border-base-500/20">
                      <span className="text-neutral block text-[10px] font-medium mb-0.5">کل چارت</span>
                      <p className="text-accent text-[13px] font-black">
                        {toFaDigits(CURRICULUM.totalCredits ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
                ) : (
                  <p className="text-[12px] text-neutral text-center py-3">
                    دیتای چارت هنوز نیامده — همگام‌سازی را بزن
                  </p>
                )}

                {/* فهرست دسته‌بندی‌ها و دروس با فونت اصلاح‌شده و اعداد فارسی */}
                <div className="space-y-3 min-h-[300px]">
                  {filteredCategories.map((cat) => (
                    <div key={cat.id} className="sarv-card p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-base-500/30">
                        <h4 className="text-[13px] font-bold text-base-content flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: `var(--theme-color-${cat.color || 'primary'})` }}
                          />
                          {cat.title}
                        </h4>
                        <span className="text-[11px] font-bold text-neutral">
                          {toFaDigits(cat.passed)} از {toFaDigits(cat.total)} واحد
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {cat.courses.map((course, ci) => (
                          <div
                            key={ci}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-base-500/15 text-[12px]"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-base-content truncate">{course.name}</p>
                              {course.prereq && (
                                <p className="text-[10px] text-neutral mt-0.5">
                                  پیشنیاز: {toFaDigits(course.prereq)}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-neutral font-bold">
                                {toFaDigits(course.unit)} واحد
                              </span>
                              {course.status === 'dropped' || course.badge === 'حذف اضطراری' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-danger-soft text-danger">
                                  حذف اضطراری
                                </span>
                              ) : course.status === 'waitlist' || course.badge === 'در انتظار' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-warn-soft text-warn">
                                  در انتظار
                                </span>
                              ) : course.status === 'passed' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-success-soft text-success">
                                  پاس شده ({toFaDigits(course.grade)})
                                </span>
                              ) : course.status === 'enrolled' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-info-soft text-info">
                                  در حال اخذ
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-base-500/40 text-neutral">
                                  مانده
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال: معرفی به دیگران */}
      <AnimatePresence>
        {referralModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReferralModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-5 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-base-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent text-accent-content grid place-items-center shadow-sm">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-base-content">معرفی سروستان به دیگران</h3>
                    <p className="text-[11px] text-neutral">دعوت دوستان به داشبورد هوشمند بهستان</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReferralModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3.5 text-right max-h-[70vh] overflow-y-auto">
                <p className="text-[12.5px] text-base-content leading-relaxed">
                  فکر کن یه دوستت هنوز داره با صفحهٔ بهستان کلنجار میره…
                  <br />
                  با یه لینک، بهش بگو که برنامه هفتگی، نمرات، معدل و شهریه‌اش می‌تونه
                  <strong className="text-accent"> سریع‌تر، تمیزتر و بدون استرس</strong> دیده بشه —
                  بدون اینکه حساب یا سروری لازم باشه.
                </p>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: '⚡', label: 'سریع‌تر' },
                    { icon: '🎨', label: 'مدرن‌تر' },
                    { icon: '🔒', label: 'امن‌تر' },
                  ].map((x) => (
                    <div
                      key={x.label}
                      className="rounded-xl bg-accent-soft border border-accent-soft py-2.5"
                    >
                      <span className="text-lg block leading-none">{x.icon}</span>
                      <span className="text-[11px] font-bold text-accent mt-1 block">{x.label}</span>
                    </div>
                  ))}
                </div>

                <div className="sarv-card p-3.5 bg-base-500/15 border-dashed border-base-500/40 text-[12px] leading-relaxed">
                  <p className="text-base-content font-medium mb-2">پیشنهاد آماده برای ارسال:</p>
                  <p className="text-neutral select-all whitespace-pre-wrap font-mono text-[11px]">
                    {'سلام! 👋\nاز بهستان خسته شدی؟ سروستان رو امتحان کن 👇\n⚡ برنامه هفتگی، کارنامه، معدل و شهریه — همه توی یه اپ مدرن\n🔒 داده‌ها فقط روی گوشی خودت می‌مونه\n🎨 قابلیت تغییر تم و ظاهر سفارشی\n\n📱 نصب: https://mjb4khshi.github.io/sarvestan\nبزن ببین چه خبره!'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className={`w-full py-3 rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                    copiedInvite
                      ? 'bg-success text-success-content'
                      : 'bg-accent text-accent-content'
                  }`}
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-4 h-4" />
                      کپی شد — بفرستش! ✓
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      کپی متن دعوت
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال: درباره سروستان */}
      <AnimatePresence>
        {aboutModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAboutModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-5 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-base-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary text-primary-content grid place-items-center shadow-sm">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-base-content">درباره سروستان</h3>
                    <p className="text-[11px] text-neutral">طراحی و توسعه اختصاصی</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAboutModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3.5 text-right max-h-[70vh] overflow-y-auto">
                <p className="text-[12.5px] text-base-content leading-relaxed">
                  خسته شدی از اینکه هر بار برای دیدن برنامه، نمره یا بدهی شهریه باید وارد بهستان شی،
                  صبر کنی تا لود شه، و با اون ظاهر قدیمی کلنجار بری؟
                  <br />
                  <strong className="text-accent">سروستان</strong> همون چیزیه که همیشه می‌خواستی:
                  یه همراه سبک و سریع برای بهستان — بدون دردسر، بدون سرور واسطه، فقط دادهٔ واقعی خودت.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { t: 'برنامه هفتگی', d: 'ماتریس و کارت، با اتاق و استاد' },
                    { t: 'کارنامه و نمرات', d: 'به تفکیک ترم + محاسبه‌گر معدل' },
                    { t: 'امور مالی', d: 'بدهی، پرداختی و ریز تراز' },
                    { t: 'چارت درسی', d: 'وضعیت پاس/مانده با نوار پیشرفت' },
                  ].map((f) => (
                    <div
                      key={f.t}
                      className="rounded-xl bg-base-500/20 border border-base-500/30 p-2.5"
                    >
                      <p className="text-[12px] font-bold text-base-content">{f.t}</p>
                      <p className="text-[10.5px] text-neutral mt-0.5 leading-snug">{f.d}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-success-soft border border-success-soft space-y-1.5">
                  <p className="font-bold text-success text-[12px]">حریم خصوصی — اول از همه</p>
                  <p className="text-[11px] text-neutral leading-relaxed">
                    نه سرور داریم، نه اکانت، نه تبلیغ. کارنامه، مالی و برنامه‌ات فقط و فقط
                    <strong className="text-base-content"> روی دستگاه خودت</strong> ذخیره و پردازش
                    می‌شود. حتی ما هم به داده‌هایت دسترسی نداریم.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-primary-soft border border-primary-soft space-y-1.5">
                  <p className="font-bold text-primary text-[12px]">ساخته‌شده با Sarv UI</p>
                  <p className="text-[11px] text-neutral leading-relaxed">
                    کل رابط کاربری روی دیزاین‌سیستم اختصاصی
                    <strong className="text-base-content"> Sarv UI</strong> ساخته شده — با ۱۵ تم رنگی
                    زنده، فونت ایرانی آراد، و انیمیشن‌های نرم. هر وقت دلت خواست تم عوض کن؛
                    همه‌چیز هماهنگ جابجا می‌شود.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-base-500/20 border border-base-500/30 space-y-2">
                  <p className="font-bold text-base-content text-[12.5px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    درباره توسعه‌دهنده
                  </p>
                  <p className="text-[11.5px] text-neutral leading-relaxed">
                    <strong className="text-base-content">محمدجواد بخشی ایرج</strong>، توسعه‌دهندهٔ سروستان، خودش هم دانشجوی دانشگاه است و درست مثل سایر هم‌دانشگاهی‌ها، رابط کاربری قدیمی، سنگین و نه‌چندان خوشایند سامانهٔ بهستان همیشه روی اعصابش بوده! سروستان حاصل تلاش برای ساخت فضایی مدرن، روان و لذت‌بخش است تا دانشجویان بتوانند امور آموزشی و برنامهٔ هفتگی‌شان را با آرامش و بدون اتلاف وقت پیگیری کنند.
                  </p>
                </div>

                <div className="pt-2 flex justify-between items-center text-[11px] text-neutral border-t border-base-500/30">
                  <span>
                    طراحی و توسعه: <strong className="text-base-content font-mono font-bold">@mjb4khshi</strong>
                  </span>
                  <span className="font-mono">v1.0.0 · 2026</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* پیش‌نمایش تصویر اشتراک با هویت بصری سروستان و دکمه‌های سه‌گانه */}
      <AnimatePresence>
        {sharePreview && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSharePreview(null);
                setShareMsg('');
              }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: '40%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '30%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-4 shadow-2xl max-h-[92vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <svg
                      viewBox="0 0 1080 1080"
                      className="w-full h-full fill-primary drop-shadow-sm"
                    >
                      <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-base-content">
                      {sharePreview.kind === 'gpa' ? 'پوستر استوری کارنامه و معدل' : 'پوستر استوری برنامه هفتگی'}
                    </h3>
                    <p className="text-[10px] text-neutral">طرح رزولوشن بالا ۱۰۸۰×۱۹۲۰ ویژه استوری</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSharePreview(null);
                    setShareMsg('');
                  }}
                  className="w-8 h-8 rounded-full bg-base-500/30 hover:bg-base-500/50 text-neutral grid place-items-center active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* کانتینر اسکرول و پیش‌نمایش تصویر */}
              <div className="flex-1 overflow-y-auto py-3 pr-0.5">
                <div className="relative rounded-2xl overflow-hidden border border-base-500/50 shadow-lg bg-black/40">
                  <img
                    src={sharePreview.url}
                    alt="پیش‌نمایش استوری سروستان"
                    className="w-full h-auto object-contain block"
                  />
                </div>
              </div>

              {shareMsg && (
                <p className="text-[11px] text-primary bg-primary-soft border border-primary/30 rounded-xl px-3 py-1.5 mb-2 text-center font-bold">
                  {shareMsg}
                </p>
              )}

              {/* اکشن بار ۳گانه: اشتراک‌گذاری، دانلود و کپی */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-base-500/30 shrink-0">
                <button
                  type="button"
                  onClick={handleShareNative}
                  className="btn btn-primary !py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  اشتراک‌گذاری
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPreview}
                  className="btn bg-base-500/30 hover:bg-base-500/50 text-base-content border border-base-500/50 !py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  دانلود تصویر
                </button>

                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="btn bg-base-500/30 hover:bg-base-500/50 text-base-content border border-base-500/50 !py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  {copiedPreview ? (
                    <>
                      <Check className="w-4 h-4 text-success" />
                      کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      کپی تصویر
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال تمام‌صفحه: انتخاب آیکون اپلیکیشن */}
      <AnimatePresence>
        {iconModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIconModalOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-5 shadow-2xl max-h-[88vh] flex flex-col"
            >
              {/* هدر مودال */}
              <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0">
                    <SarvIconSvg iconId={currentIconId} size={36} shadow={false} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-base-content">آیکون اپلیکیشن</h3>
                    <p className="text-[11px] text-neutral">طرح آیکون برنامه در صفحه اصلی گوشی (لانچر)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIconModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* اعلان وضعیت تغییر */}
              {iconToast && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-success-soft text-success text-[12px] font-bold flex items-center justify-between border border-success-soft">
                  <span>{iconToast}</span>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                </div>
              )}

              {/* شبکه کارت‌های آیکون */}
              <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
                <div className="grid grid-cols-2 gap-2.5">
                  {appIcons.map((ic) => {
                    const isSelected = currentIconId === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={async () => {
                          await setAppIcon(ic.id);
                          setIconToast(`آیکون برنامه به «${ic.name}» تغییر یافت ✓`);
                          setTimeout(() => setIconToast(''), 2500);
                        }}
                        className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between relative group active:scale-[0.97] ${
                          isSelected
                            ? 'bg-primary-soft/50 border-primary shadow-sm ring-1 ring-primary/40'
                            : 'bg-base-500/15 border-base-500/30 hover:bg-base-500/30 hover:border-base-500/50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-primary text-primary-content grid place-items-center shadow-sm">
                            <Check className="w-3 h-3" />
                          </div>
                        )}

                        <div className="flex items-center gap-2.5 mb-2">
                          <SarvIconSvg iconId={ic.id} size={42} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[12px] font-black text-base-content truncate">
                                {ic.name}
                              </span>
                            </div>
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-base-500/30 text-neutral inline-block mt-0.5">
                              {ic.badge}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-neutral leading-relaxed line-clamp-2">
                          {ic.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* فوتر مودال */}
              <div className="pt-3 border-t border-base-500/30 shrink-0 text-center">
                <p className="text-[10.5px] text-neutral">
                  در برخی گوشی‌ها اعمال آیکون در صفحه اصلی ممکن است ۱ تا ۲ ثانیه زمان ببرد.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
