import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

/**
 * ماژول SSO فقط برای dev server لازم است و در CI gitignore شده.
 * اگر فایل نبود، بیلد/کانفیگ نباید بشکند.
 */
async function loadLoginViaCentralSso() {
  try {
    const file = path.join(process.cwd(), 'scripts', 'sso-login-server.mjs')
    if (!fs.existsSync(file)) return null
    const mod = await import(pathToFileURL(file).href)
    return typeof mod.loginViaCentralSso === 'function' ? mod.loginViaCentralSso : null
  } catch {
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
            const result = await loginViaCentralSso(body.username, body.password)
            if (result.ok) {
              fs.writeFileSync(
                path.join(process.cwd(), '.behestan-session.json'),
                JSON.stringify(
                  {
                    sid: result.sid,
                    ticket: result.ticket,
                    studentId: result.studentId || null,
                    cookies: result.cookies || '',
                    updatedAt: new Date().toISOString(),
                    source: 'sso-form',
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

/** پلاگین CORS و OPTIONS برای پراکسی بهستان */
function behestanCorsPlugin() {
  return {
    name: 'sarvestan-cors-options',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (
          req.method === 'OPTIONS' &&
          typeof req.url === 'string' &&
          req.url.startsWith('/behestan-api')
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
  plugins: [react(), tailwindcss(), sessionPlugin(), ssoLoginPlugin(), behestanCorsPlugin()],
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
    },
  },
})
