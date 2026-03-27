import type { Config, Network } from '../createConfig.js'

export type GetNetworksReturnType = readonly Network[]

export function getNetworks(config: Config): GetNetworksReturnType {
  return config.networks
}
