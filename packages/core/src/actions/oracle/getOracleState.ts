import type { Config } from '../../createConfig.js'

export type GetOracleStateParameters = {
  oracleId: string
  networkId?: string
}

export type GetOracleStateReturnType = {
  id: string
  queryFormat: string
  responseFormat: string
  queryFee: string
  ttl: number
  abiVersion: number
}

export async function getOracleState(
  config: Config,
  parameters: GetOracleStateParameters,
): Promise<GetOracleStateReturnType> {
  const { oracleId, networkId } = parameters

  const node = config.getNode({ networkId })
  const result = await node.getOracleByPubkey(oracleId)

  return {
    id: result.id,
    queryFormat: result.queryFormat,
    responseFormat: result.responseFormat,
    queryFee: String(result.queryFee),
    ttl: result.ttl,
    abiVersion: result.abiVersion,
  }
}
