import type {
  Compute,
  SendTransactionErrorType,
  SendTransactionParameters,
  SendTransactionReturnType,
} from '@growae/reactive'
import { sendTransaction } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseSendTransactionParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SendTransactionReturnType,
        variables: SendTransactionParameters,
        context: context,
      ) => void
      onError?: (
        error: SendTransactionErrorType,
        variables: SendTransactionParameters,
        context: context,
      ) => void
      onSettled?: (
        data: SendTransactionReturnType | undefined,
        error: SendTransactionErrorType | null,
        variables: SendTransactionParameters,
        context: context,
      ) => void
    }
  }
>

export type UseSendTransactionReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SendTransactionReturnType,
    SendTransactionErrorType,
    SendTransactionParameters,
    context
  > & {
    sendTransaction: (variables: SendTransactionParameters) => void
    sendTransactionAsync: (
      variables: SendTransactionParameters,
    ) => Promise<SendTransactionReturnType>
  }
>

export function useSendTransaction<context = unknown>(
  parameters: UseSendTransactionParameters<context> = {},
): UseSendTransactionReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['sendTransaction'],
    mutationFn: (variables: SendTransactionParameters) =>
      sendTransaction(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseSendTransactionReturnType<context>
  return {
    ...(mutation as unknown as Return),
    sendTransaction: mutation.mutate as Return['sendTransaction'],
    sendTransactionAsync:
      mutation.mutateAsync as Return['sendTransactionAsync'],
  }
}
