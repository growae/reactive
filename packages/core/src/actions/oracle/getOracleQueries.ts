import type { Config } from '../../createConfig.js'

export type GetOracleQueriesParameters = {
  oracleId: string
  networkId?: string
}

export type OracleQueryEntry = {
  id: string
  senderId: string
  query: string
  response: string
  ttl: number
  responseTtl: { type: string; value: number }
  fee: string
}

export type GetOracleQueriesReturnType = OracleQueryEntry[]

export async function getOracleQueries(
  config: Config,
  parameters: GetOracleQueriesParameters,
): Promise<GetOracleQueriesReturnType> {
  const { oracleId, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const result = await node.getOracleQueriesByPubkey(oracleId)

  return result.oracleQueries.map((q: any) => ({
    id: q.id,
    senderId: q.senderId,
    query: q.query,
    response: q.response,
    ttl: q.ttl,
    responseTtl: q.responseTtl,
    fee: String(q.fee),
  }))
}
