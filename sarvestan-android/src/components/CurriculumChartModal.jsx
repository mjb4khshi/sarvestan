import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Search,
  Share2,
  Download,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  GraduationCap,
  ExternalLink,
  Award,
  Network,
} from 'lucide-react';
import { toFaDigits, toPersianCourseName } from '../utils/faDigits';
import { useTheme } from '../context/ThemeContext';
import CurriculumGraphView from './CurriculumGraphView';
import {
  renderCurriculumPoster,
  shareCanvas,
  canvasToDataUrl,
  downloadBlob,
  copyCanvasToClipboard,
} from '../services/shareImages';

export default function CurriculumChartModal({
  isOpen,
  onClose,
  curriculumState,
  student,
}) {
  const { currentTheme } = useTheme();

  // تب نمای کلی: 'categories' (سرفصل‌ها و تطبیق)، 'graph' (گراف تعاملی جریان)، یا 'all' (فهرست جامع)
  const [activeTab, setActiveTab] = useState('categories');

  // فیلتر سریع وضعیت: 'all' | 'available' | 'locked' | 'passed' | 'enrolled'
  const [statusFilter, setStatusFilter] = useState('all');

  // جستجو در نام یا کد درس
  const [searchQuery, setSearchQuery] = useState('');

  // درس انتخاب‌شده برای نمایش مودال جزئیات پیش‌نیازها و پیش‌درآمدها
  const [selectedCourse, setSelectedCourse] = useState(null);

  // پیش‌نمایش پوستر جهت اشتراک‌گذاری
  const [posterPreview, setPosterPreview] = useState(null);
  const [posterGenerating, setPosterGenerating] = useState(false);
  const [posterMsg, setPosterMsg] = useState('');
  const [copiedPoster, setCopiedPoster] = useState(false);

  if (!isOpen || !curriculumState) return null;

  const {
    degreeTitle,
    university,
    totalCredits,
    passedCredits,
    enrolledCredits,
    remainingCredits,
    progressPercent,
    availableCount,
    lockedCount,
    passedCount,
    semesters = [],
    categories = [],
    allCourses = [],
  } = curriculumState;

  // فیلتر دروس بر اساس جستجو و وضعیت
  const filterCourse = (c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const codeMatch = String(c.code || '').includes(q);
      if (!nameMatch && !codeMatch) return false;
    }
    return true;
  };

  // تولید پوستر گرافیکی چارت
  const handleGeneratePoster = async () => {
    setPosterGenerating(true);
    setPosterMsg('');
    try {
      const canvas = await renderCurriculumPoster({
        theme: currentTheme,
        curriculumState,
        student,
      });
      const url = canvasToDataUrl(canvas);
      setPosterPreview({ canvas, url });
    } catch (err) {
      console.error('[Poster Error]', err);
    } finally {
      setPosterGenerating(false);
    }
  };

  const handleSharePoster = async () => {
    if (!posterPreview?.canvas) return;
    try {
      const res = await shareCanvas(
        posterPreview.canvas,
        `چارت تحصیلی ${student?.fullName || ''} — سروستان`,
        'sarvestan-curriculum.png'
      );
      if (!res.shared) {
        setPosterMsg(res.reason || 'امکان اشتراک مستقیم نیست؛ لطفاً دانلود کنید.');
      }
    } catch (e) {
      setPosterMsg('خطا در اشتراک‌گذاری: ' + String(e?.message || e));
    }
  };

  const handleDownloadPoster = () => {
    if (!posterPreview?.canvas) return;
    downloadBlob(posterPreview.canvas, 'sarvestan-curriculum-chart.png');
    setPosterMsg('تصویر با موفقیت ذخیره شد ✓');
    setTimeout(() => setPosterMsg(''), 3000);
  };

  const handleCopyPoster = async () => {
    if (!posterPreview?.canvas) return;
    const ok = await copyCanvasToClipboard(posterPreview.canvas);
    if (ok) {
      setCopiedPoster(true);
      setPosterMsg('تصویر چارت در کلیپ‌بورد کپی شد ✓');
      setTimeout(() => {
        setCopiedPoster(false);
        setPosterMsg('');
      }, 3000);
    } else {
      setPosterMsg('مرورگر اجازه کپی تصویر را نداد — از دانلود استفاده کنید.');
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* لایه تاریک پشت‌زمینه */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* کانتینر اصلی مودال تمام‌صفحه */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 w-full max-w-[620px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/40 p-4 sm:p-5 shadow-2xl h-[92vh] flex flex-col overflow-hidden"
      >
        {/* ۱. هدر ثابت با عنوان رشته، خروجی پوستر و دکمه بستن */}
        <div className="flex items-center justify-between pb-3.5 border-b border-base-500/30 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-accent-soft text-accent grid place-items-center shrink-0 border border-accent/20 shadow-xs">
              <BookOpenCheck className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] sm:text-[16px] font-black text-base-content truncate">
                  چارت و نقشه راه تحصیلی
                </h3>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
                  آزمایشی · در دست توسعه
                </span>
              </div>
              <p className="text-[11px] text-neutral truncate mt-0.5">
                {degreeTitle} · {toFaDigits(totalCredits)} واحد مصوب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGeneratePoster}
              disabled={posterGenerating}
              className="px-3 py-1.5 rounded-xl bg-accent text-accent-content font-bold text-[11.5px] flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>پوستر چارت</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ۲. محتوای اسکرول‌پذیر اصلی */}
        <div className="overflow-y-auto flex-1 py-3 space-y-3.5 pr-0.5 no-scrollbar">
          {/* بنر اطلاع‌رسانی نسخه آزمایشی و در دست توسعه */}
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              این بخش به‌صورت <strong>آزمایشی و در دست توسعه</strong> فعال شده است. داده‌های چارت در حال تکمیل بوده و ممکن است شامل مغایرت‌های جزئی باشد.
            </span>
          </div>

          {/* کارت وضعیت و پیشرفت کل دوره (کاملاً داینامیک) */}
          <div className="sarv-card p-4 bg-accent-soft/30 border border-accent/25 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5 text-accent" />
                <span className="text-[13px] font-black text-base-content">
                  پیشرفت فارغ‌التحصیلی
                </span>
              </div>
              <span className="text-[14px] font-black text-accent font-mono">
                {toFaDigits(progressPercent)}٪
              </span>
            </div>

            {/* نوار متریال مدرن پیشرفت (رنگ یکدست بدون گرادیان) */}
            <div className="h-3 rounded-full bg-base-500/40 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 shadow-sm"
                style={{ width: `${Math.max(4, Math.min(100, progressPercent))}%` }}
              />
            </div>

            {/* کارت‌های ۴ گانه آمار واحدها */}
            <div className="grid grid-cols-4 gap-1.5 mt-3 text-center">
              <div className="rounded-xl p-2 bg-base/60 border border-base-500/20 shadow-2xs">
                <span className="text-[10px] text-neutral block font-medium">پاس‌شده</span>
                <p className="text-[14px] font-black text-success mt-0.5">
                  {toFaDigits(passedCredits)}
                </p>
              </div>
              <div className="rounded-xl p-2 bg-base/60 border border-base-500/20 shadow-2xs">
                <span className="text-[10px] text-neutral block font-medium">ترم جاری</span>
                <p className="text-[14px] font-black text-accent mt-0.5">
                  {toFaDigits(enrolledCredits)}
                </p>
              </div>
              <div className="rounded-xl p-2 bg-base/60 border border-base-500/20 shadow-2xs">
                <span className="text-[10px] text-neutral block font-medium">مجاز بعد ⭐</span>
                <p className="text-[14px] font-black text-warning mt-0.5">
                  {toFaDigits(availableCount)}
                </p>
              </div>
              <div className="rounded-xl p-2 bg-base/60 border border-base-500/20 shadow-2xs">
                <span className="text-[10px] text-neutral block font-medium">باقیمانده</span>
                <p className="text-[14px] font-black text-neutral mt-0.5">
                  {toFaDigits(remainingCredits)}
                </p>
              </div>
            </div>
          </div>

          {/* ۳. کنترل‌های تغییر نما و فیلترها */}
          <div className="space-y-2.5">
            {/* انتخابگر ۳ نمای سرفصل‌ها، گراف تعاملی جریان، یا فهرست جامع دروس */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-base-500/20 border border-base-500/30 relative">
              {[
                { id: 'categories', label: 'سرفصل‌ها و دسته‌بندی‌ها', icon: Layers },
                { id: 'graph', label: 'گراف تعاملی جریان پیش‌نیازها', icon: Network },
                { id: 'all', label: 'فهرست جامع دروس', icon: BookOpenCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-1 rounded-xl text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors relative z-10 cursor-pointer ${
                      isActive ? 'text-primary-content' : 'text-neutral hover:text-base-content'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeChartTabPill"
                        className="absolute inset-0 bg-primary rounded-xl shadow-xs -z-10"
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* جعبه جستجو و فیلتر وضعیت */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در نام یا کد درس..."
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-base-500/20 border border-base-500/30 text-[11.5px] text-base-content placeholder-neutral focus:outline-none focus:border-primary"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral hover:text-base-content cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* فیلترهای چیپ وضعیت با انیمیشن لغزان */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] relative">
              {[
                { id: 'all', label: 'همه دروس' },
                { id: 'available', label: `مجاز ترم بعد (${toFaDigits(availableCount)}) ⭐` },
                { id: 'passed', label: `پاس‌شده (${toFaDigits(passedCount)}) ✓` },
                { id: 'enrolled', label: `در حال اخذ (${toFaDigits(allCourses.filter((c) => c.status === 'enrolled').length)}) ⏳` },
                { id: 'locked', label: `قفل‌شده (${toFaDigits(lockedCount)}) 🔒` },
              ].map((f) => {
                const isSel = statusFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-colors cursor-pointer relative z-10 ${
                      isSel
                        ? 'text-accent-content'
                        : 'text-neutral hover:text-base-content bg-base-500/20 hover:bg-base-500/30'
                    }`}
                  >
                    {isSel && (
                      <motion.div
                        layoutId="activeStatusFilterPill"
                        className="absolute inset-0 bg-accent rounded-xl shadow-2xs -z-10"
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
                      />
                    )}
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ۴. نمایش نمای انتخابی بدون هیچ ترم‌بندی */}
          {activeTab === 'graph' ? (
            /* نمای گراف تعاملی روابط و جریان پیش‌نیازها */
            <CurriculumGraphView
              allCourses={curriculumState?.allCourses || []}
              categories={categories}
              onSelectCourseDetails={(c) => setSelectedCourse(c)}
            />
          ) : activeTab === 'all' ? (
            /* نمای فهرست جامع تمام دروس چارت */
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allCourses.filter(filterCourse).map((c) => (
                  <button
                    key={c.code || c.name}
                    type="button"
                    onClick={() => setSelectedCourse(c)}
                    className="p-3 rounded-2xl bg-base-500/15 hover:bg-base-500/25 border border-base-500/20 text-right flex flex-col justify-between gap-1.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12.5px] font-black text-base-content line-clamp-1">
                        {toPersianCourseName(c.name)}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-base-500/25 text-neutral shrink-0">
                        {toFaDigits(c.units)} واحد
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-neutral pt-1 border-t border-base-500/15">
                      <span className="font-bold">{c.category || 'درس دانشگاهی'}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          c.status === 'passed'
                            ? 'bg-success-soft text-success'
                            : c.status === 'enrolled'
                            ? 'bg-accent-soft text-accent'
                            : c.status === 'available'
                            ? 'bg-warning-soft text-warning'
                            : 'bg-base-500/30 text-neutral'
                        }`}
                      >
                        {c.status === 'passed'
                          ? `پاس (${c.gradeDisplay})`
                          : c.status === 'enrolled'
                          ? 'در حال اخذ'
                          : c.status === 'available'
                          ? 'مجاز ⭐'
                          : 'قفل 🔒'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* نمای سرفصل‌ها و دسته‌بندی‌ها (تطبیق) */
            <div className="space-y-3">
              {categories.map((cat) => {
                const catFiltered = (cat.courses || []).filter(filterCourse);
                if (catFiltered.length === 0 && (searchQuery || statusFilter !== 'all')) return null;

                return (
                  <div
                    key={cat.id || cat.title}
                    className="sarv-card p-3.5 space-y-2.5 border border-base-500/30"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-base-500/30">
                      <div>
                        <h4 className="text-[13.5px] font-black text-base-content">
                          {cat.title}
                        </h4>
                        <p className="text-[10px] text-neutral mt-0.5">
                          حداقل واحد مصوب: {toFaDigits(cat.minUnits || cat.totalUnits)} واحد
                        </p>
                      </div>
                      <span className="text-[12px] font-black text-accent">
                        {toFaDigits(cat.passedUnits)} از {toFaDigits(cat.totalUnits)} واحد
                      </span>
                    </div>

                    {/* لیست دروس در این سرفصل */}
                    <div className="space-y-1.5">
                      {catFiltered.map((c) => (
                        <button
                          key={c.code || c.name}
                          type="button"
                          onClick={() => setSelectedCourse(c)}
                          className="w-full p-2.5 rounded-xl bg-base-500/15 hover:bg-base-500/25 border border-base-500/20 text-right flex items-center justify-between gap-2 transition-all cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-base-content truncate">
                              {toPersianCourseName(c.name)}
                            </p>
                            <p className="text-[10px] text-neutral mt-0.5">
                              {c.code ? `کد ${toFaDigits(c.code)}` : ''} · {toFaDigits(c.units)} واحد
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <span
                              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                                c.status === 'passed'
                                  ? 'bg-success-soft text-success'
                                  : c.status === 'enrolled'
                                  ? 'bg-accent-soft text-accent'
                                  : c.status === 'available'
                                  ? 'bg-warning-soft text-warning'
                                  : 'bg-base-500/30 text-neutral'
                              }`}
                            >
                              {c.status === 'passed'
                                ? `پاس (${c.gradeDisplay})`
                                : c.status === 'enrolled'
                                ? 'جاری'
                                : c.status === 'available'
                                ? 'مجاز ⭐'
                                : 'قفل 🔒'}
                            </span>
                            <ChevronLeft className="w-3.5 h-3.5 text-neutral" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ۵. شیت/مودال جزئیات درس و پیش‌نیازها */}
        <AnimatePresence>
          {selectedCourse && (
            <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCourse(null)}
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              />

              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
              >
                {/* هدر درس */}
                <div className="flex items-start justify-between pb-3 border-b border-base-500/30">
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-accent-soft text-accent mb-1 inline-block">
                      {selectedCourse.category || 'درس دانشگاهی'} · {toFaDigits(selectedCourse.units)} واحد
                    </span>
                    <h3 className="text-[16px] font-black text-base-content mt-1">
                      {toPersianCourseName(selectedCourse.name)}
                    </h3>
                    <p className="text-[11px] text-neutral mt-0.5">
                      کد درس: {toFaDigits(selectedCourse.code || 'ـ')} · {toFaDigits(selectedCourse.units)} واحد
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(null)}
                    className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* وضعیت فعلی دانشجو در این درس */}
                <div className="p-3 rounded-2xl bg-base-500/20 border border-base-500/30 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-neutral">وضعیت شما:</span>
                  <span
                    className={`text-[12px] font-black px-2.5 py-1 rounded-xl ${
                      selectedCourse.status === 'passed'
                        ? 'bg-success text-success-content'
                        : selectedCourse.status === 'enrolled'
                        ? 'bg-accent text-accent-content'
                        : selectedCourse.status === 'available'
                        ? 'bg-warning text-warning-content'
                        : 'bg-base-500/50 text-neutral'
                    }`}
                  >
                    {selectedCourse.status === 'passed'
                      ? `پاس‌شده با نمره ${selectedCourse.gradeDisplay || 'قبول'}`
                      : selectedCourse.status === 'enrolled'
                      ? 'در حال اخذ در ترم جاری'
                      : selectedCourse.status === 'available'
                      ? 'مجاز به اخذ در ترم بعد ⭐'
                      : 'قفل — نیاز به پاس کردن پیش‌نیاز 🔒'}
                  </span>
                </div>

                {/* فهرست پیش‌نیازها با وضعیت قبولی یا مانده */}
                <div className="space-y-2">
                  <h4 className="text-[13px] font-black text-base-content flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-accent" />
                    <span>پیش‌نیازها ({toFaDigits(selectedCourse.prerequisites?.length || 0)})</span>
                  </h4>

                  {selectedCourse.prerequisites?.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedCourse.prerequisites.map((p, pi) => (
                        <div
                          key={pi}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-[11.5px] ${
                            p.isPassed
                              ? 'bg-success-soft/30 border-success/30 text-success'
                              : 'bg-danger-soft/30 border-danger/30 text-danger'
                          }`}
                        >
                          <span className="font-bold">{toPersianCourseName(p.name)}</span>
                          <span className="text-[11px] font-black flex items-center gap-1">
                            {p.isPassed ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>پاس شده ✓</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5" />
                                <span>هنوز پاس نشده ❌</span>
                              </>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral bg-base-500/15 p-2 rounded-xl">
                      این درس پیش‌نیازی ندارد و در صورت تمایل قابل اخذ است.
                    </p>
                  )}
                </div>

                {/* هم‌نیازها */}
                {selectedCourse.corequisites?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-black text-base-content flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-info" />
                      <span>هم‌نیازها ({toFaDigits(selectedCourse.corequisites.length)})</span>
                    </h4>
                    <div className="space-y-1.5">
                      {selectedCourse.corequisites.map((co, ci) => (
                        <div
                          key={ci}
                          className="p-2.5 rounded-xl bg-info-soft/30 border border-info/30 text-[11.5px] text-info font-bold flex items-center justify-between"
                        >
                          <span>{toPersianCourseName(co.name)}</span>
                          <span className="text-[10.5px]">هم‌زمان در یک ترم</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* دروس زنجیره‌ای و بازگشایی‌شونده */}
                {(() => {
                  const allUnlocks = selectedCourse.unlocks || [];
                  const chartUnlocks = allUnlocks.filter((u) => u.inCurriculum);

                  return (
                    <div className="space-y-2">
                      <h4 className="text-[12.5px] font-black text-base-content flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-warning" />
                          دروس زنجیره‌ای و بازگشایی‌شونده در چارت ({toFaDigits(chartUnlocks.length)})
                        </span>
                        {chartUnlocks.length > 0 && (
                          <span className="text-[9.5px] text-primary font-bold">
                            اولویت تحصیلی
                          </span>
                        )}
                      </h4>

                      {chartUnlocks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {chartUnlocks.map((u, ui) => (
                            <div
                              key={ui}
                              className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-right flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-[11.5px] font-black text-base-content truncate">
                                  {toPersianCourseName(u.name)}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-neutral mt-0.5">
                                  {u.units && <span>{toFaDigits(u.units)} واحد</span>}
                                </div>
                              </div>
                              {u.status && (
                                <span
                                  className={`shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${
                                    u.status === 'passed'
                                      ? 'bg-success/20 text-success'
                                      : u.status === 'enrolled'
                                      ? 'bg-accent/20 text-accent'
                                      : u.status === 'available'
                                      ? 'bg-warning/20 text-warning'
                                      : 'bg-base-500/25 text-neutral'
                                  }`}
                                >
                                  {u.status === 'passed' && 'پاس شده'}
                                  {u.status === 'enrolled' && 'در حال اخذ'}
                                  {u.status === 'available' && 'مجاز'}
                                  {u.status === 'locked' && 'قفل'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-neutral bg-base-500/10 p-2.5 rounded-xl border border-base-500/15">
                          در چارت این رشته، درسی مستقیماً پس از این درس پیش‌نیاز قرار نگرفته است.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ۶. مودال پیش‌نمایش و همرسانی پوستر گرافیکی چارت */}
        <AnimatePresence>
          {posterPreview && (
            <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPosterPreview(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />

              <motion.div
                initial={{ y: '30%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '30%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="relative z-10 w-full max-w-[800px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-4 shadow-2xl max-h-[92vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
                  <div>
                    <h3 className="text-[14px] font-black text-base-content">
                      پوستر گرافیکی چارت تحصیلی (افقی)
                    </h3>
                    <p className="text-[10px] text-neutral">
                      کیفیت بالا ۱۹۲۰×۱۰۸۰ افقی (فلوچارت ورک‌فلو و گراف جریان تحصیلی)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPosterPreview(null)}
                    className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* پیش‌نمایش تصویر پوستر */}
                <div className="flex-1 overflow-y-auto py-3">
                  <div className="rounded-2xl overflow-hidden border border-base-500/50 shadow-lg bg-black/40">
                    <img
                      src={posterPreview.url}
                      alt="پوستر چارت تحصیلی سروستان"
                      className="w-full h-auto object-contain block"
                    />
                  </div>
                </div>

                {posterMsg && (
                  <p className="text-[11px] text-primary bg-primary-soft border border-primary/30 rounded-xl px-3 py-1.5 mb-2 text-center font-bold">
                    {posterMsg}
                  </p>
                )}

                {/* دکمه‌های اکشن سه‌گانه */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-base-500/30 shrink-0">
                  <button
                    type="button"
                    onClick={handleSharePoster}
                    className="py-2.5 rounded-xl bg-primary text-primary-content font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>اشتراک</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPoster}
                    className="py-2.5 rounded-xl bg-base-500/30 hover:bg-base-500/50 text-base-content border border-base-500/40 font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPoster}
                    className="py-2.5 rounded-xl bg-base-500/30 hover:bg-base-500/50 text-base-content border border-base-500/40 font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    {copiedPoster ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span>کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی تصویر</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
