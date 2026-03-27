import type {
  Compute,
  GetContractEventsParameters,
  GetContractEventsReturnType,
} from '@growae/reactive'
import { getContractEvents } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

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
    queryKey: [
      'contractEvents',
      {
        address: parameters.address,
        fromHeight: parameters.fromHeight,
        toHeight: parameters.toHeight,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      getContractEvents(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseContractEventsReturnType
}
