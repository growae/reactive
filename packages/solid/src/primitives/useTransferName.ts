import {
  type Config,
  type TransferNameParameters,
  transferName,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseTransferNameParameters = Accessor<{
  config?: Config | undefined
}>

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

export type UseTransferNameReturnType = ReturnType<typeof useTransferName>
