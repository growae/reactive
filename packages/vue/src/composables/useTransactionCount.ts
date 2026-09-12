import type {
  Compute,
  GetTransactionCountErrorType,
  GetTransactionCountParameters,
  GetTransactionCountReturnType,
} from '@growae/reactive'
import { getTransactionCount } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseTransactionCountParameters = Compute<
  GetTransactionCountParameters & ConfigParameter & { enabled?: boolean }
>

export type UseTransactionCountReturnType = UseQueryReturnType<
  GetTransactionCountReturnType,
  GetTransactionCountErrorType
>

export function useTransactionCount(
  parameters: UseTransactionCountParameters = {} as UseTransactionCountParameters,
): UseTransactionCountReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'transactionCount',
      {
        address: parameters.address,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      getTransactionCount(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.address) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseTransactionCountReturnType
}
