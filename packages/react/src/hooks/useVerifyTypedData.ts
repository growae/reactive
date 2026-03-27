'use client'

import {
  type VerifyTypedDataErrorType,
  type VerifyTypedDataParameters,
  type VerifyTypedDataReturnType,
  verifyTypedData,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'

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

  return useQuery({
    queryKey: [
      'verifyTypedData',
      {
        data: parameters.data,
        signature: parameters.signature,
        address: parameters.address,
      },
    ],
    queryFn: () => verifyTypedData(config, parameters),
    enabled:
      Boolean(parameters.data && parameters.signature && parameters.address) &&
      (parameters.enabled ?? true),
  }) as UseVerifyTypedDataReturnType
}
