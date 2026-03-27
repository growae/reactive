import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

import { findConfig } from '../utils/findConfig.js'

export type InitOptions = {
  config?: string
  root?: string
}

export async function init(options: InitOptions = {}): Promise<string> {
  const configPath = findConfig(options)
  if (configPath) {
    const relPath = relative(process.cwd(), configPath)
    console.log(`Config already exists at ${relPath}`)
    return configPath
  }

  const rootDir = resolve(options.root || process.cwd())
  const outPath = options.config
    ? resolve(rootDir, options.config)
    : resolve(rootDir, 'reactive.config.ts')

  if (existsSync(outPath)) {
    console.log(`Config already exists at ${relative(process.cwd(), outPath)}`)
    return outPath
  }

  const content = `import { defineConfig } from '@growae/reactive-cli'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [],
  plugins: [],
})
`

  await writeFile(outPath, content)
  console.log(`Config created at ${relative(process.cwd(), outPath)}`)

  return outPath
}
