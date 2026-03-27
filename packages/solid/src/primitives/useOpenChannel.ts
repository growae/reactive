import { createMutation } from '@tanstack/solid-query'
import {
  type OpenChannelParameters,
  type OpenChannelReturnType,
  openChannel,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseOpenChannelParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function useOpenChannel(
  parameters: UseOpenChannelParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['openChannel'],
    mutationFn: (variables: OpenChannelParameters) =>
      openChannel(config(), variables),
  }))
}
