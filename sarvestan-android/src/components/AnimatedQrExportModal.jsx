import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  QrCode,
  Download,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';
import QRCode from 'qrcode';
import { exportSnapshotBundle, generateQrChunks, downloadJsonBundle } from '../services/dataTransfer';

export default function AnimatedQrExportModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [chunks, setChunks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(3); // 3 frames per second (ideal for reliable mobile camera scanning)
  const [stats, setStats] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      setChunks([]);
      setCurrentIndex(0);
      return;
    }

    let active = true;
    (async () => {
      try {
        setLoading(true);
        const bundle = exportSnapshotBundle({ shrinkPhoto: true });
        const res = await generateQrChunks(bundle);
        if (active) {
          setChunks(res.chunks);
          setStats(res);
          setCurrentIndex(0);
          setLoading(false);
        }
      } catch (err) {
        console.error('[AnimatedQrExportModal] error generating chunks:', err);
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen]);

  // Renders the QR code onto the canvas whenever currentIndex or chunks change
  useEffect(() => {
    if (!chunks.length || !canvasRef.current) return;
    const item = chunks[currentIndex];
    if (!item) return;

    QRCode.toCanvas(canvasRef.current, item.payload, {
      width: 300,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'L',
    }).catch((err) => console.warn('[QRCode canvas err]', err));
  }, [chunks, currentIndex]);

  // Animation loop: advances through frames
  useEffect(() => {
    if (!isPlaying || chunks.length <= 1) return;

    const intervalMs = Math.round(1000 / fps);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % chunks.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, chunks.length, fps]);

  const handleDownloadJson = () => {
    const bundle = exportSnapshotBundle({ shrinkPhoto: false });
    downloadJsonBundle(bundle);
  };

  const handleCopyRawJson = () => {
    const bundle = exportSnapshotBundle({ shrinkPhoto: false });
    navigator.clipboard?.writeText(JSON.stringify(bundle, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-base border border-base-500/40 p-5 sm:p-6 shadow-2xl text-right overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-base-500/20 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-base-content flex items-center gap-1.5">
                  <span>انتقال داده‌ها به وب و آیفون</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                    آفلاین و امن
                  </span>
                </h3>
                <p className="text-[11px] text-neutral">
                  بدون سرور، بدون واسطه؛ اسکن با دوربین یا ذخیره فایل
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-neutral">در حال فشرده‌سازی و تولید فریم‌ها...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Stream Display Box */}
              <div className="relative mx-auto flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-100/90 dark:bg-base-500/15 border border-base-500/30 shadow-inner">
                {/* Neon Border Glow */}
                <div className="relative p-2 rounded-2xl bg-white shadow-xl border border-primary/40 overflow-hidden">
                  <canvas ref={canvasRef} className="block rounded-xl mx-auto" />
                  {/* Laser scan indicator line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse pointer-events-none top-1/2" />
                </div>

                {/* Stream status badge */}
                <div className="mt-3 flex items-center justify-between w-full max-w-xs px-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      بسته {currentIndex + 1} از {chunks.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral font-mono dir-ltr">
                    Session: {stats?.sessionId}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs h-1.5 bg-base-500/25 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200 rounded-full"
                    style={{
                      width: `${Math.round(((currentIndex + 1) / Math.max(1, chunks.length)) * 100)}%`,
                    }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentIndex((prev) => (prev - 1 + chunks.length) % chunks.length);
                    }}
                    className="p-1.5 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-base-content text-xs cursor-pointer transition-all"
                    title="بسته قبلی"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-content text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'توقف' : 'پخش'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentIndex((prev) => (prev + 1) % chunks.length);
                    }}
                    className="p-1.5 rounded-lg bg-base-500/20 hover:bg-base-500/35 text-base-content text-xs cursor-pointer transition-all"
                    title="بسته بعدی"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Speed toggle */}
                  <div className="flex items-center gap-1 mr-2 px-2 py-1 rounded-lg bg-base-500/20 text-[11px]">
                    <span className="text-neutral">سرعت:</span>
                    {[2, 3, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFps(s)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          fps === s ? 'bg-primary text-primary-content' : 'text-neutral hover:text-base-content'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/25 text-xs text-neutral leading-relaxed">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-base-content font-bold">راهنمای اسکن با آیفون:</strong>
                    <p className="mt-0.5 text-[11px]">
                      در گوشی آیفون، نسخه وب سروستان را باز کرده و دکمهٔ <strong>«اسکن QR متحرک»</strong> را بزنید. دوربین را ۲ تا ۳ ثانیه جلوی مانیتور بگیرید تا تمام بسته‌ها تکمیل شوند.
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternate JSON Download Buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-base-500/30"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span>دانلود فایل پشتیبان (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyRawJson}
                  className="py-2.5 px-3 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-base-500/30"
                  title="کپی در کلیپ‌بورد"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span className="text-success">کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی متن</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1 text-[10px] text-neutral/70 pt-1">
                <ShieldCheck className="w-3 h-3 text-success" />
                <span>۱۰۰٪ امن، آفلاین و محلی — اطلاعات در هیچ سروری ذخیره نمی‌شود</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
