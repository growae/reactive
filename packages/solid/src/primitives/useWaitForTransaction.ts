import {
  type Config,
  type WaitForTransactionErrorType,
  type WaitForTransactionParameters,
  type WaitForTransactionReturnType,
  waitForTransaction,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseWaitForTransactionParameters = Accessor<
  WaitForTransactionParameters & {
    config?: Config | undefined
    enabled?: boolean
  }
>

export type UseWaitForTransactionReturnType = UseQueryReturnType<
  WaitForTransactionReturnType,
  WaitForTransactionErrorType
>

export function useWaitForTransaction(
  parameters: UseWaitForTransactionParameters = () =>
    ({}) as WaitForTransactionParameters,
): UseWaitForTransactionReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'waitForTransaction',
      {
        hash: parameters().hash,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      waitForTransaction(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().hash) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseWaitForTransactionReturnType
}
