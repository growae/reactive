import type { MutationOptions } from '@tanstack/query-core'
import {
  type SignMessageErrorType,
  type SignMessageParameters,
  type SignMessageReturnType,
  signMessage,
} from '../actions/signMessage.js'
import type { Config } from '../createConfig.js'

export function signMessageMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: SignMessageParameters) => {
      return signMessage(config, variables)
    },
    mutationKey: ['signMessage'],
  } satisfies MutationOptions<
    SignMessageReturnType,
    SignMessageErrorType,
    SignMessageParameters
  >
}

export type SignMessageMutationOptions = ReturnType<
  typeof signMessageMutationOptions
>
export type SignMessageData = SignMessageReturnType
export type SignMessageVariables = SignMessageParameters
export type { SignMessageErrorType }
