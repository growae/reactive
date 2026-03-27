import type { MutationOptions } from '@tanstack/query-core'
import {
  type PayForTransactionErrorType,
  type PayForTransactionParameters,
  type PayForTransactionReturnType,
  payForTransaction,
} from '../actions/payForTransaction.js'
import type { Config } from '../createConfig.js'

export function payForTransactionMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: PayForTransactionParameters) => {
      return payForTransaction(config, variables)
    },
    mutationKey: ['payForTransaction'],
  } satisfies MutationOptions<PayForTransactionReturnType, PayForTransactionErrorType, PayForTransactionParameters>
}

export type PayForTransactionMutationOptions = ReturnType<typeof payForTransactionMutationOptions>
export type PayForTransactionData = PayForTransactionReturnType
export type PayForTransactionVariables = PayForTransactionParameters
export { type PayForTransactionErrorType }
