'use client'

import {
  type GetAccountErrorType,
  type GetAccountParameters,
  type GetAccountReturnType,
  getAccount,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseAccountParameters = Compute<
  GetAccountParameters & ConfigParameter & { enabled?: boolean }
>

export type UseAccountReturnType = UseQueryReturnType<
  GetAccountReturnType,
  GetAccountErrorType
>

export function useAccount(
  parameters: UseAccountParameters = {} as UseAccountParameters,
): UseAccountReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'account',
      {
        address: parameters.address,
        networkId: parameters.networkId ?? networkId,
        height: parameters.height,
        hash: parameters.hash,
      },
    ],
    queryFn: () =>
      getAccount(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }) as UseAccountReturnType
}
