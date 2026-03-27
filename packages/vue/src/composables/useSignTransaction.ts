import type {
  Compute,
  SignTransactionErrorType,
  SignTransactionParameters,
  SignTransactionReturnType,
} from '@growae/reactive'
import { signTransaction } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseSignTransactionParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SignTransactionReturnType,
        variables: SignTransactionParameters,
        context: context,
      ) => void
      onError?: (
        error: SignTransactionErrorType,
        variables: SignTransactionParameters,
        context: context,
      ) => void
      onSettled?: (
        data: string | undefined,
        error: SignTransactionErrorType | null,
        variables: SignTransactionParameters,
        context: context,
      ) => void
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
    signTransactionAsync: (
      variables: SignTransactionParameters,
    ) => Promise<SignTransactionReturnType>
  }
>

export function useSignTransaction<context = unknown>(
  parameters: UseSignTransactionParameters<context> = {},
): UseSignTransactionReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['signTransaction'],
    mutationFn: (variables: SignTransactionParameters) =>
      signTransaction(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseSignTransactionReturnType<context>
  return {
    ...(mutation as unknown as Return),
    signTransaction: mutation.mutate as Return['signTransaction'],
    signTransactionAsync:
      mutation.mutateAsync as Return['signTransactionAsync'],
  }
}
