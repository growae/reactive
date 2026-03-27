import { createMutation } from '@tanstack/solid-query'
import {
  type DisconnectParameters,
  type DisconnectReturnType,
  type DisconnectErrorType,
  disconnect,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseDisconnectParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

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
