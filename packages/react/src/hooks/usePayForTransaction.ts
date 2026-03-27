'use client'

import {
  type PayForTransactionErrorType,
  type PayForTransactionParameters,
  type PayForTransactionReturnType,
  payForTransaction,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UsePayForTransactionParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: PayForTransactionReturnType,
        variables: PayForTransactionParameters,
        context: context,
      ) => void
      onError?: (
        error: PayForTransactionErrorType,
        variables: PayForTransactionParameters,
        context: context,
      ) => void
    }
  }
>

export type UsePayForTransactionReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    PayForTransactionReturnType,
    PayForTransactionErrorType,
    PayForTransactionParameters,
    context
  > & {
    payForTransaction: (variables: PayForTransactionParameters) => void
    payForTransactionAsync: (
      variables: PayForTransactionParameters,
    ) => Promise<PayForTransactionReturnType>
  }
>

export function usePayForTransaction<context = unknown>(
  parameters: UsePayForTransactionParameters<context> = {},
): UsePayForTransactionReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['payForTransaction'],
    mutationFn: (variables: PayForTransactionParameters) =>
      payForTransaction(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UsePayForTransactionReturnType<context>
  return {
    ...(mutation as unknown as Return),
    payForTransaction: mutation.mutate as unknown as Return['payForTransaction'],
    payForTransactionAsync:
      mutation.mutateAsync as unknown as Return['payForTransactionAsync'],
  }
}
