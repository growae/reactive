'use client'
import { sendTransaction } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseSendTransactionSyncParameters = ConfigParameter
export type UseSendTransactionSyncReturnType = ReturnType<
  typeof useSendTransactionSync
>
export function useSendTransactionSync(
  parameters: UseSendTransactionSyncParameters = {},
) {
  const config = useConfig(parameters)
  const result = useMutation({
    retry: false,
    mutationKey: ['sendTransactionSync'],
    mutationFn: (
      input: Omit<Parameters<typeof sendTransaction>[1], 'waitMined'>,
    ) => sendTransaction(config, { ...input, waitMined: true }),
  })
  return {
    ...result,
    sendTransactionSync: result.mutate,
    sendTransactionSyncAsync: result.mutateAsync,
  }
}
