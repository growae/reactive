import type {
  Compute,
  WaitForTransactionConfirmErrorType,
  WaitForTransactionConfirmParameters,
  WaitForTransactionConfirmReturnType,
} from '@growae/reactive'
import { waitForTransactionConfirm } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseWaitForTransactionConfirmParameters = Compute<
  WaitForTransactionConfirmParameters & ConfigParameter & { enabled?: boolean }
>

export type UseWaitForTransactionConfirmReturnType = UseQueryReturnType<
  WaitForTransactionConfirmReturnType,
  WaitForTransactionConfirmErrorType
>

export function useWaitForTransactionConfirm(
  parameters: UseWaitForTransactionConfirmParameters = {} as UseWaitForTransactionConfirmParameters,
): UseWaitForTransactionConfirmReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId({ config })

  const options = computed(() => ({
    queryKey: [
      'waitForTransactionConfirm',
      {
        hash: parameters.hash,
        networkId: parameters.networkId ?? networkId.value,
      },
    ] as const,
    queryFn: () =>
      waitForTransactionConfirm(config, {
        ...parameters,
        networkId: parameters.networkId ?? networkId.value,
      }),
    enabled: Boolean(parameters.hash) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseWaitForTransactionConfirmReturnType
}
