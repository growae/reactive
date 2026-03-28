import { createGeneralizedAccount as sdkCreateGeneralizedAccount } from '@aeternity/aepp-sdk'
import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

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
  const { authFnName, args, sourceCode, bytecode, aci, onCompiler, networkId } =
    parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new CreateGANoAccountError()
  }

  if (!sourceCode && !bytecode) {
    throw new CreateGANoCodeError()
  }

  const node = config.getNodeClient({ networkId })

  const result = await sdkCreateGeneralizedAccount(
    authFnName,
    args as any[],
    {
      onNode: node,
      onAccount: connection.activeAccount as `ak_${string}`,
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
