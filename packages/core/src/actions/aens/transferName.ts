import { Name } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../../constants'
import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

export type TransferNameParameters = {
  name: string
  recipient: string
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
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
  const { name, recipient, ttl, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new TransferNameNoAccountError()
  }

  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.accounts[0] as any,
  })

  const result = await nameInstance.transfer(
    recipient as any,
    {
      ttl: ttl ?? DEFAULT_TTL,
    } as any,
  )

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
