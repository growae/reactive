import { createMutation } from '@tanstack/solid-query'
import {
  type PayForTransactionParameters,
  type PayForTransactionReturnType,
  type PayForTransactionErrorType,
  payForTransaction,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UsePayForTransactionParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

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
