import type {
  Compute,
  EstimateGasErrorType,
  EstimateGasParameters,
  EstimateGasReturnType,
} from '@growae/reactive'
import { estimateGas } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
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
