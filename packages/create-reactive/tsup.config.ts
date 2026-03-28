import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: 'esm',
  target: 'node18',
  splitting: false,
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
  tsconfig: 'tsconfig.build.json',
})
