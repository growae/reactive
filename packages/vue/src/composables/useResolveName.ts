import type {
  Compute,
  ResolveNameParameters,
  ResolveNameReturnType,
} from '@growae/reactive'
import { resolveName } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

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
    queryKey: [
      'resolveName',
      {
        name: parameters.name,
        key: parameters.key,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      resolveName(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.name) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseResolveNameReturnType
}
