import type {
  Compute,
  VerifyMessageErrorType,
  VerifyMessageParameters,
  VerifyMessageReturnType,
} from '@growae/reactive'
import { verifyMessage } from '@growae/reactive'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'

export type UseVerifyMessageParameters = Compute<
  VerifyMessageParameters & ConfigParameter & { enabled?: boolean }
>

export type UseVerifyMessageReturnType = UseQueryReturnType<
  VerifyMessageReturnType,
  VerifyMessageErrorType
>

export function useVerifyMessage(
  parameters: UseVerifyMessageParameters = {} as UseVerifyMessageParameters,
): UseVerifyMessageReturnType {
  const config = useConfig(parameters)

  const options = computed(() => ({
    queryKey: [
      'verifyMessage',
      {
        message: parameters.message,
        signature: parameters.signature,
        address: parameters.address,
      },
    ] as const,
    queryFn: () => verifyMessage(config, parameters),
    enabled:
      Boolean(
        parameters.message && parameters.signature && parameters.address,
      ) &&
      (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseVerifyMessageReturnType
}
