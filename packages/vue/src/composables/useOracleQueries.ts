import type {
  Compute,
  GetOracleQueriesParameters,
  GetOracleQueriesReturnType,
} from '@growae/reactive'
import { getOracleQueries } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseOracleQueriesParameters = Compute<
  GetOracleQueriesParameters & ConfigParameter & { enabled?: boolean }
>

export type UseOracleQueriesReturnType = UseQueryReturnType<
  GetOracleQueriesReturnType,
  Error
>

export function useOracleQueries(
  parameters: UseOracleQueriesParameters = {} as UseOracleQueriesParameters,
): UseOracleQueriesReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'oracleQueries',
      {
        oracleId: parameters.oracleId,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      getOracleQueries(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.oracleId) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseOracleQueriesReturnType
}
