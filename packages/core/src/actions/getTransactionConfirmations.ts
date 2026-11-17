import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type GetTransactionConfirmationsParameters = {
  hash: string
  networkId?: string | undefined
}
export type GetTransactionConfirmationsReturnType = number
export type GetTransactionConfirmationsErrorType = BaseErrorType | ErrorType

export async function getTransactionConfirmations(
  config: Config,
  { hash, networkId }: GetTransactionConfirmationsParameters,
): Promise<GetTransactionConfirmationsReturnType> {
  const node = config.getNodeClient({ networkId })
  const { blockHeight } = await node.getTransactionByHash(hash)
  if (blockHeight < 0) return 0
  const { height } = await node.getCurrentKeyBlockHeight()
  return Math.max(0, height - blockHeight + 1)
}
