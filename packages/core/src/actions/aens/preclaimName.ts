import { DEFAULT_TTL } from '../../constants.js'
import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type PreclaimNameParameters = {
  name: string
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
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
  const { name, ttl, networkId } = parameters

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

  const result = await nameInstance.preclaim({ ttl: ttl ?? DEFAULT_TTL })

  return {
    txHash: result.hash,
    salt: result.nameSalt,
    commitmentId: result.blockHash ?? '',
    rawTx: result.rawTx,
  }
}
