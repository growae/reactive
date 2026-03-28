import {
  type Config,
  type SignDelegationParameters,
  signDelegation,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseSignDelegationParameters = Accessor<{
  config?: Config | undefined
}>

export function useSignDelegation(
  parameters: UseSignDelegationParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['signDelegation'],
    mutationFn: (variables: SignDelegationParameters) =>
      signDelegation(config(), variables),
  }))
}

export type UseSignDelegationReturnType = ReturnType<typeof useSignDelegation>
