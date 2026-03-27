import type { MutationOptions } from '@tanstack/query-core'
import {
  type PreclaimNameErrorType,
  type PreclaimNameParameters,
  type PreclaimNameReturnType,
  preclaimName,
} from '../actions/preclaimName'
import type { Config } from '../createConfig'

export function preclaimNameMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: PreclaimNameParameters) => {
      return preclaimName(config, variables)
    },
    mutationKey: ['preclaimName'],
  } satisfies MutationOptions<
    PreclaimNameReturnType,
    PreclaimNameErrorType,
    PreclaimNameParameters
  >
}

export type PreclaimNameMutationOptions = ReturnType<
  typeof preclaimNameMutationOptions
>
export type PreclaimNameData = PreclaimNameReturnType
export type PreclaimNameVariables = PreclaimNameParameters
export type { PreclaimNameErrorType }
