import type { MutationOptions } from '@tanstack/query-core'
import {
  type SignTypedDataErrorType,
  type SignTypedDataParameters,
  type SignTypedDataReturnType,
  signTypedData,
} from '../actions/signTypedData'
import type { Config } from '../createConfig'

export function signTypedDataMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: SignTypedDataParameters) => {
      return signTypedData(config, variables)
    },
    mutationKey: ['signTypedData'],
  } satisfies MutationOptions<
    SignTypedDataReturnType,
    SignTypedDataErrorType,
    SignTypedDataParameters
  >
}

export type SignTypedDataMutationOptions = ReturnType<
  typeof signTypedDataMutationOptions
>
export type SignTypedDataData = SignTypedDataReturnType
export type SignTypedDataVariables = SignTypedDataParameters
export type { SignTypedDataErrorType }
