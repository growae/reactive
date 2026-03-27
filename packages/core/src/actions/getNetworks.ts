import type { Config } from '../createConfig.js'
import type { Network } from '../types/network.js'

export type GetNetworksReturnType = readonly Network[]

export function getNetworks(config: Config): GetNetworksReturnType {
  return config.networks
}
