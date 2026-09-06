import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type ResolveNameParameters = {
  name: string
  key?: string
  networkId?: string
}

export type ResolveNameReturnType = {
  address: string | undefined
}

export class NameNotResolvedError extends BaseError {
  override name = 'NameNotResolvedError'
  constructor({ name }: { name: string }) {
    super(`Name "${name}" could not be resolved.`)
  }
}

export async function resolveName(
  config: Config,
  parameters: ResolveNameParameters,
): Promise<ResolveNameReturnType> {
  const { name, key = 'account_pubkey', networkId } = parameters

  const node = config.getNodeClient({ networkId })

  try {
    const entry = await node.getNameEntryByName(name)
    const pointer = entry.pointers.find((p: any) => p.key === key)

    return {
      address: pointer?.id,
    }
  } catch {
    throw new NameNotResolvedError({ name })
  }
}
