'use client'

import {
  type BuildTransactionErrorType,
  type BuildTransactionParameters,
  type BuildTransactionReturnType,
  buildTransaction,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseBuildTransactionParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: BuildTransactionReturnType,
        variables: BuildTransactionParameters,
        context: context,
      ) => void
      onError?: (
        error: BuildTransactionErrorType,
        variables: BuildTransactionParameters,
        context: context,
      ) => void
    }
  }
>

export type UseBuildTransactionReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    BuildTransactionReturnType,
    BuildTransactionErrorType,
    BuildTransactionParameters,
    context
  > & {
    buildTransaction: (variables: BuildTransactionParameters) => void
    buildTransactionAsync: (
      variables: BuildTransactionParameters,
    ) => Promise<BuildTransactionReturnType>
  }
>

export function useBuildTransaction<context = unknown>(
  parameters: UseBuildTransactionParameters<context> = {},
): UseBuildTransactionReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['buildTransaction'],
    mutationFn: (variables: BuildTransactionParameters) =>
      buildTransaction(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseBuildTransactionReturnType<context>
  return {
    ...(mutation as unknown as Return),
    buildTransaction: mutation.mutate as unknown as Return['buildTransaction'],
    buildTransactionAsync:
      mutation.mutateAsync as unknown as Return['buildTransactionAsync'],
  }
}
