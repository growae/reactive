import type {
  Compute,
  WaitForTransactionErrorType,
  WaitForTransactionParameters,
  WaitForTransactionReturnType,
} from '@growae/reactive'
import { waitForTransaction } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

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
    queryKey: [
      'waitForTransaction',
      {
        hash: parameters.hash,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      waitForTransaction(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.hash) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseWaitForTransactionReturnType
}
