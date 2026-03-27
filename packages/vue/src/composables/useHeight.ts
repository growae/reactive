import type {
  GetHeightParameters,
  GetHeightReturnType,
  GetHeightErrorType,
  Compute,
} from '@reactive/core'
import { getHeight } from '@reactive/core'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

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
    queryKey: ['height', {
      networkId: parameters.networkId ?? networkId.value,
    }] as const,
    queryFn: () => getHeight(config, {
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: parameters.enabled ?? true,
  }))

  return useQuery(options) as UseHeightReturnType
}
