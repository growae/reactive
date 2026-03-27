import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'
import type { NamePointer } from './updateName'

export type GetNameEntryParameters = {
  name: string
  networkId?: string | undefined
}

export type GetNameEntryReturnType = {
  id: string
  owner: string
  pointers: NamePointer[]
  ttl: number
}

export type GetNameEntryErrorType = BaseErrorType | ErrorType

export async function getNameEntry(
  config: Config,
  parameters: GetNameEntryParameters,
): Promise<GetNameEntryReturnType> {
  const { name } = parameters
  const node = config.getNodeClient({ networkId: parameters.networkId })

  const entry = await node.getNameEntryByName(name)

  return {
    id: entry.id,
    owner: entry.owner ?? '',
    pointers: (entry.pointers ?? []).map((p: any) => ({
      key: p.key,
      id: p.id,
    })),
    ttl: entry.ttl,
  }
}
