import type {
  Compute,
  GetAccountErrorType,
  GetAccountParameters,
  GetAccountReturnType,
} from '@growae/reactive'
import { getAccount } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useActiveAccount } from './useActiveAccount'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseAccountParameters = Compute<
  Omit<GetAccountParameters, 'address'> & {
    address?: string | undefined
  } & ConfigParameter & { enabled?: boolean }
>

export type UseAccountReturnType = UseQueryReturnType<
  GetAccountReturnType,
  GetAccountErrorType
>

export function useAccount(
  parameters: UseAccountParameters = {},
): UseAccountReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })
  const activeAccount = useActiveAccount({ config })
  const address = computed(
    () => parameters.address ?? activeAccount.value.address,
  )

  const options = computed(() => ({
    queryKey: [
      'account',
      {
        address: address.value,
        networkId: parameters.networkId ?? networkId.value,
        height: parameters.height,
        hash: parameters.hash,
      },
    ] as const,
    queryFn: () =>
      getAccount(config, {
        ...parameters,
        address: address.value as string,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(address.value) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseAccountReturnType
}
