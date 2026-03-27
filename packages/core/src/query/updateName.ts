import type { MutationOptions } from '@tanstack/query-core'
import {
  type UpdateNameErrorType,
  type UpdateNameParameters,
  type UpdateNameReturnType,
  updateName,
} from '../actions/updateName'
import type { Config } from '../createConfig'

export function updateNameMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: UpdateNameParameters) => {
      return updateName(config, variables)
    },
    mutationKey: ['updateName'],
  } satisfies MutationOptions<
    UpdateNameReturnType,
    UpdateNameErrorType,
    UpdateNameParameters
  >
}

export type UpdateNameMutationOptions = ReturnType<
  typeof updateNameMutationOptions
>
export type UpdateNameData = UpdateNameReturnType
export type UpdateNameVariables = UpdateNameParameters
export type { UpdateNameErrorType }
