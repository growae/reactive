import { useMutation } from '@tanstack/vue-query'
import type {
  SendTransactionParameters,
  SendTransactionReturnType,
  SendTransactionErrorType,
  Compute,
} from '@growae/reactive'
import { sendTransaction } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseSendTransactionParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: SendTransactionReturnType, variables: SendTransactionParameters, context: context) => void
      onError?: (error: SendTransactionErrorType, variables: SendTransactionParameters, context: context) => void
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
    sendTransactionAsync: (variables: SendTransactionParameters) => Promise<SendTransactionReturnType>
  }
>

export function useSendTransaction<context = unknown>(
  parameters: UseSendTransactionParameters<context> = {},
): UseSendTransactionReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['sendTransaction'],
    mutationFn: (variables: SendTransactionParameters) =>
      sendTransaction(config, variables),
    ...parameters.mutation,
  })

  type Return = UseSendTransactionReturnType<context>
  return {
    ...(mutation as unknown as Return),
    sendTransaction: mutation.mutate as Return['sendTransaction'],
    sendTransactionAsync: mutation.mutateAsync as Return['sendTransactionAsync'],
  }
}
