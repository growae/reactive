import {
  type SignTransactionParameters,
  signTransaction,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseSignTransactionParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export function useSignTransaction(
  parameters: UseSignTransactionParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['signTransaction'],
    mutationFn: (variables: SignTransactionParameters) =>
      signTransaction(config(), variables),
  }))
}

export type UseSignTransactionReturnType = ReturnType<typeof useSignTransaction>
