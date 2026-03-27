import { DEFAULT_TTL } from '../../constants.js'
import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type QueryOracleParameters = {
  oracleId: string
  query: string
  queryFee?: bigint
  queryTtl?: { type: 'delta' | 'block'; value: number }
  responseTtl?: { type: 'delta' | 'block'; value: number }
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type QueryOracleReturnType = {
  queryId: string
  txHash: string
  rawTx: string
  blockHeight?: number
}

export class QueryOracleNoAccountError extends BaseError {
  override name = 'QueryOracleNoAccountError'
  constructor() {
    super('Cannot query oracle without a connected account.')
  }
}

export async function queryOracle(
  config: Config,
  parameters: QueryOracleParameters,
): Promise<QueryOracleReturnType> {
  const { oracleId, query, queryFee, queryTtl, responseTtl, ttl, networkId } =
    parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new QueryOracleNoAccountError()
  }

  const { OracleClient } = await import('@aeternity/aepp-sdk')
  const oracleClient = new OracleClient(oracleId as any, {
    onNode: node,
    onAccount: connection.accounts[0] as any,
    ...(queryFee != null ? { queryFee: Number(queryFee) } : {}),
    ...(queryTtl ? { queryTtl } : {}),
    ...(responseTtl ? { responseTtl } : {}),
  })

  const result = await oracleClient.postQuery(query, {
    ttl: ttl ?? DEFAULT_TTL,
  } as any)

  return {
    queryId: result.queryId,
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
