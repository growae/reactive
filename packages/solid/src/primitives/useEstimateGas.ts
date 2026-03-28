import {
  type Config,
  type EstimateGasErrorType,
  type EstimateGasParameters,
  type EstimateGasReturnType,
  estimateGas,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseEstimateGasParameters = Accessor<
  EstimateGasParameters & {
    config?: Config | undefined
    enabled?: boolean
  }
>

export type UseEstimateGasReturnType = UseQueryReturnType<
  EstimateGasReturnType,
  EstimateGasErrorType
>

export function useEstimateGas(
  parameters: UseEstimateGasParameters = () => ({}) as EstimateGasParameters,
): UseEstimateGasReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'estimateGas',
      {
        tx: parameters().tx,
        accountAddress: parameters().accountAddress,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      estimateGas(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled:
      Boolean(parameters().tx && parameters().accountAddress) &&
      (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseEstimateGasReturnType
}
