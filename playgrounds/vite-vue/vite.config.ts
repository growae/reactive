import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const pkgs = resolve(__dirname, '../../packages')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@growae/reactive/actions': resolve(pkgs, 'core/src/exports/actions.ts'),
      '@growae/reactive/query': resolve(pkgs, 'core/src/exports/query.ts'),
      '@growae/reactive/networks': resolve(
        pkgs,
        'core/src/exports/networks.ts',
      ),
      '@growae/reactive/internal': resolve(
        pkgs,
        'core/src/exports/internal.ts',
      ),
      '@growae/reactive': resolve(pkgs, 'core/src/exports/index.ts'),
      '@growae/reactive-vue/query': resolve(pkgs, 'vue/src/exports/query.ts'),
      '@growae/reactive-vue': resolve(pkgs, 'vue/src/exports/index.ts'),
      '@growae/reactive-connectors': resolve(
        pkgs,
        'connectors/src/exports/index.ts',
      ),
    },
  },
})
