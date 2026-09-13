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
    if (C?.Plugins?.CapacitorHttp) return C.Plugins.CapacitorHttp;
  } catch {}
  return null;
}

/** آیا باید از پراکسی لوکال استفاده کنیم؟ */
export function shouldUseLocalProxy() {
  try {
    if (getCapacitorHttp()) return false;
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
  const http = getCapacitorHttp();
  if (http?.post) {
    const target = url.startsWith('/') ? `${BEHESTAN_ORIGIN}${url}` : url;
    // کوکی نشست اگر هست بفرست (بستان گاهی لازمش دارد)
    let cookie = '';
    try {
      const raw = localStorage.getItem('sarvestan_mobile_session');
      cookie = raw ? JSON.parse(raw)?.cookies || '' : '';
    } catch {}
    const res = await http.post({
      url: target,
      data: typeof bodyObj === 'string' ? bodyObj : bodyObj,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      connectTimeout: 15000,
      readTimeout: 25000,
    });
    return typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? '');
  }

  let finalUrl = url;
  if (shouldUseLocalProxy() && url.startsWith('https://behestan.kntu.ac.ir')) {
    finalUrl = url.replace('https://behestan.kntu.ac.ir', '/behestan-api');
  }

  // Preflight محلی از پراکسی (بدون رفتن به بهستان)
  if (finalUrl.startsWith('/behestan-api')) {
    try {
      await fetch(finalUrl, {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
          Origin: location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,accept',
        },
      });
    } catch {}
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
    // فقط خطای شبکه/HTTP را بده؛ جزئیات HTML را کوتاه کن
    throw new Error(`HTTP ${resp.status} ${detail.replace(/\s+/g, ' ').slice(0, 120)}`);
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
