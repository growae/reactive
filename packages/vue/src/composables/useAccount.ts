import type {
  GetAccountParameters,
  GetAccountReturnType,
  GetAccountErrorType,
  Compute,
} from '@reactive/core'
import { getAccount } from '@reactive/core'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseAccountParameters = Compute<
  GetAccountParameters & ConfigParameter & { enabled?: boolean }
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

  const options = computed(() => ({
    queryKey: ['account', {
      address: parameters.address,
      networkId: parameters.networkId ?? networkId.value,
      height: parameters.height,
      hash: parameters.hash,
    }] as const,
    queryFn: () => getAccount(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseAccountReturnType
}
