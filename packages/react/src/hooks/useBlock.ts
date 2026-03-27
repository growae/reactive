'use client'

import {
  type GetBlockErrorType,
  type GetBlockParameters,
  type GetBlockReturnType,
  getBlock,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
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
    queryKey: [
      'block',
      {
        height: parameters.height,
        hash: parameters.hash,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      getBlock(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: parameters.enabled ?? true,
  }) as UseBlockReturnType
}
