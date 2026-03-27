import type {
  CallContractErrorType,
  CallContractParameters,
  CallContractReturnType,
  Compute,
} from '@growae/reactive'
import { callContract } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseCallContractParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: CallContractReturnType,
        variables: CallContractParameters,
        context: context,
      ) => void
      onError?: (
        error: CallContractErrorType,
        variables: CallContractParameters,
        context: context,
      ) => void
      onSettled?: (
        data: CallContractReturnType | undefined,
        error: CallContractErrorType | null,
        variables: CallContractParameters,
        context: context,
      ) => void
    }
  }
>

export type UseCallContractReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    CallContractReturnType,
    CallContractErrorType,
    CallContractParameters,
    context
  > & {
    callContract: (variables: CallContractParameters) => void
    callContractAsync: (
      variables: CallContractParameters,
    ) => Promise<CallContractReturnType>
  }
>

export function useCallContract<context = unknown>(
  parameters: UseCallContractParameters<context> = {},
): UseCallContractReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['callContract'],
    mutationFn: (variables: CallContractParameters) =>
      callContract(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseCallContractReturnType<context>
  return {
    ...(mutation as unknown as Return),
    callContract: mutation.mutate as Return['callContract'],
    callContractAsync: mutation.mutateAsync as Return['callContractAsync'],
  }
}
