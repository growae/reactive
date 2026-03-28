import {
  type CloseChannelParameters,
  type Config,
  closeChannel,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseCloseChannelParameters = Accessor<{
  config?: Config | undefined
}>

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
