import { createMutation } from '@tanstack/solid-query'
import {
  type ClaimNameParameters,
  type ClaimNameReturnType,
  claimName,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseClaimNameParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function useClaimName(
  parameters: UseClaimNameParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['claimName'],
    mutationFn: (variables: ClaimNameParameters) =>
      claimName(config(), variables),
  }))
}

export type UseClaimNameReturnType = ReturnType<typeof useClaimName>
