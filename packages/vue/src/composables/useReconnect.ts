import { useMutation } from '@tanstack/vue-query'
import type {
  ReconnectParameters,
  ReconnectReturnType,
  ReconnectErrorType,
  Compute,
} from '@growae/reactive'
import { reconnect } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseReconnectParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: ReconnectReturnType, variables: ReconnectParameters, context: context) => void
      onError?: (error: ReconnectErrorType, variables: ReconnectParameters, context: context) => void
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
    reconnectAsync: (variables?: ReconnectParameters) => Promise<ReconnectReturnType>
  }
>

export function useReconnect<context = unknown>(
  parameters: UseReconnectParameters<context> = {},
): UseReconnectReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['reconnect'],
    mutationFn: (variables: ReconnectParameters = {}) =>
      reconnect(config, variables),
    ...parameters.mutation,
  })

  type Return = UseReconnectReturnType<context>
  return {
    ...(mutation as unknown as Return),
    reconnect: mutation.mutate as Return['reconnect'],
    reconnectAsync: mutation.mutateAsync as Return['reconnectAsync'],
  }
}
