import { DEFAULT_TTL } from '../../constants.js'
import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type RespondToQueryParameters = {
  oracleId: string
  queryId: string
  response: string
  responseTtl?: { type: 'delta' | 'block'; value: number }
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type RespondToQueryReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
}

export class RespondToQueryNoAccountError extends BaseError {
  override name = 'RespondToQueryNoAccountError'
  constructor() {
    super('Cannot respond to oracle query without a connected account.')
  }
}

export async function respondToQuery(
  config: Config,
  parameters: RespondToQueryParameters,
): Promise<RespondToQueryReturnType> {
  const { queryId, response, responseTtl, ttl, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new RespondToQueryNoAccountError()
  }

  const { Oracle } = await import('@aeternity/aepp-sdk')
  const oracle = new Oracle(connection.accounts[0] as any, {
    onNode: node,
    ...(responseTtl ? { responseTtl } : {}),
  })

  const result = await oracle.respondToQuery(queryId as any, response, {
    ttl: ttl ?? DEFAULT_TTL,
  } as any)

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
