'use client'
import { deployContract } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseDeployContractParameters = ConfigParameter
export type UseDeployContractReturnType = ReturnType<typeof useDeployContract>
export function useDeployContract(
  parameters: UseDeployContractParameters = {},
) {
  const config = useConfig(parameters)
  const result = useMutation({
    retry: false,
    mutationKey: ['deployContract'],
    mutationFn: (input: Parameters<typeof deployContract>[1]) =>
      deployContract(config, input),
  })
  return {
    ...result,
    deployContract: result.mutate,
    deployContractAsync: result.mutateAsync,
  }
}
