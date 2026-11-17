'use client'

import {
  type SwitchConnectionParameters,
  switchConnection,
} from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useConnections } from './useConnections.js'

export type UseSwitchConnectionParameters = ConfigParameter
export type UseSwitchConnectionReturnType = ReturnType<
  typeof useSwitchConnection
>

export function useSwitchConnection(
  parameters: UseSwitchConnectionParameters = {},
) {
  const config = useConfig(parameters)
  const connections = useConnections({ config })
  const mutation = useMutation({
    mutationKey: ['switchConnection'],
    mutationFn: async (variables: SwitchConnectionParameters) =>
      switchConnection(config, variables),
  })

  return {
    ...mutation,
    connections,
    switchConnection: mutation.mutate,
    switchConnectionAsync: mutation.mutateAsync,
  }
}
