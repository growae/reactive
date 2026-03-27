'use client'

import {
  type ResolveNameParameters,
  type ResolveNameReturnType,
  resolveName,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

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
    queryKey: ['resolveName', {
      name: parameters.name,
      key: parameters.key,
      networkId: parameters.networkId ?? networkId,
    }],
    queryFn: () => resolveName(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId,
    }),
    enabled: Boolean(parameters.name) && (parameters.enabled ?? true),
  }) as UseResolveNameReturnType
}
