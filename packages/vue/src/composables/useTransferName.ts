import type {
  Compute,
  TransferNameParameters,
  TransferNameReturnType,
} from '@growae/reactive'
import { transferName } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseTransferNameParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: TransferNameReturnType,
        variables: TransferNameParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: TransferNameParameters,
        context: context,
      ) => void
      onSettled?: (
        data: TransferNameReturnType | undefined,
        error: Error | null,
        variables: TransferNameParameters,
        context: context,
      ) => void
    }
  }
>

export type UseTransferNameReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    TransferNameReturnType,
    Error,
    TransferNameParameters,
    context
  > & {
    transferName: (variables: TransferNameParameters) => void
    transferNameAsync: (
      variables: TransferNameParameters,
    ) => Promise<TransferNameReturnType>
  }
>

export function useTransferName<context = unknown>(
  parameters: UseTransferNameParameters<context> = {},
): UseTransferNameReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['transferName'],
    mutationFn: (variables: TransferNameParameters) =>
      transferName(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseTransferNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    transferName: mutation.mutate as Return['transferName'],
    transferNameAsync: mutation.mutateAsync as Return['transferNameAsync'],
  }
}
