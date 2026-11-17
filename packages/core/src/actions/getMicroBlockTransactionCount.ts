import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type GetMicroBlockTransactionCountParameters = {
  hash: string
  networkId?: string | undefined
}
export type GetMicroBlockTransactionCountReturnType = number
export type GetMicroBlockTransactionCountErrorType = BaseErrorType | ErrorType

export async function getMicroBlockTransactionCount(
  config: Config,
  { hash, networkId }: GetMicroBlockTransactionCountParameters,
): Promise<GetMicroBlockTransactionCountReturnType> {
  const node = config.getNodeClient({ networkId })
  const { count } = await node.getMicroBlockTransactionsCountByHash(hash)
  return count
}
