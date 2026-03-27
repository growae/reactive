import { createMutation } from '@tanstack/solid-query'
import {
  type PreclaimNameParameters,
  type PreclaimNameReturnType,
  preclaimName,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UsePreclaimNameParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function usePreclaimName(
  parameters: UsePreclaimNameParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['preclaimName'],
    mutationFn: (variables: PreclaimNameParameters) =>
      preclaimName(config(), variables),
  }))
}
