import type { Config } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'
import { NodeRequestError } from '../node.js'

export type NameTextParameters = {
  name: string
  key: string
  networkId?: string | undefined
}
export async function getNameText(config: Config, p: NameTextParameters) {
  try {
    const entry = await config.getNodeClient(p).getNameEntryByName(p.name)
    const pointer = entry.pointers.find((pointer) => pointer.key === p.key)
    if (!pointer?.id.startsWith('ba_')) return null
    const { encoding } = await loadProtocol()
    return new TextDecoder('utf-8', { fatal: true }).decode(
      encoding.decode(pointer.id),
    )
  } catch (e) {
    if (e instanceof NodeRequestError && e.statusCode === 404) return null
    throw e
  }
}
export function getNameAvatar(
  config: Config,
  p: { name: string; key?: string | undefined; networkId?: string | undefined },
) {
  return getNameText(config, { ...p, key: p.key ?? 'avatar' })
}
export async function getContractProof(
  config: Config,
  p: { address: string; networkId?: string | undefined },
) {
  return (await config.getNodeClient(p).getContractProof(p.address)).poi
}
