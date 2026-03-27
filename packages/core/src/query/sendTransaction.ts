import type { MutationOptions } from '@tanstack/query-core'
import {
  type SendTransactionErrorType,
  type SendTransactionParameters,
  type SendTransactionReturnType,
  sendTransaction,
} from '../actions/sendTransaction.js'
import type { Config } from '../createConfig.js'

export function sendTransactionMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: SendTransactionParameters) => {
      return sendTransaction(config, variables)
    },
    mutationKey: ['sendTransaction'],
  } satisfies MutationOptions<
    SendTransactionReturnType,
    SendTransactionErrorType,
    SendTransactionParameters
  >
}

export type SendTransactionMutationOptions = ReturnType<
  typeof sendTransactionMutationOptions
>
export type SendTransactionData = SendTransactionReturnType
export type SendTransactionVariables = SendTransactionParameters
export type { SendTransactionErrorType }
