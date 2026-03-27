import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@growae/reactive/query': resolve(
        __dirname,
        'packages/core/src/exports/query.ts',
      ),
      '@growae/reactive/actions': resolve(
        __dirname,
        'packages/core/src/exports/actions.ts',
      ),
      '@growae/reactive/networks': resolve(
        __dirname,
        'packages/core/src/exports/networks.ts',
      ),
      '@growae/reactive/internal': resolve(
        __dirname,
        'packages/core/src/exports/internal.ts',
      ),
      '@growae/reactive': resolve(
        __dirname,
        'packages/core/src/exports/index.ts',
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
