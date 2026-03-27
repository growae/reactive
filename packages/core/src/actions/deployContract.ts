import type { Config } from '../createConfig.js'
import { BaseError } from '../errors/base.js'

export type DeployContractParameters = {
  sourceCode?: string
  bytecode?: string
  aci?: any
  initArgs?: any[]
  options?: {
    amount?: bigint
    gasLimit?: number
    gasPrice?: bigint
    fee?: bigint
    deposit?: bigint
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
    initArgs = [],
    options: txOptions = {},
    networkId,
  } = parameters

  if (!sourceCode && !bytecode) {
    throw new DeployContractNoCodeError()
  }

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new DeployContractNoAccountError()
  }

  const { Contract } = await import('@aeternity/aepp-sdk')
  const contractInstance = await Contract.initialize({
    onNode: node,
    onAccount: connection.account,
    ...(sourceCode ? { sourceCode } : {}),
    ...(bytecode ? { bytecode } : {}),
    ...(aci ? { aci } : {}),
    ...(config.state.compilerUrl
      ? { onCompiler: config.getCompiler() }
      : {}),
  })

  const deployResult = await contractInstance.$deploy(initArgs, {
    amount: txOptions.amount != null ? Number(txOptions.amount) : undefined,
    gasLimit: txOptions.gasLimit,
    gasPrice: txOptions.gasPrice != null ? Number(txOptions.gasPrice) : undefined,
    fee: txOptions.fee != null ? Number(txOptions.fee) : undefined,
    deposit: txOptions.deposit != null ? Number(txOptions.deposit) : undefined,
  })

  return {
    address: deployResult.address ?? '',
    txHash: deployResult.transaction ?? '',
    rawTx: deployResult.rawTx,
    result: deployResult.result,
  }
}
