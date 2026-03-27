import { createMutation } from '@tanstack/solid-query'
import {
  type SendTransactionParameters,
  type SendTransactionReturnType,
  type SendTransactionErrorType,
  sendTransaction,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseSendTransactionParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

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
