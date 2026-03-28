import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const pkgs = resolve(__dirname, '../../packages')

export default defineConfig({
  plugins: [react()],
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
      '@growae/reactive-react/query': resolve(
        pkgs,
        'react/src/exports/query.ts',
      ),
      '@growae/reactive-react': resolve(pkgs, 'react/src/exports/index.ts'),
      '@growae/reactive-connectors': resolve(
        pkgs,
        'connectors/src/exports/index.ts',
      ),
    },
  },
})
