import {
  type VerifyMessageParameters,
  type VerifyMessageReturnType,
  type VerifyMessageErrorType,
  verifyMessage,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseVerifyMessageParameters = Accessor<
  VerifyMessageParameters & {
    config?: import('@growae/reactive').Config | undefined
    enabled?: boolean
  }
>

export type UseVerifyMessageReturnType = UseQueryReturnType<
  VerifyMessageReturnType,
  VerifyMessageErrorType
>

export function useVerifyMessage(
  parameters: UseVerifyMessageParameters = () => ({} as VerifyMessageParameters),
): UseVerifyMessageReturnType {
  const config = useConfig(parameters)

  const options = createMemo(() => ({
    queryKey: ['verifyMessage', {
      message: parameters().message,
      signature: parameters().signature,
      address: parameters().address,
    }] as const,
    queryFn: () => verifyMessage(config(), parameters()),
    enabled: Boolean(
      parameters().message && parameters().signature && parameters().address,
    ) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseVerifyMessageReturnType
}
