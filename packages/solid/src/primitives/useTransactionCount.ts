import {
  type GetTransactionCountErrorType,
  type GetTransactionCountParameters,
  type GetTransactionCountReturnType,
  getTransactionCount,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseTransactionCountParameters = Accessor<
  GetTransactionCountParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseTransactionCountReturnType = UseQueryReturnType<
  GetTransactionCountReturnType,
  GetTransactionCountErrorType
>

export function useTransactionCount(
  parameters: UseTransactionCountParameters = () =>
    ({}) as GetTransactionCountParameters,
): UseTransactionCountReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'transactionCount',
      {
        address: parameters().address,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      getTransactionCount(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().address) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseTransactionCountReturnType
}
