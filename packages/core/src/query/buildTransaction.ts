import type { MutationOptions } from '@tanstack/query-core'
import {
  type BuildTransactionErrorType,
  type BuildTransactionParameters,
  type BuildTransactionReturnType,
  buildTransaction,
} from '../actions/buildTransaction.js'
import type { Config } from '../createConfig.js'

export function buildTransactionMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: BuildTransactionParameters) => {
      return buildTransaction(config, variables)
    },
    mutationKey: ['buildTransaction'],
  } satisfies MutationOptions<BuildTransactionReturnType, BuildTransactionErrorType, BuildTransactionParameters>
}

export type BuildTransactionMutationOptions = ReturnType<typeof buildTransactionMutationOptions>
export type BuildTransactionData = BuildTransactionReturnType
export type BuildTransactionVariables = BuildTransactionParameters
export { type BuildTransactionErrorType }
