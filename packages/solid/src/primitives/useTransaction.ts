import {
  type GetTransactionParameters,
  type GetTransactionReturnType,
  type GetTransactionErrorType,
  getTransaction,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseTransactionParameters = Accessor<
  GetTransactionParameters & {
    config?: import('@reactive/core').Config | undefined
    enabled?: boolean
  }
>

export type UseTransactionReturnType = UseQueryReturnType<
  GetTransactionReturnType,
  GetTransactionErrorType
>

export function useTransaction(
  parameters: UseTransactionParameters = () => ({} as GetTransactionParameters),
): UseTransactionReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['transaction', {
      hash: parameters().hash,
      networkId: parameters().networkId ?? networkId(),
    }] as const,
    queryFn: () => getTransaction(config(), {
      ...parameters(),
      networkId: parameters().networkId ?? networkId(),
    }),
    enabled: Boolean(parameters().hash) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseTransactionReturnType
}
