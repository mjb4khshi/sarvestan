import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2, X, CheckCircle2, KeyRound, Globe, ShieldCheck, GraduationCap, BookOpen, RefreshCw } from 'lucide-react';
import SarvCheckbox from '../components/SarvCheckbox';
import {
  applyManualSession,
  isSessionAlive,
  beginFreshLoginSession,
  clearSession,
  UNIVERSITIES,
  getSelectedUniversity,
  setSelectedUniversity,
} from '../services/behestan/session';
import { fetchSbuCaptcha, loginViaSbuDirect } from '../services/behestan/sbuLogin';
import { runFullSync, resetSyncState } from '../services/behestan/sync';
import { isNativeCapacitor, loginAndroid, loginViaSsoWebView, loginViaNativeSso, clearSsoCookies } from '../services/behestan/ssoLoginNative';
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
  setLoginRemember,
  commitCredsOnSuccess,
  loadSavedCreds,
  clearSavedCreds,
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
  'ورود به سامانه دانشگاه…',
  'دریافت برنامه و امتحانات (گزارش ۸۸)…',
  'دریافت کارنامه و وضعیت دروس…',
  'دیتا آماده شد — در حال نمایش…',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** حداقل زمان نمایش هر تیک */
const MIN_STEP_MS = 700;

function authErrorMessage(j) {
  const raw = String(j?.error || j?.message || '').trim();
  if (!raw) return 'ورود ناموفق — نام کاربری یا رمز عبور را بررسی کنید.';
  if (/invalid username or password|bad credentials/i.test(raw)) {
    return 'نام کاربری یا رمز عبور اشتباه است.';
  }
  if (/نادرست|اشتباه|نامعتبر|incorrect|wrong password/i.test(raw)) {
    return raw.includes('رمز') || raw.includes('گذرواژه') || raw.includes('کلمه')
      ? raw
      : 'نام کاربری یا رمز عبور اشتباه است.';
  }
  if (/کد\s*[\d۰-۹]+/.test(raw) || /http\s*\d+/i.test(raw)) {
    return `خطای ورود (${raw})`;
  }
  return raw;
}

function networkErrorMessage(e) {
  const msg = String(e?.message || e);
  if (/timeout|timed\s*out|network|failed to fetch|ارتباط/i.test(msg)) {
    return 'خطای شبکه — اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.';
  }
  return 'خطای غیرمنتظره هنگام ورود: ' + msg;
}

