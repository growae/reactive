import type {
  Compute,
  GetBalanceErrorType,
  GetBalanceParameters,
  GetBalanceReturnType,
} from '@growae/reactive'
import { getBalance } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useActiveAccount } from './useActiveAccount'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseBalanceParameters = Compute<
  Omit<GetBalanceParameters, 'address'> & {
    address?: string | undefined
  } & ConfigParameter & { enabled?: boolean }
>

export type UseBalanceReturnType = UseQueryReturnType<
  GetBalanceReturnType,
  GetBalanceErrorType
>

export function useBalance(
  parameters: UseBalanceParameters = {},
): UseBalanceReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })
  const activeAccount = useActiveAccount({ config })
  const address = computed(
    () => parameters.address ?? activeAccount.value.address,
  )

  const options = computed(() => ({
    queryKey: [
      'balance',
      {
        address: address.value,
        networkId: parameters.networkId ?? networkId.value,
        format: parameters.format,
      },
    ] as const,
    queryFn: () =>
      getBalance(config, {
        ...parameters,
        address: address.value as string,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(address.value) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseBalanceReturnType
}
