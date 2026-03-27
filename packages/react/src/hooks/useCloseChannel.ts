'use client'

import {
  type CloseChannelParameters,
  type CloseChannelReturnType,
  closeChannel,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseCloseChannelParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: CloseChannelReturnType,
        variables: CloseChannelParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: CloseChannelParameters,
        context: context,
      ) => void
    }
  }
>

export type UseCloseChannelReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    CloseChannelReturnType,
    Error,
    CloseChannelParameters,
    context
  > & {
    closeChannel: (variables: CloseChannelParameters) => void
    closeChannelAsync: (
      variables: CloseChannelParameters,
    ) => Promise<CloseChannelReturnType>
  }
>

export function useCloseChannel<context = unknown>(
  parameters: UseCloseChannelParameters<context> = {},
): UseCloseChannelReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['closeChannel'],
    mutationFn: (variables: CloseChannelParameters) =>
      closeChannel(config, variables),
    ...parameters.mutation,
  })

  type Return = UseCloseChannelReturnType<context>
  return {
    ...(mutation as unknown as Return),
    closeChannel: mutation.mutate as Return['closeChannel'],
    closeChannelAsync: mutation.mutateAsync as Return['closeChannelAsync'],
  }
}
