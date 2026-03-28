import {
  type GetAccountErrorType,
  type GetAccountParameters,
  type GetAccountReturnType,
  getAccount,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useActiveAccount } from './useActiveAccount'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseAccountParameters = Accessor<
  Omit<GetAccountParameters, 'address'> & {
    address?: string | undefined
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseAccountReturnType = UseQueryReturnType<
  GetAccountReturnType,
  GetAccountErrorType
>

export function useAccount(
  parameters: UseAccountParameters = () => ({}),
): UseAccountReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))
  const activeAccount = useActiveAccount(parameters)

  const options = createMemo(() => {
    const address = parameters().address ?? activeAccount().address
    return {
      queryKey: [
        'account',
        {
          address,
          networkId: parameters().networkId ?? networkId(),
          height: parameters().height,
          hash: parameters().hash,
        },
      ] as const,
      queryFn: () =>
        getAccount(config(), {
          ...parameters(),
          address: address as string,
          networkId: parameters().networkId ?? networkId(),
        }),
      enabled: Boolean(address) && (parameters().enabled ?? true),
    }
  })

  return useQuery(options) as UseAccountReturnType
}
