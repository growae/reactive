import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

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
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })

  const { nextNonce } = await node.getAccountNextNonce(address)
  return nextNonce
}
