import { Oracle } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../../constants'
import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

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

  const oracle = new Oracle(connection.activeAccount as any, {
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
