import {
  type Config,
  type WaitForTransactionConfirmErrorType,
  type WaitForTransactionConfirmParameters,
  type WaitForTransactionConfirmReturnType,
  waitForTransactionConfirm,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseWaitForTransactionConfirmParameters = Accessor<
  WaitForTransactionConfirmParameters & {
    config?: Config | undefined
    enabled?: boolean
  }
>

export type UseWaitForTransactionConfirmReturnType = UseQueryReturnType<
  WaitForTransactionConfirmReturnType,
  WaitForTransactionConfirmErrorType
>

export function useWaitForTransactionConfirm(
  parameters: UseWaitForTransactionConfirmParameters = () =>
    ({}) as WaitForTransactionConfirmParameters,
): UseWaitForTransactionConfirmReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'waitForTransactionConfirm',
      {
        hash: parameters().hash,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      waitForTransactionConfirm(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().hash) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseWaitForTransactionConfirmReturnType
}
