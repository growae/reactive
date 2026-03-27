import { createMutation } from '@tanstack/solid-query'
import {
  type CallContractParameters,
  type CallContractReturnType,
  type CallContractErrorType,
  callContract,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseCallContractParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

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
