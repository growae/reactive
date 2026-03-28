import {
  type Config,
  type TransferFundsParameters,
  transferFunds,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseTransferFundsParameters = Accessor<{
  config?: Config | undefined
}>

export function useTransferFunds(
  parameters: UseTransferFundsParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['transferFunds'],
    mutationFn: (variables: TransferFundsParameters) =>
      transferFunds(config(), variables),
  }))
}

export type UseTransferFundsReturnType = ReturnType<typeof useTransferFunds>
