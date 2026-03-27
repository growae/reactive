import type {
  Compute,
  SimulateContractParameters,
  SimulateContractReturnType,
} from '@growae/reactive'
import { simulateContract } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseSimulateContractParameters = Compute<
  SimulateContractParameters & ConfigParameter & { enabled?: boolean }
>

export type UseSimulateContractReturnType = UseQueryReturnType<
  SimulateContractReturnType,
  Error
>

export function useSimulateContract(
  parameters: UseSimulateContractParameters = {} as UseSimulateContractParameters,
): UseSimulateContractReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'simulateContract',
      {
        address: parameters.address,
        method: parameters.method,
        args: parameters.args,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      simulateContract(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled:
      Boolean(parameters.address && parameters.aci && parameters.method) &&
      (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseSimulateContractReturnType
}
