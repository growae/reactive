import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type CreateGeneralizedAccountParameters = {
  authFnName: string
  args: unknown[]
  sourceCode?: string
  bytecode?: string
  aci?: unknown
  onCompiler?: unknown
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type CreateGeneralizedAccountReturnType = {
  owner: string
  txHash: string
  rawTx: string
  gaContractId: string
}

export class CreateGANoAccountError extends BaseError {
  override name = 'CreateGANoAccountError'
  constructor() {
    super('Cannot create generalized account without a connected account.')
  }
}

export class CreateGANoCodeError extends BaseError {
  override name = 'CreateGANoCodeError'
  constructor() {
    super('Cannot create generalized account without sourceCode or bytecode.')
  }
}

export async function createGeneralizedAccount(
  config: Config,
  parameters: CreateGeneralizedAccountParameters,
): Promise<CreateGeneralizedAccountReturnType> {
  const {
    authFnName,
    args,
    sourceCode,
    bytecode,
    aci,
    onCompiler,
    networkId,
  } = parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new CreateGANoAccountError()
  }

  if (!sourceCode && !bytecode) {
    throw new CreateGANoCodeError()
  }

  const node = config.getNodeClient({ networkId })

  const sdk = await import('@aeternity/aepp-sdk')
  const result = await sdk.createGeneralizedAccount(
    authFnName,
    args as any[],
    {
      onNode: node,
      onAccount: connection.accounts[0] as `ak_${string}`,
      onCompiler: onCompiler as import('@aeternity/aepp-sdk').CompilerBase,
      ...(sourceCode ? { sourceCode } : {}),
      ...(bytecode ? { bytecode: bytecode as `cb_${string}` } : {}),
      ...(aci ? { aci } : {}),
    } as any,
  )

  return {
    owner: result.owner,
    txHash: result.transaction,
    rawTx: result.rawTx,
    gaContractId: result.gaContractId,
  }
}
