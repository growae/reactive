import type {
  GetBalanceParameters,
  GetBalanceReturnType,
  GetBalanceErrorType,
  Compute,
} from '@reactive/core'
import { getBalance } from '@reactive/core'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

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
    queryKey: ['balance', {
      address: parameters.address,
      networkId: parameters.networkId ?? networkId.value,
      format: parameters.format,
    }] as const,
    queryFn: () => getBalance(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseBalanceReturnType
}
