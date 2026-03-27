import type {
  Compute,
  EstimateGasErrorType,
  EstimateGasParameters,
  EstimateGasReturnType,
} from '@growae/reactive'
import { estimateGas } from '@growae/reactive'
import { computed } from 'vue'
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

  const options = computed(() => ({
    queryKey: [
      'estimateGas',
      {
        tx: parameters.tx,
        accountAddress: parameters.accountAddress,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      estimateGas(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled:
      Boolean(parameters.tx && parameters.accountAddress) &&
      (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseEstimateGasReturnType
}
