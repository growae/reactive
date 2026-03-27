'use client'

import {
  type SignMessageErrorType,
  type SignMessageParameters,
  type SignMessageReturnType,
  signMessage,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseSignMessageParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SignMessageReturnType,
        variables: SignMessageParameters,
        context: context,
      ) => void
      onError?: (
        error: SignMessageErrorType,
        variables: SignMessageParameters,
        context: context,
      ) => void
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
    signMessageAsync: (
      variables: SignMessageParameters,
    ) => Promise<SignMessageReturnType>
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
  } as any)

  type Return = UseSignMessageReturnType<context>
  return {
    ...(mutation as unknown as Return),
    signMessage: mutation.mutate as unknown as Return['signMessage'],
    signMessageAsync:
      mutation.mutateAsync as unknown as Return['signMessageAsync'],
  }
}
