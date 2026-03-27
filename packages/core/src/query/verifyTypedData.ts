import type { MutationOptions } from '@tanstack/query-core'
import {
  type VerifyTypedDataErrorType,
  type VerifyTypedDataParameters,
  type VerifyTypedDataReturnType,
  verifyTypedData,
} from '../actions/verifyTypedData'
import type { Config } from '../createConfig'

export function verifyTypedDataMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: VerifyTypedDataParameters) => {
      return verifyTypedData(config, variables)
    },
    mutationKey: ['verifyTypedData'],
  } satisfies MutationOptions<
    VerifyTypedDataReturnType,
    VerifyTypedDataErrorType,
    VerifyTypedDataParameters
  >
}

export type VerifyTypedDataMutationOptions = ReturnType<
  typeof verifyTypedDataMutationOptions
>
export type VerifyTypedDataData = VerifyTypedDataReturnType
export type VerifyTypedDataVariables = VerifyTypedDataParameters
export type { VerifyTypedDataErrorType }
