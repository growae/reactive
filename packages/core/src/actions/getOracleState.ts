import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type GetOracleStateParameters = {
  oracleId: string
  networkId?: string | undefined
}

export type GetOracleStateReturnType = {
  id: string
  queryFormat: string
  responseFormat: string
  queryFee: string
  ttl: number
  abiVersion: number
}

export type GetOracleStateErrorType = BaseErrorType | ErrorType

export async function getOracleState(
  config: Config,
  parameters: GetOracleStateParameters,
): Promise<GetOracleStateReturnType> {
  const { oracleId } = parameters
  const node = config.getNodeClient({ networkId: parameters.networkId })

  const oracle = await node.getOracleByPubkey(oracleId)

  return {
    id: oracle.id,
    queryFormat: oracle.queryFormat,
    responseFormat: oracle.responseFormat,
    queryFee: oracle.queryFee.toString(),
    ttl: oracle.ttl,
    abiVersion: oracle.abiVersion,
  }
}
