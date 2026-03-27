import {
  type GetOracleQueriesParameters,
  type GetOracleQueriesReturnType,
  getOracleQueries,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseOracleQueriesParameters = Accessor<
  GetOracleQueriesParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseOracleQueriesReturnType = UseQueryReturnType<
  GetOracleQueriesReturnType,
  Error
>

export function useOracleQueries(
  parameters: UseOracleQueriesParameters = () =>
    ({}) as GetOracleQueriesParameters,
): UseOracleQueriesReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'oracleQueries',
      {
        oracleId: parameters().oracleId,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      getOracleQueries(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().oracleId) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseOracleQueriesReturnType
}
