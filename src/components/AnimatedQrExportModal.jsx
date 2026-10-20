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
  CheckCircle2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { exportSnapshotBundle, exportSnapshotBundleAsync, generateQrChunks, downloadJsonBundle } from '../services/dataTransfer';

export default function AnimatedQrExportModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [chunks, setChunks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(3);
  const [stats, setStats] = useState(null);
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
        const bundle = await exportSnapshotBundleAsync({ shrinkPhoto: true });
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
      width: 250,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className="relative w-full max-w-sm rounded-3xl bg-base border border-base-500/40 p-4 sm:p-5 shadow-2xl text-right overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-base-500/20 mb-3.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[14px] text-base-content truncate">
                    انتقال داده‌ها با QR
                  </h3>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-primary-soft text-primary font-bold shrink-0">
                    آفلاین
                  </span>
                </div>
                <p className="text-[10.5px] text-neutral truncate mt-0.5">
                  اسکن با دوربین دستگاه دیگر یا ذخیره فایل
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-base-500/20 hover:bg-base-500/35 text-neutral hover:text-base-content grid place-items-center shrink-0 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-3">
              <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-neutral">در حال فشرده‌سازی و ساخت QR...</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* QR Display Card */}
              <div className="relative mx-auto flex flex-col items-center justify-center p-3 rounded-2xl bg-base-500/10 border border-base-500/30">
                {/* QR Canvas Container */}
                <div className="relative p-2 rounded-2xl bg-white shadow-md border border-base-500/30">
                  <canvas ref={canvasRef} className="block rounded-lg mx-auto" style={{ width: '240px', height: '240px' }} />
                </div>

                {/* Single Chunk Mode (Static QR) */}
                {chunks.length <= 1 ? (
                  <div className="mt-2.5 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-success bg-success-soft border border-success/30 px-3 py-1 rounded-xl inline-flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      کد کامل و ثابت — اسکن فوری
                    </span>
                  </div>
                ) : (
                  /* Animated Stream Controls */
                  <div className="w-full max-w-[270px] mt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] px-1">
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        بسته {currentIndex + 1} از {chunks.length}
                      </span>
                      <div className="flex items-center gap-1 bg-base-500/20 px-1.5 py-0.5 rounded-lg text-[10px]">
                        <span className="text-neutral">سرعت:</span>
                        {[2, 3, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFps(s)}
                            className={`px-1.5 py-0.2 rounded font-bold transition-all ${
                              fps === s ? 'bg-primary text-primary-content' : 'text-neutral hover:text-base-content'
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-base-500/25 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-200 rounded-full"
                        style={{
                          width: `${Math.round(((currentIndex + 1) / Math.max(1, chunks.length)) * 100)}%`,
                        }}
                      />
                    </div>

                    {/* Play/Pause controls */}
                    <div className="flex items-center justify-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentIndex((prev) => (prev - 1 + chunks.length) % chunks.length);
                        }}
                        className="p-1.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content text-xs cursor-pointer transition-all"
                        title="بسته قبلی"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPlaying((p) => !p)}
                        className="px-3.5 py-1 rounded-xl bg-primary text-primary-content text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        <span>{isPlaying ? 'توقف' : 'پخش'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentIndex((prev) => (prev + 1) % chunks.length);
                        }}
                        className="p-1.5 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content text-xs cursor-pointer transition-all"
                        title="بسته بعدی"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="p-3 rounded-2xl bg-base-500/15 border border-base-500/25 text-xs text-neutral leading-relaxed">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-base-content font-bold text-[11.5px]">راهنمای دریافت:</strong>
                    <p className="mt-0.5 text-[11px] text-neutral leading-normal">
                      در دستگاه دیگر (وب یا گوشی)، دکمهٔ <strong>«اسکن با دوربین»</strong> را بزنید و دوربین را مقابل این بارکد بگیرید.
                    </p>
                  </div>
                </div>
              </div>

              {/* Backup Download Button (Full Width, No Copy Text) */}
              <button
                type="button"
                onClick={handleDownloadJson}
                className="w-full py-2.5 px-3 rounded-xl bg-base-500/20 hover:bg-base-500/35 text-base-content text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-base-500/30 active:scale-[0.98]"
              >
                <Download className="w-4 h-4 text-primary" />
                <span>دانلود فایل پشتیبان (JSON)</span>
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-neutral/70 pt-0.5">
                <ShieldCheck className="w-3 h-3 text-success" />
                <span>۱۰۰٪ امن، آفلاین و محلی — بدون ارسال به هیچ سروری</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
