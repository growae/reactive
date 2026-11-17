import type {
  Compute,
  ReadContractParameters,
  ReadContractReturnType,
} from '@growae/reactive'
import { readContract } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseReadContractParameters = Compute<
  ReadContractParameters & ConfigParameter & { enabled?: boolean }
>

export type UseReadContractReturnType = UseQueryReturnType<
  ReadContractReturnType,
  Error
>

export function useReadContract(
  parameters: UseReadContractParameters = {} as UseReadContractParameters,
): UseReadContractReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'readContract',
      {
        address: parameters.address,
        method: parameters.method,
        args: parameters.args,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      readContract(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled:
      Boolean(parameters.address && parameters.aci && parameters.method) &&
      (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseReadContractReturnType
}
