import { DEFAULT_WAIT_TIMEOUT } from '../constants.js'
import type { Config } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'
import { NodeRequestError } from '../node.js'
import { waitInterval, withDeadline } from '../utils/wait.js'
import { signTransaction } from './signTransaction.js'

/** Serializable identifier. Every hash belongs to one signed AE transaction. */
export type CallGroup = { networkId: string; hashes: readonly string[] }
export type SendCallsParameters = {
  calls: readonly string[]
  networkId?: string | undefined
  atomicRequired?: boolean
}
export class CallsSubmissionError extends Error {
  constructor(
    readonly group: CallGroup,
    readonly index: number,
    cause: unknown,
  ) {
    super(
      `Submission stopped at transaction ${index + 1}. Check the recorded hashes before retrying.`,
      { cause },
    )
  }
}
export async function sendCalls(
  config: Config,
  p: SendCallsParameters,
): Promise<CallGroup> {
  if (p.atomicRequired)
    throw new Error('AE transaction groups do not provide atomic execution')
  if (!p.calls.length)
    throw new RangeError('Provide at least one unsigned transaction')
  const connection = config.state.connections.get(config.state.current ?? '')
  if (!connection) throw new Error('A connected wallet is required')
  const networkId = p.networkId ?? connection.networkId
  if (networkId !== connection.networkId)
    throw new Error('Switch the wallet to the requested network first')
  const calls = [...p.calls]
  const { tx } = await loadProtocol()
  for (const call of calls) {
    if (!call.startsWith('tx_') || tx.unpack(call)[0] === 'SignedTx')
      throw new Error('Provide unsigned tx_ transactions')
  }
  const node = config.getNodeClient({ networkId })
  const hashes: string[] = []
  for (const [index, call] of calls.entries()) {
    try {
      const active = config.state.connections.get(config.state.current ?? '')
      if (
        active?.connector.uid !== connection.connector.uid ||
        active.activeAccount !== connection.activeAccount ||
        active.networkId !== networkId
      )
        throw new Error('Wallet changed during submission')
      const signed = await signTransaction(config, {
        tx: call,
        networkId,
        connector: connection.connector,
        onAccount: connection.activeAccount,
      })
      const hash = tx.transactionHash(signed)
      // Record the hash before posting: a disconnected transport can lose the reply after acceptance.
      hashes.push(hash)
      const response = await node.postTransaction({ tx: signed })
      if (response.txHash !== hash)
        throw new Error('Node returned an unexpected transaction hash')
    } catch (error) {
      throw new CallsSubmissionError(
        { networkId, hashes: [...hashes] },
        index,
        error,
      )
    }
  }
  return { networkId, hashes }
}

export async function getCallsStatus(
  config: Config,
  { group, signal }: { group: CallGroup; signal?: AbortSignal },
) {
  const node = config.getNodeClient({ networkId: group.networkId })
  const transactions = await Promise.all(
    group.hashes.map(async (hash) => {
      try {
        const tx = await node.getTransactionByHash(hash, signal)
        return {
          hash,
          status:
            tx.blockHeight < 0 ? ('pending' as const) : ('included' as const),
          blockHeight: tx.blockHeight,
        }
      } catch (error) {
        if (error instanceof NodeRequestError && error.statusCode === 404)
          return { hash, status: 'unknown' as const, blockHeight: null }
        throw error
      }
    }),
  )
  return {
    group,
    transactions,
    included:
      transactions.length > 0 &&
      transactions.every((tx) => tx.status === 'included'),
  }
}

export type WaitForCallsParameters = {
  group: CallGroup
  interval?: number | undefined
  timeout?: number | undefined
  signal?: AbortSignal
}
export async function waitForCallsStatus(
  config: Config,
  {
    group,
    interval = 1000,
    timeout = DEFAULT_WAIT_TIMEOUT,
    signal,
  }: WaitForCallsParameters,
) {
  if (
    !group.hashes.length ||
    !Number.isFinite(interval) ||
    interval <= 0 ||
    !Number.isFinite(timeout) ||
    timeout <= 0
  )
    throw new RangeError(
      'Provide hashes and positive polling and timeout durations',
    )
  return withDeadline(
    timeout,
    signal,
    new Error('Timed out waiting for AE transaction group inclusion'),
    async (active) => {
      while (true) {
        const result = await getCallsStatus(config, { group, signal: active })
        if (result.included) return result
        await waitInterval(interval, active)
      }
    },
  )
}

export async function sendCallsSync(
  config: Config,
  p: SendCallsParameters & { timeout?: number; interval?: number },
) {
  const group = await sendCalls(config, p)
  try {
    return await waitForCallsStatus(config, {
      group,
      timeout: p.timeout,
      interval: p.interval,
    })
  } catch (error) {
    throw new CallsWaitError(group, error)
  }
}
export class CallsWaitError extends Error {
  constructor(
    readonly group: CallGroup,
    cause: unknown,
  ) {
    super('The transactions were submitted. Resume waiting with this group.', {
      cause,
    })
  }
}
