import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type PreclaimNameParameters = {
  name: string
  networkId?: string
}

export type PreclaimNameReturnType = {
  txHash: string
  salt: number
  commitmentId: string
  rawTx: string
}

export class PreclaimNameNoAccountError extends BaseError {
  override name = 'PreclaimNameNoAccountError'
  constructor() {
    super('Cannot preclaim name without a connected account.')
  }
}

export async function preclaimName(
  config: Config,
  parameters: PreclaimNameParameters,
): Promise<PreclaimNameReturnType> {
  const { name, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new PreclaimNameNoAccountError()
  }

  const { Name } = await import('@aeternity/aepp-sdk')
  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.account,
  })

  const result = await nameInstance.preclaim()

  return {
    txHash: result.hash,
    salt: result.nameSalt,
    commitmentId: result.blockHash ?? '',
    rawTx: result.rawTx,
  }
}
