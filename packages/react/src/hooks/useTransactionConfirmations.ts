'use client'

import {
  type GetTransactionConfirmationsErrorType,
  getTransactionConfirmations,
} from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseTransactionConfirmationsParameters = ConfigParameter & {
  hash?: string | undefined
  networkId?: string | undefined
  enabled?: boolean | undefined
}
export type UseTransactionConfirmationsReturnType = UseQueryReturnType<
  number,
  GetTransactionConfirmationsErrorType
>

export function useTransactionConfirmations(
  parameters: UseTransactionConfirmationsParameters = {},
): UseTransactionConfirmationsReturnType {
  const config = useConfig(parameters)
  const activeNetwork = useNetworkId({ config })
  const { hash, networkId = activeNetwork, enabled = true } = parameters
  return useQuery<
    number,
    GetTransactionConfirmationsErrorType,
    number,
    readonly unknown[]
  >({
    queryKey: ['transactionConfirmations', { hash, networkId }],
    queryFn: () => {
      if (!hash) throw new Error('A hash is required')
      return getTransactionConfirmations(config, { hash, networkId })
    },
    enabled: Boolean(hash) && enabled,
  })
}
