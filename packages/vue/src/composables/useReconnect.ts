import type {
  Compute,
  ReconnectErrorType,
  ReconnectParameters,
  ReconnectReturnType,
} from '@growae/reactive'
import { reconnect } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseReconnectParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: ReconnectReturnType,
        variables: ReconnectParameters,
        context: context,
      ) => void
      onError?: (
        error: ReconnectErrorType,
        variables: ReconnectParameters,
        context: context,
      ) => void
      onSettled?: (
        data: ReconnectReturnType | undefined,
        error: ReconnectErrorType | null,
        variables: ReconnectParameters,
        context: context,
      ) => void
    }
  }
>

export type UseReconnectReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    ReconnectReturnType,
    ReconnectErrorType,
    ReconnectParameters,
    context
  > & {
    reconnect: (variables?: ReconnectParameters) => void
    reconnectAsync: (
      variables?: ReconnectParameters,
    ) => Promise<ReconnectReturnType>
  }
>

export function useReconnect<context = unknown>(
  parameters: UseReconnectParameters<context> = {},
): UseReconnectReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['reconnect'],
    mutationFn: (variables: ReconnectParameters = {}) =>
      reconnect(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseReconnectReturnType<context>
  return {
    ...(mutation as unknown as Return),
    reconnect: mutation.mutate as Return['reconnect'],
    reconnectAsync: mutation.mutateAsync as Return['reconnectAsync'],
  }
}
