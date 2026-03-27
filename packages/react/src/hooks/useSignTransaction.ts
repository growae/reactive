'use client'

import { useMutation } from '@tanstack/react-query'
import {
  type SignTransactionParameters,
  type SignTransactionReturnType,
  type SignTransactionErrorType,
  signTransaction,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseSignTransactionParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: SignTransactionReturnType, variables: SignTransactionParameters, context: context) => void
      onError?: (error: SignTransactionErrorType, variables: SignTransactionParameters, context: context) => void
    }
  }
>

export type UseSignTransactionReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SignTransactionReturnType,
    SignTransactionErrorType,
    SignTransactionParameters,
    context
  > & {
    signTransaction: (variables: SignTransactionParameters) => void
    signTransactionAsync: (variables: SignTransactionParameters) => Promise<SignTransactionReturnType>
  }
>

export function useSignTransaction<context = unknown>(
  parameters: UseSignTransactionParameters<context> = {},
): UseSignTransactionReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['signTransaction'],
    mutationFn: (variables: SignTransactionParameters) =>
      signTransaction(config, variables),
    ...parameters.mutation,
  })

  type Return = UseSignTransactionReturnType<context>
  return {
    ...(mutation as unknown as Return),
    signTransaction: mutation.mutate as Return['signTransaction'],
    signTransactionAsync: mutation.mutateAsync as Return['signTransactionAsync'],
  }
}
