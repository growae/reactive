import { type OpenChannelParameters, openChannel } from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseOpenChannelParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

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

export type UseOpenChannelReturnType = ReturnType<typeof useOpenChannel>
