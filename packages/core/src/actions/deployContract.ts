import { type CompilerBase, Contract } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../constants'
import type { Config } from '../createConfig'
import { BaseError } from '../errors/base'

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

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new DeployContractNoAccountError()
  }

  const node = config.getNodeClient({ networkId })

  const contractInstance = await Contract.initialize({
    onNode: node,
    onAccount: connection.activeAccount as `ak_${string}`,
    ...(sourceCode ? { sourceCode } : {}),
    ...(bytecode ? { bytecode: bytecode as `cb_${string}` } : {}),
    ...(aci ? { aci } : {}),
    ...(onCompiler ? { onCompiler: onCompiler as CompilerBase } : {}),
  } as any)

  const deployResult = await contractInstance.$deploy(
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

  return {
    address: (deployResult.address as string) ?? '',
    txHash: (deployResult.transaction as string) ?? '',
    rawTx: deployResult.rawTx as string,
    result: deployResult.result,
  }
}
