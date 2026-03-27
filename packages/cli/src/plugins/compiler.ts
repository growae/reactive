import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type { ContractConfig, Plugin } from '../config'

export type CompilerConfig = {
  /** Path to Sophia source file or directory of .aes files */
  source: string
  /** Compiler URL (default: https://v8.compiler.aepps.com) */
  compilerUrl?: string
}

/**
 * Plugin that compiles Sophia source code and extracts ACI.
 * Uses the Sophia HTTP compiler API to compile contracts.
 */
export function compiler(config: CompilerConfig): Plugin {
  const compilerUrl = config.compilerUrl ?? 'https://v8.compiler.aepps.com'

  return {
    name: 'Compiler',
    async contracts() {
      const sourcePath = resolve(process.cwd(), config.source)
      const sourceCode = await readFile(sourcePath, 'utf-8')

      const response = await fetch(`${compilerUrl}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sourceCode, options: {} }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Compilation failed: ${error}`)
      }

      const result = (await response.json()) as Record<string, unknown>
      const name =
        (result.contract_name as string | undefined) ??
        config.source
          .replace(/\.aes$/, '')
          .split('/')
          .pop() ??
        'Contract'

      const contract: ContractConfig = {
        name,
        aci: result,
        sourceCode: config.source,
      }

      return [contract]
    },
  }
}
