import { ensureName, Name } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../../constants.js'
import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'
import { connectorAccount } from '../../utils/connectorAccount.js'

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

  ensureName(name)

  const nameInstance = new Name(name, {
    onNode: node,
    onAccount: connectorAccount(connection),
  })

  // `ttl` reaches the transaction builder and the NameRevokeTx schema at
  // runtime, but not through the published type: the sdk derives its name
  // option types with `Omit` over the `TxParamsAsync` union, and `Omit` on a
  // union keeps only the keys every member shares, which `ttl` is not. The cast
  // is narrowed to that one option type rather than `any`.
  const result = await nameInstance.revoke({
    ttl: ttl ?? DEFAULT_TTL,
  } as Parameters<Name['revoke']>[0])

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
