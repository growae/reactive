import {
  type GetTransactionCountParameters,
  type GetTransactionCountReturnType,
  type GetTransactionCountErrorType,
  getTransactionCount,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseTransactionCountParameters = Accessor<
  GetTransactionCountParameters & {
    config?: import('@reactive/core').Config | undefined
    enabled?: boolean
  }
>

export type UseTransactionCountReturnType = UseQueryReturnType<
  GetTransactionCountReturnType,
  GetTransactionCountErrorType
>

export function useTransactionCount(
  parameters: UseTransactionCountParameters = () => ({} as GetTransactionCountParameters),
): UseTransactionCountReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['transactionCount', {
      address: parameters().address,
      networkId: parameters().networkId ?? networkId(),
    }] as const,
    queryFn: () => getTransactionCount(config(), {
      ...parameters(),
      networkId: parameters().networkId ?? networkId(),
    }),
    enabled: Boolean(parameters().address) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseTransactionCountReturnType
}
