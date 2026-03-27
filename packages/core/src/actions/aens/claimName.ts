import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type ClaimNameParameters = {
  name: string
  salt?: number
  nameFee?: bigint | string
  networkId?: string
}

export type ClaimNameReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
  nameId: string
}

export class ClaimNameNoAccountError extends BaseError {
  override name = 'ClaimNameNoAccountError'
  constructor() {
    super('Cannot claim name without a connected account.')
  }
}

export async function claimName(
  config: Config,
  parameters: ClaimNameParameters,
): Promise<ClaimNameReturnType> {
  const { name, salt: _salt, nameFee, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new ClaimNameNoAccountError()
  }

  const { Name, produceNameId } = await import('@aeternity/aepp-sdk')
  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.account,
  })

  const result = await nameInstance.claim({
    ...(nameFee != null ? { nameFee: nameFee.toString() } : {}),
  })

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
    nameId: produceNameId(name),
  }
}
