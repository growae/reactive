import type { Config } from '../createConfig.js'
import { BaseError } from '../errors/base.js'
import { DEFAULT_TTL } from '../constants.js'

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
  | BaseError

export class CallContractNoAccountError extends BaseError {
  override name = 'CallContractNoAccountError'
  constructor() {
    super('Cannot call contract without a connected account.')
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

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection && !txOptions.callStatic) {
    throw new CallContractNoAccountError()
  }

  const { Contract } = await import('@aeternity/aepp-sdk')
  const contractInstance = await Contract.initialize({
    onNode: node,
    ...(connection ? { onAccount: connection.account } : {}),
    aci,
    address,
  })

  const callResult = await contractInstance.$call(method, args, {
    callStatic: txOptions.callStatic ?? false,
    amount: txOptions.amount != null ? Number(txOptions.amount) : undefined,
    gasLimit: txOptions.gasLimit,
    gasPrice: txOptions.gasPrice != null ? Number(txOptions.gasPrice) : undefined,
    fee: txOptions.fee != null ? Number(txOptions.fee) : undefined,
    ttl: txOptions.ttl ?? DEFAULT_TTL,
  })

  return {
    decodedResult: callResult.decodedResult,
    hash: callResult.hash,
    rawTx: callResult.rawTx,
    result: callResult.result,
    gasUsed: callResult.result?.gasUsed,
  }
}
