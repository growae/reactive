import type {
  Compute,
  SignTypedDataErrorType,
  SignTypedDataParameters,
  SignTypedDataReturnType,
} from '@growae/reactive'
import { signTypedData } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

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

  const mutation = useMutation({
    mutationKey: ['signTypedData'],
    mutationFn: (variables: SignTypedDataParameters) =>
      signTypedData(config, variables),
    ...parameters.mutation,
  })

  type Return = UseSignTypedDataReturnType<context>
  return {
    ...(mutation as unknown as Return),
    signTypedData: mutation.mutate as Return['signTypedData'],
    signTypedDataAsync: mutation.mutateAsync as Return['signTypedDataAsync'],
  }
}
