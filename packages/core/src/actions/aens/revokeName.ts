import { DEFAULT_TTL } from '../../constants.js'
import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

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

  const { Name } = await import('@aeternity/aepp-sdk')
  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.accounts[0] as any,
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
