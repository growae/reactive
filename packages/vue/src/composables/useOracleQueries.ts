import type {
  GetOracleQueriesParameters,
  GetOracleQueriesReturnType,
  Compute,
} from '@reactive/core'
import { getOracleQueries } from '@reactive/core'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

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
    queryKey: ['oracleQueries', {
      oracleId: parameters.oracleId,
      networkId: parameters.networkId ?? networkId.value,
    }] as const,
    queryFn: () => getOracleQueries(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: Boolean(parameters.oracleId) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseOracleQueriesReturnType
}
