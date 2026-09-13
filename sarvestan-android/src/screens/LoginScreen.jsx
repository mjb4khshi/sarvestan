import { useEffect, useRef, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2, X, CheckCircle2 } from 'lucide-react';
import { applyManualSession, isSessionAlive } from '../services/behestan/session';
import { runFullSync, resetSyncState } from '../services/behestan/sync';
import { isNativeCapacitor, loginAndroid, loginViaSsoWebView } from '../services/behestan/ssoLoginNative';
import {
  subscribeLogin,
  getLoginSnapshot,
  beginLoginFlow,
  closeLoginModal,
  failLoginFlow,
  setLoginStep,
  setLoginDone,
  setLoginUsername,
  setLoginPassword,
} from '../services/loginFlow';

function parseUidFromCookies(cookies) {
  try {
    const m = String(cookies || '').match(/p=([^;]+)/);
    if (!m) return '';
    return String(JSON.parse(decodeURIComponent(m[1])).UId || '');
  } catch {
    return '';
  }
}

const STEPS = [
  'ورود SSO دانشگاه…',
  'دریافت گزارش ۸۸ (برنامه و امتحانات)…',
  'دریافت کارنامه و وضعیت دروس…',
  'دیتا آماده شد — در حال نمایش…',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** حداقل زمان نمایش هر تیک */
const MIN_STEP_MS = 700;

/** ورود: اپ → فقط WebView بومی؛ وب → سرور Vite با فرم */
async function doSsoLogin(username, password) {
  if (isNativeCapacitor()) {
    // روی اندروید فرم ما بی‌فایده است — WebView خودش SSO را نشان می‌دهد
    return loginViaSsoWebView();
  }
  const r = await fetch('/__sarvestan/sso-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const text = await r.text();
  if (!text.trim().startsWith('{')) {
    throw new Error('پاسخ نامعتبر از سرور ورود (HTML به‌جای JSON)');
  }
  return JSON.parse(text);
}

export default function LoginScreen({ onSuccess, asModal = false }) {
  const flow = useSyncExternalStore(subscribeLogin, getLoginSnapshot, getLoginSnapshot);
  const busyRef = useRef(false);

  const busy = flow.busy || busyRef.current;
  const done = flow.done;
  const stepIdx = flow.stepIdx;
  const username = flow.username;
  const password = flow.password;
  const error = flow.error;

  const handleDismiss = () => {
    if (busy) return;
    closeLoginModal();
    onSuccess?.();
  };

  const handleLogin = async () => {
    if (busyRef.current) return;
    const native = isNativeCapacitor();
    const u = String(username || '').trim();
    const p = password;
    if (!native && (!u || !p)) {
      failLoginFlow(-1, 'نام کاربری و رمز عبور الزامی است.');
      return;
    }

    busyRef.current = true;
    beginLoginFlow();

    try {
      setLoginStep(0);
      const t0 = Date.now();

      const j = await doSsoLogin(u, p);
      if (!j?.ok || !j?.sid || !j?.ticket) {
        busyRef.current = false;
        failLoginFlow(-1, 'ورود ناموفق: ' + (j?.error || 'نامشخص'));
        return;
      }

      applyManualSession({
        sid: j.sid,
        ticket: j.ticket,
        studentId: j.studentId || undefined,
        userId: parseUidFromCookies(j.cookies) || undefined,
        cookies: j.cookies || undefined,
      });

      if (!isSessionAlive()) {
        busyRef.current = false;
        failLoginFlow(-1, 'نشست ثبت نشد. دوباره تلاش کن.');
        return;
      }

      const wait0 = MIN_STEP_MS - (Date.now() - t0);
      if (wait0 > 0) await sleep(wait0);

      setLoginStep(1);
      const t1 = Date.now();
      resetSyncState();
      await sleep(80);

      const syncPromise = (async () => {
        let res = await runFullSync({ force: true });
        if (!res?.ok) {
          await sleep(900);
          resetSyncState();
          res = await runFullSync({ force: true });
        }
        if (!res?.ok) {
          await sleep(1200);
          resetSyncState();
          res = await runFullSync({ force: true });
        }
        return res;
      })();

      const wait1 = MIN_STEP_MS - (Date.now() - t1);
      if (wait1 > 0) await sleep(wait1);

      setLoginStep(2);
      const t2 = Date.now();

      const res = await Promise.race([
        syncPromise,
        sleep(50000).then(() => ({ ok: false, reason: 'timeout' })),
      ]);

      const wait2 = MIN_STEP_MS - (Date.now() - t2);
      if (wait2 > 0) await sleep(wait2);

      if (res?.ok) {
        setLoginStep(3);
        setLoginDone(true);
        busyRef.current = false;
        await sleep(500);
        closeLoginModal();
        onSuccess?.();
      } else if (isSessionAlive()) {
        setLoginStep(3);
        setLoginDone(true);
        busyRef.current = false;
        await sleep(400);
        closeLoginModal();
        setTimeout(async () => {
          try {
            resetSyncState();
            await runFullSync({ force: true });
          } catch {}
        }, 300);
        onSuccess?.();
      } else {
        busyRef.current = false;
        failLoginFlow(3, 'ورود ناموفق. رمز یا اتصال را چک کن.');
      }
    } catch (e) {
      busyRef.current = false;
      failLoginFlow(-1, 'خطای شبکه: ' + String(e?.message || e));
    }
  };

  const native = isNativeCapacitor();

  const card = (
    <div
      className={`w-full ${asModal ? 'max-w-full' : 'max-w-[400px]'} sarv-card p-6 space-y-4 border border-primary/25`}
    >
      <div className="flex flex-col items-center gap-2">
        <img
          src="/sarv-icon.svg"
          alt="سروستان"
          className="w-16 h-16 rounded-3xl object-contain shadow-lg ring-2 ring-primary/30 bg-base"
        />
        <h1 className="text-[20px] font-black text-base-content">سروستان</h1>
        <p className="text-[11.5px] text-neutral text-center">
          {native
            ? 'ورود زنده به بهستان — داده‌ها محلی پردازش می‌شوند'
            : 'ورود زنده به بهستان — داده‌ها محلی پردازش می‌شوند'}
        </p>
      </div>

      {!native && (
        <div className="space-y-2.5 pt-1">
          <div className="input-wrap input-primary w-full">
            <div className="input-box">
              <span className="input-icon-left">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder=" "
                autoComplete="username"
                dir="ltr"
                id="sarv-login-user"
                disabled={busy}
                className="input"
              />
              <label htmlFor="sarv-login-user" className="input-label-placeholder">
                نام کاربری (کد ملی)
              </label>
            </div>
          </div>

          <div className="input-wrap input-primary w-full">
            <div className="input-box">
              <span className="input-icon-left">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder=" "
                autoComplete="current-password"
                dir="ltr"
                id="sarv-login-pass"
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin();
                }}
                className="input"
              />
              <label htmlFor="sarv-login-pass" className="input-label-placeholder">
                رمز عبور
              </label>
            </div>
          </div>
        </div>
      )}

      {native && (
        <div className="rounded-2xl bg-primary-soft border border-primary-soft p-3.5 space-y-2">
          <p className="text-[12px] font-bold text-primary">راهنمای ورود</p>
          <ol className="text-[11.5px] text-neutral leading-relaxed list-decimal pr-4 space-y-1.5">
            <li>
              روی دکمهٔ <strong className="text-base-content">«ورود با سامانهٔ دانشگاه»</strong> بزن
            </li>
            <li>
              اگر پنجرهٔ ورود بهستان باز شد، روی{' '}
              <strong className="text-base-content">دکمهٔ ورود مرکزی دانشگاه</strong> کلیک کن
            </li>
            <li>
              رمز را در سامانهٔ رسمی وارد کن و{' '}
              <strong className="text-base-content">صبر کن تا همگام‌سازی تمام شود</strong> —
              پنجره خودکار بسته می‌شود
            </li>
          </ol>
        </div>
      )}

      <motion.button
        type="button"
        whileTap={busy || done ? {} : { scale: 0.97 }}
        onClick={handleLogin}
        disabled={busy || done}
        className={`btn btn-primary w-full !py-3 text-[14px] font-bold ${
          busy || done ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {done ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            ورود موفق…
          </>
        ) : busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال ورود و همگام‌سازی…
          </>
        ) : native ? (
          <>
            <LogIn className="w-4 h-4" />
            ورود با سامانهٔ دانشگاه
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            ورود و گرفتن دیتای زنده
          </>
        )}
      </motion.button>

      {stepIdx >= 0 && (
        <div className="space-y-1.5">
          {STEPS.map((s, i) => {
            const finished = i < stepIdx || (done && i <= stepIdx);
            const current = i === stepIdx && !done;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 text-[11px] leading-relaxed transition-colors ${
                  finished
                    ? 'text-success'
                    : current
                      ? 'text-primary font-medium'
                      : 'text-neutral/60'
                }`}
              >
                {finished ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : current ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-base-500/60 shrink-0" />
                )}
                {s}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-[11.5px] text-danger bg-danger-soft border border-danger-soft rounded-xl px-3 py-2 leading-relaxed">
          {error}
        </p>
      )}

      {busy && !done && (
        <p className="text-[10.5px] text-neutral text-center">
          دیتاها در حال دریافت است — تا پایان صبر کن
        </p>
      )}
    </div>
  );

  if (asModal) {
    return (
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: '40%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '30%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-[430px] px-4 pb-4 sm:pb-0 max-h-[92vh] overflow-y-auto"
        >
          <div className="relative">
            {!busy && !done && (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="بستن"
                className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-base-500/60 text-neutral hover:text-base-content grid place-items-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {card}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-base text-base-content mobile-shell">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      >
        {card}
      </motion.div>
    </div>
  );
}