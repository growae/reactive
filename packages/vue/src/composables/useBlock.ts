import type {
  GetBlockParameters,
  GetBlockReturnType,
  GetBlockErrorType,
  Compute,
} from '@reactive/core'
import { getBlock } from '@reactive/core'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseBlockParameters = Compute<
  GetBlockParameters & ConfigParameter & { enabled?: boolean }
>

export type UseBlockReturnType = UseQueryReturnType<
  GetBlockReturnType,
  GetBlockErrorType
>

export function useBlock(
  parameters: UseBlockParameters = {},
): UseBlockReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: ['block', {
      height: parameters.height,
      hash: parameters.hash,
      networkId: parameters.networkId ?? networkId.value,
    }] as const,
    queryFn: () => getBlock(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: parameters.enabled ?? true,
  }))

  return useQuery(options) as UseBlockReturnType
}
