import { createMutation } from '@tanstack/solid-query'
import {
  type DeployContractParameters,
  type DeployContractReturnType,
  type DeployContractErrorType,
  deployContract,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseDeployContractParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function useDeployContract(
  parameters: UseDeployContractParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['deployContract'],
    mutationFn: (variables: DeployContractParameters) =>
      deployContract(config(), variables),
  }))
}

export type UseDeployContractReturnType = ReturnType<typeof useDeployContract>
