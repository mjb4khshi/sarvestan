import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  Rocket,
  Download,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Check,
  Loader2,
  Globe,
} from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import { CURRENT_VERSION, FALLBACK_APK_URL } from '../services/updater';

const SarvestanInstaller = registerPlugin('SarvestanInstaller');
const OFFICIAL_SITE_URL = 'https://mjb4khshi.github.io/sarvestan';

/**
 * مودال اعلان و دریافت به‌روزرسانی سروستان
 * دانلود مستقیم درون‌برنامه‌ای APK بدون خروج به مرورگر با نمایش نوار پیشرفت زنده
 */
export default function UpdateModal({ release, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null); // { percent, total, current }
  const [downloadError, setDownloadError] = useState('');
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  if (!release) return null;

  const tagName = release.tagName || 'نسخه جدید';
  const releaseTitle = release.name || release.tagName || 'به‌روزرسانی جدید';
  const isPrerelease = Boolean(release.isPrerelease);
  const downloadUrl = release.apkUrl || FALLBACK_APK_URL;

  // محاسبه حجم به مگابایت در صورت وجود
  let sizeText = '';
  if (release.apkSize && release.apkSize > 0) {
    const mb = (release.apkSize / (1024 * 1024)).toFixed(1);
    sizeText = `${toFaDigits(mb)} مگابایت`;
  }

  // تاریخ انتشار
  let dateText = '';
  if (release.publishedAt) {
    try {
      const d = new Date(release.publishedAt);
      dateText = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {}
  }

  const handleDownload = async () => {
    if (isDownloading) return;
    setDownloadError('');

    // اگر در اپلیکیشن نیتیو اندروید باشیم، مستقیماً درون برنامه دانلود و نصب می‌کنیم
    if (Capacitor.isNativePlatform()) {
      setIsDownloading(true);
      setDownloadProgress({ percent: 0, total: 0, current: 0 });

      let listenerHandle = null;
      try {
        listenerHandle = await SarvestanInstaller.addListener(
          'downloadProgress',
          (progress) => {
            setDownloadProgress(progress);
            if (progress.percent >= 100) {
              setDownloadCompleted(true);
            }
          }
        );

        await SarvestanInstaller.downloadAndInstall({
          url: downloadUrl,
          title: releaseTitle,
        });
      } catch (err) {
        console.error('[InAppInstall] Error:', err);
        setDownloadError(err?.message || 'خطا در دانلود خودکار. باز کردن در مرورگر...');
        // فال‌بک در صورت بروز خطای نیتیو
        setTimeout(() => {
          window.open(downloadUrl, '_blank');
        }, 1500);
      } finally {
        if (listenerHandle) {
          try {
            listenerHandle.remove();
          } catch {}
        }
        setIsDownloading(false);
      }
    } else {
      // در مرورگر وب، تریگر دانلود مستقیم
      try {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = release.apkName || 'sarvestan.apk';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        window.open(downloadUrl, '_blank');
      }
    }
  };

  const handleOpenSite = () => {
    window.open(OFFICIAL_SITE_URL, '_blank');
  };

  const formatMarkdownInline = (text) => {
    if (!text) return null;
    const parts = [];
    const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(
          <strong key={key++} className="font-black text-base-content">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        parts.push(
          <code
            key={key++}
            className="font-mono bg-base-500/30 px-1 py-0.5 rounded text-[11px] text-primary"
          >
            {match[3]}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // پردازش متن تغییرات برای نمایش زیبا و استاندارد مارک‌داون
  const renderChangelog = () => {
    const rawBody = (release.body || '').trim();
    if (!rawBody) {
      return (
        <p className="text-[12px] text-neutral leading-relaxed">
          در این نسخه بهبود پایداری، عملکرد و رفع باگ‌های گزارش‌شده اعمال شده است.
        </p>
      );
    }

    const lines = rawBody.split('\n');
    return (
      <div className="space-y-1.5 text-right">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          if (/^---+$/.test(trimmed)) {
            return <hr key={idx} className="my-2 border-base-500/30" />;
          }

          const isHeader = /^#+\s+/.test(trimmed);
          const isListItem = /^[-*•]\s+/.test(trimmed);
          const cleanLine = trimmed.replace(/^[-*•#]+\s+/, '').trim();
          if (!cleanLine) return null;

          if (isHeader) {
            return (
              <h5 key={idx} className="text-[12.5px] font-black text-base-content pt-1">
                {formatMarkdownInline(cleanLine)}
              </h5>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2 text-[12px] text-base-content/90 leading-relaxed">
              {isListItem ? (
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              ) : (
                <span className="text-primary font-bold shrink-0">•</span>
              )}
              <span className="flex-1">{formatMarkdownInline(cleanLine)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* پس‌زمینه تاریک با بلر */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={!isDownloading ? onClose : undefined}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />

      {/* پنجره مودال */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-5 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* هدر */}
        <div className="flex items-center justify-between pb-3.5 border-b border-base-500/30 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary grid place-items-center shrink-0 shadow-sm">
              <Rocket className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-black text-base-content truncate">
                به‌روزرسانی جدید سروستان
              </h3>
              <p className="text-[10.5px] text-neutral mt-0.5">
                {dateText ? `منتشرشده در ${dateText}` : 'نسخه جدید در دسترس است'}
              </p>
            </div>
          </div>

          {!isDownloading && (
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="w-8 h-8 rounded-full bg-base-500/30 hover:bg-base-500/60 text-neutral hover:text-base-content grid place-items-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* محتوای اصلی قابل اسکرول */}
        <div className="py-4 space-y-3.5 overflow-y-auto min-h-0 flex-1 pr-0.5">
          {/* نشان وضعیت نسخه و نوع انتشار (آزمایشی / پایدار) */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-base-500/25 border border-base-500/30">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[12px] font-bold text-base-content font-mono">
                {tagName}
              </span>
              {isPrerelease ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <AlertCircle className="w-3 h-3" />
                  نسخه آزمایشی (Pre-release)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  نسخه رسمی و پایدار (Stable)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-neutral shrink-0">
              <span className="font-mono">v{CURRENT_VERSION}</span>
              <ArrowLeft className="w-3 h-3 text-primary" />
              <span className="font-mono text-primary font-bold">{tagName}</span>
            </div>
          </div>

          {/* عنوان انتشار در صورت تفاوت با تگ */}
          {releaseTitle !== tagName && (
            <p className="text-[13px] font-bold text-base-content px-1">
              {releaseTitle}
            </p>
          )}

          {/* باکس تغییرات و قابلیت‌های جدید */}
          <div className="rounded-2xl bg-base-500/15 border border-base-500/25 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-primary">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-[12px] font-black">امکانات و تغییرات جدید</h4>
            </div>
            <div className="max-h-40 overflow-y-auto pr-1">
              {renderChangelog()}
            </div>
          </div>

          {/* وضعیت و پیشرفت دانلود درون‌برنامه‌ای */}
          {isDownloading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-primary-soft/40 border border-primary/30 space-y-2"
            >
              <div className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال دانلود مستقیم فایل APK...</span>
                </div>
                <span className="font-bold text-primary font-mono text-[13px]">
                  {toFaDigits(downloadProgress?.percent || 0)}٪
                </span>
              </div>

              {/* نوار پیشرفت زنده */}
              <div className="w-full h-2 rounded-full bg-base-500/40 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${downloadProgress?.percent || 0}%` }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                />
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-neutral">
                <span>
                  {downloadProgress?.total && downloadProgress.total > 0
                    ? `${toFaDigits((downloadProgress.current / (1024 * 1024)).toFixed(1))} از ${toFaDigits((downloadProgress.total / (1024 * 1024)).toFixed(1))} مگابایت`
                    : 'در حال دریافت اطلاعات فایل...'}
                </span>
                <span className="text-primary/90 font-medium">پنجره نصب بلافاصله باز می‌شود</span>
              </div>
            </motion.div>
          )}

          {/* پیام اتمام دانلود و باز شدن پنجره نصب */}
          {downloadCompleted && !isDownloading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-success-soft text-success text-[11.5px] leading-relaxed flex items-start gap-2 border border-success-soft"
            >
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">دانلود کامل شد</p>
                <p className="text-[10.5px] opacity-90 mt-0.5">
                  پنجره نصب اندروید باز شد؛ در صورت نیاز گزینه «نصب / به‌روزرسانی» را تأیید کنید.
                </p>
              </div>
            </motion.div>
          )}

          {/* پیام خطا */}
          {downloadError && (
            <div className="p-3 rounded-2xl bg-warn-soft text-warn text-[11.5px] leading-relaxed border border-warn-soft">
              {downloadError}
            </div>
          )}
        </div>

        {/* دکمه‌های عملیات پایانی */}
        <div className="pt-3 border-t border-base-500/30 space-y-2 shrink-0">
          {/* دکمه دانلود مستقیم درون‌برنامه‌ای */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="w-full py-3 px-4 rounded-2xl bg-primary text-primary-content font-black text-[13px] shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>در حال دریافت... ({toFaDigits(downloadProgress?.percent || 0)}٪)</span>
              </>
            ) : (
              <>
                <Download className="w-4.5 h-4.5" />
                <span>دانلود و نصب مستقیم (درون‌برنامه‌ای)</span>
                {sizeText && (
                  <span className="text-[11px] opacity-80 font-normal">
                    ({sizeText})
                  </span>
                )}
              </>
            )}
          </button>

          {/* ردیف دکمه‌های ثانویه */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleOpenSite}
              className="flex-1 py-2.5 px-3 rounded-xl bg-base-500/30 hover:bg-base-500/50 text-base-content text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Globe className="w-3.5 h-3.5 text-neutral" />
              <span>وب‌سایت رسمی سروستان</span>
            </button>

            {!isDownloading && (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-neutral hover:text-base-content text-[11.5px] font-bold hover:bg-base-500/20 transition-all"
              >
                بعداً
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
