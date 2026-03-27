import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type RevokeNameParameters = {
  name: string
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
  const { name, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new RevokeNameNoAccountError()
  }

  const { Name } = await import('@aeternity/aepp-sdk')
  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.account,
  })

  const result = await nameInstance.revoke()

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
