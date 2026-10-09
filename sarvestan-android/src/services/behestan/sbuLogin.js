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

/**
 * دریافت تصویر کپچای تازه برای شهید بهشتی
 * @returns {Promise<{ ok: boolean, captcha?: string, cookie?: string, error?: string }>}
 */
export async function fetchSbuCaptcha() {
  const http = getCapacitorHttp();
  if (http?.post) {
    try {
      const res = await http.post({
        url: SBU_LOGINAPI_URL,
        data: { r: {}, rp: {}, act: '00' },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          Origin: 'https://ems.sbu.ac.ir',
          Referer: 'https://ems.sbu.ac.ir/browser/fa/',
        },
        connectTimeout: 15000,
        readTimeout: 20000,
      });

      const setCookie = res.headers?.['set-cookie'] || res.headers?.['Set-Cookie'] || '';
      const m = String(setCookie).match(/ASP\.NET_SessionId=[^;]+/i);
      const cookie = m ? m[0] : (setCookie || '');
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
      const errors = data?.msg?.errors || [];
      if (errors.length > 0) {
        return {
          ok: false,
          error: errors.join(' - '),
          newCaptcha: data?.capt || null,
        };
      }

      const sid = data?.oaut?.rp?.sid;
      const ticket = data?.t;
      if (!sid || !ticket) {
        return {
          ok: false,
          error: 'پاسخ نامعتبر از سرور دانشگاه شهید بهشتی',
          newCaptcha: data?.capt || null,
        };
      }

      return {
        ok: true,
        sid,
        ticket,
        studentId: cleanU,
        cookies: cookie || `ASP.NET_SessionId=${sid}`,
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
