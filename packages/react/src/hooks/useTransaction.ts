'use client'

import {
  type GetTransactionErrorType,
  type GetTransactionParameters,
  type GetTransactionReturnType,
  getTransaction,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseTransactionParameters = Compute<
  GetTransactionParameters & ConfigParameter & { enabled?: boolean }
>

export type UseTransactionReturnType = UseQueryReturnType<
  GetTransactionReturnType,
  GetTransactionErrorType
>

export function useTransaction(
  parameters: UseTransactionParameters = {} as UseTransactionParameters,
): UseTransactionReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'transaction',
      {
        hash: parameters.hash,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      getTransaction(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.hash) && (parameters.enabled ?? true),
  }) as UseTransactionReturnType
}
