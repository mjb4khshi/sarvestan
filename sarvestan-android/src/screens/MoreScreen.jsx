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
import { toFaDigits } from '../utils/faDigits';
import {
  renderScheduleImage,
  renderGpaStoryImage,
  shareCanvas,
  canvasToDataUrl,
} from '../services/shareImages';

export default function MoreScreen({ onNavigate, initialChartOpen = false }) {
  const vm = getViewModel();
  const { workflows, sync } = useSarvestanData();
  const { activeThemeMeta } = useTheme();
  // چارت: فقط از دیتای زنده — بدون mock
  const CURRICULUM = vm.curriculum;
  const STUDENT = vm.student || {
    fullName: '',
    studentId: '',
    college: '',
    major: '',
  };
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
  const [sharePreview, setSharePreview] = useState(null); // { url, kind }
  const [shareMsg, setShareMsg] = useState('');

  const handleShareSchedule = async () => {
    if (shareBusy) return;
    setShareBusy('schedule');
    setShareMsg('');
    try {
      const canvas = await renderScheduleImage({ theme: activeThemeMeta });
      setSharePreview({ url: canvasToDataUrl(canvas), kind: 'schedule', canvas });
      const r = await shareCanvas(canvas, {
        filename: 'sarvestan-schedule.png',
        title: 'برنامه هفتگی من | سروستان',
      });
      if (r === 'downloaded') setShareMsg('تصویر دانلود شد — می‌توانی در استوری بگذاری');
      if (r === 'cancelled') setShareMsg('');
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
      setSharePreview({ url: canvasToDataUrl(canvas), kind: 'gpa', canvas });
      const r = await shareCanvas(canvas, {
        filename: 'sarvestan-gpa.png',
        title: 'کارنامه من | سروستان',
      });
      if (r === 'downloaded') setShareMsg('تصویر دانلود شد — آمادهٔ استوری');
      if (r === 'cancelled') setShareMsg('');
    } catch (e) {
      console.error('[share gpa]', e);
      setShareMsg('خطا در ساخت تصویر: ' + String(e?.message || e));
    } finally {
      setShareBusy('');
    }
  };

  const handleShareAgain = async () => {
    if (!sharePreview?.canvas) return;
    await shareCanvas(sharePreview.canvas, {
      filename: sharePreview.kind === 'gpa' ? 'sarvestan-gpa.png' : 'sarvestan-schedule.png',
      title: 'سروستان',
    });
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
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold text-base-content truncate">
              {STUDENT.fullName || '—'}
            </p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-primary-soft text-primary border border-primary-soft">
              دانشجوی فعال
            </span>
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
        className="space-y-1.5"
      >
        <h3 className="text-[12.5px] font-bold text-neutral px-1">اشتراک‌گذاری تصویری</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleShareSchedule}
            disabled={!!shareBusy}
            className="sarv-card p-3.5 text-right border border-primary/30 bg-primary-soft active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <span className="w-10 h-10 rounded-xl bg-primary text-primary-content grid place-items-center shadow-sm mb-2">
              {shareBusy === 'schedule' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CalendarDays className="w-5 h-5" />
              )}
            </span>
            <p className="text-[13px] font-black text-base-content">برنامه هفتگی</p>
            <p className="text-[10.5px] text-neutral mt-0.5">استوری با رنگ‌های تم فعلی</p>
          </button>

          <button
            type="button"
            onClick={handleShareGpa}
            disabled={!!shareBusy}
            className="sarv-card p-3.5 text-right border border-success/30 bg-success-soft active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <span className="w-10 h-10 rounded-xl bg-success text-success-content grid place-items-center shadow-sm mb-2">
              {shareBusy === 'gpa' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
            </span>
            <p className="text-[13px] font-black text-base-content">معدل و نمرات</p>
            <p className="text-[10.5px] text-neutral mt-0.5">کارت استوری کارنامه</p>
          </button>
        </div>
        {shareMsg && (
          <p className="text-[11px] text-neutral bg-base-500/20 border border-base-500/40 rounded-xl px-3 py-2">
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
                <p className="text-[13.5px] font-bold text-base-content truncate">نامه‌ها و گواهی‌ها</p>
                <p className="text-[10.5px] text-neutral mt-0.5">اشتغال به تحصیل، معرفی‌نامه و مدارک</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-neutral shrink-0" />
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
                <p className="text-[13.5px] font-bold text-base-content truncate">پیشخوان خدمت و درخواست‌ها</p>
                <p className="text-[10.5px] text-neutral mt-0.5">فرم‌های ۲۱۱۲۲، حذف تک‌درس و مصوبات</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-neutral shrink-0" />
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
                  {cacheCleared ? 'حافظه موقت تازه شد ✓' : 'پاک‌کردن کش محلی اطلاعات بهستان'}
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

      <div className="text-center space-y-1 pb-2">
        <p className="text-[10.5px] text-neutral">نسخه ۰.۳.۰ سروستان همراه (اندروید)</p>
        <p className="text-[10px] text-neutral/70">توسعه‌یافته بر پایه سیستم طراحی Sarv UI</p>
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
                    <p className="text-[11px] text-neutral">مهندسی کامپیوتر · فرم ۱۱۱۲۶ بهستان</p>
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

                <div className="p-3 rounded-2xl bg-base-500/20 border border-base-500/30 space-y-1.5">
                  <p className="font-bold text-base-content text-[12px]">فنی‌ها خوششان می‌آید</p>
                  <ul className="text-[11px] text-neutral space-y-1 leading-relaxed list-disc pr-4">
                    <li>بدون سرور واسط — مستقیم از API بهستان (همان‌طور که افزونهٔ دسکتاپ کار می‌کند)</li>
                    <li>React 19 + Vite + Tailwind — همین کد پایهٔ نسخهٔ اندروید (Capacitor) است</li>
                    <li>منبع‌باز و قابل مطالعه برای دانشجویان نرم‌افزار</li>
                  </ul>
                </div>

                <div className="pt-2 flex justify-between items-center text-[11px] text-neutral border-t border-base-500/30">
                  <span>
                    توسعه‌دهنده: <strong className="text-base-content">MJ</strong>
                  </span>
                  <span className="font-mono">v0.3.0 · 2026</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* پیش‌نمایش تصویر اشتراک */}
      <AnimatePresence>
        {sharePreview && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSharePreview(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '40%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '30%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-4 shadow-2xl max-h-[92vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
                <h3 className="text-[14px] font-bold text-base-content">
                  پیش‌نمایش {sharePreview.kind === 'gpa' ? 'کارنامه' : 'برنامه هفتگی'}
                </h3>
                <button
                  type="button"
                  onClick={() => setSharePreview(null)}
                  className="w-8 h-8 rounded-full bg-base-500/30 text-neutral grid place-items-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3">
                <img
                  src={sharePreview.url}
                  alt="پیش‌نمایش"
                  className="w-full rounded-2xl border border-base-500/40 shadow-lg"
                />
              </div>
              <button
                type="button"
                onClick={handleShareAgain}
                className="btn btn-primary w-full !py-3 text-[13px] font-bold mt-2 shrink-0"
              >
                <Share2 className="w-4 h-4" />
                اشتراک‌گذاری دوباره
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
