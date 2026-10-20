import { useEffect, useState } from 'react';
import { Link2, RefreshCw, LogIn, LogOut, User, Clock, Sparkles } from 'lucide-react';
import { useSarvestanData } from '../hooks/useSarvestanData';
import { resetSyncState } from '../services/behestan/sync';
import { openLoginModal, isLoginModalOpen } from '../services/loginFlow';
import { getSelectedUniversity, setSelectedUniversity } from '../services/behestan/session';
import { canSync } from '../services/behestan/client';
import { toFaDigits, formatLastSync, getLastSyncTimestamp } from '../utils/faDigits';
import { isNativeAlarms } from '../services/classAlarms';

/**
 * اتصال بهستان — وضعیت، همگام‌سازی دستی و خروج از حساب
 */
export default function SessionPanel() {
  const [msg, setMsg] = useState('');
  const { live, session, profile, syncMeta, syncing, sync, logout, isSessionAlive } =
    useSarvestanData();

  useEffect(() => {
    if (syncMeta?.status === 'syncing' && !syncing) resetSyncState();
  }, [syncMeta?.status, syncing]);

  // نشست مرده — خودکار logout نکن (نشست تازهٔ ورود را می‌پراند)
  // کاربر می‌تواند دستی «خروج» یا «ورود دوباره» بزند
  useEffect(() => {}, []);

  const displayName = profile?.fullName || '';
  const displayId = profile?.studentId || session?.studentId || '';

  const lastSyncTime = getLastSyncTimestamp(syncMeta);
  const lastSyncFormatted = formatLastSync(lastSyncTime);

  const hasActiveSession = canSync();
  const statusLabel = live
    ? (hasActiveSession ? 'متصل — دادهٔ زنده' : 'داده‌های محلی (آفلاین)')
    : isSessionAlive
      ? 'نشست ثبت شده؛ دیتا نیامده'
      : 'بدون اتصال';

  const statusTone = live
    ? (hasActiveSession ? 'bg-success-soft text-success border-success-soft' : 'bg-primary-soft text-primary border-primary-soft')
    : isSessionAlive
      ? 'bg-warn-soft text-warn border-warn-soft'
      : 'bg-base-500/40 text-neutral border-base-500/60';

  const isLivePlatform = isNativeAlarms() || (typeof window !== 'undefined' && Boolean(window.chrome?.runtime?.id));

  // در نسخه وب ورود زنده و سینک بهستان وجود ندارد؛ فقط کارت تمیز پروفایل دانشجو نمایش داده می‌شود
  if (!isLivePlatform) {
    if (!displayName && !displayId) return null;
    return (
      <section className="sarv-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[14px] font-bold text-base-content flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            حساب کاربری دانشجو
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-base-500/20 text-neutral border-base-500/30">
            داده‌های محلی آفلاین
          </span>
        </div>

        <div className="rounded-2xl bg-base-500/15 border border-base-500/25 p-3 flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-primary-soft text-primary grid place-items-center shrink-0">
            <User className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            {displayName ? (
              <p className="text-[13.5px] font-bold text-base-content truncate">{displayName}</p>
            ) : null}
            {displayId ? (
              <p className="text-[11px] text-neutral font-mono mt-0.5">{toFaDigits(displayId)}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-[11px] font-bold py-1.5 px-3 rounded-xl bg-danger-soft text-danger border border-danger-soft hover:bg-danger/20 active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            خروج
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="sarv-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-base-content flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          اتصال بهستان
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${statusTone}`}>
          {statusLabel}
        </span>
      </div>

      {isSessionAlive && (displayName || displayId) && (
        <div className="rounded-xl bg-base-500/25 border border-base-500/40 px-3 py-2.5 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
            <User className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            {displayName ? (
              <p className="text-[13px] font-bold text-base-content truncate">{displayName}</p>
            ) : null}
            {displayId ? (
              <p className="text-[11px] text-neutral font-mono mt-0.5">{toFaDigits(displayId)}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* آخرین همگام‌سازی */}
      <div className="flex items-center justify-between text-[11.5px] px-3 py-2 rounded-xl bg-base-500/20 border border-base-500/30">
        <span className="text-neutral flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-neutral/80" />
          آخرین همگام‌سازی:
        </span>
        <span className="font-bold text-base-content">
          {syncing ? (
            <span className="text-primary flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              در حال دریافت داده…
            </span>
          ) : (
            lastSyncFormatted || 'هنوز انجام نشده'
          )}
        </span>
      </div>

      {syncMeta?.error && (
        <div className="text-danger text-[11px] font-medium leading-relaxed rounded-xl bg-danger-soft border border-danger-soft px-3 py-2">
          {syncMeta.error}
        </div>
      )}

      {(!live || !hasActiveSession || /نشست|50216|پایان رسیده/i.test(String(syncMeta?.error || ''))) && (
        <button
          type="button"
          onClick={() => {
            const curUni = session?.university || getSelectedUniversity();
            if (curUni) setSelectedUniversity(curUni);
            openLoginModal();
          }}
          className="btn btn-primary w-full !py-3 text-[13px] font-bold"
        >
          <LogIn className="w-4 h-4" />
          ورود زندهٔ بهستان
        </button>
      )}

      {msg && (
        <p className="text-[11px] text-neutral bg-base-500/20 border border-base-500/40 rounded-xl px-3 py-2">
          {msg}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            if (syncing) {
              resetSyncState();
              return;
            }
            if (!canSync()) {
              const curUni = session?.university || getSelectedUniversity();
              if (curUni) setSelectedUniversity(curUni);
              openLoginModal();
              return;
            }
            const res = await sync(true);
            if (res?.reason === 'no-session' || res?.reason === 'no-tabs') {
              const curUni = session?.university || getSelectedUniversity();
              if (curUni) setSelectedUniversity(curUni);
              openLoginModal();
            }
          }}
          className="btn btn-soft-primary flex-1 min-w-[110px] text-[12px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ml-1 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'در حال ورود و همگام‌سازی…' : 'ورود و همگام‌سازی'}
        </button>

        {isSessionAlive && (
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="flex-1 min-w-[110px] text-[12px] font-bold py-2 px-3 rounded-[var(--radius-button,0.85rem)] bg-danger-soft text-danger border border-danger-soft active:scale-95 transition-all inline-flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            خروج از حساب
          </button>
        )}
      </div>
    </section>
  );
}
