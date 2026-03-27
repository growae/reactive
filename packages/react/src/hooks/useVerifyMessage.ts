'use client'

import {
  type VerifyMessageParameters,
  type VerifyMessageReturnType,
  type VerifyMessageErrorType,
  verifyMessage,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

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

  return useQuery({
    queryKey: ['verifyMessage', {
      message: parameters.message,
      signature: parameters.signature,
      address: parameters.address,
    }],
    queryFn: () => verifyMessage(config, parameters),
    enabled: Boolean(
      parameters.message && parameters.signature && parameters.address,
    ) && (parameters.enabled ?? true),
  }) as UseVerifyMessageReturnType
}
