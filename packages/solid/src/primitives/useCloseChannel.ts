import { createMutation } from '@tanstack/solid-query'
import {
  type CloseChannelParameters,
  type CloseChannelReturnType,
  closeChannel,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseCloseChannelParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

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
