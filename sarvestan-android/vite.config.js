import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loginViaCentralSso } from './scripts/sso-login-server.mjs'
import fs from 'fs'
import path from 'path'

/** نشست ذخیره‌شدهٔ سرور — اپ با GET می‌خواند و سنک زنده می‌دود */
function sessionPlugin() {
  const FILE = path.join(process.cwd(), '.behestan-session.json')
  return {
    name: 'sarvestan-session',
    configureServer(server) {
      server.middlewares.use('/__sarvestan/session', (req, res) => {
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

export default defineConfig({
  plugins: [react(), tailwindcss(), sessionPlugin(), ssoLoginPlugin()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/behestan-api': {
        target: 'https://behestan.kntu.ac.ir',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/behestan-api/, ''),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8',
          Origin: 'https://behestan.kntu.ac.ir',
          Referer: 'https://behestan.kntu.ac.ir/',
        },
        configure: (proxy) => {
          // کوکی‌های SSO را به درخواست‌های API اضافه کن
          proxy.on('proxyReq', (proxyReq) => {
            try {
              const sess = JSON.parse(
                fs.readFileSync(path.join(process.cwd(), '.behestan-session.json'), 'utf8'),
              )
              if (sess?.cookies) {
                proxyReq.setHeader('Cookie', sess.cookies)
              }
            } catch {}
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            try {
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
              res.setHeader(
                'Access-Control-Allow-Headers',
                'Content-Type, Accept, Authorization, X-Requested-With',
              )
            } catch {}
          })
        },
      },
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (
          req.method === 'OPTIONS' &&
          typeof req.url === 'string' &&
          req.url.startsWith('/behestan-api')
        ) {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
          res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Accept, Authorization, X-Requested-With',
          )
          res.setHeader('Access-Control-Max-Age', '86400')
          res.statusCode = 204
          res.end()
          return
        }
        next()
      })
    },
  },
})
