import type {
  GetTransactionParameters,
  GetTransactionReturnType,
  GetTransactionErrorType,
  Compute,
} from '@growae/reactive'
import { getTransaction } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseTransactionParameters = Compute<
  GetTransactionParameters & ConfigParameter & { enabled?: boolean }
>

export type UseTransactionReturnType = UseQueryReturnType<
  GetTransactionReturnType,
  GetTransactionErrorType
>

export function useTransaction(
  parameters: UseTransactionParameters = {} as UseTransactionParameters,
): UseTransactionReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: ['transaction', {
      hash: parameters.hash,
      networkId: parameters.networkId ?? networkId.value,
    }] as const,
    queryFn: () => getTransaction(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: Boolean(parameters.hash) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseTransactionReturnType
}
