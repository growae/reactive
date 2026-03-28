import { Name } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../../constants'
import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

export type RevokeNameParameters = {
  name: string
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type RevokeNameReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
}

export class RevokeNameNoAccountError extends BaseError {
  override name = 'RevokeNameNoAccountError'
  constructor() {
    super('Cannot revoke name without a connected account.')
  }
}

export async function revokeName(
  config: Config,
  parameters: RevokeNameParameters,
): Promise<RevokeNameReturnType> {
  const { name, ttl, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new RevokeNameNoAccountError()
  }

  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.activeAccount as any,
  })

  const result = await nameInstance.revoke({
    ttl: ttl ?? DEFAULT_TTL,
  } as any)

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
