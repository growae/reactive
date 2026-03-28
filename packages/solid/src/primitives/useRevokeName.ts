import {
  type Config,
  type RevokeNameParameters,
  revokeName,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseRevokeNameParameters = Accessor<{
  config?: Config | undefined
}>

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
