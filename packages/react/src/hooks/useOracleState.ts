'use client'

import {
  type GetOracleStateParameters,
  type GetOracleStateReturnType,
  getOracleState,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
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

  return useQuery({
    queryKey: ['oracleState', {
      oracleId: parameters.oracleId,
      networkId: parameters.networkId ?? networkId,
    }],
    queryFn: () => getOracleState(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
    }),
    enabled: Boolean(parameters.oracleId) && (parameters.enabled ?? true),
  }) as UseOracleStateReturnType
}
