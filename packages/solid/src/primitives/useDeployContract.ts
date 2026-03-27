import { type DeployContractParameters, deployContract } from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseDeployContractParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

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
