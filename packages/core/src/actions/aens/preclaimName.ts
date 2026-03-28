import { Name } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../../constants'
import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

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

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new PreclaimNameNoAccountError()
  }

  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.activeAccount as any,
  })

  const result = await nameInstance.preclaim({
    ttl: ttl ?? DEFAULT_TTL,
  } as any)

  return {
    txHash: result.hash,
    salt: result.nameSalt,
    commitmentId: result.blockHash ?? '',
    rawTx: result.rawTx,
  }
}
