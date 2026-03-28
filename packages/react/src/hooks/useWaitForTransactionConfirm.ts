'use client'

import {
  type WaitForTransactionConfirmErrorType,
  type WaitForTransactionConfirmParameters,
  type WaitForTransactionConfirmReturnType,
  waitForTransactionConfirm,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

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
