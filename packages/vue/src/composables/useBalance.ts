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
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseBalanceParameters = Compute<
  GetBalanceParameters & ConfigParameter & { enabled?: boolean }
>

export type UseBalanceReturnType = UseQueryReturnType<
  GetBalanceReturnType,
  GetBalanceErrorType
>

export function useBalance(
  parameters: UseBalanceParameters = {} as UseBalanceParameters,
): UseBalanceReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'balance',
      {
        address: parameters.address,
        networkId: parameters.networkId ?? networkId.value,
        format: parameters.format,
      },
    ] as const,
    queryFn: () =>
      getBalance(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseBalanceReturnType
}
