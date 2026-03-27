'use client'

import { useMutation } from '@tanstack/react-query'
import {
  type SignMessageParameters,
  type SignMessageReturnType,
  type SignMessageErrorType,
  signMessage,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseSignMessageParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: SignMessageReturnType, variables: SignMessageParameters, context: context) => void
      onError?: (error: SignMessageErrorType, variables: SignMessageParameters, context: context) => void
    }
  }
>

export type UseSignMessageReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SignMessageReturnType,
    SignMessageErrorType,
    SignMessageParameters,
    context
  > & {
    signMessage: (variables: SignMessageParameters) => void
    signMessageAsync: (variables: SignMessageParameters) => Promise<SignMessageReturnType>
  }
>

export function useSignMessage<context = unknown>(
  parameters: UseSignMessageParameters<context> = {},
): UseSignMessageReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['signMessage'],
    mutationFn: (variables: SignMessageParameters) =>
      signMessage(config, variables),
    ...parameters.mutation,
  })

  type Return = UseSignMessageReturnType<context>
  return {
    ...(mutation as unknown as Return),
    signMessage: mutation.mutate as Return['signMessage'],
    signMessageAsync: mutation.mutateAsync as Return['signMessageAsync'],
  }
}
