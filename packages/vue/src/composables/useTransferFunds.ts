import type {
  Compute,
  TransferFundsErrorType,
  TransferFundsParameters,
  TransferFundsReturnType,
} from '@growae/reactive'
import { transferFunds } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseTransferFundsParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: TransferFundsReturnType,
        variables: TransferFundsParameters,
        context: context,
      ) => void
      onError?: (
        error: TransferFundsErrorType,
        variables: TransferFundsParameters,
        context: context,
      ) => void
      onSettled?: (
        data: TransferFundsReturnType | undefined,
        error: TransferFundsErrorType | null,
        variables: TransferFundsParameters,
        context: context,
      ) => void
    }
  }
>

export type UseTransferFundsReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    TransferFundsReturnType,
    TransferFundsErrorType,
    TransferFundsParameters,
    context
  > & {
    transferFunds: (variables: TransferFundsParameters) => void
    transferFundsAsync: (
      variables: TransferFundsParameters,
    ) => Promise<TransferFundsReturnType>
  }
>

export function useTransferFunds<context = unknown>(
  parameters: UseTransferFundsParameters<context> = {},
): UseTransferFundsReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['transferFunds'],
    mutationFn: (variables: TransferFundsParameters) =>
      transferFunds(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseTransferFundsReturnType<context>
  return {
    ...(mutation as unknown as Return),
    transferFunds: mutation.mutate as Return['transferFunds'],
    transferFundsAsync: mutation.mutateAsync as Return['transferFundsAsync'],
  }
}
