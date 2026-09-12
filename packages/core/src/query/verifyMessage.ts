import type { MutationOptions } from '@tanstack/query-core'
import {
  type VerifyMessageErrorType,
  type VerifyMessageParameters,
  type VerifyMessageReturnType,
  verifyMessage,
} from '../actions/verifyMessage.js'
import type { Config } from '../createConfig.js'

export function verifyMessageMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: VerifyMessageParameters) => {
      return verifyMessage(config, variables)
    },
    mutationKey: ['verifyMessage'],
  } satisfies MutationOptions<
    VerifyMessageReturnType,
    VerifyMessageErrorType,
    VerifyMessageParameters
  >
}

export type VerifyMessageMutationOptions = ReturnType<
  typeof verifyMessageMutationOptions
>
export type VerifyMessageData = VerifyMessageReturnType
export type VerifyMessageVariables = VerifyMessageParameters
export type { VerifyMessageErrorType }
