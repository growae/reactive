import type {
  Compute,
  GetMicroBlockErrorType,
  GetMicroBlockParameters,
  GetMicroBlockReturnType,
} from '@growae/reactive'
import { getMicroBlock } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseMicroBlockParameters = Compute<
  GetMicroBlockParameters & ConfigParameter & { enabled?: boolean }
>

export type UseMicroBlockReturnType = UseQueryReturnType<
  GetMicroBlockReturnType,
  GetMicroBlockErrorType
>

export function useMicroBlock(
  parameters: UseMicroBlockParameters = {} as UseMicroBlockParameters,
): UseMicroBlockReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'microBlock',
      {
        hash: parameters.hash,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      getMicroBlock(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.hash) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseMicroBlockReturnType
}
