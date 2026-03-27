import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'

export type GetNodeClientParameters = {
  networkId?: string | undefined
}

export type GetNodeClientReturnType = Node

export function getNodeClient(
  config: Config,
  parameters: GetNodeClientParameters = {},
): GetNodeClientReturnType {
  return config.getNodeClient({ networkId: parameters.networkId })
}
