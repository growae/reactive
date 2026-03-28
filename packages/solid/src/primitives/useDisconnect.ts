import {
  type Config,
  type DisconnectParameters,
  disconnect,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseDisconnectParameters = Accessor<{
  config?: Config | undefined
}>

export function useDisconnect(
  parameters: UseDisconnectParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['disconnect'],
    mutationFn: (variables: DisconnectParameters = {}) =>
      disconnect(config(), variables),
  }))
}

export type UseDisconnectReturnType = ReturnType<typeof useDisconnect>
