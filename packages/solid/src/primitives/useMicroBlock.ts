import {
  type Config,
  type GetMicroBlockErrorType,
  type GetMicroBlockParameters,
  type GetMicroBlockReturnType,
  getMicroBlock,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseMicroBlockParameters = Accessor<
  GetMicroBlockParameters & {
    config?: Config | undefined
    enabled?: boolean
  }
>

export type UseMicroBlockReturnType = UseQueryReturnType<
  GetMicroBlockReturnType,
  GetMicroBlockErrorType
>

export function useMicroBlock(
  parameters: UseMicroBlockParameters = () => ({}) as GetMicroBlockParameters,
): UseMicroBlockReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'microBlock',
      {
        hash: parameters().hash,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      getMicroBlock(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().hash) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseMicroBlockReturnType
}
