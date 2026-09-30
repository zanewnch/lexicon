import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import projectTreePlugin from './plugins/projectTree'

const backendUrl = process.env.UNUS_BACKEND_URL || 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: backendUrl, timeout: 0, proxyTimeout: 0 },
      '/media': backendUrl,
      '/ws': { target: backendUrl.replace('http:', 'ws:'), ws: true },
    },
  },
  plugins: [
    vue(),
    vueDevTools(),
    projectTreePlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
