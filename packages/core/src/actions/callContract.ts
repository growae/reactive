import { buildTxHash, Contract, NodeInvocationError } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../constants'
import type { Config } from '../createConfig'
import { BaseError } from '../errors/base'
import type { FateMapKey } from '../utils/fateMapKeyOrder'
import {
  findMapKeyOrderDefects,
  type MapKeyOrderDefect,
} from '../utils/mapArgumentGuard'

export type CallContractParameters = {
  address: string
  aci: any
  method: string
  args?: any[]
  options?: {
    amount?: bigint
    gasLimit?: number
    gasPrice?: bigint
    fee?: bigint
    /** Transaction TTL in blocks relative to current height. Defaults to 300. */
    ttl?: number
    callStatic?: boolean
  }
  networkId?: string
}

export type CallContractReturnType = {
  decodedResult: any
  hash: string
  rawTx: string
  result?: any
  gasUsed?: number
}

export type CallContractErrorType =
  | CallContractNoAccountError
  | CallContractMapKeyOrderError
  | CallContractInvocationError
  | BaseError

export class CallContractNoAccountError extends BaseError {
  override name = 'CallContractNoAccountError'
  constructor() {
    super('Cannot call contract without a connected account.')
  }
}

function renderKey(key: FateMapKey): string {
  return typeof key === 'string' ? JSON.stringify(key) : `${key}`
}

export type CallContractMapKeyOrderErrorType = CallContractMapKeyOrderError & {
  name: 'CallContractMapKeyOrderError'
}

/**
 * Refused locally, before anything is built or posted.
 *
 * `@aeternity/aepp-calldata` sorts a `map` argument's entries itself and its
 * order is not the node's, so the node's decoder refuses the call — after the
 * transaction is mined, and after the whole gas limit has been charged for it.
 * There is no insertion order a caller can pass that avoids it, so this is not
 * a hint about how to reorder the argument: the call cannot be made until the
 * encoding is fixed upstream.
 */
export class CallContractMapKeyOrderError extends BaseError {
  override name = 'CallContractMapKeyOrderError'
  /** One entry per map argument whose keys the two implementations disagree about. */
  defects: readonly MapKeyOrderDefect[]

  constructor({
    method,
    defects,
  }: { method: string; defects: readonly MapKeyOrderDefect[] }) {
    super(
      `Contract call "${method}" would be rejected by the node: a map argument is serialised in a key order the node's decoder refuses.`,
      {
        metaMessages: [
          ...defects.flatMap((defect) => [
            `Argument "${defect.path}" — map(${defect.keyType}, _):`,
            `  the node accepts    ${defect.nodeOrder.map(renderKey).join(', ')}`,
            `  the encoder writes  ${defect.encoderOrder.map(renderKey).join(', ')}`,
          ]),
          'The encoder sorts the entries, so no insertion order avoids this. Posting it anyway would be mined, refused inside the decoder, and charged the whole gas limit.',
        ],
      },
    )
    this.defects = defects
  }
}

export type CallContractInvocationErrorType = CallContractInvocationError & {
  name: 'CallContractInvocationError'
}

/**
 * A contract call the node executed and refused.
 *
 * `@aeternity/aepp-sdk` reports this as `NodeInvocationError`, whose message is
 * the node's reason — empty on a devnet, `bad_call_data` on `ae_uat` — and
 * whose `transaction` property is set only on the static path. On the on-chain
 * path it throws with neither the reason legible nor a hash to look the call up
 * by, which is what makes the map-ordering defect above silent rather than
 * merely expensive. This carries both.
 */
export class CallContractInvocationError extends BaseError {
  override name = 'CallContractInvocationError'
  /** The node's own reason, or `undefined` when it reported none. */
  reason?: string | undefined
  /** `th_…`, when the transaction that failed is known. */
  transactionHash?: string | undefined
  /** `tx_…` — signed on the on-chain path, unsigned on the static one. */
  transaction?: string | undefined

