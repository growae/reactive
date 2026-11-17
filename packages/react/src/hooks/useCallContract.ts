'use client'
import { callContract } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseCallContractParameters = ConfigParameter
export type UseCallContractReturnType = ReturnType<typeof useCallContract>
export function useCallContract(parameters: UseCallContractParameters = {}) {
  const config = useConfig(parameters)
  const result = useMutation({
    retry: false,
    mutationKey: ['callContract'],
    mutationFn: (input: Parameters<typeof callContract>[1]) =>
      callContract(config, input),
  })
  return {
    ...result,
    callContract: result.mutate,
    callContractAsync: result.mutateAsync,
  }
}
