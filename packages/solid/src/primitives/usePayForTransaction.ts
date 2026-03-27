import {
  type PayForTransactionParameters,
  payForTransaction,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UsePayForTransactionParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export function usePayForTransaction(
  parameters: UsePayForTransactionParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['payForTransaction'],
    mutationFn: (variables: PayForTransactionParameters) =>
      payForTransaction(config(), variables),
  }))
}

export type UsePayForTransactionReturnType = ReturnType<
  typeof usePayForTransaction
>
