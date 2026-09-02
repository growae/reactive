import { type CompilerBase, Contract } from '@aeternity/aepp-sdk'
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

/**
 * The name the constructor is written under in the ACI, and the name
 * `Contract.$deploy` hands the calldata encoder — it builds a deployment's
 * `callData` as `encode(contractName, 'init', params)` and looks the argument
 * types up under the same name. Init arguments therefore reach the encoder by
 * exactly the route a named entrypoint's arguments do, which is why the guard
 * below is the call guard with a different method name and nothing else.
 */
const INIT = 'init'

export type DeployContractParameters = {
  sourceCode?: string
  bytecode?: string
  aci?: unknown
  initArgs?: unknown[]
  onCompiler?: unknown
  options?: {
    amount?: bigint
    gasLimit?: number
    gasPrice?: bigint
    fee?: bigint
    deposit?: bigint
    /** Transaction TTL in blocks relative to current height. Defaults to 300. */
    ttl?: number
  }
  networkId?: string
}

export type DeployContractReturnType = {
  address: string
  txHash: string
  rawTx: string
  result?: any
}

export type DeployContractErrorType =
  | DeployContractNoCodeError
  | DeployContractNoAccountError
  | DeployContractMapKeyOrderError
  | DeployContractInvocationError
  | BaseError

export class DeployContractNoCodeError extends BaseError {
  override name = 'DeployContractNoCodeError'
  constructor() {
    super('Cannot deploy contract without sourceCode or bytecode.')
  }
}

export class DeployContractNoAccountError extends BaseError {
  override name = 'DeployContractNoAccountError'
  constructor() {
    super('Cannot deploy contract without a connected account.')
  }
}

export type DeployContractMapKeyOrderErrorType =
  DeployContractMapKeyOrderError & {
    name: 'DeployContractMapKeyOrderError'
  }

/**
 * Refused locally, before anything is built or posted.
 *
 * The same defect `CallContractMapKeyOrderError` names, on the deployment path:
 * `@aeternity/aepp-calldata` sorts a `map` argument's entries itself and its
 * order is not the node's, so the node's decoder refuses the init call. There
 * is no insertion order a caller can pass that avoids it, so this is not a hint
 * about how to reorder the argument.
 *
 * **What the node does with it is not what it does with a call, and the
 * difference is measured, not reasoned.** A `ContractCallTx` carrying a
 * disagreeing map is mined, refused inside the decoder, and charged the whole
 * gas limit. A `ContractCreateTx` carrying one in its init arguments is
 * accepted into the mempool and then never included: no gas is charged, the
 * caller's nonce does not advance, the node logs nothing, and the deployment
 * fails only when the sdk gives up polling for a transaction the node answers
 * `404` for. Both halves are posted against the same node v7.2.0 in
 * `test/integration/mapKeyOrderDeploy.integration.test.ts`.
 *
 * So this guard buys legibility rather than gas: without it a deployment
 * disappears, and the error names a transaction hash the node denies having.
 */
export class DeployContractMapKeyOrderError extends BaseError {
  override name = 'DeployContractMapKeyOrderError'
  /** One entry per init argument whose keys the two implementations disagree about. */
  defects: readonly MapKeyOrderDefect[]

  constructor({ defects }: { defects: readonly MapKeyOrderDefect[] }) {
    super(
      "Contract deployment would be rejected by the node: a map init argument is serialised in a key order the node's decoder refuses.",
      {
        metaMessages: [
          ...describeMapKeyOrderDefects(defects),
          'The encoder sorts the entries, so no insertion order avoids this. Deploying it anyway would post a transaction the node accepts into its mempool and then never includes: no contract, no gas charged, and a failure that names a transaction hash the node answers 404 for.',
        ],
      },
    )
    this.defects = defects
  }
}

export type DeployContractInvocationErrorType =
  DeployContractInvocationError & {
    name: 'DeployContractInvocationError'
  }

