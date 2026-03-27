import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type GetTransactionParameters = {
  hash: string
  networkId?: string | undefined
}

export type GetTransactionReturnType = {
  hash: string
  blockHash: string
  blockHeight: number
  tx: Record<string, any>
  signatures: string[]
}

export type GetTransactionErrorType = BaseErrorType | ErrorType

export async function getTransaction(
  config: Config,
  parameters: GetTransactionParameters,
): Promise<GetTransactionReturnType> {
  const { hash } = parameters
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })

  const result = await node.getTransactionByHash(hash)

  return {
    hash: result.hash,
    blockHash: result.blockHash,
    blockHeight: result.blockHeight,
    tx: result.tx as Record<string, any>,
    signatures: result.signatures ?? [],
  }
}
