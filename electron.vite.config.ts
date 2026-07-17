import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'cjs'
        }
      }
    }
  },
  renderer: {
    plugins: [vue()],
    css: {
      preprocessorOptions: {
        sass: {
          // Quasar still uses Sass @import internally. The dependency's migration
          // is outside this project, so suppress only that known warning class.
          silenceDeprecations: ['import']
        }
      }
    },
    build: {
      rollupOptions: {
        input: {
          app: resolve(__dirname, 'src/renderer/app/index.html'),
          popup: resolve(__dirname, 'src/renderer/popup/index.html'),
          settings: resolve(__dirname, 'src/renderer/settings/index.html'),
          setup: resolve(__dirname, 'src/renderer/setup/index.html'),
          'download-model': resolve(__dirname, 'src/renderer/download-model/index.html')
        }
      }
    }
  }
})
