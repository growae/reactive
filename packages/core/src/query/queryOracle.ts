import type { MutationOptions } from '@tanstack/query-core'
import {
  type QueryOracleParameters,
  type QueryOracleReturnType,
  queryOracle,
} from '../actions/oracle/queryOracle.js'
import type { Config } from '../createConfig.js'

export type QueryOracleErrorType = Error

export function queryOracleMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: QueryOracleParameters) => {
      return queryOracle(config, variables)
    },
    mutationKey: ['queryOracle'],
  } satisfies MutationOptions<QueryOracleReturnType, QueryOracleErrorType, QueryOracleParameters>
}

export type QueryOracleMutationOptions = ReturnType<typeof queryOracleMutationOptions>
export type QueryOracleData = QueryOracleReturnType
export type QueryOracleVariables = QueryOracleParameters
