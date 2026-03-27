import type {
  Compute,
  SpendErrorType,
  SpendParameters,
  SpendReturnType,
} from '@growae/reactive'
import { spend } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseSpendParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SpendReturnType,
        variables: SpendParameters,
        context: context,
      ) => void
      onError?: (
        error: SpendErrorType,
        variables: SpendParameters,
        context: context,
      ) => void
      onSettled?: (
        data: SpendReturnType | undefined,
        error: SpendErrorType | null,
        variables: SpendParameters,
        context: context,
      ) => void
    }
  }
>

export type UseSpendReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SpendReturnType,
    SpendErrorType,
    SpendParameters,
    context
  > & {
    spend: (variables: SpendParameters) => void
    spendAsync: (variables: SpendParameters) => Promise<SpendReturnType>
  }
>

export function useSpend<context = unknown>(
  parameters: UseSpendParameters<context> = {},
): UseSpendReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['spend'],
    mutationFn: (variables: SpendParameters) => spend(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseSpendReturnType<context>
  return {
    ...(mutation as unknown as Return),
    spend: mutation.mutate as Return['spend'],
    spendAsync: mutation.mutateAsync as Return['spendAsync'],
  }
}
