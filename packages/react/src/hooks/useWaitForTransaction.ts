'use client'

import {
  type WaitForTransactionParameters,
  type WaitForTransactionReturnType,
  type WaitForTransactionErrorType,
  waitForTransaction,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseWaitForTransactionParameters = Compute<
  WaitForTransactionParameters & ConfigParameter & { enabled?: boolean }
>

export type UseWaitForTransactionReturnType = UseQueryReturnType<
  WaitForTransactionReturnType,
  WaitForTransactionErrorType
>

export function useWaitForTransaction(
  parameters: UseWaitForTransactionParameters = {} as UseWaitForTransactionParameters,
): UseWaitForTransactionReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: ['waitForTransaction', {
      hash: parameters.hash,
      networkId: parameters.networkId ?? networkId,
    }],
    queryFn: () => waitForTransaction(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
    }),
    enabled: Boolean(parameters.hash) && (parameters.enabled ?? true),
  }) as UseWaitForTransactionReturnType
}
