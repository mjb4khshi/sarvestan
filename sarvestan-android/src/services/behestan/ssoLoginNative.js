/**
 * ورود اندروید: اول WebView بومی (مثل مرورگر واقعی)
 * اگر پلاگین در دسترس نبود → CapacitorHttp fallback
 */

const SSO_ORIGIN = 'https://sso.kntu.ac.ir';
const REALM = 'kntu';
const CLIENT_ID = 'behestan.kntu.ac.ir';
const REDIRECT_URI = 'https://behestan.kntu.ac.ir/index.html';
const OAUTH_VERIFY = 'https://behestan.kntu.ac.ir/frmc/Authentication/oauth2/';
const BEHESTAN = 'https://behestan.kntu.ac.ir';
const UA =
  'Mozilla/5.0 (Linux; Android 14; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

function plugins() {
  try {
    return globalThis.Capacitor?.Plugins || {};
  } catch {
    return {};
  }
}

function http() {
  return plugins().CapacitorHttp || null;
}

export function isNativeCapacitor() {
  try {
    return Boolean(globalThis.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function hasSsoWebViewPlugin() {
  return Boolean(plugins().SsoWebView);
}

/** تلاش اول: WebView واقعی بهستان */
export async function loginViaSsoWebView() {
  const p = plugins().SsoWebView;
  if (!p?.login) {
    return { ok: false, error: 'پلاگین WebView در دسترس نیست', code: 'no-plugin' };
  }
  try {
    const res = await p.login({});
    if (res?.ok && res.sid && res.ticket) {
      return {
        ok: true,
        sid: res.sid,
        ticket: res.ticket,
        studentId: res.studentId || null,
        source: 'webview',
      };
    }
    return { ok: false, error: 'نشست ساخته نشد', code: 'empty' };
  } catch (e) {
    return {
      ok: false,
      error: String(e?.message || e?.error || e || 'خطای WebView'),
      code: 'webview-error',
    };
  }
}

/* ── Fallback با CapacitorHttp (همان منطق قبلی، ساده‌تر) ── */

function bodyText(res) {
  const d = res?.data;
  if (d == null) return '';
  if (typeof d === 'string') return d;
  try {
    return JSON.stringify(d);
  } catch {
    return String(d);
  }
}

function headerVal(res, name) {
  const h = res?.headers || {};
  const want = name.toLowerCase();
  for (const key of Object.keys(h)) {
    if (key.toLowerCase() === want) return h[key];
  }
  return undefined;
}

function mergeCookies(jar, setCookies) {
  const map = new Map();
  const add = (pair) => {
    const p = String(pair).split(';')[0].trim();
    const i = p.indexOf('=');
    if (i > 0) map.set(p.slice(0, i), p);
  };
  String(jar || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach(add);
  let list = setCookies == null ? [] : Array.isArray(setCookies) ? setCookies : [setCookies];
  for (const c of list) add(c);
  return [...map.values()].join('; ');
}

async function httpGet(url, cookie = '') {
  const h = http();
  const res = await h.get({
    url,
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/json,*/*',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    connectTimeout: 25000,
    readTimeout: 30000,
    responseType: 'text',
    disableRedirect: true,
  });
  return {
    status: Number(res.status || 0),
    body: bodyText(res),
    location: headerVal(res, 'location'),
    cookie: mergeCookies(cookie, headerVal(res, 'set-cookie')),
  };
}

async function httpPostForm(url, { body, cookie = '', referer }) {
  const h = http();
  const res = await h.post({
    url,
    data: body,
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/json,*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(referer ? { Referer: referer } : {}),
      Origin: SSO_ORIGIN,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    connectTimeout: 25000,
    readTimeout: 30000,
    responseType: 'text',
    disableRedirect: true,
  });
  return {
    status: Number(res.status || 0),
    body: bodyText(res),
    location: headerVal(res, 'location'),
    cookie: mergeCookies(cookie, headerVal(res, 'set-cookie')),
  };
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x3d;/gi, '=');
}

function findFormAction(html) {
  const m =
    html.match(/<form[^>]*action\s*=\s*["']([^"']+)["']/i) ||
    html.match(/action\s*=\s*["']([^"']+)["']/i);
  return m ? decodeHtml(m[1]).trim() : null;
}

function extractHiddenFields(html) {
  const out = {};
  const re = /<input[^>]+type=["']hidden["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html || ''))) {
    const tag = m[0];
    const name = tag.match(/name\s*=\s*["']([^"']+)["']/i)?.[1];
    const value = tag.match(/value\s*=\s*["']([^"']*)["']/i)?.[1];
    if (name) out[name] = decodeHtml(value ?? '');
  }
  return out;
}

/** تلاش دوم: همان فرم Keycloak با CapacitorHttp */
export async function loginViaNativeSso(username, password) {
  if (!http()) {
    return { ok: false, error: 'CapacitorHttp در دسترس نیست' };
  }
  if (!username || !password) {
    return { ok: false, error: 'نام کاربری و رمز الزامی است' };
  }

  const state = 'st' + Date.now();
  const authUrl =
    `${SSO_ORIGIN}/realms/${REALM}/protocol/openid-connect/auth` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code&scope=${encodeURIComponent('openid profile')}&state=${state}`;

  let current = authUrl;
  let jar = '';
  let html = '';
  let status = 0;
  for (let i = 0; i < 8; i++) {
    const r = await httpGet(current, jar);
    jar = r.cookie;
    status = r.status;
    html = r.body;
    if (r.status >= 300 && r.status < 400 && r.location) {
      current = new URL(r.location, current).toString();
      continue;
    }
    break;
  }

  const action = findFormAction(html);
  if (!action) {
    return {
      ok: false,
      error: 'فرم SSO پیدا نشد — اینترنت/VPN را عوض کن',
    };
  }

  const hidden = extractHiddenFields(html);
  const params = new URLSearchParams();
  params.set('username', String(username).trim());
  params.set('password', String(password));
  params.set('credentialId', '');
  for (const [k, v] of Object.entries(hidden)) {
    if (k === 'username' || k === 'password') continue;
    params.set(k, v);
  }
  if (!params.has('login')) params.set('login', 'Sign In');

  let loginUrl = action;
  try {
    loginUrl = new URL(action, current).toString();
  } catch {}

  let finalUrl = loginUrl;
  let loginBody = '';
  let loginCookie = jar;
  for (let i = 0; i < 10; i++) {
    const r = await httpPostForm(finalUrl, {
      body: params.toString(),
      cookie: loginCookie,
      referer: current,
    });
    loginCookie = r.cookie;
    loginBody = r.body;
    if (r.status >= 300 && r.status < 400 && r.location) {
      finalUrl = new URL(r.location, finalUrl).toString();
      const g = await httpGet(finalUrl, loginCookie);
      loginCookie = g.cookie;
      loginBody = g.body;
      if (g.location) {
        finalUrl = new URL(g.location, finalUrl).toString();
        continue;
      }
      break;
    }
    break;
  }

  let code = null;
  try {
    code = new URL(finalUrl).searchParams.get('code');
  } catch {}
  if (!code) {
    const m = String(loginBody || '').match(/code=([A-Za-z0-9._~%-]+)/);
    if (m) code = decodeURIComponent(m[1]);
  }
  if (!code) {
    const err =
      loginBody.match(/kc-feedback-text[^>]*>\s*([^<]+)/i)?.[1]?.trim() || '';
    return { ok: false, error: err || 'ورود SSO ناموفق — رمز/کاربری یا شبکه' };
  }

  let behestanCookie = loginCookie;
  try {
    let u = `${BEHESTAN}/index.html?state=${state}&code=${encodeURIComponent(code)}`;
    for (let i = 0; i < 5; i++) {
      const r = await httpGet(u, behestanCookie);
      behestanCookie = r.cookie;
      if (r.status >= 300 && r.status < 400 && r.location) {
        u = new URL(r.location, u).toString();
        continue;
      }
      break;
    }
  } catch {}

  const h = http();
  const verify = await h.post({
    url: OAUTH_VERIFY,
    data: {
      act: '09',
      r: { code, ticket: '', l: '', p: '', d: '0', c: '', rsc: '112' },
      rp: {},
    },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Referer: `${BEHESTAN}/`,
      Origin: BEHESTAN,
      ...(behestanCookie ? { Cookie: behestanCookie } : {}),
    },
    connectTimeout: 25000,
    readTimeout: 30000,
    responseType: 'json',
  });

  let data = verify.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      data = null;
    }
  }
  if (!data) {
    try {
      data = JSON.parse(bodyText(verify));
    } catch {
      return { ok: false, error: 'پاسخ oauth2 نامعتبر بود' };
    }
  }

  const sid = data?.oaut?.rp?.sid;
  const ticket = data?.t;
  if (!sid || !ticket) {
    const errs = data?.msg?.errors;
    return {
      ok: false,
      error: (Array.isArray(errs) && errs[0]) || 'نشست از بهستان برنگشت',
    };
  }

  return {
    ok: true,
    sid,
    ticket,
    cookies: behestanCookie,
    studentId: null,
    source: 'http',
  };
}

/** ورود یکپارچه اندروید */
export async function loginAndroid(username, password) {
  // ۱) WebView (بهترین)
  if (hasSsoWebViewPlugin()) {
    const wv = await loginViaSsoWebView();
    if (wv.ok) return wv;
    // اگر WebView کاربر را بست بدون نشست، fallback نکن و همان خطا را بده
    if (wv.code === 'no-plugin') {
      // ادامه به http
    } else {
      return wv;
    }
  }
  // ۲) CapacitorHttp
  return loginViaNativeSso(username, password);
}
