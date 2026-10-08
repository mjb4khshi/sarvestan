import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [
    react(),
  ],
  server: {
    watch: {
      ignored: ['**/sarvestan-android/**', '**/*.apk', '**/*.zip', '**/dist/**']
    }
  }
})
