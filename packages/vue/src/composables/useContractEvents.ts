import type {
  GetContractEventsParameters,
  GetContractEventsReturnType,
  Compute,
} from '@growae/reactive'
import { getContractEvents } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseContractEventsParameters = Compute<
  GetContractEventsParameters & ConfigParameter & { enabled?: boolean }
>

export type UseContractEventsReturnType = UseQueryReturnType<
  GetContractEventsReturnType,
  Error
>

export function useContractEvents(
  parameters: UseContractEventsParameters = {} as UseContractEventsParameters,
): UseContractEventsReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: ['contractEvents', {
      address: parameters.address,
      fromHeight: parameters.fromHeight,
      toHeight: parameters.toHeight,
      networkId: parameters.networkId ?? networkId.value,
    }] as const,
    queryFn: () => getContractEvents(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseContractEventsReturnType
}
