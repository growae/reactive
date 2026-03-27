import {
  type GetAccountParameters,
  type GetAccountReturnType,
  type GetAccountErrorType,
  getAccount,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseAccountParameters = Accessor<
  GetAccountParameters & {
    config?: import('@reactive/core').Config | undefined
    enabled?: boolean
  }
>

export type UseAccountReturnType = UseQueryReturnType<
  GetAccountReturnType,
  GetAccountErrorType
>

export function useAccount(
  parameters: UseAccountParameters = () => ({} as GetAccountParameters),
): UseAccountReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: ['account', {
      address: parameters().address,
      networkId: parameters().networkId ?? networkId(),
      height: parameters().height,
      hash: parameters().hash,
    }] as const,
    queryFn: () => getAccount(config(), {
      ...parameters(),
      networkId: parameters().networkId ?? networkId(),
    }),
    enabled: Boolean(parameters().address) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseAccountReturnType
}
