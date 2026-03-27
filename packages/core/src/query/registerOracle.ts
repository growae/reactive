import type { MutationOptions } from '@tanstack/query-core'
import {
  type RegisterOracleParameters,
  type RegisterOracleReturnType,
  registerOracle,
} from '../actions/oracle/registerOracle.js'
import type { Config } from '../createConfig.js'

export type RegisterOracleErrorType = Error

export function registerOracleMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: RegisterOracleParameters) => {
      return registerOracle(config, variables)
    },
    mutationKey: ['registerOracle'],
  } satisfies MutationOptions<RegisterOracleReturnType, RegisterOracleErrorType, RegisterOracleParameters>
}

export type RegisterOracleMutationOptions = ReturnType<typeof registerOracleMutationOptions>
export type RegisterOracleData = RegisterOracleReturnType
export type RegisterOracleVariables = RegisterOracleParameters
