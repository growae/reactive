import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const pkgs = resolve(__dirname, '../../packages')

export default defineConfig({
  plugins: [solid()],
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
      '@growae/reactive-solid/query': resolve(
        pkgs,
        'solid/src/exports/query.ts',
      ),
      '@growae/reactive-solid': resolve(pkgs, 'solid/src/exports/index.ts'),
      '@growae/reactive-connectors': resolve(
        pkgs,
        'connectors/src/exports/index.ts',
      ),
    },
  },
})
