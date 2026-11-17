'use client'
import { callContract } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

type WithoutWait<T> = T extends unknown ? Omit<T, 'waitMined'> : never

export type UseWriteContractSyncParameters = ConfigParameter
export type UseWriteContractSyncReturnType = ReturnType<
  typeof useWriteContractSync
>
export function useWriteContractSync(
  parameters: UseWriteContractSyncParameters = {},
) {
  const config = useConfig(parameters)
  const result = useMutation({
    retry: false,
    mutationKey: ['writeContractSync'],
    mutationFn: (input: WithoutWait<Parameters<typeof callContract>[1]>) =>
      callContract(config, { ...input, waitMined: true }),
  })
  return {
    ...result,
    writeContractSync: result.mutate,
    writeContractSyncAsync: result.mutateAsync,
  }
}
