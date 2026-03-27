import {
  type SpendParameters,
  spend,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseSpendParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export function useSpend(parameters: UseSpendParameters = () => ({})) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['spend'],
    mutationFn: (variables: SpendParameters) => spend(config(), variables),
  }))
}

export type UseSpendReturnType = ReturnType<typeof useSpend>
