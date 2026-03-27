'use client'

import {
  type EstimateGasParameters,
  type EstimateGasReturnType,
  type EstimateGasErrorType,
  estimateGas,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

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
    queryKey: ['estimateGas', {
      tx: parameters.tx,
      accountAddress: parameters.accountAddress,
      networkId: parameters.networkId ?? networkId,
    }],
    queryFn: () => estimateGas(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
    }),
    enabled: Boolean(parameters.tx && parameters.accountAddress) && (parameters.enabled ?? true),
  }) as UseEstimateGasReturnType
}
