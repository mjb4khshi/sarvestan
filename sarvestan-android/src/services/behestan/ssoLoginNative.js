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

export function hasSsoLoginPlugin() {
  return Boolean(plugins().SsoLogin);
}

/** کوکی‌های Keycloak/Sso را برای درخواست‌های IIS بهستان حذف کن */
export function cookieForHost(jar, url) {
  const raw = String(jar || '');
  try {
    const host = new URL(url).hostname || '';
    if (host.includes('behestan')) return stripKeycloakCookies(raw);
  } catch {}
  return raw;
}

/** اگر فقط کوکی‌های بهستان را برای IIS بفرستیم، نشست کاری سالم می‌ماند */
export function stripKeycloakCookies(jar) {
  return String(jar || '')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !/^(KC_|KEYCLOAK_|AUTH_SESSION_ID=|KC_RESTART=|JSESSIONID=|OAuth_Token_Request_State=)/i.test(s))
    .join('; ');
}

/** ورود مستقیم نیتیو جاوا (بدون وب‌ویو، دقیقا مانند وب با curl) */
export async function loginViaJavaSso(username, password) {
  const p = plugins().SsoLogin;
  if (!p?.login) {
    return { ok: false, error: 'پلاگین SsoLogin در دسترس نیست', code: 'no-plugin' };
  }
  try {
    const res = await p.login({
      username: String(username || '').trim(),
      password: String(password || ''),
    });
    if (res?.ok && res.sid && res.ticket) {
      return {
        ok: true,
        sid: res.sid,
        ticket: res.ticket,
        cookies: res.cookies || '',
        studentId: res.studentId || String(username || '').trim(),
        userId: res.userId || undefined,
        source: 'native_java',
      };
    }
    return { ok: false, error: res?.error || 'نشست ساخته نشد', code: res?.code || undefined };
  } catch (e) {
    const msg = String(e?.message || e?.error || e || 'خطای ورود بومی');
    const bad =
      e?.code === 'bad-credentials' ||
      /invalid username or password|bad credentials|نادرست|اشتباه/i.test(msg);
    return {
      ok: false,
      error: bad ? 'نام کاربری یا رمز عبور اشتباه است.' : msg,
      code: bad ? 'bad-credentials' : undefined,
    };
  }
}

/** ورود با WebView واقعی بهستان */
export async function loginViaSsoWebView(credentials = {}) {
  const p = plugins().SsoWebView;
  if (!p?.login) {
    return { ok: false, error: 'پلاگین WebView در دسترس نیست', code: 'no-plugin' };
  }
  try {
    const user = credentials?.username ? String(credentials.username).trim() : '';
    const pass = credentials?.password ? String(credentials.password) : '';
    const res = await p.login({
      username: user,
      password: pass,
      // بعد از شکست SSO، رمز اشتباه را خودکار نکوب — فقط نام کاربری پر شود
      allowAutoSubmit: Boolean(pass),
    });
    if (res?.ok && res.sid && res.ticket) {
      return {
        ok: true,
        sid: res.sid,
        ticket: res.ticket,
        cookies: res.cookies || '',
        studentId: res.studentId || (credentials?.username ? String(credentials.username).trim() : null),
        userId: res.userId || undefined,
        source: 'webview',
      };
    }
    return { ok: false, error: res?.error || 'نشست ساخته نشد', code: 'empty' };
  } catch (e) {
    const msg = String(e?.message || e?.error || e || 'خطای WebView');
    if (e?.code === 'cancelled' || /انصراف/.test(msg)) {
      return { ok: false, error: msg, code: 'cancelled' };
    }
    if (/invalid|نادرست|اشتباه|bad credentials/i.test(msg)) {
      return { ok: false, error: 'نام کاربری یا رمز عبور اشتباه است.', code: 'bad-credentials' };
    }
    return {
      ok: false,
      error: msg || 'نشست ساخته نشد',
      code: 'webview-error',
    };
  }
}

/* ── Fallback با CapacitorHttp ── */

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

