'use client'

import {
  type ConnectErrorType,
  type ConnectParameters,
  type ConnectReturnType,
  connect,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ConfigParameter } from '../types/properties'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'
import { useConnectors } from './useConnectors'

export type UseConnectParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: ConnectReturnType,
        variables: ConnectParameters,
        context: context,
      ) => void
      onError?: (
        error: ConnectErrorType,
        variables: ConnectParameters,
        context: context,
      ) => void
      onSettled?: (
        data: ConnectReturnType | undefined,
        error: ConnectErrorType | null,
        variables: ConnectParameters,
        context: context,
      ) => void
    }
  }
>

export type UseConnectReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    ConnectReturnType,
    ConnectErrorType,
    ConnectParameters,
    context
  > & {
    connect: (variables: ConnectParameters) => void
    connectAsync: (variables: ConnectParameters) => Promise<ConnectReturnType>
    connectors: ReturnType<typeof useConnectors>
  }
>

export function useConnect<context = unknown>(
  parameters: UseConnectParameters<context> = {},
): UseConnectReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['connect'],
    mutationFn: (variables: ConnectParameters) => connect(config, variables),
    ...parameters.mutation,
  } as any)

  useEffect(() => {
    return config.subscribe(
      ({ status }) => status,
      (status, previousStatus) => {
        if (previousStatus === 'connected' && status === 'disconnected')
          mutation.reset()
      },
    )
  }, [config, mutation.reset])

  type Return = UseConnectReturnType<context>
  return {
    ...(mutation as unknown as Return),
    connect: mutation.mutate as unknown as Return['connect'],
    connectAsync: mutation.mutateAsync as unknown as Return['connectAsync'],
    connectors: useConnectors({ config }),
  }
}
