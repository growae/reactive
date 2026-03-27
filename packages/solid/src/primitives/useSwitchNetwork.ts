import { createMutation } from '@tanstack/solid-query'
import {
  type SwitchNetworkParameters,
  type SwitchNetworkReturnType,
  type SwitchNetworkErrorType,
  switchNetwork,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseSwitchNetworkParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function useSwitchNetwork(
  parameters: UseSwitchNetworkParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['switchNetwork'],
    mutationFn: (variables: SwitchNetworkParameters) =>
      switchNetwork(config(), variables),
  }))
}

export type UseSwitchNetworkReturnType = ReturnType<typeof useSwitchNetwork>
