'use client'

import {
  type GetOracleQueriesParameters,
  type GetOracleQueriesReturnType,
  getOracleQueries,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
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
