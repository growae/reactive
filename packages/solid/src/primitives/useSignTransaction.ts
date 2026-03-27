import { createMutation } from '@tanstack/solid-query'
import {
  type SignTransactionParameters,
  type SignTransactionReturnType,
  type SignTransactionErrorType,
  signTransaction,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseSignTransactionParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

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
