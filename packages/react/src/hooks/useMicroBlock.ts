'use client'

import type { Compute } from '@growae/reactive'
import {
  type GetMicroBlockErrorType,
  type GetMicroBlockParameters,
  type GetMicroBlockReturnType,
  getMicroBlock,
} from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseMicroBlockParameters = Compute<
  GetMicroBlockParameters & ConfigParameter & { enabled?: boolean }
>

export type UseMicroBlockReturnType = UseQueryReturnType<
  GetMicroBlockReturnType,
  GetMicroBlockErrorType
>

export function useMicroBlock(
  parameters: UseMicroBlockParameters = {} as UseMicroBlockParameters,
): UseMicroBlockReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'microBlock',
      {
        hash: parameters.hash,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      getMicroBlock(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.hash) && (parameters.enabled ?? true),
  }) as UseMicroBlockReturnType
}
