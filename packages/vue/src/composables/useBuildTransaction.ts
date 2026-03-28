import type {
  BuildTransactionErrorType,
  BuildTransactionParameters,
  BuildTransactionReturnType,
  Compute,
} from '@growae/reactive'
import { buildTransaction } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
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
      onSettled?: (
        data: BuildTransactionReturnType | undefined,
        error: BuildTransactionErrorType | null,
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

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['buildTransaction'],
    mutationFn: (variables: BuildTransactionParameters) =>
      buildTransaction(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseBuildTransactionReturnType<context>
  return {
    ...(mutation as unknown as Return),
    buildTransaction: mutation.mutate as Return['buildTransaction'],
    buildTransactionAsync:
      mutation.mutateAsync as Return['buildTransactionAsync'],
  }
}
