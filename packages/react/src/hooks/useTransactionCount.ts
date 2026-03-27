'use client'

import {
  type GetTransactionCountParameters,
  type GetTransactionCountReturnType,
  type GetTransactionCountErrorType,
  getTransactionCount,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseTransactionCountParameters = Compute<
  GetTransactionCountParameters & ConfigParameter & { enabled?: boolean }
>

export type UseTransactionCountReturnType = UseQueryReturnType<
  GetTransactionCountReturnType,
  GetTransactionCountErrorType
>

export function useTransactionCount(
  parameters: UseTransactionCountParameters = {} as UseTransactionCountParameters,
): UseTransactionCountReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: ['transactionCount', {
      address: parameters.address,
      networkId: parameters.networkId ?? networkId,
    }],
    queryFn: () => getTransactionCount(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
    }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }) as UseTransactionCountReturnType
}
