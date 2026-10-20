import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  RefreshCw,
  Upload,
} from 'lucide-react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { toFaDigits } from '../utils/faDigits';
import { QrStreamReassembler, applyBundleToStorage } from '../services/dataTransfer';

export default function WebQrScannerModal({ isOpen, onClose, onSuccess }) {
  const [cameraError, setCameraError] = useState(null);
  const [progress, setProgress] = useState({ receivedCount: 0, totalChunks: 0, progressPercent: 0 });
  const [isDone, setIsDone] = useState(false);
  const [importingFile, setImportingFile] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const fileInputRef = useRef(null);
  const reassemblerRef = useRef(null);
  const isDoneRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setProgress({ receivedCount: 0, totalChunks: 0, progressPercent: 0 });
      setIsDone(false);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    isDoneRef.current = true;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsDone(false);
    isDoneRef.current = false;
    setProgress({ receivedCount: 0, totalChunks: 0, progressPercent: 0 });

    reassemblerRef.current = new QrStreamReassembler({
      onProgress: (p) => {
        setProgress(p);
        try {
          if (navigator.vibrate) navigator.vibrate(20);
        } catch {}
      },
      onComplete: async (bundle) => {
        setIsDone(true);
        isDoneRef.current = true;
        stopCamera();
        try {
          if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
        } catch {}
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
        await applyBundleToStorage(bundle);
        if (onSuccess) onSuccess(bundle);
        setTimeout(() => {
          onClose();
        }, 1200);
      },
      onError: (err) => {
        setCameraError('خطا در تجمیع بسته‌ها. لطفاً دوباره تلاش کنید.');
      },
    });

    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e1) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      }
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        requestAnimationFrame(tickScan);
      }
    } catch (err) {
      console.warn('[WebQrScanner] camera access error:', err);
      setCameraError('دسترسی به دوربین داده نشد یا این دستگاه فاقد دوربین است.');
    }
  };

  const tickScan = () => {
    if (isDoneRef.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      animFrameRef.current = requestAnimationFrame(tickScan);
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, vw, vh);

    try {
      const imageData = ctx.getImageData(0, 0, vw, vh);
      const code = jsQR(imageData.data, vw, vh, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        reassemblerRef.current?.feedFrame(code.data);
      }
    } catch (e) {
      console.warn('[WebQrScanner] jsQR frame error:', e);
    }

    if (!isDoneRef.current) {
      animFrameRef.current = requestAnimationFrame(tickScan);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportingFile(true);
      const text = await file.text();
      const bundle = JSON.parse(text);
      await applyBundleToStorage(bundle);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
      if (onSuccess) onSuccess(bundle);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      setCameraError('فایل انتخاب‌شده معتبر نیست: ' + (err.message || err));
    } finally {
      setImportingFile(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-base border border-base-500/40 p-5 shadow-2xl text-right overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-base-500/20 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-base text-base-content">
                  اسکن و دریافت داده‌ها
                </h3>
                <p className="text-[11px] text-neutral">
                  دوربین را جلوی مانیتور بگیرید
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

          {/* Camera Viewfinder Box */}
          <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-black border border-primary/30 shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
            />

            {/* Viewfinder Corners (Cyber HUD) */}
            <div className="absolute inset-6 pointer-events-none">
              <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-xl" />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-xl" />

              {/* Animated laser beam */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse top-1/2" />
            </div>

            {/* Success Overlay */}
            {isDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white/95 dark:bg-base/95 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-success p-4 z-20"
              >
                <CheckCircle2 className="w-14 h-14" />
                <span className="font-black text-base text-base-content">اطلاعات با موفقیت دریافت شد!</span>
                <span className="text-xs text-neutral">در حال بارگذاری داشبورد...</span>
              </motion.div>
            )}

            {/* Error Message */}
            {cameraError && (
              <div className="absolute inset-4 bg-white/95 dark:bg-base/95 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 z-20">
                <AlertCircle className="w-8 h-8 text-warn" />
                <p className="text-xs text-neutral leading-relaxed">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-primary text-primary-content text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تلاش مجدد</span>
                </button>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-100/90 dark:bg-base-500/15 border border-base-500/25">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-base-content flex items-center gap-1 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>
                  {progress.totalChunks > 0
                    ? `تصاویر دریافت‌شده: ${toFaDigits(progress.receivedCount)} از ${toFaDigits(progress.totalChunks)}`
                    : 'در انتظار تشخیص QR Code...'}
                </span>
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                {toFaDigits(progress.progressPercent)}٪
              </span>
            </div>
            <div className="w-full h-2 bg-base-500/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200 rounded-full"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Alternative: Upload JSON File */}
          <div className="mt-4 pt-3 border-t border-base-500/20 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              disabled={importingFile}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-base-500/15 hover:bg-base-500/30 text-xs font-bold text-base-content flex items-center justify-center gap-2 border border-base-500/30 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-primary" />
              <span>
                {importingFile ? 'در حال بارگذاری فایل...' : 'یا بارگذاری فایل پشتیبان (JSON)'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
