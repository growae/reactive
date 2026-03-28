import { Name, produceNameId } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../../constants'
import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

export type ClaimNameParameters = {
  name: string
  salt?: number
  nameFee?: bigint | string
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
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
  const { name, salt: _salt, nameFee, ttl, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new ClaimNameNoAccountError()
  }

  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.activeAccount as any,
  })

  const result = await nameInstance.claim({
    ...(nameFee != null ? { nameFee: nameFee.toString() } : {}),
    ttl: ttl ?? DEFAULT_TTL,
  } as any)

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
    nameId: produceNameId(name as `${string}.chain`),
  }
}
