import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type QueryOracleParameters = {
  oracleId: string
  query: string
  queryFee?: bigint
  queryTtl?: { type: 'delta' | 'block'; value: number }
  responseTtl?: { type: 'delta' | 'block'; value: number }
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
  const { oracleId, query, queryFee, queryTtl, responseTtl, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new QueryOracleNoAccountError()
  }

  const { OracleClient } = await import('@aeternity/aepp-sdk')
  const oracleClient = new OracleClient(oracleId as any, {
    onNode: node,
    onAccount: connection.account,
    ...(queryFee != null ? { queryFee: Number(queryFee) } : {}),
    ...(queryTtl ? { queryTtl } : {}),
    ...(responseTtl ? { responseTtl } : {}),
  })

  const result = await oracleClient.postQuery(query)

  return {
    queryId: result.queryId,
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
