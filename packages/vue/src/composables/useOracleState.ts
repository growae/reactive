import type {
  Compute,
  GetOracleStateParameters,
  GetOracleStateReturnType,
} from '@growae/reactive'
import { getOracleState } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseOracleStateParameters = Compute<
  GetOracleStateParameters & ConfigParameter & { enabled?: boolean }
>

export type UseOracleStateReturnType = UseQueryReturnType<
  GetOracleStateReturnType,
  Error
>

export function useOracleState(
  parameters: UseOracleStateParameters = {} as UseOracleStateParameters,
): UseOracleStateReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'oracleState',
      {
        oracleId: parameters.oracleId,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      getOracleState(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.oracleId) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseOracleStateReturnType
}
