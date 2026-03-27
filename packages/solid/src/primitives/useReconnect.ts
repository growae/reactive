import { type ReconnectParameters, reconnect } from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseReconnectParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export function useReconnect(parameters: UseReconnectParameters = () => ({})) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['reconnect'],
    mutationFn: (variables: ReconnectParameters = {}) =>
      reconnect(config(), variables),
  }))
}

export type UseReconnectReturnType = ReturnType<typeof useReconnect>
