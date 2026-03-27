'use client'

import {
  type ReconnectErrorType,
  type ReconnectParameters,
  type ReconnectReturnType,
  reconnect,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
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

  const mutation = useMutation({
    mutationKey: ['reconnect'],
    mutationFn: (variables: ReconnectParameters = {}) =>
      reconnect(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseReconnectReturnType<context>
  return {
    ...(mutation as unknown as Return),
    reconnect: mutation.mutate as unknown as Return['reconnect'],
    reconnectAsync: mutation.mutateAsync as unknown as Return['reconnectAsync'],
  }
}
