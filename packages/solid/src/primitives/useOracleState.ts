import {
  type GetOracleStateParameters,
  type GetOracleStateReturnType,
  getOracleState,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseOracleStateParameters = Accessor<
  GetOracleStateParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseOracleStateReturnType = UseQueryReturnType<
  GetOracleStateReturnType,
  Error
>

export function useOracleState(
  parameters: UseOracleStateParameters = () => ({}) as GetOracleStateParameters,
): UseOracleStateReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'oracleState',
      {
        oracleId: parameters().oracleId,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      getOracleState(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().oracleId) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseOracleStateReturnType
}
