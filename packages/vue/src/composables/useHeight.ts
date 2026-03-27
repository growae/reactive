import type {
  Compute,
  GetHeightErrorType,
  GetHeightParameters,
  GetHeightReturnType,
} from '@growae/reactive'
import { getHeight } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseHeightParameters = Compute<
  GetHeightParameters & ConfigParameter & { enabled?: boolean }
>

export type UseHeightReturnType = UseQueryReturnType<
  GetHeightReturnType,
  GetHeightErrorType
>

export function useHeight(
  parameters: UseHeightParameters = {},
): UseHeightReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'height',
      {
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      getHeight(config, {
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: parameters.enabled ?? true,
  }))

  return useQuery(options) as UseHeightReturnType
}
