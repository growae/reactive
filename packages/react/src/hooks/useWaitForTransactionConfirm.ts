'use client'

import type { Compute } from '@growae/reactive'
import {
  type WaitForTransactionConfirmErrorType,
  type WaitForTransactionConfirmParameters,
  type WaitForTransactionConfirmReturnType,
  waitForTransactionConfirm,
} from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseWaitForTransactionConfirmParameters = Compute<
  WaitForTransactionConfirmParameters & ConfigParameter & { enabled?: boolean }
>

export type UseWaitForTransactionConfirmReturnType = UseQueryReturnType<
  WaitForTransactionConfirmReturnType,
  WaitForTransactionConfirmErrorType
>

export function useWaitForTransactionConfirm(
  parameters: UseWaitForTransactionConfirmParameters = {} as UseWaitForTransactionConfirmParameters,
): UseWaitForTransactionConfirmReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'waitForTransactionConfirm',
      {
        hash: parameters.hash,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      waitForTransactionConfirm(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.hash) && (parameters.enabled ?? true),
  }) as UseWaitForTransactionConfirmReturnType
}
