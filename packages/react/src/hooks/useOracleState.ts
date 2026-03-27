'use client'

import {
  type GetOracleStateParameters,
  type GetOracleStateReturnType,
  getOracleState,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
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

  return useQuery({
    queryKey: [
      'oracleState',
      {
        oracleId: parameters.oracleId,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      getOracleState(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.oracleId) && (parameters.enabled ?? true),
  }) as UseOracleStateReturnType
}
