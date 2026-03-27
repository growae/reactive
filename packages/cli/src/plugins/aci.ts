import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type { ContractConfig, Plugin } from '../config.js'

export type AciConfig = {
  /** Directory containing ACI JSON files */
  directory: string
  /** File pattern to match (default: '*.json') */
  pattern?: string
}

/**
 * Plugin that loads contract ACI from local JSON files.
 * Each JSON file should contain a valid ACI object with contract name.
 */
export function aci(config: AciConfig): Plugin {
  return {
    name: 'ACI',
    async contracts() {
      const { readdir } = await import('node:fs/promises')
      const dir = resolve(process.cwd(), config.directory)
      const pattern = config.pattern ?? '.json'

      let files: string[]
      try {
        files = await readdir(dir)
      } catch {
        return []
      }

      const contracts: ContractConfig[] = []
      for (const file of files) {
        if (!file.endsWith(pattern)) continue
        const filePath = resolve(dir, file)
        const content = await readFile(filePath, 'utf-8')
        const aciData = JSON.parse(content) as Record<string, unknown>
        const name =
          (aciData['contract_name'] as string | undefined) ??
          file.replace(/\.json$/, '')
        contracts.push({
          name,
          aci: aciData,
        })
      }

      return contracts
    },
  }
}
