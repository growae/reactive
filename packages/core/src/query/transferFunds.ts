import type { MutationOptions } from '@tanstack/query-core'
import {
  type TransferFundsErrorType,
  type TransferFundsParameters,
  type TransferFundsReturnType,
  transferFunds,
} from '../actions/transferFunds.js'
import type { Config } from '../createConfig.js'

export function transferFundsMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: TransferFundsParameters) => {
      return transferFunds(config, variables)
    },
    mutationKey: ['transferFunds'],
  } satisfies MutationOptions<
    TransferFundsReturnType,
    TransferFundsErrorType,
    TransferFundsParameters
  >
}

export type TransferFundsMutationOptions = ReturnType<
  typeof transferFundsMutationOptions
>
export type TransferFundsData = TransferFundsReturnType
export type TransferFundsVariables = TransferFundsParameters
export type { TransferFundsErrorType }