  constructor({
    method,
    reason,
    transaction,
    transactionHash,
    cause,
  }: {
    method: string
    reason?: string | undefined
    transaction?: string | undefined
    transactionHash?: string | undefined
    cause: Error
  }) {
    super(`Contract call "${method}" was refused by the node.`, {
      cause,
      metaMessages: [
        reason ? `Reason: ${reason}` : 'The node reported no reason.',
        transactionHash
          ? `Transaction: ${transactionHash}`
          : 'No transaction hash is available for this call.',
      ],
    })
    this.reason = reason
    this.transaction = transaction
    this.transactionHash = transactionHash
  }
}

/**
 * The node's reason out of `NodeInvocationError`, which stores it nowhere but
 * its own message. Pinned to the constructor of `@aeternity/aepp-sdk` 14.1.1 by
 * `callContract.test.ts`, so a change upstream fails a test rather than
 * silently emptying the field.
 */
const INVOCATION_MESSAGE = /^Invocation failed(?:: "([\s\S]*)")?$/

function invocationReason(error: Error): string | undefined {
  const reason = INVOCATION_MESSAGE.exec(error.message)?.[1]
  return reason ? reason : undefined
}

function txHash(transaction: string | undefined): string | undefined {
  if (transaction == null) return undefined
  try {
    return buildTxHash(transaction as `tx_${string}`)
  } catch {
    return undefined
  }
}

/**
 * The account, plus the last transaction it signed.
 *
 * `NodeInvocationError.transaction` is populated only on the static path — the
 * on-chain path reads the call result back by hash inside the sdk and throws
 * without it — so the signed transaction is observed on the way past instead.
 * Reads go to the real account so that a connector holding private state is
 * unaffected.
 */
function observeSigning<account extends object>(
  account: account,
): { account: account; signed: () => string | undefined } {
  let last: string | undefined
  const proxy = new Proxy(account, {
    get(target, property) {
      const value = Reflect.get(target, property, target)
      if (property === 'signTransaction' && typeof value === 'function') {
        return async (...args: unknown[]) => {
          const signed = await value.apply(target, args)
          if (typeof signed === 'string') last = signed
          return signed
        }
      }
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
  return { account: proxy, signed: () => last }
}

export async function callContract(
  config: Config,
  parameters: CallContractParameters,
): Promise<CallContractReturnType> {
  const {
    address,
    aci,
    method,
    args = [],
    options: txOptions = {},
    networkId,
  } = parameters

  // Before the node is reached and before anything is built: a call this guard
  // refuses cannot be made, and refusing it here costs nothing.
  const defects = findMapKeyOrderDefects(aci, method, args)
  if (defects.length > 0) {
    throw new CallContractMapKeyOrderError({ method, defects })
  }

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection && !txOptions.callStatic) {
    throw new CallContractNoAccountError()
  }

  const provider = connection
    ? await connection.connector.getProvider()
    : undefined
  const signing = provider ? observeSigning(provider as object) : undefined

  const contractInstance = await Contract.initialize({
    onNode: node,
    ...(signing ? { onAccount: signing.account } : {}),
    aci,
    address: address as `ct_${string}`,
  } as any)

  let callResult: any
  try {
    callResult = await contractInstance.$call(method, args, {
      callStatic: txOptions.callStatic ?? false,
      amount: txOptions.amount != null ? Number(txOptions.amount) : undefined,
      gasLimit: txOptions.gasLimit,
      gasPrice:
        txOptions.gasPrice != null ? Number(txOptions.gasPrice) : undefined,
      fee: txOptions.fee != null ? Number(txOptions.fee) : undefined,
      ttl: txOptions.ttl ?? DEFAULT_TTL,
    } as any)
  } catch (error) {
    if (
      error instanceof NodeInvocationError ||
      (error instanceof Error && error.name === 'NodeInvocationError')
    ) {
      const transaction =
        signing?.signed() ?? (error as NodeInvocationError).transaction
      throw new CallContractInvocationError({
        method,
        reason: invocationReason(error as Error),
        transaction,
        transactionHash: txHash(transaction),
        cause: error as Error,
      })
    }
    throw error
  }

  return {
    decodedResult: callResult.decodedResult,
    hash: callResult.hash,
    rawTx: callResult.rawTx,
    result: callResult.result,
    gasUsed: callResult.result?.gasUsed,
  }
}
