import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type CreateGeneralizedAccountParameters = {
  authFnName: string
  args: any[]
  sourceCode?: string
  bytecode?: string
  aci?: any
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
  const { authFnName, args, sourceCode, bytecode, aci, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new CreateGANoAccountError()
  }

  if (!sourceCode && !bytecode) {
    throw new CreateGANoCodeError()
  }

  const sdk = await import('@aeternity/aepp-sdk')
  const result = await sdk.createGeneralizedAccount(authFnName, args, {
    onNode: node,
    onAccount: connection.account,
    onCompiler: config.getCompiler(),
    ...(sourceCode ? { sourceCode } : {}),
    ...(bytecode ? { bytecode } : {}),
    ...(aci ? { aci } : {}),
  })

  return {
    owner: result.owner,
    txHash: result.transaction,
    rawTx: result.rawTx,
    gaContractId: result.gaContractId,
  }
}
