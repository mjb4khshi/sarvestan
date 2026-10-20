import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  QrCode,
  Upload,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Eye,
  CheckCircle2,
  FileCode,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSarvestanData } from '../hooks/useSarvestanData';
import { applyBundleToStorage } from '../services/dataTransfer';
import WebQrScannerModal from './WebQrScannerModal';
import devDataset from '../data/devDatasetLoader';

export default function WebConnectGate({ onDataLoaded }) {
  const { live, profile } = useSarvestanData();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  // If already logged in with live data, don't show gate
  if (live || profile?.isLoggedIn) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMsg(null);
      const text = await file.text();
      const bundle = JSON.parse(text);
      await applyBundleToStorage(bundle);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
      if (onDataLoaded) onDataLoaded(bundle);
    } catch (err) {
      setErrorMsg('فایل انتخاب‌شده معتبر نیست: ' + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadDemo = () => {
    try {
      devDataset.loadDevDataset();
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      window.location.reload();
    } catch (e) {
      console.warn('[demo error]', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-base/80 backdrop-blur-xl overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-base border border-base-500/40 p-6 sm:p-7 shadow-2xl text-right my-auto"
      >
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary to-accent text-primary-content flex items-center justify-center shadow-xl shadow-primary/25 mb-3.5">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-base-content">
            سروستان | نسخه وب و آیفون
          </h2>
          <p className="text-xs text-neutral mt-1 max-w-xs leading-relaxed">
            داشبورد مدرن، برنامه هفتگی و کارنامه بدون نیاز به سرور واسط و ۱۰۰٪ آفلاین
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-warn/15 border border-warn/30 text-xs text-neutral leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Primary Action 1: QR Scanner */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/95 hover:to-emerald-700 text-primary-content font-black text-sm flex items-center justify-between shadow-lg shadow-primary/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="font-bold">اسکن QR متحرک</div>
                <div className="text-[11px] opacity-85 font-medium">از روی افزونه یا گوشی اندروید</div>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 font-mono font-bold">
              دوربین
            </span>
          </button>

          {/* Primary Action 2: JSON File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 rounded-2xl bg-slate-100/90 dark:bg-base-500/20 hover:bg-slate-200 dark:hover:bg-base-500/35 border border-base-500/30 text-base-content font-bold text-sm flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-base-500/20 text-primary flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div>بارگذاری فایل پشتیبان</div>
                <div className="text-[11px] text-neutral font-medium">فایل JSON خروجی گرفته‌شده</div>
              </div>
            </div>
            <span className="text-xs text-neutral font-mono font-bold px-2 py-0.5 rounded bg-base-500/20">
              .json
            </span>
          </button>
        </div>

        {/* Demo Button */}
        <div className="mt-5 pt-4 border-t border-base-500/20 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="text-xs text-neutral hover:text-primary font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>مشاهده محیط با داده‌های نمونه (حالت دمو)</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral/70 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span>۱۰۰٪ امن و آفلاین — بدون دخالت سرور واسط (Zero MITM)</span>
          </div>
        </div>
      </motion.div>

      {/* QR Scanner Modal */}
      <WebQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={(bundle) => {
          if (onDataLoaded) onDataLoaded(bundle);
        }}
      />
    </div>
  );
}
