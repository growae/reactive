import {
  type GetBlockParameters,
  type GetBlockReturnType,
  type GetBlockErrorType,
  getBlock,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseBlockParameters = Accessor<
  GetBlockParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseBlockReturnType = UseQueryReturnType<
  GetBlockReturnType,
  GetBlockErrorType
>

export function useBlock(
  parameters: UseBlockParameters = () => ({}),
): UseBlockReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['block', {
      height: parameters().height,
      hash: parameters().hash,
      networkId: parameters().networkId ?? networkId(),
    }] as const,
    queryFn: () => getBlock(config(), {
      ...parameters(),
      networkId: parameters().networkId ?? networkId(),
    }),
    enabled: parameters().enabled ?? true,
  }))

  return useQuery(options) as UseBlockReturnType
}
