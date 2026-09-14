import { useEffect, useState, useRef } from 'react';
import {
  renderScheduleImage,
  renderGpaStoryImage,
  canvasToDataUrl,
  downloadBlob,
  copyCanvasToClipboard,
} from '../services/shareImages';
import { useTheme } from '../context/ThemeContext';
import { loadSnapshotData, hasLiveData } from '../services/behestan/store';
import {
  Download,
  Copy,
  RefreshCw,
  Palette,
  Calendar,
  GraduationCap,
  ZoomIn,
  Check,
  ArrowRight,
} from 'lucide-react';

export default function StoryPreviewScreen({ onBack }) {
  const { currentTheme, setTheme, themes, activeThemeMeta } = useTheme();
  const [activePoster, setActivePoster] = useState('both'); // 'schedule' | 'gpa' | 'both'
  const [dataset, setDataset] = useState('hazf'); // 'hazf' | 'wait' | 'current'
  const [loading, setLoading] = useState(false);
  const [scheduleUrl, setScheduleUrl] = useState('');
  const [gpaUrl, setGpaUrl] = useState('');
  const [copiedSchedule, setCopiedSchedule] = useState(false);
  const [copiedGpa, setCopiedGpa] = useState(false);

  const scheduleCanvasRef = useRef(null);
  const gpaCanvasRef = useRef(null);

  // بارگذاری دیتاست و تولید تصاویر
  const generatePosters = async (targetDataset = dataset) => {
    setLoading(true);
    try {
      if (targetDataset !== 'current') {
        const res = await fetch(`/dev-data/${targetDataset}.json`);
        if (res.ok) {
          const data = await res.json();
          loadSnapshotData(data);
        }
      }

      // تولید پوستر برنامه هفتگی
      const sCanvas = await renderScheduleImage({ theme: activeThemeMeta });
      scheduleCanvasRef.current = sCanvas;
      setScheduleUrl(canvasToDataUrl(sCanvas));

      // تولید پوستر کارنامه
      const gCanvas = await renderGpaStoryImage({ theme: activeThemeMeta });
      gpaCanvasRef.current = gCanvas;
      setGpaUrl(canvasToDataUrl(gCanvas));
    } catch (e) {
      console.error('[generate posters]', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePosters(dataset);
  }, [currentTheme, dataset]);

  const handleDownload = (canvas, filename) => {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, filename);
    }, 'image/png', 0.95);
  };

  const handleCopy = async (canvas, setCopied) => {
    if (!canvas) return;
    try {
      await copyCanvasToClipboard(canvas);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 p-4 md:p-8 font-sans" dir="rtl">
      {/* نوار ابزار بالا */}
      <div className="max-w-7xl mx-auto mb-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="بازگشت"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 grid place-items-center">
            <svg viewBox="0 0 1080 1080" className="w-5 h-5 fill-sky-400">
              <path d="M540,167.08 C540,167.08 213.25,912.92 540,912.92 C866.75,912.92 540,167.08 540,167.08 Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              میز کار بررسی و پیش‌نمایش استوری‌های سروستان
              <span className="text-[10px] bg-sky-500/20 text-sky-400 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                ۱۰۸۰×۱۹۲۰ Story
              </span>
            </h1>
            <p className="text-xs text-slate-400">پیش‌نمایش زنده جهت بررسی جزئیات، تایپوگرافی، چیدمان و رنگ‌ها</p>
          </div>
        </div>

        {/* فیلترها و ابزارها */}
        <div className="flex flex-wrap items-center gap-3">
          {/* تب نوع پوستر */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setActivePoster('both')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activePoster === 'both' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              هردو کنار هم
            </button>
            <button
              onClick={() => setActivePoster('schedule')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activePoster === 'schedule' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              برنامه هفتگی
            </button>
            <button
              onClick={() => setActivePoster('gpa')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activePoster === 'gpa' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              کارنامه و معدل
            </button>
          </div>

          {/* انتخاب داده */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-700/60 text-xs">
            <span className="text-slate-400">دیتا:</span>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="hazf" className="bg-slate-800 text-white">دانشجو ۱ (حذف اضطراری)</option>
              <option value="wait" className="bg-slate-800 text-white">دانشجو ۲ (درس در انتظار)</option>
              {hasLiveData() && <option value="current" className="bg-slate-800 text-white">دیتای زندهٔ جاری</option>}
            </select>
          </div>

          {/* انتخاب تم */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-700/60 text-xs">
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={currentTheme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-800 text-white">
                  {t.persianName} ({t.mode === 'dark' ? 'تاریک' : 'روشن'})
                </option>
              ))}
            </select>
          </div>

          {/* بازسازی مجدد */}
          <button
            onClick={() => generatePosters()}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all active:scale-95 disabled:opacity-50"
            title="رندر مجدد پوسترها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ناحیه نمایش پوسترها */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* پوستر افقی برنامه هفتگی (Landscape 16:9) */}
        {(activePoster === 'both' || activePoster === 'schedule') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 grid place-items-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base flex items-center gap-2">
                    پوستر افقی برنامه هفتگی (Landscape)
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ۱۹۲۰ × ۱۰۸۰ Full HD
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">چیدمان عریض با ستون‌های ۳۳۰ پیکسلی، سرستون روزها و استایل اصیل اپ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(scheduleCanvasRef.current, setCopiedSchedule)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 text-slate-200 transition-all"
                >
                  {copiedSchedule ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedSchedule ? 'کپی شد' : 'کپی تصویر'}
                </button>
                <button
                  onClick={() => handleDownload(scheduleCanvasRef.current, 'sarvestan-schedule.png')}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold flex items-center gap-1.5 text-white shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  دانلود با کیفیت بالا (PNG)
                </button>
              </div>
            </div>

            {/* کادر تصویر افقی با نسبت ۱۶:۹ */}
            <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-700/60 shadow-2xl bg-black relative aspect-[16/9]">
              {scheduleUrl ? (
                <img src={scheduleUrl} alt="پوستر افقی برنامه هفتگی" className="w-full h-full object-contain block select-none" />
              ) : (
                <div className="w-full h-full grid place-items-center text-slate-500 text-sm">
                  در حال رندر تصویر افقی برنامه هفتگی...
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              ابعاد ۱۹۲۰ × ۱۰۸۰ پیکسل · استاندارد ۱۶:۹ افقی · ایده‌آل برای والپیپر، پرینت، اشتراک دسکتاپ و نمایش در تبلت
            </p>
          </div>
        )}

        {/* پوستر عمودی کارنامه و معدل (Portrait 9:16) */}
        {(activePoster === 'both' || activePoster === 'gpa') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 grid place-items-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base flex items-center gap-2">
                    پوستر استوری کارنامه و وضعیت تحصیلی
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                      ۱۰۸۰ × ۱۹۲۰ Story 9:16
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">معدل کل، آمار واحدها، نوار پیشرفت و نمرات رسمی</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(gpaCanvasRef.current, setCopiedGpa)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 text-slate-200 transition-all"
                >
                  {copiedGpa ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedGpa ? 'کپی شد' : 'کپی تصویر'}
                </button>
                <button
                  onClick={() => handleDownload(gpaCanvasRef.current, 'sarvestan-gpa.png')}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold flex items-center gap-1.5 text-white shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  دانلود با کیفیت بالا (PNG)
                </button>
              </div>
            </div>

            {/* کادر تصویر عمودی ۹:۱۶ */}
            <div className="w-full max-w-[420px] rounded-2xl overflow-hidden border-2 border-slate-700/60 shadow-2xl bg-black relative aspect-[9/16]">
              {gpaUrl ? (
                <img src={gpaUrl} alt="پوستر کارنامه و معدل" className="w-full h-full object-contain block select-none" />
              ) : (
                <div className="w-full h-full grid place-items-center text-slate-500 text-sm">
                  در حال رندر تصویر استوری...
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              ابعاد ۱۰۸۰ × ۱۹۲۰ پیکسل · فرمت PNG شفاف · بهینه‌سازی‌شده برای ابعاد استوری اینستاگرام و تلگرام
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
