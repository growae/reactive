import type { MutationOptions } from '@tanstack/query-core'
import {
  type ExtendOracleParameters,
  type ExtendOracleReturnType,
  extendOracle,
} from '../actions/oracle/extendOracle.js'
import type { Config } from '../createConfig.js'

export type ExtendOracleErrorType = Error

export function extendOracleMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ExtendOracleParameters) => {
      return extendOracle(config, variables)
    },
    mutationKey: ['extendOracle'],
  } satisfies MutationOptions<
    ExtendOracleReturnType,
    ExtendOracleErrorType,
    ExtendOracleParameters
  >
}

export type ExtendOracleMutationOptions = ReturnType<
  typeof extendOracleMutationOptions
>
export type ExtendOracleData = ExtendOracleReturnType
export type ExtendOracleVariables = ExtendOracleParameters
