'use client'

import {
  type RespondToQueryParameters,
  type RespondToQueryReturnType,
  respondToQuery,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
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

  const mutation = useMutation({
    mutationKey: ['respondToQuery'],
    mutationFn: (variables: RespondToQueryParameters) =>
      respondToQuery(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseRespondToQueryReturnType<context>
  return {
    ...(mutation as unknown as Return),
    respondToQuery: mutation.mutate as unknown as Return['respondToQuery'],
    respondToQueryAsync: mutation.mutateAsync as unknown as Return['respondToQueryAsync'],
  }
}
