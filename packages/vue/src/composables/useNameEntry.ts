import type {
  Compute,
  GetNameEntryErrorType,
  GetNameEntryParameters,
  GetNameEntryReturnType,
} from '@growae/reactive'
import { getNameEntry } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseNameEntryParameters = Compute<
  GetNameEntryParameters & ConfigParameter & { enabled?: boolean }
>

export type UseNameEntryReturnType = UseQueryReturnType<
  GetNameEntryReturnType,
  GetNameEntryErrorType
>

export function useNameEntry(
  parameters: UseNameEntryParameters = {} as UseNameEntryParameters,
): UseNameEntryReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'nameEntry',
      {
        name: parameters.name,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      getNameEntry(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.name) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseNameEntryReturnType
}
