import {
  type SwitchActiveAccountParameters,
  switchActiveAccount,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseSwitchActiveAccountParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export function useSwitchActiveAccount(
  parameters: UseSwitchActiveAccountParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['switchActiveAccount'],
    mutationFn: async (variables: SwitchActiveAccountParameters) => {
      switchActiveAccount(config(), variables)
    },
  }))
}

export type UseSwitchActiveAccountReturnType = ReturnType<
  typeof useSwitchActiveAccount
>
