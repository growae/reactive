import {
  type BuildTransactionParameters,
  type Config,
  buildTransaction,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseBuildTransactionParameters = Accessor<{
  config?: Config | undefined
}>

export function useBuildTransaction(
  parameters: UseBuildTransactionParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['buildTransaction'],
    mutationFn: (variables: BuildTransactionParameters) =>
      buildTransaction(config(), variables),
  }))
}

export type UseBuildTransactionReturnType = ReturnType<
  typeof useBuildTransaction
>
