import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type GetOracleQueriesParameters = {
  oracleId: string
  from?: string | undefined
  limit?: number | undefined
  type?: 'open' | 'closed' | 'all' | undefined
  networkId?: string | undefined
}

export type OracleQuery = {
  id: string
  senderId: string
  oracleId: string
  query: string
  response: string
  fee: string
  ttl: number
  responseTtl: { type: string; value: number }
}

export type GetOracleQueriesReturnType = OracleQuery[]

export type GetOracleQueriesErrorType = BaseErrorType | ErrorType

export async function getOracleQueries(
  config: Config,
  parameters: GetOracleQueriesParameters,
): Promise<GetOracleQueriesReturnType> {
  const { oracleId, from, limit, type } = parameters
  const node = config.getNodeClient({ networkId: parameters.networkId })

  const result = await node.getOracleQueriesByPubkey(oracleId, {
    from,
    limit,
    type,
  })

  return (result.oracleQueries ?? []).map((q: any) => ({
    id: q.id,
    senderId: q.senderId,
    oracleId: q.oracleId,
    query: q.query,
    response: q.response,
    fee: q.fee?.toString() ?? '0',
    ttl: q.ttl,
    responseTtl: q.responseTtl,
  }))
}
