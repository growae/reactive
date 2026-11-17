import type { MutationOptions } from '@tanstack/query-core'
import {
  type ClaimNameErrorType,
  type ClaimNameParameters,
  type ClaimNameReturnType,
  claimName,
} from '../actions/claimName.js'
import type { Config } from '../createConfig.js'

export function claimNameMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ClaimNameParameters) => {
      return claimName(config, variables)
    },
    mutationKey: ['claimName'],
  } satisfies MutationOptions<
    ClaimNameReturnType,
    ClaimNameErrorType,
    ClaimNameParameters
  >
}

export type ClaimNameMutationOptions = ReturnType<
  typeof claimNameMutationOptions
>
export type ClaimNameData = ClaimNameReturnType
export type ClaimNameVariables = ClaimNameParameters
export type { ClaimNameErrorType }
