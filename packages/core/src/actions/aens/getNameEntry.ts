import type { Config } from '../../createConfig'

export type GetNameEntryParameters = {
  name: string
  networkId?: string
}

export type NamePointerEntry = {
  key: string
  id: string
}

export type GetNameEntryReturnType = {
  id: string
  owner: string
  ttl: number
  pointers: NamePointerEntry[]
}

export async function getNameEntry(
  config: Config,
  parameters: GetNameEntryParameters,
): Promise<GetNameEntryReturnType> {
  const { name, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const entry = await node.getNameEntryByName(name)

  return {
    id: entry.id,
    owner: entry.owner ?? '',
    ttl: entry.ttl,
    pointers: entry.pointers.map((p: any) => ({
      key: p.key,
      id: p.id,
    })),
  }
}
