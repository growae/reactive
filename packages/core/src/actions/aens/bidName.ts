import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type BidNameParameters = {
  name: string
  nameFee: bigint | string
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
  const { name, nameFee, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new BidNameNoAccountError()
  }

  const { Name } = await import('@aeternity/aepp-sdk')
  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.account,
  })

  const result = await nameInstance.bid(nameFee.toString())

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
