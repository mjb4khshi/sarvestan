import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function pwaManifestInjector() {
  return {
    name: 'pwa-manifest-injector',
    apply: 'build',
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist')
        const assetsDir = path.join(distDir, 'assets')
        const swPath = path.join(distDir, 'sw.js')
        if (fs.existsSync(assetsDir) && fs.existsSync(swPath)) {
          const files = fs.readdirSync(assetsDir)
          const assetUrls = files.map((f) => `./assets/${f}`)
          let swContent = fs.readFileSync(swPath, 'utf8')
          const injected = JSON.stringify(assetUrls, null, 2)
          swContent = swContent.replace(
            /\/\* __BUILD_ASSETS__ \*\//,
            `...${injected},`
          )
          fs.writeFileSync(swPath, swContent, 'utf8')
          console.log('[pwa-build] Injected', assetUrls.length, 'built assets into dist/sw.js')
        }
      } catch (e) {
        console.warn('[pwa-build] Failed to inject assets into sw.js:', e)
      }
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    pwaManifestInjector(),
  ],
  server: {
    watch: {
      ignored: ['**/sarvestan-android/**', '**/*.apk', '**/*.zip', '**/dist/**']
    }
  }
})
