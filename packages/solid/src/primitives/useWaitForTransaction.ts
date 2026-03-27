import {
  type WaitForTransactionParameters,
  type WaitForTransactionReturnType,
  type WaitForTransactionErrorType,
  waitForTransaction,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseWaitForTransactionParameters = Accessor<
  WaitForTransactionParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseWaitForTransactionReturnType = UseQueryReturnType<
  WaitForTransactionReturnType,
  WaitForTransactionErrorType
>

export function useWaitForTransaction(
  parameters: UseWaitForTransactionParameters = () => ({} as WaitForTransactionParameters),
): UseWaitForTransactionReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['waitForTransaction', {
      hash: parameters().hash,
      networkId: parameters().networkId ?? networkId(),
    }] as const,
    queryFn: () => waitForTransaction(config(), {
      ...parameters(),
      networkId: parameters().networkId ?? networkId(),
    }),
    enabled: Boolean(parameters().hash) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseWaitForTransactionReturnType
}
