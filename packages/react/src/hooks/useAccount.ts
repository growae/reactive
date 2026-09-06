'use client'

import type { Compute } from '@growae/reactive'
import {
  type GetAccountErrorType,
  type GetAccountParameters,
  type GetAccountReturnType,
  getAccount,
} from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useActiveAccount } from './useActiveAccount.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseAccountParameters = Compute<
  Omit<GetAccountParameters, 'address'> &
    ConfigParameter & { address?: string | undefined; enabled?: boolean }
>

export type UseAccountReturnType = UseQueryReturnType<
  GetAccountReturnType,
  GetAccountErrorType
>

export function useAccount(
  parameters: UseAccountParameters = {} as UseAccountParameters,
): UseAccountReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })
  const activeAccount = useActiveAccount({ config })

  const address = parameters.address ?? activeAccount.address

  return useQuery({
    queryKey: [
      'account',
      {
        address,
        networkId: parameters.networkId ?? networkId,
        height: parameters.height,
        hash: parameters.hash,
      },
    ],
    queryFn: () =>
      getAccount(config, {
        ...parameters,
        address: address as string,
        networkId: parameters.networkId ?? networkId,
      }),
    enabled: Boolean(address) && (parameters.enabled ?? true),
  }) as UseAccountReturnType
}
