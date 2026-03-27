import type {
  VerifyTypedDataParameters,
  VerifyTypedDataReturnType,
  VerifyTypedDataErrorType,
  Compute,
} from '@reactive/core'
import { verifyTypedData } from '@reactive/core'
import { computed } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseVerifyTypedDataParameters = Compute<
  VerifyTypedDataParameters & ConfigParameter & { enabled?: boolean }
>

export type UseVerifyTypedDataReturnType = UseQueryReturnType<
  VerifyTypedDataReturnType,
  VerifyTypedDataErrorType
>

export function useVerifyTypedData(
  parameters: UseVerifyTypedDataParameters = {} as UseVerifyTypedDataParameters,
): UseVerifyTypedDataReturnType {
  const config = useConfig(parameters)

  const options = computed(() => ({
    queryKey: ['verifyTypedData', {
      data: parameters.data,
      signature: parameters.signature,
      address: parameters.address,
    }] as const,
    queryFn: () => verifyTypedData(config, parameters),
    enabled: Boolean(
      parameters.data && parameters.signature && parameters.address,
    ) && (parameters.enabled ?? true),
  }))

  return useQuery(options) as UseVerifyTypedDataReturnType
}
