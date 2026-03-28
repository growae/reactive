import {
  type GetBalanceErrorType,
  type GetBalanceParameters,
  type GetBalanceReturnType,
  getBalance,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useActiveAccount } from './useActiveAccount'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseBalanceParameters = Accessor<
  Omit<GetBalanceParameters, 'address'> & {
    address?: string | undefined
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseBalanceReturnType = UseQueryReturnType<
  GetBalanceReturnType,
  GetBalanceErrorType
>

export function useBalance(
  parameters: UseBalanceParameters = () => ({}),
): UseBalanceReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))
  const activeAccount = useActiveAccount(parameters)

  const options = createMemo(() => {
    const address = parameters().address ?? activeAccount().address
    return {
      queryKey: [
        'balance',
        {
          address,
          networkId: parameters().networkId ?? networkId(),
          format: parameters().format,
        },
      ] as const,
      queryFn: () =>
        getBalance(config(), {
          ...parameters(),
          address: address as string,
          networkId: parameters().networkId ?? networkId(),
        }),
      enabled: Boolean(address) && (parameters().enabled ?? true),
    }
  })

  return useQuery(options) as UseBalanceReturnType
}
