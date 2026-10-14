import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

/** جفت‌های name=value از Set-Cookie پاسخ fetch */
function setCookiePairs(headers) {
  const list = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : []
  return list.map((s) => s.split(';')[0].trim()).filter((s) => s.includes('='))
}

/** ادغام کوکی‌ها مثل مرورگر: مقدار جدید هم‌نام، قبلی را جایگزین می‌کند */
function mergeCookies(base, pairs) {
  const jar = new Map()
  for (const p of [...String(base || '').split(';'), ...pairs]) {
    const s = p.trim()
    const i = s.indexOf('=')
    if (i > 0) jar.set(s.slice(0, i), s.slice(i + 1))
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
}

/**
 * ماژول SSO فقط برای dev server لازم است و در CI gitignore شده.
 * اگر فایل نبود، بیلد/کانفیگ نباید بشکند.
 */
async function loadLoginViaCentralSso() {
  try {
    const file = path.join(process.cwd(), 'scripts', 'sso-login-server.mjs')
    if (!fs.existsSync(file)) return null
    const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`)
    return typeof mod.loginViaCentralSso === 'function' ? mod.loginViaCentralSso : null
  } catch (err) {
    console.error('[loadLoginViaCentralSso error]', err?.message || err)
    return null
  }
}

/** نشست ذخیره‌شدهٔ سرور — اپ با GET می‌خواند و سنک زنده می‌دود */
function sessionPlugin() {
  const FILE = path.join(process.cwd(), '.behestan-session.json')
  return {
    name: 'sarvestan-session',
    configureServer(server) {
      server.middlewares.use('/__sarvestan/session', (req, res) => {
        if (req.method === 'DELETE' || (req.method === 'POST' && req.url.includes('clear'))) {
          try {
            if (fs.existsSync(FILE)) fs.unlinkSync(FILE)
          } catch {}
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({ ok: true }))
          return
        }
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('GET only')
          return
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cache-Control', 'no-store')
        try {
          res.end(fs.readFileSync(FILE, 'utf8'))
        } catch {
          res.end('{}')
        }
      })
    },
  }
}

/** پلاگین ورود SSO سمت سرور */
function ssoLoginPlugin() {
  return {
    name: 'sarvestan-sso-login',
    configureServer(server) {
      server.middlewares.use('/__sarvestan/sso-login', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('POST only')
          return
        }
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', async () => {
          try {
            const loginViaCentralSso = await loadLoginViaCentralSso()
            if (!loginViaCentralSso) {
              res.statusCode = 503
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  ok: false,
                  error: 'SSO login module not available in this environment',
                }),
              )
              return
            }
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
            const uniId = body.uniId || 'kntu'
            console.log(`[sso-login-server] request for uni="${uniId}", user="${body.username}", selectedUserNo="${body.selectedUserNo || ''}"`)
            const result = await loginViaCentralSso(body.username, body.password, {
              uniId,
              selectedUserNo: body.selectedUserNo,
              selectedUserType: body.selectedUserType,
            })
            console.log(`[sso-login-server] result: ok=${result?.ok}, code=${result?.code || 'none'}, error=${result?.error || 'none'}, accounts=${result?.accounts?.length || 0}`)
            if (result.ok) {
              fs.writeFileSync(
                path.join(process.cwd(), '.behestan-session.json'),
                JSON.stringify(
                  {
                    sid: result.sid,
                    ticket: result.ticket,
                    studentId: result.studentId || null,
                    cookies: result.cookies || '',
                    university: uniId,
                    updatedAt: new Date().toISOString(),
                    source: `${uniId}-sso-form`,
                  },
                  null,
                  2,
                ),
              )
            }
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify(result))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }))
          }
        })
      })
    },
  }
}

/** دریافت کپچا و مقداردهی نشست سیستم گلستان علم و صنعت */
async function fetchIustCaptchaHelper(targetOrigin = 'https://golestan.iust.ac.ir') {
  // ۱. دریافت نشست اولیه از لود بالانسر
  const r0 = await fetch(`${targetOrigin}/home/balancer/balancer.aspx?vv=2&cost=main`, {
    redirect: 'manual',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const rawSetCookie = r0.headers.get('set-cookie') || '';
  const mSession = rawSetCookie.match(/ASP\.NET_SessionId=[^;, ]+/i);
  const sessionCookie = mSession ? mSession[0] : '';
  const cookieHeader = `${sessionCookie}; u=; lt=; su=; ft=; f=; seq=`;

  // ۲. فراخوانی اولیه صفحه AuthUser
  const r1 = await fetch(`${targetOrigin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1&tck=&&&lastm=20240303092318`, {
    headers: {
      'Cookie': cookieHeader,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `${targetOrigin}/_Templates/Commander.htm`,
    },
  });
  const html1 = await r1.text();
  const vs1 = (html1.match(/id="__VIEWSTATE"\s+value="([^"]+)"/) || [])[1] || '';
  const ev1 = (html1.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/) || [])[1] || '';
  const vsg1 = (html1.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/) || [])[1] || '6A475423';

  // ۳. هندشیک اکشن 00 برای تولید استیت نشست
  const r2 = await fetch(`${targetOrigin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0%3b1&tck=&&&lastm=20240303092318`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `${targetOrigin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1&tck=&&&lastm=20240303092318`,
    },
    body: new URLSearchParams({
      '__VIEWSTATE': vs1,
      '__VIEWSTATEGENERATOR': vsg1,
      '__EVENTVALIDATION': ev1,
      'TxtMiddle': '<r/>',
      'Fm_Action': '00',
      'Frm_Type': '',
      'Frm_No': '',
      'TicketTextBox': '',
    }).toString(),
  });
  const html2 = await r2.text();
  const vs2 = (html2.match(/id="__VIEWSTATE"\s+value="([^"]+)"/) || [])[1] || vs1;
  const ev2 = (html2.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/) || [])[1] || ev1;
  const vsg2 = (html2.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/) || [])[1] || vsg1;

  // ۴. دریافت تصویر کپچای معتبر نشست
  const r3 = await fetch(`${targetOrigin}/Forms/AuthenticateUser/captcha.aspx?${Math.random()}`, {
    headers: {
      'Cookie': cookieHeader,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `${targetOrigin}/Forms/AuthenticateUser/LoginPage.htm`,
    },
  });
  const buf = Buffer.from(await r3.arrayBuffer());
  return {
    ok: true,
    captcha: buf.toString('base64'),
    cookie: cookieHeader,
    vs: vs2,
    ev: ev2,
    vsg: vsg2,
  };
}

/** پلاگین لاگین و کپچای مستقیم دانشگاه شهید بهشتی و علم و صنعت */
function sbuLoginPlugin() {
  return {
    name: 'sarvestan-sbu-login',
    configureServer(server) {
      server.middlewares.use('/__sarvestan/direct-captcha', async (req, res) => {
        if (req.method !== 'GET' && req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('GET/POST only');
        }
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const uniId = urlObj.searchParams.get('uni') || 'kntu';
          let targetOrigin = 'https://behestan.kntu.ac.ir';
          if (uniId === 'sbu') targetOrigin = 'https://ems.sbu.ac.ir';
          else if (uniId === 'ut') targetOrigin = 'https://ems2.ut.ac.ir';
          else if (uniId === 'iust') targetOrigin = 'https://golestan.iust.ac.ir';

          if (uniId === 'iust') {
            const captData = await fetchIustCaptchaHelper(targetOrigin);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(captData));
            return;
          }

          const upstream = await fetch(`${targetOrigin}/frm/loginapi/loginapi.svc/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Origin: targetOrigin,
              Referer: `${targetOrigin}/browser/fa/`,
            },
            body: JSON.stringify({ r: {}, rp: {}, act: '00' }),
          });
          const cookie = mergeCookies('', setCookiePairs(upstream.headers));
          const data = await upstream.json();
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ ok: true, captcha: data.capt, cookie }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ ok: false, error: String(err?.message || err) }));
        }
      });

      // سازگاری برای درخواست‌های قبلی sbu-captcha
      server.middlewares.use('/__sarvestan/sbu-captcha', (req, res) => {
        req.url = '/__sarvestan/direct-captcha?uni=sbu';
        server.middlewares.handle(req, res);
      });

      server.middlewares.use('/__sarvestan/direct-login', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('POST only');
        }
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
            const { username, password, captcha, cookie, uniId = 'kntu' } = body;
            let targetOrigin = 'https://behestan.kntu.ac.ir';
            if (uniId === 'sbu') targetOrigin = 'https://ems.sbu.ac.ir';
            else if (uniId === 'ut') targetOrigin = 'https://ems2.ut.ac.ir';
            else if (uniId === 'iust') targetOrigin = 'https://golestan.iust.ac.ir';

            console.log(`[direct-login-server] request for uni=${uniId} user="${username}"`);

            if (uniId === 'iust') {
              let curVs = body.vs;
              let curEv = body.ev;
              let curVsg = body.vsg || '6A475423';
              let curCookie = cookie;

              if (!curVs || !curEv) {
                const fresh = await fetchIustCaptchaHelper(targetOrigin);
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({
                  ok: false,
                  error: 'نشست ورود منقضی شده بود. لطفاً کد امنیتی جدید را وارد کنید.',
                  newCaptcha: fresh.captcha,
                  cookie: fresh.cookie,
                  vs: fresh.vs,
                  ev: fresh.ev,
                  vsg: fresh.vsg,
                }));
                return;
              }

              // ۲. ارسال فرم لاگین act 09 با ViewState معتبر نشست
              const postParams = new URLSearchParams({
                '__VIEWSTATE': curVs,
                '__VIEWSTATEGENERATOR': curVsg,
                '__EVENTVALIDATION': curEv,
                'TxtMiddle': `<r F51851="" F80351="${username}" F80401="${password}" F51701="${captcha}" F83181=""/>`,
                'Fm_Action': '09',
                'Frm_Type': '',
                'Frm_No': '',
                'TicketTextBox': '',
              });

              const loginRes = await fetch(`${targetOrigin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0%3b1&tck=&&&lastm=20240303092318`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  Referer: `${targetOrigin}/Forms/AuthenticateUser/AuthUser.aspx?fid=0;1&tck=&&&lastm=20240303092318`,
                  Cookie: curCookie,
                },
                body: postParams.toString(),
              });

              const loginHtml = await loginRes.text();
              if (loginHtml.includes('ErrorArr = new Array(') || loginHtml.includes('SetError(')) {
                const errM = loginHtml.match(/ErrorArr\s*=\s*new\s*Array\(['"]([^'"]+)['"]\)/i) ||
                             loginHtml.match(/alert\(['"]([^'"]+)['"]\)/i);
                const errMsg = errM ? errM[1] : 'کد امنیتی، شماره دانشجویی یا گذرواژه اشتباه است';

                // تولید کپچای جدید به همراه ViewState تازه
                let fresh = null;
                try {
                  fresh = await fetchIustCaptchaHelper(targetOrigin);
                } catch {}

                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({
                  ok: false,
                  error: errMsg,
                  newCaptcha: fresh?.captcha || null,
                  cookie: fresh?.cookie || null,
                  vs: fresh?.vs || null,
                  ev: fresh?.ev || null,
                  vsg: fresh?.vsg || null,
                }));
                return;
              }

              // استخراج توکن‌های نشست از تابع SavAut و کوکی‌ها
              const savAutMatch = loginHtml.match(/SavAut\(([^,]+),[^,]+,[^,]+,[^,]+,['"]([^'"]+)['"],['"]([^'"]+)['"]/i);
              const tck = savAutMatch ? savAutMatch[3] : ((loginHtml.match(/tck=([A-Za-z0-9-]+)/i) || [])[1] || 'iust-tck');
              const lt = savAutMatch ? savAutMatch[2] : '';
              const uid = savAutMatch ? savAutMatch[1].replace(/['"]/g, '').trim() : username;

              const setCookies = setCookiePairs(loginRes.headers);
              let jar = mergeCookies(curCookie, setCookies);
              if (lt && !jar.includes('lt=')) jar += `; lt=${lt}`;
              if (uid && !jar.includes('u=')) jar += `; u=${uid}`;
              jar += '; su=0; ft=0; f=1; seq=1';

              const sessionData = {
                sid: tck,
                ticket: tck,
                studentId: username,
                cookies: jar,
                university: 'iust',
                updatedAt: new Date().toISOString(),
                source: 'iust-direct-form',
              };
              fs.writeFileSync(
                path.join(process.cwd(), '.behestan-session.json'),
                JSON.stringify(sessionData, null, 2),
              );

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({
                ok: true,
                sid: tck,
                ticket: tck,
                studentId: username,
                cookies: jar,
              }));
              return;
            }

            const upstream = await fetch(`${targetOrigin}/frm/loginapi/loginapi.svc/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Origin: targetOrigin,
                Referer: `${targetOrigin}/browser/fa/`,
                ...(cookie ? { Cookie: cookie } : {})
              },
              body: JSON.stringify({
                act: '09',
                r: { l: username, p: password, c: captcha, code: '', ticket: '', d: '0' },
                rp: {},
              }),
            });

            const data = await upstream.json();
            const errors = data?.msg?.errors || [];
            if (errors.length > 0) {
              console.warn(`[direct-login-server] failed: ${errors.join(' - ')}`);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ ok: false, error: errors.join(' - '), newCaptcha: data.capt }));
              return;
            }

            const sid = data?.oaut?.rp?.sid;
            let ticket = data?.t;
            if (!sid || !ticket) {
              console.warn('[direct-login-server] invalid response', data);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ ok: false, error: 'پاسخ نامعتبر از سرور دانشگاه', raw: data }));
              return;
            }

            let jar = mergeCookies(cookie, setCookiePairs(upstream.headers));
            if (!/ASP\.NET_SessionId=/i.test(jar)) jar = mergeCookies(jar, [`ASP.NET_SessionId=${sid}`]);
            let detectedStd = username;
            let detectedUid = null;

            const sessionData = {
              sid,
              ticket,
              studentId: detectedStd || username,
              userId: detectedUid || undefined,
              cookies: jar,
              university: uniId,
              updatedAt: new Date().toISOString(),
              source: `${uniId}-direct-form`,
            };
            fs.writeFileSync(
              path.join(process.cwd(), '.behestan-session.json'),
              JSON.stringify(sessionData, null, 2),
            );

            console.log(`[direct-login-server] login success (${uniId}): sid=${sid}, studentId=${detectedStd}`);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ ok: true, sid, ticket, studentId: detectedStd || username, userId: detectedUid, cookies: jar }));
          } catch (err) {
            console.error('[direct-login-server] error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ ok: false, error: String(err?.message || err) }));
          }
        });
      });

      // سازگاری برای درخواست‌های قبلی sbu-login
      server.middlewares.use('/__sarvestan/sbu-login', (req, res) => {
        req.url = '/__sarvestan/direct-login';
        server.middlewares.handle(req, res);
      });
    },
  };
}

/** پلاگین CORS و OPTIONS برای پراکسی بهستان و بهشتی */
function behestanCorsPlugin() {
  return {
    name: 'sarvestan-cors-options',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (
          req.method === 'OPTIONS' &&
          typeof req.url === 'string' &&
          (req.url.startsWith('/behestan-api') ||
            req.url.startsWith('/sbu-api') ||
            req.url.startsWith('/ut-api'))
        ) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
          res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Accept, Authorization, X-Requested-With, X-Behestan-Cookie, X-Behestan-Sid',
          );
          res.setHeader('Access-Control-Max-Age', '86400');
          res.statusCode = 204;
          res.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sessionPlugin(), ssoLoginPlugin(), sbuLoginPlugin(), behestanCorsPlugin()],
  server: {
    port: 5174,
    strictPort: true,
    watch: {
      ignored: [
        '**/.behestan*',
        '**/*.txt',
        '**/*.har',
        '**/*.log',
        '**/scratch/**',
      ],
    },
    proxy: {
      '/behestan-api': {
        target: 'https://behestan.kntu.ac.ir',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        autoRewrite: true,
        protocolRewrite: 'http',
        rewrite: (path) => path.replace(/^\/behestan-api/, ''),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8',
          Origin: 'https://behestan.kntu.ac.ir',
          Referer: 'https://behestan.kntu.ac.ir/browser/fa/',
        },
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('[behestan-proxy error]', req?.method, req?.url, err?.message || err);
            if (!res.headersSent) {
              res.writeHead(502, {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ error: 'Proxy error', message: String(err?.message || err) }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            let cookie = req.headers['x-behestan-cookie'] || '';
            let sid = req.headers['x-behestan-sid'] || '';
            if (!cookie) {
              try {
                const sessionFile = path.join(process.cwd(), '.behestan-session.json');
                if (fs.existsSync(sessionFile)) {
                  const s = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
                  cookie = s?.cookies || '';
                  if (!sid && s?.sid) sid = s.sid;
                }
              } catch {}
            }
            if (sid && !cookie.includes('ASP.NET_SessionId')) {
              cookie = cookie ? `${cookie}; ASP.NET_SessionId=${sid}` : `ASP.NET_SessionId=${sid}`;
            }
            if (cookie) {
              proxyReq.setHeader('Cookie', cookie);
              console.log(`[behestan-proxy cookie injected] ${cookie.slice(0, 60)}...`);
            }
            console.log(`[behestan-proxy req] ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const loc = proxyRes.headers['location'];
            if (loc) {
              const rewritten = loc.replace(/^https?:\/\/behestan\.kntu\.ac\.ir/i, '/behestan-api');
              proxyRes.headers['location'] = rewritten;
              console.log(`[behestan-proxy res] ${proxyRes.statusCode} redirect: ${loc} -> ${rewritten}`);
            } else {
              console.log(`[behestan-proxy res] ${proxyRes.statusCode} ${req.url}`);
            }

            // Capture body snippet for debugging
            const chunks = [];
            proxyRes.on('data', (c) => chunks.push(c));
            proxyRes.on('end', () => {
              const text = Buffer.concat(chunks).toString('utf8');
              if (proxyRes.statusCode >= 400) {
                const titleM = text.match(/<title[^>]*>([^<]+)<\/title>/i);
                const h2M = text.match(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/i);
                console.error(`[behestan-proxy ${proxyRes.statusCode} HTML] ${req.url}: Title="${titleM?.[1]?.trim()}" H="${h2M?.[1]?.replace(/<[^>]+>/g, '').trim()}" Snippet: ${text.slice(0, 350).replace(/\s+/g, ' ')}`);
              } else if (req.url.includes('ViewReport')) {
                console.log(`[behestan-proxy ViewReport OK] snippet: ${text.slice(0, 300).replace(/\s+/g, ' ')}`);
              }
            });

            try {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
              res.setHeader(
                'Access-Control-Allow-Headers',
                'Content-Type, Accept, Authorization, X-Requested-With, X-Behestan-Cookie, X-Behestan-Sid',
              );
            } catch {}
          });
        },
      },
      '/sbu-api': {
        target: 'https://ems.sbu.ac.ir',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        autoRewrite: true,
        protocolRewrite: 'http',
        rewrite: (path) => path.replace(/^\/sbu-api/, ''),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8',
          Origin: 'https://ems.sbu.ac.ir',
          Referer: 'https://ems.sbu.ac.ir/browser/fa/',
        },
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('[sbu-proxy error]', req?.method, req?.url, err?.message || err);
            if (!res.headersSent) {
              res.writeHead(502, {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ error: 'Proxy error', message: String(err?.message || err) }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            let cookie = req.headers['x-behestan-cookie'] || '';
            let sid = req.headers['x-behestan-sid'] || '';
            if (!cookie && !sid) {
              try {
                const s = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.behestan-session.json'), 'utf8'));
                if (s?.university === 'sbu') {
                  cookie = s.cookies || '';
                  sid = s.sid || '';
                }
              } catch {}
            }
            if (sid && !/ASP\.NET_SessionId=/i.test(cookie)) cookie = mergeCookies(cookie, [`ASP.NET_SessionId=${sid}`]);
            proxyReq.removeHeader('x-behestan-cookie');
            proxyReq.removeHeader('x-behestan-sid');
            proxyReq.removeHeader('cookie');
            if (cookie) proxyReq.setHeader('Cookie', cookie);
            console.log(`[sbu-proxy req] ${req.method} ${req.url} cookie=${cookie ? 'yes' : 'NO'}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const loc = proxyRes.headers['location'];
            if (loc) {
              const rewritten = loc.replace(/^https?:\/\/ems\.sbu\.ac\.ir/i, '/sbu-api');
              proxyRes.headers['location'] = rewritten;
              console.log(`[sbu-proxy res] ${proxyRes.statusCode} redirect: ${loc} -> ${rewritten}`);
            } else {
              console.log(`[sbu-proxy res] ${proxyRes.statusCode} ${req.url}`);
            }

            const chunks = [];
            proxyRes.on('data', (c) => chunks.push(c));
            proxyRes.on('end', () => {
              const text = Buffer.concat(chunks).toString('utf8');
              if (proxyRes.statusCode >= 400) {
                const titleM = text.match(/<title[^>]*>([^<]+)<\/title>/i);
                const h2M = text.match(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/i);
                console.error(`[sbu-proxy ${proxyRes.statusCode} HTML] ${req.url}: Title="${titleM?.[1]?.trim()}" H="${h2M?.[1]?.replace(/<[^>]+>/g, '').trim()}" Snippet: ${text.slice(0, 350).replace(/\s+/g, ' ')}`);
              } else if (req.url.includes('ViewReport') || req.url.includes('F1825') || req.url.includes('F1809')) {
                console.log(`[sbu-proxy OK] ${req.url} snippet: ${text.slice(0, 250).replace(/\s+/g, ' ')}`);
              }
            });

            try {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
              res.setHeader(
                'Access-Control-Allow-Headers',
                'Content-Type, Accept, Authorization, X-Requested-With, X-Behestan-Cookie, X-Behestan-Sid',
              );
            } catch {}
          });
        },
      },
      '/ut-api': {
        target: 'https://ems2.ut.ac.ir',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        autoRewrite: true,
        protocolRewrite: 'http',
        rewrite: (path) => path.replace(/^\/ut-api/, ''),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8',
          Origin: 'https://ems2.ut.ac.ir',
          Referer: 'https://ems2.ut.ac.ir/browser/fa/',
        },
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('[ut-proxy error]', req?.method, req?.url, err?.message || err);
            if (!res.headersSent) {
              res.writeHead(502, {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ error: 'Proxy error', message: String(err?.message || err) }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            let cookie = req.headers['x-behestan-cookie'] || '';
            let sid = req.headers['x-behestan-sid'] || '';
            if (!cookie && !sid) {
              try {
                const s = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.behestan-session.json'), 'utf8'));
                if (s?.university === 'ut') {
                  cookie = s.cookies || '';
                  sid = s.sid || '';
                }
              } catch {}
            }
            if (sid && !/ASP\.NET_SessionId=/i.test(cookie)) cookie = mergeCookies(cookie, [`ASP.NET_SessionId=${sid}`]);
            proxyReq.removeHeader('x-behestan-cookie');
            proxyReq.removeHeader('x-behestan-sid');
            proxyReq.removeHeader('cookie');
            if (cookie) proxyReq.setHeader('Cookie', cookie);
            const sentNames = cookie
              ? cookie.split(';').map((x) => x.trim().split('=')[0]).filter(Boolean).join('+')
              : 'NO';
            console.log(`[ut-proxy req] ${req.method} ${req.url} cookie=${sentNames}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const loc = proxyRes.headers['location'];
            if (loc) {
              const rewritten = loc.replace(/^https?:\/\/ems2\.ut\.ac\.ir/i, '/ut-api');
              proxyRes.headers['location'] = rewritten;
              console.log(`[ut-proxy res] ${proxyRes.statusCode} redirect: ${loc} -> ${rewritten}`);
            } else {
              console.log(`[ut-proxy res] ${proxyRes.statusCode} ${req.url}`);
            }

            const chunks = [];
            proxyRes.on('data', (c) => chunks.push(c));
            proxyRes.on('end', () => {
              const text = Buffer.concat(chunks).toString('utf8');
              if (proxyRes.statusCode >= 400) {
                const titleM = text.match(/<title[^>]*>([^<]+)<\/title>/i);
                const h2M = text.match(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/i);
                console.error(`[ut-proxy ${proxyRes.statusCode} HTML] ${req.url}: Title="${titleM?.[1]?.trim()}" H="${h2M?.[1]?.replace(/<[^>]+>/g, '').trim()}" Snippet: ${text.slice(0, 350).replace(/\s+/g, ' ')}`);
              } else if (/"errors":\s*\[\s*"/.test(text)) {
                console.error(`[ut-proxy behestan-error] ${req.url}: ${text.slice(0, 300).replace(/\s+/g, ' ')}`);
              } else if (req.url.includes('ViewReport') || req.url.includes('F1825') || req.url.includes('F1809')) {
                console.log(`[ut-proxy OK] ${req.url} snippet: ${text.slice(0, 250).replace(/\s+/g, ' ')}`);
              }
            });

            try {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
              res.setHeader(
                'Access-Control-Allow-Headers',
                'Content-Type, Accept, Authorization, X-Requested-With, X-Behestan-Cookie, X-Behestan-Sid',
              );
            } catch {}
          });
        },
      },
    },
  },
})

