import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { watch } from 'chokidar'

import type {
  ContractConfig,
  Plugin,
  ReactiveConfig,
  ResolvedContract,
} from '../config'
import { findConfig } from '../utils/findConfig'
import { resolveConfig } from '../utils/resolveConfig'

export type GenerateOptions = {
  config?: string
  root?: string
  watch?: boolean
}

export async function generate(options: GenerateOptions = {}): Promise<void> {
  const configPath = findConfig(options)
  if (!configPath) {
    if (options.config) throw new Error(`Config not found at ${options.config}`)
    throw new Error('Config not found')
  }

  const config = await resolveConfig({ configPath })
  await runGenerate(config)

  if (options.watch) {
    const paths = config.contracts
      .filter((c) => c.sourceCode || typeof c.aci === 'string')
      .map((c) => resolve(process.cwd(), (c.sourceCode ?? c.aci) as string))

    if (paths.length === 0) {
      console.log('Watch mode enabled but no file paths to watch.')
      return
    }

    const watcher = watch(paths, {
      ignoreInitial: true,
      persistent: true,
    })

    watcher.on('change', async () => {
      console.log('File change detected, regenerating...')
      try {
        const freshConfig = await resolveConfig({ configPath })
        await runGenerate(freshConfig)
      } catch (_error) {}
    })

    process.once('SIGINT', () => {
      void watcher.close()
      process.exit(0)
    })
    process.once('SIGTERM', () => {
      void watcher.close()
      process.exit(0)
    })

    console.log(`Watching ${paths.length} file(s) for changes...`)
  }
}

async function runGenerate(config: ReactiveConfig): Promise<void> {
  const plugins = config.plugins ?? []

  const contractConfigs: ContractConfig[] = [...config.contracts]
  for (const plugin of plugins) {
    if (plugin.contracts) {
      const pluginContracts = await plugin.contracts()
      contractConfigs.push(...pluginContracts)
    }
  }

  const contractNames = new Set<string>()
  const contracts: ResolvedContract[] = []
  for (const contractConfig of contractConfigs) {
    if (contractNames.has(contractConfig.name)) {
      throw new Error(`Contract name "${contractConfig.name}" must be unique.`)
    }
    contractNames.add(contractConfig.name)

    const resolved = await resolveContract(contractConfig)
    contracts.push(resolved)
  }

  if (contracts.length === 0 && plugins.length === 0) {
    console.log('No contracts found.')
    return
  }

  const outputs: { plugin: Pick<Plugin, 'name'>; content: string }[] = []
  const contentParts: string[] = []

  for (const contract of contracts) {
    contentParts.push(contract.content)
  }

  for (const plugin of plugins) {
    if (!plugin.run) continue
    const result = await plugin.run({ contracts, outputs })
    outputs.push({ plugin: { name: plugin.name }, ...result })
    if (result.content) contentParts.push(result.content)
  }

  const output = contentParts.join('\n\n')
  const outPath = resolve(process.cwd(), config.out)
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, output)

  console.log(`Generated ${outPath}`)
}

async function resolveContract(
  config: ContractConfig,
): Promise<ResolvedContract> {
  let resolvedAci: Record<string, unknown>

  if (typeof config.aci === 'object' && config.aci !== null) {
    resolvedAci = config.aci as Record<string, unknown>
  } else if (typeof config.aci === 'string') {
    const aciPath = resolve(process.cwd(), config.aci)
    const content = await readFile(aciPath, 'utf-8')
    resolvedAci = JSON.parse(content) as Record<string, unknown>
  } else {
    resolvedAci = {}
  }

  const functions = extractFunctions(resolvedAci)
  const content = generateContractCode(config.name, config.address, functions)

  return {
    ...config,
    resolvedAci,
    content,
  }
}

type AciFunction = {
  name: string
  arguments: { name: string; type: string }[]
  returns: string
  stateful: boolean
}

function extractFunctions(aci: Record<string, unknown>): AciFunction[] {
  const functions: AciFunction[] = []

  const entries = Array.isArray(aci) ? aci : [aci]
  for (const entry of entries) {
    const entryObj = entry as Record<string, unknown>
    if (entryObj.contract && typeof entryObj.contract === 'object') {
      const contract = entryObj.contract as Record<string, unknown>
      const fns = contract.functions
      if (Array.isArray(fns)) {
        for (const fn of fns) {
          const fnObj = fn as Record<string, unknown>
          functions.push({
            name: fnObj.name as string,
            arguments: (fnObj.arguments ?? []) as {
              name: string
              type: string
            }[],
            returns: (fnObj.returns as string) ?? 'unit',
            stateful: (fnObj.stateful as boolean) ?? false,
          })
        }
      }
    }
  }

  return functions
}

function generateContractCode(
  name: string,
  address: string | undefined,
  functions: AciFunction[],
): string {
  const lines: string[] = []

  lines.push(
    '//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////',
  )
  lines.push(`// ${name}`)
  lines.push(
    '//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////',
  )
  lines.push('')

  if (address) {
    lines.push(`export const ${camelCase(name)}Address = '${address}' as const`)
    lines.push('')
  }

  if (functions.length > 0) {
    lines.push(`export const ${camelCase(name)}Functions = {`)
    for (const fn of functions) {
      const args = fn.arguments.map((a) => `'${a.name}'`).join(', ')
      lines.push(`  ${fn.name}: {`)
      lines.push(`    arguments: [${args}],`)
      lines.push(`    returns: '${fn.returns}',`)
      lines.push(`    stateful: ${String(fn.stateful)},`)
      lines.push('  },')
    }
    lines.push('} as const')
  }

  return lines.join('\n')
}

function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) =>
      c ? c.toUpperCase() : '',
    )
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
}
