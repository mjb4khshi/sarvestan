/**
 * سرویس ورود مستقیم دانشگاه شهید بهشتی (SBU)
 * از طریق loginapi.svc بهستان ۲.۰ با کد امنیتی (کپچا)
 */

function getCapacitorHttp() {
  try {
    const C = globalThis.Capacitor;
    if (C?.isNativePlatform?.() && C?.Plugins?.CapacitorHttp) {
      return C.Plugins.CapacitorHttp;
    }
  } catch {}
  return null;
}

const SBU_LOGINAPI_URL = 'https://ems.sbu.ac.ir/frm/loginapi/loginapi.svc/';

/** تبدیل Set-Cookie (رشته‌ی ادغام‌شده یا آرایه) به جفت‌های name=value */
function setCookiePairs(setCookie) {
  const list = Array.isArray(setCookie)
    ? setCookie
    : String(setCookie || '').split(/,(?=\s*[^;,=\s]+=)/);
  return list
    .map((s) => String(s).split(';')[0].trim())
    .filter((s) => s.includes('='));
}

/** ادغام کوکی‌ها مثل مرورگر: مقدار جدید هم‌نام، قبلی را جایگزین می‌کند */
function mergeCookies(base, pairs) {
  const jar = new Map();
  for (const p of [...String(base || '').split(';'), ...pairs]) {
    const s = p.trim();
    const i = s.indexOf('=');
    if (i > 0) jar.set(s.slice(0, i), s.slice(i + 1));
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
}

function responseSetCookie(headers) {
  return headers?.['set-cookie'] || headers?.['Set-Cookie'] || '';
}

/**
 * دریافت تصویر کپچای تازه برای شهید بهشتی
 * @returns {Promise<{ ok: boolean, captcha?: string, cookie?: string, error?: string }>}
 */
export async function fetchSbuCaptcha() {
  const http = getCapacitorHttp();
  if (http?.post) {
    try {
      let cookie = '';
      // گام پیش‌گرمایش: دریافت سشن اولیه ASP.NET از صفحه اصلی سامانه بهشتی
      try {
        const warm = await http.get({
          url: 'https://ems.sbu.ac.ir/browser/fa/',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          connectTimeout: 8000,
          readTimeout: 10000,
        });
        const warmCookies = responseSetCookie(warm.headers);
        if (warmCookies) {
          cookie = mergeCookies('', setCookiePairs(warmCookies));
        }
      } catch (warmErr) {
        console.warn('[fetchSbuCaptcha warm-up warning]', warmErr?.message || warmErr);
      }

      const res = await http.post({
        url: SBU_LOGINAPI_URL,
        data: { r: {}, rp: {}, act: '00' },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          Origin: 'https://ems.sbu.ac.ir',
          Referer: 'https://ems.sbu.ac.ir/browser/fa/',
          ...(cookie ? { Cookie: cookie } : {}),
        },
        connectTimeout: 15000,
        readTimeout: 20000,
      });

      const setCookie = responseSetCookie(res.headers);
      cookie = mergeCookies(cookie, setCookiePairs(setCookie));
      const capt = res.data?.capt || (typeof res.data === 'string' ? JSON.parse(res.data)?.capt : null);

      return {
        ok: true,
        captcha: capt,
        cookie,
      };
    } catch (err) {
      console.error('[fetchSbuCaptcha native error]', err);
      return { ok: false, error: err?.message || 'خطا در برقراری ارتباط با سامانه شهید بهشتی' };
    }
  }

  // روی وب / محیط توسعه لوکال
  try {
    const r = await fetch('/__sarvestan/sbu-captcha');
    const j = await r.json();
    return j;
  } catch (err) {
    console.error('[fetchSbuCaptcha web error]', err);
    return { ok: false, error: err?.message || 'خطا در دریافت کد امنیتی از سرور لوکال' };
  }
}

/**
 * ورود با نام کاربری، رمز و کپچا در سامانه بهستان دانشگاه شهید بهشتی
 * @returns {Promise<{ ok: boolean, sid?: string, ticket?: string, studentId?: string, cookies?: string, error?: string, newCaptcha?: string }>}
 */
