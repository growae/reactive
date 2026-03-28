'use client'

import {
  type GetBalanceErrorType,
  type GetBalanceParameters,
  type GetBalanceReturnType,
  getBalance,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useActiveAccount } from './useActiveAccount'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseBalanceParameters = Compute<
  Omit<GetBalanceParameters, 'address'> &
    ConfigParameter & { address?: string | undefined; enabled?: boolean }
>

export type UseBalanceReturnType = UseQueryReturnType<
  GetBalanceReturnType,
  GetBalanceErrorType
>

export function useBalance(
  parameters: UseBalanceParameters = {} as UseBalanceParameters,
): UseBalanceReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })
  const activeAccount = useActiveAccount({ config })

  const address = parameters.address ?? activeAccount.address

  return useQuery({
    queryKey: [
      'balance',
      {
        address,
        networkId: parameters.networkId ?? networkId,
        format: parameters.format,
      },
    ],
    queryFn: () =>
      getBalance(config, {
        ...parameters,
        address: address as string,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(address) && (parameters.enabled ?? true),
  }) as UseBalanceReturnType
}
