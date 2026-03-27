import type { MutationOptions } from '@tanstack/query-core'
import {
  type TransferNameParameters,
  type TransferNameReturnType,
  transferName,
} from '../actions/aens/transferName'
import type { Config } from '../createConfig'

export type TransferNameErrorType = Error

export function transferNameMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: TransferNameParameters) => {
      return transferName(config, variables)
    },
    mutationKey: ['transferName'],
  } satisfies MutationOptions<
    TransferNameReturnType,
    TransferNameErrorType,
    TransferNameParameters
  >
}

export type TransferNameMutationOptions = ReturnType<
  typeof transferNameMutationOptions
>
export type TransferNameData = TransferNameReturnType
export type TransferNameVariables = TransferNameParameters
