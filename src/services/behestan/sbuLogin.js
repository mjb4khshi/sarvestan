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

/** ادغام Set-Cookie پاسخ در هدر Cookie (مرورگرگونه: جایگزینی هم‌نام) */
function mergeCookieHeader(base, rawSetCookie) {
  const jar = new Map();
  const pairs = String(rawSetCookie || '')
    .split(/,(?=\s*[A-Za-z0-9_.-]+=)/)
    .map((s) => String(s).split(';')[0].trim())
    .filter((s) => s.includes('='));
  for (const p of [...String(base || '').split(';'), ...pairs]) {
    const s = p.trim();
    const i = s.indexOf('=');
    if (i > 0) jar.set(s.slice(0, i), s.slice(i + 1));
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
}

/**
 * تفسیر پاسخ AuthUser در گلستان ۱.۰
 * `ErrorArr = new Array();` در هر صفحه‌ای به‌صورت boilerplate هست؛ فقط
 * آرگومان رشته‌ایِ ناتهی نشانهٔ خطاست. موفقیت = فراخوانی `SavAut(<عدد>, …)`.
 */
function parseIustAuthHtml(html) {
  const text = String(html || '');
  const savM = text.match(
    /SavAut\s*\(\s*(\d+)\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*([^,]+),\s*'([^']*)'\s*,\s*'([^']*)'/i,
  );
  if (savM) {
    return {
      ok: true,
      uid: savM[1],
      su: savM[2],
      ft: savM[3],
      fid: String(savM[4]).trim(),
      lt: savM[5],
      tck: savM[6],
    };
  }
  const errM = text.match(/ErrorArr\s*=\s*new\s*Array\(\s*(['"])((?:\\.|(?!\1)[^\\])+)\1\s*\)/);
  if (errM) return { ok: false, error: errM[2].replace(/\+/g, ' ') };
  const alertM = text.match(/alert\(\s*(['"])((?:\\.|(?!\1)[^\\])+)\1\s*\)/i);
  if (alertM) return { ok: false, error: alertM[2].replace(/\+/g, ' ') };
  return { ok: false, error: 'کد امنیتی، شماره دانشجویی یا گذرواژه اشتباه است' };
}

let lastIustState = { vs: '', ev: '', vsg: '6A475423', cookie: '' };

/**
 * دریافت تصویر کپچای تازه برای دانشگاه مشخص‌شده
 * @param {string} uniId شناسه دانشگاه ('kntu' | 'sbu' | 'ut' | 'iust')
 * @returns {Promise<{ ok: boolean, captcha?: string, cookie?: string, vs?: string, ev?: string, vsg?: string, error?: string }>}
 */
export async function fetchDirectCaptcha(uniId = 'kntu') {
  const origin = getUniversityOrigin(uniId);
  const http = getCapacitorHttp();

  // دانشگاه علم و صنعت (IUST): نسخه ۱.۰ وب‌فرم کلاسیک گلستان
  if (uniId === 'iust') {
    if (http?.get && http?.post) {
      try {
        // ۱. دریافت نشست از لود بالانسر
        const r0 = await http.get({
          url: `${origin}/home/balancer/balancer.aspx?vv=2&cost=main`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          connectTimeout: 15000,
          readTimeout: 20000,
        });
        const rawSetCookie = r0.headers?.['set-cookie'] || r0.headers?.['Set-Cookie'] || '';
        const mSession = String(rawSetCookie).match(/ASP\.NET_SessionId=[^;, ]+/i);
        const sessionCookie = mSession ? mSession[0] : '';
        const cookieHeader = `${sessionCookie}; u=; lt=; su=; ft=; f=; seq=`;

        // ۲. فراخوانی اولیه صفحه AuthUser
        const page1 = await http.get({
          url: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1&tck=&&&lastm=20240303092318`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Cookie: cookieHeader,
            Referer: `${origin}/_Templates/Commander.htm`,
          },
          connectTimeout: 15000,
          readTimeout: 20000,
        });
        const html1 = String(page1.data || '');
        const vs1 = (html1.match(/id="__VIEWSTATE"\s+value="([^"]+)"/) || [])[1] || '';
        const ev1 = (html1.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/) || [])[1] || '';
        const vsg1 = (html1.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/) || [])[1] || '6A475423';

        // ۳. هندشیک اکشن 00
        const post00 = new URLSearchParams({
          '__VIEWSTATE': vs1,
          '__VIEWSTATEGENERATOR': vsg1,
          '__EVENTVALIDATION': ev1,
          'TxtMiddle': '<r/>',
          'Fm_Action': '00',
          'Frm_Type': '',
          'Frm_No': '',
          'TicketTextBox': '',
        }).toString();

        const page2 = await http.post({
          url: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1&tck=&&&lastm=20240303092318`,
          data: post00,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Cookie: cookieHeader,
            Referer: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1&tck=&&&lastm=20240303092318`,
          },
          connectTimeout: 15000,
          readTimeout: 20000,
        });
        const html2 = String(page2.data || '');
        const vs2 = (html2.match(/id="__VIEWSTATE"\s+value="([^"]+)"/) || [])[1] || vs1;
        const ev2 = (html2.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/) || [])[1] || ev1;
        const vsg2 = (html2.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/) || [])[1] || vsg1;

        // ۴. دریافت تصویر کپچا
        const captRes = await http.get({
          url: `${origin}/Forms/AuthenticateUser/captcha.aspx?${Math.random()}`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Cookie: cookieHeader,
            Referer: `${origin}/Forms/AuthenticateUser/LoginPage.htm`,
          },
          responseType: 'base64',
          connectTimeout: 15000,
          readTimeout: 20000,
        });

        lastIustState = { vs: vs2, ev: ev2, vsg: vsg2, cookie: cookieHeader };

        return {
          ok: true,
          captcha: captRes.data,
          cookie: cookieHeader,
          vs: vs2,
          ev: ev2,
          vsg: vsg2,
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
    if (j?.vs) {
      lastIustState = { vs: j.vs, ev: j.ev, vsg: j.vsg || '6A475423', cookie: j.cookie || '' };
    }
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
export async function loginViaBehestanDirect(username, password, captcha, cookie, uniId = 'kntu', extra = {}) {
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
    if (http?.post) {
      try {
        const curVs = extra?.vs || lastIustState.vs;
        const curEv = extra?.ev || lastIustState.ev;
        const curVsg = extra?.vsg || lastIustState.vsg || '6A475423';
        const sendCookie = cookie || lastIustState.cookie;

        // ارسال فرم لاگین act 09 با ViewState معتبر نشست
        const postData = new URLSearchParams({
          '__VIEWSTATE': curVs,
          '__VIEWSTATEGENERATOR': curVsg,
          '__EVENTVALIDATION': curEv,
          'TxtMiddle': `<r F51851="" F80351="${cleanU}" F80401="${cleanP}" F51701="${cleanC}" F83181=""/>`,
          'Fm_Action': '09',
          'Frm_Type': '',
          'Frm_No': '',
          'TicketTextBox': '',
        }).toString();

        const loginRes = await http.post({
          url: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1&tck=&&&lastm=20240303092318`,
          data: postData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: `${origin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1&tck=&&&lastm=20240303092318`,
            Cookie: sendCookie,
          },
          connectTimeout: 20000,
          readTimeout: 25000,
        });

        const loginBody = String(loginRes.data || '');
        const auth = parseIustAuthHtml(loginBody);

        if (!auth.ok) {
          // تولید کپچای جدید
          let fresh = null;
          try {
            fresh = await fetchDirectCaptcha('iust');
          } catch {}

          return {
            ok: false,
            error: auth.error,
            newCaptcha: fresh?.captcha || null,
            cookie: fresh?.cookie || null,
            vs: fresh?.vs || null,
            ev: fresh?.ev || null,
            vsg: fresh?.vsg || null,
          };
        }

        // پاسخ لاگین نشست را می‌چرخاند — کوکی‌های تازه باید جایگزین شوند
        const rawSetCookie = loginRes.headers?.['set-cookie'] || loginRes.headers?.['Set-Cookie'] || '';
        let jar = mergeCookieHeader(sendCookie, rawSetCookie);
        if (auth.lt && !/(^|;\s*)lt=/i.test(jar)) jar += `; lt=${auth.lt}`;
        if (auth.uid && !/(^|;\s*)u=/i.test(jar)) jar += `; u=${auth.uid}`;
        jar = mergeCookieHeader(jar, `su=${auth.su || '0'}; ft=${auth.ft || '0'}; f=${auth.fid || '1'}; seq=1`);
        if (auth.tck) {
          jar = mergeCookieHeader(jar, `ctck=${auth.tck}; tck=${auth.tck}`);
        }

        const mSid = jar.match(/ASP\.NET_SessionId=([^;, ]+)/i);
        const sid = mSid ? mSid[1] : '';

        lastIustState = { vs: '', ev: '', vsg: '6A475423', cookie: jar };

        return {
          ok: true,
          sid: sid || auth.tck,
          ticket: auth.tck,
          studentId: cleanU,
          userId: auth.uid,
          cookies: jar,
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
    const curVs = extra?.vs || lastIustState.vs;
    const curEv = extra?.ev || lastIustState.ev;
    const curVsg = extra?.vsg || lastIustState.vsg;
    const r = await fetch('/__sarvestan/direct-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanU,
        password: cleanP,
        captcha: cleanC,
        cookie,
        uniId,
        vs: curVs,
        ev: curEv,
        vsg: curVsg,
      }),
    });
    const j = await r.json();
    if (j?.vs) {
      lastIustState = { vs: j.vs, ev: j.ev, vsg: j.vsg || '6A475423', cookie: j.cookie || cookie };
    }
    return j;
  } catch (err) {
    console.error(`[loginViaBehestanDirect ${uniId} web error]`, err);
    return { ok: false, error: err?.message || 'خطای سرور لوکال در لاگین مستقیم' };
  }
}

// برای سازگاری نام‌های قبلی
export const fetchSbuCaptcha = () => fetchDirectCaptcha('sbu');
export const loginViaSbuDirect = (u, p, c, cookie) => loginViaBehestanDirect(u, p, c, cookie, 'sbu');
