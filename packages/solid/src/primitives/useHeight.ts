import {
  type GetHeightParameters,
  type GetHeightReturnType,
  type GetHeightErrorType,
  getHeight,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseHeightParameters = Accessor<
  GetHeightParameters & {
    config?: import('@reactive/core').Config | undefined
    enabled?: boolean
  }
>

export type UseHeightReturnType = UseQueryReturnType<
  GetHeightReturnType,
  GetHeightErrorType
>

export function useHeight(
  parameters: UseHeightParameters = () => ({}),
): UseHeightReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['height', {
      networkId: parameters().networkId ?? networkId(),
    }] as const,
    queryFn: () => getHeight(config(), {
      networkId: parameters().networkId ?? networkId(),
    }),
    enabled: parameters().enabled ?? true,
  }))

  return useQuery(options) as UseHeightReturnType
}
