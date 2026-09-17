import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Copy,
  FolderArchive,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import { getExtensionVersion, OFFICIAL_SITE_URL } from '../services/updater';

/**
 * مودال اعلان و دانلود به‌روزرسانی افزونه مرورگر سروستان
 */
export default function ExtensionUpdateModal({ release, onClose }) {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!release) return null;

  const currentVer = getExtensionVersion();
  const tagName = release.tagName || 'نسخه جدید';
  const releaseTitle = release.name || release.tagName || 'به‌روزرسانی جدید افزونه';
  const isPrerelease = Boolean(release.isPrerelease);
  const downloadUrl = release.zipUrl;

  let sizeText = '';
  if (release.zipSize && release.zipSize > 0) {
    const mb = (release.zipSize / (1024 * 1024)).toFixed(1);
    sizeText = `${toFaDigits(mb)} مگابایت`;
  }

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

  const handleDownload = () => {
    setDownloadStarted(true);
    try {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = release.zipName || 'sarvestan-extension.zip';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleCopyChromeUrl = () => {
    try {
      navigator.clipboard.writeText('chrome://extensions');
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {}
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
            className="font-mono bg-base-500/30 px-1.5 py-0.5 rounded text-[11.5px] text-primary"
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

  const renderChangelog = () => {
    const rawBody = (release.body || '').trim();
    if (!rawBody) {
      return (
        <p className="text-[12.5px] text-neutral leading-relaxed">
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
              <h5 key={idx} className="text-[13px] font-black text-base-content pt-1">
                {formatMarkdownInline(cleanLine)}
              </h5>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2 text-[12.5px] text-base-content/90 leading-relaxed">
              {isListItem ? (
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* پس‌زمینه بلر */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* پنجره اصلی مودال */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-lg rounded-3xl bg-base border border-base-500/50 p-6 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
      >
        {/* هدر */}
        <div className="flex items-center justify-between pb-4 border-b border-base-500/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary grid place-items-center shrink-0 shadow-sm">
              <Rocket className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-base-content truncate">
                به‌روزرسانی جدید افزونه سروستان
              </h3>
              <p className="text-[11px] text-neutral mt-0.5">
                {dateText ? `منتشرشده در ${dateText}` : 'نسخه جدید افزونه در دسترس است'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-8 h-8 rounded-full bg-base-500/30 hover:bg-base-500/60 text-neutral hover:text-base-content grid place-items-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* محتوای مودال */}
        <div className="py-4 space-y-4 overflow-y-auto min-h-0 flex-1 pr-1">
          {/* نشان وضعیت نسخه و نوع انتشار */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-base-500/25 border border-base-500/30">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-base-content font-mono">
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

            <div className="flex items-center gap-1.5 text-xs text-neutral shrink-0">
              <span className="font-mono">v{currentVer}</span>
              <ArrowLeft className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-primary font-bold">{tagName}</span>
            </div>
          </div>

          {/* تغییرات و امکانات جدید */}
          <div className="rounded-2xl bg-base-500/15 border border-base-500/25 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-primary">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-black">امکانات و تغییرات این نسخه</h4>
            </div>
            <div className="max-h-36 overflow-y-auto pr-1">
              {renderChangelog()}
            </div>
          </div>

          {/* راهنمای سریع اعمال آپدیت در مرورگر */}
          <div className="rounded-2xl bg-primary-soft/30 border border-primary/20 p-4 space-y-2 text-right">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <FolderArchive className="w-4 h-4 shrink-0" />
              <span>نحوه اعمال به‌روزرسانی در مرورگر:</span>
            </div>
            <ol className="space-y-1.5 text-[11.5px] text-base-content/85 leading-relaxed pr-2">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-primary shrink-0">۱.</span>
                <span>فایل زیپ زیر را دانلود و محتویات آن را در پوشه افزونه خود جایگزین (Extract) کنید.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-primary shrink-0">۲.</span>
                <span>در مرورگر به صفحه مدیریت افزونه‌ها رفته و روی آیکون بارگذاری مجدد (↻ Reload) افزونه بزنید.</span>
              </li>
            </ol>

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-neutral font-mono select-all">chrome://extensions</span>
              <button
                type="button"
                onClick={handleCopyChromeUrl}
                className="px-2 py-1 rounded-lg bg-base text-base-content hover:text-primary transition-colors flex items-center gap-1 font-bold text-[10.5px]"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'کپی شد' : 'کپی آدرس'}</span>
              </button>
            </div>
          </div>

          {downloadStarted && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-success-soft text-success text-xs font-bold flex items-center gap-2 border border-success-soft"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>دانلود فایل افزونه آغاز شد. طبق راهنمای بالا آن را جایگزین کنید.</span>
            </motion.div>
          )}
        </div>

        {/* دکمه‌های پایانی */}
        <div className="pt-4 border-t border-base-500/30 space-y-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-3 px-4 rounded-2xl bg-primary text-primary-content font-black text-sm shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4.5 h-4.5" />
            <span>دانلود مستقیم فایل افزونه (ZIP)</span>
            {sizeText && (
              <span className="text-xs opacity-80 font-normal">
                ({sizeText})
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.open(OFFICIAL_SITE_URL, '_blank')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-base-500/30 hover:bg-base-500/50 text-base-content text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-neutral" />
              <span>وب‌سایت رسمی</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-neutral hover:text-base-content text-xs font-bold hover:bg-base-500/20 transition-all"
            >
              بعداً
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
