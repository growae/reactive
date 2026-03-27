import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import type { ReactiveConfig } from '../config'

export type ResolveConfigParameters = {
  configPath: string
}

/**
 * Loads and resolves the reactive config from a file path.
 * Supports .ts (via dynamic import with tsx) and .js/.mjs files.
 */
export async function resolveConfig(
  parameters: ResolveConfigParameters,
): Promise<ReactiveConfig> {
  const { configPath } = parameters

  if (configPath.endsWith('.json')) {
    const content = await readFile(configPath, 'utf-8')
    return JSON.parse(content) as ReactiveConfig
  }

  const fileUrl = pathToFileURL(configPath).href
  const mod = (await import(fileUrl)) as {
    default: ReactiveConfig | { default: ReactiveConfig }
  }
  let config = mod.default
  if ('default' in config && typeof config.default === 'object') {
    config = config.default
  }
  return config as ReactiveConfig
}
