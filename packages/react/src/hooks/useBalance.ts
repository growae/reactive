'use client'

import {
  type GetBalanceErrorType,
  type GetBalanceParameters,
  type GetBalanceReturnType,
  getBalance,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseBalanceParameters = Compute<
  GetBalanceParameters & ConfigParameter & { enabled?: boolean }
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

  return useQuery({
    queryKey: [
      'balance',
      {
        address: parameters.address,
        networkId: parameters.networkId ?? networkId,
        format: parameters.format,
      },
    ],
    queryFn: () =>
      getBalance(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }) as UseBalanceReturnType
}
