import {
  type GetBalanceErrorType,
  type GetBalanceParameters,
  type GetBalanceReturnType,
  getBalance,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseBalanceParameters = Accessor<
  GetBalanceParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseBalanceReturnType = UseQueryReturnType<
  GetBalanceReturnType,
  GetBalanceErrorType
>

export function useBalance(
  parameters: UseBalanceParameters = () => ({}) as GetBalanceParameters,
): UseBalanceReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'balance',
      {
        address: parameters().address,
        networkId: parameters().networkId ?? networkId(),
        format: parameters().format,
      },
    ] as const,
    queryFn: () =>
      getBalance(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().address) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseBalanceReturnType
}
