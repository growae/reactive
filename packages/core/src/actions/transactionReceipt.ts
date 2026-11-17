import { DEFAULT_WAIT_TIMEOUT } from '../constants.js'
import type { Config } from '../createConfig.js'
import { withDeadline } from '../utils/wait.js'
import type { WaitForTransactionParameters } from './waitForTransaction.js'
import { waitForTransaction } from './waitForTransaction.js'

type Inclusion = {
  hash: string
  blockHash: string
  blockHeight: number
  tx: Record<string, unknown>
}
async function receipt(
  config: Config,
  networkId: string,
  transaction: Inclusion,
  signal?: AbortSignal,
) {
  const type = transaction.tx.type
  const execution =
    type === 'ContractCallTx' ||
    type === 'ContractCreateTx' ||
    type === 'GAMetaTx'
      ? await config
          .getNodeClient({ networkId })
          .getTransactionInfo(transaction.hash, signal)
      : null
  return { ...transaction, execution }
}

export async function getTransactionReceipt(
  config: Config,
  parameters: {
    hash: string
    networkId?: string | undefined
    signal?: AbortSignal | undefined
  },
) {
  const networkId = parameters.networkId ?? config.state.networkId
  const transaction = await config
    .getNodeClient({ networkId })
    .getTransactionByHash(parameters.hash, parameters.signal)
  return transaction.blockHeight < 0
    ? null
    : receipt(config, networkId, transaction, parameters.signal)
}

export async function waitForTransactionReceipt(
  config: Config,
  parameters: WaitForTransactionParameters,
) {
  const networkId = parameters.networkId ?? config.state.networkId
  const timeout = parameters.timeout ?? DEFAULT_WAIT_TIMEOUT
  return withDeadline(
    timeout,
    parameters.signal,
    new Error(`Receipt for ${parameters.hash} timed out`),
    async (signal) => {
      const mined = await waitForTransaction(config, {
        ...parameters,
        networkId,
        signal,
      })
      return receipt(config, networkId, mined, signal)
    },
  )
}
