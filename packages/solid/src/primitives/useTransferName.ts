import { createMutation } from '@tanstack/solid-query'
import {
  type TransferNameParameters,
  type TransferNameReturnType,
  transferName,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseTransferNameParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function useTransferName(
  parameters: UseTransferNameParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['transferName'],
    mutationFn: (variables: TransferNameParameters) =>
      transferName(config(), variables),
  }))
}
