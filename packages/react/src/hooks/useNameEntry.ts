'use client'

import type { Compute } from '@growae/reactive'
import {
  type GetNameEntryErrorType,
  type GetNameEntryParameters,
  type GetNameEntryReturnType,
  getNameEntry,
} from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseNameEntryParameters = Compute<
  GetNameEntryParameters & ConfigParameter & { enabled?: boolean }
>

export type UseNameEntryReturnType = UseQueryReturnType<
  GetNameEntryReturnType,
  GetNameEntryErrorType
>

export function useNameEntry(
  parameters: UseNameEntryParameters = {} as UseNameEntryParameters,
): UseNameEntryReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  return useQuery({
    queryKey: [
      'nameEntry',
      {
        name: parameters.name,
        networkId: parameters.networkId ?? networkId,
      },
    ],
    queryFn: () =>
      getNameEntry(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(parameters.name) && (parameters.enabled ?? true),
  }) as UseNameEntryReturnType
}
