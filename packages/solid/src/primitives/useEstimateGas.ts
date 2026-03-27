import {
  type EstimateGasParameters,
  type EstimateGasReturnType,
  type EstimateGasErrorType,
  estimateGas,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseEstimateGasParameters = Accessor<
  EstimateGasParameters & {
    config?: import('@reactive/core').Config | undefined
    enabled?: boolean
  }
>

export type UseEstimateGasReturnType = UseQueryReturnType<
  EstimateGasReturnType,
  EstimateGasErrorType
>

export function useEstimateGas(
  parameters: UseEstimateGasParameters = () => ({} as EstimateGasParameters),
): UseEstimateGasReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['estimateGas', {
      tx: parameters().tx,
      accountAddress: parameters().accountAddress,
      networkId: parameters().networkId ?? networkId(),
    }] as const,
    queryFn: () => estimateGas(config(), {
      ...parameters(),
      networkId: parameters().networkId ?? networkId(),
    }),
    enabled: Boolean(parameters().tx && parameters().accountAddress) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseEstimateGasReturnType
}
