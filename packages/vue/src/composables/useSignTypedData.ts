import type {
  Compute,
  SignTypedDataErrorType,
  SignTypedDataParameters,
  SignTypedDataReturnType,
} from '@growae/reactive'
import { signTypedData } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseSignTypedDataParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SignTypedDataReturnType,
        variables: SignTypedDataParameters,
        context: context,
      ) => void
      onError?: (
        error: SignTypedDataErrorType,
        variables: SignTypedDataParameters,
        context: context,
      ) => void
      onSettled?: (
        data: SignTypedDataReturnType | undefined,
        error: SignTypedDataErrorType | null,
        variables: SignTypedDataParameters,
        context: context,
      ) => void
    }
  }
>

export type UseSignTypedDataReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SignTypedDataReturnType,
    SignTypedDataErrorType,
    SignTypedDataParameters,
    context
  > & {
    signTypedData: (variables: SignTypedDataParameters) => void
    signTypedDataAsync: (
      variables: SignTypedDataParameters,
    ) => Promise<SignTypedDataReturnType>
  }
>

export function useSignTypedData<context = unknown>(
  parameters: UseSignTypedDataParameters<context> = {},
): UseSignTypedDataReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['signTypedData'],
    mutationFn: (variables: SignTypedDataParameters) =>
      signTypedData(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseSignTypedDataReturnType<context>
  return {
    ...(mutation as unknown as Return),
    signTypedData: mutation.mutate as Return['signTypedData'],
    signTypedDataAsync: mutation.mutateAsync as Return['signTypedDataAsync'],
  }
}
