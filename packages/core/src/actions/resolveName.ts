import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type ResolveNameParameters = {
  name: string
  key?: string | undefined
  networkId?: string | undefined
}

export type ResolveNameReturnType = string | null

export type ResolveNameErrorType = BaseErrorType | ErrorType

export async function resolveName(
  config: Config,
  parameters: ResolveNameParameters,
): Promise<ResolveNameReturnType> {
  const { name, key = 'account_pubkey' } = parameters
  const node = config.getNodeClient({ networkId: parameters.networkId })

  try {
    const entry = await node.getNameEntryByName(name)
    const pointer = (entry.pointers ?? []).find((p: any) => p.key === key)
    return pointer?.id ?? null
  } catch {
    return null
  }
}
