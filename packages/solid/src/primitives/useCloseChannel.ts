import { createMutation } from '@tanstack/solid-query'
import {
  type CloseChannelParameters,
  type CloseChannelReturnType,
  closeChannel,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseCloseChannelParameters = Accessor<{ config?: import('@growae/reactive').Config | undefined }>

export function useCloseChannel(
  parameters: UseCloseChannelParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['closeChannel'],
    mutationFn: (variables: CloseChannelParameters) =>
      closeChannel(config(), variables),
  }))
}

export type UseCloseChannelReturnType = ReturnType<typeof useCloseChannel>
