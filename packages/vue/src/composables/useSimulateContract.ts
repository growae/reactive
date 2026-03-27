import type {
  SimulateContractParameters,
  SimulateContractReturnType,
  Compute,
} from '@reactive/core'
import { simulateContract } from '@reactive/core'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

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
    queryKey: ['simulateContract', {
      address: parameters.address,
      method: parameters.method,
      args: parameters.args,
      networkId: parameters.networkId ?? networkId.value,
    }] as const,
    queryFn: () => simulateContract(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: Boolean(parameters.address && parameters.aci && parameters.method) &&
      (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseSimulateContractReturnType
}
