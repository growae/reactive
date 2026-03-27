import type {
  WaitForTransactionParameters,
  WaitForTransactionReturnType,
  WaitForTransactionErrorType,
  Compute,
} from '@reactive/core'
import { waitForTransaction } from '@reactive/core'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseWaitForTransactionParameters = Compute<
  WaitForTransactionParameters & ConfigParameter & { enabled?: boolean }
>

export type UseWaitForTransactionReturnType = UseQueryReturnType<
  WaitForTransactionReturnType,
  WaitForTransactionErrorType
>

export function useWaitForTransaction(
  parameters: UseWaitForTransactionParameters = {} as UseWaitForTransactionParameters,
): UseWaitForTransactionReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: ['waitForTransaction', {
      hash: parameters.hash,
      networkId: parameters.networkId ?? networkId.value,
    }] as const,
    queryFn: () => waitForTransaction(config, {
      ...parameters,
      networkId: parameters.networkId ?? networkId.value,
    }),
    enabled: Boolean(parameters.hash) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseWaitForTransactionReturnType
}
