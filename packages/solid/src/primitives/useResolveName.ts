import {
  type ResolveNameParameters,
  type ResolveNameReturnType,
  resolveName,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseResolveNameParameters = Accessor<
  ResolveNameParameters & {
    config?: import('@reactive/core').Config | undefined
    enabled?: boolean
  }
>

export type UseResolveNameReturnType = UseQueryReturnType<
  ResolveNameReturnType,
  Error
>

export function useResolveName(
  parameters: UseResolveNameParameters = () => ({} as ResolveNameParameters),
): UseResolveNameReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['resolveName', {
      name: parameters().name,
      key: parameters().key,
      networkId: parameters().networkId ?? networkId(),
    }] as const,
    queryFn: () => resolveName(config(), {
      ...parameters(),
      networkId: parameters().networkId ?? networkId(),
    }),
    enabled: Boolean(parameters().name) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseResolveNameReturnType
}
