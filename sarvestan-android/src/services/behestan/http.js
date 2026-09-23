/**
 * HTTP سریال با تأخیر — ضدبن
 * - لوکال: از پراکسی Vite (`/behestan-api`) برای دور زدن CORS
 * - WebView/اندروید: origin مستقیم بهستان یا CapacitorHttp
 */

import { BEHESTAN_ORIGIN } from './session';

let chain = Promise.resolve();
let seq = 800000100;

export function nextSeq() {
  seq += 1;
  return String(seq);
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getCapacitorHttp() {
  try {
    const C = globalThis.Capacitor;
    // فقط روی پلتفرم نیتیو موبایل (اندروید/iOS) از CapacitorHttp استفاده کن؛
    // روی مرورگر وب، CapacitorHttp یک شبیه‌ساز است که fetch خام بدون CORS می‌زند!
    if (C?.isNativePlatform?.() && C?.Plugins?.CapacitorHttp) {
      return C.Plugins.CapacitorHttp;
    }
  } catch {}
  return null;
}

/** آیا باید از پراکسی لوکال استفاده کنیم؟ */
export function shouldUseLocalProxy() {
  try {
    const C = globalThis.Capacitor;
    if (C?.isNativePlatform?.()) return false;
    const h = location.hostname;
    // داخل بهستان/SSO: مستقیم
    if (h.endsWith('kntu.ac.ir') || h.includes('behestan') || h.includes('sso.kntu')) return false;
    // هر هاست لوکال / شبکهٔ داخلی dev → پراکسی
    return true;
  } catch {
    return false;
  }
}

async function rawPost(url, bodyObj) {
  const body = typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj);
  let cookie = '';
  let sid = '';
  try {
    const raw = localStorage.getItem('sarvestan_mobile_session');
    const parsed = raw ? JSON.parse(raw) : null;
    cookie = parsed?.cookies || '';
    sid = parsed?.sid || '';
  } catch {}

  let fullCookie = cookie;
  if (sid && !fullCookie.includes('ASP.NET_SessionId')) {
    fullCookie = fullCookie ? `${fullCookie}; ASP.NET_SessionId=${sid}` : `ASP.NET_SessionId=${sid}`;
  }

  const http = getCapacitorHttp();
  if (http?.post) {
    const target = url.startsWith('/') ? `${BEHESTAN_ORIGIN}${url}` : url;
    let postData = bodyObj;
    if (typeof bodyObj === 'string') {
      try {
        postData = JSON.parse(bodyObj);
      } catch {
        postData = bodyObj;
      }
    }
    const res = await http.post({
      url: target,
      data: postData,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        ...(fullCookie ? { Cookie: fullCookie } : {}),
      },
      connectTimeout: 20000,
      readTimeout: 30000,
    });
    if (res.status >= 400) {
      if (res.status === 403) {
        throw new Error('HTTP 403: نشست بهستان منقضی شده یا دسترسی مجاز نیست.');
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? '');
  }

  let finalUrl = url;
  if (shouldUseLocalProxy() && url.startsWith('https://behestan.kntu.ac.ir')) {
    finalUrl = url.replace('https://behestan.kntu.ac.ir', '/behestan-api');
  }

  let resp;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    resp = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        ...(fullCookie ? { 'X-Behestan-Cookie': fullCookie } : {}),
        ...(sid ? { 'X-Behestan-Sid': sid } : {}),
      },
      body,
      credentials: 'omit',
      mode: 'cors',
      signal: ctrl.signal,
    });
    clearTimeout(timer);
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('timeout 25s');
    throw new Error(`شبکه/CORS: ${e?.message || e}`);
  }
  if (!resp.ok) {
    let detail = '';
    try {
      detail = (await resp.text()).slice(0, 180);
    } catch {}
    if (resp.status === 403) {
      throw new Error('HTTP 403: نشست بهستان منقضی شده یا دسترسی مجاز نیست.');
    }
    const cleanDetail = detail.includes('<html') ? '' : detail.replace(/\s+/g, ' ').slice(0, 120);
    throw new Error(`HTTP ${resp.status}${cleanDetail ? ' ' + cleanDetail : ''}`);
  }
  return resp.text();
}

/**
 * صف سریالی — تأخیر کوتاه برای اولین رندر، هنوز سریال
 */
export function enqueuePost(url, bodyObj, { minDelay = 180, maxDelay = 420 } = {}) {
  const run = chain.then(async () => {
    const wait = minDelay + Math.floor(Math.random() * (maxDelay - minDelay));
    await delay(wait);
    return rawPost(url, bodyObj);
  });
  chain = run.catch(() => {});
  return run;
}

export function serviceUrl(path) {
  // همیشه URL کامل بهستان بده؛ http.js در لوکال rewrite می‌کند
  return `${BEHESTAN_ORIGIN}${path}`;
}
