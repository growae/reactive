import type {
  Compute,
  GetOracleStateParameters,
  GetOracleStateReturnType,
} from '@growae/reactive'
import { getOracleState } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

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
