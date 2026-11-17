import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import type { NodeClient } from '../node.js'

export type GetHeightParameters = {
  networkId?: string | undefined
}

export type GetHeightReturnType = number

export type GetHeightErrorType = BaseErrorType | ErrorType

export async function getHeight(
  config: Config,
  parameters: GetHeightParameters = {},
): Promise<GetHeightReturnType> {
  const node: NodeClient = config.getNodeClient({
    networkId: parameters.networkId,
  })
  const { height } = await node.getCurrentKeyBlockHeight()
  return height
}
