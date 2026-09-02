import { Contract } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../constants'
import type { Config } from '../createConfig'
import { BaseError } from '../errors/base'
import {
  describeMapKeyOrderDefects,
  findMapKeyOrderDefects,
  type MapKeyOrderDefect,
} from '../utils/mapArgumentGuard'
import {
  invocationReason,
  isNodeInvocationError,
  observeSigning,
  transactionHashOf,
} from '../utils/nodeInvocation'

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
          ...describeMapKeyOrderDefects(defects),
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
    if (isNodeInvocationError(error)) {
      const transaction = signing?.signed() ?? error.transaction
      throw new CallContractInvocationError({
        method,
        reason: invocationReason(error),
        transaction,
        transactionHash: transactionHashOf(transaction),
        cause: error,
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
