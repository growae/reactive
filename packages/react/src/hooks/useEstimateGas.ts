'use client'

import {
  type EstimateGasErrorType,
  type EstimateGasParameters,
  type EstimateGasReturnType,
  estimateGas,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseEstimateGasParameters = Compute<
  EstimateGasParameters & ConfigParameter & { enabled?: boolean }
>

export type UseEstimateGasReturnType = UseQueryReturnType<
  EstimateGasReturnType,
  EstimateGasErrorType
>

export function useEstimateGas(
  parameters: UseEstimateGasParameters = {} as UseEstimateGasParameters,
): UseEstimateGasReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'estimateGas',
      {
        tx: parameters.tx,
        accountAddress: parameters.accountAddress,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      estimateGas(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled:
      Boolean(parameters.tx && parameters.accountAddress) &&
      (parameters.enabled ?? true),
  }) as UseEstimateGasReturnType
}
