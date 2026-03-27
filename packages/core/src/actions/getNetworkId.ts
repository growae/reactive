import type { Config } from '../createConfig'

export type GetNetworkIdReturnType = string

export function getNetworkId(config: Config): GetNetworkIdReturnType {
  return config.state.networkId
}
