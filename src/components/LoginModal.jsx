import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  X,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Landmark,
  LayoutDashboard
} from 'lucide-react';
import SarvButton from './sarv/SarvButton';
import SarvBadge from './sarv/SarvBadge';
import liveSync from '../services/behestanLiveSync';
import { toFaDigits } from '../utils/faDigits';

/**
 * مودال ورود با سوییچ بین بهستان (لاگین رسمی) و سروستان (وضعیت اتصال)
 */
export default function LoginModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('sarvestan'); // 'behestan' | 'sarvestan'
  const [profile, setProfile] = useState(liveSync.currentProfile);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  useEffect(() => {
    return liveSync.subscribe((p) => {
      setProfile(p);
    });
  }, []);

  const handleCheckSync = async () => {
    setIsSyncing(true);
    setSyncMessage({ type: 'info', text: 'در حال بررسی تب‌های باز بهستان…' });
    const isConn = await liveSync.checkConnection();
    setIsSyncing(false);
    if (isConn) {
      setSyncMessage({ type: 'success', text: 'نشست فعال بهستان شناسایی شد و همگام شد.' });
    } else {
      setSyncMessage({ type: 'warn', text: 'تب باز بهستان پیدا نشد. ابتدا در بهستان لاگین کنید.' });
    }
    setTimeout(() => setSyncMessage(null), 3200);
  };

  const handleLogout = () => {
    liveSync.logout();
    setSyncMessage({ type: 'info', text: 'خروج انجام شد — حالت میهمان فعال شد.' });
    setTimeout(() => setSyncMessage(null), 2500);
  };

  if (!isOpen) return null;

  const isLoggedIn = !!profile.isLoggedIn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="sarv-card p-5 sm:p-6 w-full max-w-md space-y-5 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[var(--radius-button,0.75rem)] bg-primary/12 text-primary flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-sm font-bold text-base-content">اتصال به سروستان</h3>
              <p className="text-[11px] text-neutral leading-relaxed">
                ورود واقعی فقط از درگاه رسمی بهستان انجام می‌شود
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral hover:text-base-content hover:bg-base-500/40 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Switch: Behestan ↔ Sarvestan */}
        <div className="sarv-seg">
          <button
            type="button"
            onClick={() => setMode('behestan')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-[var(--radius-button,0.75rem)] transition-colors outline-none ${
              mode === 'behestan'
                ? 'text-primary-content font-semibold z-10'
                : 'text-neutral hover:text-base-content font-medium z-10'
            }`}
          >
            {mode === 'behestan' && (
              <motion.span
                layoutId="loginModePill"
                className="absolute inset-0 bg-primary rounded-[var(--radius-button,0.75rem)] z-0"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              بهستان
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('sarvestan')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-[var(--radius-button,0.75rem)] transition-colors outline-none ${
              mode === 'sarvestan'
                ? 'text-primary-content font-semibold z-10'
                : 'text-neutral hover:text-base-content font-medium z-10'
            }`}
          >
            {mode === 'sarvestan' && (
              <motion.span
                layoutId="loginModePill"
                className="absolute inset-0 bg-primary rounded-[var(--radius-button,0.75rem)] z-0"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              سروستان
            </span>
          </button>
        </div>

        {/* Status */}
        <div
          className={`p-3.5 rounded-[var(--radius-button,0.75rem)] border flex items-start justify-between gap-3 text-xs ${
            isLoggedIn
              ? 'bg-success/10 border-success/30'
              : 'bg-base-500/25 border-base-500/40'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {isLoggedIn ? (
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-neutral shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <div className={`font-semibold ${isLoggedIn ? 'text-success' : 'text-base-content'}`}>
                {isLoggedIn ? 'متصل به بهستان' : 'حالت میهمان'}
              </div>
              <div className="text-[11px] text-neutral mt-0.5 truncate">
                {isLoggedIn
                  ? `${profile.fullName} · ${toFaDigits(profile.studentId)}`
                  : 'پس از ورود در بهستان، داده‌ها خودکار همگام می‌شوند'}
              </div>
            </div>
          </div>
          <SarvButton
            variant="primary"
            styleType="flat"
            size="sm"
            onClick={handleCheckSync}
            disabled={isSyncing}
            className="shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ml-1 ${isSyncing ? 'animate-spin' : ''}`} />
            بررسی
          </SarvButton>
        </div>

        {syncMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-2.5 rounded-[var(--radius-button,0.75rem)] text-xs text-center font-medium border ${
              syncMessage.type === 'success'
                ? 'bg-success/12 text-success border-success/25'
                : syncMessage.type === 'warn'
                  ? 'bg-warn/12 text-warn border-warn/25'
                  : 'bg-primary/12 text-primary border-primary/25'
            }`}
          >
            {syncMessage.text}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'behestan' ? (
            <motion.div
              key="behestan"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <SarvBadge variant="primary" soft size="sm">توصیه‌شده و امن</SarvBadge>
              <p className="text-xs text-neutral leading-relaxed">
                با دکمه زیر صفحه رسمی لاگین بهستان باز می‌شود. کد دانشجویی و رمز را
                <strong className="text-base-content"> فقط در همان صفحه</strong> وارد کنید.
                سروستان رمز نمی‌گیرد و بعد از ورود، خودکار نشست را می‌خواند.
              </p>
              <SarvButton
                variant="primary"
                className="w-full py-2.5"
                onClick={() => liveSync.openBehestanLogin()}
              >
                <ExternalLink className="w-4 h-4 ml-1.5" />
                باز کردن بهستان برای ورود
              </SarvButton>
              <p className="text-[10px] text-neutral/80 text-center font-mono">
                behestan.kntu.ac.ir
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="sarvestan"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <p className="text-xs text-neutral leading-relaxed">
                سروستان فقط <strong className="text-base-content">داشبورد و رصد</strong> است.
                پس از ورود در بهستان، برنامه، کارنامه، مالی و … از همان نشست پر می‌شود.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCheckSync}
                  className="p-3 rounded-[var(--radius-button,0.75rem)] bg-base-500/25 border border-base-500/40 hover:border-primary/40 transition-colors text-right space-y-1"
                >
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <div className="text-[11px] font-semibold text-base-content">بررسی وضعیت</div>
                  <div className="text-[10px] text-neutral">بدون سنک پرتکرار</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('behestan')}
                  className="p-3 rounded-[var(--radius-button,0.75rem)] bg-base-500/25 border border-base-500/40 hover:border-primary/40 transition-colors text-right space-y-1"
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <div className="text-[11px] font-semibold text-base-content">رفتن به بهستان</div>
                  <div className="text-[10px] text-neutral">ورود رسمی</div>
                </button>
              </div>

              {isLoggedIn && (
                <SarvButton
                  variant="primary"
                  styleType="flat"
                  className="w-full text-danger"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 ml-1.5" />
                  خروج و قطع همگام‌سازی
                </SarvButton>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
