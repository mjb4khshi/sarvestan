/**
 * سرویس یکپارچه ورود مستقیم بهستان ۲.۰ برای دانشگاه‌های متصل:
 * - دانشگاه شهید بهشتی (SBU): https://ems.sbu.ac.ir
 * - دانشگاه صنعتی خواجه نصیر (KNTU): https://behestan.kntu.ac.ir
 * - دانشگاه تهران (UT): https://ems2.ut.ac.ir
 */

import { getUniversityOrigin } from './session';

function getCapacitorHttp() {
  try {
    const C = globalThis.Capacitor;
    if (C?.isNativePlatform?.() && C?.Plugins?.CapacitorHttp) {
      return C.Plugins.CapacitorHttp;
    }
  } catch {}
  return null;
}

/** استخراج تمیز شناسه ASP.NET_SessionId بدون پارامترهای اضافه */
function extractSessionCookie(setCookie) {
  const raw = String(setCookie || '');
  const m = raw.match(/ASP\.NET_SessionId=[^;, ]+/i);
  return m ? m[0] : '';
}

/**
 * دریافت تصویر کپچای تازه برای دانشگاه مشخص‌شده
 * @param {string} uniId شناسه دانشگاه ('kntu' | 'sbu' | 'ut')
 * @returns {Promise<{ ok: boolean, captcha?: string, cookie?: string, error?: string }>}
 */
