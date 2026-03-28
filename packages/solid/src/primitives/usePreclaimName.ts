import {
  type Config,
  type PreclaimNameParameters,
  preclaimName,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UsePreclaimNameParameters = Accessor<{
  config?: Config | undefined
}>

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

export type UsePreclaimNameReturnType = ReturnType<typeof usePreclaimName>
