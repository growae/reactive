import { DEFAULT_TTL } from '../../constants.js'
import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type BidNameParameters = {
  name: string
  nameFee: bigint | string
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type BidNameReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
}

export class BidNameNoAccountError extends BaseError {
  override name = 'BidNameNoAccountError'
  constructor() {
    super('Cannot bid on name without a connected account.')
  }
}

export async function bidName(
  config: Config,
  parameters: BidNameParameters,
): Promise<BidNameReturnType> {
  const { name, nameFee, ttl, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new BidNameNoAccountError()
  }

  const { Name } = await import('@aeternity/aepp-sdk')
  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.accounts[0] as any,
  })

  const result = await nameInstance.bid(nameFee.toString(), {
    ttl: ttl ?? DEFAULT_TTL,
  } as any)

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
