import type { MutationOptions } from '@tanstack/query-core'
import {
  type SignTransactionErrorType,
  type SignTransactionParameters,
  type SignTransactionReturnType,
  signTransaction,
} from '../actions/signTransaction.js'
import type { Config } from '../createConfig.js'

export function signTransactionMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: SignTransactionParameters) => {
      return signTransaction(config, variables)
    },
    mutationKey: ['signTransaction'],
  } satisfies MutationOptions<
    SignTransactionReturnType,
    SignTransactionErrorType,
    SignTransactionParameters
  >
}

export type SignTransactionMutationOptions = ReturnType<
  typeof signTransactionMutationOptions
>
export type SignTransactionData = SignTransactionReturnType
export type SignTransactionVariables = SignTransactionParameters
export type { SignTransactionErrorType }
