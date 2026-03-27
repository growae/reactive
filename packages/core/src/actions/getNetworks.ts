import type { Config } from '../createConfig'
import type { Network } from '../types/network'

export type GetNetworksReturnType = readonly Network[]

export function getNetworks(config: Config): GetNetworksReturnType {
  return config.networks
}
