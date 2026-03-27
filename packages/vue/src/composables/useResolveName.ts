import type {
  ResolveNameParameters,
  ResolveNameReturnType,
  Compute,
} from '@growae/reactive'
import { resolveName } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseResolveNameParameters = Compute<
  ResolveNameParameters & ConfigParameter & { enabled?: boolean }
>

export type UseResolveNameReturnType = UseQueryReturnType<
  ResolveNameReturnType,
  Error
>

export function useResolveName(
  parameters: UseResolveNameParameters = {} as UseResolveNameParameters,
): UseResolveNameReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: ['resolveName', {
      name: parameters.name,
      key: parameters.key,
      networkId: parameters.networkId ?? networkId.value,
    }] as const,
    queryFn: () => resolveName(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: Boolean(parameters.name) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseResolveNameReturnType
}
