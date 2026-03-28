'use client'

import {
  type SignDelegationErrorType,
  type SignDelegationParameters,
  type SignDelegationReturnType,
  signDelegation,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseSignDelegationParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SignDelegationReturnType,
        variables: SignDelegationParameters,
        context: context,
      ) => void
      onError?: (
        error: SignDelegationErrorType,
        variables: SignDelegationParameters,
        context: context,
      ) => void
    }
  }
>

export type UseSignDelegationReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SignDelegationReturnType,
    SignDelegationErrorType,
    SignDelegationParameters,
    context
  > & {
    signDelegation: (variables: SignDelegationParameters) => void
    signDelegationAsync: (
      variables: SignDelegationParameters,
    ) => Promise<SignDelegationReturnType>
  }
>

export function useSignDelegation<context = unknown>(
  parameters: UseSignDelegationParameters<context> = {},
): UseSignDelegationReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['signDelegation'],
    mutationFn: (variables: SignDelegationParameters) =>
      signDelegation(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseSignDelegationReturnType<context>
  return {
    ...(mutation as unknown as Return),
    signDelegation: mutation.mutate as unknown as Return['signDelegation'],
    signDelegationAsync:
      mutation.mutateAsync as unknown as Return['signDelegationAsync'],
  }
}
