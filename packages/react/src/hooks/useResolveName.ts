'use client'

import {
  type ResolveNameParameters,
  type ResolveNameReturnType,
  resolveName,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseResolveNameParameters = Compute<
  ResolveNameParameters & ConfigParameter & { enabled?: boolean }
>

export type UseResolveNameReturnType = UseQueryReturnType<
  ResolveNameReturnType,
  Error
>

export function useResolveName(
  parameters: UseResolveNameParameters = {} as UseResolveNameParameters,
): UseResolveNameReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'resolveName',
      {
        name: parameters.name,
        key: parameters.key,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      resolveName(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.name) && (parameters.enabled ?? true),
  }) as UseResolveNameReturnType
}
