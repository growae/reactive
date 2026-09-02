import { Contract } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import { BaseError } from '../errors/base'
import {
  describeMapKeyOrderDefects,
  findMapKeyOrderDefects,
  type MapKeyOrderDefect,
} from '../utils/mapArgumentGuard'
import type { CallContractParameters } from './callContract'

export type SimulateContractParameters = Omit<
  CallContractParameters,
  'options'
> & {
  options?: Omit<NonNullable<CallContractParameters['options']>, 'callStatic'>
}

export type SimulateContractReturnType = {
  decodedResult: any
  gasUsed: number
  returnType: string
  returnValue: string
  rawTx: string
  hash: string
}

export type SimulateContractErrorType =
  | SimulateContractMapKeyOrderError
  | BaseError

export type SimulateContractMapKeyOrderErrorType =
  SimulateContractMapKeyOrderError & {
    name: 'SimulateContractMapKeyOrderError'
  }

/**
 * Refused locally, before anything is built or sent.
 *
 * The same defect `CallContractMapKeyOrderError` names, on the simulation path:
 * `@aeternity/aepp-calldata` sorts a `map` argument's entries itself and its
 * order is not the node's, so the node's decoder refuses the call. There is no
 * insertion order a caller can pass that avoids it, so this is not a hint about
 * how to reorder the argument.
 *
 * It is its own class rather than `CallContractMapKeyOrderError` because a
 * caller who invoked `simulateContract` should not read a "CallContract" name
 * off the refusal — `readContract` inherits that wrinkle from delegating, and
 * it is not one to spread deliberately.
 *
 * A `callStatic` call is a dry-run: nothing is posted, no gas is charged, and
 * nothing to look up afterwards. So, as on the deployment path, this guard buys
 * legibility rather than gas — without it the caller gets a decoder error out
 * of the node in place of the entrypoint's result, and nothing that names which
 * argument caused it.
 */
export class SimulateContractMapKeyOrderError extends BaseError {
  override name = 'SimulateContractMapKeyOrderError'
  /** One entry per map argument whose keys the two implementations disagree about. */
  defects: readonly MapKeyOrderDefect[]

  constructor({
    method,
    defects,
  }: { method: string; defects: readonly MapKeyOrderDefect[] }) {
    super(
      `Contract simulation "${method}" would be rejected by the node: a map argument is serialised in a key order the node's decoder refuses.`,
      {
        metaMessages: [
          ...describeMapKeyOrderDefects(defects),
          "The encoder sorts the entries, so no insertion order avoids this. Simulating it anyway posts nothing and charges nothing, but the node answers with a decoder error instead of the entrypoint's result.",
        ],
      },
    )
    this.defects = defects
  }
}

export async function simulateContract(
  config: Config,
  parameters: SimulateContractParameters,
): Promise<SimulateContractReturnType> {
  const {
    address,
    aci,
    method,
    args = [],
    options: txOptions = {},
    networkId,
  } = parameters

  // Before the node is reached and before anything is built: a simulation this
  // guard refuses cannot return the entrypoint's result, and refusing it here
  // says which argument is at fault where the node's decoder error does not.
  const defects = findMapKeyOrderDefects(aci, method, args)
  if (defects.length > 0) {
    throw new SimulateContractMapKeyOrderError({ method, defects })
  }

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)

  const contractInstance = await Contract.initialize({
    onNode: node,
    ...(connection
      ? { onAccount: connection.activeAccount as `ak_${string}` }
      : {}),
    aci,
    address: address as `ct_${string}`,
  } as any)

  const result = await contractInstance.$call(method, args, {
    callStatic: true,
    amount: txOptions.amount != null ? Number(txOptions.amount) : undefined,
    gasLimit: txOptions.gasLimit,
    gasPrice:
      txOptions.gasPrice != null ? Number(txOptions.gasPrice) : undefined,
    fee: txOptions.fee != null ? Number(txOptions.fee) : undefined,
  } as any)

  return {
    decodedResult: result.decodedResult,
    gasUsed: result.result?.gasUsed ?? 0,
    returnType: result.result?.returnType ?? '',
    returnValue: result.result?.returnValue ?? '',
    rawTx: result.rawTx,
    hash: result.hash,
  }
}
