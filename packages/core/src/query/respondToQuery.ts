import type { MutationOptions } from '@tanstack/query-core'
import {
  type RespondToQueryParameters,
  type RespondToQueryReturnType,
  respondToQuery,
} from '../actions/oracle/respondToQuery'
import type { Config } from '../createConfig'

export type RespondToQueryErrorType = Error

export function respondToQueryMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: RespondToQueryParameters) => {
      return respondToQuery(config, variables)
    },
    mutationKey: ['respondToQuery'],
  } satisfies MutationOptions<
    RespondToQueryReturnType,
    RespondToQueryErrorType,
    RespondToQueryParameters
  >
}

export type RespondToQueryMutationOptions = ReturnType<
  typeof respondToQueryMutationOptions
>
export type RespondToQueryData = RespondToQueryReturnType
export type RespondToQueryVariables = RespondToQueryParameters
