'use client'

import {
  type GetBlockParameters,
  type GetBlockReturnType,
  type GetBlockErrorType,
  getBlock,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseBlockParameters = Compute<
  GetBlockParameters & ConfigParameter & { enabled?: boolean }
>

export type UseBlockReturnType = UseQueryReturnType<
  GetBlockReturnType,
  GetBlockErrorType
>

export function useBlock(
  parameters: UseBlockParameters = {},
): UseBlockReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: ['block', {
      height: parameters.height,
      hash: parameters.hash,
      networkId: parameters.networkId ?? networkId,
    }],
    queryFn: () => getBlock(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
    }),
    enabled: parameters.enabled ?? true,
  }) as UseBlockReturnType
}
