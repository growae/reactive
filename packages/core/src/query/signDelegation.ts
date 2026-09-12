import type { MutationOptions } from '@tanstack/query-core'
import {
  type SignDelegationErrorType,
  type SignDelegationParameters,
  type SignDelegationReturnType,
  signDelegation,
} from '../actions/signDelegation.js'
import type { Config } from '../createConfig.js'

export function signDelegationMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: SignDelegationParameters) => {
      return signDelegation(config, variables)
    },
    mutationKey: ['signDelegation'],
  } satisfies MutationOptions<
    SignDelegationReturnType,
    SignDelegationErrorType,
    SignDelegationParameters
  >
}

export type SignDelegationMutationOptions = ReturnType<
  typeof signDelegationMutationOptions
>
export type SignDelegationData = SignDelegationReturnType
export type SignDelegationVariables = SignDelegationParameters
export type { SignDelegationErrorType }
