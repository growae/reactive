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
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

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
    queryKey: [
      'account',
      {
        address: parameters.address,
        networkId: parameters.networkId ?? networkId.value,
        height: parameters.height,
        hash: parameters.hash,
      },
    ] as const,
    queryFn: () =>
      getAccount(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseAccountReturnType
}
