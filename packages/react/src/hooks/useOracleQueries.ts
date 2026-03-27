'use client'

import {
  type GetOracleQueriesParameters,
  type GetOracleQueriesReturnType,
  getOracleQueries,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
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

  return useQuery({
    queryKey: [
      'oracleQueries',
      {
        oracleId: parameters.oracleId,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      getOracleQueries(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.oracleId) && (parameters.enabled ?? true),
  }) as UseOracleQueriesReturnType
}
