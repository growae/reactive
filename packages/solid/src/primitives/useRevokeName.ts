import { createMutation } from '@tanstack/solid-query'
import {
  type RevokeNameParameters,
  type RevokeNameReturnType,
  revokeName,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseRevokeNameParameters = Accessor<{ config?: import('@growae/reactive').Config | undefined }>

export function useRevokeName(
  parameters: UseRevokeNameParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['revokeName'],
    mutationFn: (variables: RevokeNameParameters) =>
      revokeName(config(), variables),
  }))
}

export type UseRevokeNameReturnType = ReturnType<typeof useRevokeName>
