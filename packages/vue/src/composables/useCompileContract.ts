import type {
  CompileContractErrorType,
  CompileContractParameters,
  CompileContractReturnType,
  Compute,
} from '@growae/reactive'
import { compileContract } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseCompileContractParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: CompileContractReturnType,
        variables: CompileContractParameters,
        context: context,
      ) => void
      onError?: (
        error: CompileContractErrorType,
        variables: CompileContractParameters,
        context: context,
      ) => void
      onSettled?: (
        data: CompileContractReturnType | undefined,
        error: CompileContractErrorType | null,
        variables: CompileContractParameters,
        context: context,
      ) => void
    }
  }
>

export type UseCompileContractReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    CompileContractReturnType,
    CompileContractErrorType,
    CompileContractParameters,
    context
  > & {
    compileContract: (variables: CompileContractParameters) => void
    compileContractAsync: (
      variables: CompileContractParameters,
    ) => Promise<CompileContractReturnType>
  }
>

export function useCompileContract<context = unknown>(
  parameters: UseCompileContractParameters<context> = {},
): UseCompileContractReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['compileContract'],
    mutationFn: (variables: CompileContractParameters) =>
      compileContract(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseCompileContractReturnType<context>
  return {
    ...(mutation as unknown as Return),
    compileContract: mutation.mutate as Return['compileContract'],
    compileContractAsync:
      mutation.mutateAsync as Return['compileContractAsync'],
  }
}
