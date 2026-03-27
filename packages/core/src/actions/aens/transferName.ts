import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type TransferNameParameters = {
  name: string
  recipient: string
  networkId?: string
}

export type TransferNameReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
}

export class TransferNameNoAccountError extends BaseError {
  override name = 'TransferNameNoAccountError'
  constructor() {
    super('Cannot transfer name without a connected account.')
  }
}

export async function transferName(
  config: Config,
  parameters: TransferNameParameters,
): Promise<TransferNameReturnType> {
  const { name, recipient, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new TransferNameNoAccountError()
  }

  const { Name } = await import('@aeternity/aepp-sdk')
  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.account,
  })

  const result = await nameInstance.transfer(recipient as any)

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