export async function fetchDirectCaptcha(uniId = 'kntu') {
  const origin = getUniversityOrigin(uniId);
  const http = getCapacitorHttp();

  // دانشگاه علم و صنعت (IUST): نسخه ۱.۰ وب‌فرم کلاسیک گلستان
  if (uniId === 'iust') {
    if (http?.get) {
      try {
        const authPage = await http.get({
          url: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          connectTimeout: 15000,
          readTimeout: 20000,
        });

        const setCookie = authPage.headers?.['set-cookie'] || authPage.headers?.['Set-Cookie'] || '';
        const cookie = extractSessionCookie(setCookie) || (String(setCookie).split(';')[0].trim());

        const captRes = await http.get({
          url: `${origin}/Forms/AuthenticateUser/captcha.aspx?${Math.random()}`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Cookie: cookie,
            Referer: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1`,
          },
          responseType: 'base64',
          connectTimeout: 15000,
          readTimeout: 20000,
        });

        return {
          ok: true,
          captcha: captRes.data,
          cookie,
        };
      } catch (err) {
        console.error(`[fetchDirectCaptcha iust native error]`, err);
        return { ok: false, error: err?.message || 'خطا در برقراری ارتباط با سامانه گلستان علم و صنعت' };
      }
    }
  }

  const loginApiUrl = `${origin}/frm/loginapi/loginapi.svc/`;
  const refererUrl = `${origin}/browser/fa/`;

  if (http?.post) {
    try {
      const res = await http.post({
        url: loginApiUrl,
        data: { r: {}, rp: {}, act: '00' },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          Origin: origin,
          Referer: refererUrl,
        },
        connectTimeout: 15000,
        readTimeout: 20000,
      });

      const setCookie = res.headers?.['set-cookie'] || res.headers?.['Set-Cookie'] || '';
      const cookie = extractSessionCookie(setCookie) || (String(setCookie).split(';')[0].trim());
      const capt = res.data?.capt || (typeof res.data === 'string' ? JSON.parse(res.data)?.capt : null);

      return {
        ok: true,
        captcha: capt,
        cookie,
      };
    } catch (err) {
      console.error(`[fetchDirectCaptcha ${uniId} native error]`, err);
      return { ok: false, error: err?.message || 'خطا در برقراری ارتباط با سامانه دانشگاه' };
    }
  }

  // روی وب / محیط توسعه لوکال با پروکسی Vite
  try {
    const r = await fetch(`/__sarvestan/direct-captcha?uni=${encodeURIComponent(uniId)}`);
    const j = await r.json();
    return j;
  } catch (err) {
    console.error(`[fetchDirectCaptcha ${uniId} web error]`, err);
    return { ok: false, error: err?.message || 'خطا در دریافت کد امنیتی از سرور لوکال' };
  }
}

/**
 * ورود با نام کاربری، رمز و کپچا در سامانه بهستان دانشگاه
 * @param {string} username شماره دانشجویی
 * @param {string} password گذرواژه
 * @param {string} captcha کد امنیتی
 * @param {string} cookie کوکی نشست ASP.NET_SessionId
 * @param {string} uniId شناسه دانشگاه ('kntu' | 'sbu' | 'ut')
 * @returns {Promise<{ ok: boolean, sid?: string, ticket?: string, studentId?: string, cookies?: string, error?: string, newCaptcha?: string }>}
 */
export async function loginViaBehestanDirect(username, password, captcha, cookie, uniId = 'kntu') {
  const cleanU = String(username || '').trim();
  const cleanP = String(password || '');
  const cleanC = String(captcha || '').trim();

  if (!cleanU || !cleanP || !cleanC) {
    return { ok: false, error: 'شماره دانشجویی، گذرواژه و کد امنیتی الزامی است.' };
  }

  const origin = getUniversityOrigin(uniId);
  const http = getCapacitorHttp();

  // دانشگاه علم و صنعت (IUST): لاگین وب‌فرم کلاسیک گلستان ۱.۰
  if (uniId === 'iust') {
    if (http?.get && http?.post) {
      try {
        const sendCookie = extractSessionCookie(cookie) || cookie;
        // ۱. دریافت صفحه برای ViewState
        const page1 = await http.get({
          url: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...(sendCookie ? { Cookie: sendCookie } : {}),
          },
          connectTimeout: 15000,
          readTimeout: 20000,
        });

        const body1 = String(page1.data || '');
        const mVs = body1.match(/id="__VIEWSTATE"\s+value="([^"]+)"/);
        const mEv = body1.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/);
        const mVsg = body1.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/);

        const vs = mVs ? mVs[1] : '';
        const ev = mEv ? mEv[1] : '';
        const vsg = mVsg ? mVsg[1] : '6A475423';

        // ۲. ارسال فرم لاگین act 09
        const postData = new URLSearchParams({
          '__VIEWSTATE': vs,
          '__VIEWSTATEGENERATOR': vsg,
          '__EVENTVALIDATION': ev,
          'TxtMiddle': `<r F51851="" F80351="${cleanU}" F80401="${cleanP}" F51701="${cleanC}" />`,
          'Fm_Action': '09',
          'Frm_Type': '',
          'Frm_No': '',
          'TicketTextBox': ''
        }).toString();

        const loginRes = await http.post({
          url: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1`,
          data: postData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1`,
            ...(sendCookie ? { Cookie: sendCookie } : {}),
          },
          connectTimeout: 20000,
          readTimeout: 25000,
        });

        const loginBody = String(loginRes.data || '');

        // بررسی پیام خطا در پاسخ گلستان
        if (loginBody.includes('ErrorArr = new Array(') || loginBody.includes('SetError(')) {
          const errM = loginBody.match(/ErrorArr\s*=\s*new\s*Array\(['"]([^'"]+)['"]\)/i) ||
                       loginBody.match(/alert\(['"]([^'"]+)['"]\)/i);
          const errMsg = errM ? errM[1] : 'کد امنیتی، شماره دانشجویی یا گذرواژه اشتباه است';

          // تولید کپچای جدید
          let newCapt = null;
          try {
            const fresh = await fetchDirectCaptcha('iust');
            newCapt = fresh.captcha;
          } catch {}

          return {
            ok: false,
            error: errMsg,
            newCaptcha: newCapt,
          };
        }

        // استخراج tck (توکن نشست ناوبری گلستان)
        const tckM = loginBody.match(/tck=([A-Za-z0-9-]+)/i) || loginBody.match(/'([A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{2,4})'/i);
        const tck = tckM ? tckM[1] : 'iust-session';

        const sid = extractSessionCookie(sendCookie) || 'iust-sid';
        return {
          ok: true,
          sid: sid,
          ticket: tck,
          studentId: cleanU,
          cookies: sendCookie,
        };
      } catch (err) {
        console.error(`[loginViaBehestanDirect iust native error]`, err);
        return { ok: false, error: err?.message || 'خطا در احراز هویت با سامانه گلستان علم و صنعت' };
      }
    }
  }

  const loginApiUrl = `${origin}/frm/loginapi/loginapi.svc/`;
  const refererUrl = `${origin}/browser/fa/`;

  if (http?.post) {
    try {
      const sendCookie = extractSessionCookie(cookie) || cookie;
      const res = await http.post({
        url: loginApiUrl,
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
          Origin: origin,
          Referer: refererUrl,
          ...(sendCookie ? { Cookie: sendCookie } : {}),
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
          error: 'پاسخ نامعتبر از سرور دانشگاه',
          newCaptcha: data?.capt || null,
        };
      }

      // جمع‌آوری کوکی‌های احراز هویت p و u در صورت ارسال
      const resSetCookie = res.headers?.['set-cookie'] || res.headers?.['Set-Cookie'] || '';
      let cookies = sendCookie || `ASP.NET_SessionId=${sid}`;
      if (resSetCookie) {
        const pMatch = String(resSetCookie).match(/p=[^;]+/i);
        const uMatch = String(resSetCookie).match(/u=[^;]+/i);
        if (pMatch) cookies += `; ${pMatch[0]}`;
        if (uMatch) cookies += `; ${uMatch[0]}`;
      }

      return {
        ok: true,
        sid,
        ticket,
        studentId: cleanU,
        cookies,
      };
    } catch (err) {
      console.error(`[loginViaBehestanDirect ${uniId} native error]`, err);
      return { ok: false, error: err?.message || 'خطای شبکه در ارتباط با سرور دانشگاه' };
    }
  }

  // روی وب / محیط توسعه لوکال با پروکسی Vite
  try {
    const r = await fetch('/__sarvestan/direct-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanU,
        password: cleanP,
        captcha: cleanC,
        cookie,
        uniId,
      }),
    });
    const j = await r.json();
    return j;
  } catch (err) {
    console.error(`[loginViaBehestanDirect ${uniId} web error]`, err);
    return { ok: false, error: err?.message || 'خطای سرور لوکال در لاگین مستقیم' };
  }
}

// برای سازگاری نام‌های قبلی
export const fetchSbuCaptcha = () => fetchDirectCaptcha('sbu');
export const loginViaSbuDirect = (u, p, c, cookie) => loginViaBehestanDirect(u, p, c, cookie, 'sbu');
