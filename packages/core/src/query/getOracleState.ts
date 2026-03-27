import {
  type GetOracleStateErrorType,
  type GetOracleStateParameters,
  type GetOracleStateReturnType,
  getOracleState,
} from '../actions/getOracleState.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type GetOracleStateOptions = ExactPartial<GetOracleStateParameters>

export function getOracleStateQueryKey(params: GetOracleStateOptions = {}) {
  return ['getOracleState', params] as const
}

export type GetOracleStateQueryKey = ReturnType<typeof getOracleStateQueryKey>

export function getOracleStateQueryOptions(
  config: Config,
  params: GetOracleStateOptions = {},
) {
  return {
    enabled: Boolean(params.oracleId),
    queryFn: async () => {
      if (!params.oracleId) throw new Error('oracleId is required')
      return getOracleState(config, params as GetOracleStateParameters)
    },
    queryKey: getOracleStateQueryKey(params),
  }
}

export type GetOracleStateQueryFnData = GetOracleStateReturnType
export type GetOracleStateData = GetOracleStateQueryFnData
export { type GetOracleStateErrorType }
