/**
 * ورود سریع بهستان — پاپ‌آپ + کپی/پیست نشست (مرورگر)
 * روی WebView/کپاکیتور: آمادهٔ خواندن خودکار localStorage
 */
import { BEHESTAN_ORIGIN, saveManualSession, isSessionAlive } from './session';

export const LOGIN_SNIPPET = `copy(JSON.stringify({sid:localStorage.getItem('sid')||localStorage.getItem('SID'),ticket:localStorage.getItem('t'),studentId:localStorage.getItem('un')||localStorage.getItem('std')||localStorage.getItem('stdno'),userId:localStorage.getItem('u')||localStorage.getItem('uid')}))`;

// alias
export const BEHESTAN_CONSOLE_SNIPPET = LOGIN_SNIPPET;

export function openBehestanLogin() {
  const w = window.open(
    BEHESTAN_ORIGIN + '/',
    'sarvestan_behestan_login',
    'width=420,height=720,noopener=no',
  );
  if (!w || w.closed) {
    // مرورگر popup را بست — تب جدید
    window.open(BEHESTAN_ORIGIN + '/', '_blank');
  }
  return true;
}

/** پارس JSON یا رشتهٔ کپی‌شده از کنسول بهستان */
export function parseSessionBlob(text) {
  if (!text) return null;
  let s = String(text).trim();
  // اگر کاربر خروجی copy() را گرفته باشد ممکن است «"..."» یا با quote اضافه باشد
  s = s.replace(/^["']|["']$/g, '');
  try {
    const obj = JSON.parse(s);
    if (obj && typeof obj === 'object') {
      return {
        sid: obj.sid || obj.SID || undefined,
        ticket: obj.ticket || obj.t || undefined,
        studentId: obj.studentId || obj.std || obj.un || undefined,
        userId: obj.userId || obj.u || undefined,
      };
    }
  } catch {
    // شاید کاربر فقط متن کلیدها را چسبانده
  }
  // تلاش: key=value
  const grab = (key) => {
    const m = s.match(new RegExp(`${key}\\s*[=:]\\s*['"]?([^'"\s,}]+)`, 'i'));
    return m ? m[1] : undefined;
  };
  const parsed = {
    sid: grab('sid'),
    ticket: grab('ticket') || grab('t'),
    studentId: grab('studentId') || grab('un') || grab('std'),
    userId: grab('userId') || grab('u'),
  };
  if (parsed.sid || parsed.ticket || parsed.studentId) return parsed;
  return null;
}

export async function readClipboardSession() {
  try {
    const text = await navigator.clipboard.readText();
    return parseSessionBlob(text);
  } catch {
    return null;
  }
}

export async function copyLoginSnippet() {
  try {
    await navigator.clipboard.writeText(LOGIN_SNIPPET);
    return true;
  } catch {
    return false;
  }
}

export function applySession(fields) {
  const clean = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if (v && String(v).trim()) clean[k] = String(v).trim();
  }
  if (!clean.sid && !clean.ticket && !clean.studentId) return false;
  saveManualSession(clean);
  return isSessionAlive();
}

/**
 * اگر روی همان origin بهستان باشیم (WebView اندروید)، نشست را مستقیم بخوان
 */
export function tryReadSameOriginSession() {
  try {
    if (location.hostname.endsWith('kntu.ac.ir') || location.hostname.includes('behestan')) {
      const s = {
        sid: localStorage.getItem('sid') || undefined,
        ticket: localStorage.getItem('t') || undefined,
        studentId: localStorage.getItem('un') || localStorage.getItem('std') || undefined,
        userId: localStorage.getItem('u') || undefined,
      };
      if (s.sid || s.ticket || s.studentId) {
        applySession(s);
        return true;
      }
    }
  } catch {}
  return false;
}

// ── helpers ──
const AUTH_SVC = '/behestan-api/frm/loginapi/loginapi.svc/';
const OAUTH_VERIFY = '/behestan-api/frmc/Authentication/oauth2/';

async function postJson(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit',
    mode: 'cors',
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

function persistSession(data, fields) {
  const sid = data?.oaut?.rp?.sid || fields.sid;
  const ticket = data?.t || fields.ticket;
  if (!sid || !ticket) {
    const errors = data?.msg?.errors;
    throw new Error((Array.isArray(errors) && errors[0]) || 'نشست از بهستان برنگشت');
  }
  const studentId = fields.studentId;
  const result = { sid, ticket, studentId: studentId || null };
  applySession(result);
  try {
    localStorage.setItem('sid', sid);
    localStorage.setItem('t', ticket);
    if (studentId) localStorage.setItem('un', studentId);
    localStorage.setItem('ut', data?.oaut?.sp?.UsrType || '0');
  } catch {}
  return result;
}

// ── ورود SSO مرکزی (sso.kntu.ac.ir / Keycloak) — بدون کپچا ──
// از loginapi act=00 آدرس auth و verifyApi خوانده می‌شود

async function getLoginProviders() {
  const data = await postJson(AUTH_SVC, { r: {}, rp: {}, act: '00' });
  const raw = data?.outpar?.JsonData;
  let providers = [];
  try {
    providers = raw ? JSON.parse(raw) : [];
  } catch {
    providers = [];
  }
  if (!Array.isArray(providers) || !providers.length) {
    // fallback ثابت از HAR
    providers = [
      {
        c: 112,
        url: 'https://sso.kntu.ac.ir/realms/kntu/protocol/openid-connect/auth?client_id=behestan.kntu.ac.ir&redirect_uri=https://behestan.kntu.ac.ir/index.html&response_type=code&scope=openid profile',
        verifyApi: '/frmc/Authentication/oauth2/',
      },
    ];
  }
  return { data, providers };
}

function buildSsoUrl(provider) {
  // redirect_uri را تغییر نده — Keycloak فقط آدرس ثبت‌شدهٔ بهستان را قبول دارد
  const url = new URL(provider.url);
  if (!url.searchParams.get('redirect_uri')) {
    url.searchParams.set('redirect_uri', 'https://behestan.kntu.ac.ir/index.html');
  }
  if (!url.searchParams.get('response_type')) url.searchParams.set('response_type', 'code');
  if (!url.searchParams.get('client_id')) url.searchParams.set('client_id', 'behestan.kntu.ac.ir');
  if (!url.searchParams.get('scope')) url.searchParams.set('scope', 'openid profile');
  return url.toString();
}

/**
 * باز کردن پنجرهٔ ورود مرکزی دانشگاه
 * redirect_uri رسمی بهستان است؛ پس از لاگین کاربر روی بهستان می‌نشیند
 * و باید نشست را از همان‌جا کپی کند (کلیپ‌بورد).
 */
export async function startCentralSsoLogin() {
  const { providers } = await getLoginProviders();
  const provider = providers.find((p) => p.c === 112 || /sso\.kntu/i.test(p.url || '')) || providers[0];
  if (!provider?.url) throw new Error('آدرس SSO از بهستان پیدا نشد');
  const ssoUrl = buildSsoUrl(provider);
  const w = window.open(ssoUrl, 'sarvestan_sso', 'width=480,height=720,noopener=no');
  if (!w || w.closed) window.location.href = ssoUrl;
  return true;
}

/** تکمیل ورود پس از برگشت SSO با code */
export async function completeCentralSsoLogin(code) {
  if (!code) throw new Error('code SSO خالی است');
  let verify = '/frmc/Authentication/oauth2/';
  try {
    verify = sessionStorage.getItem('sarvestan_sso_verify') || verify;
  } catch {}
  const url = verify.startsWith('/') ? `/behestan-api${verify}` : verify;
  const data = await postJson(url, {
    act: '09',
    r: {
      code: String(code),
      ticket: '',
      l: '',
      p: '',
      d: '0',
      c: '',
      rsc: '112',
    },
    rp: {},
  });
  return persistSession(data, {});
}

/** آیا در URL کد SSO هست؟ (پس از redirect) */
export function extractSsoCodeFromUrl() {
  try {
    const u = new URL(window.location.href);
    const code = u.searchParams.get('code');
    if (!code) return null;
    // پاک کردن URL
    u.searchParams.delete('code');
    u.searchParams.delete('state');
    u.searchParams.delete('session_state');
    u.searchParams.delete('iss');
    window.history.replaceState({}, '', u.pathname + u.search + u.hash);
    return code;
  } catch {
    return null;
  }
}

/**
 * ورود SSO مرکزی با نام کاربری + رمز (بدون کپچا)
 * از طریق سرور Vite انجام می‌شود — سمت سرور فرم Keycloak را می‌زند.
 */
export async function loginWithCentralSso({ username, password, studentId }) {
  if (!username || !password) throw new Error('نام کاربری و رمز SSO الزامی است');

  const resp = await fetch('/__sarvestan/sso-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: String(username).trim(),
      password: String(password),
    }),
  });
  if (!resp.ok) {
    let detail = '';
    try {
      const j = await resp.json();
      detail = j?.error || '';
    } catch {}
    throw new Error(detail || `HTTP ${resp.status}`);
  }
  const result = await resp.json();
  if (!result?.ok) {
    throw new Error(result?.error || 'ورود SSO ناموفق');
  }

  const guessed =
    studentId?.trim() ||
    (/^\d{6,}$/.test(String(username).trim()) ? String(username).trim() : undefined);

  applySession({
    sid: result.sid,
    ticket: result.ticket,
    studentId: guessed || result.studentId || undefined,
    cookies: result.cookies || undefined,
  });
  try {
    localStorage.setItem('sid', result.sid);
    localStorage.setItem('t', result.ticket);
    if (guessed) localStorage.setItem('un', guessed);
  } catch {}

  return {
    sid: result.sid,
    ticket: result.ticket,
    studentId: guessed || null,
    cookies: result.cookies || null,
  };
}

// ── ورود با نام کاربری + رمز + کپچا (گزینهٔ جایگزین) ──

/** دریافت تصویر کپچا */
export async function fetchCaptcha() {
  const data = await postJson(AUTH_SVC, { r: {}, rp: {}, act: '00' });
  const capt = data?.capt;
  if (!capt) throw new Error('کپچا از بهستان نیامد');
  const b64 = String(capt).replace(/^data:image\/\w+;base64,/, '');
  return `data:image/jpeg;base64,${b64}`;
}

/**
 * ورود با نام کاربری و رمز
 * @param {{ username: string, password: string, captcha: string, studentId?: string }} creds
 */
export async function loginWithPassword({ username, password, captcha, studentId }) {
  if (!username || !password) throw new Error('نام کاربری و رمز الزامی است');

  const data = await postJson(AUTH_SVC, {
    act: '09',
    r: {
      code: '',
      ticket: '',
      l: String(username).trim(),
      p: String(password),
      d: '0',
      c: String(captcha || '').trim(),
    },
    rp: {},
  });

  const guessedStudent =
    studentId?.trim() ||
    (/^\d{6,}$/.test(String(username).trim()) ? String(username).trim() : undefined);

  return persistSession(data, { studentId: guessedStudent });
}
