import { DEFAULT_WAIT_TIMEOUT } from '../constants.js'
import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import { waitForTransaction } from './waitForTransaction.js'

export type SendTransactionParameters = {
  tx: string
  networkId?: string | undefined
  /**
   * Wait for the transaction to be mined before resolving. Defaults to
   * `false`: this action posts and returns a hash. When `true`, the result
   * also carries `blockHash`, `blockHeight` and `tx`.
   */
  waitMined?: boolean | undefined
  /**
   * Upper bound in milliseconds on the `waitMined` wait. Defaults to
   * `DEFAULT_WAIT_TIMEOUT` (20 minutes). Ignored when `waitMined` is not set.
   */
  timeout?: number | undefined
}

export type SendTransactionReturnType = {
  hash: string
  rawTx: string
  blockHash?: string
  blockHeight?: number
  tx?: Record<string, any>
}

export type SendTransactionErrorType = BaseErrorType | ErrorType

export async function sendTransaction(
  config: Config,
  parameters: SendTransactionParameters,
): Promise<SendTransactionReturnType> {
  const { tx, networkId, waitMined = false, timeout } = parameters
  const node = config.getNodeClient({ networkId })

  const result = await node.postTransaction({ tx })

  if (!waitMined) {
    return {
      hash: result.txHash,
      rawTx: tx,
    }
  }

  const mined = await waitForTransaction(config, {
    hash: result.txHash,
    networkId,
    timeout: timeout ?? DEFAULT_WAIT_TIMEOUT,
  })

  return {
    hash: result.txHash,
    rawTx: tx,
    blockHash: mined.blockHash,
    blockHeight: mined.blockHeight,
    tx: mined.tx,
  }
}
