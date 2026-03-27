import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type SendTransactionParameters = {
  tx: string
  networkId?: string | undefined
  options?: {
    verify?: boolean | undefined
    waitMined?: boolean | undefined
  }
}

export type SendTransactionReturnType = {
  hash: string
  rawTx: string
}

export type SendTransactionErrorType = BaseErrorType | ErrorType

export async function sendTransaction(
  config: Config,
  parameters: SendTransactionParameters,
): Promise<SendTransactionReturnType> {
  const { tx, networkId } = parameters
  const node = config.getNodeClient({ networkId })

  const result = await node.postTransaction({ tx })

  return {
    hash: result.txHash,
    rawTx: tx,
  }
}
