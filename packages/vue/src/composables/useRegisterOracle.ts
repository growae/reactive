import type {
  Compute,
  RegisterOracleParameters,
  RegisterOracleReturnType,
} from '@growae/reactive'
import { registerOracle } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseRegisterOracleParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: RegisterOracleReturnType,
        variables: RegisterOracleParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: RegisterOracleParameters,
        context: context,
      ) => void
      onSettled?: (
        data: RegisterOracleReturnType | undefined,
        error: Error | null,
        variables: RegisterOracleParameters,
        context: context,
      ) => void
    }
  }
>

export type UseRegisterOracleReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    RegisterOracleReturnType,
    Error,
    RegisterOracleParameters,
    context
  > & {
    registerOracle: (variables: RegisterOracleParameters) => void
    registerOracleAsync: (
      variables: RegisterOracleParameters,
    ) => Promise<RegisterOracleReturnType>
  }
>

export function useRegisterOracle<context = unknown>(
  parameters: UseRegisterOracleParameters<context> = {},
): UseRegisterOracleReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['registerOracle'],
    mutationFn: (variables: RegisterOracleParameters) =>
      registerOracle(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseRegisterOracleReturnType<context>
  return {
    ...(mutation as unknown as Return),
    registerOracle: mutation.mutate as Return['registerOracle'],
    registerOracleAsync: mutation.mutateAsync as Return['registerOracleAsync'],
  }
}
