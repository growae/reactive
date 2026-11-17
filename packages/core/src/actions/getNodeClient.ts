import type { Config } from '../createConfig.js'
import type { NodeClient } from '../node.js'

export type GetNodeClientParameters = {
  networkId?: string | undefined
}

export type GetNodeClientReturnType = NodeClient

export function getNodeClient(
  config: Config,
  parameters: GetNodeClientParameters = {},
): GetNodeClientReturnType {
  return config.getNodeClient({ networkId: parameters.networkId })
}
