'use client'

import {
  type GetMicroBlockTransactionCountErrorType,
  getMicroBlockTransactionCount,
} from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseMicroBlockTransactionCountParameters = ConfigParameter & {
  hash?: string | undefined
  networkId?: string | undefined
  enabled?: boolean | undefined
}
export type UseMicroBlockTransactionCountReturnType = UseQueryReturnType<
  number,
  GetMicroBlockTransactionCountErrorType
>

export function useMicroBlockTransactionCount(
  parameters: UseMicroBlockTransactionCountParameters = {},
): UseMicroBlockTransactionCountReturnType {
  const config = useConfig(parameters)
  const activeNetwork = useNetworkId({ config })
  const { hash, networkId = activeNetwork, enabled = true } = parameters
  return useQuery<
    number,
    GetMicroBlockTransactionCountErrorType,
    number,
    readonly unknown[]
  >({
    queryKey: ['microBlockTransactionCount', { hash, networkId }],
    queryFn: () => {
      if (!hash) throw new Error('A hash is required')
      return getMicroBlockTransactionCount(config, { hash, networkId })
    },
    enabled: Boolean(hash) && enabled,
  })
}