export async function loginViaSbuDirect(username, password, captcha, cookie) {
  const cleanU = String(username || '').trim();
  const cleanP = String(password || '');
  const cleanC = String(captcha || '').trim();

  if (!cleanU || !cleanP || !cleanC) {
    return { ok: false, error: 'شماره دانشجویی، گذرواژه و کد امنیتی الزامی است.' };
  }

  const http = getCapacitorHttp();
  if (http?.post) {
    try {
      const res = await http.post({
        url: SBU_LOGINAPI_URL,
        data: {
          act: '09',
          r: {
            l: cleanU,
            p: cleanP,
            c: cleanC,
            code: '',
            ticket: '',
            d: '0',
          },
          rp: {},
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          Origin: 'https://ems.sbu.ac.ir',
          Referer: 'https://ems.sbu.ac.ir/browser/fa/',
          ...(cookie ? { Cookie: cookie } : {}),
        },
        connectTimeout: 20000,
        readTimeout: 25000,
      });

      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      const resCookie = mergeCookies(cookie, setCookiePairs(responseSetCookie(res.headers)));
      const errors = data?.msg?.errors || [];
      if (errors.length > 0) {
        return {
          ok: false,
          error: errors.join(' - '),
          newCaptcha: data?.capt || null,
          newCookie: resCookie || cookie,
        };
      }

      const sid = data?.oaut?.rp?.sid;
      let ticket = data?.t;
      if (!sid || !ticket) {
        return {
          ok: false,
          error: 'پاسخ نامعتبر از سرور دانشگاه شهید بهشتی',
          newCaptcha: data?.capt || null,
          newCookie: resCookie || cookie,
        };
      }

      let jar = mergeCookies(cookie, setCookiePairs(responseSetCookie(res.headers)));
      if (!/ASP\.NET_SessionId=/i.test(jar)) jar = mergeCookies(jar, [`ASP.NET_SessionId=${sid}`]);

      let detectedStd = cleanU;
      let detectedUid = null;
      try {
        const navRes = await http.post({
          url: 'https://ems.sbu.ac.ir/frm/sys/sys.svc/',
          data: {
            r: { fid: '11130', ft: '0', subfrm: '' },
            act: 'nav',
            rp: {
              sp: '{"BrnNo":"0","BrnLimit":"0","UsrType":"0"}',
              loc: 'fa',
              ut: '0',
              b: '0',
              sid,
            },
            t: ticket,
          },
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
            Origin: 'https://ems.sbu.ac.ir',
            Referer: 'https://ems.sbu.ac.ir/browser/fa/',
            Cookie: jar,
          },
          connectTimeout: 10000,
          readTimeout: 15000,
        });
        jar = mergeCookies(jar, setCookiePairs(responseSetCookie(navRes.headers)));
        const navData = typeof navRes.data === 'string' ? JSON.parse(navRes.data) : navRes.data;
        if (navData?.t) ticket = navData.t;
        if (navData?.outpar?.std) detectedStd = String(navData.outpar.std);
        if (navData?.outpar?.u) detectedUid = String(navData.outpar.u);
      } catch (e) {
        console.warn('[sbuLogin native] nav 11130 warning:', e?.message || e);
      }

      return {
        ok: true,
        sid,
        ticket,
        studentId: detectedStd,
        userId: detectedUid,
        cookies: jar,
      };
    } catch (err) {
      console.error('[loginViaSbuDirect native error]', err);
      return { ok: false, error: err?.message || 'خطای شبکه در ارتباط با دانشگاه شهید بهشتی' };
    }
  }

  // روی وب / محیط توسعه لوکال
  try {
    const r = await fetch('/__sarvestan/sbu-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanU,
        password: cleanP,
        captcha: cleanC,
        cookie,
      }),
    });
    const j = await r.json();
    return j;
  } catch (err) {
    console.error('[loginViaSbuDirect web error]', err);
    return { ok: false, error: err?.message || 'خطای سرور لوکال در لاگین شهید بهشتی' };
  }
}
