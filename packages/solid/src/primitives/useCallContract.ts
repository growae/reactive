import { type CallContractParameters, callContract } from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseCallContractParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export function useCallContract(
  parameters: UseCallContractParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['callContract'],
    mutationFn: (variables: CallContractParameters) =>
      callContract(config(), variables),
  }))
}

export type UseCallContractReturnType = ReturnType<typeof useCallContract>
