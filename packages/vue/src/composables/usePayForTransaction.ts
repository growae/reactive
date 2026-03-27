import type {
  Compute,
  PayForTransactionErrorType,
  PayForTransactionParameters,
  PayForTransactionReturnType,
} from '@growae/reactive'
import { payForTransaction } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
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
      onSettled?: (
        data: PayForTransactionReturnType | undefined,
        error: PayForTransactionErrorType | null,
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

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['payForTransaction'],
    mutationFn: (variables: PayForTransactionParameters) =>
      payForTransaction(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
    }),
  })

  type Return = UsePayForTransactionReturnType<context>
  return {
    ...(mutation as unknown as Return),
    payForTransaction: mutation.mutate as Return['payForTransaction'],
    payForTransactionAsync:
      mutation.mutateAsync as Return['payForTransactionAsync'],
  }
}
