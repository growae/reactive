import {
  type GetOracleQueriesErrorType,
  type GetOracleQueriesParameters,
  type GetOracleQueriesReturnType,
  getOracleQueries,
} from '../actions/getOracleQueries.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type GetOracleQueriesOptions = ExactPartial<GetOracleQueriesParameters>

export function getOracleQueriesQueryKey(params: GetOracleQueriesOptions = {}) {
  return ['getOracleQueries', params] as const
}

export type GetOracleQueriesQueryKey = ReturnType<
  typeof getOracleQueriesQueryKey
>

export function getOracleQueriesQueryOptions(
  config: Config,
  params: GetOracleQueriesOptions = {},
) {
  return {
    enabled: Boolean(params.oracleId),
    queryFn: async () => {
      if (!params.oracleId) throw new Error('oracleId is required')
      return getOracleQueries(config, params as GetOracleQueriesParameters)
    },
    queryKey: getOracleQueriesQueryKey(params),
  }
}

export type GetOracleQueriesQueryFnData = GetOracleQueriesReturnType
export type GetOracleQueriesData = GetOracleQueriesQueryFnData
export type { GetOracleQueriesErrorType }
