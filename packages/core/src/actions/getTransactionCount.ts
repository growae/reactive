import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import type { NodeClient } from '../node.js'

export type GetTransactionCountParameters = {
  address: string
  networkId?: string | undefined
}

export type GetTransactionCountReturnType = number

export type GetTransactionCountErrorType = BaseErrorType | ErrorType

export async function getTransactionCount(
  config: Config,
  parameters: GetTransactionCountParameters,
): Promise<GetTransactionCountReturnType> {
  const { address } = parameters
  const node: NodeClient = config.getNodeClient({
    networkId: parameters.networkId,
  })

  const { nextNonce } = await node.getAccountNextNonce(address)
  return nextNonce
}
