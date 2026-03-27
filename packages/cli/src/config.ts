export type ContractConfig = {
  /** Contract name used for generated code identifiers */
  name: string
  /** Deployed contract address (ct_...) */
  address?: string
  /** Contract ACI — JSON object or path to .json file */
  aci?: string | Record<string, unknown>
  /** Path to Sophia source code (.aes file) */
  sourceCode?: string
}

export type ResolvedContract = ContractConfig & {
  /** Resolved ACI object */
  resolvedAci: Record<string, unknown>
  /** Generated code string */
  content: string
}

export type Plugin = {
  /** Plugin name */
  name: string
  /** Provide additional contracts */
  contracts?: () => Promise<ContractConfig[]>
  /** Run plugin logic and return generated content */
  run?: (config: {
    contracts: ResolvedContract[]
    outputs: readonly { plugin: Pick<Plugin, 'name'>; content: string }[]
  }) => Promise<{ content: string }>
}

export type ReactiveConfig = {
  /** Output file path for generated code */
  out: string
  /** Contract configurations */
  contracts: ContractConfig[]
  /** Plugins to run */
  plugins?: Plugin[]
}

export function defineConfig(config: ReactiveConfig): ReactiveConfig {
  return config
}

export const defaultConfig: ReactiveConfig = {
  out: 'src/generated.ts',
  contracts: [],
  plugins: [],
}
