import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@reactive/core/query': resolve(
        __dirname,
        'packages/core/src/exports/query.ts',
      ),
      '@reactive/core/actions': resolve(
        __dirname,
        'packages/core/src/exports/actions.ts',
      ),
      '@reactive/core/networks': resolve(
        __dirname,
        'packages/core/src/exports/networks.ts',
      ),
      '@reactive/core/internal': resolve(
        __dirname,
        'packages/core/src/exports/internal.ts',
      ),
      '@reactive/core': resolve(
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