/**
 * A deployment the node executed and refused.
 *
 * `Contract.$deploy` runs the contract's `init` on chain like any other call
 * and reports a refusal the same way `$call` does — as a `NodeInvocationError`
 * carrying the node's reason only inside its message, and, on the on-chain
 * path, no transaction at all. This carries the reason and a hash, so an `init`
 * that aborted is a deployment the caller can actually look up.
 *
 * It is **not** what the map-ordering defect above reaches. That transaction is
 * never included, so there is no call result for the sdk to read and no
 * `NodeInvocationError` to wrap; the sdk fails polling for it instead. The two
 * failures are different and are named differently on purpose.
 */
export class DeployContractInvocationError extends BaseError {
  override name = 'DeployContractInvocationError'
  /** The node's own reason, or `undefined` when it reported none. */
  reason?: string | undefined
  /** `th_…`, when the transaction that failed is known. */
  transactionHash?: string | undefined
  /** `tx_…` — signed on the on-chain path, unsigned on the dry run behind the gas estimate. */
  transaction?: string | undefined

  constructor({
    reason,
    transaction,
    transactionHash,
    cause,
  }: {
    reason?: string | undefined
    transaction?: string | undefined
    transactionHash?: string | undefined
    cause: Error
  }) {
    super('Contract deployment was refused by the node.', {
      cause,
      metaMessages: [
        reason ? `Reason: ${reason}` : 'The node reported no reason.',
        transactionHash
          ? `Transaction: ${transactionHash}`
          : 'No transaction hash is available for this deployment.',
      ],
    })
    this.reason = reason
    this.transaction = transaction
    this.transactionHash = transactionHash
  }
}

export async function deployContract(
  config: Config,
  parameters: DeployContractParameters,
): Promise<DeployContractReturnType> {
  const {
    sourceCode,
    bytecode,
    aci,
    onCompiler,
    initArgs = [],
    options: txOptions = {},
    networkId,
  } = parameters

  if (!sourceCode && !bytecode) {
    throw new DeployContractNoCodeError()
  }

  // Before the node is reached and before anything is built: a deployment this
  // guard refuses cannot be made, and refusing it here costs nothing. It is a
  // miss rather than a refusal when `aci` is absent — a source-only deployment
  // has the sdk compile one, and there is nothing here to read the init
  // argument types off; a miss costs today's behaviour, and guessing at the
  // types would risk refusing a deployment the node accepts.
  const defects = findMapKeyOrderDefects(aci, INIT, initArgs)
  if (defects.length > 0) {
    throw new DeployContractMapKeyOrderError({ defects })
  }

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new DeployContractNoAccountError()
  }

  const node = config.getNodeClient({ networkId })
  const signing = observeSigning(
    (await connection.connector.getProvider()) as object,
  )

  const contractInstance = await Contract.initialize({
    onNode: node,
    onAccount: signing.account,
    ...(sourceCode ? { sourceCode } : {}),
    ...(bytecode ? { bytecode: bytecode as `cb_${string}` } : {}),
    ...(aci ? { aci } : {}),
    ...(onCompiler ? { onCompiler: onCompiler as CompilerBase } : {}),
  } as any)

  let deployResult: Awaited<ReturnType<typeof contractInstance.$deploy>>
  try {
    deployResult = await contractInstance.$deploy(
      initArgs as any,
      {
        amount: txOptions.amount != null ? Number(txOptions.amount) : undefined,
        gasLimit: txOptions.gasLimit,
        gasPrice:
          txOptions.gasPrice != null ? Number(txOptions.gasPrice) : undefined,
        fee: txOptions.fee != null ? Number(txOptions.fee) : undefined,
        deposit:
          txOptions.deposit != null ? Number(txOptions.deposit) : undefined,
        ttl: txOptions.ttl ?? DEFAULT_TTL,
      } as Parameters<typeof contractInstance.$deploy>[1],
    )
  } catch (error) {
    if (isNodeInvocationError(error)) {
      const transaction = signing.signed() ?? error.transaction
      throw new DeployContractInvocationError({
        reason: invocationReason(error),
        transaction,
        transactionHash: transactionHashOf(transaction),
        cause: error,
      })
    }
    throw error
  }

  return {
    address: (deployResult.address as string) ?? '',
    txHash: (deployResult.transaction as string) ?? '',
    rawTx: deployResult.rawTx as string,
    result: deployResult.result,
  }
}
