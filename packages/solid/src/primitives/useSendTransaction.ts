import {
  type SendTransactionErrorType,
  type SendTransactionParameters,
  type SendTransactionReturnType,
  sendTransaction,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseSendTransactionParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export function useSendTransaction(
  parameters: UseSendTransactionParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['sendTransaction'],
    mutationFn: (variables: SendTransactionParameters) =>
      sendTransaction(config(), variables),
  }))
}

export type UseSendTransactionReturnType = ReturnType<typeof useSendTransaction>
