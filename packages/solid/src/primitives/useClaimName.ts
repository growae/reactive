import {
  type ClaimNameParameters,
  type Config,
  claimName,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseClaimNameParameters = Accessor<{
  config?: Config | undefined
}>

export function useClaimName(parameters: UseClaimNameParameters = () => ({})) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['claimName'],
    mutationFn: (variables: ClaimNameParameters) =>
      claimName(config(), variables),
  }))
}

export type UseClaimNameReturnType = ReturnType<typeof useClaimName>
