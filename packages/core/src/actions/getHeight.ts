import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type GetHeightParameters = {
  networkId?: string | undefined
}

export type GetHeightReturnType = number

export type GetHeightErrorType = BaseErrorType | ErrorType

export async function getHeight(
  config: Config,
  parameters: GetHeightParameters = {},
): Promise<GetHeightReturnType> {
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })
  const { height } = await node.getCurrentKeyBlockHeight()
  return height
}