export function mergeCookies(jar, setCookies) {
  const map = new Map();
  const addOne = (pair) => {
    if (!pair) return;
    const p = String(pair).split(';')[0].trim();
    const i = p.indexOf('=');
    if (i > 0) {
      const name = p.slice(0, i).trim();
      if (name) map.set(name, p);
    }
  };

  String(jar || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach(addOne);

  if (setCookies == null) return [...map.values()].join('; ');

  const list = Array.isArray(setCookies) ? setCookies : [setCookies];
  for (const item of list) {
    if (!item) continue;
    // در اندروید هدرهای Set-Cookie با کاما متصل می‌شوند
    const parts = String(item).split(/(?:,\s*)(?=[A-Za-z0-9_.-]+=)/);
    for (const part of parts) {
      addOne(part);
    }
  }
  return [...map.values()].join('; ');
}

async function httpGet(url, cookie = '') {
  const h = http();
  if (!h) throw new Error('CapacitorHttp در دسترس نیست');
  const sendCookie = cookieForHost(cookie, url);
  const res = await h.get({
    url,
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...(sendCookie ? { Cookie: sendCookie } : {}),
    },
    connectTimeout: 20000,
    readTimeout: 25000,
    responseType: 'text',
    disableRedirects: true,
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
  if (!h) throw new Error('CapacitorHttp در دسترس نیست');
  const sendCookie = cookieForHost(cookie, url);
  const res = await h.post({
    url,
    data: body,
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(referer ? { Referer: referer } : {}),
      Origin: SSO_ORIGIN,
      ...(sendCookie ? { Cookie: sendCookie } : {}),
    },
    connectTimeout: 20000,
    readTimeout: 25000,
    responseType: 'text',
    disableRedirects: true,
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

/** تلاش دوم: فرم Keycloak با پروتکل نیتیو */
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
    let r;
    try {
      r = await httpGet(current, jar);
    } catch (err) {
      return {
        ok: false,
        error: `خطای اتصال به سرور SSO: ${err?.message || err}`,
      };
    }
    jar = r.cookie;
    status = r.status;
    html = r.body;

    if (r.status === 0) {
      return {
        ok: false,
        error: 'اتصال به سامانه SSO برقرار نشد (کد ۰). اینترنت و VPN را بررسی کنید.',
      };
    }

    if (r.status >= 300 && r.status < 400 && r.location) {
      current = new URL(r.location, current).toString();
      continue;
    }
    break;
  }

  const action = findFormAction(html);
  if (!action) {
    const kcFeedback = html.match(/class=["'][^"']*kc-feedback-text[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1]?.trim();
    if (kcFeedback) {
      return { ok: false, error: `پیام سامانه احراز هویت: ${decodeHtml(kcFeedback)}` };
    }
    return {
      ok: false,
      error: `فرم SSO در پاسخ سرور یافت نشد (کد ${status})`,
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
  let code = null;

  for (let i = 0; i < 10; i++) {
    let r;
    try {
      r = await httpPostForm(finalUrl, {
        body: params.toString(),
        cookie: loginCookie,
        referer: current,
      });
    } catch (err) {
      return { ok: false, error: `خطای ارسال فرم SSO: ${err?.message || err}` };
    }
    loginCookie = r.cookie;
    loginBody = r.body;

    if (r.status >= 300 && r.status < 400 && r.location) {
      finalUrl = new URL(r.location, finalUrl).toString();
      try {
        code = new URL(finalUrl).searchParams.get('code');
      } catch {}
      if (code) break;

      let g;
      try {
        g = await httpGet(finalUrl, loginCookie);
      } catch {}
      if (g) {
        loginCookie = g.cookie;
        loginBody = g.body;
        if (g.location) {
          finalUrl = new URL(g.location, finalUrl).toString();
          try {
            code = new URL(finalUrl).searchParams.get('code');
          } catch {}
          if (code) break;
          continue;
        }
      }
      break;
    }
    break;
  }

  if (!code) {
    try {
      code = new URL(finalUrl).searchParams.get('code');
    } catch {}
  }
  if (!code) {
    const m = String(loginBody || '').match(/[?&]code=([A-Za-z0-9._~%-]+)/);
    if (m) code = decodeURIComponent(m[1]);
  }
  if (!code) {
    const err =
      loginBody.match(/kc-feedback-text[^>]*>\s*([^<]+)/i)?.[1]?.trim() ||
      (loginBody.includes('Invalid username or password') ? 'نام کاربری یا کلمه عبور نادرست است.' : '');
    return { ok: false, error: err || 'ورود ناموفق — نام کاربری یا رمز را بررسی کنید.' };
  }

  // GET دقیق URL برگشتی (مثل مرورگر: /browser/fa/?state=..&session_state=..&iss=..&code=..)
  // بازسازی دستی index.html?code= نشست کاری نمی‌سازد (خطای 50216)
  let behestanCookie = '';
  const returnUrl =
    code && finalUrl && finalUrl.includes('code=')
      ? finalUrl
      : `${BEHESTAN}/browser/fa/?state=${state}&code=${encodeURIComponent(code)}`;
  try {
    let u = returnUrl;
    for (let i = 0; i < 3; i++) {
      const r = await httpGet(u, loginCookie);
      // فقط کوکی‌های بهستان را نگه دار — کوکی‌های Keycloak به IIS نفرست
      behestanCookie = mergeCookies(behestanCookie, headerVal(r, 'set-cookie'));
      if (r.status >= 300 && r.status < 400 && r.location) {
        u = new URL(r.location, u).toString();
        continue;
      }
      break;
    }
  } catch {}

  // گرم کردن نشست وب (loginapi act 00)
  try {
    const h = http();
    const warm = await h.post({
      url: `${BEHESTAN}/frm/loginapi/loginapi.svc/`,
      data: { r: {}, rp: {}, act: '00' },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Referer: `${BEHESTAN}/browser/fa/`,
        ...(cookieForHost(behestanCookie, BEHESTAN) ? { Cookie: cookieForHost(behestanCookie, BEHESTAN) } : {}),
      },
      connectTimeout: 15000,
      readTimeout: 20000,
      responseType: 'json',
    });
    if (warm?.headers) {
      behestanCookie = mergeCookies(behestanCookie, headerVal(warm, 'set-cookie'));
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
      ...(cookieForHost(behestanCookie, OAUTH_VERIFY) ? { Cookie: cookieForHost(behestanCookie, OAUTH_VERIFY) } : {}),
    },
    connectTimeout: 25000,
    readTimeout: 30000,
    responseType: 'json',
  });

  if (verify?.headers) {
    behestanCookie = mergeCookies(behestanCookie, headerVal(verify, 'set-cookie'));
  }

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
      return { ok: false, error: 'پاسخ oauth2 بهستان نامعتبر بود' };
    }
  }

  const sid = data?.oaut?.rp?.sid;
  let ticket = data?.t;
  if (!sid || !ticket) {
    const errs = data?.msg?.errors;
    return {
      ok: false,
      error: (Array.isArray(errs) && errs[0]) || 'نشست از بهستان برنگشت',
    };
  }

  // فعال‌سازی نشست کاری + شناسه دانشجو (sys nav 11130) — مثل loginViaCentralSso روی وب
  let studentId = /^\d{6,}$/.test(String(username).trim()) ? String(username).trim() : null;
  let userId;
  try {
    const navRes = await h.post({
      url: `${BEHESTAN}/frm/sys/sys.svc/`,
      data: {
        r: { fid: '11130', ft: '0', subfrm: '' },
        act: 'nav',
        rp: {
          sp: '{"BrnNo":"0","BrnLimit":"0","UsrType":"0","TrmType":"2"}',
          loc: 'fa',
          ut: '0',
          b: '0',
          sid,
        },
        t: ticket,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Referer: `${BEHESTAN}/browser/fa/`,
        Origin: BEHESTAN,
        ...(cookieForHost(behestanCookie, BEHESTAN) ? { Cookie: cookieForHost(behestanCookie, BEHESTAN) } : {}),
      },
      connectTimeout: 15000,
      readTimeout: 20000,
      responseType: 'json',
    });
    if (navRes?.headers) {
      behestanCookie = mergeCookies(behestanCookie, headerVal(navRes, 'set-cookie'));
    }
    let navData = navRes?.data;
    if (typeof navData === 'string') {
      try {
        navData = JSON.parse(navData);
      } catch {
        navData = null;
      }
    }
    if (navData?.t) ticket = navData.t;
    if (navData?.outpar?.std) studentId = String(navData.outpar.std);
    if (navData?.outpar?.u) userId = String(navData.outpar.u);
  } catch {}

  // فقط کوکی‌های بهستان را بفرست (بدون KC_/KEYCLOAK_)
  return {
    ok: true,
    sid,
    ticket,
    cookies: stripKeycloakCookies(behestanCookie),
    studentId,
    userId,
    source: 'http',
  };
}

/** پاک کردن کوکی‌های SSO/بهستان تا تلاش دوم مثل اول تمیز باشد */
export async function clearSsoCookies() {
  let cleared = false;
  try {
    const h = http();
    if (h?.clearCookies) {
      await h.clearCookies({ url: 'https://sso.kntu.ac.ir' });
      await h.clearCookies({ url: 'https://behestan.kntu.ac.ir' });
      cleared = true;
    }
  } catch {}
  // کوکی‌های WebView (CookieManager) هم ماندگارند — بدون پاکسازی، نشست کهنه «HTTP 200 ولی خراب» می‌سازد
  try {
    const cookies = plugins().CapacitorCookies;
    if (cookies?.clear) {
      await cookies.clear();
      cleared = true;
    }
  } catch {}
  try {
    const sso = plugins().SsoWebView;
    if (sso?.clearCookies) {
      await sso.clearCookies();
      cleared = true;
    }
  } catch {}
  return cleared;
}

/** ورود یکپارچه اندروید — فقط با رمز، WebView خودکار باز نمی‌شود */
export async function loginAndroid(username, password) {
  if (username && password) {
    // کوکی‌های نشست قبلی Keycloak نباید فرم/ریدایرکت تلاش دوم را خراب کنند
    await clearSsoCookies();

    // ۱) ورود مستقیم از طریق لایهٔ بومی Java (بدون باز شدن وب‌ویو، دقیقاً مشابه مکانیزم curl در وب)
    if (hasSsoLoginPlugin()) {
      const javaRes = await loginViaJavaSso(username, password);
      if (javaRes.ok) return javaRes;

      // خطای احراز هویت (رمز اشتباه و…) نباید به فال‌بک برود و کوکی کهنه را «موفق» جلوه دهد
      if (
        javaRes.code === 'bad-credentials' ||
        (javaRes.error &&
          (javaRes.error.includes('نادرست') ||
            javaRes.error.includes('اشتباه') ||
            javaRes.error.includes('Invalid') ||
            javaRes.error.includes('نامعتبر') ||
            javaRes.error.includes('نشست از بهستان برنگشت') ||
            javaRes.error.includes('فرم ورود SSO پیدا نشد') ||
            javaRes.error.includes('پیام سامانه')))
      ) {
        return {
          ok: false,
          error:
            javaRes.code === 'bad-credentials' ||
            /invalid username or password|bad credentials/i.test(javaRes.error || '')
              ? 'نام کاربری یا رمز عبور اشتباه است.'
              : javaRes.error,
          code: javaRes.code || undefined,
        };
      }
      console.warn('[SsoLogin] Java login failed, trying fallback:', javaRes.error);
    }

    // ۲) فال‌بک با پروتکل نیتیو جاوااسکریپت (CapacitorHttp)
    const httpRes = await loginViaNativeSso(username, password);
    if (!httpRes?.ok && httpRes?.error) {
      httpRes.error = /invalid username or password|bad credentials/i.test(httpRes.error)
        ? 'نام کاربری یا رمز عبور اشتباه است.'
        : httpRes.error;
    }
    // WebView خودکار باز نکن — کاربر باید خودش «وب‌ویو» را انتخاب کند
    return httpRes;
  }

  // بدون رمز: فقط وقتی کاربر صریحاً روش وب‌ویو را زده (doLogin متد webview)
  return { ok: false, error: 'نام کاربری و رمز عبور را وارد کنید.' };
}
