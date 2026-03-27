import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const configFiles = [
  'reactive.config.ts',
  'reactive.config.js',
  'reactive.config.mjs',
  'reactive.config.mts',
]

export type FindConfigParameters = {
  config?: string | undefined
  root?: string | undefined
}

export function findConfig(
  parameters: FindConfigParameters = {},
): string | undefined {
  const { config, root } = parameters
  const rootDir = resolve(root || process.cwd())

  if (config) {
    const path = resolve(rootDir, config)
    if (existsSync(path)) return path
    return undefined
  }

  for (const file of configFiles) {
    const path = resolve(rootDir, file)
    if (existsSync(path)) return path
  }

  return undefined
}