/** احراز هویت: بسته به متد انتخابی */
async function doLogin(username, password, method, options = {}) {
  if (method === 'webview') {
    if (isNativeCapacitor()) {
      return loginViaSsoWebView({ username, password });
    }
    throw new Error('ورود وب‌ویو تنها روی اپلیکیشن اندروید در دسترس است. لطفاً از ورود مرکزی استفاده کنید.');
  }

  // ورود روی اندروید (تلاش هوشمند نیتیو با فال‌بک وب‌ویو)
  if (isNativeCapacitor()) {
    return loginAndroid(username, password, options);
  }

  // روی وب
  const r = await fetch('/__sarvestan/sso-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      selectedUserNo: options?.selectedUserNo,
      selectedUserType: options?.selectedUserType,
    }),
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
  const [method, setMethod] = useState('sso'); // 'sso' | 'webview'
  const [selectedUni, setSelectedUni] = useState(() => getSelectedUniversity());
  const [sbuCaptchaImg, setSbuCaptchaImg] = useState('');
  const [sbuCaptchaCookie, setSbuCaptchaCookie] = useState('');
  const [sbuCaptchaInput, setSbuCaptchaInput] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [kahadAccounts, setKahadAccounts] = useState(null);
  // رمزی که برای تلاش جاری معتبر است — بعد از شکست، ورود وب‌ویو دوباره با آن نمی‌کوبد
  const lastTriedRef = useRef({ method: '', username: '', password: '', failed: false });

  const loadSbuCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const res = await fetchSbuCaptcha();
      if (res?.ok && res?.captcha) {
        setSbuCaptchaImg(res.captcha);
        setSbuCaptchaCookie(res.cookie || '');
        setSbuCaptchaInput('');
      } else {
        console.warn('Captcha load warning:', res?.error);
      }
    } catch (err) {
      console.error('[loadSbuCaptcha error]', err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    if (selectedUni === 'sbu' && !sbuCaptchaImg) {
      loadSbuCaptcha();
    }
  }, [selectedUni]);

  const handleSelectUni = (uniId) => {
    if (busyRef.current) return;
    setSelectedUni(uniId);
    setSelectedUniversity(uniId);
    if (uniId === 'sbu' && !sbuCaptchaImg) {
      loadSbuCaptcha();
    }
  };

  // پر کردن نام کاربری/رمز ذخیره‌شده — ورود دوم بدون تایپ
  useEffect(() => {
    const saved = loadSavedCreds();
    if (saved) {
      if (!getLoginSnapshot().username) setLoginUsername(saved.username);
      if (!getLoginSnapshot().password) setLoginPassword(saved.password);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = flow.busy || busyRef.current;
  const done = flow.done;
  const stepIdx = flow.stepIdx;
  const username = flow.username;
  const password = flow.password;
  const error = flow.error;
  const remember = flow.remember !== false;

  const handleDismiss = () => {
    if (busy) return;
    closeLoginModal();
    onSuccess?.();
  };

  const handleLogin = async (loginOptions = {}) => {
    if (busyRef.current) return;
    const u = String(username || '').trim();
    const p = password;

    // مسیر ورود مستقیم دانشگاه شهید بهشتی
    if (selectedUni === 'sbu') {
      const c = String(sbuCaptchaInput || '').trim();
      if (!u || !p || !c) {
        failLoginFlow(-1, 'شماره دانشجویی، رمز عبور و کد امنیتی الزامی است.');
        return;
      }

      busyRef.current = true;
      beginLoginFlow();

      try {
        setLoginStep(0);
        const t0 = Date.now();
        const j = await loginViaSbuDirect(u, p, c, sbuCaptchaCookie);

        if (!j?.ok || !j?.sid || !j?.ticket) {
          busyRef.current = false;
          try { clearSession(); } catch {}
          if (j?.newCaptcha) {
            setSbuCaptchaImg(j.newCaptcha);
            setSbuCaptchaInput('');
          } else {
            loadSbuCaptcha();
          }
          failLoginFlow(-1, j?.error || 'ورود ناموفق — اطلاعات را بررسی کنید.');
          return;
        }

        if (remember) {
          commitCredsOnSuccess(u, p);
        }
        setSelectedUniversity('sbu');

        applyManualSession(
          {
            sid: j.sid,
            ticket: j.ticket,
            studentId: j.studentId || u,
            cookies: j.cookies || undefined,
            university: 'sbu',
          },
          { replace: true },
        );

        if (!isSessionAlive()) {
          busyRef.current = false;
          try { clearSession(); } catch {}
          failLoginFlow(-1, 'نشست شهید بهشتی ثبت نشد. دوباره تلاش کنید.');
          return;
        }

        const wait0 = MIN_STEP_MS - (Date.now() - t0);
        if (wait0 > 0) await sleep(wait0);

        setLoginStep(1);
        resetSyncState();
        await sleep(350);

        setLoginStep(2);
        try {
          await Promise.race([
            runFullSync({ force: true }),
            sleep(8000).then(() => ({ ok: false, reason: 'timeout' })),
          ]);
        } catch (e) {
          console.warn('[sbu initial sync error]', e);
        }

        setLoginStep(3);
        setLoginDone(true);
        busyRef.current = false;
        try {
          sessionStorage.removeItem('sarvestan_manual_logout');
        } catch {}
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.has('login')) {
            url.searchParams.delete('login');
            window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
          }
        } catch {}
        await sleep(400);
        closeLoginModal();
        if (typeof onSuccess === 'function') {
          onSuccess();
        } else if (!asModal) {
          window.location.replace(window.location.origin + window.location.pathname);
        }
      } catch (err) {
        busyRef.current = false;
        loadSbuCaptcha();
        failLoginFlow(-1, networkErrorMessage(err));
      }
      return;
    }

    // مسیر ورود خواجه نصیرالدین طوسی (KNTU)
    setSelectedUniversity('kntu');
    if (method === 'sso' && (!u || !p)) {
      failLoginFlow(-1, 'نام کاربری و رمز عبور الزامی است.');
      return;
    }

    busyRef.current = true;
    const prevTried = lastTriedRef.current;
    const stripFailedPass =
      method === 'webview' && prevTried.failed && prevTried.password === p && prevTried.username === u;
    lastTriedRef.current = { method, username: u, password: p, failed: false };
    beginLoginFlow();

    try {
      if (!loginOptions?.selectedUserNo) {
        try {
          beginFreshLoginSession();
          await clearSsoCookies();
        } catch {}
      }

      setLoginStep(0);
      const t0 = Date.now();

      let j = await doLogin(u, stripFailedPass ? '' : p, method, loginOptions);

      // اگر کاربر کهاد/دو رشته‌ای بود و لیست اکانت‌ها برگشت
      if (!j?.ok && j?.code === 'needs-kahad-selection' && j?.accounts?.length > 0) {
        busyRef.current = false;
        failLoginFlow(-1, '');
        setKahadAccounts(j.accounts);
        return;
      }

      // فال‌بک وب‌ویو اگر نیاز به انتخاب تعاملی باشد
      if (!j?.ok && j?.code === 'needs-account-selection' && isNativeCapacitor()) {
        try {
          setMethod('webview');
          j = await loginViaSsoWebView({ username: u, password: p });
        } catch (err) {
          j = { ok: false, error: 'انصراف یا خطا در انتخاب رشته کهاد' };
        }
      }

      if (!j?.ok || !j?.sid || !j?.ticket) {
        lastTriedRef.current.failed = true;
        busyRef.current = false;
        // نشست ناقص قبلی نماند
        try { clearSession(); } catch {}
        const failMsg = authErrorMessage(j);
        // رمز ذخیره‌شده اگر همین بار رد شد، دوباره خودکار پر نشود
        if (j?.code === 'bad-credentials' || /اشتباه|نادرست/.test(failMsg)) {
          try {
            const saved = loadSavedCreds();
            if (saved && saved.username === u) clearSavedCreds();
          } catch {}
        }
        failLoginFlow(-1, failMsg);
        return;
      }

      commitCredsOnSuccess(u, p);

      applyManualSession(
        {
          sid: j.sid,
          ticket: j.ticket,
          studentId: j.studentId || undefined,
          userId: j.userId || parseUidFromCookies(j.cookies) || undefined,
          cookies: j.cookies || undefined,
        },
        { replace: true },
      );

      if (!isSessionAlive()) {
        lastTriedRef.current.failed = true;
        busyRef.current = false;
        try { clearSession(); } catch {}
        failLoginFlow(-1, 'نشست ثبت نشد. رمز را بررسی و دوباره تلاش کنید.');
        return;
      }

      const wait0 = MIN_STEP_MS - (Date.now() - t0);
      if (wait0 > 0) await sleep(wait0);

      setLoginStep(1);
      resetSyncState();
      await sleep(350);

      setLoginStep(2);
      // تلاش برای سنک اولیه — اگر نشست مرد باشد خطا نشان بده، وگرنه timeout بی‌خیال
      let syncBlocked = false;
      try {
        const syncRes = await Promise.race([
          runFullSync({ force: true }),
          sleep(8000).then(() => ({ ok: false, reason: 'timeout' })),
        ]);
        if (syncRes?.reason === 'session-expired' || syncRes?.reason === 'no-session') {
          syncBlocked = true;
        }
      } catch (e) {
        if (/نشست|session|50216|403/i.test(String(e?.message || e))) syncBlocked = true;
      }

      if (syncBlocked) {
        lastTriedRef.current.failed = true;
        busyRef.current = false;
        try { clearSession(); } catch {}
        failLoginFlow(-1, 'نشست معتبر نشد. رمز یا وضعیت حساب را بررسی کنید.');
        return;
      }

      setLoginStep(3);
      setLoginDone(true);
      busyRef.current = false;
      try {
        sessionStorage.removeItem('sarvestan_manual_logout');
      } catch {}
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('login')) {
          url.searchParams.delete('login');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      } catch {}
      await sleep(400);
      closeLoginModal();
      if (typeof onSuccess === 'function') {
        onSuccess();
      } else if (!asModal) {
        window.location.replace(window.location.origin + window.location.pathname);
      }
    } catch (e) {
      lastTriedRef.current.failed = true;
      busyRef.current = false;
      try { clearSession(); } catch {}
      failLoginFlow(-1, networkErrorMessage(e));
    }
  };

  const native = isNativeCapacitor();

  const card = (
    <div
      className={`w-full ${asModal ? 'max-w-full' : 'max-w-[400px]'} sarv-card p-6 space-y-4 border border-primary/25 relative`}
    >
      {asModal && !busy && !done && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="بستن"
          className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-base-500/15 hover:bg-base-500/30 text-neutral hover:text-base-content flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="flex flex-col items-center gap-2">
        <img
          src="/sarv-icon.svg"
          alt="سروستان"
          className="w-16 h-16 rounded-3xl object-contain shadow-lg ring-2 ring-primary/30 bg-base"
        />
        <h1 className="text-[20px] font-black text-base-content">سروستان</h1>
        <p className="text-[11.5px] text-neutral text-center">
          ورود زنده به بهستان — داده‌ها محلی پردازش می‌شوند
        </p>
      </div>

      {/* انتخاب دانشگاه */}
      <div className="grid grid-cols-2 p-1 bg-base-500/20 rounded-2xl border border-white/5 text-[12px] font-medium">
        <button
          type="button"
          onClick={() => handleSelectUni('kntu')}
          disabled={busy}
          className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedUni === 'kntu'
              ? 'bg-primary text-white shadow-md font-bold'
              : 'text-neutral hover:text-base-content'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">خواجه نصیر</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectUni('sbu')}
          disabled={busy}
          className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedUni === 'sbu'
              ? 'bg-primary text-white shadow-md font-bold'
              : 'text-neutral hover:text-base-content'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">شهید بهشتی</span>
        </button>
      </div>

      {/* فرم خواجه نصیر */}
      {selectedUni === 'kntu' && (
        <>
          {native && (
            <div className="grid grid-cols-2 p-1 bg-base-500/20 rounded-2xl border border-white/5 text-[12px] font-medium">
              <button
                type="button"
                onClick={() => {
                  if (lastTriedRef.current.failed && lastTriedRef.current.password) {
                    lastTriedRef.current = { ...lastTriedRef.current, password: '' };
                    setLoginPassword('');
                  }
                  setMethod('sso');
                }}
                disabled={busy}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'sso'
                    ? 'bg-primary text-white shadow-md font-bold'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>ورود مرکزی (SSO)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (lastTriedRef.current.failed && lastTriedRef.current.password) {
                    lastTriedRef.current = { ...lastTriedRef.current, password: '' };
                    setLoginPassword('');
                  }
                  setMethod('webview');
                }}
                disabled={busy}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  method === 'webview'
                    ? 'bg-primary text-white shadow-md font-bold'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>وب‌ویو بهستان</span>
              </button>
            </div>
          )}

          {method === 'sso' && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 px-1 text-[11px] text-primary/90 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>احراز هویت مرکزی دانشگاه (sso.kntu.ac.ir — بدون کپچا)</span>
              </div>

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
                    نام کاربری (کد ملی / شماره دانشجویی)
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

              <div className="pt-1 px-1">
                <SarvCheckbox
                  checked={remember}
                  disabled={busy}
                  onChange={(checked) => setLoginRemember(checked)}
                  label="مرا به خاطر بسپار"
                  description="ورود سریع بدون تایپ مجدد رمز"
                  variant="primary"
                />
              </div>
            </div>
          )}

          {method === 'webview' && (
            <div className="rounded-2xl bg-primary-soft border border-primary-soft p-3.5 space-y-2">
              <p className="text-[12px] font-bold text-primary">راهنمای ورود با وب‌ویو</p>
              <ol className="text-[11.5px] text-neutral leading-relaxed list-decimal pr-4 space-y-1.5">
                <li>روی دکمهٔ <strong className="text-base-content">«ورود با سامانهٔ دانشگاه»</strong> بزن</li>
                <li>پنجرهٔ سامانه دانشگاه باز می‌شود و اطلاعات خود را وارد کن</li>
                <li>پس از ورود موفق، نشست به صورت خودکار شناسایی و همگام‌سازی می‌شود</li>
              </ol>
            </div>
          )}
        </>
      )}

      {/* فرم دانشگاه شهید بهشتی */}
      {selectedUni === 'sbu' && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-1.5 px-1 text-[11px] text-primary/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>سامانه بهستان دانشگاه شهید بهشتی (ems.sbu.ac.ir)</span>
          </div>

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
                id="sarv-sbu-user"
                disabled={busy}
                className="input"
              />
              <label htmlFor="sarv-sbu-user" className="input-label-placeholder">
                شماره دانشجویی / نام کاربری
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
                id="sarv-sbu-pass"
                disabled={busy}
                className="input"
              />
              <label htmlFor="sarv-sbu-pass" className="input-label-placeholder">
                رمز عبور بهستان
              </label>
            </div>
          </div>

          {/* کادر کد امنیتی (کپچا) */}
          <div className="flex items-center gap-2">
            <div className="input-wrap input-primary flex-1">
              <div className="input-box">
                <input
                  type="text"
                  value={sbuCaptchaInput}
                  onChange={(e) => setSbuCaptchaInput(e.target.value)}
                  placeholder=" "
                  autoComplete="off"
                  dir="ltr"
                  id="sarv-sbu-captcha"
                  disabled={busy}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                  className="input font-mono text-[16px] tracking-widest font-bold"
                />
                <label htmlFor="sarv-sbu-captcha" className="input-label-placeholder">
                  کد تصویر امنیتی
                </label>
              </div>
            </div>

            {/* تصویر کپچا + دکمه نوسازی */}
            <div className="flex items-center gap-1.5 bg-base-500/15 p-1 rounded-2xl border border-white/5 h-[46px] shrink-0">
              {loadingCaptcha ? (
                <div className="w-24 h-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              ) : sbuCaptchaImg ? (
                <img
                  src={`data:image/jpeg;base64,${sbuCaptchaImg}`}
                  alt="کد امنیتی"
                  className="h-full rounded-xl object-contain bg-white px-1 select-none cursor-pointer"
                  onClick={loadSbuCaptcha}
                  title="کلیک برای نوسازی کد"
                />
              ) : (
                <button
                  type="button"
                  onClick={loadSbuCaptcha}
                  className="text-[11px] text-primary px-2 font-medium cursor-pointer"
                >
                  دریافت کد
                </button>
              )}
              <button
                type="button"
                onClick={loadSbuCaptcha}
                disabled={loadingCaptcha || busy}
                className="w-8 h-8 rounded-xl bg-base-500/25 hover:bg-base-500/40 text-neutral hover:text-base-content flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="تغییر کد امنیتی"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCaptcha ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="pt-1 px-1">
            <SarvCheckbox
              checked={remember}
              disabled={busy}
              onChange={(checked) => setLoginRemember(checked)}
              label="مرا به خاطر بسپار"
              description="ذخیره امن شماره دانشجویی و رمز"
              variant="primary"
            />
          </div>
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
        ) : selectedUni === 'sbu' ? (
          <>
            <LogIn className="w-4 h-4" />
            ورود به بهستان شهید بهشتی
          </>
        ) : method === 'webview' ? (
          <>
            <Globe className="w-4 h-4" />
            ورود با سامانهٔ دانشگاه
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            ورود و دریافت دیتای زنده
          </>
        )}
      </motion.button>


      {stepIdx >= 0 && !error && (
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
        <div className="space-y-2">
          <p className="text-[11.5px] text-danger bg-danger-soft border border-danger-soft rounded-xl px-3 py-2 leading-relaxed">
            {error}
          </p>
          {native && method !== 'webview' && (
            <button
              type="button"
              onClick={() => {
                // رمز شکست‌خورده را از state هم بردار تا وب‌ویو پر/کوب نشود
                lastTriedRef.current = {
                  ...lastTriedRef.current,
                  failed: true,
                  password: '',
                };
                setLoginPassword('');
                setMethod('webview');
              }}
              className="w-full py-2 px-3 text-[12px] font-bold text-primary bg-primary-soft hover:bg-primary/20 border border-primary/25 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>تغییر روش ورود: وب‌ویو مستقیم دانشگاه</span>
            </button>
          )}
        </div>
      )}

      {busy && !done && (
        <p className="text-[10.5px] text-neutral text-center">
          دیتاها در حال دریافت است — تا پایان صبر کن
        </p>
      )}
    </div>
  );

  const kahadModal = kahadAccounts && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ backgroundColor: 'var(--theme-color-base, #161618)' }}
        className="w-full max-w-[380px] rounded-3xl border border-base-500 p-6 shadow-2xl flex flex-col gap-4 text-right relative z-10"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-black text-base-content">انتخاب پرونده تحصیلی</h3>
            <p className="text-[11px] text-neutral mt-0.5 font-medium">طرح کهاد / چند رشته‌ای</p>
          </div>
        </div>

        <p className="text-[11.5px] leading-relaxed text-neutral">
          برای این کدملی دو پرونده تحصیلی در سیستم دانشگاه ثبت شده است. با توجه به اینکه پشتیبانی از طرح کهاد و رشته دوم در دست توسعه است، در حال حاضر ورود به پرونده رشته اصلی فعال می‌باشد:
        </p>

        <div className="flex flex-col gap-2.5 my-1">
          {kahadAccounts.map((acc, idx) => {
            const isKahad = idx > 0 || /کهاد|دوم/.test(String(acc.DegreeName || acc.Degree || ''));
            const label = isKahad ? 'طرح کهاد / رشته دوم (در دست توسعه)' : (acc.DegreeName || acc.Degree || 'رشته اصلی');

            if (isKahad) {
              return (
                <div
                  key={acc.UserNo || idx}
                  className="w-full text-right p-3 rounded-2xl border transition-all flex items-center justify-between bg-base-500/10 border-base-500/25 opacity-55 cursor-not-allowed select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-base-500/20 text-neutral">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral">
                        {acc.UserLabel || acc.FacultyName || `دانشجو: ${acc.UserNo}`}
                      </div>
                      <div className="text-[10px] text-neutral mt-0.5">
                        شماره دانشجویی: {acc.UserNo}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-lg font-bold shrink-0 mr-2 bg-base-500/30 text-neutral">
                    غیرفعال موقت
                  </span>
                </div>
              );
            }

            return (
              <button
                key={acc.UserNo || idx}
                type="button"
                onClick={() => {
                  const pickedNo = acc.UserNo;
                  const pickedType = acc.UserType || '1';
                  setKahadAccounts(null);
                  handleLogin({ selectedUserNo: pickedNo, selectedUserType: pickedType });
                }}
                className="w-full text-right p-3.5 rounded-2xl border transition-all flex items-center justify-between bg-primary-soft/20 hover:bg-primary-soft/40 border-primary/40 hover:border-primary shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary-soft text-primary">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-base-content">
                      {acc.UserLabel || acc.FacultyName || `دانشجو: ${acc.UserNo}`}
                    </div>
                    <div className="text-[10.5px] text-neutral mt-0.5">
                      شماره دانشجویی: {acc.UserNo}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold shrink-0 mr-2 bg-primary text-primary-content">
                  {label} (انتخاب)
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setKahadAccounts(null)}
          className="w-full py-2.5 text-center text-xs font-bold text-neutral hover:text-base-content transition-colors"
        >
          انصراف
        </button>
      </motion.div>
    </div>
  );

  if (asModal) {
    return (
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
        {kahadModal}
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
          {card}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-base text-base-content mobile-shell">
      {kahadModal}
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