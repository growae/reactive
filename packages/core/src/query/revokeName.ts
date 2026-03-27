import type { MutationOptions } from '@tanstack/query-core'
import {
  type RevokeNameParameters,
  type RevokeNameReturnType,
  revokeName,
} from '../actions/aens/revokeName'
import type { Config } from '../createConfig'

export type RevokeNameErrorType = Error

export function revokeNameMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: RevokeNameParameters) => {
      return revokeName(config, variables)
    },
    mutationKey: ['revokeName'],
  } satisfies MutationOptions<
    RevokeNameReturnType,
    RevokeNameErrorType,
    RevokeNameParameters
  >
}

export type RevokeNameMutationOptions = ReturnType<
  typeof revokeNameMutationOptions
>
export type RevokeNameData = RevokeNameReturnType
export type RevokeNameVariables = RevokeNameParameters
