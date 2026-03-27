'use client'

import {
  type VerifyMessageErrorType,
  type VerifyMessageParameters,
  type VerifyMessageReturnType,
  verifyMessage,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
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
    queryKey: [
      'verifyMessage',
      {
        message: parameters.message,
        signature: parameters.signature,
        address: parameters.address,
      },
    ],
    queryFn: () => verifyMessage(config, parameters),
    enabled:
      Boolean(
        parameters.message && parameters.signature && parameters.address,
      ) &&
      (parameters.enabled ?? true),
  }) as UseVerifyMessageReturnType
}
