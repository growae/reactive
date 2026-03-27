import type { MutationOptions } from '@tanstack/query-core'
import {
  type SpendErrorType,
  type SpendParameters,
  type SpendReturnType,
  spend,
} from '../actions/spend.js'
import type { Config } from '../createConfig.js'

export function spendMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: SpendParameters) => {
      return spend(config, variables)
    },
    mutationKey: ['spend'],
  } satisfies MutationOptions<SpendReturnType, SpendErrorType, SpendParameters>
}

export type SpendMutationOptions = ReturnType<typeof spendMutationOptions>
export type SpendData = SpendReturnType
export type SpendVariables = SpendParameters
export type { SpendErrorType }
