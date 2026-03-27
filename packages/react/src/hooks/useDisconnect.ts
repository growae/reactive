'use client'

import {
  type DisconnectErrorType,
  type DisconnectParameters,
  type DisconnectReturnType,
  disconnect,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseDisconnectParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: DisconnectReturnType,
        variables: DisconnectParameters,
        context: context,
      ) => void
      onError?: (
        error: DisconnectErrorType,
        variables: DisconnectParameters,
        context: context,
      ) => void
    }
  }
>

export type UseDisconnectReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    DisconnectReturnType,
    DisconnectErrorType,
    DisconnectParameters,
    context
  > & {
    disconnect: (variables?: DisconnectParameters) => void
    disconnectAsync: (
      variables?: DisconnectParameters,
    ) => Promise<DisconnectReturnType>
  }
>

export function useDisconnect<context = unknown>(
  parameters: UseDisconnectParameters<context> = {},
): UseDisconnectReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['disconnect'],
    mutationFn: (variables: DisconnectParameters = {}) =>
      disconnect(config, variables),
    ...parameters.mutation,
  })

  type Return = UseDisconnectReturnType<context>
  return {
    ...(mutation as unknown as Return),
    disconnect: mutation.mutate as Return['disconnect'],
    disconnectAsync: mutation.mutateAsync as Return['disconnectAsync'],
  }
}
