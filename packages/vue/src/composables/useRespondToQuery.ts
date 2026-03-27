import type {
  Compute,
  RespondToQueryParameters,
  RespondToQueryReturnType,
} from '@growae/reactive'
import { respondToQuery } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseRespondToQueryParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: RespondToQueryReturnType,
        variables: RespondToQueryParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: RespondToQueryParameters,
        context: context,
      ) => void
      onSettled?: (
        data: RespondToQueryReturnType | undefined,
        error: Error | null,
        variables: RespondToQueryParameters,
        context: context,
      ) => void
    }
  }
>

export type UseRespondToQueryReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    RespondToQueryReturnType,
    Error,
    RespondToQueryParameters,
    context
  > & {
    respondToQuery: (variables: RespondToQueryParameters) => void
    respondToQueryAsync: (
      variables: RespondToQueryParameters,
    ) => Promise<RespondToQueryReturnType>
  }
>

export function useRespondToQuery<context = unknown>(
  parameters: UseRespondToQueryParameters<context> = {},
): UseRespondToQueryReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['respondToQuery'],
    mutationFn: (variables: RespondToQueryParameters) =>
      respondToQuery(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseRespondToQueryReturnType<context>
  return {
    ...(mutation as unknown as Return),
    respondToQuery: mutation.mutate as Return['respondToQuery'],
    respondToQueryAsync: mutation.mutateAsync as Return['respondToQueryAsync'],
  }
}
