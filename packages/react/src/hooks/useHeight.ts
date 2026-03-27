'use client'

import {
  type GetHeightErrorType,
  type GetHeightParameters,
  type GetHeightReturnType,
  getHeight,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseHeightParameters = Compute<
  GetHeightParameters & ConfigParameter & { enabled?: boolean }
>

export type UseHeightReturnType = UseQueryReturnType<
  GetHeightReturnType,
  GetHeightErrorType
>

export function useHeight(
  parameters: UseHeightParameters = {},
): UseHeightReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'height',
      {
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      getHeight(config, {
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: parameters.enabled ?? true,
  }) as UseHeightReturnType
}
