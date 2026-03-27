'use client'

import {
  type GetAccountParameters,
  type GetAccountReturnType,
  type GetAccountErrorType,
  getAccount,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
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
    queryKey: ['account', {
      address: parameters.address,
      networkId: parameters.networkId ?? networkId,
      height: parameters.height,
      hash: parameters.hash,
    }],
    queryFn: () => getAccount(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
    }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }) as UseAccountReturnType
}
